import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { COLLECTIONS } from '@/lib/firestore'
import type { PlaceData } from '@/lib/types'

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
        resolvedPlaceData = cacheDoc.data() as PlaceData
        // 軽いアクセス統計更新（best-effort）
        await cacheDoc.ref.update({ last_accessed: new Date(), access_count: (cacheDoc.data().access_count || 0) + 1 }).catch(() => {})
      } else if (place_data?.place_id) {
        // 受け取った place_data をキャッシュへ保存（API追加コールを避ける）
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
      } else {
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
            const cachePayload: any = {
              format_version: '1.0.0',
              place_id: result.place_id,
              name: result.name,
              formatted_address: result.formatted_address,
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
            resolvedPlaceData = cachePayload as PlaceData
          }
        } catch {}
      }
    } catch (e) {
      // 失敗時はplace_dataがあればそれを返す（ベストエフォート）
      resolvedPlaceData = (place_data as PlaceData) || null
    }

    // 保存されたデータを返す（UI利便性のため place_data を付与）
    const savedItinerary = {
      id: docRef.id,
      ...itineraryData,
      place_data: resolvedPlaceData
    }

    console.log(`Created itinerary:`, { id: savedItinerary.id, title: savedItinerary.title, sort_number: savedItinerary.sort_number })

    return NextResponse.json(savedItinerary)
  } catch (error) {
    console.error('Error creating itinerary:', error)
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
    console.error('Error fetching itineraries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch itineraries' },
      { status: 500 }
    )
  }
}
