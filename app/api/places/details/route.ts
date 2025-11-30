import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import logger from "@/lib/core/logger";
import { isSupportedLanguage, DEFAULT_LANGUAGE } from "@/lib/utils/language";
import {
	getPlaceFromCache,
	savePlaceToCache,
	isCacheStale,
	checkCacheCompleteness,
	enrichPlaceCache,
} from "@/lib/api/places-cache";
import type { SupportedLanguage, PlaceDetailsResult } from "@/lib/core/types";
import { composeMiddleware } from "@/lib/core/middleware";
import { withBodyValidation, withGooglePlacesKey } from "@/lib/api/middleware";
import { PlaceDetailsSchema } from "@/lib/schemas/place";
import { withExternalApiErrorHandler } from "@/lib/api/external-api-helpers";

// 新Places API (v1) のエンドポイント
const GOOGLE_PLACES_API_URL = "https://places.googleapis.com/v1/places";

// Soft TTL: 14日（ミリ秒）
// Google Places API利用規約: すべてのデータは30日以内のキャッシュのみ許可
// 14日でバックグラウンド更新、30日で自動削除
const SOFT_TTL_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * POST /api/places/details - 場所詳細取得
 *
 * zod スキーマバリデーション + Context ミドルウェアで移行済み
 *
 * Before:
 * ```typescript
 * const body = await parseRequestBody<{...}>(request)
 * if (!placeId) {
 *   return badRequest('Place ID is required')
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
	withBodyValidation(PlaceDetailsSchema),
)(async (request: NextRequest, ctx) => {
	try {
		// ctx.apiKeys, ctx.body が保証されている（型推論が効く）
		const GOOGLE_PLACES_API_KEY = ctx.apiKeys!.GOOGLE_PLACES!;

		// zod スキーマでバリデーション済み & 型推論
		type BodyType = z.infer<typeof PlaceDetailsSchema>;
		const body = ctx.body as BodyType;
		const { placeId, language, requiredFields = [] } = body;

		// 言語バリデーション（zod スキーマでデフォルト値が設定済み）
		const validLanguage: SupportedLanguage =
			language && isSupportedLanguage(language) ? language : DEFAULT_LANGUAGE;

		logger.debug("Getting place details", {
			placeId,
			language: validLanguage,
			requiredFields,
		});

		// 1. キャッシュを確認
		const cached = await getPlaceFromCache(placeId, validLanguage);

		if (cached) {
			// 2. キャッシュ完全性チェック
			if (requiredFields.length > 0) {
				const missingFields = checkCacheCompleteness(cached, requiredFields);

				if (missingFields.length === 0) {
					// 必要な情報が揃っている
					logger.info("Cache hit (complete)", {
						placeId,
						language: validLanguage,
					});
					return NextResponse.json({ status: "OK", result: cached });
				}

				// 3. 不足しているフィールドのみをAPIに要求
				logger.info("Cache incomplete, enriching with missing fields", {
					placeId,
					language: validLanguage,
					missingFields,
				});

				// 不足しているフィールドをGoogle Places APIのフィールド名に変換
				const fieldsToFetch = missingFields.map((field) => {
					const fieldMap: Record<string, string> = {
						price_level: "priceLevel",
						rating: "rating",
						user_ratings_total: "userRatingCount",
						editorial_summary: "editorialSummary",
						reviews: "reviews",
						opening_hours: "regularOpeningHours",
						website: "websiteUri",
						formatted_phone_number: "nationalPhoneNumber",
						utc_offset_minutes: "utcOffsetMinutes",
					};
					return fieldMap[field] || field;
				});

				// 基本フィールドも含める（place_id, name等は常に必要）
				const allFields = [
					"id",
					"displayName",
					"formattedAddress",
					"location",
					...fieldsToFetch,
				];

				const placeData = await fetchPlaceDetailsFromAPI(
					placeId,
					validLanguage,
					GOOGLE_PLACES_API_KEY,
					allFields,
				);

				// 4. キャッシュの統合更新（エンリッチメント）
				await enrichPlaceCache(placeId, validLanguage, placeData);

				// エンリッチメント後のキャッシュを取得して返す
				const enrichedCache = await getPlaceFromCache(placeId, validLanguage);
				return NextResponse.json({ status: "OK", result: enrichedCache });
			} else {
				// requiredFieldsが指定されていない場合は既存のロジック
				const isStale = isCacheStale(cached, SOFT_TTL_MS);

				if (isStale) {
					// Soft TTL: 古いキャッシュだが即座に返し、バックグラウンドで更新
					logger.info(
						"Cache hit but stale, returning cached data and refreshing in background",
						{
							placeId,
							language: validLanguage,
						},
					);

					// バックグラウンド更新（非同期、結果を待たない）
					refreshPlaceInBackground(
						placeId,
						validLanguage,
						GOOGLE_PLACES_API_KEY,
					).catch((err) => {
						logger.warn("Background refresh failed:", err);
					});
				} else {
					logger.info("Cache hit (fresh)", {
						placeId,
						language: validLanguage,
					});
				}

				return NextResponse.json({ status: "OK", result: cached });
			}
		}

		// キャッシュミス: APIから取得
		logger.info("Cache miss, fetching from API", {
			placeId,
			language: validLanguage,
		});
		const placeData = await fetchPlaceDetailsFromAPI(
			placeId,
			validLanguage,
			GOOGLE_PLACES_API_KEY,
		);

		try {
			await savePlaceToCache(placeData, validLanguage);
		} catch (cacheError) {
			logger.warn("Failed to save to cache:", cacheError);
		}

		return NextResponse.json({ status: "OK", result: placeData });
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		logger.error("Error in places/details:", error);
		return NextResponse.json(
			{ error: "Failed to get place details", details: errorMessage },
			{ status: 500 },
		);
	}
});

/**
 * Google Places APIから場所詳細を取得（フィールドマスキング対応）
 *
 * @param placeId - Google Places API の place_id
 * @param language - 言語コード
 * @param apiKey - Google Places API Key
 * @param fields - 取得するフィールドのリスト（空配列の場合は全フィールド）
 */
async function fetchPlaceDetailsFromAPI(
	placeId: string,
	language: SupportedLanguage,
	apiKey: string,
	fields: string[] = [],
): Promise<PlaceDetailsResult> {
	// フィールドマスクを構築（fieldsが指定されていない場合は全フィールド）
	// 新Places API (v1) フィールドマスク定義
	// Basic Data（無料）: id, displayName, formattedAddress, location, viewport, addressComponents, types, businessStatus, photos, googleMapsUri, iconBackgroundColor
	// Contact Data（$3.00/1,000件）: nationalPhoneNumber, internationalPhoneNumber, websiteUri, regularOpeningHours
	// Atmosphere Data（$5.00/1,000件）: rating, userRatingCount, priceLevel, editorialSummary, reviews
	const defaultFields = [
		// Basic Data（無料）
		"id",
		"displayName",
		"formattedAddress",
		"location",
		"addressComponents", // 国コード取得のため追加
		"types",
		"businessStatus",
		"photos",
		"googleMapsUri",
		"shortFormattedAddress", // vicinity の代わり
		"utcOffsetMinutes", // タイムゾーン情報（営業時間判定に必要）
		// Contact Data（$3.00/1,000件）
		"nationalPhoneNumber",
		"internationalPhoneNumber",
		"websiteUri",
		"regularOpeningHours",
		// Atmosphere Data（$5.00/1,000件）
		"rating",
		"userRatingCount",
		"priceLevel",
		"editorialSummary",
		"reviews",
	];

	const fieldsToFetch = fields.length > 0 ? fields : defaultFields;
	const fieldMask = fieldsToFetch.join(",");

	// 新Places API (v1) を呼び出し（エラーハンドリング付き）
	const data = await withExternalApiErrorHandler(
		async () => {
			const response = await fetch(
				`${GOOGLE_PLACES_API_URL}/${placeId}?languageCode=${language}`,
				{
					method: "GET",
					headers: {
						"Content-Type": "application/json",
						"X-Goog-Api-Key": apiKey,
						"X-Goog-FieldMask": fieldMask,
						"Accept-Language": language,
					},
				},
			);

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(
					`Google Places API error: ${response.status} - ${JSON.stringify(errorData)}`,
				);
			}

			return await response.json();
		},
		"Google Places API",
		"/api/places/details",
	);

	if (data instanceof NextResponse) {
		throw new Error("Failed to fetch place details from API");
	}

	// 🔍 デバッグ: 新Places API v1からの完全なレスポンスをログ出力
	logger.debug("================================================");
	logger.debug("📦 新Places API (v1) レスポンス全体:");
	logger.debug(JSON.stringify(data, null, 2));
	logger.debug("================================================");

	// 旧APIとの互換性のため、レスポンス形式を変換
	const placeDetails: PlaceDetailsResult = {
		// 新API → 旧API フィールドマッピング
		place_id: data.id?.replace("places/", ""), // "places/ChIJ..." → "ChIJ..."
		name: data.displayName?.text || data.displayName || data.name,
		formatted_address: data.formattedAddress,
		// geometry変換（必須フィールド）
		geometry: {
			location: {
				lat: data.location?.latitude || 0,
				lng: data.location?.longitude || 0,
			},
		},
		vicinity: data.shortFormattedAddress,
		business_status: data.businessStatus,
		types: data.types,
		url: data.googleMapsUri,
		icon: `https://maps.gstatic.com/mapfiles/place_api/icons/v1/png_71/geocode-71.png`, // デフォルトアイコン
		utc_offset_minutes: data.utcOffsetMinutes,
		// addressComponents変換
		address_components: data.addressComponents?.map((comp: any) => ({
			long_name: comp.longText,
			short_name: comp.shortText,
			types: comp.types,
		})),
		// photos変換（新API v1では photo.name をそのまま使用）
		photos: data.photos?.map((photo: any) => ({
			photo_reference: photo.name, // "places/ChIJ.../photos/XXX" 形式をそのまま保存
			height: photo.heightPx,
			width: photo.widthPx,
		})),
		// Contact Data
		formatted_phone_number: data.nationalPhoneNumber,
		international_phone_number: data.internationalPhoneNumber,
		website: data.websiteUri,
		// opening_hours変換
		opening_hours: data.regularOpeningHours
			? {
					open_now: data.regularOpeningHours.openNow,
					weekday_text: data.regularOpeningHours.weekdayDescriptions,
				}
			: undefined,
		// Atmosphere Data
		rating: data.rating,
		user_ratings_total: data.userRatingCount,
		price_level: data.priceLevel
			? (() => {
					// Google Places API v1 returns 'PRICE_LEVEL_*' format
					const priceLevels = [
						"PRICE_LEVEL_FREE",
						"PRICE_LEVEL_INEXPENSIVE",
						"PRICE_LEVEL_MODERATE",
						"PRICE_LEVEL_EXPENSIVE",
						"PRICE_LEVEL_VERY_EXPENSIVE",
					];
					const index = priceLevels.indexOf(data.priceLevel);
					return index >= 0 ? index : undefined;
				})()
			: undefined,
		editorial_summary: data.editorialSummary?.text
			? {
					overview: data.editorialSummary.text,
				}
			: data.editorialSummary?.overview
				? {
						overview: data.editorialSummary.overview,
					}
				: undefined,
		// reviews変換
		reviews: data.reviews?.map((review: any) => ({
			author_name: review.authorAttribution?.displayName || review.author_name,
			rating: review.rating,
			text: review.text?.text || review.text || "",
			time: review.publishTime
				? Math.floor(new Date(review.publishTime).getTime() / 1000)
				: review.time || 0,
			relative_time_description:
				review.relativePublishTimeDescription ||
				review.relative_time_description,
		})),
	};

	return placeDetails;
}

/**
 * バックグラウンドで場所データを更新
 */
async function refreshPlaceInBackground(
	placeId: string,
	language: SupportedLanguage,
	apiKey: string,
): Promise<void> {
	try {
		logger.debug("Refreshing place in background", { placeId, language });
		const placeData = await fetchPlaceDetailsFromAPI(placeId, language, apiKey);
		await savePlaceToCache(placeData, language);
		logger.info("Background refresh completed", { placeId, language });
	} catch (error) {
		logger.error("Background refresh failed:", error);
		throw error;
	}
}
