/**
 * Places Photo API スキーマ
 * 
 * zod スキーマとして定義し、型推論とバリデーションを一元管理
 */

import { z } from 'zod'

/**
 * Places Photo リクエストスキーマ（GET クエリパラメータ用）
 * 
 * `app/api/places/photo/route.ts` GET エンドポイントのバリデーションロジックを zod に変換
 * 
 * Before:
 * ```typescript
 * if (!photoReference) {
 *   return badRequest('Photo reference is required')
 * }
 * ```
 * 
 * After:
 * - zod の `.min()` で photoReference を必須に
 */
export const PlacesPhotoQuerySchema = z.object({
  photoreference: z.string().min(1, 'Photo reference is required'),
  maxwidth: z.coerce.number().int().positive().max(1600, 'Max width cannot exceed 1600').default(800).optional(),
  maxheight: z.coerce.number().int().positive().max(1600, 'Max height cannot exceed 1600').optional()
})

/**
 * 型推論
 */
export type PlacesPhotoQueryInput = z.infer<typeof PlacesPhotoQuerySchema>

