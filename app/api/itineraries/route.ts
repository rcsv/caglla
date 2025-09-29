import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { PlaceData } from '@/lib/firestore'

// Firestore collection names
const COLLECTIONS = {
  ITINERARIES: 'itineraries',
  DAYS: 'days'
} as const

export async function POST(request: NextRequest) {
  try {
    const { day_id, place_data, title, description, location } = await request.json()
    
    if (!day_id || !place_data || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: day_id, place_data, title' },
        { status: 400 }
      )
    }

    // 同じday_idの既存のitinerariesを取得してsort_numberを決定
    const itinerariesRef = adminDb.collection(COLLECTIONS.ITINERARIES)
    const existingItineraries = await itinerariesRef
      .where('day_id', '==', day_id)
      .orderBy('sort_number', 'desc')
      .limit(1)
      .get()
    
    const nextSortNumber = existingItineraries.empty ? 1 : existingItineraries.docs[0].data().sort_number + 1

    // PlaceDataを保存用の形式に変換
    const itineraryData = {
      day_id,
      sort_number: nextSortNumber,
      title,
      description: description || '',
      location: location || '',
      place_data: place_data as PlaceData,
      created_at: new Date(),
      updated_at: new Date()
    }

    // Firestoreに保存
    const docRef = await itinerariesRef.add(itineraryData)
    
    // 保存されたデータを返す
    const savedItinerary = {
      id: docRef.id,
      ...itineraryData
    }

    return NextResponse.json(savedItinerary)
  } catch (error) {
    console.error('Error creating itinerary:', error)
    return NextResponse.json(
      { error: 'Failed to create itinerary' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dayId = searchParams.get('day_id')
    
    if (!dayId) {
      return NextResponse.json(
        { error: 'day_id parameter is required' },
        { status: 400 }
      )
    }

    // 指定されたday_idのitinerariesを取得
    const itinerariesRef = adminDb.collection(COLLECTIONS.ITINERARIES)
    const itinerariesSnapshot = await itinerariesRef
      .where('day_id', '==', dayId)
      .orderBy('sort_number', 'asc')
      .get()
    
    const itineraries = itinerariesSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }))

    return NextResponse.json(itineraries)
  } catch (error) {
    console.error('Error fetching itineraries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch itineraries' },
      { status: 500 }
    )
  }
}
