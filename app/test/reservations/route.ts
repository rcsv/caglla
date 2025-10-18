import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import logger from '@/lib/core/logger'

/**
 * GET /api/trips/[id]/reservations
 * 
 * 旅行全体の予約情報を一覧取得（Summary 用）
 * 
 * クエリパラメータ:
 * - day_id: 特定の日の予約のみ取得（オプション）
 * - type: 予約タイプでフィルタリング（オプション）
 * - limit: 取得件数（デフォルト: 20）
 * - startAfter: ページングカーソル（最後のドキュメントID）
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    
    const dayId = searchParams.get('day_id')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const startAfter = searchParams.get('startAfter')
    
    // day_number の取得（day_id が指定されている場合）
    let dayDataMap: Record<string, any> = {}
    if (dayId) {
      const dayDoc = await adminDb.collection('days').doc(dayId).get()
      if (dayDoc.exists) {
        dayDataMap[dayId] = dayDoc.data()
      }
    } else {
      // すべての days を取得（day_number を表示するため）
      const daysSnapshot = await adminDb
        .collection('days')
        .where('trip_id', '==', id)
        .get()
      
      daysSnapshot.docs.forEach((doc: any) => {
        dayDataMap[doc.id] = doc.data()
      })
    }
    
    // Firestore クエリを構築（trip_id を直接使用）
    let query = adminDb
      .collection('itineraries')
      .where('trip_id', '==', id)
      .where('reservation_exists', '==', true)
    
    // day_id でフィルタリング（指定がある場合）
    if (dayId) {
      query = query.where('day_id', '==', dayId)
    }
    
    // タイプでフィルタリング（指定がある場合）
    if (type) {
      query = query.where('reservation_type', '==', type)
    }
    
    // ソート: 開始日時の昇順
    query = query.orderBy('reservation_start_ts', 'asc')
    
    // ページング: startAfter が指定されている場合
    if (startAfter) {
      const startAfterDoc = await adminDb.collection('itineraries').doc(startAfter).get()
      if (startAfterDoc.exists) {
        query = query.startAfter(startAfterDoc)
      }
    }
    
    // 制限
    query = query.limit(limit + 1)  // hasMore判定のため+1
    
    const snapshot = await query.get()
    
    const hasMore = snapshot.size > limit
    const docs = hasMore ? snapshot.docs.slice(0, limit) : snapshot.docs
    
    const items = docs.map((doc: any) => {
      const data = doc.data()
      const dayData = dayDataMap[data.day_id] || {}
      
      return {
        itinerary_id: doc.id,
        day_id: data.day_id,
        day_number: dayData.day_number || 0,
        reservation_type: data.reservation_type,
        reservation_summary: data.reservation_summary,
        reservation_start_ts: data.reservation_start_ts?.toDate?.()?.toISOString() || data.reservation_start_ts,
        reservation_end_ts: data.reservation_end_ts?.toDate?.()?.toISOString() || data.reservation_end_ts,
        reservation_site: data.reservation?.reservation_site,
        confirmation_number: data.reservation?.confirmation_number,
        // 詳細ページへのリンク（userSlug, tripSlug が必要な場合は別途取得）
        link_to_itinerary: `/trip/${id}?itinerary=${doc.id}`
      }
    })
    
    // 次のカーソル
    const nextCursor = hasMore ? docs[docs.length - 1].id : null
    
    return NextResponse.json({
      items,
      hasMore,
      nextCursor
    })
  } catch (error) {
    logger.error('Error fetching reservations', error)
    return NextResponse.json(
      { error: 'Failed to fetch reservations' },
      { status: 500 }
    )
  }
}

