/**
 * Itinerary Operations（旅程操作）スキーマ
 * 
 * zod スキーマとして定義し、型推論とバリデーションを一元管理
 */

import { z } from 'zod'

/**
 * 旅程複製リクエストスキーマ
 * 
 * `app/api/itineraries/duplicate-to-day/route.ts` POST エンドポイントのバリデーションロジックを zod に変換
 * 
 * Before:
 * ```typescript
 * const body = await parseRequestBody<{ itinerary_id?: string; target_day_id?: string }>(request)
 * if (!itinerary_id || !target_day_id) {
 *   return badRequest('Missing required fields: itinerary_id, target_day_id')
 * }
 * ```
 * 
 * After:
 * ```typescript
 * // ctx.body が型安全 & バリデ済み
 * // すべての if 文バリデーションが消える
 * ```
 */
export const DuplicateItineraryToDaySchema = z.object({
  itinerary_id: z.string().min(1, 'Itinerary ID is required'),
  target_day_id: z.string().min(1, 'Target day ID is required')
})

/**
 * 旅程並び替えリクエストスキーマ
 * 
 * `app/api/itineraries/reorder/route.ts` POST エンドポイントのバリデーションロジックを zod に変換
 * 
 * Before:
 * ```typescript
 * const body = await parseRequestBody<{ dayId?: string; itineraryIds?: string[] }>(request)
 * if (!dayId || !itineraryIds || !Array.isArray(itineraryIds)) {
 *   return badRequest('Day ID and itinerary IDs array are required')
 * }
 * ```
 * 
 * After:
 * ```typescript
 * // ctx.body が型安全 & バリデ済み
 * // すべての if 文バリデーションが消える
 * ```
 */
export const ReorderItinerariesSchema = z.object({
  dayId: z.string().min(1, 'Day ID is required'),
  itineraryIds: z.array(z.string().min(1)).min(1, 'At least one itinerary ID is required')
})

/**
 * 旅程移動リクエストスキーマ
 * 
 * `app/api/itineraries/move-to-day/route.ts` PUT エンドポイントのバリデーションロジックを zod に変換
 * 
 * Before:
 * ```typescript
 * const body = await parseRequestBody<{ itinerary_id?: string; target_day_id?: string }>(request)
 * if (!itinerary_id || !target_day_id) {
 *   return badRequest('Missing required fields: itinerary_id, target_day_id')
 * }
 * ```
 * 
 * After:
 * ```typescript
 * // ctx.body が型安全 & バリデ済み
 * // すべての if 文バリデーションが消える
 * ```
 * 
 * 注意: `DuplicateItineraryToDaySchema` と同じ構造なので、再利用可能
 */
export const MoveItineraryToDaySchema = z.object({
  itinerary_id: z.string().min(1, 'Itinerary ID is required'),
  target_day_id: z.string().min(1, 'Target day ID is required')
})

/**
 * 型推論
 */
export type DuplicateItineraryToDayInput = z.infer<typeof DuplicateItineraryToDaySchema>
export type ReorderItinerariesInput = z.infer<typeof ReorderItinerariesSchema>
export type MoveItineraryToDayInput = z.infer<typeof MoveItineraryToDaySchema>

