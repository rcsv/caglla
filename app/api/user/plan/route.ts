import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import logger from '@/lib/logger'
import { PlanId } from '@/lib/restriction-system'

// 開発環境用のフォールバック（Firebase Admin SDKが利用できない場合）
const DEV_USER_PLANS: Record<string, PlanId> = {}

export async function GET(request: NextRequest) {
  try {
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

    // Authorizationヘッダーからトークンを取得
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    
    // Firebase Admin SDKでトークンを検証
    const decodedToken = await adminAuth.verifyIdToken(token)
    const uid = decodedToken.uid

    // ユーザー情報を取得
    const userDoc = await adminDb.collection('users').doc(uid).get()
    
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userData = userDoc.data()
    
    return NextResponse.json({
      planId: userData?.planId || PlanId.SEASON_TRAVELER,
      userId: uid
    })
  } catch (error) {
    logger.error('Error fetching user plan', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Firebase Admin SDKの初期化チェック
    if (!adminDb || !adminAuth) {
      logger.warn('Firebase Admin SDK not available, using development fallback')
      
      // 開発環境用のフォールバック
      const { planId } = await request.json()
      
      // プランIDのバリデーション
      if (!Object.values(PlanId).includes(planId)) {
        return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 })
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

    // Authorizationヘッダーからトークンを取得
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    
    // Firebase Admin SDKでトークンを検証
    const decodedToken = await adminAuth.verifyIdToken(token)
    const uid = decodedToken.uid

    const { planId } = await request.json()
    
    // プランIDのバリデーション
    if (!Object.values(PlanId).includes(planId)) {
      return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 })
    }

    // ユーザー情報を更新
    await adminDb.collection('users').doc(uid).update({
      planId: planId,
      updated_at: new Date()
    })
    
    return NextResponse.json({ 
      success: true, 
      planId: planId,
      message: 'Plan updated successfully'
    })
  } catch (error) {
    logger.error('Error updating user plan', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
