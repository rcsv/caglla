import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/core/logger'
import { adminDb } from '@/lib/firebase/admin'

/**
 * Duplicates an existing itinerary into a specified day and returns the newly created record.
 *
 * @param request - NextRequest whose JSON body must include `itinerary_id` (the source itinerary document ID) and `target_day_id` (the destination day ID)
 * @returns The saved itinerary object containing the new document `id` and all stored fields: `day_id`, `sort_number`, `title`, `description`, `location`, `place_id`, `start_time`, `end_time`, `timezone`, `cost_amount`, `cost_currency`, `created_at`, and `updated_at`.
 */
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
      // place_idを優先的にコピー（後方互換でplace_dataからplace_id抽出）
      place_id: originalData.place_id || originalData.place_data?.place_id || null,
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
    logger.error('Error duplicating itinerary:', error)
    return NextResponse.json(
      { error: 'Failed to duplicate itinerary' },
      { status: 500 }
    )
  }
}