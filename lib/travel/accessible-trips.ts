/**
 * Accessible Trips Operations
 * 
 * ユーザーがアクセス可能なTripの取得操作を提供します。
 * 所有Tripと共有Tripの両方を取得できます。
 */

import type { Firestore } from 'firebase-admin/firestore'
import { COLLECTIONS } from '@/lib/firebase/firestore'
import logger from '@/lib/core/logger'
import type { Trip, TripStatus } from '@/lib/core/types'
import { getTestFirestore } from '@/lib/__tests__/helpers/test-firestore'
import { convertStandardDates, toDateOrNull } from '@/lib/firebase/timestamp-utils'
import { getTripStatus } from '@/lib/utils/trip-status'

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

/**
 * ユーザーがアクセス可能なTripを取得します
 * 
 * 所有Tripと共有Tripの両方を取得し、マージしてソートします。
 * 
 * @param userId - ユーザーID
 * @param options - オプション
 * @param options.includeShared - 共有Tripを含めるかどうか（デフォルト: true）
 * @param options.limit - 取得件数の上限（デフォルト: 20）
 * @param options.cursor - ページネーション用カーソル（オプション）
 * @param options.status - フィルタリング用のTripステータス（オプション）
 * @param options.accessLevel - フィルタリング用のアクセスレベル（オプション）
 * @param db - Firestoreインスタンス（テスト環境で使用、省略可）
 * @returns Tripのリストと次のカーソル
 */
export async function getAccessibleTrips(
  userId: string,
  options: {
    includeShared?: boolean
    limit?: number
    cursor?: string
    status?: TripStatus
    accessLevel?: 'private' | 'shared' | 'public'
  } = {},
  db?: Firestore
): Promise<{ trips: Trip[]; nextCursor?: string }> {
  const firestore = getFirestore(db)
  const { includeShared = true, limit = 20, cursor, status, accessLevel } = options

  // カーソルのデコード
  let cursorDate: Date | null = null
  let cursorTripId: string | null = null
  if (cursor) {
    const decoded = decodeCursor(cursor)
    if (decoded) {
      cursorTripId = decoded.tripId
      cursorDate = new Date(decoded.sortValue)
    }
  }

  // 所有Tripを取得
  // カーソルがある場合は、カーソルより古い（created_at < cursorDate）Tripを取得
  let ownedTripsQuery = firestore
    .collection(COLLECTIONS.TRIPS)
    .where('user_id', '==', userId)
    .orderBy('created_at', 'desc')

  if (cursorDate && cursorTripId) {
    // カーソルドキュメントを取得してstartAfterでページネーション
    const cursorDoc = await firestore.collection(COLLECTIONS.TRIPS).doc(cursorTripId).get()
    if (cursorDoc.exists) {
      ownedTripsQuery = ownedTripsQuery.startAfter(cursorDoc) as typeof ownedTripsQuery
    }
  }

  ownedTripsQuery = ownedTripsQuery.limit(limit + 1) // 次のページがあるかを確認するため+1

  const ownedSnapshot = await ownedTripsQuery.get()
  const ownedTrips: Trip[] = ownedSnapshot.docs.map((doc) => {
    const data = doc.data()
    return convertStandardDates({
      id: doc.id,
      ...data,
    }) as Trip
  })

  // 共有Tripを取得（includeSharedがtrueの場合）
  let sharedTrips: Trip[] = []
  if (includeShared) {
    // trip_usersコレクションから共有TripのIDを取得
    const sharedTripUsersSnapshot = await firestore
      .collection(COLLECTIONS.TRIP_USERS)
      .where('user_id', '==', userId)
      .get()

    const sharedTripIds = sharedTripUsersSnapshot.docs.map((doc) => doc.data().trip_id as string)

    if (sharedTripIds.length > 0) {
      // 共有Tripの実体を取得
      // 注意: Firestoreの `in` クエリは最大10件までなので、バッチ処理が必要な場合がある
      const batches: string[][] = []
      for (let i = 0; i < sharedTripIds.length; i += 10) {
        batches.push(sharedTripIds.slice(i, i + 10))
      }

      const sharedTripsPromises = batches.map(async (batch) => {
        const tripDocs = await Promise.all(
          batch.map((tripId) => firestore.collection(COLLECTIONS.TRIPS).doc(tripId).get())
        )

        return tripDocs
          .filter((doc) => doc.exists)
          .map((doc) => {
            const data = doc.data()!
            return convertStandardDates({
              id: doc.id,
              ...data,
            }) as Trip
          })
      })

      const sharedTripsArrays = await Promise.all(sharedTripsPromises)
      sharedTrips = sharedTripsArrays.flat()
    }
  }

  // 所有Tripと共有Tripをマージ
  const allTripsMap = new Map<string, Trip>()
  
  // 所有Tripを追加
  ownedTrips.forEach((trip) => {
    allTripsMap.set(trip.id, trip)
  })

  // 共有Tripを追加（重複は上書きされない）
  sharedTrips.forEach((trip) => {
    if (!allTripsMap.has(trip.id)) {
      allTripsMap.set(trip.id, trip)
    }
  })

  let allTrips = Array.from(allTripsMap.values())

  // カーソルベースのフィルタリング
  if (cursorDate && cursorTripId) {
    allTrips = allTrips.filter((trip) => {
      const tripCreatedAt = toDateOrNull(trip.created_at)
      if (!tripCreatedAt) return false

      // 同じ日時の場合はIDで比較
      if (tripCreatedAt.getTime() === cursorDate!.getTime()) {
        return trip.id !== cursorTripId
      }

      // created_at がカーソルより前（古い）のものは除外
      return tripCreatedAt.getTime() < cursorDate!.getTime()
    })
  }

  // フィルタリング（status）
  if (status) {
    // statusは計算プロパティなので、getTripStatusヘルパーを使用
    allTrips = allTrips.filter((trip) => {
      return getTripStatus(trip) === status
    })
  }

  // フィルタリング（accessLevel）
  if (accessLevel) {
    if (accessLevel === 'private') {
      allTrips = allTrips.filter((trip) => trip.access_level === 'private' || trip.access_level === 'shared')
    } else if (accessLevel === 'public') {
      allTrips = allTrips.filter((trip) => trip.access_level === 'public')
    } else if (accessLevel === 'shared') {
      // 共有Tripのみ（所有Tripを除外）
      const sharedTripIdsSet = new Set(sharedTrips.map((t) => t.id))
      allTrips = allTrips.filter((trip) => {
        return trip.user_id !== userId && sharedTripIdsSet.has(trip.id)
      })
    }
  }

  // created_at でソート（降順）
  allTrips.sort((a, b) => {
    const aDate = toDateOrNull(a.created_at)
    const bDate = toDateOrNull(b.created_at)
    if (!aDate || !bDate) return 0
    return bDate.getTime() - aDate.getTime()
  })

  // リミット適用
  const hasMore = allTrips.length > limit
  const trips = allTrips.slice(0, limit)

  // 次のカーソルを生成
  const nextCursor =
    hasMore && trips.length > 0
      ? (() => {
          const lastCreatedAt = toDateOrNull(trips[trips.length - 1].created_at)
          return lastCreatedAt
            ? encodeCursor(trips[trips.length - 1].id, lastCreatedAt)
            : undefined
        })()
      : undefined

  logger.debug('Accessible trips fetched', {
    userId,
    includeShared,
    count: trips.length,
    hasMore,
    nextCursor: nextCursor ? 'present' : 'none',
    filters: { status, accessLevel },
  })

  return {
    trips,
    ...(nextCursor && { nextCursor }),
  }
}

