import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import logger from "@/lib/core/logger";
import { adminUserOperations } from "@/lib/firebase/admin-operation";
import { adminDb } from "@/lib/firebase/admin";
import { generateSlug } from "@/lib/utils/slug";
import { composeMiddleware } from "@/lib/core/middleware";
import { withAuth, withBodyValidation } from "@/lib/api/middleware";
import { CheckUserSlugSchema } from "@/lib/schemas/user-slug";

/**
 * POST /api/users/check-slug - ユーザースラッグ確認
 *
 * zod スキーマバリデーション + Context ミドルウェアで移行済み
 *
 * Before:
 * ```typescript
 * const body = await parseRequestBody<{ name?: string }>(request)
 * if (!name) {
 *   return badRequest('Name is required')
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
	withBodyValidation(CheckUserSlugSchema),
)(async (request: NextRequest, ctx) => {
	// ctx.auth, ctx.body が保証されている（型推論が効く）
	const { userId } = ctx.auth!;

	// zod スキーマでバリデーション済み & 型推論
	type BodyType = z.infer<typeof CheckUserSlugSchema>;
	const body = ctx.body as BodyType;
	const { name } = body;

	// 既存ユーザーを取得（auth_uid で検索、後方互換性のため google_id もチェック）
	// Phase 1-1.5: 認証プロバイダーマルチ対応化
	const existingUser = await adminUserOperations.getUserByAuthUid(userId);

	// 名前からスラッグを生成
	const newSlug = generateSlug(name);

	// 既存ユーザーのスラッグと比較
	if (existingUser && existingUser.slug === newSlug) {
		// 同じスラッグの場合は重複なし
		return NextResponse.json({
			isAvailable: true,
			slug: newSlug,
			message: "この名前は使用可能です",
		});
	}

	// 他のユーザーで同じスラッグが使用されているかチェック
	const usersSnapshot = await adminDb
		.collection("users")
		.where("slug", "==", newSlug)
		.get();

	const isAvailable = usersSnapshot.empty;

	return NextResponse.json({
		isAvailable,
		slug: newSlug,
		message: isAvailable
			? "この名前は使用可能です"
			: "この名前は既に使用されています。別の名前を試してください。",
	});
});
