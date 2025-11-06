import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/firebase/admin'
import { adminTripOperations } from '@/lib/firebase/admin-operation'
import logger from '@/lib/core/logger'

/**
 * DEBUG: Trip画像削除処理のテスト用エンドポイント
 * 
 * 使用方法:
 * POST /api/debug/trip-image-deletion
 * Body: { tripId: "trip-id" }
 */
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
    }

    const idToken = authHeader.split('Bearer ')[1]
    const decodedToken = await verifyIdToken(idToken)
    const userId = decodedToken.uid

    const body = await request.json()
    const { tripId } = body

    if (!tripId) {
      return NextResponse.json({ error: 'tripId is required' }, { status: 400 })
    }

    // Trip情報を取得
    const trip = await adminTripOperations.getTripById(tripId)
    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    // 所有権確認
    if (trip.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // 画像削除処理のテスト
    const imageUrl = trip.image_url
    const debugInfo = {
      tripId,
      hasImageUrl: !!imageUrl,
      imageUrl,
      imageUrlType: typeof imageUrl,
      imageUrlLength: imageUrl?.length || 0,
    }

    if (imageUrl) {
      try {
        // deleteTripImageを直接呼び出してテスト
        await (adminTripOperations as any).deleteTripImage(imageUrl, tripId)
        debugInfo['deletionAttempted'] = true
        debugInfo['deletionResult'] = 'success'
      } catch (error: any) {
        debugInfo['deletionAttempted'] = true
        debugInfo['deletionResult'] = 'error'
        debugInfo['deletionError'] = error.message
        logger.error('Debug: Image deletion error:', error)
      }
    }

    return NextResponse.json({
      success: true,
      debug: debugInfo,
    })
  } catch (error) {
    logger.error('Debug endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

