/**
 * Place（場所）検索・詳細取得スキーマ
 *
 * zod スキーマとして定義し、型推論とバリデーションを一元管理
 */

import { z } from "zod";
import { isSupportedLanguage, DEFAULT_LANGUAGE } from "@/lib/utils/language";
import type { SupportedLanguage } from "@/lib/core/types";

/**
 * サポートされている言語のスキーマ
 */
const SupportedLanguageSchema = z
	.enum([
		"en",
		"ja",
		"ko",
		"zh-CN",
		"zh-TW",
		"es",
		"fr",
		"de",
		"it",
		"pt",
		"ru",
		"ar",
		"hi",
		"th",
		"vi",
	] as const)
	.default(DEFAULT_LANGUAGE);

/**
 * Place 検索スキーマ
 *
 * `app/api/places/search/route.ts` POST エンドポイントのバリデーションロジックを zod に変換
 *
 * Before:
 * ```typescript
 * if (!query || query.length < 2) {
 *   return badRequest('Query must be at least 2 characters long')
 * }
 * ```
 *
 * After:
 * - zod の `.min()` でクエリの最小長を検証
 */
export const PlaceSearchSchema = z.object({
	query: z.string().min(2, "Query must be at least 2 characters long"),
	language: SupportedLanguageSchema.optional(),
	locationBias: z.any().optional(), // 複雑な構造のため any で許可
});

/**
 * Place 詳細取得スキーマ
 *
 * `app/api/places/details/route.ts` POST エンドポイントのバリデーションロジックを zod に変換
 *
 * Before:
 * ```typescript
 * if (!placeId) {
 *   return badRequest('Place ID is required')
 * }
 * ```
 *
 * After:
 * - zod の `.min()` で placeId を必須に
 * - requiredFields: クライアントが必要とするフィールドのリスト（キャッシュ完全性チェック用）
 */
export const PlaceDetailsSchema = z.object({
	placeId: z.string().min(1, "Place ID is required"),
	language: SupportedLanguageSchema.optional(),
	requiredFields: z.array(z.string()).optional().default([]),
});

/**
 * Place 近隣検索スキーマ
 *
 * `app/api/places/nearby/route.ts` POST エンドポイントのバリデーションロジックを zod に変換
 *
 * Before:
 * ```typescript
 * if (!location || !location.lat || !location.lng) {
 *   return badRequest('Location (lat, lng) is required')
 * }
 * ```
 *
 * After:
 * - zod のネストしたオブジェクトで location を検証
 */
export const PlaceNearbySchema = z.object({
	location: z.object({
		lat: z.number().min(-90).max(90, "Latitude must be between -90 and 90"),
		lng: z
			.number()
			.min(-180)
			.max(180, "Longitude must be between -180 and 180"),
	}),
	radius: z
		.number()
		.int()
		.positive("Radius must be a positive number")
		.optional(),
});

/**
 * 型推論
 */
export type PlaceSearchInput = z.infer<typeof PlaceSearchSchema>;
export type PlaceDetailsInput = z.infer<typeof PlaceDetailsSchema>;
export type PlaceNearbyInput = z.infer<typeof PlaceNearbySchema>;
