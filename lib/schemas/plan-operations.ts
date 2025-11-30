/**
 * Plan Operations（プラン操作）スキーマ
 *
 * zod スキーマとして定義し、型推論とバリデーションを一元管理
 */

import { z } from "zod";

/**
 * プラン複製リクエストスキーマ
 *
 * `app/api/plans/[planSlug]/duplicate/route.ts` POST エンドポイントのバリデーションロジックを zod に変換
 */
export const DuplicatePlanSchema = z.object({
	newTitle: z.string().optional(),
});

/**
 * プランテンプレート保存リクエストスキーマ
 *
 * `app/api/plans/[planSlug]/template/route.ts` POST エンドポイントのバリデーションロジックを zod に変換
 *
 * Before:
 * ```typescript
 * const body = await parseRequestBody<{ templateName?: string }>(request)
 * if (!templateName) {
 *   return badRequest('テンプレート名は必須です')
 * }
 * ```
 *
 * After:
 * ```typescript
 * // ctx.body が型安全 & バリデ済み
 * // すべての if 文バリデーションが消える
 * ```
 */
export const SavePlanAsTemplateSchema = z.object({
	templateName: z.string().min(1, "Template name is required"),
});

/**
 * テンプレートからレプリカ作成リクエストスキーマ
 *
 * `app/api/trip/[tripSlug]/replica/route.ts` POST エンドポイントのバリデーションロジックを zod に変換
 *
 * Before:
 * ```typescript
 * const body = await parseRequestBody<{ startDate?: string }>(request)
 * const startDateRaw = typeof body.startDate === 'string' ? body.startDate : ''
 * const startDate = startDateRaw ? new Date(startDateRaw) : null
 * if (startDate && Number.isNaN(startDate.getTime())) {
 *   return badRequest('Invalid start date')
 * }
 * ```
 *
 * After:
 * ```typescript
 * // ctx.body が型安全 & バリデ済み
 * // すべての if 文バリデーションが消える
 * ```
 */
export const CreateReplicaFromTemplateSchema = z.object({
	startDate: z
		.string()
		.optional()
		.refine(
			(val) => {
				if (!val) return true;
				const date = new Date(val);
				return !Number.isNaN(date.getTime());
			},
			{ message: "Invalid start date" },
		),
});

/**
 * 型推論
 */
export type DuplicatePlanInput = z.infer<typeof DuplicatePlanSchema>;
export type SavePlanAsTemplateInput = z.infer<typeof SavePlanAsTemplateSchema>;
export type CreateReplicaFromTemplateInput = z.infer<
	typeof CreateReplicaFromTemplateSchema
>;
