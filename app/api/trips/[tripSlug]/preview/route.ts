/**
 * HTML Preview API
 * トリップ旅程をHTMLとしてプレビュー表示
 * PDFデザイン開発用のコスト削減機能
 *
 * Authentication: Bearer token required
 * Authorization: Trip owner only
 * Plan Requirements: None (プレビューは無料)
 */

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/firestore";
import type { Trip, Day, Itinerary, User, ChecklistItem } from "@/lib/core/types";
import { toDateOrNull } from "@/lib/firebase/timestamp-utils";
import {
	generateMagazinePdfHtml,
	type TripPdfData,
} from "@/lib/utils/magazine-pdf-template";
import { generateTripUrl } from "@/lib/utils/app-url";
import logger from "@/lib/core/logger";
import { notFound } from "@/lib/core/error-handler";
import { tripApi } from "@/lib/api/middleware";
import { adminDayOperations } from "@/lib/firebase/admin-operation";

// TripPdfData型はmagazine-pdf-templateからインポート

/**
 * トリップデータをHTMLに変換（プレビュー用）
 */
async function generatePreviewHtml(
	data: TripPdfData,
	tripUrl?: string,
): Promise<string> {
	// プレビュー用の追加スタイルを追加
	const previewStyles = `
    <style>
      body { 
        background: #f8f9fa;
      }
      .preview-header {
        background: #2563eb;
        color: white;
        padding: 20px;
        margin: -20px -20px 30px -20px;
        text-align: center;
        font-size: 14pt;
        font-weight: bold;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 1000;
      }
      .preview-controls {
        background: white;
        border: 2px solid #2563eb;
        border-radius: 8px;
        padding: 15px;
        margin: 60px 0 30px 0;
        text-align: center;
        position: sticky;
        top: 60px;
        z-index: 999;
      }
      .preview-controls button {
        background: #2563eb;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 5px;
        cursor: pointer;
        margin: 0 10px;
        font-size: 12pt;
      }
      .preview-controls button:hover {
        background: #1d4ed8;
      }
      .preview-controls .info {
        color: #666;
        font-size: 10pt;
        margin-top: 10px;
      }
      .page {
        margin-bottom: 20px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        border-radius: 8px;
        overflow: hidden;
      }
      @media print {
        body { background: white; }
        .preview-header, .preview-controls { display: none; }
        .page { box-shadow: none; margin-bottom: 0; }
      }
    </style>
  `;

	const html = await generateMagazinePdfHtml(data, tripUrl);

	// プレビューヘッダーとコントロールを追加
	const previewHeader = `
    <div class="preview-header">
      📄 PDFデザインプレビュー - 旅行雑誌風デザイン
    </div>
  `;

	const previewControls = `
    <div class="preview-controls">
      <button onclick="window.print()">🖨️ 印刷プレビュー</button>
      <button onclick="window.location.reload()">🔄 リロード</button>
      <button onclick="window.close()">❌ 閉じる</button>
      <div class="info">
        💡 このプレビューは旅行雑誌風PDFと同じデザインです。印刷プレビューでPDF出力時の見た目を確認できます。
      </div>
    </div>
  `;

	// HTMLにプレビュー要素を挿入
	return html
		.replace("<head>", `<head>${previewStyles}`)
		.replace("<body>", `<body>${previewHeader}${previewControls}`);
}

/**
 * トリップの所有権確認とデータ取得
 */
