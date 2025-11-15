/**
 * 予約テンプレート（ReservationTemplate）スキーマ
 * 
 * zod スキーマとして定義し、型推論とバリデーションを一元管理
 * 
 * 既存の `ReservationTemplateInput` 型を zod スキーマに変換
 * 
 * 注意: `ReservationTypeSchema` と `ReservationSiteSchema` は `reservation.ts` からインポート
 */

import { z } from 'zod'
import { ReservationTypeSchema, ReservationSiteSchema } from './reservation'

/**
 * 空港コードのバリデーション（zod regex）
 */
const AirportCodeSchema = z.string().regex(/^[A-Z]{3}$/, {
  message: 'Invalid airport code. Must be 3 uppercase letters (e.g., NRT, LAX)'
}).optional()

/**
 * 予約テンプレート入力スキーマ
 * 
 * 既存の `ReservationTemplateInput` インターフェースを zod スキーマに変換
 * - "必須"チェックは zod に任せる（`if (!name || !type)` の山が消える）
 * - 空港コードの規則は zod regex に集約
 */
export const ReservationTemplateInputSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be at most 100 characters'),
  description: z.string().optional(),
  type: ReservationTypeSchema,
  reservation_site: ReservationSiteSchema.optional(),
  airline: z.string().optional(),
  departure_airport: AirportCodeSchema,
  arrival_airport: AirportCodeSchema,
  notes: z.string().optional()
})

/**
 * 型推論
 * 
 * 既存の `ReservationTemplateInput` 型の代わりに使用可能
 */
export type ReservationTemplateInput = z.infer<typeof ReservationTemplateInputSchema>

