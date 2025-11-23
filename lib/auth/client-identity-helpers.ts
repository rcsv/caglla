/**
 * クライアントサイド用の識別子比較ヘルパー
 * 
 * このファイルはクライアントサイドで使用される関数のみを含み、
 * Firebase Admin SDK に依存しません。
 */

import type { User } from '@/lib/core/types'

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
export function isSameUserByAuthUid(authUid: string | null | undefined, user: User | null | undefined): boolean {
  if (!authUid || !user) {
    return false
  }
  
  // auth_uid または google_id と比較
  return user.auth_uid === authUid || user.google_id === authUid
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
export function isSameUserByIdSync(authUid: string | null | undefined, userDocumentIdOrGoogleId: string | null | undefined): boolean {
  if (!authUid || !userDocumentIdOrGoogleId) {
    return false
  }
  
  // 直接一致する場合のみ true
  return authUid === userDocumentIdOrGoogleId
}

