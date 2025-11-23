/**
 * Server Component用のTrip取得関数
 * 
 * Next.js Server Componentから直接FirestoreにアクセスしてTripを取得します。
 * 認証情報はオプションで、提供されない場合はpublicなTripのみ取得可能です。
 */

import { headers } from 'next/headers'
import { adminTripOperations, adminDayOperations, adminItineraryOperations, adminUserOperations } from '@/lib/firebase/admin-operation'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import { COLLECTIONS } from '@/lib/firebase/firestore'
import type { Trip, Day, Itinerary, PlaceData, PlacesCache, FirestoreDate } from '@/lib/core/types'
import { toDateOrNull } from '@/lib/firebase/timestamp-utils'
import logger from '@/lib/core/logger'
import { canViewTrip } from '@/lib/core/permissions'
import { asUserId } from '@/lib/core/types/identity'

interface TripWithDestination extends Omit<Trip, 'creator'> {
  destination_place?: PlaceData
  days?: Day[]
  creator?: {
    id: string
    name: string
    email: string
    avatar_url?: string
    slug?: string
  } | null
}

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

/**
 * Server Componentから認証済みユーザーIDを取得
 * 
 * Next.js Server Componentでは、headers()を使用してAuthorizationヘッダーを読み取ることができます。
 * ただし、通常のブラウザリクエストではAuthorizationヘッダーは送信されないため、
 * この関数は主にAPI Routeからのリクエストや、Middleware経由のリクエストで使用されます。
 * 
 * @returns 認証済みユーザーのdocument ID、またはnull（未認証の場合）
 */
async function getAuthenticatedUserId(): Promise<string | null> {
  try {
    const headersList = await headers()
    const authHeader = headersList.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const idToken = authHeader.split('Bearer ')[1]
    if (!idToken) {
      return null
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken).catch(() => null)
    if (!decodedToken) {
      return null
    }

    const userId = decodedToken.uid
    const user = await adminUserOperations.getUserByAuthUid(userId).catch(() => null)
    if (!user) {
      return null
    }

    return user.id
  } catch (error) {
    logger.debug('Failed to verify ID token in Server Component', error)
    return null
  }
}

/**
 * Server Component用のTrip取得関数
 * 
 * @param tripSlug - TripのslugまたはID
 * @param options - オプション
 * @param options.userId - 認証済みユーザーのdocument ID（省略時は自動取得を試みる）
 * @returns Trip with days, itineraries, destination_place, and creator
 */
export async function getTripServer(
  tripSlug: string,
  options?: { userId?: string | null }
): Promise<TripWithDestination | null> {
  try {
    // Resolve trip by slug or id
    const resolved = await adminTripOperations.resolveTripByIdOrSlug(tripSlug)
    if (!resolved) {
      return null
    }
    
    const { id: tripId, trip } = resolved
    
    // 認証チェック（認証済みユーザーのIDを取得）
    let userDocumentId: string | null = null
    if (options?.userId !== undefined) {
      userDocumentId = options.userId
    } else {
      userDocumentId = await getAuthenticatedUserId()
    }
    
    // 閲覧権限チェック
    const userIdTyped = userDocumentId ? asUserId(userDocumentId) : null
    if (!canViewTrip(trip, userIdTyped)) {
      return null // 権限がない場合はnullを返す（403エラーはClient側で処理）
    }
    
    // destination_place を places_cache から解決
    let tripWithDest: TripWithDestination = trip
    try {
      if (trip.destination_place_id && !tripWithDest.destination_place) {
        const fallbackLanguages = ['en', 'ja']
        for (const lang of fallbackLanguages) {
          const cacheKey = `${trip.destination_place_id}_${lang}`
          const cacheDoc = await adminDb.collection(COLLECTIONS.PLACES_CACHE).doc(cacheKey).get()
          if (cacheDoc.exists) {
            const placesCache = cacheDoc.data() as PlacesCache
            tripWithDest.destination_place = {
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
              opening_hours: placesCache.opening_hours,
              international_phone_number: placesCache.international_phone_number,
              website: placesCache.website,
              editorial_summary: placesCache.editorial_summary,
            }
            break
          }
        }
      }
    } catch (error) {
      logger.error('Failed to resolve destination_place', error)
    }
    
    // Get days for this trip
    const days = await adminDayOperations.getDaysByTripId(tripId)
    
    // Get itineraries for each day
    const daysWithItineraries = await Promise.all(
      days.map(async (day) => {
        const rawItineraries = await adminItineraryOperations.getItinerariesByDayId(day.id)
        // 各 itinerary の place_data を places_cache から解決
        const itineraries = await Promise.all(
          rawItineraries.map(async (it: any) => {
            if (it.place_id) {
              try {
                const preferredLanguage = 'en'
                const fallbackLanguages = ['en', 'ja']
                
                let placesCache: PlacesCache | null = null
                for (const lang of fallbackLanguages) {
                  const cacheKey = `${it.place_id}_${lang}`
                  try {
                    const cacheDoc = await adminDb.collection(COLLECTIONS.PLACES_CACHE).doc(cacheKey).get()
                    if (cacheDoc.exists) {
                      placesCache = cacheDoc.data() as PlacesCache
                      break
                    }
                  } catch (error) {
                    logger.debug(`Failed to fetch PlacesCache with key: ${cacheKey}`, error)
                  }
                }
                
                if (placesCache) {
                  it.place_data = {
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
                    opening_hours: placesCache.opening_hours,
                    international_phone_number: placesCache.international_phone_number,
                    website: placesCache.website,
                    editorial_summary: placesCache.editorial_summary,
                  }
                } else if (!it.place_data) {
                  logger.warn('PlacesCache not found for itinerary', {
                    itineraryId: it.id,
                    placeId: it.place_id,
                    triedKeys: fallbackLanguages.map(lang => `${it.place_id}_${lang}`)
                  })
                }
              } catch (error) {
                logger.error('Failed to resolve place_data for itinerary', error, { itineraryId: it.id })
              }
            } else if (it.place_data && typeof it.place_data === 'object' && 'toDate' in it.place_data) {
              // Firestore Timestampが残っている場合は変換
              logger.debug('Converting Firestore Timestamp in place_data', { itineraryId: it.id })
            }
            
            return {
              ...it,
              start_time: toDateOrNull(it.start_time),
              end_time: toDateOrNull(it.end_time),
            } as Itinerary
          })
        )
        
        return {
          ...day,
          date: toDateOrNull(day.date),
          itineraries,
        } as Day
      })
    )
    
    tripWithDest.days = daysWithItineraries
    
    // Get creator info
    try {
      if (trip.user_id) {
        const creatorDoc = await adminDb.collection(COLLECTIONS.USERS).doc(trip.user_id).get()
        if (creatorDoc.exists) {
          const creatorData = creatorDoc.data()
          tripWithDest.creator = {
            id: creatorDoc.id,
            name: creatorData?.name || 'Unknown',
            email: creatorData?.email || '',
            avatar_url: creatorData?.avatar_url,
            slug: creatorData?.slug,
          }
        } else {
          tripWithDest.creator = null
        }
      } else {
        tripWithDest.creator = null
      }
    } catch (error) {
      logger.error('Failed to fetch creator info', error)
      tripWithDest.creator = null
    }
    
    return tripWithDest
  } catch (error) {
    logger.error('Failed to get trip in Server Component', error)
    return null
  }
}

