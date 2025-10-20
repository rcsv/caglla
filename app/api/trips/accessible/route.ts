import { NextRequest, NextResponse } from 'next/server'
import { adminTripOperations, adminTripUserOperations, adminUserOperations } from '@/lib/firebase/admin-operation'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import { COLLECTIONS } from '@/lib/firebase/firestore'
import { getPlaceFromCacheWithFallback } from '@/lib/api/places-cache'
import { getUserLanguage } from '@/lib/utils/language'
import type { Trip, User, PlacesCache } from '@/lib/core/types'
import logger from '@/lib/core/logger'

// 動的レンダリングを強制（request.headersを使用するため）
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Check if Firebase Admin SDK is initialized
    if (!adminAuth || !adminDb) {
      logger.warn('Firebase Admin SDK not initialized, returning empty trips')
      return NextResponse.json({ trips: [] })
    }

    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
    }

    const idToken = authHeader.split('Bearer ')[1]
    
    // Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    const userId = decodedToken.uid

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
      trips.map(async (trip) => {
        let creator: User | undefined
        let destinationPlace = (trip as any).destination_place

        // creator 情報
        try {
          creator = await adminUserOperations.getUserByGoogleId(trip.user_id) || undefined
        } catch (error) {
          logger.error('Error fetching creator for trip', error, { tripId: trip.id })
        }

        // destination_place 解決（言語サフィックス対応でPlaces Cacheから取得）
        try {
          const anyTrip: any = trip as any
          if (!destinationPlace && anyTrip.destination_place_id) {
            console.log('🔍 Resolving destination_place for trip:', {
              tripId: trip.id,
              destination_place_id: anyTrip.destination_place_id
            })
            
            // 言語サフィックス対応のフォールバック検索を使用
            const preferredLanguage = getUserLanguage() as any
            const placesCache = await getPlaceFromCacheWithFallback(
              anyTrip.destination_place_id, 
              preferredLanguage
            )
            
            console.log('🔍 Places Cache lookup result:', {
              found: !!placesCache,
              language: preferredLanguage,
              place_id: placesCache?.place_id,
              name: placesCache?.name,
              hasGeometry: !!placesCache?.geometry
            })
            
            if (placesCache) {
              destinationPlace = {
                place_id: placesCache.place_id,
                name: placesCache.name,
                formatted_address: placesCache.formatted_address,
                geometry: placesCache.geometry,
                address_components: placesCache.address_components,
                photos: placesCache.photos,
                rating: placesCache.rating,
                user_ratings_total: placesCache.user_ratings_total,
                price_level: placesCache.price_level,
                types: placesCache.types,
                opening_hours: placesCache.opening_hours as any,
                international_phone_number: placesCache.international_phone_number,
                website: placesCache.website,
                editorial_summary: placesCache.editorial_summary,
              }
              console.log('✅ Successfully resolved destination_place:', {
                place_id: destinationPlace.place_id,
                name: destinationPlace.name,
                geometry: destinationPlace.geometry
              })
            } else {
              console.log('❌ Places Cache not found for any language:', anyTrip.destination_place_id)
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
  } catch (error) {
    logger.error('Error fetching trips', error)
    return NextResponse.json(
      { error: 'Failed to fetch trips' },
      { status: 500 }
    )
  }
}
