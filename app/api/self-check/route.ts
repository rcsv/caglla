import { NextResponse } from "next/server";
import { validateServerEnvironment } from "@/lib/core/env-validation";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
	const generatedAt = new Date().toISOString();

	const environment = {
		ok: true,
		error: null as string | null,
	};

	try {
		validateServerEnvironment();
	} catch (error) {
		environment.ok = false;
		environment.error =
			error instanceof Error ? error.message : "Unknown error";
	}

	const firebase = {
		initialized: Boolean(adminAuth && adminDb),
		projectId: process.env.FIREBASE_PROJECT_ID ?? null,
	};

	const googleApis = {
		placesKeyPresent: Boolean(process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY),
		mapsKeyPresent: Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY),
	};

	const overallOk =
		environment.ok &&
		firebase.initialized &&
		googleApis.placesKeyPresent &&
		googleApis.mapsKeyPresent;

	return NextResponse.json({
		ok: overallOk,
		generatedAt,
		services: {
			environment,
			firebase,
			googleApis,
		},
	});
}
