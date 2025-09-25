import { NextRequest, NextResponse } from 'next/server'
import { tripOperations, dayOperations } from '@/lib/firestore-operations'

export async function GET(request: NextRequest) {
  try {
    // Get user ID from query parameter (in real app, this would come from auth)
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const trips = await tripOperations.getTripsByUserId(userId)
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
    const body = await request.json()
    
    const {
      userId,
      title,
      description,
      destination,
      startDate,
      endDate,
      accessLevel = 'private'
    } = body

    if (!userId || !title) {
      return NextResponse.json(
        { error: 'User ID and title are required' },
        { status: 400 }
      )
    }

    // Create trip
    const trip = await tripOperations.createTrip({
      user_id: userId,
      title,
      description,
      destination,
      start_date: startDate ? new Date(startDate) : undefined,
      end_date: endDate ? new Date(endDate) : undefined,
      access_level: accessLevel
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
    await dayOperations.createDay({
      trip_id: tripId,
      day_number: dayNumber,
      date: new Date(current)
    })
    current.setDate(current.getDate() + 1)
    dayNumber++
  }
}
