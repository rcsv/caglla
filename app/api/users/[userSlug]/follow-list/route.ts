/**
 * User Follow List API Routes
 *
 * Phase 1: API エンドポイントの実装（v3.1.0）
 *
 * フォロワー・フォロー中統合API
 * - GET: フォロワー・フォロー中一覧を取得（ページネーション対応、N+1対策）
 */

import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/core/logger";
import { getFollowingList, getFollowersList } from "@/lib/social/user-follows";
import { COLLECTIONS } from "@/lib/firebase/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { convertStandardDates } from "@/lib/firebase/timestamp-utils";
import type { User } from "@/lib/core/types";
import {
	unauthorized,
	notFound,
	badRequest,
	handleApiError,
} from "@/lib/core/error-handler";

/**
 * adminAuthをlazy importします（テスト環境でも動作するように）
 */
async function getAdminAuth() {
	try {
		const adminModule = await import("@/lib/firebase/admin");
		return adminModule.adminAuth;
	} catch (error) {
		throw new Error("Firebase Admin SDK is not available");
	}
}

/**
 * リクエストからユーザーIDを取得します（テスト環境ではモックトークンを処理）
 */
async function resolveAuthUserId(request: NextRequest): Promise<string | null> {
	const authHeader = request.headers.get("authorization");
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return null;
	}

	const idToken = authHeader.split("Bearer ")[1];
	if (!idToken) return null;

	// テスト環境ではモックトークンを処理
	if (process.env.FIRESTORE_EMULATOR_HOST) {
		if (idToken.startsWith("mock-token-")) {
			return idToken.replace("mock-token-", "");
		}
	}

	try {
		const adminAuth = await getAdminAuth();
		const decoded = await adminAuth.verifyIdToken(idToken);
		return decoded.uid;
	} catch (error) {
		logger.warn("Failed to verify ID token for follow-list endpoint", error);
		return null;
	}
}

/**
 * ユーザースラッグからユーザーIDを解決します
 */
async function resolveUserIdFromSlug(
	userSlug: string,
): Promise<{ userId: string; userDocId: string } | null> {
	try {
		const usersSnapshot = await adminDb
			.collection(COLLECTIONS.USERS)
			.where("slug", "==", userSlug)
			.limit(1)
			.get();

		if (usersSnapshot.empty) {
			return null;
		}

		const userDoc = usersSnapshot.docs[0];
		const userData = convertStandardDates({
			id: userDoc.id,
			...userDoc.data(),
		}) as User;

		// google_id または document ID を返す
		const userId = userData.google_id || userData.auth_uid || userDoc.id;
		return { userId, userDocId: userDoc.id };
	} catch (error) {
		logger.error("Failed to resolve userId from slug", error);
		return null;
	}
}

/**
 * 現在のユーザーが指定されたユーザーリストをフォローしているかどうかを一括取得（N+1対策）
 */
async function getIsFollowingBatch(
	currentUserId: string,
	targetUserIds: string[],
): Promise<Set<string>> {
	if (targetUserIds.length === 0) {
		return new Set();
	}

	try {
		// Firestoreの'in'クエリは最大10件までなので、チャンクに分割
		const chunkSize = 10;
		const chunks: string[][] = [];
		for (let i = 0; i < targetUserIds.length; i += chunkSize) {
			chunks.push(targetUserIds.slice(i, i + chunkSize));
		}

		const followingSet = new Set<string>();

		// 各チャンクを並列処理
		await Promise.all(
			chunks.map(async (chunk) => {
				// 現在のユーザーがフォローしているユーザーIDのリストを取得
				const followsSnapshot = await adminDb
					.collection(COLLECTIONS.USER_FOLLOWS)
					.where("follower_id", "==", currentUserId)
					.where("following_id", "in", chunk)
					.get();

				followsSnapshot.docs.forEach((doc) => {
					const data = doc.data();
					if (data.following_id) {
						followingSet.add(data.following_id);
					}
				});
			}),
		);

		return followingSet;
	} catch (error) {
		logger.error("Failed to get isFollowing batch", error);
		return new Set();
	}
}

/**
 * ユーザーIDのリストからユーザー情報を一括取得
 */
