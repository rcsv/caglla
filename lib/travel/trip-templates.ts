/**
 * Trip Templates Operations
 * 
 * テンプレートTripの取得操作を提供します。
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
 * 公開テンプレートTripを取得します
 * 
 * @param options - オプション
 * @param options.limit - 取得件数の上限（デフォルト: 20）
 * @param options.cursor - ページネーション用カーソル（オプション）
 * @param options.excludeUserId - 除外するユーザーID（オプション、自分のTripを除外する場合）
 * @param db - Firestoreインスタンス（テスト環境で使用、省略可）
 * @returns テンプレートTripのリストと次のカーソル
 */
export async function getTemplateTrips(
  options: {
    limit?: number
    cursor?: string
    excludeUserId?: string
  } = {},
  db?: Firestore
): Promise<{ trips: Trip[]; nextCursor?: string }> {
  const firestore = getFirestore(db)
  const { limit = 20, cursor, excludeUserId } = options

  let query = firestore
    .collection(COLLECTIONS.TRIPS)
    .where('access_level', '==', 'public')
    .where('is_template', '==', true)
    .orderBy('created_at', 'desc')
    .limit(limit + 1) // 次のページがあるかを確認するため+1

  // 注意: Firestoreでは `!=` フィルターの後に `orderBy` は使用できない
  // 除外は取得後にクライアント側で行う

  // カーソルベースのページネーション
  if (cursor) {
    const decoded = decodeCursor(cursor)
    if (decoded) {
      const cursorDoc = await firestore.collection(COLLECTIONS.TRIPS).doc(decoded.tripId).get()
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc) as typeof query
      }
    }
  }

  const snapshot = await query.get()

  let trips: Trip[] = snapshot.docs
    .slice(0, limit) // +1で取得した分を除外
    .map((doc) => {
      const data = doc.data()
      return convertStandardDates({
        id: doc.id,
        ...data,
      }) as Trip
    })

  // 自分のTripを除外する場合（クライアント側でフィルタリング）
  if (excludeUserId) {
    trips = trips.filter((trip) => trip.user_id !== excludeUserId)
  }

  // 次のページがあるか確認
  const hasMore = snapshot.docs.length > limit
  const nextCursor = hasMore && trips.length > 0
    ? (() => {
        const lastCreatedAt = toDateOrNull(trips[trips.length - 1].created_at)
        return lastCreatedAt ? encodeCursor(trips[trips.length - 1].id, lastCreatedAt) : undefined
      })()
    : undefined

  logger.debug('Template trips fetched', {
    count: trips.length,
    hasMore,
    nextCursor: nextCursor ? 'present' : 'none',
  })

  return {
    trips,
    ...(nextCursor && { nextCursor }),
  }
}

/**
 * 自分が公開したTripを取得します
 * 
 * @param userId - ユーザーID
 * @param options - オプション
 * @param options.limit - 取得件数の上限（デフォルト: 20）
 * @param options.cursor - ページネーション用カーソル（オプション）
 * @param db - Firestoreインスタンス（テスト環境で使用、省略可）
 * @returns 公開Tripのリストと次のカーソル
 */
export async function getMySharedTrips(
  userId: string,
  options: {
    limit?: number
    cursor?: string
  } = {},
  db?: Firestore
): Promise<{ trips: Trip[]; nextCursor?: string }> {
  const firestore = getFirestore(db)
  const { limit = 20, cursor } = options

  let query = firestore
    .collection(COLLECTIONS.TRIPS)
    .where('user_id', '==', userId)
    .where('access_level', '==', 'public')
    .orderBy('updated_at', 'desc')
    .limit(limit + 1) // 次のページがあるかを確認するため+1

  // カーソルベースのページネーション
  if (cursor) {
    const decoded = decodeCursor(cursor)
    if (decoded) {
      const cursorDoc = await firestore.collection(COLLECTIONS.TRIPS).doc(decoded.tripId).get()
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc) as typeof query
      }
    }
  }

  const snapshot = await query.get()

  const trips: Trip[] = snapshot.docs
    .slice(0, limit) // +1で取得した分を除外
    .map((doc) => {
      const data = doc.data()
      return convertStandardDates({
        id: doc.id,
        ...data,
      }) as Trip
    })

  // 次のページがあるか確認
  const hasMore = snapshot.docs.length > limit
  const nextCursor = hasMore && trips.length > 0
    ? (() => {
        const lastUpdatedAt = toDateOrNull(trips[trips.length - 1].updated_at)
        return lastUpdatedAt ? encodeCursor(trips[trips.length - 1].id, lastUpdatedAt) : undefined
      })()
    : undefined

  logger.debug('My shared trips fetched', {
    userId,
    count: trips.length,
    hasMore,
    nextCursor: nextCursor ? 'present' : 'none',
  })

  return {
    trips,
    ...(nextCursor && { nextCursor }),
  }
}

/**
 * カーソルベースのページネーション用にドキュメントIDをエンコード
 */
function encodeCursor(tripId: string, sortValue: Date): string {
  const value = sortValue.getTime()
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

