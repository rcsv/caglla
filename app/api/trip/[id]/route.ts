import { NextRequest, NextResponse } from 'next/server'
import { adminTripOperations, adminDayOperations, adminItineraryOperations } from '@/lib/firestore-admin-operations'
import { adminAuth } from '@/lib/firebase-admin'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tripId = params.id

    // Get trip details
    const trip = await adminTripOperations.getTripById(tripId)
    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    // Get days for this trip
    const days = await adminDayOperations.getDaysByTripId(tripId)

    // Get itineraries for each day
    const daysWithItineraries = await Promise.all(
      days.map(async (day) => {
        const itineraries = await adminItineraryOperations.getItinerariesByDayId(day.id)
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
    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
    }

    const idToken = authHeader.split('Bearer ')[1]
    
    // Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    const userId = decodedToken.uid

    const tripId = params.id
    const body = await request.json()
    
    const {
      title,
      description,
      destination,
      destinationPlace,
      startDate,
      endDate,
      accessLevel,
      imageUrl
    } = body

    // Verify user owns this trip
    const trip = await adminTripOperations.getTripById(tripId)
    if (!trip || trip.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // 日程が変更されたかチェック
    const originalTrip = await adminTripOperations.getTripById(tripId)
    const originalStartDate = originalTrip?.start_date
    const originalEndDate = originalTrip?.end_date
    const newStartDate = startDate ? new Date(startDate) : undefined
    const newEndDate = endDate ? new Date(endDate) : undefined
    
    // 日程が変更された場合、dayドキュメントを更新
    const datesChanged = (
      (originalStartDate?.getTime() !== newStartDate?.getTime()) ||
      (originalEndDate?.getTime() !== newEndDate?.getTime())
    )
    
    if (datesChanged && newStartDate && newEndDate) {
      await adminDayOperations.updateDaysForTripAtomic(tripId, newStartDate, newEndDate)
    }

    await adminTripOperations.updateTrip(tripId, {
      title,
      description,
      destination,
      destination_place: destinationPlace,
      start_date: newStartDate,
      end_date: newEndDate,
      access_level: accessLevel,
      image_url: imageUrl || undefined
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
    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
    }

    const idToken = authHeader.split('Bearer ')[1]
    
    // Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    const userId = decodedToken.uid

    const tripId = params.id

    // Verify user owns this trip
    const trip = await adminTripOperations.getTripById(tripId)
    if (!trip || trip.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Delete trip (this will also delete related days and itineraries)
    await adminTripOperations.deleteTrip(tripId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting trip:', error)
    return NextResponse.json(
      { error: 'Failed to delete trip' },
      { status: 500 }
    )
  }
}