async function getUsersByIds(userIds: string[]): Promise<Map<string, User>> {
	if (userIds.length === 0) {
		return new Map();
	}

	try {
		// Firestoreの'in'クエリは最大10件までなので、チャンクに分割
		const chunkSize = 10;
		const chunks: string[][] = [];
		for (let i = 0; i < userIds.length; i += chunkSize) {
			chunks.push(userIds.slice(i, i + chunkSize));
		}

		const userMap = new Map<string, User>();

		// 各チャンクを並列処理
		await Promise.all(
			chunks.map(async (chunk) => {
				// google_id または auth_uid で検索
				const queries = await Promise.all([
					adminDb
						.collection(COLLECTIONS.USERS)
						.where("google_id", "in", chunk)
						.get(),
					adminDb
						.collection(COLLECTIONS.USERS)
						.where("auth_uid", "in", chunk)
						.get(),
				]);

				queries.forEach((snapshot) => {
					snapshot.docs.forEach((doc) => {
						const userData = convertStandardDates({
							id: doc.id,
							...doc.data(),
						}) as User;
						const userId = userData.google_id || userData.auth_uid || doc.id;
						userMap.set(userId, userData);
					});
				});
			}),
		);

		return userMap;
	} catch (error) {
		logger.error("Failed to get users by ids", error);
		return new Map();
	}
}

/**
 * フォロワー数またはフォロー中数を取得（count専用クエリ）
 */
async function getFollowCount(
	userId: string,
	type: "followers" | "following",
): Promise<number> {
	try {
		const field = type === "followers" ? "following_id" : "follower_id";
		const snapshot = await adminDb
			.collection(COLLECTIONS.USER_FOLLOWS)
			.where(field, "==", userId)
			.count()
			.get();

		return snapshot.data().count;
	} catch (error) {
		logger.error(`Failed to get ${type} count`, error);
		return 0;
	}
}

/**
 * GET /api/users/[userSlug]/follow-list
 * フォロワー・フォロー中一覧を取得（ページネーション対応、N+1対策）
 */
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ userSlug: string }> },
) {
	try {
		const { userSlug } = await params;
		const { searchParams } = new URL(request.url);

		// クエリパラメータの取得
		const type = searchParams.get("type");
		const page = parseInt(searchParams.get("page") || "1", 10);
		const limit = parseInt(searchParams.get("limit") || "20", 10);

		// バリデーション
		if (type !== "followers" && type !== "following") {
			return badRequest("type must be 'followers' or 'following'");
		}
		if (page < 1) {
			return badRequest("page must be >= 1");
		}
		if (limit < 1 || limit > 100) {
			return badRequest("limit must be between 1 and 100");
		}

		// ユーザースラッグからユーザーIDを解決
		const userInfo = await resolveUserIdFromSlug(userSlug);
		if (!userInfo) {
			return notFound("User");
		}

		const { userId: targetUserId } = userInfo;

		// 現在のユーザーIDを取得（オプション：未認証でも閲覧可能）
		const currentUserId = await resolveAuthUserId(request);

		// count を別クエリで取得（キャッシュもしやすい）
		const count = await getFollowCount(targetUserId, type);

		// 一覧を取得（ページネーション）
		// 注意: getFollowersList/getFollowingListはlimitで制限するが、offsetはサポートしていない
		// そのため、必要な分だけ取得してからスライスする
		const offset = (page - 1) * limit;
		const totalNeeded = limit + offset;
		const follows =
			type === "followers"
				? await getFollowersList(targetUserId, totalNeeded)
				: await getFollowingList(targetUserId, totalNeeded);

		// ページネーション適用
		const paginatedFollows = follows.slice(offset, offset + limit);

		// フォロー関係からユーザーIDのリストを抽出
		const userIds = paginatedFollows.map((follow) =>
			type === "followers" ? follow.follower_id : follow.following_id,
		);

		// ユーザー情報を一括取得
		const userMap = await getUsersByIds(userIds);

		// 現在のユーザーが各ユーザーをフォローしているかどうかを一括取得（N+1対策）
		const isFollowingSet =
			currentUserId && userIds.length > 0
				? await getIsFollowingBatch(currentUserId, userIds)
				: new Set<string>();

		// レスポンス用のユーザーリストを構築
		const users = userIds
			.map((userId) => {
				const user = userMap.get(userId);
				if (!user) return null;

				return {
					id: user.id,
					name: user.name,
					slug: user.slug,
					profile_image_url: user.profile_image_url,
					bio: user.bio,
					isFollowing: currentUserId ? isFollowingSet.has(userId) : false,
				};
			})
			.filter((user) => user !== null);

		const totalPages = Math.ceil(count / limit);

		return NextResponse.json({
			type,
			count,
			page,
			limit,
			totalPages,
			users,
		});
	} catch (error: unknown) {
		return handleApiError(
			error instanceof Error ? error : new Error(String(error)),
			`/api/users/[userSlug]/follow-list`,
		);
	}
}
