import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

const COLLECTIONS = {
  TRIPS: 'trips',
  DAYS: 'days',
  ITINERARIES: 'itineraries'
} as const

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tripId = params.id

    if (!tripId) {
      return NextResponse.json(
        { error: 'Trip ID is required' },
        { status: 400 }
      )
    }

    // Tripを取得
    const tripDoc = await adminDb.collection(COLLECTIONS.TRIPS).doc(tripId).get()
    
    if (!tripDoc.exists) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      )
    }

    const tripData = tripDoc.data()
    if (!tripData) {
      return NextResponse.json(
        { error: 'Trip data not found' },
        { status: 404 }
      )
    }

    // Daysを取得
    const daysSnapshot = await adminDb
      .collection(COLLECTIONS.DAYS)
      .where('trip_id', '==', tripId)
      .orderBy('day_number', 'asc')
      .get()

    const days = []
    for (const dayDoc of daysSnapshot.docs) {
      const dayData = dayDoc.data()
      
      // 各DayのItinerariesを取得
      const itinerariesSnapshot = await adminDb
        .collection(COLLECTIONS.ITINERARIES)
        .where('day_id', '==', dayDoc.id)
        .get()

      const itineraries = itinerariesSnapshot.docs
        .map(itineraryDoc => ({
          id: itineraryDoc.id,
          ...itineraryDoc.data()
        }))
        .filter(itinerary => !itinerary.deleted_at) // 削除されていないもののみ
        .sort((a, b) => (a.sort_number || 0) - (b.sort_number || 0)) // sort_number順でソート

      days.push({
        id: dayDoc.id,
        ...dayData,
        itineraries
      })
    }

    const trip = {
      id: tripDoc.id,
      ...tripData,
      days
    }

    return NextResponse.json(trip)
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

    if (!tripId) {
      return NextResponse.json(
        { error: 'Trip ID is required' },
        { status: 400 }
      )
    }

    const tripRef = adminDb.collection(COLLECTIONS.TRIPS).doc(tripId)
    
    // Tripが存在するかチェック
    const tripDoc = await tripRef.get()
    if (!tripDoc.exists) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      )
    }

    const updateData = {
      ...body,
      updated_at: new Date()
    }

    await tripRef.update(updateData)

    const updatedDoc = await tripRef.get()
    const updatedTrip = {
      id: updatedDoc.id,
      ...updatedDoc.data()
    }

    return NextResponse.json(updatedTrip)
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

    if (!tripId) {
      return NextResponse.json(
        { error: 'Trip ID is required' },
        { status: 400 }
      )
    }

    const tripRef = adminDb.collection(COLLECTIONS.TRIPS).doc(tripId)
    
    // Tripが存在するかチェック
    const tripDoc = await tripRef.get()
    if (!tripDoc.exists) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      )
    }

    // ソフトデリート（deleted_atを設定）
    await tripRef.update({
      deleted_at: new Date(),
      updated_at: new Date()
    })

    return NextResponse.json({ message: 'Trip deleted successfully' })
  } catch (error) {
    console.error('Error deleting trip:', error)
    return NextResponse.json(
      { error: 'Failed to delete trip' },
      { status: 500 }
    )
  }
}
