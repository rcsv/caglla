import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import logger from '@/lib/core/logger'
import { planSaveOperations } from '@/lib/travel/plan-save'
import { composeMiddleware } from '@/lib/core/middleware'
import { withAuth, withParams, withBodyValidation } from '@/lib/api/middleware'
import { SavePlanAsTemplateSchema } from '@/lib/schemas/plan-operations'

/**
 * プランをテンプレートとして保存する
 * 
 * zod スキーマバリデーション + Context ミドルウェアで移行済み
 * 
 * Before:
 * ```typescript
 * const body = await parseRequestBody<{ templateName?: string }>(request)
 * if (!templateName) {
 *   return badRequest('テンプレート名は必須です')
 * }
 * ```
 * 
 * After:
 * ```typescript
 * // ctx.body が型安全 & バリデ済み
 * // すべての if 文バリデーションが消える
 * ```
 */
export const POST = composeMiddleware(
  withAuth(),
  withParams(),
  withBodyValidation(SavePlanAsTemplateSchema)
)(async (request: NextRequest, ctx) => {
  // ctx.auth, ctx.params, ctx.body が保証されている（型推論が効く）
  const { planSlug: tripId } = ctx.params!
  
  // zod スキーマでバリデーション済み & 型推論
  type BodyType = z.infer<typeof SavePlanAsTemplateSchema>
  const body = ctx.body as BodyType
  const { templateName } = body

    // テンプレートとして保存
    await planSaveOperations.saveAsTemplate(tripId, templateName)
    
  return NextResponse.json({
    success: true,
    message: 'テンプレートとして保存しました'
  })
})
