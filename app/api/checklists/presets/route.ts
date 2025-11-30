import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import logger from "@/lib/core/logger";
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { badRequest } from "@/lib/core/error-handler";
import { composeMiddleware } from "@/lib/core/middleware";
import { withAuth, withBodyValidation } from "@/lib/api/middleware";
import { CreateChecklistPresetSchema } from "@/lib/schemas/checklist-preset";
import { authApi } from "@/lib/api/middleware";

/**
 * POST /api/checklists/presets - プリセット作成
 *
 * zod スキーマバリデーション + Context ミドルウェアで移行済み
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
export const POST = composeMiddleware(
	withAuth(),
	withBodyValidation(CreateChecklistPresetSchema),
)(async (request: NextRequest, ctx) => {
	// ctx.auth, ctx.body が保証されている（型推論が効く）
	const { userId } = ctx.auth!;

	// zod スキーマでバリデーション済み & 型推論
	type BodyType = z.infer<typeof CreateChecklistPresetSchema>;
	const body = ctx.body as BodyType;
	const { title, description, tags, items, is_public } = body;

	const presetRef = adminDb.collection("checklist_presets").doc();
	const preset = {
		id: presetRef.id,
		user_id: userId,
		title,
		description: description || "",
		tags: tags || [],
		items,
		is_public: is_public || false,
		created_at: new Date(),
		updated_at: new Date(),
		usage_count: 0,
	};

	await presetRef.set(preset);

	return NextResponse.json(preset, { status: 201 });
});

// GET: プリセット一覧取得
export const GET = authApi(async (request: NextRequest, ctx) => {
	const { userId } = ctx.auth!;

	const { searchParams } = new URL(request.url);
	const query = searchParams.get("query") || "";
	const sort = searchParams.get("sort") || "popular"; // popular | recent
	const requestedUserId = searchParams.get("user_id"); // マイプリセットのみ取得

	let presetsQuery = adminDb
		.collection("checklist_presets")
		.where("is_public", "==", true);

	// マイプリセットのみ取得
	if (requestedUserId) {
		if (requestedUserId !== "current") {
			return badRequest("Invalid user_id parameter");
		}
		presetsQuery = adminDb
			.collection("checklist_presets")
			.where("user_id", "==", userId);
	}

	// ソート
	if (sort === "popular") {
		presetsQuery = presetsQuery.orderBy("usage_count", "desc");
	} else if (sort === "recent") {
		presetsQuery = presetsQuery.orderBy("created_at", "desc");
	}

	const snapshot = await presetsQuery.limit(50).get();
	const presets = snapshot.docs.map((doc: QueryDocumentSnapshot) => doc.data());

	// クライアント側で検索フィルタ（Firestoreの全文検索制限のため）
	let filteredPresets = presets;
	if (query) {
		const lowerQuery = query.toLowerCase();
		filteredPresets = presets.filter(
			(p: any) =>
				p.title.toLowerCase().includes(lowerQuery) ||
				p.description?.toLowerCase().includes(lowerQuery) ||
				p.tags?.some((tag: string) => tag.toLowerCase().includes(lowerQuery)),
		);
	}

	return NextResponse.json({ presets: filteredPresets });
});
