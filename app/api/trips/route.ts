import { NextRequest, NextResponse } from 'next/server'
import { adminTripOperations, adminDayOperations, adminUserOperations } from '@/lib/firebase/admin-operation'
import { adminAuth } from '@/lib/firebase/admin'
import { groupTripsByCountry } from '@/lib/travel/country/utils'
import { generateUniqueSlug } from '@/lib/utils/slug'
import { adminDb } from '@/lib/firebase/admin'
import { COLLECTIONS } from '@/lib/firebase/firestore'
import type { PlaceData, SupportedLanguage, Trip, PlacesCacheInput } from '@/lib/core/types'
import { getUserLanguage } from '@/lib/utils/language'
import logger from '@/lib/core/logger'
import { resolveDestinationPlace } from '@/lib/api/places-cache'

// API応答用の拡張型（destination_placeを含む）
interface TripWithDestination extends Trip {
  destination_place?: PlaceData
}

/**
 * Retrieve trips for the authenticated user, optionally grouped by country.
 *
 * Expects an Authorization header with a Bearer ID token and an optional
 * query parameter `groupByCountry=true` to enable grouping.
 *
 * @param request - The incoming HTTP request containing authorization and query parameters
 * @returns When `groupByCountry` is `true`, an object with `trips` as an array of country groups, `grouped: true`, `totalTrips`, and `totalCountries`; otherwise an object with `trips` as an array of trip records
 */
export async function GET(request: NextRequest) {
  try {
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
    const groupByCountry = searchParams.get('groupByCountry') === 'true'

    const trips = await adminTripOperations.getTripsByUserId(userId)

    // Get user info to determine language preference
    const user = await adminUserOperations.getUserByGoogleId(userId)
    const userLanguage = user ? getUserLanguage(user) : 'en'

    // Enrich trips: resolve destination_place from places_cache when available
    const tripsWithDetails = await Promise.all(
      trips.map(async (trip): Promise<TripWithDestination> => {
        let destinationPlace: PlaceData | undefined = undefined

        // destination_place 解決
        try {
          if (trip.destination_place_id) {
            destinationPlace = await resolveDestinationPlace(trip.destination_place_id, userLanguage) || undefined
          }
        } catch (error) {
          logger.error('Error resolving destination_place for trip', error, { tripId: trip.id })
        }

        return {
          ...trip,
          ...(destinationPlace ? { destination_place: destinationPlace } : {})
        }
      })
    )

    if (groupByCountry) {
      // Group trips by country
      const countryGroups = await groupTripsByCountry(tripsWithDetails)
      return NextResponse.json({ 
        trips: countryGroups,
        grouped: true,
        totalTrips: tripsWithDetails.length,
        totalCountries: countryGroups.length
      })
    }

    return NextResponse.json({ trips: tripsWithDetails })
  } catch (error) {
    logger.error('Error fetching trips', error)
    return NextResponse.json(
      { error: 'Failed to fetch trips' },
      { status: 500 }
    )
  }
}

/**
 * Create a new trip for the authenticated user, optionally create per-day records, and return the created trip enriched with creator and cached destination_place data when available.
 *
 * Requires a Bearer ID token in the Authorization header. The request body may include title, destination, destinationPlace or destinationPlaceId, startDate/endDate (to create days), description, accessLevel, and imageUrl.
 *
 * @param request - The incoming NextRequest containing the Authorization header and JSON body for the new trip.
 * @returns A NextResponse containing the created trip object on success. Returns a JSON error with status 401 for missing/invalid authorization, 400 if both title and destination are missing, and 500 for other server errors.
 */
