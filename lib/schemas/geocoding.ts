/**
 * Geocoding API スキーマ
 *
 * zod スキーマとして定義し、型推論とバリデーションを一元管理
 */

import { z } from "zod";

/**
 * Geocoding リクエストスキーマ
 *
 * `app/api/geocoding/geocode/route.ts` POST エンドポイントのバリデーションロジックを zod に変換
 *
 * Before:
 * ```typescript
 * if (!address) {
 *   return badRequest('Address is required')
 * }
 * ```
 *
 * After:
 * - zod の `.min()` で address を必須に
 */
export const GeocodeSchema = z.object({
	address: z.string().min(1, "Address is required"),
});

/**
 * Reverse Geocoding リクエストスキーマ
 *
 * `app/api/geocoding/reverse/route.ts` POST エンドポイントのバリデーションロジックを zod に変換
 *
 * Before:
 * ```typescript
 * if (lat === undefined || lng === undefined) {
 *   return badRequest('Latitude and longitude are required')
 * }
 * ```
 *
 * After:
 * - zod のネストしたオブジェクトで lat, lng を検証
 */
export const ReverseGeocodeSchema = z.object({
	lat: z.number().min(-90).max(90, "Latitude must be between -90 and 90"),
	lng: z.number().min(-180).max(180, "Longitude must be between -180 and 180"),
});

/**
 * 型推論
 */
export type GeocodeInput = z.infer<typeof GeocodeSchema>;
export type ReverseGeocodeInput = z.infer<typeof ReverseGeocodeSchema>;
