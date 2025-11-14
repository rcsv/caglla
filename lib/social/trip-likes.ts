/**
 * Trip Likes Social Operations
 * 
 * Phase 1-4: Firestore操作関数（Social Operations）
 * 
 * いいね機能のFirestore操作を提供します。
 * トランザクションを使用して、いいねの追加/削除とsocial_statsの更新を原子性を保って実行します。
 */

import { FieldValue } from 'firebase-admin/firestore'
import type { Firestore } from 'firebase-admin/firestore'
import { COLLECTIONS } from '@/lib/firebase/firestore'
import { asUserId, asTripId } from '@/lib/core/types/identity'
import logger from '@/lib/core/logger'
import type { Trip } from '@/lib/core/types'
import { getTestFirestore } from '@/lib/__tests__/helpers/test-firestore'
import { convertStandardDates } from '@/lib/firebase/timestamp-utils'

// テスト環境ではテスト用のFirestoreを使用、本番環境ではadminDbを使用
function getFirestore(db?: Firestore): Firestore {
  if (db) return db
  // テスト環境の場合
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    return getTestFirestore()
  }
  // 本番環境の場合（lazy importでadminDbを読み込む）
  try {
    const adminModule = require('@/lib/firebase/admin')
    return adminModule.adminDb
  } catch (error) {
    throw new Error('Firebase Admin SDK is not available. Provide a Firestore instance as the last parameter.')
  }
}

/**
 * Tripを解決する（adminTripOperationsの代わりに、テスト環境でも使用可能な関数）
 */
async function resolveTripByIdOrSlug(
  idOrSlug: string,
  db: Firestore
): Promise<{ id: string; trip: Trip } | null> {
  // Try as document ID
  const byId = await db.collection(COLLECTIONS.TRIPS).doc(idOrSlug).get()
  if (byId.exists) {
    const tripData = convertStandardDates({
      id: byId.id,
      ...byId.data(),
    }) as Trip
    return { id: byId.id, trip: tripData }
  }

  // Fallback to slug query
  const bySlugSnap = await db
    .collection(COLLECTIONS.TRIPS)
    .where('slug', '==', idOrSlug)
    .limit(1)
    .get()

  if (bySlugSnap.empty) return null

  const docSnap = bySlugSnap.docs[0]
  const tripData = convertStandardDates({
    id: docSnap.id,
    ...docSnap.data(),
  }) as Trip
  return { id: docSnap.id, trip: tripData }
}

/**
 * いいねをトグルします（追加/削除）
 * 
 * @param userId - いいねするユーザーID
 * @param tripSlug - トリップのslug（またはID）
 * @param action - アクション（'like' | 'unlike' | 'toggle'）
 * @param db - Firestoreインスタンス（テスト環境で使用、省略可）
 * @returns いいね状態（liked: boolean, likesCount: number）
 * @throws トリップが見つからない、権限がない、既にいいねしている（action='like'の場合）などのエラー
 */
