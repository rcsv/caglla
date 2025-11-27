/**
 * User Slug（ユーザースラッグ）スキーマ
 * 
 * zod スキーマとして定義し、型推論とバリデーションを一元管理
 */

import { z } from 'zod'

/**
 * ユーザースラッグ確認リクエストスキーマ
 * 
 * `app/api/users/check-slug/route.ts` POST エンドポイントのバリデーションロジックを zod に変換
 * 
 * Before:
 * ```typescript
 * const body = await parseRequestBody<{ name?: string }>(request)
 * if (!name) {
 *   return badRequest('Name is required')
 * }
 * ```
 * 
 * After:
 * ```typescript
 * // ctx.body が型安全 & バリデ済み
 * // すべての if 文バリデーションが消える
 * ```
 */
export const CheckUserSlugSchema = z.object({
  name: z.string().min(1, 'Name is required')
})

/**
 * 型推論
 */
export type CheckUserSlugInput = z.infer<typeof CheckUserSlugSchema>

