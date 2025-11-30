import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import logger from "@/lib/core/logger";
import { planSaveOperations } from "@/lib/travel/plan-save";
import { composeMiddleware } from "@/lib/core/middleware";
import { withAuth, withBodyValidation } from "@/lib/api/middleware";
import {
	PlanSaveDataSchema,
	UpdatePlanRequestSchema,
} from "@/lib/schemas/plan";

/**
 * 完全なプランを一括で保存する
 *
 * zod スキーマバリデーション + Context ミドルウェアで移行済み
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
export const POST = composeMiddleware(
	withAuth(),
	withBodyValidation(PlanSaveDataSchema),
)(async (request: NextRequest, ctx) => {
	// ctx.auth, ctx.body が保証されている（型推論が効く）
	const { userId } = ctx.auth!;

	// zod スキーマでバリデーション済み & 型推論
	type BodyType = z.infer<typeof PlanSaveDataSchema>;
	const planData = ctx.body as BodyType;

	// プランを保存
	const result = await planSaveOperations.saveCompletePlan(userId, planData);

	return NextResponse.json({
		success: true,
		data: result,
	});
});

/**
 * 既存のプランを更新する
 *
 * zod スキーマバリデーション + Context ミドルウェアで移行済み
 *
 * Before:
 * ```typescript
 * const body = await parseRequestBody<{ tripId?: string; planData?: PlanSaveData }>(request)
 * if (!tripId || !planData) {
 *   return badRequest('旅行IDとプランデータは必須です')
 * }
 * ```
 *
 * After:
 * ```typescript
 * // ctx.body が型安全 & バリデ済み
 * // すべての if 文バリデーションが消える
 * ```
 */
export const PUT = composeMiddleware(
	withAuth(),
	withBodyValidation(UpdatePlanRequestSchema),
)(async (request: NextRequest, ctx) => {
	// ctx.auth, ctx.body が保証されている（型推論が効く）
	const { userId } = ctx.auth!;

	// zod スキーマでバリデーション済み & 型推論
	type BodyType = z.infer<typeof UpdatePlanRequestSchema>;
	const body = ctx.body as BodyType;
	const { tripId, planData } = body;

	// プランを更新
	const result = await planSaveOperations.updateCompletePlan(tripId, planData);

	return NextResponse.json({
		success: true,
		data: result,
	});
});
