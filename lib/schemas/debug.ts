/**
 * Debug API スキーマ
 *
 * zod スキーマとして定義し、型推論とバリデーションを一元管理
 */

import { z } from "zod";

/**
 * Trip Image Deletion Debug リクエストスキーマ
 *
 * `app/api/debug/trip-image-deletion/route.ts` POST エンドポイントのバリデーションロジックを zod に変換
 *
 * Before:
 * ```typescript
 * if (!tripId) {
 *   return badRequest('tripId is required')
 * }
 * ```
 *
 * After:
 * - zod の `.min()` で tripId を必須に
 */
export const DebugTripImageDeletionSchema = z.object({
	tripId: z.string().min(1, "tripId is required"),
});

/**
 * 型推論
 */
export type DebugTripImageDeletionInput = z.infer<
	typeof DebugTripImageDeletionSchema
>;
