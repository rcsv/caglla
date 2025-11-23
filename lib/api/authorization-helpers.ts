/**
 * API Route用の認可チェックヘルパー関数
 * 所有権チェックなどの認可ロジックを共通化
 */

import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { adminTripOperations } from '@/lib/firebase/admin-operation'
import { COLLECTIONS } from '@/lib/firebase/firestore'
import type { Trip } from '@/lib/core/types'
import { notFound, badRequest, createForbiddenError } from '@/lib/core/error-handler'
import { checkTripOwnership } from './trip-ownership-helpers'

/**
 * Trip所有権チェックの結果型
 */
export interface TripOwnershipResult {
  tripId: string
  trip: Trip
}

/**
 * Day所有権チェックの結果型
 */
export interface DayOwnershipResult {
  dayId: string
  tripId: string
  trip: Trip
}

/**
 * tripSlugからtripを解決し、所有権をチェック
 * 
 * @param tripSlug - TripのIDまたはslug
 * @param userId - 認証済みユーザーID
 * @returns TripデータとtripId、またはエラーレスポンス
 * 
 * @example
 * ```typescript
 * const ownership = await validateTripOwnership(tripSlug, userId)
 * if (ownership instanceof NextResponse) {
 *   return ownership // エラーレスポンスをそのまま返す
 * }
 * const { tripId, trip } = ownership
 * // 所有権確認済みのtripを使用
 * ```
 */
export async function validateTripOwnership(
  tripSlug: string,
  userId: string
): Promise<TripOwnershipResult | NextResponse> {
  // Tripを解決（IDまたはslugから）
  const resolved = await adminTripOperations.resolveTripByIdOrSlug(tripSlug)
  if (!resolved) {
    return notFound('Trip')
  }

  const { id: tripId, trip } = resolved

  // 所有権チェック（trip.user_id と userId (Firebase Auth UID) の両方をサポート）
  const hasOwnership = await checkTripOwnership(trip, userId)
  if (!hasOwnership) {
    throw createForbiddenError('You do not own this trip')
  }

  return { tripId, trip }
}

/**
 * day_idからtripを取得し、所有権をチェック
 * 
 * @param dayId - DayのドキュメントID
 * @param userId - 認証済みユーザーID
 * @returns Dayデータ、Tripデータ、dayId、またはエラーレスポンス
 * 
 * @example
 * ```typescript
 * const ownership = await validateDayOwnership(dayId, userId)
 * if (ownership instanceof NextResponse) {
 *   return ownership // エラーレスポンスをそのまま返す
 * }
 * const { dayId, tripId, trip } = ownership
 * // 所有権確認済みのtripを使用
 * ```
 */
export async function validateDayOwnership(
  dayId: string,
  userId: string
): Promise<DayOwnershipResult | NextResponse> {
  // Dayを取得
  const dayDoc = await adminDb.collection(COLLECTIONS.DAYS).doc(dayId).get()
  if (!dayDoc.exists) {
    return notFound('Day')
  }

  const dayData = dayDoc.data()
  if (!dayData?.trip_id) {
    return badRequest('Day has no trip_id')
  }

  // Tripを取得
  const tripDoc = await adminDb.collection(COLLECTIONS.TRIPS).doc(dayData.trip_id).get()
  if (!tripDoc.exists) {
    return notFound('Trip')
  }

  const tripData = { id: tripDoc.id, ...tripDoc.data() } as Trip

  // 所有権チェック（trip.user_id と userId (Firebase Auth UID) の両方をサポート）
  const hasOwnership = await checkTripOwnership(tripData, userId)
  if (!hasOwnership) {
    throw createForbiddenError('You do not own this trip')
  }

  return {
    dayId,
    tripId: dayData.trip_id,
    trip: tripData
  }
}

