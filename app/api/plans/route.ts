import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/core/logger'
import { planSaveOperations, PlanSaveData } from '@/lib/travel/plan-save'
import { badRequest, parseRequestBody } from '@/lib/core/error-handler'
import { authApi } from '@/lib/api/middleware'

/**
 * 完全なプランを一括で保存する
 */
export const POST = authApi(async (request: NextRequest, ctx) => {
  const { userId } = ctx.auth!

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
export const PUT = authApi(async (request: NextRequest, ctx) => {
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
