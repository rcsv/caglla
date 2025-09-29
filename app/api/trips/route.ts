import { NextRequest, NextResponse } from 'next/server'
import { adminTripOperations, adminDayOperations } from '@/lib/firestore-admin-operations'
import { adminAuth } from '@/lib/firebase-admin'
import { groupTripsByCountry } from '@/lib/country-utils'

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
    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
    }

    const idToken = authHeader.split('Bearer ')[1]
    
    // Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    const userId = decodedToken.uid

    const body = await request.json()
    
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
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    // Create trip
    const trip = await adminTripOperations.createTrip({
      user_id: userId,
      title,
      description,
      destination,
      destination_place: destinationPlace,
      start_date: startDate ? new Date(startDate) : undefined,
      end_date: endDate ? new Date(endDate) : undefined,
      access_level: accessLevel,
      image_url: imageUrl || undefined,
      status: 'PLANNING' as const
    })

    // Create days if start and end dates are provided
    if (startDate && endDate) {
      await createDaysForTrip(trip.id, startDate, endDate)
    }

    return NextResponse.json(trip)
  } catch (error) {
    console.error('Error creating trip:', error)
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
