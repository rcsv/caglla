import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import logger from '@/lib/core/logger'
import { generateReservationSummary } from '@/lib/utils/reservation-utils'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    // reorderリクエストかどうかを判定
    if (body.day_id !== undefined && body.sort_number !== undefined) {
      // reorderリクエスト
      const { day_id, sort_number } = body
      
      const itineraryRef = adminDb.collection('itineraries').doc(id)
      
      const updateData = {
        day_id,
        sort_number,
        updated_at: new Date()
      }
      
      await itineraryRef.update(updateData)
      
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
    } else {
      // 通常の更新リクエスト
      const { title, description, start_time, end_time, timezone, cost_amount, cost_currency, activity_tag, reservation } = body
      
      const itineraryRef = adminDb.collection('itineraries').doc(id)
      
      const updateData: any = {
        updated_at: new Date()
      }
      
      if (title !== undefined) updateData.title = title
      if (description !== undefined) updateData.description = description
      if (start_time !== undefined) updateData.start_time = start_time
      if (end_time !== undefined) updateData.end_time = end_time
      if (timezone !== undefined) updateData.timezone = timezone
      if (cost_amount !== undefined) updateData.cost_amount = cost_amount
      if (cost_currency !== undefined) updateData.cost_currency = cost_currency
      if (activity_tag !== undefined) updateData.activity_tag = activity_tag
      if (reservation !== undefined) {
        updateData.reservation = reservation
        // 予約情報が存在する場合、関連フィールドも更新
        updateData.reservation_exists = !!reservation
        if (reservation?.type) updateData.reservation_type = reservation.type
        if (reservation?.start_date) updateData.reservation_start_ts = reservation.start_date
        if (reservation?.end_date) updateData.reservation_end_ts = reservation.end_date
        if (reservation?.departure_at) updateData.reservation_start_ts = reservation.departure_at
        if (reservation?.arrival_at) updateData.reservation_end_ts = reservation.arrival_at
        // 予約サマリーを生成（場所名はitineraryのplace_dataから取得）
        if (reservation) {
          // 既存のitineraryデータを取得してplace_dataから場所名を取得
          const currentDoc = await itineraryRef.get()
          const currentData = currentDoc.data()
          const placeName = currentData?.place_data?.name
          updateData.reservation_summary = generateReservationSummary(reservation, placeName)
        }
      }
      
      await itineraryRef.update(updateData)
      
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
    }
  } catch (error) {
    logger.error('Error updating itinerary', error)
    return NextResponse.json(
      { error: 'Failed to update itinerary' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const itineraryRef = adminDb.collection('itineraries').doc(id)
    
    // 削除前にitineraryの情報を取得（day_idとsort_numberを取得するため）
    const itineraryDoc = await itineraryRef.get()
    if (!itineraryDoc.exists) {
      return NextResponse.json(
        { error: 'Itinerary not found' },
        { status: 404 }
      )
    }
    
    const itineraryData = itineraryDoc.data()
    const dayId = itineraryData?.day_id
    const deletedSortNumber = itineraryData?.sort_number || 0
    
    // ハードデリート（実際にドキュメントを削除）
    await itineraryRef.delete()

    logger.info('Itinerary deleted', { itineraryId: id })

    // 同じ日程の後続のitinerariesのsort_numberを1つずつ減らす
    if (dayId && deletedSortNumber > 0) {
      const itinerariesRef = adminDb.collection('itineraries')
      const subsequentItineraries = await itinerariesRef
        .where('day_id', '==', dayId)
        .where('sort_number', '>', deletedSortNumber)
        .get()
      
      if (!subsequentItineraries.empty) {
        const batch = adminDb.batch()
        
        subsequentItineraries.docs.forEach((doc: any) => {
          const currentSortNumber = doc.data().sort_number || 0
          batch.update(doc.ref, { 
            sort_number: currentSortNumber - 1,
            updated_at: new Date()
          })
        })
        
        await batch.commit()
        logger.debug('Renumbered subsequent itineraries', { count: subsequentItineraries.docs.length })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Error deleting itinerary', error)
    return NextResponse.json(
      { error: 'Failed to delete itinerary' },
      { status: 500 }
    )
  }
}
