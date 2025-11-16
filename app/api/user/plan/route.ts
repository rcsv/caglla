import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import logger from '@/lib/core/logger'
import { PlanId } from '@/lib/subscription/restriction'
import { authApi, withBodyValidation } from '@/lib/api/middleware'
import { notFound } from '@/lib/core/error-handler'
import { UpdatePlanRequestSchema } from '@/lib/schemas/plan-subscription'
import { composeMiddleware } from '@/lib/core/middleware'

// 動的レンダリングを強制（request.headersを使用するため）
export const dynamic = 'force-dynamic'

// 開発環境用のフォールバック（Firebase Admin SDKが利用できない場合）
const DEV_USER_PLANS: Record<string, PlanId> = {}

export const GET = authApi(async (request: NextRequest, ctx) => {
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
}

export async function PUT(request: NextRequest) {
  try {
    // Firebase Admin SDKの初期化チェック
    if (!adminDb || !adminAuth) {
      logger.warn('Firebase Admin SDK not available, using development fallback')
      
      // 開発環境用のフォールバック
      const body = await parseRequestBody<{ planId?: PlanId }>(request)
      const { planId } = body
      
      // プランIDのバリデーション
      if (!planId || !Object.values(PlanId).includes(planId)) {
        return badRequest('Invalid plan ID')
      }
      
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

    // 認証チェック
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) {
      return auth // 認証エラーをそのまま返す
    }
    const { userId: uid } = auth

    const body = await parseRequestBody<{ planId: PlanId }>(request)
    const { planId } = body
    
    // プランIDのバリデーション
    if (!Object.values(PlanId).includes(planId)) {
      return badRequest('Invalid plan ID')
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
}
