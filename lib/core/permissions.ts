/**
 * 権限管理の共通ユーティリティ
 * 
 * トリップやその他のエンティティに対する編集権限を判定する関数を提供します。
 */

import type { User } from 'firebase/auth'
import type { Trip } from './types'

/**
 * ユーザーが指定されたトリップを編集可能かどうかを判定します。
 * 
 * @param user - Firebase Auth のユーザーオブジェクト（null の場合は未ログイン）
 * @param trip - 判定対象のトリップオブジェクト（null の場合は存在しない）
 * @returns ユーザーがトリップの所有者である場合は true、それ以外は false
 * 
 * @example
 * ```typescript
 * const { user } = useAuth()
 * const canEdit = canEditTrip(user, trip)
 * if (canEdit) {
 *   // 編集UIを表示
 * }
 * ```
 */
export function canEditTrip(user: User | null, trip: Trip | null): boolean {
  // ユーザーまたはトリップが存在しない場合は編集不可
  if (!user || !trip) {
    return false
  }
  
  // Firebase Auth の uid とトリップの user_id を比較
  return user.uid === trip.user_id
}

/**
 * 複数のトリップに対する編集権限をまとめて判定します。
 * 
 * @param user - Firebase Auth のユーザーオブジェクト
 * @param trips - 判定対象のトリップ配列
 * @returns 各トリップの編集可否を含むマップ（key: tripId, value: canEdit）
 */
export function canEditTrips(
  user: User | null, 
  trips: Trip[]
): Map<string, boolean> {
  const permissions = new Map<string, boolean>()
  
  trips.forEach(trip => {
    permissions.set(trip.id, canEditTrip(user, trip))
  })
  
  return permissions
}

/**
 * 将来の拡張用：共同編集者の判定
 * 
 * 現在は未実装ですが、将来的に複数ユーザーでの編集を許可する場合に使用します。
 * 
 * @param user - Firebase Auth のユーザーオブジェクト
 * @param trip - 判定対象のトリップオブジェクト
 * @returns ユーザーがトリップの編集権限を持つ場合は true
 */
export function canCollaborateOnTrip(user: User | null, trip: Trip | null): boolean {
  // 現在は所有者のみが編集可能
  // 将来的には trip.collaborators や trip.shared_users などをチェック
  return canEditTrip(user, trip)
}

