/**
 * Checklist（チェックリスト）スキーマ
 *
 * zod スキーマとして定義し、型推論とバリデーションを一元管理
 */

import { z } from "zod";

/**
 * チェックリストプリセット適用リクエストスキーマ
 *
 * `app/api/trips/[tripSlug]/checklist/apply-preset/route.ts` POST エンドポイントのバリデーションロジックを zod に変換
 *
 * Before:
 * ```typescript
 * const body = await parseRequestBody<{ preset_id?: string }>(request)
 * if (!preset_id) {
 *   return badRequest('preset_id is required')
 * }
 * ```
 *
 * After:
 * ```typescript
 * // ctx.body が型安全 & バリデ済み
 * // すべての if 文バリデーションが消える
 * ```
 */
export const ApplyChecklistPresetSchema = z.object({
	preset_id: z.string().min(1, "Preset ID is required"),
});

/**
 * 型推論
 */
export type ApplyChecklistPresetInput = z.infer<
	typeof ApplyChecklistPresetSchema
>;
