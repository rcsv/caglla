import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import logger from "@/lib/core/logger";
import { composeMiddleware } from "@/lib/core/middleware";
import { withBodyValidation, withGooglePlacesKey } from "@/lib/api/middleware";
import { PlaceNearbySchema } from "@/lib/schemas/place";
import { withExternalApiErrorHandler } from "@/lib/api/external-api-helpers";

// 新Places API (v1) のsearchNearbyエンドポイント
const GOOGLE_PLACES_API_URL_NEARBY =
	"https://places.googleapis.com/v1/places:searchNearby";

/**
 * POST /api/places/nearby - 近隣場所検索
 *
 * zod スキーマバリデーション + Context ミドルウェアで移行済み
 *
 * Before:
 * ```typescript
 * const body = await parseRequestBody<{...}>(request)
 * if (!location || !location.lat || !location.lng) {
 *   return badRequest('Location (lat, lng) is required')
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
	withGooglePlacesKey(),
	withBodyValidation(PlaceNearbySchema),
)(async (request: NextRequest, ctx) => {
	try {
		// ctx.apiKeys, ctx.body が保証されている（型推論が効く）
		const GOOGLE_PLACES_API_KEY = ctx.apiKeys!.GOOGLE_PLACES!;

		// zod スキーマでバリデーション済み & 型推論
		type BodyType = z.infer<typeof PlaceNearbySchema>;
		const body = ctx.body as BodyType;
		const { location, radius } = body;

		logger.debug("Searching nearby places with new Places API v1", {
			location,
			radius,
		});

		// 新Places API (v1) のsearchNearbyを呼び出し
		const data = await withExternalApiErrorHandler(
			async () => {
				const response = await fetch(GOOGLE_PLACES_API_URL_NEARBY, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
						"X-Goog-FieldMask":
							"places.id,places.displayName,places.formattedAddress,places.location,places.types",
					},
					body: JSON.stringify({
						locationRestriction: {
							circle: {
								center: {
									latitude: location.lat,
									longitude: location.lng,
								},
								radius: radius || 50, // デフォルト50メートル
							},
						},
						languageCode: "en",
						maxResultCount: 5,
					}),
				});

				if (!response.ok) {
					const errorData = await response.json().catch(() => ({}));
					throw new Error(
						`Google Places API error: ${response.status} - ${JSON.stringify(errorData)}`,
					);
				}

				return (await response.json()) as { places?: any[] };
			},
			"Google Places API (searchNearby)",
			"/api/places/nearby",
		);

		if (data instanceof NextResponse) {
			return data;
		}

		logger.debug("Nearby search results count:", data.places?.length || 0);

		// 旧API形式に変換（互換性のため）
		const legacyFormat = {
			status: data.places && data.places.length > 0 ? "OK" : "ZERO_RESULTS",
			results: (data.places || []).map((place: any) => ({
				place_id: place.id,
				name: place.displayName?.text || "",
				formatted_address: place.formattedAddress || "",
				geometry: {
					location: {
						lat: place.location?.latitude || 0,
						lng: place.location?.longitude || 0,
					},
				},
				types: place.types || [],
			})),
		};

		logger.debug("Nearby search response (legacy format):", legacyFormat);

		return NextResponse.json(legacyFormat);
	} catch (error) {
		// エラーハンドリングは composeMiddleware 側で自動的に適用される
		// ただし、このエンドポイントは外部API呼び出しを含むため、詳細なエラーハンドリングが必要
		const errorMessage = error instanceof Error ? error.message : String(error);
		logger.error("Error in places/nearby:", error);
		return NextResponse.json(
			{ error: "Failed to search nearby places", details: errorMessage },
			{ status: 500 },
		);
	}
});
