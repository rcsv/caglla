import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { COLLECTIONS } from '@/lib/firestore'
import type { PlaceData } from '@/lib/types'

/**
 * Insert a new itinerary into a specified day at a given position and renumber subsequent itineraries as needed.
 *
 * @param request - The incoming NextRequest whose JSON body must include:
 *   - `day_id` (string): target day identifier (required)
 *   - `title` (string): itinerary title (required)
 *   - `place_id` (string) or `place_data.place_id` (string): identifier of the place to attach (one required)
 *   - `place_data` (optional): partial place payload used to populate cache when the place is not found in PLACES_CACHE
 *   - `description` (optional): itinerary description
 *   - `location` (optional): itinerary location string
 *   - `insert_after_index` (optional): 1-based display index after which to insert; if omitted or out of range, the itinerary is appended
 * @returns The saved itinerary object containing `id`, the persisted itinerary fields (including `sort_number`), and `place_data` set to the resolved PlaceData or `null`.
 *
 * On validation failure returns a 400 response with an error message. On unexpected errors returns a 500 response.
 */
export async function POST(request: NextRequest) {
  try {
    const { day_id, place_id, place_data, title, description, location, insert_after_index } = await request.json()
    
    if (!day_id || !title || (!place_id && !place_data?.place_id)) {
      return NextResponse.json(
        { error: 'Missing required fields: day_id, title, and place_id or place_data.place_id' },
        { status: 400 }
      )
    }

    const resolvedPlaceId: string = place_id || place_data.place_id

    const insertAfterIndex = insert_after_index !== undefined ? parseInt(insert_after_index) : -1

    // 同じday_idの既存のitinerariesを取得してsort_number順に並べる
    const itinerariesRef = adminDb.collection(COLLECTIONS.ITINERARIES)
    const existingItinerariesSnapshot = await itinerariesRef
      .where('day_id', '==', day_id)
      .orderBy('sort_number', 'asc')
      .get()
    
    const existingItineraries = existingItinerariesSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }))

    // 挿入位置に基づいて新しいsort_numberを計算
    let newSortNumber: number
    
    console.log(`Insert API: insertAfterIndex=${insertAfterIndex}, existingItineraries.length=${existingItineraries.length}`)
    console.log(`Existing itineraries sort_numbers:`, existingItineraries.map(i => ({ id: i.id, title: i.title, sort_number: i.sort_number })))
    
    if (insertAfterIndex < 0 || insertAfterIndex >= existingItineraries.length) {
      // 最後に追加する場合
      newSortNumber = existingItineraries.length > 0 
        ? Math.max(...existingItineraries.map((i: any) => i.sort_number || 0)) + 1 
        : 1
    } else {
      // 指定位置に挿入する場合
      // insertAfterIndexは表示番号（1ベース）なので、配列インデックス（0ベース）に変換
      const targetIndex = insertAfterIndex - 1
      let itinerariesToUpdate: any[] = []
      
      if (targetIndex >= 0 && targetIndex < existingItineraries.length) {
        // 手前のItineraryのsort_number + 1を使用
        const previousItinerary = existingItineraries[targetIndex]
        newSortNumber = (previousItinerary.sort_number || 0) + 1
        
        console.log(`Insert after index ${insertAfterIndex}: previousItinerary sort_number=${previousItinerary.sort_number}, newSortNumber=${newSortNumber}`)
        
        // 後続のitinerariesのsort_numberを1つずつ増やす
        itinerariesToUpdate = existingItineraries.filter((i: any) => (i.sort_number || 0) >= newSortNumber)
      } else {
        // 範囲外の場合は最後に追加
        newSortNumber = existingItineraries.length > 0 
          ? Math.max(...existingItineraries.map((i: any) => i.sort_number || 0)) + 1 
          : 1
        itinerariesToUpdate = []
      }
      
      // バッチ処理で後続のitinerariesを更新
      const batch = adminDb.batch()
      
      for (const itinerary of itinerariesToUpdate) {
        const docRef = itinerariesRef.doc(itinerary.id)
        batch.update(docRef, { 
          sort_number: (itinerary as any).sort_number + 1,
          updated_at: new Date()
        })
      }
      
      // バッチ更新を実行
      if (itinerariesToUpdate.length > 0) {
        await batch.commit()
        console.log(`Updated ${itinerariesToUpdate.length} itineraries after insertion`)
      }
    }

    // 新しいitineraryを作成
    const itineraryData = {
      day_id,
      sort_number: newSortNumber,
      title,
      description: description || '',
      location: location || '',
      place_id: resolvedPlaceId as string,
      created_at: new Date(),
      updated_at: new Date()
    }

    // Firestoreに保存
    const docRef = await itinerariesRef.add(itineraryData)
    
    // 保存されたデータを返す
    // place_cache から実体を解決（存在しなければ、リクエストのplace_dataをキャッシュ保存）
    let resolvedPlaceData: PlaceData | null = null
    try {
      const cacheDoc = await adminDb.collection(COLLECTIONS.PLACES_CACHE).doc(resolvedPlaceId).get()
      if (cacheDoc.exists) {
        resolvedPlaceData = cacheDoc.data() as PlaceData
        await cacheDoc.ref.update({ last_accessed: new Date(), access_count: (cacheDoc.data().access_count || 0) + 1 }).catch(() => {})
      } else if (place_data?.place_id) {
        const cachePayload: any = {
          format_version: '1.0.0',
          place_id: place_data.place_id,
          name: place_data.name,
          formatted_address: place_data.formatted_address,
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
        await adminDb.collection(COLLECTIONS.PLACES_CACHE).doc(resolvedPlaceId).set(cachePayload)
        resolvedPlaceData = cachePayload as PlaceData
      }
    } catch (e) {
      resolvedPlaceData = (place_data as PlaceData) || null
    }

    const savedItinerary = {
      id: docRef.id,
      ...itineraryData,
      place_data: resolvedPlaceData
    }

    console.log(`Inserted itinerary at position ${newSortNumber} in day ${day_id}`)
    console.log(`Inserted itinerary details:`, { id: savedItinerary.id, title: savedItinerary.title, sort_number: savedItinerary.sort_number })

    return NextResponse.json(savedItinerary)
  } catch (error) {
    console.error('Error inserting itinerary:', error)
    return NextResponse.json(
      { error: 'Failed to insert itinerary' },
      { status: 500 }
    )
  }
}