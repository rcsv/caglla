/**
 * Template（テンプレート）スキーマ
 * 
 * zod スキーマとして定義し、型推論とバリデーションを一元管理
 */

import { z } from 'zod'

/**
 * テンプレートからプラン作成リクエストスキーマ
 * 
 * `app/api/templates/route.ts` POST エンドポイントのバリデーションロジックを zod に変換
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
export const CreateFromTemplateSchema = z.object({
  templateId: z.string().min(1, 'Template ID is required'),
  customizations: z.record(z.any()).optional()
})

/**
 * 型推論
 */
export type CreateFromTemplateInput = z.infer<typeof CreateFromTemplateSchema>

