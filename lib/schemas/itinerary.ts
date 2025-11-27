/**
 * Itinerary（旅程）スキーマ
 * 
 * zod スキーマとして定義し、型推論とバリデーションを一元管理
 */

import { z } from 'zod'
import { PlaceDataSchema } from './trip'

/**
 * Itinerary 作成スキーマ
 * 
 * `app/api/itineraries/route.ts` POST エンドポイントのバリデーションロジックを zod に変換
 * 
 * Before:
 * ```typescript
 * if (!day_id || !title || (!place_id && !place_data?.place_id)) {
 *   return badRequest('Missing required fields: day_id, title, and place_id or place_data.place_id')
 * }
 * ```
 * 
 * After:
 * - zod の `.refine()` で `place_id` または `place_data?.place_id` のいずれかが必要なことを検証
 */
export const CreateItinerarySchema = z.object({
  day_id: z.string().min(1, 'Day ID is required'),
  place_id: z.string().optional(),
  place_data: PlaceDataSchema.optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  location: z.string().optional(),
  cost_currency: z.string().optional()
}).refine(
  (data) => {
    // place_id または place_data?.place_id のいずれかが必要
    return !!(data.place_id || data.place_data?.place_id)
  },
  {
    message: 'Either place_id or place_data.place_id is required',
    path: ['place_id']
  }
)

/**
 * Itinerary 挿入スキーマ
 * 
 * `app/api/itineraries/insert/route.ts` POST エンドポイントのバリデーションロジックを zod に変換
 */
export const InsertItinerarySchema = z.object({
  day_id: z.string().min(1, 'Day ID is required'),
  place_id: z.string().optional(),
  place_data: PlaceDataSchema.optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  location: z.string().optional(),
  insert_after_index: z.number().int().min(-1).optional()
}).refine(
  (data) => {
    // place_id または place_data?.place_id のいずれかが必要
    return !!(data.place_id || data.place_data?.place_id)
  },
  {
    message: 'Either place_id or place_data.place_id is required',
    path: ['place_id']
  }
)

/**
 * ActivityTag スキーマ（Plan スキーマから再利用）
 */
const ActivityTagSchema = z.object({
  primaryCategory: z.enum([
    'transportation',
    'shopping',
    'dining',
    'accommodation',
    'exploration',
    'adventure',
    'entertainment',
    'culture',
    'wellness',
    'service'
  ]),
  secondaryCategory: z.string()
}).optional().nullable()

/**
 * Reservation スキーマ（部分的な定義、詳細は必要に応じて拡張）
 */
const ReservationSchema = z.any().optional().nullable()

/**
 * Itinerary 更新スキーマ（reorder または通常の更新）
 * 
 * `app/api/itineraries/[id]/route.ts` PUT エンドポイントのバリデーションロジックを zod に変換
 * 
 * Before:
 * ```typescript
 * const text = await request.text()
 * if (!text || text.trim() === '') {
 *   return NextResponse.json({ error: 'Request body is required' }, { status: 400 })
 * }
 * body = JSON.parse(text)
 * if (body.day_id !== undefined && body.sort_number !== undefined) {
 *   // reorderリクエスト
 * }
 * ```
 * 
 * After:
 * ```typescript
 * // ctx.body が型安全 & バリデ済み
 * // day_id と sort_number の存在で reorder と update を区別
 * ```
 * 
 * 注意: reorder リクエストの場合、day_id と sort_number の両方が必須
 * 通常の更新リクエストの場合、任意のフィールドを更新可能
 */
export const UpdateItinerarySchema = z.object({
  // reorder リクエスト用フィールド
  day_id: z.string().min(1, 'Day ID is required').optional(),
  sort_number: z.number().int().min(1, 'Sort number must be a positive integer').optional(),
  // 通常の更新リクエスト用フィールド
  title: z.string().optional(),
  description: z.string().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  timezone: z.string().optional(),
  cost_amount: z.number().nullable().optional(),
  cost_currency: z.string().optional(),
  activity_tag: ActivityTagSchema,
  reservation: ReservationSchema,
  place_data: PlaceDataSchema.optional()
}).refine(
  (data) => {
    // reorder リクエストの場合、day_id と sort_number の両方が必須
    // 通常の更新リクエストの場合、少なくとも1つのフィールドが必要
    const isReorder = data.day_id !== undefined && data.sort_number !== undefined
    const hasUpdateFields = Object.keys(data).some(
      key => key !== 'day_id' && key !== 'sort_number' && data[key as keyof typeof data] !== undefined
    )
    
    return isReorder || hasUpdateFields
  },
  {
    message: 'Either day_id and sort_number (for reorder) or at least one update field must be provided',
    path: []
  }
)

/**
 * 型推論
 */
export type CreateItineraryInput = z.infer<typeof CreateItinerarySchema>
export type InsertItineraryInput = z.infer<typeof InsertItinerarySchema>
export type UpdateItineraryInput = z.infer<typeof UpdateItinerarySchema>

