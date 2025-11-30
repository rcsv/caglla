/**
 * クライアントサイド用の識別子比較ヘルパー
 *
 * このファイルはクライアントサイドで使用される関数のみを含み、
 * Firebase Admin SDK に依存しません。
 */

import type { User } from "@/lib/core/types";
import type { User as FirebaseAuthUser } from "firebase/auth";

/**
 * Firebase Auth UID と User オブジェクトが同じユーザーを指しているかどうかを判定（クライアントサイド用）
 *
 * この関数は、Firebase Auth UID (user.uid) と User オブジェクトを比較します。
 * users コレクションのドキュメントIDとFirebase Auth UID (google_id) の両方をサポートします。
 *
 * @param authUid Firebase Auth UID (user.uid)
 * @param user User オブジェクト
 * @returns 同じユーザーの場合 true
 */
export function isSameUserByAuthUid(
	authUid: string | null | undefined,
	user: User | null | undefined,
): boolean {
	if (!authUid || !user) {
		return false;
	}

	// auth_uid または google_id と比較
	return user.auth_uid === authUid || user.google_id === authUid;
}

/**
 * 2つのUserオブジェクトが同じユーザーを指しているかどうかを判定
 *
 * この関数は、2つのUserオブジェクトを比較します。
 * usersドキュメントID、auth_uid、google_idのすべてを考慮して比較します。
 *
 * @param user1 1つ目のUserオブジェクト
 * @param user2 2つ目のUserオブジェクト
 * @returns 同じユーザーの場合 true
 */
export function isSameUser(
	user1: User | null | undefined,
	user2: User | null | undefined,
): boolean {
	if (!user1 || !user2) {
		return false;
	}

	// usersドキュメントIDで比較（最も確実）
	if (user1.id === user2.id) {
		return true;
	}

	// auth_uidで比較
	if (user1.auth_uid && user2.auth_uid && user1.auth_uid === user2.auth_uid) {
		return true;
	}

	// google_idで比較（両方存在する場合）
	if (
		user1.google_id &&
		user2.google_id &&
		user1.google_id === user2.google_id
	) {
		return true;
	}

	return false;
}

/**
 * 2つのユーザー識別子が同じユーザーを指しているかどうかを判定（クライアントサイド用、同期版）
 *
 * この関数は、Firebase Auth UID と users コレクションのドキュメントIDまたは google_id を比較します。
 * 直接比較のみで、データベースクエリは行いません。
 *
 * @param authUid Firebase Auth UID (user.uid)
 * @param userDocumentIdOrGoogleId users コレクションのドキュメントID または google_id
 * @returns 直接一致する場合 true（データベースクエリは行わない）
 */
export function isSameUserByIdSync(
	authUid: string | null | undefined,
	userDocumentIdOrGoogleId: string | null | undefined,
): boolean {
	if (!authUid || !userDocumentIdOrGoogleId) {
		return false;
	}

	// 直接一致する場合のみ true
	return authUid === userDocumentIdOrGoogleId;
}
