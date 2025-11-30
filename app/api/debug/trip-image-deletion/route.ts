import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminTripOperations } from "@/lib/firebase/admin-operation";
import logger from "@/lib/core/logger";
import { composeMiddleware } from "@/lib/core/middleware";
import { withAuth, withBodyValidation } from "@/lib/api/middleware";
import { DebugTripImageDeletionSchema } from "@/lib/schemas/debug";
import {
	notFound,
	handleApiError,
	createForbiddenError,
} from "@/lib/core/error-handler";

/**
 * DEBUG: Trip画像削除処理のテスト用エンドポイント
 *
 * zod スキーマバリデーション + Context ミドルウェアで移行済み
 *
 * 使用方法:
 * POST /api/debug/trip-image-deletion
 * Body: { tripId: "trip-id" }
 */
export const POST = composeMiddleware(
	withAuth(),
	withBodyValidation(DebugTripImageDeletionSchema),
)(async (request: NextRequest, ctx) => {
	try {
		// ctx.auth, ctx.body が保証されている（型推論が効く）
		const { userId } = ctx.auth!;

		// zod スキーマでバリデーション済み & 型推論
		type BodyType = z.infer<typeof DebugTripImageDeletionSchema>;
		const body = ctx.body as BodyType;
		const { tripId } = body;

		// Trip情報を取得
		const trip = await adminTripOperations.getTripById(tripId);
		if (!trip) {
			return notFound("Trip");
		}

		// 所有権確認
		if (trip.user_id !== userId) {
			throw createForbiddenError("You do not own this trip");
		}

		// 画像削除処理のテスト
		const imageUrl = trip.image_url;
		type DebugInfo = {
			tripId: string;
			hasImageUrl: boolean;
			imageUrl: string | undefined;
			imageUrlType: string;
			imageUrlLength: number;
			deletionAttempted?: boolean;
			deletionResult?: "success" | "error";
			deletionError?: string;
		};
		const debugInfo: DebugInfo = {
			tripId,
			hasImageUrl: !!imageUrl,
			imageUrl,
			imageUrlType: typeof imageUrl,
			imageUrlLength: imageUrl?.length || 0,
		};

		if (imageUrl) {
			try {
				// deleteTripImageを直接呼び出してテスト
				await (adminTripOperations as any).deleteTripImage(imageUrl, tripId);
				debugInfo.deletionAttempted = true;
				debugInfo.deletionResult = "success";
			} catch (error: any) {
				debugInfo.deletionAttempted = true;
				debugInfo.deletionResult = "error";
				debugInfo.deletionError = error.message;
				logger.error("Debug: Image deletion error:", error);
			}
		}

		return NextResponse.json({
			success: true,
			debug: debugInfo,
		});
	} catch (error) {
		return handleApiError(
			error instanceof Error ? error : new Error(String(error)),
			`/api/debug/trip-image-deletion`,
		);
	}
});
