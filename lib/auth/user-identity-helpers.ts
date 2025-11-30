/**
 * ユーザー識別子比較ヘルパー
 *
 * users コレクションのドキュメントIDとFirebase Auth UID (google_id) の両方をサポート
 */

import { adminUserOperations } from "@/lib/firebase/admin-operation";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/firestore";
import logger from "@/lib/core/logger";
import type { User } from "@/lib/core/types";

/**
 * 2つのユーザー識別子が同じユーザーを指しているかどうかを判定
 *
 * @param authUid - Firebase Auth UID (google_id)
 * @param userDocumentIdOrGoogleId - users コレクションのドキュメントID または google_id
 * @returns 同じユーザーの場合 true
 */
export async function isSameUserById(
	authUid: string,
	userDocumentIdOrGoogleId: string,
): Promise<boolean> {
	// 直接一致する場合
	if (authUid === userDocumentIdOrGoogleId) {
		return true;
	}

	try {
		// userDocumentIdOrGoogleId が users コレクションのドキュメントIDかどうかを確認
		const userDoc = await adminDb
			.collection(COLLECTIONS.USERS)
			.doc(userDocumentIdOrGoogleId)
			.get();

		if (userDoc.exists) {
			// users コレクションのドキュメントIDの場合
			const userData = userDoc.data() as User;
			// auth_uid または google_id と比較
			return userData.auth_uid === authUid || userData.google_id === authUid;
		}

		// userDocumentIdOrGoogleId が google_id の可能性があるので、google_id で検索
		const user = await adminUserOperations.getUserByAuthUid(
			userDocumentIdOrGoogleId,
		);
		if (user) {
			// userDocumentIdOrGoogleId が google_id で、authUid と一致するか確認
			return user.auth_uid === authUid || user.google_id === authUid;
		}

		// どちらでも見つからない場合は false
		return false;
	} catch (error) {
		logger.error("Error checking user identity", {
			error,
			authUid,
			userDocumentIdOrGoogleId,
		});
		return false;
	}
}

/**
 * 2つのユーザー識別子が同じユーザーを指しているかどうかを判定（同期版、簡易チェック）
 *
 * 注意: これは直接比較のみで、データベースクエリは行いません。
 * 確実に同じ型（両方とも google_id または両方とも users ドキュメントID）の場合にのみ使用してください。
 *
 * @param id1 - 最初の識別子
 * @param id2 - 2番目の識別子
 * @returns 同じ場合 true
 */
export function isSameUserByIdSync(id1: string, id2: string): boolean {
	return id1 === id2;
}
