/**
 * Trip クエリ共通ヘルパー
 *
 * My Shares / My Guides など、ユーザー所有の Trip を取得する際の
 * 後方互換性対応（auth_uid / google_id）を共通化
 */

import { adminDb } from "@/lib/firebase/admin";
import { adminUserOperations } from "@/lib/firebase/admin-operation";
import { COLLECTIONS } from "@/lib/firebase/firestore";
import type { Trip, TripSocialStats } from "@/lib/core/types";
import logger from "@/lib/core/logger";
import type { Firestore } from "firebase-admin/firestore";

/**
 * ユーザー所有の Trip を取得するためのクエリ条件
 */
export interface UserTripQueryOptions {
	userId: string;
	firestore?: Firestore;
	additionalFilters?: {
		isTemplate?: boolean;
		accessLevel?: string | string[];
	};
	limit?: number;
	orderBy?: {
		field: string;
		direction: "asc" | "desc";
	};
}

/**
 * ユーザー所有の Trip を取得（後方互換性対応）
 *
 * auth_uid と google_id の両方でクエリを実行してマージ
 */
export async function getUserTripsWithBackwardCompatibility(
	options: UserTripQueryOptions,
): Promise<{
	trips: Trip[];
	lastDoc: FirebaseFirestore.QueryDocumentSnapshot | null;
}> {
	const { userId, firestore, additionalFilters, limit = 20, orderBy } = options;
	const db = firestore || adminDb;

	// ユーザー情報を取得して google_id と users ドキュメントIDを確認
	const user = await adminUserOperations.getUserByAuthUid(userId);

	// ownerIds に含めるIDのリスト
	// 1. users ドキュメントID（優先、trip.user_id はこれを使用）
	// 2. Firebase Auth UID（後方互換性）
	// 3. google_id（後方互換性）
	const ownerIds: string[] = [];
	if (user) {
		// users ドキュメントIDを優先的に追加
		if (user.id) {
			ownerIds.push(user.id);
		}
		// Firebase Auth UID が users ドキュメントIDと異なる場合のみ追加
		if (userId && userId !== user.id) {
			ownerIds.push(userId);
		}
		// google_id が users ドキュメントIDと異なる場合のみ追加
		if (
			user.google_id &&
			user.google_id !== user.id &&
			user.google_id !== userId
		) {
			ownerIds.push(user.google_id);
		}
	} else {
		// ユーザーが見つからない場合は userId のみを使用
		ownerIds.push(userId);
	}

	logger.debug("User trip query params", {
		userId,
		userDocumentId: user?.id,
		userGoogleId: user?.google_id,
		ownerIds,
		additionalFilters,
		limit,
	});

	// 各 user_id で個別にクエリを実行してマージ
	const queryPromises = ownerIds.map(async (ownerId) => {
		let query: FirebaseFirestore.Query = db
			.collection(COLLECTIONS.TRIPS)
			.where("user_id", "==", ownerId);

		// 追加フィルタ
		if (additionalFilters?.isTemplate !== undefined) {
			query = query.where("is_template", "==", additionalFilters.isTemplate);
		}

		// access_level フィルタ（単一値の場合）
		if (
			additionalFilters?.accessLevel &&
			typeof additionalFilters.accessLevel === "string"
		) {
			query = query.where("access_level", "==", additionalFilters.accessLevel);
		}

		// orderBy（インデックスが必要な場合は一旦外す）
		// TODO: インデックス作成後に orderBy を復活させる
		// if (orderBy) {
		//   query = query.orderBy(orderBy.field, orderBy.direction)
		// }

		query = query.limit(limit * 2); // マージ後に減る可能性があるため多めに取得

		const snapshot = await query.get();
		return snapshot.docs;
	});

	const allDocs = await Promise.all(queryPromises);
	const mergedDocs = allDocs.flat();

	// 重複除去（同じ Trip ID が複数回取得される可能性があるため）
	const uniqueDocs = mergedDocs.reduce((acc, doc) => {
		if (!acc.find((d) => d.id === doc.id)) {
			acc.push(doc);
		}
		return acc;
	}, [] as FirebaseFirestore.QueryDocumentSnapshot[]);

	// クライアント側でソート（orderBy がないため）
	if (orderBy) {
		uniqueDocs.sort((a, b) => {
			const aValue = a.data()[orderBy.field];
			const bValue = b.data()[orderBy.field];
			if (!aValue || !bValue) return 0;
			const aDate =
				aValue instanceof Date
					? aValue.getTime()
					: new Date(aValue as any).getTime();
			const bDate =
				bValue instanceof Date
					? bValue.getTime()
					: new Date(bValue as any).getTime();
			return orderBy.direction === "desc" ? bDate - aDate : aDate - bDate;
		});
	}

	// limit に合わせて切り詰める
	const limitedDocs = uniqueDocs.slice(0, limit);
	const lastDoc = limitedDocs[limitedDocs.length - 1] || null;

	// Trip オブジェクトに変換
	const trips: Trip[] = limitedDocs.map((doc) => {
		const data = doc.data() as Trip;
		const socialStats: TripSocialStats = data.social_stats ?? {
			likes_count: 0,
			comments_count: 0,
			shares_count: 0,
			views_count: 0,
			replicas_count: 0,
		};

		// stats のデフォルト値を埋める（UI 壊れ防止）
		const stats = {
			days: data.stats?.days ?? 0,
			itineraries: data.stats?.itineraries ?? 0,
			photos: data.stats?.photos ?? 0,
			checklists: data.stats?.checklists ?? 0,
		};

		return {
			id: doc.id,
			...data,
			social_stats: socialStats,
			stats,
		} as Trip;
	});

	logger.debug("User trip query result", {
		totalDocs: mergedDocs.length,
		uniqueDocs: uniqueDocs.length,
		afterLimit: trips.length,
	});

	return { trips, lastDoc };
}

/**
 * エンコードされたカーソルを生成
 *
 * @param doc Firestore DocumentSnapshot
 * @returns エンコードされたカーソル文字列
 */
export function encodeCursor(
	doc: FirebaseFirestore.QueryDocumentSnapshot,
): string {
	const data = doc.data();
	const updatedAt = data.updated_at;
	const timestamp =
		updatedAt instanceof Date
			? updatedAt.getTime()
			: updatedAt?._seconds
				? updatedAt._seconds * 1000
				: Date.now();

	const cursorData = `${timestamp}_${doc.id}`;
	return Buffer.from(cursorData).toString("base64");
}

/**
 * エンコードされたカーソルをデコード
 *
 * @param encodedCursor エンコードされたカーソル文字列
 * @returns { timestamp: number, docId: string } | null
 */
export function decodeCursor(
	encodedCursor: string,
): { timestamp: number; docId: string } | null {
	try {
		const decoded = Buffer.from(encodedCursor, "base64").toString("utf-8");
		const [timestamp, docId] = decoded.split("_");
		if (!timestamp || !docId) return null;
		return {
			timestamp: parseInt(timestamp, 10),
			docId,
		};
	} catch {
		return null;
	}
}
