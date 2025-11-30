/**
 * User Follows Social Operations
 *
 * Phase 1-4: Firestore操作関数（Social Operations）
 *
 * フォロー機能のFirestore操作を提供します。
 * トランザクションを使用して、フォロー/アンフォローの操作を原子性を保って実行します。
 */

import type { Firestore } from "firebase-admin/firestore";
import { COLLECTIONS } from "@/lib/firebase/firestore";
import { asUserId } from "@/lib/core/types/identity";
import logger from "@/lib/core/logger";
import type { UserFollow } from "@/lib/core/types/social";
import { getTestFirestore } from "@/lib/__tests__/helpers/test-firestore";
import { convertStandardDates } from "@/lib/firebase/timestamp-utils";
import { adminDb } from "@/lib/firebase/admin";

// テスト環境ではテスト用のFirestoreを使用、本番環境ではadminDbを使用
function getFirestore(db?: Firestore): Firestore {
	if (db) return db;
	// テスト環境の場合
	if (process.env.FIRESTORE_EMULATOR_HOST) {
		return getTestFirestore();
	}
	// 本番環境の場合、adminDbを直接使用
	if (!adminDb) {
		logger.error("getFirestore: adminDb is undefined");
		throw new Error(
			"Firebase Admin Firestore instance is not available. Provide a Firestore instance as the last parameter.",
		);
	}
	return adminDb;
}

/**
 * ユーザーをフォローします
 *
 * @param followerId - フォローするユーザーID
 * @param followingId - フォローされるユーザーID
 * @param db - Firestoreインスタンス（テスト環境で使用、省略可）
 * @returns 作成されたフォロー関係
 * @throws 自分自身をフォローしようとした場合、既にフォローしている場合などのエラー
 */
export async function followUser(
	followerId: string,
	followingId: string,
	db?: Firestore,
): Promise<UserFollow> {
	const firestore = getFirestore(db);

	// 1. バリデーション
	const followerIdTyped = asUserId(followerId);
	const followingIdTyped = asUserId(followingId);

	if (followerIdTyped === followingIdTyped) {
		throw new Error("Cannot follow yourself");
	}

	// 2. トランザクションでフォロー関係を作成
	const followId = `${followerId}_${followingId}`;
	const followRef = firestore
		.collection(COLLECTIONS.USER_FOLLOWS)
		.doc(followId);

	const result = await firestore.runTransaction(async (tx) => {
		const followSnap = await tx.get(followRef);

		// 既にフォローしている場合はエラー
		if (followSnap.exists) {
			throw new Error("Already following this user");
		}

		const now = new Date();
		const followData: Omit<UserFollow, "id"> = {
			follower_id: followerId,
			following_id: followingId,
			created_at: now,
		};

		// フォロー関係を作成
		tx.set(followRef, followData);

		return {
			id: followId,
			...followData,
		} as UserFollow;
	});

	logger.debug("User followed", {
		followerId,
		followingId,
		followId,
	});

	return result;
}

/**
 * フォローを解除します
 *
 * @param followerId - フォロー解除するユーザーID
 * @param followingId - フォロー解除されるユーザーID
 * @param db - Firestoreインスタンス（テスト環境で使用、省略可）
 * @throws フォロー関係が存在しない場合などのエラー
 */
export async function unfollowUser(
	followerId: string,
	followingId: string,
	db?: Firestore,
): Promise<void> {
	const firestore = getFirestore(db);

	// 1. バリデーション
	const followerIdTyped = asUserId(followerId);
	const followingIdTyped = asUserId(followingId);

	if (followerIdTyped === followingIdTyped) {
		throw new Error("Cannot unfollow yourself");
	}

	// 2. トランザクションでフォロー関係を削除
	const followId = `${followerId}_${followingId}`;
	const followRef = firestore
		.collection(COLLECTIONS.USER_FOLLOWS)
		.doc(followId);

	await firestore.runTransaction(async (tx) => {
		const followSnap = await tx.get(followRef);

		// フォロー関係が存在しない場合はエラー（または何もしない）
		if (!followSnap.exists) {
			throw new Error("Not following this user");
		}

		const followData = followSnap.data() as UserFollow;

		// 権限チェック（フォローした人のみ解除可能）
		const followDataFollowerIdTyped = asUserId(followData.follower_id);
		if (followerIdTyped !== followDataFollowerIdTyped) {
			throw new Error("Only follower can unfollow");
		}

		// フォロー関係を削除
		tx.delete(followRef);
	});

	logger.debug("User unfollowed", {
		followerId,
		followingId,
		followId,
	});
}

/**
 * フォロー状態を取得します
 *
 * @param followerId - フォローするユーザーID
 * @param followingId - フォローされるユーザーID
 * @param db - Firestoreインスタンス（テスト環境で使用、省略可）
 * @returns フォロー状態
 */
export async function getFollowState(
	followerId: string,
	followingId: string,
	db?: Firestore,
): Promise<{ isFollowing: boolean }> {
	const firestore = getFirestore(db);

	const followId = `${followerId}_${followingId}`;
	const followRef = firestore
		.collection(COLLECTIONS.USER_FOLLOWS)
		.doc(followId);
	const followDoc = await followRef.get();

	return {
		isFollowing: followDoc.exists,
	};
}

/**
 * フォロー中リストを取得します
 *
 * @param userId - ユーザーID
 * @param limit - 取得件数の上限（オプション）
 * @param db - Firestoreインスタンス（テスト環境で使用、省略可）
 * @returns フォロー中リスト（created_atでソート、降順）
 */
export async function getFollowingList(
	userId: string,
	limit?: number,
	db?: Firestore,
): Promise<UserFollow[]> {
	const firestore = getFirestore(db);

	let query = firestore
		.collection(COLLECTIONS.USER_FOLLOWS)
		.where("follower_id", "==", userId)
		.orderBy("created_at", "desc");

	if (limit && limit > 0) {
		query = query.limit(limit) as typeof query;
	}

	const snapshot = await query.get();

	const follows: UserFollow[] = snapshot.docs.map((doc) => {
		const data = convertStandardDates({
			id: doc.id,
			...doc.data(),
		}) as UserFollow;
		return data;
	});

	return follows;
}

/**
 * フォロワーリストを取得します
 *
 * @param userId - ユーザーID
 * @param limit - 取得件数の上限（オプション）
 * @param db - Firestoreインスタンス（テスト環境で使用、省略可）
 * @returns フォロワーリスト（created_atでソート、降順）
 */
export async function getFollowersList(
	userId: string,
	limit?: number,
	db?: Firestore,
): Promise<UserFollow[]> {
	const firestore = getFirestore(db);

	let query = firestore
		.collection(COLLECTIONS.USER_FOLLOWS)
		.where("following_id", "==", userId)
		.orderBy("created_at", "desc");

	if (limit && limit > 0) {
		query = query.limit(limit) as typeof query;
	}

	const snapshot = await query.get();

	const follows: UserFollow[] = snapshot.docs.map((doc) => {
		const data = convertStandardDates({
			id: doc.id,
			...doc.data(),
		}) as UserFollow;
		return data;
	});

	return follows;
}
