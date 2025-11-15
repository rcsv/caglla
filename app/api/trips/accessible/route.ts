import { NextRequest, NextResponse } from 'next/server'
import { adminTripOperations, adminTripUserOperations, adminUserOperations } from '@/lib/firebase/admin-operation'
import { adminDb } from '@/lib/firebase/admin'
import { COLLECTIONS } from '@/lib/firebase/firestore'
import { resolveDestinationPlace } from '@/lib/api/places-cache'
import { getUserLanguage } from '@/lib/utils/language'
import type { Trip, User, PlacesCache, PlaceData } from '@/lib/core/types'
import logger from '@/lib/core/logger'
import { authApi } from '@/lib/api/middleware'

// API応答用の拡張型（destination_placeを含む）
interface TripWithDestination extends Trip {
  destination_place?: PlaceData
  creator?: User
}

// 動的レンダリングを強制（request.headersを使用するため）
export const dynamic = 'force-dynamic'

export const GET = authApi(async (request: NextRequest, ctx) => {
  const { userId } = ctx.auth!

  // Check if Firebase Admin SDK is initialized
  if (!adminDb) {
    logger.warn('Firebase Admin SDK not initialized, returning empty trips')
    return NextResponse.json({ trips: [] })
  }

  // Get query parameters
  const { searchParams } = new URL(request.url)
  const includeShared = searchParams.get('includeShared') === 'true'
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined

  let trips: Trip[] = []

  if (includeShared) {
    // Get trips where user is owner
    const ownedTrips = await adminTripOperations.getTripsByUserId(userId)
    
    // Get trips where user has access through trip_users
    const sharedTripUsers = await adminTripUserOperations.getTripsByUserId(userId)
    const sharedTripIds = sharedTripUsers.map(tu => tu.trip_id)
    
    // Get shared trips
    const sharedTrips = await Promise.all(
      sharedTripIds.map(async (tripId) => {
        try {
          return await adminTripOperations.getTripById(tripId)
        } catch (error) {
          logger.error('Error fetching shared trip', error, { tripId })
          return null
        }
      })
    )
    
    // Filter out null values and combine
    const validSharedTrips = sharedTrips.filter((trip): trip is Trip => trip !== null)
    trips = [...ownedTrips, ...validSharedTrips]
    
    // Remove duplicates (in case user is both owner and shared)
    const uniqueTrips = trips.filter((trip, index, self) => 
      index === self.findIndex(t => t.id === trip.id)
    )
    trips = uniqueTrips
  } else {
    // Only get owned trips
    trips = await adminTripOperations.getTripsByUserId(userId)
  }

  // Apply limit if specified
  if (limit && limit > 0) {
    trips = trips.slice(0, limit)
  }

  // Enrich trips: add creator and resolve destination_place from places_cache when available
  const tripsWithDetails = await Promise.all(
    trips.map(async (trip): Promise<TripWithDestination> => {
      let creator: User | undefined
      let destinationPlace: PlaceData | undefined = undefined

      // creator 情報（auth_uid で検索、後方互換性のため google_id もチェック）
      // Phase 1-1.5: 認証プロバイダーマルチ対応化
      try {
        creator = await adminUserOperations.getUserByAuthUid(trip.user_id) || undefined
      } catch (error) {
        logger.error('Error fetching creator for trip', error, { tripId: trip.id })
      }

      // destination_place 解決（共通化された関数を使用）
      try {
        if (!destinationPlace && trip.destination_place_id) {
          console.log('🔍 Resolving destination_place for trip:', {
            tripId: trip.id,
            destination_place_id: trip.destination_place_id
          })
          
          // サーバーサイドではユーザー情報が無いことが多いので、
          // 言語はデフォルトフォールバック戦略で決定（getUserLanguageはserverではDEFAULTを返すため使用しない）
          // 呼び出し側（クライアントや上位API）でユーザー言語を渡すのが望ましいが、
          // ここでは安全側として 'en' を優先（Places v1 のベースライン言語）
          const lang = 'en'
          destinationPlace = await resolveDestinationPlace(trip.destination_place_id, lang) || undefined
          
          console.log('🔍 Places Cache lookup result:', {
            found: !!destinationPlace,
            place_id: destinationPlace?.place_id,
            name: destinationPlace?.name,
            hasGeometry: !!destinationPlace?.geometry
          })
          
          if (destinationPlace) {
            console.log('✅ Successfully resolved destination_place:', {
              place_id: destinationPlace.place_id,
              name: destinationPlace.name,
              geometry: destinationPlace.geometry
            })
          } else {
            console.log('❌ Places Cache not found for any language:', trip.destination_place_id)
          }
        }
      } catch (error) {
        console.error('❌ Error resolving destination_place for trip:', error, { tripId: trip.id })
        logger.error('Error resolving destination_place for trip', error, { tripId: trip.id })
      }

      return {
        ...trip,
        ...(creator ? { creator } : {}),
        ...(destinationPlace ? { destination_place: destinationPlace } : {})
      }
    })
  )

  return NextResponse.json({ trips: tripsWithDetails })
})
