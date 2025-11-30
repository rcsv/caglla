/**
 * Checklist Preset（チェックリストプリセット）スキーマ
 *
 * zod スキーマとして定義し、型推論とバリデーションを一元管理
 */

import { z } from "zod";

/**
 * Checklist Preset Item スキーマ
 */
const ChecklistPresetItemSchema = z
	.object({
		title: z.string().min(1, "Item title is required"),
		description: z.string().optional(),
		category: z.enum(["preparation", "packing"]),
		priority: z.enum(["high", "medium", "low"]).optional(),
	})
	.passthrough(); // 追加フィールドを許可

/**
 * Checklist Preset 作成スキーマ
 *
 * `app/api/checklists/presets/route.ts` POST エンドポイントのバリデーションロジックを zod に変換
 *
 * Before:
 * ```typescript
 * const body = await parseRequestBody<{...}>(request)
 * if (!title || !Array.isArray(items)) {
 *   return badRequest('title and items are required')
 * }
 * ```
 *
 * After:
 * ```typescript
 * // ctx.body が型安全 & バリデ済み
 * // すべての if 文バリデーションが消える
 * ```
 */
export const CreateChecklistPresetSchema = z.object({
	title: z.string().min(1, "Title is required"),
	description: z.string().optional(),
	tags: z.array(z.string()).optional(),
	items: z
		.array(ChecklistPresetItemSchema)
		.min(1, "At least one item is required"),
	is_public: z.boolean().optional(),
});

/**
 * Checklist Preset 更新スキーマ
 *
 * `app/api/checklists/presets/[presetSlug]/route.ts` PUT エンドポイントのバリデーションロジックを zod に変換
 */
export const UpdateChecklistPresetSchema = z.object({
	title: z.string().optional(),
	description: z.string().optional(),
	tags: z.array(z.string()).optional(),
	items: z.array(ChecklistPresetItemSchema).optional(),
	is_public: z.boolean().optional(),
});

/**
 * 型推論
 */
export type CreateChecklistPresetInput = z.infer<
	typeof CreateChecklistPresetSchema
>;
export type UpdateChecklistPresetInput = z.infer<
	typeof UpdateChecklistPresetSchema
>;
