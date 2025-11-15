import { NextRequest, NextResponse } from 'next/server'
import { adminTripOperations } from '@/lib/firebase/admin-operation'
import logger from '@/lib/core/logger'
import { requireAuth } from '@/lib/api/auth-helpers'
import { notFound, badRequest, parseRequestBody, handleApiError, createForbiddenError } from '@/lib/core/error-handler'

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
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) {
      return auth // 認証エラーをそのまま返す
    }
    const { userId } = auth

    const body = await parseRequestBody<{ tripId?: string }>(request)
    const { tripId } = body

    if (!tripId) {
      return badRequest('tripId is required')
    }

    // Trip情報を取得
    const trip = await adminTripOperations.getTripById(tripId)
    if (!trip) {
      return notFound('Trip')
    }

    // 所有権確認
    if (trip.user_id !== userId) {
      throw createForbiddenError('You do not own this trip')
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
    return handleApiError(
      error instanceof Error ? error : new Error(String(error)),
      `/api/debug/trip-image-deletion`
    )
  }
}

