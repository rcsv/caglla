import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/logger'
import { adminAuth } from '@/lib/firebase-admin'
import { planSaveOperations, PlanSaveData } from '@/lib/plan-save-operations'

/**
 * 完全なプランを一括で保存する
 */
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
    }

    const idToken = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    const userId = decodedToken.uid

    const planData: PlanSaveData = await request.json()
    
    // バリデーション
    if (!planData.trip || !planData.trip.title) {
      return NextResponse.json(
        { error: 'プランのタイトルは必須です' },
        { status: 400 }
      )
    }

    // プランを保存
    const result = await planSaveOperations.saveCompletePlan(userId, planData)
    
    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    logger.error('Error saving plan:', error)
    return NextResponse.json(
      { error: 'プランの保存に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * 既存のプランを更新する
 */
export async function PUT(request: NextRequest) {
  try {
    // 認証チェック
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
    }

    const idToken = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    const userId = decodedToken.uid

    const { tripId, planData }: { tripId: string; planData: PlanSaveData } = await request.json()
    
    if (!tripId) {
      return NextResponse.json(
        { error: '旅行IDは必須です' },
        { status: 400 }
      )
    }

    // プランを更新
    const result = await planSaveOperations.updateCompletePlan(tripId, planData)
    
    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    logger.error('Error updating plan:', error)
    return NextResponse.json(
      { error: 'プランの更新に失敗しました' },
      { status: 500 }
    )
  }
}
