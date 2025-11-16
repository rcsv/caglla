import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import logger from '@/lib/core/logger'
import { PlanId } from '@/lib/subscription/restriction'
import { authApi, withBodyValidation } from '@/lib/api/middleware'
import { notFound, handleApiError } from '@/lib/core/error-handler'
import { UpdatePlanRequestSchema } from '@/lib/schemas/plan-subscription'
import { composeMiddleware } from '@/lib/core/middleware'
import { z } from 'zod'

// 動的レンダリングを強制（request.headersを使用するため）
export const dynamic = 'force-dynamic'

// 開発環境用のフォールバック（Firebase Admin SDKが利用できない場合）
const DEV_USER_PLANS: Record<string, PlanId> = {}

export const GET = authApi(async (request: NextRequest, ctx) => {
  try {
    // ctx.auth が保証されている（authApi プリセットが認証チェックを実行）
    
    // Firebase Admin SDKの初期化チェック
    if (!adminDb || !adminAuth) {
      logger.warn('Firebase Admin SDK not available, using development fallback')
      
      // 開発環境用のフォールバック
      const mockUserId = 'dev-user-123'
      const planId = DEV_USER_PLANS[mockUserId] || PlanId.SEASON_TRAVELER
      
      return NextResponse.json({
        planId: planId,
        userId: mockUserId,
        isDevFallback: true
      })
    }

    const { userId: uid } = ctx.auth!

    // ユーザー情報を取得（google_idでクエリ）
    const userQuery = await adminDb.collection('users')
      .where('google_id', '==', uid)
      .limit(1)
      .get()
    
    if (userQuery.empty) {
      return notFound('User')
    }

    const userDoc = userQuery.docs[0]
    const userData = userDoc.data()
    
    return NextResponse.json({
      planId: userData?.planId || PlanId.SEASON_TRAVELER,
      userId: userDoc.id
    })
  } catch (error) {
    return handleApiError(
      error instanceof Error ? error : new Error(String(error)),
      '/api/user/plan'
    )
  }
})

/**
 * PUT /api/user/plan - ユーザープラン更新
 * 
 * zod スキーマバリデーション + Context ミドルウェアで移行済み
 */
export const PUT = composeMiddleware(
  authApi,
  withBodyValidation(UpdatePlanRequestSchema)
)(async (request: NextRequest, ctx) => {
  try {
    // ctx.auth, ctx.body が保証されている（型推論が効く）
    const { userId: uid } = ctx.auth!
    
    // zod スキーマでバリデーション済み & 型推論
    type BodyType = z.infer<typeof UpdatePlanRequestSchema>
    const body = ctx.body as BodyType
    const { planId } = body
    
    // Firebase Admin SDKの初期化チェック
    if (!adminDb || !adminAuth) {
      logger.warn('Firebase Admin SDK not available, using development fallback')
      
      // 開発環境用のフォールバック
      const mockUserId = 'dev-user-123'
      DEV_USER_PLANS[mockUserId] = planId
      
      return NextResponse.json({ 
        success: true, 
        planId: planId,
        userId: mockUserId,
        message: 'Plan updated successfully (dev fallback)',
        isDevFallback: true
      })
    }

    // ユーザー情報を取得（google_idでクエリ）
    const userQuery = await adminDb.collection('users')
      .where('google_id', '==', uid)
      .limit(1)
      .get()
    
    if (userQuery.empty) {
      return notFound('User')
    }

    const userDoc = userQuery.docs[0]
    
    // ユーザー情報を更新
    await adminDb.collection('users').doc(userDoc.id).update({
      planId: planId,
      updated_at: new Date()
    })
    
    return NextResponse.json({ 
      success: true, 
      planId: planId,
      message: 'Plan updated successfully'
    })
  } catch (error) {
    return handleApiError(
      error instanceof Error ? error : new Error(String(error)),
      '/api/user/plan'
    )
  }
})
