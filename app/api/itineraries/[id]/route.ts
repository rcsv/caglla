import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { adminDb } from '@/lib/firebase/admin'
import logger from '@/lib/core/logger'
import { COLLECTIONS } from '@/lib/firebase/firestore'
import { generateReservationSummary } from '@/lib/utils/reservation-utils'
import { composeMiddleware } from '@/lib/core/middleware'
import { withAuth, withParams, withBodyValidation } from '@/lib/api/middleware'
import { UpdateItinerarySchema } from '@/lib/schemas/itinerary'

/**
 * PUT /api/itineraries/[id] - 旅程更新
 * 
 * zod スキーマバリデーション + Context ミドルウェアで移行済み
 * 
 * Before:
 * ```typescript
 * const text = await request.text()
 * if (!text || text.trim() === '') {
 *   return NextResponse.json({ error: 'Request body is required' }, { status: 400 })
 * }
 * body = JSON.parse(text)
 * if (body.day_id !== undefined && body.sort_number !== undefined) {
 *   // reorderリクエスト
 * }
 * ```
 * 
 * After:
 * ```typescript
 * // ctx.body が型安全 & バリデ済み
 * // day_id と sort_number の存在で reorder と update を区別
 * ```
 */
export const PUT = composeMiddleware(
  withAuth(),
  withParams(),
  withBodyValidation(UpdateItinerarySchema)
)(async (request: NextRequest, ctx) => {
  try {
    // ctx.auth, ctx.params, ctx.body が保証されている（型推論が効く）
    const { id } = ctx.params!
    
    // zod スキーマでバリデーション済み & 型推論
    type BodyType = z.infer<typeof UpdateItinerarySchema>
    const body = ctx.body as BodyType
    
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
      const { 
        title, 
        description, 
        start_time, 
        end_time, 
        timezone, 
        cost_amount, 
        cost_currency, 
        activity_tag, 
        reservation, 
        place_data 
      } = body
      
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
      if (place_data !== undefined) updateData.place_data = place_data
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
    // エラーハンドリングは composeMiddleware 側で自動的に適用される
    // ただし、このエンドポイントは詳細なエラーハンドリングが必要
    logger.error('Error updating itinerary', error)
    return NextResponse.json(
      { error: 'Failed to update itinerary' },
      { status: 500 }
    )
  }
})

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
    const dayId = itineraryData?.day_id as string | undefined
    const deletedSortNumber = itineraryData?.sort_number || 0
    const tripId = itineraryData?.trip_id as string | undefined
    
    // ハードデリート（実際にドキュメントを削除）
    await itineraryRef.delete()

    // Trip.stats.itineraries をデクリメント
    try {
      const resolvedTripId = tripId || (await (async () => {
        if (!dayId) return undefined
        const dayDoc = await adminDb.collection(COLLECTIONS.DAYS).doc(dayId).get()
        return dayDoc.data()?.trip_id as string | undefined
      })())

      if (resolvedTripId) {
        const tripRef = adminDb.collection(COLLECTIONS.TRIPS).doc(resolvedTripId)
        await tripRef.update({
          'stats.itineraries': adminDb.firestore.FieldValue.increment(-1)
        } as any)
      }
    } catch (e) {
      logger.warn('Failed to decrement trip.stats.itineraries on delete', { itineraryId: id, error: e })
    }

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
