import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function POST(request: NextRequest) {
  try {
    const { itinerary_id, target_day_id } = await request.json()
    
    if (!itinerary_id || !target_day_id) {
      return NextResponse.json(
        { error: 'Missing required fields: itinerary_id, target_day_id' },
        { status: 400 }
      )
    }

    // 元のitineraryを取得
    const originalItineraryRef = adminDb.collection('itineraries').doc(itinerary_id)
    const originalDoc = await originalItineraryRef.get()
    
    if (!originalDoc.exists) {
      return NextResponse.json(
        { error: 'Original itinerary not found' },
        { status: 404 }
      )
    }

    const originalData = originalDoc.data()
    if (!originalData) {
      return NextResponse.json(
        { error: 'Original itinerary data not found' },
        { status: 404 }
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

    // 複製データを作成（タイトルに「(複製)」を追加）
    const duplicateData = {
      day_id: target_day_id,
      sort_number: nextSortNumber,
      title: `${originalData.title} (複製)`,
      description: originalData.description || '',
      location: originalData.location || '',
      place_data: originalData.place_data || null,
      start_time: originalData.start_time || '',
      end_time: originalData.end_time || '',
      timezone: originalData.timezone || 'UTC',
      cost_amount: originalData.cost_amount || null,
      cost_currency: originalData.cost_currency || 'JPY',
      created_at: new Date(),
      updated_at: new Date()
    }

    // Firestoreに複製を保存
    const docRef = await itinerariesRef.add(duplicateData)
    
    // 保存されたデータを返す
    const savedItinerary = {
      id: docRef.id,
      ...duplicateData
    }

    return NextResponse.json(savedItinerary)
  } catch (error) {
    console.error('Error duplicating itinerary:', error)
    return NextResponse.json(
      { error: 'Failed to duplicate itinerary' },
      { status: 500 }
    )
  }
}
