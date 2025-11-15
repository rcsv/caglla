import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/core/logger'
import { planSaveOperations, PlanSaveData } from '@/lib/travel/plan-save'
import { withAuth, badRequest, parseRequestBody, handleApiError } from '@/lib/core/error-handler'

/**
 * 完全なプランを一括で保存する
 */
export const POST = withAuth(async (request: NextRequest, auth) => {
  const { userId } = auth

  const planData = await parseRequestBody<PlanSaveData>(request)
  
  // バリデーション
  if (!planData.trip || !planData.trip.title) {
    return badRequest('プランのタイトルは必須です')
  }

  // プランを保存
  const result = await planSaveOperations.saveCompletePlan(userId, planData)
  
  return NextResponse.json({
    success: true,
    data: result
  })
})

/**
 * 既存のプランを更新する
 */
export const PUT = withAuth(async (request: NextRequest, auth) => {
  const body = await parseRequestBody<{ tripId?: string; planData?: PlanSaveData }>(request)
  const { tripId, planData } = body
  
  if (!tripId || !planData) {
    return badRequest('旅行IDとプランデータは必須です')
  }

  // プランを更新
  const result = await planSaveOperations.updateCompletePlan(tripId, planData)
  
  return NextResponse.json({
    success: true,
    data: result
  })
})
