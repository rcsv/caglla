/**
 * Comment Likes Social Operations
 *
 * コメントへのいいね機能のFirestore操作を提供します。
 * トランザクションを使用して、いいねの追加/削除とlikes_countの更新を原子性を保って実行します。
 */

import { FieldValue } from "firebase-admin/firestore";
import type { Firestore } from "firebase-admin/firestore";
import { COLLECTIONS } from "@/lib/firebase/firestore";
import { asUserId, asCommentId } from "@/lib/core/types/identity";
import logger from "@/lib/core/logger";
import type { TripComment } from "@/lib/core/types/social";
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
		throw new Error(
			"Firebase Admin SDK is not available. Provide a Firestore instance as the last parameter.",
		);
	}
	return adminDb;
}

/**
 * コメントを解決する
 */
async function resolveComment(
	commentId: string,
	db: Firestore,
): Promise<{ id: string; comment: TripComment } | null> {
	const commentRef = db.collection(COLLECTIONS.TRIP_COMMENTS).doc(commentId);
	const commentSnap = await commentRef.get();

	if (!commentSnap.exists) {
		return null;
	}

	const commentData = convertStandardDates({
		id: commentSnap.id,
		...commentSnap.data(),
	}) as TripComment;

	return { id: commentSnap.id, comment: commentData };
}

/**
 * コメントへのいいねをトグルします（追加/削除）
 *
 * @param userId - いいねするユーザーID
 * @param commentId - コメントID
 * @param action - アクション（'like' | 'unlike' | 'toggle'）
 * @param db - Firestoreインスタンス（テスト環境で使用、省略可）
 * @returns いいね状態（liked: boolean, likesCount: number）
 * @throws コメントが見つからない、既にいいねしている（action='like'の場合）などのエラー
 */
export async function toggleCommentLike(
	userId: string,
	commentId: string,
	action: "like" | "unlike" | "toggle" = "toggle",
	db?: Firestore,
): Promise<{ liked: boolean; likesCount: number }> {
	const firestore = getFirestore(db);

	// 1. コメントを解決
	const resolved = await resolveComment(commentId, firestore);
	if (!resolved) {
		throw new Error("Comment not found");
	}

	const { id: resolvedCommentId, comment } = resolved;

	// 2. 権限チェック
	const userIdTyped = asUserId(userId);
	const commentUserIdTyped = asUserId(comment.user_id);
	const commentIdTyped = asCommentId(resolvedCommentId);

	// 自分のコメントはいいねできない
	if (userIdTyped === commentUserIdTyped) {
		throw new Error("Cannot like your own comment");
	}

	// 削除されたコメントはいいねできない
	if (comment.deleted) {
		throw new Error("Cannot like deleted comment");
	}

	// 3. いいねドキュメントの参照
	const commentRef = firestore
		.collection(COLLECTIONS.TRIP_COMMENTS)
		.doc(resolvedCommentId);
	const likeRef = firestore
		.collection(COLLECTIONS.COMMENT_LIKES)
		.doc(`${userId}_${resolvedCommentId}`);

	// 4. トランザクションでいいねをトグル
	const result = await firestore.runTransaction(async (tx) => {
		const [commentSnap, likeSnap] = await Promise.all([
			tx.get(commentRef),
			tx.get(likeRef),
		]);

		if (!commentSnap.exists) {
			throw new Error("Comment not found during transaction");
		}

		const commentData = commentSnap.data() as TripComment;
		const currentlyLiked = likeSnap.exists;

		// likes_countが存在しない場合は初期化
		const currentLikesCount = commentData.likes_count || 0;

		let nextLiked = currentlyLiked;
		let nextCount = currentLikesCount;

		// いいねを追加
		if (action === "like") {
			// 既にいいねしている場合はエラー
			if (currentlyLiked) {
				throw new Error("Comment is already liked");
			}

			tx.set(likeRef, {
				comment_id: resolvedCommentId,
				user_id: userId,
				created_at: new Date(),
			});

			// likes_countを更新
			tx.update(commentRef, {
				likes_count: FieldValue.increment(1),
			});

			nextLiked = true;
			nextCount = currentLikesCount + 1;
		}
		// いいねを削除
		else if (action === "unlike") {
			// いいねしていない場合はエラー
			if (!currentlyLiked) {
				throw new Error("Comment is not liked");
			}

			tx.delete(likeRef);

			// likes_countを更新
			tx.update(commentRef, {
				likes_count: FieldValue.increment(-1),
			});

			nextLiked = false;
			nextCount = Math.max(0, currentLikesCount - 1);
		}
		// toggle: 現在の状態に応じて追加/削除
		else if (action === "toggle") {
			if (!currentlyLiked) {
				// いいねを追加
				tx.set(likeRef, {
					comment_id: resolvedCommentId,
					user_id: userId,
					created_at: new Date(),
				});

				tx.update(commentRef, {
					likes_count: FieldValue.increment(1),
				});

				nextLiked = true;
				nextCount = currentLikesCount + 1;
			} else {
				// いいねを削除
				tx.delete(likeRef);

				tx.update(commentRef, {
					likes_count: FieldValue.increment(-1),
				});

				nextLiked = false;
				nextCount = Math.max(0, currentLikesCount - 1);
			}
		}

		return {
			liked: nextLiked,
			likesCount: nextCount,
		};
	});

	logger.debug("Comment like toggled", {
		userId,
		commentId: resolvedCommentId,
		action,
		result,
	});

	return result;
}

/**
 * コメントへのいいね状態を取得します
 *
 * @param userId - ユーザーID
 * @param commentId - コメントID
 * @param db - Firestoreインスタンス（テスト環境で使用、省略可）
 * @returns いいね状態（liked: boolean, likesCount: number）
 * @throws コメントが見つからないなどのエラー
 */
export async function getCommentLikeState(
	userId: string,
	commentId: string,
	db?: Firestore,
): Promise<{ liked: boolean; likesCount: number }> {
	const firestore = getFirestore(db);

	// 1. コメントを解決
	const resolved = await resolveComment(commentId, firestore);
	if (!resolved) {
		throw new Error("Comment not found");
	}

	const { id: resolvedCommentId, comment } = resolved;

	// 2. いいねドキュメントの参照
	const likeRef = firestore
		.collection(COLLECTIONS.COMMENT_LIKES)
		.doc(`${userId}_${resolvedCommentId}`);

	// 3. いいね状態を取得
	const [likeSnap] = await Promise.all([likeRef.get()]);

	const liked = likeSnap.exists;
	const likesCount = comment.likes_count || 0;

	return {
		liked,
		likesCount,
	};
}
