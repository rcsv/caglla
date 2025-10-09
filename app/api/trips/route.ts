import { NextRequest, NextResponse } from 'next/server'
import { adminTripOperations, adminDayOperations, adminUserOperations } from '@/lib/firestore-admin-operations'
import { adminAuth } from '@/lib/firebase-admin'
import { groupTripsByCountry } from '@/lib/country-utils'
import { generateUniqueSlug } from '@/lib/slug-utils'
import { adminDb } from '@/lib/firebase-admin'
import { COLLECTIONS } from '@/lib/firestore'
import type { PlaceData } from '@/lib/types'

/**
 * Retrieve trips for the authenticated user, optionally grouped by country.
 *
 * Expects an Authorization header with a Bearer ID token and an optional
 * query parameter `groupByCountry=true` to enable grouping.
 *
 * @param request - The incoming HTTP request containing authorization and query parameters
 * @returns When `groupByCountry` is `true`, an object with `trips` as an array of country groups, `grouped: true`, `totalTrips`, and `totalCountries`; otherwise an object with `trips` as an array of trip records
 */
export async function GET(request: NextRequest) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const groupByCountry = searchParams.get('groupByCountry') === 'true'

    const trips = await adminTripOperations.getTripsByUserId(userId)

    if (groupByCountry) {
      // Group trips by country
      const countryGroups = await groupTripsByCountry(trips)
      return NextResponse.json({ 
        trips: countryGroups,
        grouped: true,
        totalTrips: trips.length,
        totalCountries: countryGroups.length
      })
    }

    return NextResponse.json({ trips })
  } catch (error) {
    console.error('Error fetching trips:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trips' },
      { status: 500 }
    )
  }
}

/**
 * Create a new trip for the authenticated user, optionally create per-day records, and return the created trip enriched with creator and cached destination_place data when available.
 *
 * Requires a Bearer ID token in the Authorization header. The request body may include title, destination, destinationPlace or destinationPlaceId, startDate/endDate (to create days), description, accessLevel, and imageUrl.
 *
 * @param request - The incoming NextRequest containing the Authorization header and JSON body for the new trip.
 * @returns A NextResponse containing the created trip object on success. Returns a JSON error with status 401 for missing/invalid authorization, 400 if both title and destination are missing, and 500 for other server errors.
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Trip API: Starting trip creation')
    
    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Trip API: Missing authorization header')
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
    }

    const idToken = authHeader.split('Bearer ')[1]
    
    // Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    const userId = decodedToken.uid
    
    console.log('✅ Trip API: User authenticated:', userId)

    const body = await request.json()
    
    console.log('📝 Trip API: Request body:', {
      title: body.title,
      destination: body.destination,
      hasImageUrl: !!body.imageUrl,
      accessLevel: body.accessLevel
    })
    
    const {
      title,
      description,
      destination,
      destinationPlace,
      destinationPlaceId,
      startDate,
      endDate,
      accessLevel = 'private',
      imageUrl
    } = body

    // タイトルが空の場合は目的地を使用
    const finalTitle = title || destination
    if (!finalTitle) {
      console.log('❌ Trip API: Title or destination is required')
      return NextResponse.json(
        { error: 'Title or destination is required' },
        { status: 400 }
      )
    }

    console.log('🔄 Trip API: Getting existing trips for user:', userId)
    
    // ユーザーの既存旅行スラッグを取得
    const existingTrips = await adminTripOperations.getTripsByUserId(userId)
    const existingSlugs = existingTrips.map(t => t.slug).filter((slug): slug is string => Boolean(slug))
    
    console.log('📊 Trip API: Found existing trips:', existingTrips.length, 'slugs:', existingSlugs.length)
    
    // 旅行タイトルからユニークなスラッグを生成
    const tripSlug = generateUniqueSlug(finalTitle, existingSlugs)
    
    console.log('🏷️ Trip API: Generated trip slug:', tripSlug)

    console.log('🏗️ Trip API: Creating trip with data:', {
      userId,
      title: finalTitle,
      slug: tripSlug,
      destination,
      hasDestinationPlace: !!destinationPlace,
      hasImageUrl: !!imageUrl
    })

    // Create trip
    const tripData: any = {
      user_id: userId,
      title: finalTitle,
      slug: tripSlug,
      destination,
      access_level: accessLevel,
      status: 'PLANNING' as const
    }

    // オプショナルフィールドを条件付きで追加
    if (description) tripData.description = description
    // place_id 優先で保存（後方互換でオブジェクトも受ける）
    const resolvedDestPlaceId: string | undefined = destinationPlaceId || destinationPlace?.place_id
    if (resolvedDestPlaceId) tripData.destination_place_id = resolvedDestPlaceId
    if (startDate) tripData.start_date = new Date(startDate)
    if (endDate) tripData.end_date = new Date(endDate)
    if (imageUrl) tripData.image_url = imageUrl

    const trip = await adminTripOperations.createTrip(tripData)

    console.log('✅ Trip API: Trip created successfully:', trip.id)

    // Create days if start and end dates are provided
    if (startDate && endDate) {
      console.log('📅 Trip API: Creating days for trip:', trip.id)
      await createDaysForTrip(trip.id, startDate, endDate)
      console.log('✅ Trip API: Days created successfully')
    }

    console.log('👤 Trip API: Fetching user data for creator info')
    
    // 最新のユーザー情報を取得してcreator情報を追加
    const user = await adminUserOperations.getUserByGoogleId(userId)
    if (user) {
      trip.creator = user
      console.log('✅ Trip API: Creator info added:', user.slug)
    } else {
      console.log('⚠️ Trip API: User not found for creator info')
    }

    // UI利便性のため、destination_place を解決して返す
    try {
      if (resolvedDestPlaceId) {
        const cacheDoc = await adminDb.collection(COLLECTIONS.PLACES_CACHE).doc(resolvedDestPlaceId).get()
        if (cacheDoc.exists) {
          (trip as any).destination_place = cacheDoc.data()
          await cacheDoc.ref.update({ last_accessed: new Date(), access_count: (cacheDoc.data().access_count || 0) + 1 }).catch(() => {})
        } else if (destinationPlace?.place_id) {
          // 受け取ったオブジェクトがあればキャッシュ保存
          const pd = destinationPlace as PlaceData
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
          await adminDb.collection(COLLECTIONS.PLACES_CACHE).doc(pd.place_id).set(cachePayload)
          ;(trip as any).destination_place = cachePayload
        }
      }
    } catch (e) {
      // best-effort
    }

    console.log('🎉 Trip API: Trip creation completed successfully')
    return NextResponse.json(trip)
  } catch (error) {
    console.error('❌ Trip API: Error creating trip:', error)
    console.error('❌ Trip API: Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: 'Failed to create trip' },
      { status: 500 }
    )
  }
}

async function createDaysForTrip(tripId: string, startDate: string, endDate: string) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  let current = new Date(start)
  let dayNumber = 1

  while (current <= end) {
    await adminDayOperations.createDay({
      trip_id: tripId,
      day_number: dayNumber,
      date: new Date(current)
    })
    current.setDate(current.getDate() + 1)
    dayNumber++
  }
}