/**
 * SNS機能関連の型定義
 * 
 * v3.0.0: SNS機能（いいね、コメント、フォロー）の型定義
 */

import type { FirestoreDate } from './common'

// ============================================================================
// ソーシャル統計
// ============================================================================

/**
 * Trip のソーシャル統計（集計値）
 * 
 * 注意: これらの値は `trip_likes`, `trip_comments`, `user_follows` の
 * Subcollectionから集計された値です。直接更新する場合は `FieldValue.increment()`
 * を使用してください。
 */
export interface TripSocialStats {
  likes_count: number
  comments_count: number
  shares_count: number
  views_count: number
  replicas_count: number // テンプレート使用回数
}

// ============================================================================
// いいね
// ============================================================================

/**
 * TripLike（いいね）
 * 
 * コレクション: `trip_likes`
 * ドキュメントID: `{userId}_{tripId}` でユニーク保証
 */
export interface TripLike {
  id: string // {userId}_{tripId} でユニーク保証
  trip_id: string
  user_id: string
  created_at: FirestoreDate
}

// ============================================================================
// コメント
// ============================================================================

/**
 * TripComment（コメント）
 * 
 * コレクション: `trip_comments`
 * ネストコメント対応（parent_comment_id）
 * 論理削除対応（deleted フラグ）
 */
export interface TripComment {
  id: string
  trip_id: string
  user_id: string
  user_name: string
  user_avatar?: string
  content: string
  parent_comment_id?: string // ネストコメント対応
  created_at: FirestoreDate
  updated_at?: FirestoreDate
  deleted: boolean // 論理削除
}

// ============================================================================
// フォロー
// ============================================================================

/**
 * UserFollow（フォロー関係）
 * 
 * コレクション: `user_follows`
 * ドキュメントID: `{followerId}_{followingId}` でユニーク保証
 */
export interface UserFollow {
  id: string // {followerId}_{followingId} でユニーク保証
  follower_id: string // フォローする人
  following_id: string // フォローされる人
  created_at: FirestoreDate
}

// ============================================================================
// 型ガード関数
// ============================================================================

/**
 * TripSocialStats の型ガード
 * 
 * @param value チェックする値
 * @returns TripSocialStats の場合 true
 */
export function isTripSocialStats(value: unknown): value is TripSocialStats {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const stats = value as Record<string, unknown>

  return (
    typeof stats.likes_count === 'number' &&
    typeof stats.comments_count === 'number' &&
    typeof stats.shares_count === 'number' &&
    typeof stats.views_count === 'number' &&
    typeof stats.replicas_count === 'number'
  )
}

/**
 * TripLike の型ガード
 * 
 * @param value チェックする値
 * @returns TripLike の場合 true
 */
export function isTripLike(value: unknown): value is TripLike {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const like = value as Record<string, unknown>

  return (
    typeof like.id === 'string' &&
    typeof like.trip_id === 'string' &&
    typeof like.user_id === 'string' &&
    (typeof like.created_at === 'string' || like.created_at instanceof Date)
  )
}

/**
 * TripComment の型ガード
 * 
 * @param value チェックする値
 * @returns TripComment の場合 true
 */
export function isTripComment(value: unknown): value is TripComment {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const comment = value as Record<string, unknown>

  return (
    typeof comment.id === 'string' &&
    typeof comment.trip_id === 'string' &&
    typeof comment.user_id === 'string' &&
    typeof comment.user_name === 'string' &&
    typeof comment.content === 'string' &&
    typeof comment.deleted === 'boolean' &&
    (typeof comment.created_at === 'string' || comment.created_at instanceof Date)
  )
}

/**
 * UserFollow の型ガード
 * 
 * @param value チェックする値
 * @returns UserFollow の場合 true
 */
export function isUserFollow(value: unknown): value is UserFollow {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const follow = value as Record<string, unknown>

  return (
    typeof follow.id === 'string' &&
    typeof follow.follower_id === 'string' &&
    typeof follow.following_id === 'string' &&
    (typeof follow.created_at === 'string' || follow.created_at instanceof Date)
  )
}

