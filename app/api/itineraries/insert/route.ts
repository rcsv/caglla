import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/firestore";
import type {
	PlaceData,
	PlacesCache,
	PlacesCacheInput,
	Itinerary,
	SupportedLanguage,
} from "@/lib/core/types";
import { getUserLanguage } from "@/lib/utils/language";
import logger from "@/lib/core/logger";
import { composeMiddleware } from "@/lib/core/middleware";
import { withAuth, withBodyValidation } from "@/lib/api/middleware";
import { InsertItinerarySchema } from "@/lib/schemas/itinerary";

/**
 * Insert a new itinerary into a specified day at a given position and renumber subsequent itineraries as needed.
 *
 * zod スキーマバリデーション + Context ミドルウェアで移行済み
 *
 * Before:
 * ```typescript
 * const body = await parseRequestBody<{...}>(request)
 * if (!day_id || !title || (!place_id && !place_data?.place_id)) {
 *   return badRequest('Missing required fields: day_id, title, and place_id or place_data.place_id')
 * }
 * ```
 *
 * After:
 * ```typescript
 * // ctx.body が型安全 & バリデ済み
 * // すべての if 文バリデーションが消える
 * ```
 *
 * @param request - The incoming NextRequest whose JSON body must include:
 *   - `day_id` (string): target day identifier (required)
 *   - `title` (string): itinerary title (required)
 *   - `place_id` (string) or `place_data.place_id` (string): identifier of the place to attach (one required)
 *   - `place_data` (optional): partial place payload used to populate cache when the place is not found in PLACES_CACHE
 *   - `description` (optional): itinerary description
 *   - `location` (optional): itinerary location string
 *   - `insert_after_index` (optional): 1-based display index after which to insert; if omitted or out of range, the itinerary is appended
 * @returns The saved itinerary object containing `id`, the persisted itinerary fields (including `sort_number`), and `place_data` set to the resolved PlaceData or `null`.
 *
 * On validation failure returns a 400 response with an error message. On unexpected errors returns a 500 response.
 */
