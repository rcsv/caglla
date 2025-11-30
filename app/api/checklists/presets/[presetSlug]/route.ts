import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import logger from "@/lib/core/logger";
import { notFound, createForbiddenError } from "@/lib/core/error-handler";
import { composeMiddleware } from "@/lib/core/middleware";
import { withAuth, withParams, withBodyValidation } from "@/lib/api/middleware";
import { UpdateChecklistPresetSchema } from "@/lib/schemas/checklist-preset";
import { authApi } from "@/lib/api/middleware";

// GET: プリセット詳細取得
export const GET = authApi(async (request: NextRequest, ctx) => {
	// ctx.auth, ctx.params が保証されている（authApi プリセットが認証チェックを実行）
	const { userId } = ctx.auth!;
	const { presetSlug } = ctx.params!;
	const ref = adminDb.collection("checklist_presets").doc(presetSlug);
	const doc = await ref.get();

	if (!doc.exists) {
		return notFound("Preset");
	}

	const preset = doc.data();

	// 公開プリセットまたは自分のプリセットのみ閲覧可能
	if (!preset?.is_public && preset?.user_id !== userId) {
		throw createForbiddenError(
			"You do not have permission to access this preset",
		);
	}

	return NextResponse.json(preset);
});

/**
 * PUT: プリセット更新
 *
 * zod スキーマバリデーション + Context ミドルウェアで移行済み
 *
 * Before:
 * ```typescript
 * const body = await parseRequestBody<{...}>(request)
 * ```
 *
 * After:
 * ```typescript
 * // ctx.body が型安全 & バリデ済み
 * ```
 */
export const PUT = composeMiddleware(
	withAuth(),
	withParams(),
	withBodyValidation(UpdateChecklistPresetSchema),
)(async (request: NextRequest, ctx) => {
	// ctx.auth, ctx.params, ctx.body が保証されている（型推論が効く）
	const { userId } = ctx.auth!;
	const { presetSlug } = ctx.params!;

	// zod スキーマでバリデーション済み & 型推論
	type BodyType = z.infer<typeof UpdateChecklistPresetSchema>;
	const body = ctx.body as BodyType;
	const { title, description, tags, items, is_public } = body;

	const ref = adminDb.collection("checklist_presets").doc(presetSlug);
	const doc = await ref.get();

	if (!doc.exists) {
		return notFound("Preset");
	}

	const preset = doc.data();
	if (preset?.user_id !== userId) {
		throw createForbiddenError("You do not own this preset");
	}

	await ref.update({
		title: title || preset.title,
		description: description !== undefined ? description : preset.description,
		tags: tags || preset.tags,
		items: items || preset.items,
		is_public: is_public !== undefined ? is_public : preset.is_public,
		updated_at: new Date(),
	});

	const updated = await ref.get();
	return NextResponse.json(updated.data());
});

// DELETE: プリセット削除
export const DELETE = authApi(async (request: NextRequest, ctx) => {
	// ctx.auth, ctx.params が保証されている（authApi プリセットが認証チェックを実行）
	const { userId } = ctx.auth!;
	const { presetSlug } = ctx.params!;
	const ref = adminDb.collection("checklist_presets").doc(presetSlug);
	const doc = await ref.get();

	if (!doc.exists) {
		return notFound("Preset");
	}

	const preset = doc.data();
	if (preset?.user_id !== userId) {
		throw createForbiddenError("You do not own this preset");
	}

	await ref.delete();
	return NextResponse.json({ success: true });
});
