import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import logger from "@/lib/core/logger";
import { composeMiddleware } from "@/lib/core/middleware";
import { withAuth, withBodyValidation } from "@/lib/api/middleware";
import { ReorderItinerariesSchema } from "@/lib/schemas/itinerary-operations";

/**
 * POST /api/itineraries/reorder - 旅程並び替え
 *
 * zod スキーマバリデーション + Context ミドルウェアで移行済み
 *
 * Before:
 * ```typescript
 * const body = await parseRequestBody<{ dayId?: string; itineraryIds?: string[] }>(request)
 * if (!dayId || !itineraryIds || !Array.isArray(itineraryIds)) {
 *   return badRequest('Day ID and itinerary IDs array are required')
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
	withBodyValidation(ReorderItinerariesSchema),
)(async (request: NextRequest, ctx) => {
	try {
		// ctx.auth, ctx.body が保証されている（型推論が効く）

		// zod スキーマでバリデーション済み & 型推論
		type BodyType = z.infer<typeof ReorderItinerariesSchema>;
		const body = ctx.body as BodyType;
		const { dayId, itineraryIds } = body;

		logger.debug("Reorder API called", {
			dayId,
			itineraryCount: itineraryIds.length,
		});

		// Firebase Admin SDKが利用できない場合は、クライアントサイドの更新のみ実行
		if (!adminDb) {
			logger.warn(
				"Firebase Admin SDK not available, skipping server-side update",
			);
			return NextResponse.json({
				success: true,
				message: "Client-side reordering completed (server update skipped)",
				reorderedCount: itineraryIds.length,
			});
		}

		logger.debug("Using Firebase Admin SDK for reordering");

		// 各itineraryのsort_numberを更新
		const batch = adminDb.batch();

		itineraryIds.forEach((itineraryId: string, index: number) => {
			const itineraryRef = adminDb.collection("itineraries").doc(itineraryId);
			batch.update(itineraryRef, {
				sort_number: index + 1,
				updated_at: new Date(),
			});
		});

		await batch.commit();

		logger.info("Itineraries reordered successfully", {
			reorderedCount: itineraryIds.length,
		});

		return NextResponse.json({
			success: true,
			message: "Itineraries reordered successfully",
			reorderedCount: itineraryIds.length,
		});
	} catch (error) {
		// エラーハンドリングは composeMiddleware 側で自動的に適用される
		// ただし、このエンドポイントは詳細なエラーハンドリングが必要
		logger.error("Error reordering itineraries", error);
		return NextResponse.json(
			{ error: "Failed to reorder itineraries" },
			{ status: 500 },
		);
	}
});
