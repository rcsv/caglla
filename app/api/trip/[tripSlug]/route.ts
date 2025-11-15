import { NextRequest, NextResponse } from 'next/server'
import { adminTripOperations, adminDayOperations, adminItineraryOperations } from '@/lib/firebase/admin-operation'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import { COLLECTIONS } from '@/lib/firebase/firestore'
import type { PlacesCache, FirestoreDate, PlaceData, Trip } from '@/lib/core/types'
import { toDateOrNull } from '@/lib/firebase/timestamp-utils'
import logger from '@/lib/core/logger'
import { canViewTrip } from '@/lib/core/permissions'
import { asUserId } from '@/lib/core/types/identity'
import { notFound, badRequest, createForbiddenError, parseRequestBody } from '@/lib/core/error-handler'
import { tripApi } from '@/lib/api/middleware'

// API応答用の拡張型（destination_placeを含む）
interface TripWithDestination extends Trip {
  destination_place?: PlaceData
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
 * Retrieve a trip by ID including its destination (resolved from place cache when missing), days with their itineraries (with place data resolved from place cache when missing), and the creator's public info when available.
 *
 * @param request - The incoming Next.js request (unused for retrieval logic).
 * @param params - An object containing route parameters; `params.tripSlug` is the trip slug to fetch.
 * @returns A JSON response containing the trip fields plus:
 * - `days`: array of days each including an `itineraries` array (each itinerary may include `place_data` populated from the places cache),
 * - `creator`: public creator info `{ id, name, email, avatar_url, slug }` or `null` if not found.
 * Returns a 404 response with `{ error: 'Trip not found' }` when the trip does not exist, or a 500 response with `{ error: 'Failed to fetch trip' }` on unexpected failures.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tripSlug: string }> }
) {
  try {
    const { tripSlug } = await params

    // Resolve trip by slug or id
    const resolved = await adminTripOperations.resolveTripByIdOrSlug(tripSlug)
    if (!resolved) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }
    
    const { id: tripId, trip } = resolved

    // 認証チェック（認証済みユーザーのIDを取得、認証されていない場合はnull）
    let userId: string | null = null
    try {
      const authHeader = request.headers.get('authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const idToken = authHeader.split('Bearer ')[1]
        if (idToken) {
          const decodedToken = await adminAuth.verifyIdToken(idToken).catch(() => null)
          if (decodedToken) {
            userId = decodedToken.uid
          }
        }
      }
    } catch (error) {
      // 認証エラーは無視（未認証ユーザーとして扱う）
      logger.debug('Failed to verify ID token for trip GET endpoint', error)
    }

    // 閲覧権限チェック（public な旅行は誰でも閲覧可能、private な旅行は所有者のみ）
    const userIdTyped = userId ? asUserId(userId) : null
    if (!canViewTrip(trip, userIdTyped)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // destination_place を places_cache から解決
    let tripWithDest: TripWithDestination = trip
    try {
      if (trip.destination_place_id && !tripWithDest.destination_place) {
        // PlacesCache のキーは placeId_language 形式のため、言語フォールバックで解決
        const fallbackLanguages = ['en', 'ja']
        for (const lang of fallbackLanguages) {
          const cacheKey = `${trip.destination_place_id}_${lang}`
          const cacheDoc = await adminDb.collection(COLLECTIONS.PLACES_CACHE).doc(cacheKey).get()
          if (cacheDoc.exists) {
            const placesCache = cacheDoc.data() as PlacesCache
            // PlacesCacheからPlaceDataに変換（メタデータを除外）
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
            // place_idがある場合、place_cacheから最新データを取得
            if (it.place_id) {
              try {
                // PlacesCache のキーは placeId_language 形式なので、言語フォールバックで解決
                const preferredLanguage = 'en' // サーバー側なのでデフォルトで英語
                const fallbackLanguages = ['en', 'ja'] // 英語 → 日本語の順でフォールバック
                
                let placesCache: PlacesCache | null = null
                let resolvedCacheKey: string | null = null
                
                // 優先言語でキャッシュを検索
                for (const lang of fallbackLanguages) {
                  const cacheKey = `${it.place_id}_${lang}`
                  try {
                    const cacheDoc = await adminDb.collection(COLLECTIONS.PLACES_CACHE).doc(cacheKey).get()
                    if (cacheDoc.exists) {
                      placesCache = cacheDoc.data() as PlacesCache
                      resolvedCacheKey = cacheKey
                      break
                    }
                  } catch (error) {
                    logger.debug(`Failed to fetch PlacesCache with key: ${cacheKey}`, error)
                  }
                }
                
                if (placesCache) {
                  // PlacesCacheからPlaceDataに変換（メタデータを除外）
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
                  logger.debug(`PlacesCache resolved for itinerary`, { 
                    itineraryId: it.id, 
                    placeId: it.place_id, 
                    cacheKey: resolvedCacheKey 
                  })
                } else if (!it.place_data) {
                  // キャッシュにない場合のみ、フォールバックとして既存のplace_dataを使用
                  logger.warn('PlacesCache not found for itinerary', { 
                    itineraryId: it.id, 
                    placeId: it.place_id,
                    triedKeys: fallbackLanguages.map(lang => `${it.place_id}_${lang}`)
                  })
                }
              } catch (error) {
                logger.error('Failed to resolve place_data for itinerary', error, { itineraryId: it.id })
              }
            } else if (it.place_data && it.place_data.format_version) {
              // place_idがないが、place_dataがPlacesCache形式の場合は変換
              const placesCache = it.place_data
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
            }
            return it
          })
        )
        return {
          ...day,
          itineraries
        }
      })
    )

    // 作成者情報を取得（google_idで検索）
    let creator = null
    if (trip.user_id) {
      try {
        // google_idでusersコレクションを検索
        const usersSnapshot = await adminDb
          .collection('users')
          .where('google_id', '==', trip.user_id)
          .limit(1)
          .get()
        
        if (!usersSnapshot.empty) {
          const userDoc = usersSnapshot.docs[0]
          const userData = userDoc.data()
          creator = {
            id: userDoc.id,
            name: userData?.name || 'Unknown User',
            email: userData?.email || '',
            avatar_url: userData?.avatar_url || null,
            slug: userData?.slug || null
          }
        }
      } catch (error) {
        logger.error('Error fetching creator', error)
      }
    }

    return NextResponse.json({
      // NOTE: destination_place を places_cache から解決したものを含めて返す
      ...tripWithDest,
      days: daysWithItineraries,
      creator
    })
  } catch (error) {
    logger.error('Error fetching trip', error)
    return NextResponse.json(
      { error: 'Failed to fetch trip' },
      { status: 500 }
    )
  }
}