export async function toggleTripLike(
  userId: string,
  tripSlug: string,
  action: 'like' | 'unlike' | 'toggle' = 'toggle',
  db?: Firestore
): Promise<{ liked: boolean; likesCount: number }> {
  const firestore = getFirestore(db)
  
  // 1. Tripを解決
  const resolved = await resolveTripByIdOrSlug(tripSlug, firestore)
  if (!resolved) {
    throw new Error('Trip not found')
  }

  const { id: tripId, trip } = resolved

  // 2. 権限チェック
  const userIdTyped = asUserId(userId)
  const tripUserIdTyped = asUserId(trip.user_id)
  const tripIdTyped = asTripId(tripId)

  // プライベートトリップはいいねできない
  if (trip.access_level !== 'public') {
    throw new Error('Likes available only for public trips')
  }

  // 自分のトリップはいいねできない
  if (userIdTyped === tripUserIdTyped) {
    throw new Error('Cannot like your own trip')
  }

  // 3. いいねドキュメントの参照
  const tripRef = firestore.collection(COLLECTIONS.TRIPS).doc(tripId)
  const likeRef = firestore.collection(COLLECTIONS.TRIP_LIKES).doc(`${userId}_${tripId}`)

  // 4. トランザクションでいいねをトグル
  const result = await firestore.runTransaction(async (tx) => {
    const [tripSnap, likeSnap] = await Promise.all([tx.get(tripRef), tx.get(likeRef)])

    if (!tripSnap.exists) {
      throw new Error('Trip not found during transaction')
    }

    const tripData = tripSnap.data() as Trip
    const currentlyLiked = likeSnap.exists

    // social_statsが存在しない場合は初期化
    const currentSocialStats = tripData.social_stats || {
      likes_count: 0,
      comments_count: 0,
      shares_count: 0,
      views_count: 0,
      replicas_count: 0,
    }
    const currentLikesCount = currentSocialStats.likes_count || 0

    let nextLiked = currentlyLiked
    let nextCount = currentLikesCount

    // いいねを追加
    if (action === 'like') {
      // 既にいいねしている場合はエラー
      if (currentlyLiked) {
        throw new Error('Trip is already liked')
      }

      tx.set(likeRef, {
        trip_id: tripId,
        user_id: userId,
        created_at: new Date(),
      })

      // social_statsを更新
      tx.update(tripRef, {
        'social_stats.likes_count': FieldValue.increment(1),
      })

      nextLiked = true
      nextCount = currentLikesCount + 1
    }
    // いいねを削除
    else if (action === 'unlike') {
      // いいねしていない場合はエラー
      if (!currentlyLiked) {
        throw new Error('Trip is not liked')
      }

      tx.delete(likeRef)

      // social_statsを更新
      tx.update(tripRef, {
        'social_stats.likes_count': FieldValue.increment(-1),
      })

      nextLiked = false
      nextCount = Math.max(0, currentLikesCount - 1)
    }
    // toggle: 現在の状態に応じて追加/削除
    else if (action === 'toggle') {
      if (!currentlyLiked) {
        // いいねを追加
        tx.set(likeRef, {
          trip_id: tripId,
          user_id: userId,
          created_at: new Date(),
        })

        tx.update(tripRef, {
          'social_stats.likes_count': FieldValue.increment(1),
        })

        nextLiked = true
        nextCount = currentLikesCount + 1
      } else {
        // いいねを削除
        tx.delete(likeRef)

        tx.update(tripRef, {
          'social_stats.likes_count': FieldValue.increment(-1),
        })

        nextLiked = false
        nextCount = Math.max(0, currentLikesCount - 1)
      }
    }

    return {
      liked: nextLiked,
      likesCount: nextCount,
    }
  })

  logger.debug('Trip like toggled', {
    userId,
    tripSlug,
    action,
    result,
  })

  return result
}

/**
 * いいね状態を取得します
 * 
 * @param tripSlug - トリップのslug（またはID）
 * @param userId - ユーザーID（nullの場合は未認証）
 * @param db - Firestoreインスタンス（テスト環境で使用、省略可）
 * @returns いいね状態（count: number, liked: boolean）
 * @throws トリップが見つからない、プライベートトリップなどのエラー
 */
export async function getTripLikeState(
  tripSlug: string,
  userId: string | null,
  db?: Firestore
): Promise<{ count: number; liked: boolean }> {
  const firestore = getFirestore(db)

  // 1. Tripを解決
  const resolved = await resolveTripByIdOrSlug(tripSlug, firestore)
  if (!resolved) {
    throw new Error('Trip not found')
  }

  const { id: tripId, trip } = resolved

  // 2. 権限チェック（プライベートトリップは閲覧不可）
  if (trip.access_level !== 'public') {
    throw new Error('Private trips cannot be accessed')
  }

  // 3. Tripドキュメントから最新のsocial_statsを取得（データベースから直接読み取る）
  const tripRef = firestore.collection(COLLECTIONS.TRIPS).doc(tripId)
  const tripSnap = await tripRef.get()
  
  if (!tripSnap.exists) {
    throw new Error('Trip not found')
  }

  const tripData = tripSnap.data() as Trip
  const socialStats = tripData.social_stats
  const likesCount = socialStats?.likes_count || 0

  // 4. ユーザーがいいねしているかチェック
  let liked = false
  if (userId) {
    const likeRef = firestore.collection(COLLECTIONS.TRIP_LIKES).doc(`${userId}_${tripId}`)
    const likeDoc = await likeRef.get()
    liked = likeDoc.exists
  }

  return {
    count: likesCount,
    liked,
  }
}

