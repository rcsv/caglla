import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { COLLECTIONS } from '@/lib/firebase/firestore'
import type { PlaceData, PlacesCache, PlacesCacheInput, SupportedLanguage } from '@/lib/core/types'
import logger from '@/lib/core/logger'

/**
 * Create a new itinerary for a given day and return the saved itinerary with resolved place data.
 *
 * Validates required input (day_id, title, and either place_id or place_data.place_id), assigns the next sort_number for the day, persists an itinerary record containing only the place_id, and attempts to resolve or populate a cached PlaceData entry for the place. The response includes the persisted itinerary fields plus a place_data property containing the resolved PlaceData (or `null` when unavailable). Validation failures produce a 400 error object; unexpected server errors produce a 500 error object.
 *
 * @returns The saved itinerary object with properties: `id`, `day_id`, `sort_number`, `title`, `description`, `location`, `place_id`, `created_at`, `updated_at`, and `place_data` (resolved PlaceData or `null`). On validation failure returns an error object with status 400; on server error returns an error object with status 500.
 */
export async function POST(request: NextRequest) {
  try {
    const { day_id, place_id, place_data, title, description, location } = await request.json()

    if (!day_id || !title || (!place_id && !place_data?.place_id)) {
      return NextResponse.json(
        { error: 'Missing required fields: day_id, title, and place_id or place_data.place_id' },
        { status: 400 }
      )
    }
    const resolvedPlaceId: string = place_id || place_data.place_id

    // 同じday_idの既存のitinerariesを取得してsort_numberを決定
    const itinerariesRef = adminDb.collection(COLLECTIONS.ITINERARIES)
    const existingItineraries = await itinerariesRef
      .where('day_id', '==', day_id)
      .orderBy('sort_number', 'desc')
      .limit(1)
      .get()
    
    const nextSortNumber = existingItineraries.empty ? 1 : (existingItineraries.docs[0].data().sort_number || 0) + 1

    // 保存データ: place_id のみを保持（place_dataはキャッシュ参照）
    const itineraryData = {
      day_id,
      sort_number: nextSortNumber,
      title,
      description: description || '',
      location: location || '',
      place_id: resolvedPlaceId as string,
      created_at: new Date(),
      updated_at: new Date()
    }

    // Firestoreに保存
    const docRef = await itinerariesRef.add(itineraryData)
    
    // place_cache から実体を解決（存在しなければ、リクエストのplace_dataをそのまま返す）
    let resolvedPlaceData: PlaceData | null = null
    try {
      const cacheDoc = await adminDb.collection(COLLECTIONS.PLACES_CACHE).doc(resolvedPlaceId).get()
      if (cacheDoc.exists) {
        const placesCache = cacheDoc.data() as PlacesCache
        // PlacesCacheからPlaceDataに変換（メタデータを除外）
        resolvedPlaceData = {
          place_id: placesCache.place_id,
          name: placesCache.name,
          formatted_address: placesCache.formatted_address,
          vicinity: placesCache.vicinity,
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
        // アクセス統計を更新
        await cacheDoc.ref.update({ 
          last_accessed: new Date(), 
          access_count: (placesCache.access_count || 0) + 1 
        }).catch(() => {})
      } else if (place_data?.place_id) {
        logger.debug('Saving place_data to PlacesCache (NEW FORMAT)', { placeId: place_data.place_id })
        
        // 新形式でのキャッシュ保存（言語対応）
        try {
          // TODO: ユーザーの言語設定を取得する必要がある
          // 現在は日本語として保存（後でユーザー言語設定に対応）
          const language: SupportedLanguage = 'ja' // 暫定：日本語
          
          const cachePayload: PlacesCacheInput = {
            format_version: '2.0.0', // 新バージョン
            place_id: place_data.place_id,
            language: language, // 言語フィールド追加
            name: place_data.name,
            formatted_address: place_data.formatted_address,
            vicinity: place_data.vicinity,
            geometry: place_data.geometry,
            cached_at: new Date(),
            last_accessed: new Date(),
            access_count: 1
          }
          if (place_data.address_components) cachePayload.address_components = place_data.address_components
          if (place_data.photos) cachePayload.photos = place_data.photos
          if (place_data.rating !== undefined) cachePayload.rating = place_data.rating
          if (place_data.user_ratings_total !== undefined) cachePayload.user_ratings_total = place_data.user_ratings_total
          if (place_data.price_level !== undefined) cachePayload.price_level = place_data.price_level
          if (place_data.types) cachePayload.types = place_data.types
          if (place_data.opening_hours?.weekday_text) cachePayload.opening_hours = { weekday_text: place_data.opening_hours.weekday_text }
          if (place_data.international_phone_number) cachePayload.international_phone_number = place_data.international_phone_number
          if (place_data.website) cachePayload.website = place_data.website
          if (place_data.editorial_summary) cachePayload.editorial_summary = place_data.editorial_summary
          
          // 新形式のドキュメントID: {place_id}_{language}
          const cacheKey = `${resolvedPlaceId}_${language}`
          await adminDb.collection(COLLECTIONS.PLACES_CACHE).doc(cacheKey).set(cachePayload)
          logger.debug('Successfully saved to PlacesCache (NEW FORMAT)', { cacheKey })
        } catch (cacheError) {
          logger.error('Failed to save to PlacesCache (NEW FORMAT):', cacheError)
          // キャッシュ保存失敗は致命的ではない
        }
        
        // PlaceDataとして返す（メタデータを除外）
        resolvedPlaceData = {
          place_id: place_data.place_id,
          name: place_data.name,
          formatted_address: place_data.formatted_address,
          vicinity: place_data.vicinity,
          geometry: place_data.geometry,
          address_components: place_data.address_components,
          photos: place_data.photos,
          rating: place_data.rating,
          user_ratings_total: place_data.user_ratings_total,
          price_level: place_data.price_level,
          types: place_data.types,
          opening_hours: place_data.opening_hours,
          international_phone_number: place_data.international_phone_number,
          website: place_data.website,
          editorial_summary: place_data.editorial_summary,
        }
      } else {
        logger.debug('No place_data provided, attempting to fetch from API')
        // サーバー側で一度だけ詳細を取得してキャッシュ
        try {
          // Use a fixed base URL to prevent SSRF
          const resp = await fetch(`http://127.0.0.1:3000/api/places/details`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ placeId: resolvedPlaceId })
          })
          if (resp.ok) {
            const data = await resp.json()
            const result = data.result
            const cachePayload: PlacesCacheInput = {
              format_version: '1.0.0',
              place_id: result.place_id,
              language: 'ja', // v1.0.0互換性のためデフォルト値
              name: result.name,
              formatted_address: result.formatted_address,
              vicinity: result.vicinity,
              geometry: { location: { lat: result.geometry.location.lat, lng: result.geometry.location.lng } },
              cached_at: new Date(),
              last_accessed: new Date(),
              access_count: 1
            }
            if (result.address_components) cachePayload.address_components = result.address_components
            if (result.photos) cachePayload.photos = result.photos.map((p: any) => ({ photo_reference: p.photo_reference, height: p.height, width: p.width }))
            if (result.rating !== undefined) cachePayload.rating = result.rating
            if (result.user_ratings_total !== undefined) cachePayload.user_ratings_total = result.user_ratings_total
            if (result.price_level !== undefined) cachePayload.price_level = result.price_level
            if (result.types) cachePayload.types = result.types
            if (result.opening_hours?.weekday_text) cachePayload.opening_hours = { weekday_text: result.opening_hours.weekday_text }
            if (result.international_phone_number) cachePayload.international_phone_number = result.international_phone_number
            if (result.website) cachePayload.website = result.website
            if (result.editorial_summary) cachePayload.editorial_summary = result.editorial_summary
            
            await adminDb.collection(COLLECTIONS.PLACES_CACHE).doc(resolvedPlaceId).set(cachePayload)
            logger.debug('Successfully saved to PlacesCache from API')
            
            // PlaceDataとして返す（メタデータを除外）
            resolvedPlaceData = {
              place_id: result.place_id,
              name: result.name,
              formatted_address: result.formatted_address,
              vicinity: result.vicinity,
              geometry: { location: { lat: result.geometry.location.lat, lng: result.geometry.location.lng } },
              address_components: result.address_components,
              photos: result.photos,
              rating: result.rating,
              user_ratings_total: result.user_ratings_total,
              price_level: result.price_level,
              types: result.types,
              opening_hours: result.opening_hours,
              international_phone_number: result.international_phone_number,
              website: result.website,
              editorial_summary: result.editorial_summary,
            }
          }
        } catch (err) {
          logger.error('Error fetching from Places API', err)
        }
      }
    } catch (e) {
      logger.error('Error resolving place_data', e)
      // 失敗時はplace_dataがあればそれを返す（ベストエフォート）
      resolvedPlaceData = (place_data as PlaceData) || null
    }

    // 保存されたデータを返す（UI利便性のため place_data を付与）
    const savedItinerary = {
      id: docRef.id,
      ...itineraryData,
      place_data: resolvedPlaceData
    }

    logger.info('Itinerary created', { 
      id: savedItinerary.id, 
      title: savedItinerary.title, 
      sort_number: savedItinerary.sort_number 
    })

    return NextResponse.json(savedItinerary)
  } catch (error) {
    logger.error('Error creating itinerary', error)
    return NextResponse.json(
      { error: 'Failed to create itinerary' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dayId = searchParams.get('day_id')
    
    if (!dayId) {
      return NextResponse.json(
        { error: 'day_id parameter is required' },
        { status: 400 }
      )
    }

    // 指定されたday_idのitinerariesを取得
    const itinerariesRef = adminDb.collection(COLLECTIONS.ITINERARIES)
    const itinerariesSnapshot = await itinerariesRef
      .where('day_id', '==', dayId)
      .orderBy('sort_number', 'asc')
      .get()
    
    const itineraries = itinerariesSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }))

    return NextResponse.json(itineraries)
  } catch (error) {
    logger.error('Error fetching itineraries', error)
    return NextResponse.json(
      { error: 'Failed to fetch itineraries' },
      { status: 500 }
    )
  }
}