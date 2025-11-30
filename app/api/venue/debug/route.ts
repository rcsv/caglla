import { NextResponse } from "next/server";

/**
 * Venue API環境変数デバッグエンドポイント
 * GET /api/venue/debug
 */
export async function GET() {
	const tripAdvisorKey = process.env.TRIPADVISOR_API_KEY;
	const foursquareKey = process.env.FOURSQUARE_API_KEY;

	return NextResponse.json({
		environment: process.env.NODE_ENV,
		apiKeys: {
			tripAdvisor: {
				configured: !!tripAdvisorKey,
				length: tripAdvisorKey?.length || 0,
				prefix: tripAdvisorKey?.substring(0, 8) || "N/A",
				hasWhitespace: tripAdvisorKey ? /\s/.test(tripAdvisorKey) : false,
			},
			foursquare: {
				configured: !!foursquareKey,
				length: foursquareKey?.length || 0,
				prefix: foursquareKey?.substring(0, 8) || "N/A",
				hasWhitespace: foursquareKey ? /\s/.test(foursquareKey) : false,
			},
		},
		envFile: {
			expectedLocation: ".env.local (in project root)",
			nodeEnv: process.env.NODE_ENV,
			availableEnvVars: Object.keys(process.env).filter(
				(key) => key.includes("TRIPADVISOR") || key.includes("FOURSQUARE"),
			),
		},
	});
}
