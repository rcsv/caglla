import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/logger'
import { adminDb, adminAuth } from '@/lib/firebase-admin'
import { COLLECTIONS } from '@/lib/firestore'

// 管理者専用: 既存の trips.destination_place と itineraries.place_data を
/**
 * Performs an admin-only migration that copies existing place objects into the centralized `places_cache`
 * and populates `destination_place_id` on Trip documents and `place_id` on Itinerary documents when missing.
 *
 * The request must include an Authorization header with a Bearer Firebase ID token for an admin user.
 *
 * @param request - Next.js POST request whose Authorization header must contain a Bearer ID token for an admin
 * @returns On success, a JSON object `{ success: true, stats }` where `stats` contains counts:
 *          `tripsProcessed`, `tripsUpdated`, `itinerariesProcessed`, `itinerariesUpdated`, and `cacheWritten`.
 *          Returns a 401 JSON error if authorization is missing/invalid, 403 if the caller is not an admin,
 *          or 500 with `{ error: 'Migration failed' }` on unexpected failures.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 })
    }
    const idToken = authHeader.split('Bearer ')[1]
    const decoded = await adminAuth.verifyIdToken(idToken)
    const isAdmin = (decoded as any).admin === true || (decoded as any)['https://hasura.io/jwt/claims']?.['x-hasura-default-role'] === 'admin'
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const stats = {
      tripsProcessed: 0,
      tripsUpdated: 0,
      itinerariesProcessed: 0,
      itinerariesUpdated: 0,
      cacheWritten: 0
    }

    // 1) Trips
    const tripsSnapshot = await adminDb.collection(COLLECTIONS.TRIPS).get()
    for (const doc of tripsSnapshot.docs) {
      stats.tripsProcessed++
      const data = doc.data()
      const dest = data.destination_place
      if (dest?.place_id && !data.destination_place_id) {
        // upsert cache
        const cachePayload: any = {
          format_version: '1.0.0',
          place_id: dest.place_id,
          name: dest.name,
          formatted_address: dest.formatted_address,
          geometry: dest.geometry,
          cached_at: new Date(),
          last_accessed: new Date(),
          access_count: 1
        }
        if (dest.address_components) cachePayload.address_components = dest.address_components
        if (dest.photos) cachePayload.photos = dest.photos
        if (dest.rating !== undefined) cachePayload.rating = dest.rating
        if (dest.user_ratings_total !== undefined) cachePayload.user_ratings_total = dest.user_ratings_total
        if (dest.price_level !== undefined) cachePayload.price_level = dest.price_level
        if (dest.types) cachePayload.types = dest.types
        if (dest.opening_hours?.weekday_text) cachePayload.opening_hours = { weekday_text: dest.opening_hours.weekday_text }
        if (dest.international_phone_number) cachePayload.international_phone_number = dest.international_phone_number
        if (dest.website) cachePayload.website = dest.website
        if (dest.editorial_summary) cachePayload.editorial_summary = dest.editorial_summary
        await adminDb.collection(COLLECTIONS.PLACES_CACHE).doc(dest.place_id).set(cachePayload, { merge: true })
        stats.cacheWritten++

        await doc.ref.update({ destination_place_id: dest.place_id, updated_at: new Date() })
        stats.tripsUpdated++
      }
    }

    // 2) Itineraries
    const itSnapshot = await adminDb.collection(COLLECTIONS.ITINERARIES).get()
    for (const doc of itSnapshot.docs) {
      stats.itinerariesProcessed++
      const data = doc.data()
      const pd = data.place_data
      if (pd?.place_id && !data.place_id) {
        const cachePayload: any = {
          format_version: '1.0.0',
          place_id: pd.place_id,
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
        await adminDb.collection(COLLECTIONS.PLACES_CACHE).doc(pd.place_id).set(cachePayload, { merge: true })
        stats.cacheWritten++

        await doc.ref.update({ place_id: pd.place_id, updated_at: new Date() })
        stats.itinerariesUpdated++
      }
    }

    return NextResponse.json({ success: true, stats })
  } catch (error) {
    logger.error('Migration failed:', error)
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 })
  }
}