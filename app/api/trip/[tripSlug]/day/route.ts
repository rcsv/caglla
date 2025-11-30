import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/core/logger";
import { toDateOrNull } from "@/lib/firebase/timestamp-utils";
import {
	adminDayOperations,
	adminTripOperations,
} from "@/lib/firebase/admin-operation";
import { badRequest } from "@/lib/core/error-handler";
import { tripApi } from "@/lib/api/middleware";

export const POST = tripApi(async (request: NextRequest, ctx) => {
	// ctx.auth, ctx.trip, ctx.params が保証されている（tripApi プリセットが認証・所有権チェックを実行）
	const { userId } = ctx.auth!;
	const { tripId, trip } = ctx.trip!;
	const { tripSlug } = ctx.params!;

	// 既存の日程を取得して次のday_numberを決定
	const existingDays = await adminDayOperations.getDaysByTripId(tripId);
	const nextDayNumber =
		existingDays.length > 0
			? Math.max(...existingDays.map((d) => d.day_number)) + 1
			: 1;

	const isTemplateTrip = Boolean(trip.is_template);
	const hasStartDate = Boolean(trip.start_date);

	let newDate: Date | undefined;

	if (isTemplateTrip) {
		newDate = undefined;
	} else if (existingDays.length > 0) {
		const lastDay = existingDays.find(
			(d) =>
				d.day_number === Math.max(...existingDays.map((d) => d.day_number)),
		);
		if (lastDay?.date) {
			const lastDate = toDateOrNull(lastDay.date);
			if (!lastDate) {
				return badRequest("Invalid date for the last day");
			}
			newDate = new Date(lastDate);
			newDate.setDate(newDate.getDate() + 1);
		} else if (hasStartDate) {
			const start = toDateOrNull(trip.start_date);
			newDate = start ? new Date(start) : new Date();
		} else {
			newDate = new Date();
		}
	} else {
		if (hasStartDate) {
			const start = toDateOrNull(trip.start_date);
			newDate = start ? new Date(start) : new Date();
		} else {
			newDate = new Date();
		}
	}

	const dayPayload: {
		trip_id: string;
		day_number: number;
		date?: Date;
	} = {
		trip_id: tripId,
		day_number: nextDayNumber,
	};

	if (newDate && !isTemplateTrip) {
		dayPayload.date = newDate;
	}

	const newDay = await adminDayOperations.createDay(dayPayload);

	if (newDate && !isTemplateTrip) {
		await adminTripOperations.updateTrip(tripId, {
			end_date: newDate,
		});
	}

	return NextResponse.json(newDay);
});

export const PUT = tripApi(async (request: NextRequest, ctx) => {
	// ctx.auth, ctx.trip が保証されている
	const { tripId } = ctx.trip!;

	const body = await request.json();
	const { dayId, updates } = body;

	if (!dayId || typeof dayId !== "string") {
		return badRequest("dayId is required");
	}

	if (!updates || typeof updates !== "object") {
		return badRequest("updates is required");
	}

	// Day が指定された Trip に属していることを確認
	const day = await adminDayOperations.getDay(dayId);
	if (!day) {
		return NextResponse.json({ error: "Day not found" }, { status: 404 });
	}

	if (day.trip_id !== tripId) {
		return NextResponse.json(
			{ error: "Day does not belong to this trip" },
			{ status: 403 },
		);
	}

	// Day を更新
	const updatedDay = await adminDayOperations.updateDay(dayId, updates);

	return NextResponse.json(updatedDay);
});

export const DELETE = tripApi(async (request: NextRequest, ctx) => {
	// ctx.auth, ctx.trip が保証されている
	const { tripId } = ctx.trip!;

	const { searchParams } = new URL(request.url);
	const dayId = searchParams.get("dayId");

	if (!dayId || typeof dayId !== "string") {
		return badRequest("dayId is required");
	}

	// Day が指定された Trip に属していることを確認
	const day = await adminDayOperations.getDay(dayId);
	if (!day) {
		return NextResponse.json({ error: "Day not found" }, { status: 404 });
	}

	if (day.trip_id !== tripId) {
		return NextResponse.json(
			{ error: "Day does not belong to this trip" },
			{ status: 403 },
		);
	}

	// Day を削除（関連する itineraries も削除される）
	await adminDayOperations.deleteDay(dayId);

	return NextResponse.json({ success: true });
});
