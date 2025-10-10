import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/logger'
import { adminDb } from '@/lib/firebase-admin'

export async function PUT(request: NextRequest) {
  try {
    const { itinerary_id, target_day_id } = await request.json()
    
    if (!itinerary_id || !target_day_id) {
      return NextResponse.json(
        { error: 'Missing required fields: itinerary_id, target_day_id' },
        { status: 400 }
      )
    }

    // 移動先の日程の最後のsort_numberを取得
    const itinerariesRef = adminDb.collection('itineraries')
    const existingItineraries = await itinerariesRef
      .where('day_id', '==', target_day_id)
      .orderBy('sort_number', 'desc')
      .limit(1)
      .get()
    
    const nextSortNumber = existingItineraries.empty ? 1 : (existingItineraries.docs[0].data().sort_number || 0) + 1

    // itineraryを新しい日程に移動
    const itineraryRef = adminDb.collection('itineraries').doc(itinerary_id)
    
    const updateData = {
      day_id: target_day_id,
      sort_number: nextSortNumber,
      updated_at: new Date()
    }
    
    await itineraryRef.update(updateData)
    
    // 更新されたデータを取得
    const updatedDoc = await itineraryRef.get()
    if (!updatedDoc.exists) {
      return NextResponse.json(
        { error: 'Itinerary not found' },
        { status: 404 }
      )
    }
    
    const updatedItinerary = {
      id: updatedDoc.id,
      ...updatedDoc.data()
    }

    return NextResponse.json(updatedItinerary)
  } catch (error) {
    logger.error('Error moving itinerary to different day:', error)
    return NextResponse.json(
      { error: 'Failed to move itinerary' },
      { status: 500 }
    )
  }
}
