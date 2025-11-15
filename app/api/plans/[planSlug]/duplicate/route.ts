import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/core/logger'
import { planSaveOperations } from '@/lib/travel/plan-save'
import { parseRequestBody } from '@/lib/core/error-handler'
import { authApi } from '@/lib/api/middleware'

/**
 * プランを複製する
 */
export const POST = authApi(async (request: NextRequest, ctx) => {
  // ctx.auth, ctx.params が保証されている（authApi プリセットが認証チェックを実行）
  const { userId } = ctx.auth!
  const { planSlug: sourceTripId } = ctx.params!
    const body = await parseRequestBody<{ newTitle?: string }>(request)
    const { newTitle } = body
    
    // プランを複製
    const result = await planSaveOperations.duplicatePlan(sourceTripId, userId, newTitle)
    
  return NextResponse.json({
    success: true,
    data: result
  })
})
