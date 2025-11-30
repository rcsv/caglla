/**
 * Public Feed API Route
 *
 * Phase 1-3-4: API Routes実装（v3.0.0）
 *
 * 公開トリップのフィードを取得します。
 * - GET: 公開フィード取得（created_atでソート、降順）
 */

import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/core/logger";
import { getPublicFeed } from "@/lib/travel/feed";
import { getTestFirestore } from "@/lib/__tests__/helpers/test-firestore";
import type { Firestore } from "firebase-admin/firestore";

/**
 * Firestoreインスタンスを取得します（テスト環境ではエミュレータを使用）
 */
function getFirestore(): Firestore | undefined {
	if (process.env.FIRESTORE_EMULATOR_HOST) {
		return getTestFirestore();
	}
	// 本番環境では、Social Operations内でadminDbを使用
	return undefined;
}

/**
 * GET /api/feed/public
 * 公開トリップのフィードを取得します
 */
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const limitParam = searchParams.get("limit");
		const cursor = searchParams.get("cursor") || undefined;

		const limit = limitParam ? parseInt(limitParam, 10) : 20;

		if (isNaN(limit) || limit < 1 || limit > 100) {
			return NextResponse.json(
				{ error: "Invalid limit parameter (1-100)" },
				{ status: 400 },
			);
		}

		const db = getFirestore();

		const result = await getPublicFeed(limit, cursor, db);

		return NextResponse.json(result);
	} catch (error: unknown) {
		logger.error("Failed to fetch public feed", error);

		return NextResponse.json(
			{ error: "Failed to fetch public feed" },
			{ status: 500 },
		);
	}
}
