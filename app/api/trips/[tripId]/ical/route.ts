import { NextRequest, NextResponse } from 'next/server'
import { getFirestore } from 'firebase-admin/firestore'
import { initializeFirebaseAdmin } from '@/lib/firebase/admin'
import { exportTripToICal, exportReservationsToICal } from '@/lib/utils/export-helpers'
import { validateICalToken } from '@/lib/utils/ical-token'
import type { Trip, Day, Itinerary } from '@/lib/core/types'

// Firebase Admin初期化
initializeFirebaseAdmin()
const db = getFirestore()

/**
 * iCal公開API
 * GET /api/trips/[tripId]/ical?token=xxx&type=trip|reservations
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const type = searchParams.get('type') || 'trip' // 'trip' or 'reservations'

    // 1. Trip取得
    const tripDoc = await db.collection('trips').doc(params.tripId).get()
    
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

    // 4. Days取得（サブコレクション）
    const daysSnapshot = await db
      .collection('trips')
      .doc(params.tripId)
      .collection('days')
      .orderBy('day_number', 'asc')
      .get()

    const days: Day[] = []
    
    for (const dayDoc of daysSnapshot.docs) {
      const dayData = dayDoc.data() as Day
      const day: Day = {
        ...dayData,
        id: dayDoc.id,
      }

      // 5. Itineraries取得（サブコレクション）
      const itinerariesSnapshot = await db
        .collection('trips')
        .doc(params.tripId)
        .collection('days')
        .doc(dayDoc.id)
        .collection('itineraries')
        .orderBy('sort_number', 'asc')
        .get()

      day.itineraries = itinerariesSnapshot.docs.map(itineraryDoc => ({
        ...itineraryDoc.data(),
        id: itineraryDoc.id,
      })) as Itinerary[]

      days.push(day)
    }

    trip.days = days

    // 6. アクセスログ更新（非同期、エラーは無視）
    db.collection('trips').doc(params.tripId).update({
      ical_last_accessed_at: new Date(),
    }).catch(err => console.error('Failed to update ical_last_accessed_at:', err))

    // 7. iCal生成
    const icalContent = type === 'reservations' 
      ? exportReservationsToICal(trip)
      : exportTripToICal(trip)

    // 8. ETag生成（キャッシュ用）
    const lastModified = trip.updated_at
    const etag = `"${trip.id}-${lastModified}"`
    
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