async function validateTripOwnership(
	tripId: string,
	userId: string,
): Promise<{ trip: Trip; days: Day[] } | NextResponse> {
	const tripRef = adminDb.collection("trips").doc(tripId);
	const tripDoc = await tripRef.get();

	if (!tripDoc.exists) {
		return notFound("Trip");
	}

	const trip = { id: tripDoc.id, ...tripDoc.data() } as Trip;
	logger.debug("Preview API: trip data retrieved", {
		tripUserId: trip.user_id,
		authUserId: userId,
	});

	if (trip.user_id !== userId) {
		logger.error("Preview API: trip ownership check failed", {
			tripUserId: trip.user_id,
			authUserId: userId,
		});
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	// 日程データを取得（独立したコレクションから）
	const daysSnapshot = await adminDb
		.collection("days")
		.where("trip_id", "==", trip.id)
		.orderBy("day_number", "asc")
		.get();

	logger.debug("Preview API: days collection query result", {
		tripId: trip.id,
		daysCount: daysSnapshot.size,
		dayIds: daysSnapshot.docs.map((doc) => doc.id),
	});

	const days = daysSnapshot.docs.map((doc: any) => ({
		id: doc.id,
		...doc.data(),
	})) as Day[];

	return { trip, days };
}

/**
 * 全旅程データを取得
 */
async function fetchTripData(
	trip: Trip,
	days: Day[],
): Promise<TripPdfData> {
	const itinerariesByDay: Record<string, Itinerary[]> = {};
	logger.debug("Preview API: fetching trip data", {
		tripId: trip.id,
		daysCount: days.length,
	});

	// destination_place を解決（places_cache から取得）
	let enrichedTrip = trip;
	if (trip.destination_place_id && !(trip as any).destination_place) {
		try {
			const { resolveDestinationPlace } = await import("@/lib/api/places-cache");
			const destinationPlace = await resolveDestinationPlace(
				trip.destination_place_id,
				"en", // デフォルト言語として 'en' を使用
			);
			if (destinationPlace) {
				enrichedTrip = {
					...trip,
					destination_place: destinationPlace,
				} as Trip & { destination_place?: any };
				logger.debug("Preview API: destination_place resolved", {
					place_id: destinationPlace.place_id,
					hasGeometry: !!destinationPlace.geometry?.location,
				});
			}
		} catch (error) {
			logger.error("Preview API: Error resolving destination_place", error, {
				tripId: trip.id,
			});
		}
	}

	// creator 情報を取得（trip.user_id から users コレクションを取得）
	if (!(enrichedTrip as any).creator && trip.user_id) {
		try {
			const userDoc = await adminDb
				.collection(COLLECTIONS.USERS)
				.doc(trip.user_id)
				.get();
			if (userDoc.exists) {
				const creator = {
					id: userDoc.id,
					...userDoc.data(),
				} as User;
				enrichedTrip = {
					...enrichedTrip,
					creator_name: creator.name,
					creator,
				} as Trip & { creator_name?: string; creator?: User };
				logger.debug("Preview API: creator resolved", {
					userId: trip.user_id,
					creatorName: creator.name,
				});
			}
		} catch (error) {
			logger.error("Preview API: Error fetching creator", error, {
				tripId: trip.id,
				userId: trip.user_id,
			});
		}
	}

	// 各日程の旅程アイテムを取得（独立したコレクションから）
	for (const day of days) {
		logger.debug("Preview API: fetching itineraries for day", {
			dayId: day.id,
			dayDate: day.date,
		});

		const itinerariesSnapshot = await adminDb
			.collection("itineraries")
			.where("day_id", "==", day.id)
			.orderBy("sort_number", "asc")
			.get();

		const itineraries = itinerariesSnapshot.docs.map((doc: any) => ({
			id: doc.id,
			...doc.data(),
		})) as Itinerary[];

		logger.debug("Preview API: itineraries found for day", {
			dayId: day.id,
			itinerariesCount: itineraries.length,
			itineraryNames: itineraries.map((i) => i.title || "No name"),
			sampleItinerary: itineraries[0], // 最初の旅程アイテムの構造を確認
		});

		itinerariesByDay[day.id] = itineraries;
	}

	// チェックリストデータを取得
	let checklist: ChecklistItem[] = [];
	try {
		const checklistDoc = await adminDb
			.collection(COLLECTIONS.TRIP_CHECKLISTS)
			.doc(trip.id)
			.get();
		if (checklistDoc.exists) {
			const checklistData = checklistDoc.data();
			checklist = (checklistData?.items || []) as ChecklistItem[];
			logger.debug("Preview API: checklist retrieved", {
				tripId: trip.id,
				itemsCount: checklist.length,
			});
		} else {
			logger.debug("Preview API: no checklist found", { tripId: trip.id });
		}
	} catch (error) {
		logger.error("Preview API: Error fetching checklist", error, {
			tripId: trip.id,
		});
	}

	logger.debug("Preview API: trip data fetch completed", {
		totalDays: days.length,
		totalItineraries: Object.values(itinerariesByDay).flat().length,
		checklistItemsCount: checklist.length,
	});

	return { trip: enrichedTrip, days, itinerariesByDay, checklist };
}

/**
 * GET /api/trips/[tripSlug]/preview
 * トリップをHTMLとしてプレビュー表示
 */
export const GET = tripApi(async (request: NextRequest, ctx) => {
	// ctx.auth, ctx.trip, ctx.params が保証されている（tripApi プリセットが認証・所有権チェックを実行）
	const { userId } = ctx.auth!;
	const { tripId: resolvedTripId, trip } = ctx.trip!;
	const { tripSlug } = ctx.params!;

	logger.debug("Preview API: request received", { tripSlug });
	logger.debug("Preview API: authentication successful", { userId });

	// Days を取得（tripApi は days を返さないため、別途取得が必要）
	const days = await adminDayOperations.getDaysByTripId(resolvedTripId);
	logger.debug("Preview API: ownership validated", {
		tripId: trip.id,
		tripUserId: (trip as any).user_id,
		userId,
		dayCount: days.length,
		tripTitle: trip.title,
		tripHasTitle: "title" in trip,
		tripTitleType: typeof trip.title,
		tripTitleValue: trip.title,
		tripKeys: Object.keys(trip).slice(0, 15), // 最初の15個のキーを表示
	});

	// 4. トリップデータの取得
	const tripData = await fetchTripData(trip, days);

	// トリップURLの生成
	const tripUrl = generateTripUrl((trip as any).user_slug, tripSlug);

	// 5. HTMLの生成
	const html = await generatePreviewHtml(tripData, tripUrl);
	logger.debug("Preview API: HTML content generated", {
		htmlLength: html.length,
		htmlPreview: html.substring(0, 500) + "...",
	});

	// 6. HTML返却
	return new NextResponse(html, {
		status: 200,
		headers: {
			"Content-Type": "text/html; charset=utf-8",
			"Cache-Control": "no-cache",
		},
	});
});
