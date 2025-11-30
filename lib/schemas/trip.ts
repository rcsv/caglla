/**
 * Trip（旅行）スキーマ
 *
 * zod スキーマとして定義し、型推論とバリデーションを一元管理
 */

import { z } from "zod";
import type { PlaceData } from "@/lib/core/types";

/**
 * アクセスレベル（AccessLevel）スキーマ
 *
 * 既存の `AccessLevel` 型に合わせて定義
 * 後方互換性のため 'private' | 'public' も許可
 */
export const AccessLevelSchema = z.enum(["private", "public", "shared"]);

/**
 * PlaceData のスキーマ（Google Places API レスポンス）
 *
 * オプショナルフィールドが多いため、厳密な検証は行わず型の整合性のみを確認
 */
export const PlaceDataSchema: z.ZodType<PlaceData> = z
	.object({
		place_id: z.string(),
		name: z.string(),
		formatted_address: z.string().optional(),
		geometry: z
			.object({
				location: z
					.object({
						lat: z.number(),
						lng: z.number(),
					})
					.optional(),
			})
			.optional(),
		address_components: z.array(z.any()).optional(),
		photos: z.array(z.any()).optional(),
		rating: z.number().optional(),
		user_ratings_total: z.number().optional(),
		price_level: z.number().optional(),
		types: z.array(z.string()).optional(),
		opening_hours: z.any().optional(),
		international_phone_number: z.string().optional(),
		website: z.string().optional(),
		editorial_summary: z.string().optional(),
		vicinity: z.string().optional(),
		short_formatted_address: z.string().optional(),
	})
	.passthrough(); // 追加フィールドを許可

/**
 * Trip 作成スキーマ
 *
 * 既存の `app/api/trips/route.ts` POST エンドポイントのバリデーションロジックを zod に変換
 *
 * Before:
 * ```typescript
 * if (!finalTitle) {
 *   return badRequest('Title or destination is required')
 * }
 * ```
 *
 * After:
 * - zod の `.refine()` で `title || destination` を必須に
 * - その他のフィールドのバリデーションも統合
 */
export const CreateTripSchema = z
	.object({
		title: z.string().optional(),
		destination: z.string().optional(),
		destinationPlace: PlaceDataSchema.optional(),
		destinationPlaceId: z.string().optional(),
		startDate: z
			.string()
			.datetime({ message: "Invalid start date format" })
			.optional(),
		endDate: z
			.string()
			.datetime({ message: "Invalid end date format" })
			.optional(),
		description: z.string().optional(),
		accessLevel: AccessLevelSchema.optional(),
		access_level: AccessLevelSchema.optional(),
		isTemplate: z.boolean().optional(),
		is_template: z.boolean().optional(),
		dayCount: z
			.number()
			.int()
			.positive("Day count must be positive")
			.optional(),
		day_count: z
			.number()
			.int()
			.positive("Day count must be positive")
			.optional(),
		likesCount: z
			.number()
			.int()
			.min(0, "Likes count must be non-negative")
			.optional(),
		likes_count: z
			.number()
			.int()
			.min(0, "Likes count must be non-negative")
			.optional(),
		imageUrl: z
			.string()
			.url({ message: "Invalid image URL format" })
			.optional(),
		image_url: z
			.string()
			.url({ message: "Invalid image URL format" })
			.optional(),
		defaultCurrency: z
			.string()
			.length(3, "Currency code must be 3 characters (e.g., USD, JPY)")
			.optional(),
		default_currency: z
			.string()
			.length(3, "Currency code must be 3 characters (e.g., USD, JPY)")
			.optional(),
	})
	.refine(
		(data) => {
			// title または destination のいずれかが必須
			return !!(data.title || data.destination);
		},
		{
			message: "Title or destination is required",
			path: ["title"], // エラーメッセージを title フィールドに表示
		},
	)
	.refine(
		(data) => {
			// is_template が true の場合、day_count は必須かつ正の数
			const isTemplate = data.isTemplate ?? data.is_template ?? false;
			const dayCount = data.dayCount ?? data.day_count;
			if (isTemplate) {
				return dayCount !== undefined && dayCount > 0;
			}
			return true;
		},
		{
			message: "Template trips require a positive day count",
			path: ["day_count"],
		},
	)
	.refine(
		(data) => {
			// startDate と endDate の日付順序チェック
			if (data.startDate && data.endDate) {
				const start = new Date(data.startDate);
				const end = new Date(data.endDate);
				return start.getTime() <= end.getTime();
			}
			return true;
		},
		{
			message: "End date must be after or equal to start date",
			path: ["endDate"],
		},
	);

/**
 * Trip 更新スキーマ
 *
 * 全てのフィールドをオプショナルにし、部分更新を許可
 *
 * Note: `.partial()` は zod の機能なので、動的に生成される
 */
export const UpdateTripSchema: z.ZodTypeAny =
	CreateTripSchema.partial() as z.ZodTypeAny;

/**
 * 型推論
 */
export type CreateTripInput = z.infer<typeof CreateTripSchema>;
export type UpdateTripInput = z.infer<typeof UpdateTripSchema>;
