import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/core/logger'
import { adminDb } from '@/lib/firebase/admin'
import { badRequest, notFound, parseRequestBody, handleApiError } from '@/lib/core/error-handler'

export async function PUT(request: NextRequest) {
  try {
    const body = await parseRequestBody<{
      itinerary_id?: string
      target_day_id?: string
    }>(request)
    const { itinerary_id, target_day_id } = body
    
    if (!itinerary_id || !target_day_id) {
      return badRequest('Missing required fields: itinerary_id, target_day_id')
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
      return notFound('Itinerary')
    }
    
    const updatedItinerary = {
      id: updatedDoc.id,
      ...updatedDoc.data()
    }

    return NextResponse.json(updatedItinerary)
  } catch (error) {
    return handleApiError(
      error instanceof Error ? error : new Error(String(error)),
      '/api/itineraries/move-to-day'
    )
  }
}