export const POST = composeMiddleware(
	withAuth(),
	withBodyValidation(InsertItinerarySchema),
)(async (request: NextRequest, ctx) => {
	// ctx.auth, ctx.body が保証されている（型推論が効く）
	const { userId } = ctx.auth!;

	// zod スキーマでバリデーション済み & 型推論
	type BodyType = z.infer<typeof InsertItinerarySchema>;
	const body = ctx.body as BodyType;
	const {
		day_id,
		place_id,
		place_data,
		title,
		description,
		location,
		insert_after_index,
	} = body;

	// zod スキーマで place_id または place_data?.place_id が必須であることが保証されている
	const resolvedPlaceId: string = place_id || place_data!.place_id;

	const insertAfterIndex =
		insert_after_index !== undefined
			? parseInt(String(insert_after_index))
			: -1;

	// 同じday_idの既存のitinerariesを取得してsort_number順に並べる
	const itinerariesRef = adminDb.collection(COLLECTIONS.ITINERARIES);
	const existingItinerariesSnapshot = await itinerariesRef
		.where("day_id", "==", day_id)
		.orderBy("sort_number", "asc")
		.get();

	const existingItineraries = existingItinerariesSnapshot.docs.map(
		(doc: FirebaseFirestore.QueryDocumentSnapshot): Itinerary =>
			({
				id: doc.id,
				...doc.data(),
			}) as Itinerary,
	);

	// 挿入位置に基づいて新しいsort_numberを計算
	let newSortNumber: number;

	logger.debug("Insert API called", {
		insertAfterIndex,
		existingCount: existingItineraries.length,
	});
	logger.debug("Existing itineraries", {
		itineraries: existingItineraries.map((i: any) => ({
			id: i.id,
			title: i.title,
			sort_number: i.sort_number,
		})),
	});

	if (insertAfterIndex < 0 || insertAfterIndex >= existingItineraries.length) {
		// 最後に追加する場合
		newSortNumber =
			existingItineraries.length > 0
				? Math.max(
						...existingItineraries.map((i: Itinerary) => i.sort_number || 0),
					) + 1
				: 1;
	} else {
		// 指定位置に挿入する場合
		// insertAfterIndexは表示番号（1ベース）
		let itinerariesToUpdate: Itinerary[] = [];

		if (
			insertAfterIndex > 0 &&
			insertAfterIndex <= existingItineraries.length
		) {
			// insertAfterIndex番目の後に挿入するので、sort_numberはinsertAfterIndex + 1
			newSortNumber = insertAfterIndex + 1;

			logger.debug("Insert after display index", {
				insertAfterIndex,
				newSortNumber,
			});

			// 新しいsort_number以降のitinerariesのsort_numberを1つずつ増やす
			itinerariesToUpdate = existingItineraries.filter(
				(i: Itinerary) => (i.sort_number || 0) >= newSortNumber,
			);
		} else {
			// 範囲外の場合は最後に追加
			newSortNumber =
				existingItineraries.length > 0
					? Math.max(
							...existingItineraries.map((i: Itinerary) => i.sort_number || 0),
						) + 1
					: 1;
			itinerariesToUpdate = [];
		}

		// バッチ処理で後続のitinerariesを更新
		const batch = adminDb.batch();

		for (const itinerary of itinerariesToUpdate) {
			const docRef = itinerariesRef.doc(itinerary.id);
			batch.update(docRef, {
				sort_number: itinerary.sort_number + 1,
				updated_at: new Date(),
			});
		}

		// バッチ更新を実行
		if (itinerariesToUpdate.length > 0) {
			await batch.commit();
			logger.debug("Updated itineraries after insertion", {
				count: itinerariesToUpdate.length,
			});
		}
	}

	// 新しいitineraryを作成
	const itineraryData = {
		day_id,
		sort_number: newSortNumber,
		title,
		description: description || "",
		location: location || "",
		place_id: resolvedPlaceId as string,
		created_at: new Date(),
		updated_at: new Date(),
	};

	// Firestoreに保存
	const docRef = await itinerariesRef.add(itineraryData);

	// Trip.stats.itineraries をインクリメント
	try {
		// day_id から trip_id を解決
		const dayDoc = await adminDb.collection(COLLECTIONS.DAYS).doc(day_id).get();
		const tripId = dayDoc.data()?.trip_id as string | undefined;
		if (tripId) {
			const tripRef = adminDb.collection(COLLECTIONS.TRIPS).doc(tripId);
			await tripRef.update({
				"stats.itineraries": adminDb.firestore.FieldValue.increment(1),
			} as any);
		}
	} catch (e) {
		logger.warn("Failed to increment trip.stats.itineraries (insert API)", {
			day_id,
			error: e,
		});
	}

	// 保存されたデータを返す
	// place_cache から実体を解決（存在しなければ、リクエストのplace_dataをキャッシュ保存）
	let resolvedPlaceData: PlaceData | null = null;
	try {
		const cacheDoc = await adminDb
			.collection(COLLECTIONS.PLACES_CACHE)
			.doc(resolvedPlaceId)
			.get();
		if (cacheDoc.exists) {
			const placesCache = cacheDoc.data() as PlacesCache;
			// PlacesCacheからPlaceDataに変換（メタデータを除外）
			resolvedPlaceData = {
				place_id: placesCache.place_id,
				name: placesCache.name,
				formatted_address: placesCache.formatted_address,
				vicinity: placesCache.vicinity,
				geometry: placesCache.geometry,
				address_components: placesCache.address_components,
				photos: placesCache.photos,
				rating: placesCache.rating,
				user_ratings_total: placesCache.user_ratings_total,
				price_level: placesCache.price_level,
				types: placesCache.types,
				opening_hours: placesCache.opening_hours,
				international_phone_number: placesCache.international_phone_number,
				website: placesCache.website,
				editorial_summary: placesCache.editorial_summary,
			};
			// アクセス統計を更新
			await cacheDoc.ref
				.update({
					last_accessed: new Date(),
					access_count: (placesCache.access_count || 0) + 1,
				})
				.catch(() => {});
		} else if (place_data?.place_id) {
			logger.debug("Saving place_data to PlacesCache (NEW FORMAT)", {
				placeId: place_data.place_id,
			});

			// 新形式でのキャッシュ保存（言語対応）
			try {
				// ユーザーの言語設定を取得
				// TODO: ユーザー情報を取得して言語設定を使用
				// 現在は日本語として保存（ユーザー情報取得後に修正予定）
				const language: SupportedLanguage = "ja"; // 暫定：日本語

				const cachePayload: PlacesCacheInput = {
					format_version: "2.0.0", // 新バージョン
					place_id: place_data.place_id,
					language: language, // 言語フィールド追加
					name: place_data.name,
					formatted_address: place_data.formatted_address,
					vicinity: place_data.vicinity,
					geometry: place_data.geometry,
					cached_at: new Date(),
					last_accessed: new Date(),
					access_count: 1,
				};
				if (place_data.address_components)
					cachePayload.address_components = place_data.address_components;
				if (place_data.photos) cachePayload.photos = place_data.photos;
				if (place_data.rating !== undefined)
					cachePayload.rating = place_data.rating;
				if (place_data.user_ratings_total !== undefined)
					cachePayload.user_ratings_total = place_data.user_ratings_total;
				if (place_data.price_level !== undefined)
					cachePayload.price_level = place_data.price_level;
				if (place_data.types) cachePayload.types = place_data.types;
				if (place_data.opening_hours?.weekday_text)
					cachePayload.opening_hours = {
						weekday_text: place_data.opening_hours.weekday_text,
					};
				if (place_data.international_phone_number)
					cachePayload.international_phone_number =
						place_data.international_phone_number;
				if (place_data.website) cachePayload.website = place_data.website;
				if (place_data.editorial_summary)
					cachePayload.editorial_summary = place_data.editorial_summary;

				// 新形式のドキュメントID: {place_id}_{language}
				const cacheKey = `${resolvedPlaceId}_${language}`;
				await adminDb
					.collection(COLLECTIONS.PLACES_CACHE)
					.doc(cacheKey)
					.set(cachePayload);
				logger.debug("Successfully saved to PlacesCache (NEW FORMAT)", {
					cacheKey,
				});
			} catch (cacheError) {
				logger.error("Failed to save to PlacesCache (NEW FORMAT):", cacheError);
				// キャッシュ保存失敗は致命的ではない
			}

			// PlaceDataとして返す（メタデータを除外）
			resolvedPlaceData = {
				place_id: place_data.place_id,
				name: place_data.name,
				formatted_address: place_data.formatted_address,
				vicinity: place_data.vicinity,
				geometry: place_data.geometry,
				address_components: place_data.address_components,
				photos: place_data.photos,
				rating: place_data.rating,
				user_ratings_total: place_data.user_ratings_total,
				price_level: place_data.price_level,
				types: place_data.types,
				opening_hours: place_data.opening_hours,
				international_phone_number: place_data.international_phone_number,
				website: place_data.website,
				editorial_summary: place_data.editorial_summary,
			};
		}
	} catch (e) {
		logger.error("Error resolving place_data", e);
		resolvedPlaceData = (place_data as PlaceData) || null;
	}

	const savedItinerary = {
		id: docRef.id,
		...itineraryData,
		place_data: resolvedPlaceData,
	};

	logger.info("Itinerary inserted", {
		position: newSortNumber,
		dayId: day_id,
		itineraryId: savedItinerary.id,
		title: savedItinerary.title,
	});

	return NextResponse.json(savedItinerary);
});
