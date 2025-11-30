import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import logger from "@/lib/core/logger";
import { planSaveOperations } from "@/lib/travel/plan-save";
import { composeMiddleware } from "@/lib/core/middleware";
import { withAuth, withParams, withBodyValidation } from "@/lib/api/middleware";
import { DuplicatePlanSchema } from "@/lib/schemas/plan-operations";

/**
 * プランを複製する
 *
 * zod スキーマバリデーション + Context ミドルウェアで移行済み
 *
 * Before:
 * ```typescript
 * const body = await parseRequestBody<{ newTitle?: string }>(request)
 * ```
 *
 * After:
 * ```typescript
 * // ctx.body が型安全 & バリデ済み
 * ```
 */
export const POST = composeMiddleware(
	withAuth(),
	withParams(),
	withBodyValidation(DuplicatePlanSchema),
)(async (request: NextRequest, ctx) => {
	// ctx.auth, ctx.params, ctx.body が保証されている（型推論が効く）
	const { userId } = ctx.auth!;
	const { planSlug: sourceTripId } = ctx.params!;

	// zod スキーマでバリデーション済み & 型推論
	type BodyType = z.infer<typeof DuplicatePlanSchema>;
	const body = ctx.body as BodyType;
	const { newTitle } = body;

	// プランを複製
	const result = await planSaveOperations.duplicatePlan(
		sourceTripId,
		userId,
		newTitle,
	);

	return NextResponse.json({
		success: true,
		data: result,
	});
});
