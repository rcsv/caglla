import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { adminTripOperations, adminDayOperations, adminUserOperations } from '@/lib/firebase/admin-operation'
import { adminDb } from '@/lib/firebase/admin'
import { groupTripsByCountry } from '@/lib/travel/country/utils'
import { generateUniqueSlug } from '@/lib/utils/slug'
import { COLLECTIONS } from '@/lib/firebase/firestore'
import type { PlaceData, SupportedLanguage, Trip, PlacesCacheInput } from '@/lib/core/types'
import { getUserLanguage } from '@/lib/utils/language'
import logger from '@/lib/core/logger'
import { resolveDestinationPlace } from '@/lib/api/places-cache'
import { COOKIE_NAME } from '@/lib/i18n/storage'
import { composeMiddleware } from '@/lib/core/middleware'
import { authApi, withAuth, withBodyValidation } from '@/lib/api/middleware'
import { CreateTripSchema } from '@/lib/schemas/trip'

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
export const GET = authApi(async (request: NextRequest, ctx) => {
  const { userId } = ctx.auth!

  // Firebase Auth UID から users コレクションのドキュメントIDを取得
  const user = await adminUserOperations.getUserByAuthUid(userId)
  if (!user) {
    logger.error('User not found', { authUid: userId })
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
  const userDocumentId = user.id

  // Get query parameters
  const { searchParams } = new URL(request.url)
  const groupByCountry = searchParams.get('groupByCountry') === 'true'

  const trips = await adminTripOperations.getTripsByUserId(userDocumentId)

  // Get user info to determine language preference（auth_uid で検索、後方互換性のため google_id もチェック）
  // Phase 1-1.5: 認証プロバイダーマルチ対応化
  // Note: user は既に35行目で取得済み
  const cookieLang = request.cookies.get(COOKIE_NAME)?.value ?? null
  const userLanguage = getUserLanguage(user ?? undefined, {
    serverOverride: cookieLang,
    serverCookies: request.cookies
  })

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
    const countryGroups = await groupTripsByCountry(tripsWithDetails, { language: userLanguage })
    return NextResponse.json({ 
      trips: countryGroups,
      grouped: true,
      totalTrips: tripsWithDetails.length,
      totalCountries: countryGroups.length
    })
  }

  return NextResponse.json({ trips: tripsWithDetails })
})

/**
 * Create a new trip for the authenticated user, optionally create per-day records, and return the created trip enriched with creator and cached destination_place data when available.
 *
 * Requires a Bearer ID token in the Authorization header. The request body may include title, destination, destinationPlace or destinationPlaceId, startDate/endDate (to create days), description, accessLevel, and imageUrl.
 *
 * @param request - The incoming NextRequest containing the Authorization header and JSON body for the new trip.
 * @returns A NextResponse containing the created trip object on success. Returns a JSON error with status 401 for missing/invalid authorization, 400 if both title and destination are missing, and 500 for other server errors.
 * 
 * **zod スキーマバリデーション + Context ミドルウェアで移行済み**
 * 
 * Before:
 * ```typescript
 * const body = await parseRequestBody<{...}>(request)
 * if (!finalTitle) {
 *   return badRequest('Title or destination is required')
 * }
 * if (isTemplate && !normalizedDayCount) {
 *   return badRequest('Template trips require a positive day count')
 * }
 * ```
 * 
 * After:
 * ```typescript
 * // ctx.body が型安全 & バリデ済み
 * // すべての if 文バリデーションが消える
 * ```
 */
