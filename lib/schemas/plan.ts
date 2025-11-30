/**
 * Plan（プラン）スキーマ
 *
 * zod スキーマとして定義し、型推論とバリデーションを一元管理
 */

import { z } from "zod";
import { PlaceDataSchema } from "./trip";

/**
 * AccessLevel スキーマ
 */
const AccessLevelSchema = z.enum(["private", "public", "shared"]);

/**
 * ActivityTag スキーマ
 * 2段階分類のタグ
 *
 * ActivityTag の実際の構造: { primaryCategory: PrimaryCategoryType, secondaryCategory: string }
 */
const ActivityTagSchema = z
	.object({
		primaryCategory: z.enum([
			"transportation",
			"shopping",
			"dining",
			"accommodation",
			"exploration",
			"adventure",
			"entertainment",
			"culture",
			"wellness",
			"service",
		]),
		secondaryCategory: z.string(),
	})
	.optional()
	.nullable();

/**
 * Itinerary フォームデータスキーマ
 */
const ItineraryFormDataSchema = z.object({
	title: z.string().min(1, "Title is required"),
	description: z.string().optional(),
	location: z.string().optional(),
	place_id: z.string().nullable().optional(),
	place_data: PlaceDataSchema.nullable().optional(),
	start_time: z.string().optional(),
	end_time: z.string().optional(),
	timezone: z.string().optional(),
	cost_amount: z.number().nullable().optional(),
	cost_currency: z.string().optional(),
	activity_tag: ActivityTagSchema,
});

/**
 * Day フォームデータスキーマ
 */
const DayFormDataSchema = z.object({
	day_number: z
		.number()
		.int()
		.positive("Day number must be a positive integer"),
	description: z.string().optional(),
});

/**
 * Trip フォームデータスキーマ
 */
const TripFormDataSchema = z.object({
	title: z.string().min(1, "Title is required"),
	description: z.string().optional(),
	start_date: z.string(),
	end_date: z.string(),
	access_level: AccessLevelSchema.or(z.literal("private")).or(
		z.literal("public"),
	),
	image_url: z.string().url().optional().or(z.literal("")),
	destination: z.string().optional(),
	is_template: z.boolean().optional(),
	day_count: z.number().int().positive().optional(),
	likes_count: z.number().int().min(0).optional(),
});

/**
 * Plan 保存データスキーマ
 *
 * `app/api/plans/route.ts` POST エンドポイントのバリデーションロジックを zod に変換
 *
 * Before:
 * ```typescript
 * const planData = await parseRequestBody<PlanSaveData>(request)
 * if (!planData.trip || !planData.trip.title) {
 *   return badRequest('プランのタイトルは必須です')
 * }
 * ```
 *
 * After:
 * ```typescript
 * // ctx.body が型安全 & バリデ済み
 * // すべての if 文バリデーションが消える
 * ```
 */
export const PlanSaveDataSchema = z
	.object({
		trip: TripFormDataSchema,
		days: z.array(
			z.object({
				day: DayFormDataSchema,
				itineraries: z.array(ItineraryFormDataSchema),
			}),
		),
	})
	.refine(
		(data) => {
			// trip.title が必須（zod スキーマで既に検証済みだが、明確にするため）
			return !!(data.trip && data.trip.title);
		},
		{
			message: "Trip title is required",
			path: ["trip", "title"],
		},
	);

/**
 * Plan 更新リクエストスキーマ
 *
 * `app/api/plans/route.ts` PUT エンドポイントのバリデーションロジックを zod に変換
 */
export const UpdatePlanRequestSchema = z.object({
	tripId: z.string().min(1, "Trip ID is required"),
	planData: PlanSaveDataSchema,
});

/**
 * 型推論
 */
export type PlanSaveDataInput = z.infer<typeof PlanSaveDataSchema>;
export type UpdatePlanRequestInput = z.infer<typeof UpdatePlanRequestSchema>;
