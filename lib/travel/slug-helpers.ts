/**
 * スラッグベースのデータ取得ヘルパー
 * userSlug/tripSlug から trip データを取得する機能
 */

import { getFirestore, collection, query, where, getDocs, doc, getDoc, orderBy } from 'firebase/firestore'
import type { Trip, User, PlacesCache, Itinerary } from '../core/types'
import { COLLECTIONS } from '@/lib/firebase/firestore'
import { placesCacheManager } from '@/lib/travel/places-cache'
import logger from '@/lib/core/logger'
import { convertStandardDates, toDateOrNull } from '@/lib/firebase/timestamp-utils'

/**
 * userSlug から user データを取得
 * @param userSlug ユーザーのスラッグ
 * @returns ユーザーデータまたはnull
 */
export async function getUserBySlug(userSlug: string): Promise<User | null> {
  const db = getFirestore()
  const usersRef = collection(db, 'users')
  const q = query(usersRef, where('slug', '==', userSlug))
  
  const querySnapshot = await getDocs(q)
  
  if (querySnapshot.empty) {
    return null
  }
  
  const userDoc = querySnapshot.docs[0]
  return convertStandardDates({
    id: userDoc.id,
    ...userDoc.data(),
  }) as User
}

/**
 * Retrieve a trip by its slug for a specific user, including resolved destination and per-day itineraries.
 *
 * Queries the trips collection for a document matching `tripSlug` and `userId`, converts Firestore timestamps to `Date`, resolves `destination_place` from the places cache when `destination_place_id` is present, loads all days for the trip ordered by `day_number`, and loads each day's itineraries ordered by `sort_number` (resolving each itinerary's `place_data` from the places cache when needed).
 *
 * @param tripSlug - The trip's slug
 * @param userId - The user's ID (google_id)
 * @returns The assembled `Trip` object including `days` and their `itineraries`, or `null` if no matching trip is found
 * @throws Propagates any error thrown while querying or reading from Firestore
 */
export async function getTripBySlug(tripSlug: string, userId: string): Promise<Trip | null> {
  const db = getFirestore()
  const tripsRef = collection(db, 'trips')
  const q = query(
    tripsRef, 
    where('slug', '==', tripSlug),
    where('user_id', '==', userId)
  )
  
  try {
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      return null
    }
    
    const tripDoc = querySnapshot.docs[0]
    const tripData = convertStandardDates({
      id: tripDoc.id,
      ...tripDoc.data(),
    }) as Trip

    // destination_place_id がある場合は places_cache から解決
    const destinationPlaceId: string | undefined = (tripDoc.data() as any).destination_place_id
    if (destinationPlaceId) {
      try {
        const destDoc = await getDoc(doc(db, COLLECTIONS.PLACES_CACHE, destinationPlaceId))
        if (destDoc.exists()) {
          ;(tripData as any).destination_place = destDoc.data() as PlacesCache
        }
      } catch {}
    }

    // Daysを取得
    const daysRef = collection(db, 'days')
    const daysQuery = query(
      daysRef,
      where('trip_id', '==', tripDoc.id),
      orderBy('day_number', 'asc')
    )
    
    const daysSnapshot = await getDocs(daysQuery)
    const days = daysSnapshot.docs.map(doc => {
      const data = doc.data()
      return convertStandardDates({
        id: doc.id,
        ...data,
      })
    }).sort((a: any, b: any) => (a.day_number || 0) - (b.day_number || 0)) // day_number順でソート

    // 各DayのItinerariesを取得
    const daysWithItineraries = await Promise.all(
      days.map(async (day) => {
        const itinerariesRef = collection(db, 'itineraries')
        const itinerariesQuery = query(
          itinerariesRef,
          where('day_id', '==', day.id),
          orderBy('sort_number', 'asc')
        )
        
        const itinerariesSnapshot = await getDocs(itinerariesQuery)
        
        // デバッグ用ログ
        logger.debug(`Day ${day.id} itineraries sort_numbers:`, itinerariesSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          title: doc.data().title, 
          sort_number: doc.data().sort_number 
        })))
        
        const itineraries = (await Promise.all(itinerariesSnapshot.docs.map(async (docSnap) => {
          const data = docSnap.data() as Itinerary & { place_id?: string }
          const itineraryBase: any = convertStandardDates({
            ...data,
            id: docSnap.id, // 確実にdocSnap.idを使用するため最後に定義
          })

          // place_id がある場合は常に places_cache を優先的に解決し、
          // 見つからない場合のみ既存の place_data をフォールバックとして利用する
          if ((data as any).place_id) {
            try {
              const cacheDoc = await getDoc(doc(db, COLLECTIONS.PLACES_CACHE, (data as any).place_id))
              if (cacheDoc.exists()) {
                const placesCache = cacheDoc.data() as any
                // PlacesCacheからPlaceDataに変換（メタデータを除外）
                itineraryBase.place_data = {
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
                logger.debug(`Resolved place_data for "${data.title}" from cache`)
              } else {
                logger.debug(`PlacesCache not found for place_id: ${(data as any).place_id}`)
                if ((data as any).place_data) {
                  // キャッシュに無い場合は既存の place_data を使用（後方互換）
                  itineraryBase.place_data = (data as any).place_data
                  logger.debug(`Using fallback place_data for "${data.title}"`)
                } else {
                  // フォールバックもない場合、APIから取得してキャッシュ
                  logger.info(`Fetching place_data from API for "${data.title}"`)
                  try {
                    const fetchedPlaceData = await placesCacheManager.fetchAndCachePlace((data as any).place_id)
                    if (fetchedPlaceData) {
                      // PlacesCacheからPlaceDataに変換
                      itineraryBase.place_data = {
                        place_id: fetchedPlaceData.place_id,
                        name: fetchedPlaceData.name,
                        formatted_address: fetchedPlaceData.formatted_address,
                        geometry: fetchedPlaceData.geometry,
                        address_components: fetchedPlaceData.address_components,
                        photos: fetchedPlaceData.photos,
                        rating: fetchedPlaceData.rating,
                        user_ratings_total: fetchedPlaceData.user_ratings_total,
                        price_level: fetchedPlaceData.price_level,
                        types: fetchedPlaceData.types,
                        opening_hours: fetchedPlaceData.opening_hours,
                        international_phone_number: fetchedPlaceData.international_phone_number,
                        website: fetchedPlaceData.website,
                        editorial_summary: fetchedPlaceData.editorial_summary,
                      }
                      logger.info(`Fetched and cached place_data for "${data.title}"`)
                    } else {
                      logger.warn(`Failed to fetch place_data for "${data.title}"`)
                    }
                  } catch (error) {
                    logger.error(`Error fetching place_data for "${data.title}":`, error)
                  }
                }
              }
            } catch (error) {
              logger.error(`Failed to resolve place_data for "${data.title}":`, error)
              // 取得失敗時も既存の place_data をフォールバック
              if ((data as any).place_data) {
                itineraryBase.place_data = (data as any).place_data
                logger.debug(`Using fallback place_data after error`)
              }
            }
          } else if ((data as any).place_data) {
            // place_id が無い古いデータ向け
            itineraryBase.place_data = (data as any).place_data
            logger.debug(`Using legacy place_data (no place_id)`)
          }

          return itineraryBase
        }))).sort((a: any, b: any) => (a.sort_number || 0) - (b.sort_number || 0)) // sort_number順でソート

        return {
          ...day,
          itineraries
        }
      })
    )

    return {
      ...tripData,
      days: daysWithItineraries
    } as Trip
  } catch (error) {
    logger.error('❌ getTripBySlug: Query failed', error)
    throw error
  }
}