export const POST = composeMiddleware(
  withAuth(),
  withBodyValidation(CreateTripSchema)
)(async (request: NextRequest, ctx) => {
  // ctx.auth, ctx.body が保証されている（型推論が効く）
  const { userId } = ctx.auth!
  
  // zod スキーマでバリデーション済み & 型推論
  type BodyType = z.infer<typeof CreateTripSchema>
  const body = ctx.body as BodyType

  logger.debug('Starting trip creation')
  logger.debug('User authenticated', { userId })

  // 後方互換性のためのフィールドマッピング（camelCase ↔ snake_case）
  const requestedAccessLevel = body.accessLevel ?? body.access_level ?? 'private'
  const isTemplate = body.isTemplate ?? body.is_template ?? false
  const dayCount = body.dayCount ?? body.day_count
  const likesCount = body.likesCount ?? body.likes_count
  const imageUrl = body.imageUrl ?? body.image_url
  const defaultCurrency = body.defaultCurrency ?? body.default_currency

  logger.debug('Trip creation request', {
    title: body.title,
    destination: body.destination,
    hasImageUrl: !!imageUrl,
    requestedAccessLevel,
    isTemplate,
    dayCount,
    likesCount
  })
  
  const {
    title,
    description,
    destination,
    destinationPlace,
    destinationPlaceId,
    startDate,
    endDate
  } = body

  // タイトルが空の場合は目的地を使用（zod スキーマで title || destination は必須にされている）
  const finalTitle = title || destination

  // Firebase Auth UID (google_id) から users コレクションのドキュメントIDを取得
  // Phase 1-1.5: 認証プロバイダーマルチ対応化
  const user = await adminUserOperations.getUserByAuthUid(userId)
  if (!user) {
    logger.error('User not found', { authUid: userId })
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // trip.user_id には users コレクションのドキュメントIDを使用
  const userDocumentId = user.id
  logger.debug('Resolved user document ID', { authUid: userId, userDocumentId })

  logger.debug('Getting existing trips for user', { userDocumentId })
  
  // ユーザーの既存旅行スラッグを取得（後方互換性のため、google_id と users.id の両方で検索）
  const existingTrips = await adminTripOperations.getTripsByUserId(userDocumentId)
  const existingSlugs = existingTrips.map(t => t.slug).filter((slug): slug is string => Boolean(slug))
  
  logger.debug('Found existing trips', { 
    tripCount: existingTrips.length, 
    slugCount: existingSlugs.length 
  })
  
  // 旅行タイトルからユニークなスラッグを生成
  const tripSlug = generateUniqueSlug(finalTitle, existingSlugs)
  
  logger.debug('Generated trip slug', { tripSlug })

  const enforcedAccessLevel: Trip['access_level'] = 'private'

  if (requestedAccessLevel !== enforcedAccessLevel) {
    logger.debug('Trip creation access level overridden to private', {
      requestedAccessLevel,
      enforcedAccessLevel
    })
  }

  logger.debug('Creating trip', {
    userId,
    title: finalTitle,
    slug: tripSlug,
    destination,
    enforcedAccessLevel,
    hasDestinationPlace: !!destinationPlace,
    hasImageUrl: !!imageUrl,
    isTemplate
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
  // zod スキーマで isTemplate が true の場合、dayCount は必須かつ正の数としてバリデーション済み
  const normalizedDayCount =
    typeof dayCount === 'number' && Number.isFinite(dayCount) && dayCount > 0
      ? Math.floor(dayCount)
      : undefined

  const tripData: any = {
    user_id: userDocumentId, // users コレクションのドキュメントIDを使用
    title: finalTitle,
    slug: tripSlug,
    destination,
    access_level: enforcedAccessLevel,
    is_template: isTemplate,
    likes_count: typeof likesCount === 'number' ? likesCount : 0,
    status: 'PLANNING' as const
  }

  // オプショナルフィールドを条件付きで追加
  if (description) tripData.description = description
  // place_id 優先で保存（後方互換でオブジェクトも受ける）
  const resolvedDestPlaceId: string | undefined = destinationPlaceId || destinationPlace?.place_id
  if (resolvedDestPlaceId) tripData.destination_place_id = resolvedDestPlaceId
  if (!isTemplate && startDate) tripData.start_date = new Date(startDate)
  if (!isTemplate && endDate) tripData.end_date = new Date(endDate)

  // day_count / stats.days の設定
  if (isTemplate) {
    if (normalizedDayCount) {
      tripData.day_count = normalizedDayCount
      tripData.stats = {
        ...(tripData.stats || {}),
        days: normalizedDayCount,
      }
    }
  } else if (startDate && endDate) {
    const start = new Date(startDate)
    const end = new Date(endDate)
    start.setHours(0, 0, 0, 0)
    end.setHours(0, 0, 0, 0)
    const diffMs = end.getTime() - start.getTime()
    if (Number.isFinite(diffMs) && diffMs >= 0) {
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1
      tripData.stats = {
        ...(tripData.stats || {}),
        days,
      }
    }
  }
  if (finalImageUrl) tripData.image_url = finalImageUrl
  if (defaultCurrency) tripData.default_currency = defaultCurrency

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

  logger.debug('Adding creator info to trip')
  
  const cookieLangPost = request.cookies.get(COOKIE_NAME)?.value ?? null
  // 既に取得済みのuserオブジェクトを使用
  if (user) {
    trip.creator = user
    logger.debug('Creator info added', { userSlug: user.slug })
  } else {
    logger.warn('User not found for creator info', { userDocumentId })
  }

  // UI利便性のため、destination_place を解決して返す
  try {
    if (resolvedDestPlaceId) {
      // 新形式でのキャッシュ検索: {place_id}_{language}
      // ユーザーの言語設定を取得
      const userLanguage = user
        ? getUserLanguage(user, {
            serverOverride: cookieLangPost,
            serverCookies: request.cookies
          })
        : 'ja'
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
          const language = user
            ? getUserLanguage(user, {
                serverOverride: cookieLangPost,
                serverCookies: request.cookies
              })
            : 'ja'
          
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
})

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