/**
 * Update a trip by ID, enforce ownership, and adjust associated day documents when the trip date range changes.
 *
 * Updates the trip's metadata (title, description, destination, destination_place_id, start/end dates, access level, image URL).
 * If the start or end date changes, creates, updates, or deletes day documents so they match the new inclusive date range and renumbers day_number accordingly.
 *
 * @param request - The incoming NextRequest containing authorization header and JSON body with update fields.
 * @param params - An object whose `id` property (resolved from the route) is the target trip ID.
 * @returns A NextResponse with `{ success: true }` on successful update. On error returns JSON with an `error` message and an appropriate HTTP status (401, 403, 400, or 500).
 */
export const PUT = tripApi(async (request: NextRequest, ctx) => {
  // ctx.auth, ctx.trip, ctx.params が保証されている（tripApi プリセットが認証・所有権チェックを実行）
  const { userId } = ctx.auth!
  const { tripId, trip } = ctx.trip!
  const { tripSlug } = ctx.params!

    const body = await parseRequestBody<{
      title?: string
      description?: string
      destination?: string
      destinationPlace?: PlaceData
      destinationPlaceId?: string
      startDate?: string
      endDate?: string
      accessLevel?: string
      imageUrl?: string
      isTemplate?: boolean
      is_template?: boolean
      dayCount?: number
      day_count?: number
    }>(request)
    
    const {
      title,
      description,
      destination,
      destinationPlace,
      destinationPlaceId,
      startDate,
      endDate,
      accessLevel,
      imageUrl,
      isTemplate: bodyIsTemplate,
      is_template: snakeIsTemplate,
      dayCount: bodyDayCount,
      day_count: snakeDayCount
    } = body

    const normalizedDayCountInput = typeof bodyDayCount === 'number'
      ? bodyDayCount
      : typeof snakeDayCount === 'number'
        ? snakeDayCount
        : undefined
    const normalizedDayCount =
      normalizedDayCountInput !== undefined && Number.isFinite(normalizedDayCountInput) && normalizedDayCountInput > 0
        ? Math.floor(normalizedDayCountInput)
        : undefined

    const isTemplate =
      typeof bodyIsTemplate === 'boolean'
        ? bodyIsTemplate
        : typeof snakeIsTemplate === 'boolean'
          ? snakeIsTemplate
          : Boolean(trip.is_template)

    // 日程が変更されたかチェック
    const originalStartDate = trip?.start_date
    const originalEndDate = trip?.end_date
    const newStartDate = startDate ? new Date(startDate) : undefined
    const newEndDate = endDate ? new Date(endDate) : undefined
    
    // 日付比較のヘルパー関数
    const compareDates = (date1: Date | string | undefined, date2: Date | string | undefined): boolean => {
      if (!date1 && !date2) return true // 両方ともundefined
      if (!date1 || !date2) return false // 片方だけundefined
      
      // 文字列の場合はDateに変換
      const d1 = typeof date1 === 'string' ? new Date(date1) : date1
      const d2 = typeof date2 === 'string' ? new Date(date2) : date2
      
      // 日付のみを比較（時刻は無視）
      const normalized1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate())
      const normalized2 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate())
      
      return normalized1.getTime() === normalized2.getTime()
    }
    
    // 日付を正規化するヘルパー関数
  const normalizeDate = (date: Date | string | FirestoreDate): Date => {
      if (date instanceof Date) return new Date(date.getFullYear(), date.getMonth(), date.getDate())
      if (typeof date === 'string') {
        const d = new Date(date)
        return new Date(d.getFullYear(), d.getMonth(), d.getDate())
      }
      const d = toDateOrNull(date)
      if (!d) throw new Error('Invalid date type')
      return new Date(d.getFullYear(), d.getMonth(), d.getDate())
    }
    
    // 日付のキーを生成するヘルパー関数
    const getDateKey = (date: Date | string | FirestoreDate): string => {
      const normalized = normalizeDate(date)
      return normalized.toISOString().split('T')[0] // YYYY-MM-DD形式
    }
    
    // 日程が変更された場合の処理
    const startDateChanged = !compareDates(toDateOrNull(originalStartDate) || undefined, newStartDate)
    const endDateChanged = !compareDates(toDateOrNull(originalEndDate) || undefined, newEndDate)
    
    if (!isTemplate && (startDateChanged || endDateChanged) && newStartDate && newEndDate) {
      logger.debug('Trip dates changed, updating days documents', {
        original: { start: originalStartDate, end: originalEndDate },
        new: { start: newStartDate, end: newEndDate }
      })
      
      // 新しい日程範囲を計算
      const start = new Date(newStartDate)
      const end = new Date(newEndDate)
      
      // 開始日が終了日より後の場合はエラー      
      if (start > end) {
        logger.error('Start date is after end date', { start, end })
        return badRequest('開始日は終了日より前である必要があります')
      }
      
      try {
        logger.debug('Starting trip dates update process')
        
        // 既存のdaysを取得
        const existingDays = await adminDayOperations.getDaysByTripId(tripId)
        logger.debug('Existing days', { days: existingDays.map(d => ({ id: d.id, date: d.date, day_number: d.day_number })) })
        
        // 新しい日程範囲を計算
        const start = new Date(newStartDate)
        const end = new Date(newEndDate)
        
        // 既存のdaysを日付でマップ（正規化された日付キーを使用）
        const existingDaysByDate = new Map<string, any>()
        existingDays.forEach(day => {
          if (day.date) {
            const dateKey = getDateKey(day.date)
            existingDaysByDate.set(dateKey, day)
            logger.debug('Existing day mapped', { dateKey, dayId: day.id })
          }
        })
        
        // 新しい日程でdaysを更新（既存のものを保持しつつ、必要に応じて追加・削除）
        const daysToDelete: string[] = []
        const daysToCreate: any[] = []
        const daysToUpdate: { id: string, day_number: number }[] = []
        
        // 新しい日程範囲の各日付を処理
        const startNormalized = normalizeDate(start)
        const endNormalized = normalizeDate(end)
        
        logger.debug('New date range', { 
          start: getDateKey(startNormalized), 
          end: getDateKey(endNormalized) 
        })
        
        let currentDate = new Date(startNormalized)
        let dayNumber = 1
        
        // 同じ日付の場合の特別処理
        const isSameDay = startNormalized.getTime() === endNormalized.getTime()
        if (isSameDay) {
          logger.debug('Trip is for a single day')
        }
        
        while (currentDate <= endNormalized) {
          const dateKey = getDateKey(currentDate)
          const existingDay = existingDaysByDate.get(dateKey)
          
          logger.debug('Processing date', { 
            dateKey, 
            dayNumber, 
            hasExistingDay: !!existingDay,
            existingDayId: existingDay?.id 
          })
          
          if (existingDay) {
            // 既存のdayが新しい日程範囲内にある場合、day_numberを更新
            if (existingDay.day_number !== dayNumber) {
              logger.debug('Updating day_number', { 
                dayId: existingDay.id,
                old: existingDay.day_number, 
                new: dayNumber 
              })
              daysToUpdate.push({ id: existingDay.id, day_number: dayNumber })
            } else {
              logger.debug('Day_number unchanged', { dayNumber })
            }
          } else {
            // 新しいdayを作成
            logger.debug('Creating new day', { dateKey })
            daysToCreate.push({
              trip_id: tripId,
              day_number: dayNumber,
              date: new Date(currentDate),
              created_at: new Date(),
              updated_at: new Date()
            })
          }
          
          // 日付を安全に進める（新しいDateオブジェクトを作成）
          currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000)
          dayNumber++
          
          // 同じ日付の場合は1回だけループを実行
          if (isSameDay) {
            break
          }
        }
        
        // day_numberの更新を実行
        for (const update of daysToUpdate) {
          logger.debug('Updating day_number in database', { 
            dayId: update.id, 
            newDayNumber: update.day_number 
          })
          await adminDayOperations.updateDay(update.id, { 
            day_number: update.day_number,
            updated_at: new Date()
          })
        }
        
        // 新しい日程範囲外のdaysを特定（正規化された日付で比較）
        existingDays.forEach(day => {
          if (day.date) {
            const dayDateNormalized = normalizeDate(day.date)
            if (dayDateNormalized < startNormalized || dayDateNormalized > endNormalized) {
              logger.debug('Day marked for deletion', { 
                dateKey: getDateKey(day.date), 
                dayId: day.id 
              })
              daysToDelete.push(day.id)
            }
          }
        })
        
        // 不要なdaysとそのitinerariesを削除
        for (const dayId of daysToDelete) {
          logger.debug('Deleting day', { dayId })
          await adminDayOperations.deleteDay(dayId)
        }
        
        // 新しいdaysを作成
        for (const dayData of daysToCreate) {
          logger.debug('Creating new day', { date: dayData.date.toDateString() })
          await adminDayOperations.createDay(dayData)
        }
        
        logger.info('Trip dates update completed', { 
          updated: daysToUpdate.length, 
          deleted: daysToDelete.length, 
          created: daysToCreate.length 
        })
        
      } catch (error) {
        logger.error('Error during trip dates update', error)
        return handleApiError(
          error instanceof Error ? error : new Error(String(error)),
          `/api/trip/${tripSlug}`
        )
      }
    } else {
      logger.debug('No changes to trip dates, skipping days update')
    }

    const tripUpdatePayload: Record<string, unknown> = {
      title,
      description,
      destination,
      destination_place_id: destinationPlaceId || destinationPlace?.place_id,
      access_level: accessLevel,
      image_url: imageUrl || undefined,
      is_template: isTemplate
    }

    if (isTemplate) {
      tripUpdatePayload.start_date = null
      tripUpdatePayload.end_date = null
      tripUpdatePayload.day_count =
        normalizedDayCount !== undefined
          ? normalizedDayCount
          : typeof trip.day_count === 'number'
            ? trip.day_count
            : null
    } else {
      tripUpdatePayload.start_date = newStartDate ?? null
      tripUpdatePayload.end_date = newEndDate ?? null
      if (normalizedDayCount !== undefined) {
        tripUpdatePayload.day_count = normalizedDayCount
      }
    }

  await adminTripOperations.updateTrip(tripId, tripUpdatePayload)

  return NextResponse.json({ success: true })
})

export const DELETE = tripApi(async (request: NextRequest, ctx) => {
  // ctx.auth, ctx.trip, ctx.params が保証されている（tripApi プリセットが認証・所有権チェックを実行）
  const { userId } = ctx.auth!
  const { tripId, trip } = ctx.trip!
  const { tripSlug } = ctx.params!

  // Delete trip (this will also delete related days and itineraries)
  await adminTripOperations.deleteTrip(tripId)

  return NextResponse.json({ success: true })
})