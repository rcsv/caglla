import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import logger from '@/lib/core/logger'
import { adminDb } from '@/lib/firebase/admin'
import { planSaveOperations } from '@/lib/travel/plan-save'
import { composeMiddleware } from '@/lib/core/middleware'
import { withAuth, withBodyValidation } from '@/lib/api/middleware'
import { CreateFromTemplateSchema } from '@/lib/schemas/template'
import { authApi } from '@/lib/api/middleware'

/**
 * テンプレートからプランを作成する
 * 
 * zod スキーマバリデーション + Context ミドルウェアで移行済み
 * 
 * Before:
 * ```typescript
 * const body = await parseRequestBody<{ templateId?: string; customizations?: any }>(request)
 * if (!templateId) {
 *   return badRequest('テンプレートIDは必須です')
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
  withBodyValidation(CreateFromTemplateSchema)
)(async (request: NextRequest, ctx) => {
  // ctx.auth, ctx.body が保証されている（型推論が効く）
  const { userId } = ctx.auth!
  
  // zod スキーマでバリデーション済み & 型推論
  type BodyType = z.infer<typeof CreateFromTemplateSchema>
  const body = ctx.body as BodyType
  const { templateId, customizations } = body

    // テンプレートからプランを作成
    const result = await planSaveOperations.createFromTemplate(templateId, userId, customizations)
    
  return NextResponse.json({
    success: true,
    data: result
  })
})

/**
 * 利用可能なテンプレート一覧を取得する
 */
export const GET = authApi(async (request: NextRequest, ctx) => {
  // テンプレート一覧を取得
  const templatesSnapshot = await adminDb.collection('templates')
    .orderBy('created_at', 'desc')
    .get()
  
  const templates = templatesSnapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data()
  }))
  
  return NextResponse.json({
    success: true,
    data: templates
  })
})
