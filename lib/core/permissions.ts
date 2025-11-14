/**
 * 権限管理の共通ユーティリティ
 * 
 * トリップやその他のエンティティに対する編集権限を判定する関数を提供します。
 * v3.0.0: 型安全性を向上させ、UserId/UserSlug や TripId/TripSlug の混同を防止します。
 */

import type { User } from 'firebase/auth'
import type { Trip } from './types'
import type { UserId, TripId } from './types/identity'
import { asUserId, asTripId } from './types/identity'

/**
 * ユーザーが指定されたトリップを閲覧可能かどうかを判定します（v3.0.0追加）
 * 
 * @param trip - 判定対象のトリップオブジェクト
 * @param userId - ユーザーID（null の場合は未ログイン）
 * @returns 閲覧可能な場合 true
 */
export function canViewTrip(trip: Trip | null, userId: UserId | null): boolean {
  if (!trip) {
    return false
  }

  // 公開トリップは誰でも閲覧可能
  if (trip.access_level === 'public') {
    return true
  }

  // プライベートトリップは所有者のみ閲覧可能
  if (!userId) {
    return false
  }

  const tripUserId = asUserId(trip.user_id)
  return userId === tripUserId
}

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
  // 型安全性を保証するため、asUserId を使用
  const userId = asUserId(user.uid)
  const tripUserId = asUserId(trip.user_id)
  return userId === tripUserId
}

/**
 * ユーザーIDがトリップの所有者かどうかを判定します（型安全性向上版）
 * 
 * @param userId - ユーザーID（UserId型）
 * @param trip - 判定対象のトリップオブジェクト
 * @returns ユーザーがトリップの所有者である場合は true、それ以外は false
 */
export function canEditTripById(userId: UserId, trip: Trip | null): boolean {
  if (!trip) {
    return false
  }
  
  const tripUserId = asUserId(trip.user_id)
  return userId === tripUserId
}

/**
 * ユーザーIDとトリップIDが所有者関係にあるかどうかを判定します
 * 
 * @param userId - ユーザーID（UserId型）
 * @param tripId - トリップID（TripId型）
 * @param tripUserId - トリップの所有者ID（UserId型）
 * @returns ユーザーがトリップの所有者である場合は true、それ以外は false
 */
export function canEditTripByIds(
  userId: UserId,
  tripId: TripId,
  tripUserId: UserId
): boolean {
  return userId === tripUserId
}

/**
 * ユーザーが指定されたトリップにコメント可能かどうかを判定します（v3.0.0追加）
 * 
 * @param trip - 判定対象のトリップオブジェクト
 * @param userId - ユーザーID（null の場合は未ログイン）
 * @returns コメント可能な場合 true（公開トリップのみ）
 */
export function canCommentOnTrip(trip: Trip | null, userId: UserId | null): boolean {
  if (!trip || !userId) {
    return false
  }

  // 公開トリップのみコメント可能
  return trip.access_level === 'public'
}

/**
 * ユーザーが指定されたトリップにいいね可能かどうかを判定します（v3.0.0追加）
 * 
 * @param trip - 判定対象のトリップオブジェクト
 * @param userId - ユーザーID（null の場合は未ログイン）
 * @returns いいね可能な場合 true（公開トリップのみ、自分のトリップは除く）
 */
export function canLikeTrip(trip: Trip | null, userId: UserId | null): boolean {
  if (!trip || !userId) {
    return false
  }

  // 公開トリップのみいいね可能
  if (trip.access_level !== 'public') {
    return false
  }

  // 自分のトリップにはいいねできない
  const tripUserId = asUserId(trip.user_id)
  return userId !== tripUserId
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
  
  if (!user) {
    // 未ログインの場合はすべて false
    trips.forEach(trip => {
      permissions.set(trip.id, false)
    })
    return permissions
  }
  
  const userId = asUserId(user.uid)
  
  trips.forEach(trip => {
    const tripUserId = asUserId(trip.user_id)
    permissions.set(trip.id, userId === tripUserId)
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
