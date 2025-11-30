import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import logger from "@/lib/core/logger";
import { adminDb } from "@/lib/firebase/admin";
import { notFound } from "@/lib/core/error-handler";
import { composeMiddleware } from "@/lib/core/middleware";
import { withAuth, withBodyValidation } from "@/lib/api/middleware";
import { MoveItineraryToDaySchema } from "@/lib/schemas/itinerary-operations";

/**
 * PUT /api/itineraries/move-to-day - 旅程移動
 *
 * zod スキーマバリデーション + Context ミドルウェアで移行済み
 *
 * Before:
 * ```typescript
 * const body = await parseRequestBody<{ itinerary_id?: string; target_day_id?: string }>(request)
 * if (!itinerary_id || !target_day_id) {
 *   return badRequest('Missing required fields: itinerary_id, target_day_id')
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
	withBodyValidation(MoveItineraryToDaySchema),
)(async (request: NextRequest, ctx) => {
	try {
		// ctx.auth, ctx.body が保証されている（型推論が効く）

		// zod スキーマでバリデーション済み & 型推論
		type BodyType = z.infer<typeof MoveItineraryToDaySchema>;
		const body = ctx.body as BodyType;
		const { itinerary_id, target_day_id } = body;

		// 移動先の日程の最後のsort_numberを取得
		const itinerariesRef = adminDb.collection("itineraries");
		const existingItineraries = await itinerariesRef
			.where("day_id", "==", target_day_id)
			.orderBy("sort_number", "desc")
			.limit(1)
			.get();

		const nextSortNumber = existingItineraries.empty
			? 1
			: (existingItineraries.docs[0].data().sort_number || 0) + 1;

		// itineraryを新しい日程に移動
		const itineraryRef = adminDb.collection("itineraries").doc(itinerary_id);

		const updateData = {
			day_id: target_day_id,
			sort_number: nextSortNumber,
			updated_at: new Date(),
		};

		await itineraryRef.update(updateData);

		// 更新されたデータを取得
		const updatedDoc = await itineraryRef.get();
		if (!updatedDoc.exists) {
			return notFound("Itinerary");
		}

		const updatedItinerary = {
			id: updatedDoc.id,
			...updatedDoc.data(),
		};

		return NextResponse.json(updatedItinerary);
	} catch (error) {
		// エラーハンドリングは composeMiddleware 側で自動的に適用される
		// ただし、このエンドポイントは詳細なエラーハンドリングが必要
		logger.error("Error moving itinerary to day", error);
		return NextResponse.json(
			{ error: "Failed to move itinerary to day" },
			{ status: 500 },
		);
	}
});
