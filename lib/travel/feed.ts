/**
 * Feed Operations
 * 
 * フィード機能のFirestore操作を提供します。
 * 公開トリップのフィード取得、トレンドフィード、フォロー中フィードを提供します。
 */

import type { Firestore } from 'firebase-admin/firestore'
import { COLLECTIONS } from '@/lib/firebase/firestore'
import logger from '@/lib/core/logger'
import type { Trip } from '@/lib/core/types'
import { getTestFirestore } from '@/lib/__tests__/helpers/test-firestore'
import { convertStandardDates, toDateOrNull } from '@/lib/firebase/timestamp-utils'

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
 * カーソルベースのページネーション用にドキュメントIDをエンコード
 */
function encodeCursor(tripId: string, sortValue: number | Date): string {
  const value = typeof sortValue === 'number' ? sortValue : sortValue.getTime()
  return Buffer.from(`${tripId}:${value}`).toString('base64')
}

/**
 * カーソルベースのページネーション用にドキュメントIDをデコード
 */
function decodeCursor(cursor: string): { tripId: string; sortValue: number } | null {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8')
    const [tripId, sortValueStr] = decoded.split(':')
    const sortValue = parseFloat(sortValueStr)
    if (!tripId || isNaN(sortValue)) {
      return null
    }
    return { tripId, sortValue }
  } catch {
    return null
  }
}

/**
 * 公開トリップのフィードを取得します
 * 
 * @param limit - 取得件数の上限（デフォルト: 20）
 * @param startAfter - ページネーション用カーソル（オプション）
 * @param db - Firestoreインスタンス（テスト環境で使用、省略可）
 * @returns フィード結果（trips, nextCursor）
 */
export async function getPublicFeed(
  limit: number = 20,
  startAfter?: string,
  db?: Firestore
): Promise<{ trips: Trip[]; nextCursor?: string }> {
  const firestore = getFirestore(db)

  let query = firestore
    .collection(COLLECTIONS.TRIPS)
    .where('access_level', '==', 'public')
    .orderBy('created_at', 'desc')
    .limit(limit + 1) // 次のページがあるかを確認するため+1

  // カーソルベースのページネーション
  if (startAfter) {
    const decoded = decodeCursor(startAfter)
    if (decoded) {
      // カーソル位置から続きを取得
      const cursorDoc = await firestore.collection(COLLECTIONS.TRIPS).doc(decoded.tripId).get()
      if (cursorDoc.exists) {
        const cursorData = cursorDoc.data()
        const cursorDate = cursorData?.created_at
        if (cursorDate) {
          query = query.startAfter(cursorDoc) as typeof query
        }
      }
    }
  }

  const snapshot = await query.get()

  const trips: Trip[] = snapshot.docs
    .slice(0, limit) // +1で取得した分を除外
    .map((doc) => {
      const data = convertStandardDates({
        id: doc.id,
        ...doc.data(),
      }) as Trip
      return data
    })

  // 次のページがあるか確認
  let nextCursor: string | undefined
  if (snapshot.docs.length > limit) {
    const lastDoc = snapshot.docs[limit - 1]
    const lastData = lastDoc.data()
    const lastCreatedAt = lastData?.created_at
    if (lastCreatedAt) {
      const lastDate = toDateOrNull(lastCreatedAt)
      if (lastDate) {
        nextCursor = encodeCursor(lastDoc.id, lastDate)
      }
    }
  }

  logger.debug('Public feed fetched', {
    limit,
    returned: trips.length,
    hasNext: !!nextCursor,
  })

  return {
    trips,
    nextCursor,
  }
}

/**
 * トレンドフィードを取得します（trending_scoreでソート）
 * 
 * @param limit - 取得件数の上限（デフォルト: 20）
 * @param startAfter - ページネーション用カーソル（オプション）
 * @param db - Firestoreインスタンス（テスト環境で使用、省略可）
 * @returns フィード結果（trips, nextCursor）
 */
