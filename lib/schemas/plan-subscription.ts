/**
 * Plan Subscription スキーマ
 * 
 * プラン購読関連の zod スキーマ定義
 */

import { z } from 'zod'
import { PlanId } from '@/lib/subscription/restriction'

/**
 * PlanId スキーマ
 * PlanId の値のみを受け付ける
 */
export const PlanIdSchema = z.nativeEnum(PlanId)

/**
 * UpdatePlanRequest スキーマ
 * プラン更新リクエスト
 */
export const UpdatePlanRequestSchema = z.object({
  planId: PlanIdSchema
})

/**
 * CheckUserPlanResponse スキーマ
 * ユーザープラン確認レスポンス
 */
export const CheckUserPlanResponseSchema = z.object({
  planId: PlanIdSchema,
  userId: z.string(),
  isDevFallback: z.boolean().optional()
})

