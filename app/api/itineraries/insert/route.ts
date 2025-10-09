import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { COLLECTIONS } from '@/lib/firestore'
import type { PlaceData } from '@/lib/types'

/**
 * Insert a new itinerary into a specified day at a given position and renumber subsequent itineraries as needed.
 *
 * Body:
 *   - day_id (string)                               (required)
 *   - title (string)                                (required)
 *   - place_id (string) | place_data.place_id       (いずれか必須)
 *   - place_data (optional)                         (PLACES_CACHE を埋める用)
 *   - description, location (optional)
 *   - insert_after_index (optional, 1-based)        ← この番号の“後ろ”に挿入。未指定 or 範囲外 → 末尾に追加
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { day_id, place_id, place_data, title, description, location, insert_after_index } = body ?? {}

    if (!day_id || !title || (!place_id && !place_data?.place_id)) {
      return NextResponse.json(
        { error: 'Missing required fields: day_id, title, and place_id or place_data.place_id' },
        { status: 400 }
      )
    }

    const resolvedPlaceId: string = place_id || place_data.place_id

    // 1-based index after which to insert; invalid → append
    const parsedIndex =
      insert_after_index === undefined || insert_after_index === null
        ? NaN
        : parseInt(String(insert_after_index), 10)

    const itinerariesRef = adminDb.collection(COLLECTIONS.ITINERARIES)
    const snap = await itinerariesRef.where('day_id', '==', day_id).orderBy('sort_number', 'asc').get()

    const existing = snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }))
    const count = existing.length
    const maxSort = count > 0 ? Math.max(...existing.map((i: any) => i.sort_number || 0)) : 0

    console.log(
      `Insert API: insert_after_index=${insert_after_index} (parsed=${parsedIndex}), existing=${count}, maxSort=${maxSort}`
    )
    console.log(
      `Existing sort_numbers:`,
      existing.map((i) => ({ id: i.id, title: i.title, sort_number: i.sort_number }))
    )

    let newSortNumber: number

    const isValidIndex = Number.isInteger(parsedIndex) && parsedIndex >= 1 && parsedIndex <= count
    if (isValidIndex) {
      // 指定番号の“後ろ”に挿入（1-based）
      newSortNumber = parsedIndex + 1
      console.log(`Insert after display index ${parsedIndex} → newSortNumber=${newSortNumber}`)

      // newSortNumber 以上を +1（衝突回避のため昇順で問題なし）
      const toShift = existing.filter((i: any) => (i.sort_number || 0) >= newSortNumber)

      if (toShift.length > 0) {
        const batch = adminDb.batch()
        for (const it of toShift) {
          batch.update(itinerariesRef.doc(it.id), {
            sort_number: (it as any).sort_number + 1,
            updated_at: new Date(),
          })
        }
        await batch.commit()
        console.log(`Shifted ${toShift.length} itineraries starting at sort_number >= ${newSortNumber}`)
      }
    } else {
      // 未指定 or 範囲外 → 末尾に追加
      newSortNumber = maxSort + 1
      console.log(`Index invalid/out of range → append at newSortNumber=${newSortNumber}`)
    }

    // 新規作成
    const now = new Date()
    const itineraryData = {
      day_id,
      sort_number: newSortNumber,
      title,
      description: description || '',
      location: location || '',
      place_id: resolvedPlaceId as string,
      created_at: now,
      updated_at: now,
    }

    const docRef = await itinerariesRef.add(itineraryData)

    // place_cache 解決（なければ受信データで埋める）
    let resolvedPlaceData: PlaceData | null = null
    try {
      const cacheDoc = await adminDb.collection(COLLECTIONS.PLACES_CACHE).doc(resolvedPlaceId).get()
      if (cacheDoc.exists) {
        const data = cacheDoc.data() as any
        resolvedPlaceData = data as PlaceData
        await cacheDoc.ref
          .update({ last_accessed: now, access_count: (data.access_count || 0) + 1 })
          .catch(() => {})
      } else if (place_data?.place_id) {
        const cachePayload: any = {
          format_version: '1.0.0',
          place_id: place_data.place_id,
          name: place_data.name,
          formatted_address: place_data.formatted_address,
          geometry: place_data.geometry,
          cached_at: now,
          last_accessed: now,
          access_count: 1,
        }
        if (place_data.address_components) cachePayload.address_components = place_data.address_components
        if (place_data.photos) cachePayload.photos = place_data.photos
        if (place_data.rating !== undefined) cachePayload.rating = place_data.rating
        if (place_data.user_ratings_total !== undefined) cachePayload.user_ratings_total = place_data.user_ratings_total
        if (place_data.price_level !== undefined) cachePayload.price_level = place_data.price_level
        if (place_data.types) cachePayload.types = place_data.types
        if (place_data.opening_hours?.weekday_text)
          cachePayload.opening_hours = { weekday_text: place_data.opening_hours.weekday_text }
        if (place_data.international_phone_number)
          cachePayload.international_phone_number = place_data.international_phone_number
        if (place_data.website) cachePayload.website = place_data.website
        if (place_data.editorial_summary) cachePayload.editorial_summary = place_data.editorial_summary

        await adminDb.collection(COLLECTIONS.PLACES_CACHE).doc(resolvedPlaceId).set(cachePayload)
        resolvedPlaceData = cachePayload as PlaceData
      }
    } catch {
      resolvedPlaceData = (place_data as PlaceData) || null
    }

    const savedItinerary = {
      id: docRef.id,
      ...itineraryData,
      place_data: resolvedPlaceData,
    }

    console.log(`Inserted itinerary at position ${newSortNumber} in day ${day_id}`, {
      id: savedItinerary.id,
      title: savedItinerary.title,
      sort_number: savedItinerary.sort_number,
    })

    return NextResponse.json(savedItinerary)
  } catch (error) {
    console.error('Error inserting itinerary:', error)
    return NextResponse.json({ error: 'Failed to insert itinerary' }, { status: 500 })
  }
}
