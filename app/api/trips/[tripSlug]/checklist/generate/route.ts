import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { checklistGenerator } from '@/lib/checklist-generator'
import logger from '@/lib/core/logger'
import { adminAuth } from '@/lib/firebase/admin'
import { PlacesCache, Trip, Day, Itinerary } from '@/lib/core/types'
import { COLLECTIONS } from '@/lib/firebase/firestore'
import { adminTripOperations, adminUserOperations } from '@/lib/firebase/admin-operation'
import { toDateOrNull } from '@/lib/firebase/timestamp-utils'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripSlug: string }> }
) {
  try {
    const { tripSlug } = await params

    // 認証チェック
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(token)
    const googleId = decodedToken.uid

    // ユーザー情報取得（google_idで検索）
    const user = await adminUserOperations.getUserByGoogleId(googleId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // ユーザーの居住国コードを place_cache から解決（home_place_id 優先）
    if (user.preferences?.home_place_id && !user.preferences.home_country_code) {
      try {
        const cacheDoc = await adminDb.collection(COLLECTIONS.PLACES_CACHE).doc(user.preferences.home_place_id).get()
        if (cacheDoc.exists) {
          const place = cacheDoc.data() as PlacesCache
          const countryComponent = place.address_components?.find(c => c.types.includes('country'))
          if (countryComponent?.short_name) {
            user.preferences.home_country_code = countryComponent.short_name
          }
          // 住所名の補完
          if (!user.preferences.home_address) {
            user.preferences.home_address = place.name || place.formatted_address
          }
        }
      } catch (e) {
        logger.warn('Failed to resolve user home country from place cache', e)
      }
    }

    // tripSlugからtripIdとtripを解決
    const resolved = await adminTripOperations.resolveTripByIdOrSlug(tripSlug)
    if (!resolved) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }
    const { id: tripId, trip: tripData } = resolved

    // Daysを取得
    const daysSnapshot = await adminDb
      .collection(COLLECTIONS.DAYS)
      .where('trip_id', '==', tripId)
      .orderBy('day_number', 'asc')
      .get()

    // 各DayにItinerariesを紐付け
    const days: Day[] = []
    for (const dayDoc of daysSnapshot.docs) {
      const dayData = dayDoc.data()
      const dayId = dayDoc.id
      
      // 各DayのItinerariesを取得（day_idでクエリ）
      const itinerariesSnapshot = await adminDb
        .collection(COLLECTIONS.ITINERARIES)
        .where('day_id', '==', dayId)
        .orderBy('sort_number', 'asc')
        .get()

      const itineraries: Itinerary[] = itinerariesSnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          start_time: data.start_time || null,
          end_time: data.end_time || null,
          created_at: toDateOrNull(data.created_at) || data.created_at,
          updated_at: toDateOrNull(data.updated_at) || data.updated_at,
        } as Itinerary
      })

      logger.debug('Fetched itineraries for day', { dayId, count: itineraries.length })

      days.push({
        id: dayId,
        ...dayData,
        date: toDateOrNull(dayData.date) || dayData.date,
        created_at: toDateOrNull(dayData.created_at) || dayData.created_at,
        updated_at: toDateOrNull(dayData.updated_at) || dayData.updated_at,
        itineraries
      } as Day)
    }

    // Tripオブジェクトを構築
    const trip: Trip = {
      ...tripData,
      days
    }

    logger.debug('Checklist Generate API: Trip data prepared', {
      tripId,
      daysCount: trip.days?.length || 0,
      totalItineraries: trip.days?.reduce((sum, day) => sum + (day.itineraries?.length || 0), 0) || 0,
      itinerariesWithActivityTag: trip.days?.flatMap(day => 
        day.itineraries?.filter(it => it.activity_tag) || []
      ).length || 0
    })

    // チェックリスト生成（ユーザー情報も渡す）
    const items = await checklistGenerator.generateTripChecklist(trip, user)
    
    logger.debug('Checklist Generate API: Generated items', {
      itemsCount: items.length,
      itemsByCategory: items.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    })

    // 保存: trip_checklists/{tripId}
    const checklistRef = adminDb.collection('trip_checklists').doc(tripId)
    await checklistRef.set({
      id: tripId,
      trip_id: tripId,
      items,
      last_generated_at: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    }, { merge: true })

    return NextResponse.json({ success: true, items })
  } catch (error) {
    logger.error('Failed to generate checklist', error)
    return NextResponse.json({ error: 'Failed to generate checklist' }, { status: 500 })
  }
}