export async function POST(request: NextRequest) {
  try {
    logger.debug('Starting trip creation')
    
    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.debug('Missing authorization header')
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
    }

    const idToken = authHeader.split('Bearer ')[1]
    
    // Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    const userId = decodedToken.uid
    
    logger.debug('User authenticated', { userId })

    const body = await request.json()
    
    logger.debug('Trip creation request', {
      title: body.title,
      destination: body.destination,
      hasImageUrl: !!body.imageUrl,
      accessLevel: body.accessLevel
    })
    
    const {
      title,
      description,
      destination,
      destinationPlace,
      destinationPlaceId,
      startDate,
      endDate,
      accessLevel = 'private',
      imageUrl
    } = body

    // タイトルが空の場合は目的地を使用
    const finalTitle = title || destination
    if (!finalTitle) {
      logger.debug('Title or destination is required but not provided')
      return NextResponse.json(
        { error: 'Title or destination is required' },
        { status: 400 }
      )
    }

    logger.debug('Getting existing trips for user', { userId })
    
    // ユーザーの既存旅行スラッグを取得
    const existingTrips = await adminTripOperations.getTripsByUserId(userId)
    const existingSlugs = existingTrips.map(t => t.slug).filter((slug): slug is string => Boolean(slug))
    
    logger.debug('Found existing trips', { 
      tripCount: existingTrips.length, 
      slugCount: existingSlugs.length 
    })
    
    // 旅行タイトルからユニークなスラッグを生成
    const tripSlug = generateUniqueSlug(finalTitle, existingSlugs)
    
    logger.debug('Generated trip slug', { tripSlug })

    logger.debug('Creating trip', {
      userId,
      title: finalTitle,
      slug: tripSlug,
      destination,
      hasDestinationPlace: !!destinationPlace,
      hasImageUrl: !!imageUrl
    })

    // Handle image URL: move from avatar path to trip path if needed
    let finalImageUrl = imageUrl
    // Check both encoded and decoded formats
    const isAvatarPath = imageUrl && (
      (imageUrl.includes('/users/') && imageUrl.includes('/avatar/')) ||
      (decodeURIComponent(imageUrl).includes('/users/') && decodeURIComponent(imageUrl).includes('/avatar/'))
    )
    if (isAvatarPath) {
      logger.info('Image URL is in avatar path, will move to trip path after creation', { imageUrl, userId })
      // Note: We'll move the image after trip creation since we need the tripId
    }

    // Create trip
    const tripData: any = {
      user_id: userId,
      title: finalTitle,
      slug: tripSlug,
      destination,
      access_level: accessLevel,
      status: 'PLANNING' as const
    }

    // オプショナルフィールドを条件付きで追加
    if (description) tripData.description = description
    // place_id 優先で保存（後方互換でオブジェクトも受ける）
    const resolvedDestPlaceId: string | undefined = destinationPlaceId || destinationPlace?.place_id
    if (resolvedDestPlaceId) tripData.destination_place_id = resolvedDestPlaceId
    if (startDate) tripData.start_date = new Date(startDate)
    if (endDate) tripData.end_date = new Date(endDate)
    if (finalImageUrl) tripData.image_url = finalImageUrl

    const trip = await adminTripOperations.createTrip(tripData)

    // Move image from avatar path to trip path if needed
    // Check both encoded and decoded formats
    const shouldMoveImage = finalImageUrl && (
      (finalImageUrl.includes('/users/') && finalImageUrl.includes('/avatar/')) ||
      (decodeURIComponent(finalImageUrl).includes('/users/') && decodeURIComponent(finalImageUrl).includes('/avatar/'))
    )
    if (shouldMoveImage) {
      try {
        logger.info('Moving image from avatar path to trip path:', { 
          oldImageUrl: finalImageUrl, 
          tripId: trip.id 
        })
        const newImageUrl = await adminTripOperations.moveImageToTripPath(finalImageUrl, trip.id)
        logger.info('Image moved successfully, updating trip:', { 
          oldImageUrl: finalImageUrl, 
          newImageUrl, 
          tripId: trip.id 
        })
        
        // Update trip with new image URL
        await adminDb.collection(COLLECTIONS.TRIPS).doc(trip.id).update({
          image_url: newImageUrl,
          updated_at: new Date()
        })
        
        trip.image_url = newImageUrl
        finalImageUrl = newImageUrl
      } catch (error) {
        logger.error('Failed to move image to trip path:', { 
          error, 
          oldImageUrl: finalImageUrl, 
          tripId: trip.id 
        })
        // Continue with trip creation even if image move fails
        // The image will remain in the avatar path, but trip will still be created
      }
    }

    logger.info('Trip created successfully', { tripId: trip.id })

    // Create days if start and end dates are provided
    if (startDate && endDate) {
      logger.debug('Creating days for trip', { tripId: trip.id })
      await createDaysForTrip(trip.id, startDate, endDate)
      logger.debug('Days created successfully')
    }

    logger.debug('Fetching user data for creator info')
    
    // 最新のユーザー情報を取得してcreator情報を追加
    const user = await adminUserOperations.getUserByGoogleId(userId)
    if (user) {
      trip.creator = user
      logger.debug('Creator info added', { userSlug: user.slug })
    } else {
      logger.warn('User not found for creator info', { userId })
    }

    // UI利便性のため、destination_place を解決して返す
    try {
      if (resolvedDestPlaceId) {
        // 新形式でのキャッシュ検索: {place_id}_{language}
        // ユーザーの言語設定を取得
        const userLanguage = user ? getUserLanguage(user) : 'ja'
        const cacheKey = `${resolvedDestPlaceId}_${userLanguage}`
        
        const cacheDoc = await adminDb.collection(COLLECTIONS.PLACES_CACHE).doc(cacheKey).get()
        if (cacheDoc.exists) {
          const tripWithDest = trip as TripWithDestination
          tripWithDest.destination_place = cacheDoc.data() as PlaceData
          await cacheDoc.ref.update({ last_accessed: new Date(), access_count: (cacheDoc.data().access_count || 0) + 1 }).catch(() => {})
        } else if (destinationPlace?.place_id) {
          // 受け取ったオブジェクトがあればキャッシュ保存
          const pd = destinationPlace as PlaceData
          // 新形式でのキャッシュ保存（言語対応）
          let cachePayload: PlacesCacheInput | null = null
          try {
            // ユーザーの言語設定を取得
            const language = user ? getUserLanguage(user) : 'ja'
            
            cachePayload = {
              format_version: '2.0.0', // 新バージョン
              place_id: pd.place_id,
              language: language, // 言語フィールド追加
              name: pd.name,
              formatted_address: pd.formatted_address,
              geometry: pd.geometry,
              cached_at: new Date(),
              last_accessed: new Date(),
              access_count: 1
            }
            if (pd.address_components) cachePayload.address_components = pd.address_components
            if (pd.photos) cachePayload.photos = pd.photos
            if (pd.rating !== undefined) cachePayload.rating = pd.rating
            if (pd.user_ratings_total !== undefined) cachePayload.user_ratings_total = pd.user_ratings_total
            if (pd.price_level !== undefined) cachePayload.price_level = pd.price_level
            if (pd.types) cachePayload.types = pd.types
            if (pd.opening_hours?.weekday_text) cachePayload.opening_hours = { weekday_text: pd.opening_hours.weekday_text }
            if (pd.international_phone_number) cachePayload.international_phone_number = pd.international_phone_number
            if (pd.website) cachePayload.website = pd.website
            if (pd.editorial_summary) cachePayload.editorial_summary = pd.editorial_summary
            
            // 新形式のドキュメントID: {place_id}_{language}
            const cacheKey = `${pd.place_id}_${language}`
            await adminDb.collection(COLLECTIONS.PLACES_CACHE).doc(cacheKey).set(cachePayload)
            logger.debug('Successfully saved to PlacesCache (NEW FORMAT)', { cacheKey })
          } catch (cacheError) {
            logger.error('Failed to save to PlacesCache (NEW FORMAT):', cacheError)
            // キャッシュ保存失敗は致命的ではない
          }
          
          // キャッシュ保存成功時のみdestination_placeを設定
          if (cachePayload) {
            const tripWithDest = trip as TripWithDestination
            tripWithDest.destination_place = cachePayload
          }
        }
      }
    } catch (e) {
      // best-effort
    }

    logger.info('Trip creation completed successfully')
    return NextResponse.json(trip)
  } catch (error) {
    logger.error('Error creating trip', error)
    return NextResponse.json(
      { error: 'Failed to create trip' },
      { status: 500 }
    )
  }
}

async function createDaysForTrip(tripId: string, startDate: string, endDate: string) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  let current = new Date(start)
  let dayNumber = 1

  while (current <= end) {
    await adminDayOperations.createDay({
      trip_id: tripId,
      day_number: dayNumber,
      date: new Date(current)
    })
    current.setDate(current.getDate() + 1)
    dayNumber++
  }
}