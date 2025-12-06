import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { checklistGenerator } from "@/lib/checklist-generator";
import logger from "@/lib/core/logger";
import {
	PlacesCache,
	Trip,
	Day,
	Itinerary,
	ChecklistItem,
} from "@/lib/core/types";
import { COLLECTIONS } from "@/lib/firebase/firestore";
import {
	adminTripOperations,
	adminUserOperations,
} from "@/lib/firebase/admin-operation";
import { toDateOrNull } from "@/lib/firebase/timestamp-utils";
import { notFound } from "@/lib/core/error-handler";
import { authApi } from "@/lib/api/middleware";

export const POST = authApi(async (request: NextRequest, ctx) => {
	// ctx.auth, ctx.params が保証されている（authApi プリセットが認証チェックを実行）
	const { tripSlug } = ctx.params!;
	const { userId: googleId } = ctx.auth!;

	// ユーザー情報取得（auth_uid で検索、後方互換性のため google_id もチェック）
	// Phase 1-1.5: 認証プロバイダーマルチ対応化
	const user = await adminUserOperations.getUserByAuthUid(googleId);
	if (!user) {
		return notFound("User");
	}

	// ユーザーの居住国コードを place_cache から解決（home_place_id 優先）
	if (user.preferences?.home_place_id && !user.preferences.home_country_code) {
		try {
			const cacheDoc = await adminDb
				.collection(COLLECTIONS.PLACES_CACHE)
				.doc(user.preferences.home_place_id)
				.get();
			if (cacheDoc.exists) {
				const place = cacheDoc.data() as PlacesCache;
				const countryComponent = place.address_components?.find((c) =>
					c.types.includes("country"),
				);
				if (countryComponent?.short_name) {
					user.preferences.home_country_code = countryComponent.short_name;
				}
				// 住所名の補完
				if (!user.preferences.home_address) {
					user.preferences.home_address = place.name || place.formatted_address;
				}
			}
		} catch (e) {
			logger.warn("Failed to resolve user home country from place cache", e);
		}
	}

	// tripSlugからtripIdとtripを解決
	const resolved = await adminTripOperations.resolveTripByIdOrSlug(tripSlug);
	if (!resolved) {
		return notFound("Trip");
	}
	const { id: tripId, trip: tripData } = resolved;

	// Daysを取得
	const daysSnapshot = await adminDb
		.collection(COLLECTIONS.DAYS)
		.where("trip_id", "==", tripId)
		.orderBy("day_number", "asc")
		.get();

	// 各DayにItinerariesを紐付け
	const days: Day[] = [];
	for (const dayDoc of daysSnapshot.docs) {
		const dayData = dayDoc.data();
		const dayId = dayDoc.id;

		// 各DayのItinerariesを取得（day_idでクエリ）
		const itinerariesSnapshot = await adminDb
			.collection(COLLECTIONS.ITINERARIES)
			.where("day_id", "==", dayId)
			.orderBy("sort_number", "asc")
			.get();

		const itineraries: Itinerary[] = itinerariesSnapshot.docs.map((doc) => {
			const data = doc.data();
			return {
				id: doc.id,
				...data,
				start_time: data.start_time || null,
				end_time: data.end_time || null,
				created_at: toDateOrNull(data.created_at) || data.created_at,
				updated_at: toDateOrNull(data.updated_at) || data.updated_at,
			} as Itinerary;
		});

		logger.debug("Fetched itineraries for day", {
			dayId,
			count: itineraries.length,
		});

		days.push({
			id: dayId,
			...dayData,
			date: toDateOrNull(dayData.date) || dayData.date,
			created_at: toDateOrNull(dayData.created_at) || dayData.created_at,
			updated_at: toDateOrNull(dayData.updated_at) || dayData.updated_at,
			itineraries,
		} as Day);
	}

	// Tripオブジェクトを構築
	const trip: Trip = {
		...tripData,
		days,
	};

	logger.debug("Checklist Generate API: Trip data prepared", {
		tripId,
		daysCount: trip.days?.length || 0,
		totalItineraries:
			trip.days?.reduce(
				(sum, day) => sum + (day.itineraries?.length || 0),
				0,
			) || 0,
		itinerariesWithActivityTag:
			trip.days?.flatMap(
				(day) => day.itineraries?.filter((it) => it.activity_tag) || [],
			).length || 0,
	});

	// 既存のチェックリストを取得
	const checklistRef = adminDb
		.collection(COLLECTIONS.TRIP_CHECKLISTS)
		.doc(tripId);
	const existingChecklistDoc = await checklistRef.get();
	const existingItems: ChecklistItem[] = existingChecklistDoc.exists
		? (existingChecklistDoc.data()?.items || [])
		: [];

	// カスタムアイテムを分離（保持する）
	const customItems = existingItems.filter((item) => item.isCustom === true);

	// 既存の自動生成アイテムをマップ化（キー: `${title}_${generatedFrom || ''}`）
	const existingItemsMap = new Map<string, ChecklistItem>();
	existingItems
		.filter((item) => !item.isCustom)
		.forEach((item) => {
			const key = `${item.title}_${item.generatedFrom || ""}`;
			existingItemsMap.set(key, item);
		});

	// チェックリスト生成（ユーザー情報も渡す）
	const newItems = await checklistGenerator.generateTripChecklist(trip, user);

	logger.debug("Checklist Generate API: Generated items", {
		newItemsCount: newItems.length,
		existingItemsCount: existingItems.length,
		customItemsCount: customItems.length,
		itemsByCategory: newItems.reduce(
			(acc, item) => {
				acc[item.category] = (acc[item.category] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>,
		),
	});

	// 新しい生成アイテムと既存アイテムをマージ（doneとuserMemoを保持）
	const mergedItems = newItems.map((newItem) => {
		const key = `${newItem.title}_${newItem.generatedFrom || ""}`;
		const existingItem = existingItemsMap.get(key);

		if (existingItem) {
			// 既存アイテムが見つかった場合、doneとuserMemoを保持
			// longDescriptionは新しく生成されたものがあれば優先、なければ既存のものを保持
			return {
				...newItem,
				id: existingItem.id, // 既存のIDを保持
				done: existingItem.done, // 完了状態を保持
				userMemo: existingItem.userMemo, // ユーザーメモを保持
				longDescription: newItem.longDescription || existingItem.longDescription, // 新しく生成されたlongDescriptionを優先
			};
		}
		// 新規アイテムの場合はそのまま
		return newItem;
	});

	// カスタムアイテムとマージされたアイテムを結合
	const finalItems = [...mergedItems, ...customItems];

	// undefinedフィールドを除外してFirestoreに保存
	const sanitizedItems = finalItems.map((item) => {
		const sanitized: any = { ...item };
		// undefinedのフィールドを削除（longDescriptionは空文字列でも保持）
		Object.keys(sanitized).forEach((key) => {
			if (sanitized[key] === undefined) {
				delete sanitized[key];
			}
		});
		return sanitized;
	});

	// デバッグ: longDescriptionが含まれているアイテムをログ出力
	const itemsWithLongDesc = sanitizedItems.filter(
		(item) => item.longDescription && item.longDescription.length > 0,
	);
	logger.debug("Checklist Generate API: Items with longDescription", {
		count: itemsWithLongDesc.length,
		titles: itemsWithLongDesc.map((item) => ({
			title: item.title,
			length: item.longDescription?.length || 0,
		})),
	});

	// 保存: trip_checklists/{tripId}
	await checklistRef.set(
		{
			id: tripId,
			trip_id: tripId,
			items: sanitizedItems,
			last_generated_at: new Date(),
			created_at: existingChecklistDoc.exists
				? existingChecklistDoc.data()?.created_at || new Date()
				: new Date(),
			updated_at: new Date(),
		},
		{ merge: true },
	);

	// Trip.stats.checklists を items.length に同期
	try {
		const tripRef = adminDb.collection(COLLECTIONS.TRIPS).doc(tripId);
		await tripRef.update({
			"stats.checklists": sanitizedItems.length,
		} as any);
	} catch (e) {
		logger.warn("Failed to update trip.stats.checklists after generate", {
			tripId,
			error: e,
		});
	}

	return NextResponse.json({ success: true, items: sanitizedItems });
});
