import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/core/logger'
import { planSaveOperations } from '@/lib/travel/plan-save'
import { badRequest, parseRequestBody } from '@/lib/core/error-handler'
import { authApi } from '@/lib/api/middleware'

/**
 * プランをテンプレートとして保存する
 */
export const POST = authApi(async (request: NextRequest, ctx) => {
  // ctx.auth, ctx.params が保証されている（authApi プリセットが認証チェックを実行）
  const { planSlug: tripId } = ctx.params!
    const body = await parseRequestBody<{ templateName?: string }>(request)
    const { templateName } = body
    
    if (!templateName) {
      return badRequest('テンプレート名は必須です')
    }

    // テンプレートとして保存
    await planSaveOperations.saveAsTemplate(tripId, templateName)
    
  return NextResponse.json({
    success: true,
    message: 'テンプレートとして保存しました'
  })
})
