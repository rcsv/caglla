/**
 * Trip Social（旅行ソーシャル機能）スキーマ
 * 
 * zod スキーマとして定義し、型推論とバリデーションを一元管理
 */

import { z } from 'zod'

/**
 * コメント作成リクエストスキーマ
 * 
 * `app/api/trip/[tripSlug]/comments/route.ts` POST エンドポイントのバリデーションロジックを zod に変換
 * 
 * Before:
 * ```typescript
 * const body = await parseRequestBody<{
 *   content?: string
 *   userName?: string
 *   userAvatar?: string
 *   parentCommentId?: string
 * }>(request)
 * const content = typeof body.content === 'string' ? body.content.trim() : ''
 * if (!content) {
 *   return badRequest('Content is required')
 * }
 * ```
 * 
 * After:
 * ```typescript
 * // ctx.body が型安全 & バリデ済み
 * // すべての if 文バリデーションが消える
 * ```
 */
export const CreateTripCommentSchema = z.object({
  content: z.string().min(1, 'Content is required').trim(),
  userName: z.string().optional(),
  userAvatar: z.string().optional(),
  parentCommentId: z.string().optional()
})

/**
 * コメント更新リクエストスキーマ
 * 
 * `app/api/trip/[tripSlug]/comments/route.ts` PUT エンドポイントのバリデーションロジックを zod に変換
 * 
 * Before:
 * ```typescript
 * const body = await parseRequestBody<{ content?: string }>(request)
 * const content = typeof body.content === 'string' ? body.content.trim() : ''
 * if (!content) {
 *   return badRequest('Content is required')
 * }
 * ```
 * 
 * After:
 * ```typescript
 * // ctx.body が型安全 & バリデ済み
 * // すべての if 文バリデーションが消える
 * ```
 */
export const UpdateTripCommentSchema = z.object({
  content: z.string().min(1, 'Content is required').trim()
})

/**
 * いいね操作リクエストスキーマ
 * 
 * `app/api/trip/[tripSlug]/likes/route.ts` POST エンドポイントのバリデーションロジックを zod に変換
 * 
 * Before:
 * ```typescript
 * const body = await parseRequestBody<{ action?: 'like' | 'unlike' }>(request)
 * const action = body?.action === 'like' || body?.action === 'unlike' ? body.action : 'toggle'
 * ```
 * 
 * After:
 * ```typescript
 * // ctx.body が型安全 & バリデ済み
 * // デフォルト値が zod スキーマで設定済み
 * ```
 */
export const ToggleTripLikeSchema = z.object({
  action: z.enum(['like', 'unlike', 'toggle']).optional().default('toggle')
})

/**
 * 型推論
 */
export type CreateTripCommentInput = z.infer<typeof CreateTripCommentSchema>
export type UpdateTripCommentInput = z.infer<typeof UpdateTripCommentSchema>
export type ToggleTripLikeInput = z.infer<typeof ToggleTripLikeSchema>

