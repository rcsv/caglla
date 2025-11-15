import { NextRequest, NextResponse } from 'next/server'
import { adminTripOperations } from '@/lib/firebase/admin-operation'
import { adminDb } from '@/lib/firebase/admin'
import type { Trip, FirestoreDate } from '@/lib/core/types'
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore'
import logger from '@/lib/core/logger'
import { withAuth, handleApiError } from '@/lib/core/error-handler'

/**
 * FirestoreDateをDateオブジェクトに変換
 */
function toDate(firestoreDate: FirestoreDate | undefined): Date | undefined {
  if (!firestoreDate) return undefined
  if (firestoreDate instanceof Date) return firestoreDate
  if (typeof firestoreDate === 'string') return new Date(firestoreDate)
  if ('toDate' in firestoreDate && typeof firestoreDate.toDate === 'function') {
    return firestoreDate.toDate()
  }
  return undefined
}

// 動的レンダリングを強制（request.headersを使用するため）
export const dynamic = 'force-dynamic'

export const GET = withAuth(async (request: NextRequest, auth) => {
  const { userId } = auth

  logger.debug('Recommended trips API called')
  logger.debug('ID token verified', { userId })

  // Check if Firebase Admin SDK is initialized
  if (!adminDb) {
    logger.warn('Firebase Admin SDK not initialized, returning empty recommended trips')
    return NextResponse.json({ trips: [] })
  }

  logger.debug('Firebase Admin SDK is initialized')

  // Get query parameters
  const { searchParams } = new URL(request.url)
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 6
  const excludeUserId = searchParams.get('excludeUserId') || userId

  // Get all public trips that are not created by the current user
  logger.debug('Fetching public trips from Firestore')
  const tripsSnapshot = await adminDb
    .collection('trips')
    .where('access_level', '==', 'public')
    .where('user_id', '!=', excludeUserId)
    .limit(limit * 3) // Get more to randomize
    .get()

  logger.debug('Public trips found', { count: tripsSnapshot.docs.length })

  const trips = tripsSnapshot.docs.map((doc: QueryDocumentSnapshot) => {
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      // Firestore TimestampをDateに変換
      start_date: toDate(data.start_date as FirestoreDate),
      end_date: toDate(data.end_date as FirestoreDate),
      created_at: toDate(data.created_at as FirestoreDate),
      updated_at: toDate(data.updated_at as FirestoreDate),
    }
  }) as Trip[]

  // N+1最適化: クリエイター情報を一括取得してマップ化
  const uniqueUserIds = Array.from(new Set(trips.map(t => t.user_id).filter(Boolean))) as string[]
  const creatorsMap = new Map<string, any>()
  // Firestore 'in' は最大10件ずつ
  for (let i = 0; i < uniqueUserIds.length; i += 10) {
    const batch = uniqueUserIds.slice(i, i + 10)
    try {
      const usersSnapshot = await adminDb
        .collection('users')
        .where('google_id', 'in', batch)
        .get()
      usersSnapshot.docs.forEach((doc: QueryDocumentSnapshot) => {
        const data = doc.data()
        creatorsMap.set(data.google_id, { id: doc.id, ...data })
      })
    } catch (error) {
      logger.error('Failed to batch fetch creators', error, { batchSize: batch.length })
    }
  }

  // クリエイターマップを使って enrich
  const enrichedTrips = trips.map((trip) => {
    const creatorData = creatorsMap.get(trip.user_id)
    if (creatorData) {
      return {
        ...trip,
        creator: {
          id: creatorData.id,
          google_id: creatorData.google_id,
          name: creatorData.name,
          slug: creatorData.slug,
          avatar_url: creatorData.avatar_url,
          created_at: creatorData.created_at,
          updated_at: creatorData.updated_at
        }
      }
    }
    return trip
  })

  // Shuffle and limit
  const shuffledTrips = enrichedTrips.sort(() => Math.random() - 0.5)
  const limitedTrips = shuffledTrips.slice(0, limit)

  // Log each trip to debug slug data
  limitedTrips.forEach((trip, index) => {
    logger.debug(`Trip ${index}:`, {
      id: trip.id,
      slug: trip.slug,
      creatorSlug: trip.creator?.slug,
      hasCreator: !!trip.creator
    })
  })

  logger.debug('Returning recommended trips', { count: limitedTrips.length })
  return NextResponse.json({ trips: limitedTrips })
})
