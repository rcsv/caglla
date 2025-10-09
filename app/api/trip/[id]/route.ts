import { NextRequest, NextResponse } from 'next/server'
import { adminTripOperations, adminDayOperations, adminItineraryOperations } from '@/lib/firestore-admin-operations'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { COLLECTIONS } from '@/lib/firestore'
import type { PlacesCache, FirestoreDate } from '@/lib/types'

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
 * @param params - An object containing route parameters; `params.id` is the trip ID to fetch.
 * @returns A JSON response containing the trip fields plus:
 * - `days`: array of days each including an `itineraries` array (each itinerary may include `place_data` populated from the places cache),
 * - `creator`: public creator info `{ id, name, email, avatar_url, slug }` or `null` if not found.
 * Returns a 404 response with `{ error: 'Trip not found' }` when the trip does not exist, or a 500 response with `{ error: 'Failed to fetch trip' }` on unexpected failures.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tripId } = await params

    // Get trip details
    const trip = await adminTripOperations.getTripById(tripId)
    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    // destination_place を places_cache から解決
    try {
      const anyTrip: any = trip as any
      if (anyTrip.destination_place_id && !anyTrip.destination_place) {
        const cacheDoc = await adminDb.collection(COLLECTIONS.PLACES_CACHE).doc(anyTrip.destination_place_id).get()
        if (cacheDoc.exists) {
          const placesCache = cacheDoc.data() as PlacesCache
          // PlacesCacheからPlaceDataに変換（メタデータを除外）
          anyTrip.destination_place = {
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
      }
    } catch (error) {
      console.error('Failed to resolve destination_place:', error)
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
                const cacheDoc = await adminDb.collection(COLLECTIONS.PLACES_CACHE).doc(it.place_id).get()
                if (cacheDoc.exists) {
                  const placesCache = cacheDoc.data() as PlacesCache
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
                } else if (!it.place_data) {
                  // キャッシュにない場合のみ、フォールバックとして既存のplace_dataを使用
                  console.warn(`PlacesCache not found for itinerary ${it.id} (place_id: ${it.place_id})`)
                }
              } catch (error) {
                console.error(`Failed to resolve place_data for itinerary ${it.id}:`, error)
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
        console.error('Error fetching creator:', error)
      }
    }

    return NextResponse.json({
      ...trip,
      days: daysWithItineraries,
      creator
    })
  } catch (error) {
    console.error('Error fetching trip:', error)
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
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: tripId } = await params
    const body = await request.json()
    
    const {
      title,
      description,
      destination,
      destinationPlace,
      destinationPlaceId,
      startDate,
      endDate,
      accessLevel,
      imageUrl
    } = body

    // Verify user owns this trip
    const trip = await adminTripOperations.getTripById(tripId)
    if (!trip || trip.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // 日程が変更されたかチェック
    const originalTrip = await adminTripOperations.getTripById(tripId)
    const originalStartDate = originalTrip?.start_date
    const originalEndDate = originalTrip?.end_date
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
      // FirestoreTimestamp の場合
      if ('toDate' in date && typeof date.toDate === 'function') {
        const d = date.toDate()
        return new Date(d.getFullYear(), d.getMonth(), d.getDate())
      }
      throw new Error('Invalid date type')
    }
    
    // 日付のキーを生成するヘルパー関数
    const getDateKey = (date: Date | string | FirestoreDate): string => {
      const normalized = normalizeDate(date)
      return normalized.toISOString().split('T')[0] // YYYY-MM-DD形式
    }
    
    // 日程が変更された場合の処理
    const startDateChanged = !compareDates(toDate(originalStartDate), newStartDate)
    const endDateChanged = !compareDates(toDate(originalEndDate), newEndDate)
    
    if ((startDateChanged || endDateChanged) && newStartDate && newEndDate) {
      console.log('日程が変更されました。daysドキュメントを更新します。')
      console.log('元の日程:', originalStartDate, '→', originalEndDate)
      console.log('新しい日程:', newStartDate, '→', newEndDate)
      
      // 新しい日程範囲を計算
      const start = new Date(newStartDate)
      const end = new Date(newEndDate)
      
      // 開始日が終了日より後の場合はエラー
      if (start > end) {
        console.error('開始日が終了日より後です:', start, '>', end)
        return NextResponse.json({ error: '開始日は終了日より前である必要があります' }, { status: 400 })
      }
      
      try {
        console.log('日程更新処理を開始します...')
        
        // 既存のdaysを取得
        const existingDays = await adminDayOperations.getDaysByTripId(tripId)
        console.log('既存のdays:', existingDays.map(d => ({ id: d.id, date: d.date, day_number: d.day_number })))
        
        // 新しい日程範囲を計算
        const start = new Date(newStartDate)
        const end = new Date(newEndDate)
        
        // 既存のdaysを日付でマップ（正規化された日付キーを使用）
        const existingDaysByDate = new Map<string, any>()
        existingDays.forEach(day => {
          if (day.date) {
            const dateKey = getDateKey(day.date)
            existingDaysByDate.set(dateKey, day)
            console.log(`既存dayマップ: ${dateKey} -> ${day.id}`)
          }
        })
        
        // 新しい日程でdaysを更新（既存のものを保持しつつ、必要に応じて追加・削除）
        const daysToDelete: string[] = []
        const daysToCreate: any[] = []
        const daysToUpdate: { id: string, day_number: number }[] = []
        
        // 新しい日程範囲の各日付を処理
        const startNormalized = normalizeDate(start)
        const endNormalized = normalizeDate(end)
        
        console.log(`新しい日程範囲: ${getDateKey(startNormalized)} から ${getDateKey(endNormalized)}`)
        
        let currentDate = new Date(startNormalized)
        let dayNumber = 1
        
        // 同じ日付の場合の特別処理
        const isSameDay = startNormalized.getTime() === endNormalized.getTime()
        if (isSameDay) {
          console.log('同じ日付のtripです')
        }
        
        while (currentDate <= endNormalized) {
          const dateKey = getDateKey(currentDate)
          const existingDay = existingDaysByDate.get(dateKey)
          
          console.log(`処理中の日付: ${dateKey}, dayNumber: ${dayNumber}, 既存day: ${existingDay ? existingDay.id : 'なし'}`)
          
          if (existingDay) {
            // 既存のdayが新しい日程範囲内にある場合、day_numberを更新
            if (existingDay.day_number !== dayNumber) {
              console.log(`day_numberを更新: ${existingDay.day_number} -> ${dayNumber}`)
              daysToUpdate.push({ id: existingDay.id, day_number: dayNumber })
            } else {
              console.log(`day_numberは変更なし: ${dayNumber}`)
            }
          } else {
            // 新しいdayを作成
            console.log(`新しいdayを作成: ${dateKey}`)
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
          console.log(`day_numberを更新: ${update.id} -> ${update.day_number}`)
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
              console.log(`削除対象のday: ${getDateKey(day.date)} (${day.id})`)
              daysToDelete.push(day.id)
            }
          }
        })
        
        // 不要なdaysとそのitinerariesを削除
        for (const dayId of daysToDelete) {
          console.log(`dayを削除: ${dayId}`)
          await adminDayOperations.deleteDay(dayId)
        }
        
        // 新しいdaysを作成
        for (const dayData of daysToCreate) {
          console.log(`新しいdayを作成: ${dayData.date.toDateString()}`)
          await adminDayOperations.createDay(dayData)
        }
        
        console.log(`更新されたdays: ${daysToUpdate.length}, 削除されたdays: ${daysToDelete.length}, 作成されたdays: ${daysToCreate.length}`)
        console.log('日程更新処理が完了しました')
        
      } catch (error) {
        console.error('日程更新中にエラーが発生しました:', error)
        return NextResponse.json({ error: '日程の更新に失敗しました' }, { status: 500 })
      }
    } else {
      console.log('日程に変更はありません。daysドキュメントは更新しません。')
    }

    await adminTripOperations.updateTrip(tripId, {
      title,
      description,
      destination,
      destination_place_id: destinationPlaceId || destinationPlace?.place_id,
      start_date: newStartDate,
      end_date: newEndDate,
      access_level: accessLevel,
      image_url: imageUrl || undefined
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating trip:', error)
    return NextResponse.json(
      { error: 'Failed to update trip' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: tripId } = await params

    // Verify user owns this trip
    const trip = await adminTripOperations.getTripById(tripId)
    if (!trip || trip.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Delete trip (this will also delete related days and itineraries)
    await adminTripOperations.deleteTrip(tripId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting trip:', error)
    return NextResponse.json(
      { error: 'Failed to delete trip' },
      { status: 500 }
    )
  }
}