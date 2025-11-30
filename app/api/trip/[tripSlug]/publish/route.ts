import { NextRequest, NextResponse } from "next/server";
import { adminTripOperations } from "@/lib/firebase/admin-operation";
import { generateUniqueSlug, generateSlug } from "@/lib/utils/slug";
import logger from "@/lib/core/logger";
import type { Trip } from "@/lib/core/types";
import { badRequest, parseRequestBody } from "@/lib/core/error-handler";
import { tripApi } from "@/lib/api/middleware";

type PublishRequestBody = {
	slug?: string | null;
};

/**
 * DELETE: トリップ公開停止（unpublish）
 *
 * 公開中のトリップを非公開（private）に戻します。
 * 所有者のみが実行可能です。
 */
export const DELETE = tripApi(async (request: NextRequest, ctx) => {
	// ctx.auth, ctx.trip, ctx.params が保証されている（tripApi プリセットが認証・所有権チェックを実行）
	const { userId } = ctx.auth!;
	const { tripId: resolvedTripId, trip } = ctx.trip!;
	const { tripSlug } = ctx.params!;

	// 既に private の場合はエラーを返す（冪等性のため）
	if (trip.access_level === "private") {
		return badRequest("Trip is already private");
	}

	const updatePayload: Record<string, unknown> = {
		access_level: "private" as const,
	};

	await adminTripOperations.updateTrip(resolvedTripId, updatePayload);

	const updatedTrip = await adminTripOperations.getTripById(resolvedTripId);

	logger.info("Trip unpublished", {
		tripId: resolvedTripId,
		slug: trip.slug,
		isTemplate: Boolean(trip.is_template),
	});

	return NextResponse.json({
		success: true,
		trip: updatedTrip ?? { ...trip, access_level: "private" as const },
	});
});

export const POST = tripApi(async (request: NextRequest, ctx) => {
	// ctx.auth, ctx.trip, ctx.params が保証されている（tripApi プリセットが認証・所有権チェックを実行）
	const { userId } = ctx.auth!;
	const { tripId: resolvedTripId, trip } = ctx.trip!;
	const { tripSlug } = ctx.params!;

	const body = await parseRequestBody<PublishRequestBody>(request);

	const requestedSlug = body.slug?.trim();
	let finalSlug = trip.slug?.trim() || "";

	let cachedUserTrips: Trip[] | null = null;
	const getUserTrips = async () => {
		if (!cachedUserTrips) {
			cachedUserTrips = await adminTripOperations.getTripsByUserId(userId);
		}
		return cachedUserTrips;
	};

	if (requestedSlug && requestedSlug !== trip.slug) {
		// サーバー側でslug形式をバリデーション・正規化（防御的実装）
		const normalizedSlug = generateSlug(requestedSlug);
		if (normalizedSlug !== requestedSlug) {
			return badRequest("Invalid slug format");
		}

		const userTrips = await getUserTrips();
		const existingSlugs = userTrips
			.filter((existingTrip) => existingTrip.id !== resolvedTripId)
			.map((existingTrip) => existingTrip.slug)
			.filter((value): value is string => Boolean(value));

		if (existingSlugs.includes(normalizedSlug)) {
			// 409 Conflict は標準的なエラーレスポンスなので、そのまま返す
			return NextResponse.json(
				{ error: "Slug already in use" },
				{ status: 409 },
			);
		}

		finalSlug = normalizedSlug;
	}

	if (!finalSlug) {
		const userTrips = await getUserTrips();
		const existingSlugs = userTrips
			.filter((existingTrip) => existingTrip.id !== resolvedTripId)
			.map((existingTrip) => existingTrip.slug)
			.filter((value): value is string => Boolean(value));

		finalSlug = generateUniqueSlug(trip.title || "trip", existingSlugs);
	}

	const updatePayload: Record<string, unknown> = {
		access_level: "public" as const,
	};

	if (finalSlug !== trip.slug) {
		updatePayload.slug = finalSlug;
	}

	await adminTripOperations.updateTrip(resolvedTripId, updatePayload);

	const updatedTrip = await adminTripOperations.getTripById(resolvedTripId);

	logger.info("Trip published", {
		tripId: resolvedTripId,
		slugBefore: trip.slug,
		slugAfter: finalSlug,
		isTemplate: Boolean(trip.is_template),
	});

	return NextResponse.json({
		success: true,
		trip: updatedTrip ?? {
			...trip,
			slug: finalSlug,
			access_level: "public" as const,
		},
	});
});
