import { NextRequest, NextResponse } from 'next/server'
import { tripOperations, dayOperations, itineraryOperations } from '@/lib/firestore-operations'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tripId = params.id

    // Get trip details
    const trip = await tripOperations.getTripById(tripId)
    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    // Get days for this trip
    const days = await dayOperations.getDaysByTripId(tripId)

    // Get itineraries for each day
    const daysWithItineraries = await Promise.all(
      days.map(async (day) => {
        const itineraries = await itineraryOperations.getItinerariesByDayId(day.id)
        return {
          ...day,
          itineraries
        }
      })
    )

    return NextResponse.json({
      ...trip,
      days: daysWithItineraries
    })
  } catch (error) {
    console.error('Error fetching trip:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trip' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tripId = params.id
    const body = await request.json()
    
    const {
      title,
      description,
      destination,
      startDate,
      endDate,
      accessLevel
    } = body

    await tripOperations.updateTrip(tripId, {
      title,
      description,
      destination,
      start_date: startDate ? new Date(startDate) : undefined,
      end_date: endDate ? new Date(endDate) : undefined,
      access_level: accessLevel
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating trip:', error)
    return NextResponse.json(
      { error: 'Failed to update trip' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tripId = params.id

    // Delete trip (this will also delete related days and itineraries)
    await tripOperations.deleteTrip(tripId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting trip:', error)
    return NextResponse.json(
      { error: 'Failed to delete trip' },
      { status: 500 }
    )
  }
}
