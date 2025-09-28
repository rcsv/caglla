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

    // Convert Firestore Timestamps to Date objects
    const convertedTripData = {
      ...tripData,
      created_at: tripData.created_at?.toDate ? tripData.created_at.toDate() : tripData.created_at,
      updated_at: tripData.updated_at?.toDate ? tripData.updated_at.toDate() : tripData.updated_at,
      start_date: tripData.start_date?.toDate ? tripData.start_date.toDate() : tripData.start_date,
      end_date: tripData.end_date?.toDate ? tripData.end_date.toDate() : tripData.end_date,
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
      
      // Convert Firestore Timestamps to Date objects for day data
      const convertedDayData = {
        ...dayData,
        created_at: dayData.created_at?.toDate ? dayData.created_at.toDate() : dayData.created_at,
        updated_at: dayData.updated_at?.toDate ? dayData.updated_at.toDate() : dayData.updated_at,
        date: dayData.date?.toDate ? dayData.date.toDate() : dayData.date,
      }
      
      // 各DayのItinerariesを取得
      const itinerariesSnapshot = await adminDb
        .collection(COLLECTIONS.ITINERARIES)
        .where('day_id', '==', dayDoc.id)
        .get()

      const itineraries = itinerariesSnapshot.docs
        .map(itineraryDoc => {
          const itineraryData = itineraryDoc.data()
          return {
            id: itineraryDoc.id,
            ...itineraryData,
            created_at: itineraryData.created_at?.toDate ? itineraryData.created_at.toDate() : itineraryData.created_at,
            updated_at: itineraryData.updated_at?.toDate ? itineraryData.updated_at.toDate() : itineraryData.updated_at,
          }
        })
        .filter(itinerary => !itinerary.deleted_at) // 削除されていないもののみ
        .sort((a, b) => (a.sort_number || 0) - (b.sort_number || 0)) // sort_number順でソート

      days.push({
        id: dayDoc.id,
        ...convertedDayData,
        itineraries
      })
    }

    // 作成者情報を取得（google_idで検索）
    let creator = null
    if (convertedTripData.user_id) {
      try {
        // google_idでusersコレクションを検索
        const usersSnapshot = await adminDb
          .collection('users')
          .where('google_id', '==', convertedTripData.user_id)
          .limit(1)
          .get()
        
        if (!usersSnapshot.empty) {
          const userDoc = usersSnapshot.docs[0]
          const userData = userDoc.data()
          creator = {
            id: userDoc.id,
            name: userData?.name || 'Unknown User',
            email: userData?.email || '',
            avatar_url: userData?.avatar_url || null
          }
        }
      } catch (error) {
        console.error('Error fetching creator:', error)
      }
    }

    const trip = {
      id: tripDoc.id,
      ...convertedTripData,
      days,
      creator
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
    const updatedTripData = updatedDoc.data()
    
    // Convert Firestore Timestamps to Date objects
    const convertedUpdatedTripData = {
      ...updatedTripData,
      created_at: updatedTripData.created_at?.toDate ? updatedTripData.created_at.toDate() : updatedTripData.created_at,
      updated_at: updatedTripData.updated_at?.toDate ? updatedTripData.updated_at.toDate() : updatedTripData.updated_at,
      start_date: updatedTripData.start_date?.toDate ? updatedTripData.start_date.toDate() : updatedTripData.start_date,
      end_date: updatedTripData.end_date?.toDate ? updatedTripData.end_date.toDate() : updatedTripData.end_date,
    }
    
    const updatedTrip = {
      id: updatedDoc.id,
      ...convertedUpdatedTripData
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