/**
 * userSlug と tripSlug から trip データを取得（完全版）
 * @param userSlug ユーザーのスラッグ
 * @param tripSlug 旅行のスラッグ
 * @returns 旅行データ（creator情報付き）またはnull
 */
export async function getTripBySlugs(userSlug: string, tripSlug: string): Promise<Trip | null> {
  logger.debug('getTripBySlugs called:', { userSlug, tripSlug })
  
  // 1. userSlug から user を取得
  const user = await getUserBySlug(userSlug)
  if (!user) {
    logger.error('User not found:', { userSlug })
    return null
  }
  
  logger.debug('User found:', { userId: user.google_id, userName: user.name })
  
  // 2. tripSlug と user.google_id から trip を取得
  const trip = await getTripBySlug(tripSlug, user.google_id)
  if (!trip) {
    logger.error('Trip not found:', { tripSlug, userId: user.google_id })
    return null
  }
  
  logger.debug('Trip found:', { tripId: trip.id, tripTitle: trip.title })
  
  // 3. creator情報を追加
  return {
    ...trip,
    creator: user
  }
}

/**
 * tripId から userSlug と tripSlug を取得（リダイレクト用）
 * @param tripId 旅行ID
 * @returns { userSlug, tripSlug } または null
 */
export async function getSlugsFromTripId(tripId: string): Promise<{ userSlug: string; tripSlug: string } | null> {
  const db = getFirestore()
  
  // 1. trip を取得
  const tripRef = doc(db, 'trips', tripId)
  const tripDoc = await getDoc(tripRef)
  
  if (!tripDoc.exists()) {
    return null
  }
  
  const trip = tripDoc.data() as Trip
  
  // 2. user を取得（user_idはgoogle_idなので、whereクエリを使用）
  const usersRef = collection(db, 'users')
  const userQuery = query(usersRef, where('google_id', '==', trip.user_id))
  const userQuerySnapshot = await getDocs(userQuery)
  
  if (userQuerySnapshot.empty) {
    return null
  }
  
  const userDoc = userQuerySnapshot.docs[0]
  const user = userDoc.data() as User
  
  // 3. スラッグが存在するかチェック
  if (!user.slug || !trip.slug) {
    return null
  }
  
  return {
    userSlug: user.slug,
    tripSlug: trip.slug
  }
}

/**
 * ユーザーの全旅行のスラッグ一覧を取得
 * @param userId ユーザーID
 * @returns 旅行スラッグの配列
 */
export async function getUserTripSlugs(userId: string): Promise<string[]> {
  const db = getFirestore()
  const tripsRef = collection(db, 'trips')
  const q = query(tripsRef, where('user_id', '==', userId))
  
  const querySnapshot = await getDocs(q)
  
  return querySnapshot.docs
    .map(doc => doc.data().slug)
    .filter(slug => slug) // slugが存在するもののみ
}

/**
 * 全ユーザーのスラッグ一覧を取得
 * @returns ユーザースラッグの配列
 */
export async function getAllUserSlugs(): Promise<string[]> {
  const db = getFirestore()
  const usersRef = collection(db, 'users')
  const q = query(usersRef, where('slug', '!=', null))
  
  const querySnapshot = await getDocs(q)
  
  return querySnapshot.docs
    .map(doc => doc.data().slug)
    .filter(slug => slug) // slugが存在するもののみ
}
