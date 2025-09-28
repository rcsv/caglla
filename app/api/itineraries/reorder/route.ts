import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { day_id, sort_number } = await request.json()
    
    if (!day_id || sort_number === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: day_id, sort_number' },
        { status: 400 }
      )
    }

    const itineraryRef = adminDb.collection('itineraries').doc(params.id)
    
    // 更新データを準備
    const updateData = {
      day_id,
      sort_number,
      updated_at: new Date()
    }
    
    // Firestoreを更新
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
    console.error('Error reordering itinerary:', error)
    return NextResponse.json(
      { error: 'Failed to reorder itinerary' },
      { status: 500 }
    )
  }
}

// 複数のitinerariesのsort_numberを一括更新
export async function PATCH(request: NextRequest) {
  try {
    const { updates } = await request.json()
    
    if (!Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'Updates must be an array' },
        { status: 400 }
      )
    }

    const batch = adminDb.batch()
    
    for (const update of updates) {
      const { id, day_id, sort_number } = update
      if (!id || !day_id || sort_number === undefined) {
        continue
      }
      
      const itineraryRef = adminDb.collection('itineraries').doc(id)
      batch.update(itineraryRef, {
        day_id,
        sort_number,
        updated_at: new Date()
      })
    }
    
    await batch.commit()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error batch updating itineraries:', error)
    return NextResponse.json(
      { error: 'Failed to batch update itineraries' },
      { status: 500 }
    )
  }
}