export async function getTrendingFeed(
  limit: number = 20,
  startAfter?: string,
  db?: Firestore
): Promise<{ trips: Trip[]; nextCursor?: string }> {
  const firestore = getFirestore(db)

  let query = firestore
    .collection(COLLECTIONS.TRIPS)
    .where('access_level', '==', 'public')
    .where('trending_score', '!=', null)
    .orderBy('trending_score', 'desc')
    .orderBy('created_at', 'desc') // サブソート（同じtrending_scoreの場合）
    .limit(limit + 1) // 次のページがあるかを確認するため+1

  // 注意: Firestore Composite Indexが必要
  // - access_level (ASC) + trending_score (DESC) + created_at (DESC)

  // カーソルベースのページネーション
  if (startAfter) {
    const decoded = decodeCursor(startAfter)
    if (decoded) {
      // カーソル位置から続きを取得
      const cursorDoc = await firestore.collection(COLLECTIONS.TRIPS).doc(decoded.tripId).get()
      if (cursorDoc.exists) {
        const cursorData = cursorDoc.data()
        const cursorScore = cursorData?.trending_score
        if (cursorScore !== undefined && cursorScore !== null) {
          query = query.startAfter(cursorDoc) as typeof query
        }
      }
    }
  }

  const snapshot = await query.get()

  const trips: Trip[] = snapshot.docs
    .slice(0, limit) // +1で取得した分を除外
    .map((doc) => {
      const data = convertStandardDates({
        id: doc.id,
        ...doc.data(),
      }) as Trip
      return data
    })

  // 次のページがあるか確認
  let nextCursor: string | undefined
  if (snapshot.docs.length > limit) {
    const lastDoc = snapshot.docs[limit - 1]
    const lastData = lastDoc.data()
    const lastScore = lastData?.trending_score
    if (lastScore !== undefined && lastScore !== null) {
      nextCursor = encodeCursor(lastDoc.id, lastScore)
    }
  }

  logger.debug('Trending feed fetched', {
    limit,
    returned: trips.length,
    hasNext: !!nextCursor,
  })

  return {
    trips,
    nextCursor,
  }
}

/**
 * フォロー中フィードを取得します（フォローしているユーザーの公開トリップのみ）
 * 
 * @param userId - ユーザーID
 * @param limit - 取得件数の上限（デフォルト: 20）
 * @param startAfter - ページネーション用カーソル（オプション）
 * @param db - Firestoreインスタンス（テスト環境で使用、省略可）
 * @returns フィード結果（trips, nextCursor）
 */
export async function getFollowingFeed(
  userId: string,
  limit: number = 20,
  startAfter?: string,
  db?: Firestore
): Promise<{ trips: Trip[]; nextCursor?: string }> {
  const firestore = getFirestore(db)

  // 1. フォローしているユーザーIDのリストを取得
  const followsSnapshot = await firestore
    .collection(COLLECTIONS.USER_FOLLOWS)
    .where('follower_id', '==', userId)
    .get()

  const followingIds = followsSnapshot.docs.map((doc) => doc.data().following_id)

  if (followingIds.length === 0) {
    return {
      trips: [],
      nextCursor: undefined,
    }
  }

  // 2. フォローしているユーザーの公開トリップを取得
  // 注意: Firestoreの`in`クエリは最大10件まで
  const allTrips: Trip[] = []

  for (let i = 0; i < followingIds.length; i += 10) {
    const batch = followingIds.slice(i, i + 10)

    let query = firestore
      .collection(COLLECTIONS.TRIPS)
      .where('access_level', '==', 'public')
      .where('user_id', 'in', batch)
      .orderBy('created_at', 'desc')
      .limit(limit + 1) // 次のページがあるかを確認するため+1

    // カーソルベースのページネーション（最初のバッチのみ）
    if (startAfter && i === 0) {
      const decoded = decodeCursor(startAfter)
      if (decoded) {
        const cursorDoc = await firestore.collection(COLLECTIONS.TRIPS).doc(decoded.tripId).get()
        if (cursorDoc.exists) {
          query = query.startAfter(cursorDoc) as typeof query
        }
      }
    }

    const snapshot = await query.get()

    const batchTrips: Trip[] = snapshot.docs.map((doc) => {
      const data = convertStandardDates({
        id: doc.id,
        ...doc.data(),
      }) as Trip
      return data
    })

    allTrips.push(...batchTrips)
  }

  // 3. すべてのトリップをcreated_atでソート（降順）
  allTrips.sort((a, b) => {
    const aDate = toDateOrNull(a.created_at)
    const bDate = toDateOrNull(b.created_at)
    if (!aDate || !bDate) return 0
    return bDate.getTime() - aDate.getTime()
  })

  // 4. ページネーション（limit適用）
  const trips = allTrips.slice(0, limit)

  // 5. 次のページがあるか確認
  let nextCursor: string | undefined
  if (allTrips.length > limit) {
    const lastTrip = trips[trips.length - 1]
    const lastDate = toDateOrNull(lastTrip.created_at)
    if (lastDate) {
      nextCursor = encodeCursor(lastTrip.id, lastDate)
    }
  }

  logger.debug('Following feed fetched', {
    userId,
    followingCount: followingIds.length,
    limit,
    returned: trips.length,
    hasNext: !!nextCursor,
  })

  return {
    trips,
    nextCursor,
  }
}

