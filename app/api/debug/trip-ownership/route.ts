import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import logger from "@/lib/core/logger";

export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;
	const tripId = searchParams.get("tripId");
	const authUid = searchParams.get("authUid");

	if (!tripId || !authUid) {
		return NextResponse.json(
			{ error: "Missing tripId or authUid" },
			{ status: 400 },
		);
	}

	try {
		const tripDoc = await adminDb.collection("trips").doc(tripId).get();

		if (!tripDoc.exists) {
			return NextResponse.json({ error: "Trip not found" }, { status: 404 });
		}

		const trip = tripDoc.data();
		const result: any = {
			tripId: tripDoc.id,
			tripUserId: trip?.user_id,
			authUid,
			directMatch: trip?.user_id === authUid,
		};

		// usersコレクションも確認
		if (trip?.user_id && trip.user_id !== authUid) {
			const userDoc = await adminDb.collection("users").doc(trip.user_id).get();
			if (userDoc.exists) {
				const user = userDoc.data();
				result.userDocId = userDoc.id;
				result.userGoogleId = user?.google_id;
				result.googleIdMatch = user?.google_id === authUid;
			} else {
				result.userDocFound = false;
			}
		}

		return NextResponse.json(result);
	} catch (error) {
		logger.error("Error checking trip ownership:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
