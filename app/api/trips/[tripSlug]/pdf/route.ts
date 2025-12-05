/**
 * PDF Export API
 * SelectPdf REST APIを使用してトリップ旅程をPDFとして生成
 *
 * Authentication: Bearer token required
 * Authorization: Trip owner only
 * Plan Requirements: Backpacker以上
 */

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/firestore";
import type { Trip, Day, Itinerary, User } from "@/lib/core/types";
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
import { getUserLanguage, DEFAULT_LANGUAGE } from "@/lib/utils/language";

interface SelectPdfErrorResponse {
	error: string;
	status: number;
}

// TripPdfData型はmagazine-pdf-templateからインポート

/**
 * SelectPdf APIへのリクエストを実行
 */
async function callSelectPdfApi(params: {
	key: string;
	url?: string;
	html?: string;
	base_url?: string;
	page_numbers?: boolean;
	page_numbers_template?: string;
	page_numbers_font_size?: number;
	page_numbers_font_color?: string;
	page_numbers_position?: string;
	page_numbers_alignment?: string;
}): Promise<Response> {
	const response = await fetch("https://selectpdf.com/api2/convert/", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(params),
	});

	return response;
}

/**
 * トリップデータをHTMLに変換（旅行雑誌風PDF用）
 */
async function generatePdfHtml(
	data: TripPdfData,
	tripUrl?: string,
	language?: string,
): Promise<string> {
	return await generateMagazinePdfHtml(data, tripUrl, language);
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
	logger.debug("PDF API: trip data retrieved", {
		tripUserId: trip.user_id,
		authUserId: userId,
	});

	if (trip.user_id !== userId) {
		logger.error("PDF API: trip ownership check failed", {
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

	logger.debug("PDF API: days collection query result", {
		tripId: trip.id,
		daysCount: daysSnapshot.size,
		dayIds: daysSnapshot.docs.map((doc: any) => doc.id),
	});

	const days = daysSnapshot.docs.map((doc: any) => ({
		id: doc.id,
		...doc.data(),
	})) as Day[];

	return { trip, days };
}

/**
 * プラン制限のチェック
 */
async function checkPlanRestrictions(
	userId: string,
): Promise<NextResponse | null> {
	logger.debug("PDF API: checking plan restrictions", { userId });

	// google_idフィールドでユーザーを検索
	const userQuery = await adminDb
		.collection("users")
		.where("google_id", "==", userId)
		.limit(1)
		.get();
	logger.debug("PDF API: user query result", {
		exists: !userQuery.empty,
		size: userQuery.size,
	});

	if (userQuery.empty) {
		logger.error("PDF API: user document not found by google_id", { userId });
		return notFound("User");
	}

	const userDoc = userQuery.docs[0];
	const userData = userDoc.data();
	logger.debug("PDF API: user data retrieved", { userData });

	const userPlan = userData?.planId || "season_traveler";
	logger.debug("PDF API: user plan determined", { userPlan });

	// PDF Export は Backpacker 以上のプランが必要
	if (userPlan === "season_traveler") {
		logger.error("PDF API: plan restriction failed - season_traveler plan", {
			userPlan,
		});
		return NextResponse.json(
			{
				error: "Upgrade Required",
				message: "PDF Export requires Backpacker plan or higher",
			},
			{ status: 403 },
		);
	}

	logger.debug("PDF API: plan restriction check passed", { userPlan });
	return null;
}

/**
 * 全旅程データを取得
 */
async function fetchTripData(trip: Trip, days: Day[]): Promise<{
	data: TripPdfData;
	language: string;
}> {
	const itinerariesByDay: Record<string, Itinerary[]> = {};
	logger.debug("PDF API: fetching trip data", {
		tripId: trip.id,
		daysCount: days.length,
	});

	let enrichedTrip = trip;

	// creator 情報を取得（trip.user_id から users コレクションを取得）
	let creator: User | null = null;
	let language = DEFAULT_LANGUAGE;
	if (trip.user_id) {
		try {
			const userDoc = await adminDb
				.collection(COLLECTIONS.USERS)
				.doc(trip.user_id)
				.get();
			if (userDoc.exists) {
				creator = {
					id: userDoc.id,
					...userDoc.data(),
				} as User;
				enrichedTrip = {
					...enrichedTrip,
					creator_name: creator.name,
					creator,
				} as Trip & { creator_name?: string; creator?: User };
				// ユーザーの言語設定を取得
				language = getUserLanguage(creator) || DEFAULT_LANGUAGE;
				logger.debug("PDF API: creator resolved", {
					userId: trip.user_id,
					creatorName: creator.name,
					language,
				});
			}
		} catch (error) {
			logger.error("PDF API: Error fetching creator", error, {
				tripId: trip.id,
				userId: trip.user_id,
			});
		}
	}

	// destination_place を解決（places_cache から取得）
	// ユーザーの言語設定を使用
	if (trip.destination_place_id && !(enrichedTrip as any).destination_place) {
		try {
			const { resolveDestinationPlace } = await import("@/lib/api/places-cache");
			// ユーザードキュメントから言語設定を取得
			const locale = creator
				? getUserLanguage(creator) || DEFAULT_LANGUAGE
				: DEFAULT_LANGUAGE;
			const destinationPlace = await resolveDestinationPlace(
				trip.destination_place_id,
				locale,
			);
			if (destinationPlace) {
				enrichedTrip = {
					...enrichedTrip,
					destination_place: destinationPlace,
				} as Trip & { destination_place?: any };
				logger.debug("PDF API: destination_place resolved", {
					place_id: destinationPlace.place_id,
					hasGeometry: !!destinationPlace.geometry?.location,
					language: locale,
				});
			}
		} catch (error) {
			logger.error("PDF API: Error resolving destination_place", error, {
				tripId: trip.id,
			});
		}
	}

	// 各日程の旅程アイテムを取得（独立したコレクションから）
	for (const day of days) {
		logger.debug("PDF API: fetching itineraries for day", {
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

		logger.debug("PDF API: itineraries found for day", {
			dayId: day.id,
			itinerariesCount: itineraries.length,
			itineraryNames: itineraries.map((i) => i.title || "No name"),
			sampleItinerary: itineraries[0], // 最初の旅程アイテムの構造を確認
		});

		itinerariesByDay[day.id] = itineraries;
	}

	logger.debug("PDF API: trip data fetch completed", {
		totalDays: days.length,
		totalItineraries: Object.values(itinerariesByDay).flat().length,
	});

	return {
		data: { trip: enrichedTrip, days, itinerariesByDay },
		language,
	};
}

/**
 * GET /api/trips/[tripSlug]/pdf
 * トリップをPDFとしてエクスポート
 */
export const GET = tripApi(async (request: NextRequest, ctx) => {
	// ctx.auth, ctx.trip, ctx.params が保証されている（tripApi プリセットが認証・所有権チェックを実行）
	const { userId } = ctx.auth!;
	const { tripId: resolvedTripId, trip } = ctx.trip!;
	const { tripSlug } = ctx.params!;

	logger.debug("PDF API: request received", { tripSlug });
	logger.debug("PDF API: authentication successful", { userId });

	// 2. プラン制限チェック
	const planError = await checkPlanRestrictions(userId);
	if (planError) {
		logger.error("PDF API: plan restriction check failed");
		return planError;
	}
	logger.debug("PDF API: plan restriction check passed");

	// Days を取得（tripApi は days を返さないため、別途取得が必要）
	const days = await adminDayOperations.getDaysByTripId(resolvedTripId);
	logger.debug("PDF API: ownership validated", {
		tripId: trip.id,
		tripUserId: (trip as any).user_id,
		userId,
		dayCount: days.length,
		tripTitle: trip.title,
		tripHasTitle: "title" in trip,
		tripKeys: Object.keys(trip).slice(0, 10), // 最初の10個のキーだけ表示
	});

	// 5. SelectPdf APIキーの確認
	const apiKey = process.env.SELECTPDF_API_KEY;
	if (!apiKey) {
		logger.error("SELECTPDF_API_KEY is not configured", {
			hasApiKey: !!apiKey,
			envKeys: Object.keys(process.env).filter((k) =>
				k.includes("PDF") || k.includes("SELECT"),
			),
		});
		return NextResponse.json(
			{
				error: "PDF export service is not configured",
				message:
					"SELECTPDF_API_KEY environment variable is not set. Please configure the API key to enable PDF export.",
			},
			{ status: 503 },
		);
	}

	// 6. トリップデータの取得
	// デバッグ: trip オブジェクトの構造を確認
	logger.debug("PDF API: trip object before fetchTripData", {
		tripId: trip.id,
		tripTitle: trip.title,
		tripKeys: Object.keys(trip),
		tripHasTitle: "title" in trip,
		tripTitleType: typeof trip.title,
		tripTitleValue: trip.title,
	});
	const tripDataResult = await fetchTripData(trip, days);
	logger.debug("PDF API: tripData after fetchTripData", {
		tripDataTripTitle: tripDataResult.data.trip.title,
		tripDataTripKeys: Object.keys(tripDataResult.data.trip),
		language: tripDataResult.language,
	});

	// トリップURLの生成
	const tripUrl = generateTripUrl((trip as any).user_slug, tripSlug);

	// 7. HTMLの生成
	const html = await generatePdfHtml(tripDataResult.data, tripUrl, tripDataResult.language);
	logger.debug("PDF API: HTML content generated", {
		htmlLength: html.length,
		htmlPreview: html.substring(0, 500) + "...",
	});

	// 8. SelectPdf APIへのリクエスト
	const apiResponse = await callSelectPdfApi({
		key: apiKey,
		html,
		base_url: generateTripUrl((trip as any).user_slug, tripSlug).replace(
			`/${(trip as any).user_slug}/${tripSlug}`,
			"",
		),
		page_numbers: false, // ページ番号を無効化
		page_numbers_template: "", // ページ番号テンプレートを空に
		page_numbers_font_size: 0, // フォントサイズを0に
		page_numbers_font_color: "transparent", // 透明色に設定
		page_numbers_position: "none", // 位置を無効化
		page_numbers_alignment: "none", // 配置を無効化
	});

	// 9. エラーハンドリング
	if (!apiResponse.ok) {
		const errorText = await apiResponse.text();
		logger.error("SelectPdf API error:", {
			status: apiResponse.status,
			error: errorText,
		});

		return NextResponse.json(
			{
				error: "PDF generation failed",
				details: errorText,
			},
			{ status: apiResponse.status },
		);
	}

	// 10. PDF返却
	const pdfBuffer = Buffer.from(await apiResponse.arrayBuffer());
	const filename = `${trip.slug || trip.id}_itinerary.pdf`;

	return new NextResponse(pdfBuffer, {
		status: 200,
		headers: {
			"Content-Type": "application/pdf",
			"Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
			"Content-Length": String(pdfBuffer.length),
			"Cache-Control": "no-cache",
		},
	});
});
