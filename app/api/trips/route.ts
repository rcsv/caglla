import { NextRequest, NextResponse } from 'next/server'
import { adminTripOperations, adminDayOperations, adminUserOperations } from '@/lib/firestore-admin-operations'
import { adminAuth } from '@/lib/firebase-admin'
import { groupTripsByCountry } from '@/lib/country-utils'
import { generateUniqueSlug } from '@/lib/slug-utils'

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
      startDate,
      endDate,
      accessLevel = 'private',
      imageUrl
    } = body

    if (!title) {
      console.log('❌ Trip API: Title is required')
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    console.log('🔄 Trip API: Getting existing trips for user:', userId)
    
    // ユーザーの既存旅行スラッグを取得
    const existingTrips = await adminTripOperations.getTripsByUserId(userId)
    const existingSlugs = existingTrips.map(t => t.slug).filter((slug): slug is string => Boolean(slug))
    
    console.log('📊 Trip API: Found existing trips:', existingTrips.length, 'slugs:', existingSlugs.length)
    
    // 旅行タイトルからユニークなスラッグを生成
    const tripSlug = generateUniqueSlug(title, existingSlugs)
    
    console.log('🏷️ Trip API: Generated trip slug:', tripSlug)

    console.log('🏗️ Trip API: Creating trip with data:', {
      userId,
      title,
      slug: tripSlug,
      destination,
      hasDestinationPlace: !!destinationPlace,
      hasImageUrl: !!imageUrl
    })

    // Create trip
    const tripData: any = {
      user_id: userId,
      title,
      slug: tripSlug,
      destination,
      access_level: accessLevel,
      status: 'PLANNING' as const
    }

    // オプショナルフィールドを条件付きで追加
    if (description) tripData.description = description
    if (destinationPlace) tripData.destination_place = destinationPlace
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
