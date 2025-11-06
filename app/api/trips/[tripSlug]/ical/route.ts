import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { toDateOrNull } from '@/lib/firebase/timestamp-utils'

import { exportTripToICal, exportReservationsToICal } from '@/lib/utils/export-helpers'
import { validateICalToken } from '@/lib/utils/ical-token'
import type { Trip, Day, Itinerary } from '@/lib/core/types'

/**
 * iCal公開API
 * GET /api/trips/[tripSlug]/ical?token=xxx&type=trip|reservations
 * Note: tripSlug parameter contains tripId (UUID) for backward compatibility
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tripSlug: string }> }
) {
  try {
    const { tripSlug } = await params
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const type = searchParams.get('type') || 'trip' // 'trip' or 'reservations'

    // 1. Trip取得 (tripSlug parameter contains tripId)
    const tripDoc = await adminDb.collection('trips').doc(tripSlug).get()
    
    if (!tripDoc.exists) {
      return new NextResponse('Trip not found', { status: 404 })
    }

    const tripData = tripDoc.data() as Trip
    const trip: Trip = {
      ...tripData,
      id: tripDoc.id,
    }

    // 2. iCal公開設定チェック
    if (!trip.ical_enabled) {
      return new NextResponse('iCal publishing is not enabled for this trip', { 
        status: 403,
        headers: { 'Content-Type': 'text/plain' }
      })
    }

    // 3. トークン認証
    if (!validateICalToken(token)) {
      return new NextResponse('Invalid token format', { 
        status: 401,
        headers: { 'Content-Type': 'text/plain' }
      })
    }

    if (token !== trip.ical_public_token) {
      return new NextResponse('Unauthorized', { 
        status: 401,
        headers: { 'Content-Type': 'text/plain' }
      })
    }

    // 4. Days取得（独立コレクションとして試行）
    console.log(`[iCal Debug] Fetching days for trip: ${tripSlug}`)
    
    // まず独立コレクションとして試行
    let daysSnapshot = await adminDb
      .collection('days')
      .where('trip_id', '==', tripSlug)
      .orderBy('day_number', 'asc')
      .get()
    
    console.log(`[iCal Debug] Days snapshot size (independent collection): ${daysSnapshot.size}`)
    
    // もし独立コレクションにデータがない場合は、サブコレクションとして試行
    if (daysSnapshot.size === 0) {
      console.log(`[iCal Debug] No days found in independent collection, trying subcollection`)
      daysSnapshot = await adminDb
        .collection('trips')
        .doc(tripSlug)
        .collection('days')
        .orderBy('day_number', 'asc')
        .get()
      console.log(`[iCal Debug] Days snapshot size (subcollection): ${daysSnapshot.size}`)
    }
    
    console.log(`[iCal Debug] Days snapshot docs:`, daysSnapshot.docs.map((doc: any) => ({ id: doc.id, data: doc.data() })))

    const days: Day[] = []
    
    for (const dayDoc of daysSnapshot.docs) {
      const dayData = dayDoc.data() as Day
      const day: Day = {
        ...dayData,
        id: dayDoc.id,
      }

      // 5. Itineraries取得（独立コレクションとして試行）
      console.log(`[iCal Debug] Fetching itineraries for day: ${dayDoc.id}`)
      
      // まず独立コレクションとして試行
      let itinerariesSnapshot = await adminDb
        .collection('itineraries')
        .where('day_id', '==', dayDoc.id)
        .orderBy('sort_number', 'asc')
        .get()
      
      console.log(`[iCal Debug] Itineraries snapshot size (independent collection) for day ${dayDoc.id}: ${itinerariesSnapshot.size}`)
      
      // もし独立コレクションにデータがない場合は、サブコレクションとして試行
      if (itinerariesSnapshot.size === 0) {
        console.log(`[iCal Debug] No itineraries found in independent collection, trying subcollection`)
        itinerariesSnapshot = await adminDb
          .collection('trips')
          .doc(tripSlug)
          .collection('days')
          .doc(dayDoc.id)
          .collection('itineraries')
          .orderBy('sort_number', 'asc')
          .get()
        console.log(`[iCal Debug] Itineraries snapshot size (subcollection) for day ${dayDoc.id}: ${itinerariesSnapshot.size}`)
      }
      
      console.log(`[iCal Debug] Itineraries docs:`, itinerariesSnapshot.docs.map((doc: any) => ({ id: doc.id, title: doc.data().title })))

      day.itineraries = itinerariesSnapshot.docs.map((itineraryDoc: any) => ({
        ...itineraryDoc.data(),
        id: itineraryDoc.id,
      })) as Itinerary[]

      days.push(day)
    }

    trip.days = days

    // 6. アクセスログ更新（非同期、エラーは無視）
    adminDb.collection('trips').doc(tripSlug).update({
      ical_last_accessed_at: new Date(),
    }).catch((err: any) => console.error('Failed to update ical_last_accessed_at:', err))

    // 7. iCal生成
    console.log(`[iCal Debug] Generating ${type} iCal for trip: ${trip.id} (${trip.title})`)
    console.log(`[iCal Debug] Trip data:`, {
      id: trip.id,
      title: trip.title,
      start_date: trip.start_date,
      end_date: trip.end_date,
      days_count: trip.days?.length || 0,
      total_itineraries: trip.days?.reduce((sum, day) => sum + (day.itineraries?.length || 0), 0) || 0
    })
    
    const icalContent = type === 'reservations' 
      ? exportReservationsToICal(trip)
      : exportTripToICal(trip)
    
    console.log(`[iCal Debug] Generated ${type} iCal content (${icalContent.length} chars):`)
    console.log('='.repeat(80))
    console.log(icalContent)
    console.log('='.repeat(80))

    // 8. ETag生成（キャッシュ用）
    const lastModified = toDateOrNull(trip.updated_at) || new Date()
    const etag = `"${trip.id}-${lastModified.getTime()}"`
    
    // 9. If-None-Matchヘッダーチェック（304 Not Modified対応）
    const clientEtag = request.headers.get('if-none-match')
    if (clientEtag === etag) {
      return new NextResponse(null, { 
        status: 304,
        headers: {
          'ETag': etag,
          'Cache-Control': 'private, max-age=3600',
        }
      })
    }

    // 10. レスポンス
    const filename = type === 'reservations'
      ? `${trip.slug || trip.id}_reservations.ics`
      : `${trip.slug || trip.id}_itinerary.ics`

    return new NextResponse(icalContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'private, max-age=3600', // 1時間キャッシュ
        'ETag': etag,
        'Last-Modified': new Date(lastModified).toUTCString(),
        'X-Content-Type-Options': 'nosniff',
        // カレンダーアプリに定期更新を促す
        'X-Published-TTL': 'PT1H', // 1時間ごとに更新
      },
    })
  } catch (error) {
    console.error('iCal API error:', error)
    return new NextResponse('Internal Server Error', { 
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    })
  }
}

