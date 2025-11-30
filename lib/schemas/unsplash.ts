/**
 * Unsplash API スキーマ
 *
 * zod スキーマとして定義し、型推論とバリデーションを一元管理
 */

import { z } from "zod";

/**
 * Unsplash リクエストスキーマ（GET クエリパラメータ用）
 *
 * `app/api/unsplash/route.ts` GET エンドポイントのバリデーションロジックを zod に変換
 *
 * Before:
 * ```typescript
 * if (!destination) {
 *   return badRequest('Destination parameter is required')
 * }
 * if (count > 10) {
 *   return badRequest('Count cannot exceed 10')
 * }
 * ```
 *
 * After:
 * - zod の `.min()` で destination を必須に
 * - zod の `.max()` で count を最大10に制限
 */
export const UnsplashQuerySchema = z.object({
	destination: z.string().min(1, "Destination parameter is required"),
	count: z.coerce
		.number()
		.int()
		.positive()
		.max(10, "Count cannot exceed 10")
		.default(1)
		.optional(),
});

/**
 * Unsplash リクエストスキーマ（POST ボディ用）
 *
 * `app/api/unsplash/route.ts` POST エンドポイントのバリデーションロジックを zod に変換
 *
 * Before:
 * ```typescript
 * if (!destination) {
 *   return badRequest('Destination is required')
 * }
 * if (count > 10) {
 *   return badRequest('Count cannot exceed 10')
 * }
 * ```
 *
 * After:
 * - zod の `.min()` で destination を必須に
 * - zod の `.max()` で count を最大10に制限
 */
export const UnsplashBodySchema = z.object({
	destination: z.string().min(1, "Destination is required"),
	count: z
		.number()
		.int()
		.positive()
		.max(10, "Count cannot exceed 10")
		.default(1)
		.optional(),
});

/**
 * 型推論
 */
export type UnsplashQueryInput = z.infer<typeof UnsplashQuerySchema>;
export type UnsplashBodyInput = z.infer<typeof UnsplashBodySchema>;
