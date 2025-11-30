import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import logger from "@/lib/core/logger";
import { composeMiddleware } from "@/lib/core/middleware";
import { withQueryValidation, withGooglePlacesKey } from "@/lib/api/middleware";
import { PlacesPhotoQuerySchema } from "@/lib/schemas/places-photo";
import { withExternalApiErrorHandler } from "@/lib/api/external-api-helpers";

// 動的レンダリングを強制（request.urlを使用するため）
export const dynamic = "force-dynamic";

const GOOGLE_PLACES_API_URL_OLD = "https://maps.googleapis.com/maps/api/place";
const GOOGLE_PLACES_API_URL_NEW = "https://places.googleapis.com/v1";

/**
 * GET /api/places/photo - Places写真取得
 *
 * zod スキーマバリデーション + Context ミドルウェアで移行済み
 */
export const GET = composeMiddleware(
	withGooglePlacesKey(),
	withQueryValidation(PlacesPhotoQuerySchema),
)(async (request: NextRequest, ctx) => {
	try {
		// ctx.apiKeys, ctx.query が保証されている（型推論が効く）
		const GOOGLE_PLACES_API_KEY = ctx.apiKeys!.GOOGLE_PLACES!;

		// zod スキーマでバリデーション済み & 型推論
		type QueryType = z.infer<typeof PlacesPhotoQuerySchema>;
		const query = ctx.query as QueryType;
		const photoReference = query.photoreference;
		const maxWidth = query.maxwidth?.toString() || "800"; // デフォルトを800pxに向上
		const maxHeight = query.maxheight?.toString();

		logger.debug("Fetching photo from Places API", {
			photoReference: photoReference.substring(0, 20) + "...",
			maxWidth,
			maxHeight,
		});

		let apiUrl: string;
		let headers: HeadersInit;

		// 新Places API (v1) の photo name 形式（"places/ChIJ.../photos/..."）か判定
		if (photoReference.startsWith("places/")) {
			// 新Places API (v1) を使用
			apiUrl = `${GOOGLE_PLACES_API_URL_NEW}/${photoReference}/media?maxHeightPx=${maxHeight || maxWidth}&maxWidthPx=${maxWidth}&skipHttpRedirect=false`;
			headers = {
				"X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
			};
		} else {
			// 旧Places API（後方互換性）
			apiUrl = `${GOOGLE_PLACES_API_URL_OLD}/photo?maxwidth=${maxWidth}${maxHeight ? `&maxheight=${maxHeight}` : ""}&photo_reference=${photoReference}&key=${GOOGLE_PLACES_API_KEY}`;
			headers = {};
		}

		// Places APIを呼び出し（エラーハンドリング付き）
		const response = await withExternalApiErrorHandler(
			async () => {
				const res = await fetch(apiUrl, { headers });

				if (!res.ok) {
					throw new Error(
						`Failed to fetch photo from Places API: ${res.status} ${res.statusText}`,
					);
				}

				return res;
			},
			"Google Places API (Photo)",
			"/api/places/photo",
		);

		if (response instanceof NextResponse) {
			return response;
		}

		// レスポンスヘッダーをコピーして画像を返す
		const responseHeaders = new Headers();
		responseHeaders.set(
			"Content-Type",
			response.headers.get("Content-Type") || "image/jpeg",
		);
		responseHeaders.set("Cache-Control", "public, max-age=3600"); // 1時間のキャッシュ

		return new NextResponse(response.body, {
			status: response.status,
			headers: responseHeaders,
		});
	} catch (error) {
		// エラーハンドリングは composeMiddleware 側で自動的に適用される
		// ただし、このエンドポイントは外部API呼び出しを含むため、詳細なエラーハンドリングが必要
		const errorMessage = error instanceof Error ? error.message : String(error);
		logger.error("Error in places/photo:", error);
		const { handleApiError } = await import("@/lib/core/error-handler");
		return handleApiError(
			error instanceof Error ? error : new Error(String(error)),
			"/api/places/photo",
		);
	}
});
