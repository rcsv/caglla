/**
 * Distance API スキーマ
 * 
 * zod スキーマとして定義し、型推論とバリデーションを一元管理
 */

import { z } from 'zod'
import type { PlaceData } from '@/lib/core/types'

/**
 * Distance リクエストスキーマ
 * 
 * `app/api/distance/route.ts` POST エンドポイントのバリデーションロジックを zod に変換
 * 
 * Before:
 * ```typescript
 * if (!origins || !destinations) {
 *   return badRequest('Origins and destinations are required')
 * }
 * ```
 * 
 * After:
 * - zod の `.min()` で origins, destinations を必須に
 */
export const DistanceSchema = z.object({
  origins: z.union([
    z.string().min(1, 'Origin is required'),
    z.array(z.string().min(1, 'Origin is required')).min(1, 'At least one origin is required')
  ]),
  destinations: z.union([
    z.string().min(1, 'Destination is required'),
    z.array(z.string().min(1, 'Destination is required')).min(1, 'At least one destination is required')
  ]),
  mode: z.enum(['driving', 'walking', 'bicycling', 'transit']).default('driving').optional()
})

/**
 * Distance Batch リクエストスキーマ
 * 
 * `app/api/distance/batch/route.ts` POST エンドポイントのバリデーションロジックを zod に変換
 * 
 * Before:
 * ```typescript
 * if (!places || places.length < 2) {
 *   return badRequest('At least 2 places are required')
 * }
 * ```
 * 
 * After:
 * - zod の `.min()` で places を最小2個必須に
 */
export const DistanceBatchSchema = z.object({
  places: z.any().array().min(2, 'At least 2 places are required'), // PlaceData 型は複雑なため any で許可
  mode: z.enum(['driving', 'walking', 'bicycling', 'transit']).default('driving').optional()
})

/**
 * 型推論
 */
export type DistanceInput = z.infer<typeof DistanceSchema>
export type DistanceBatchInput = z.infer<typeof DistanceBatchSchema>

