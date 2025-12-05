/**
 * User Follow List Summary API Routes
 *
 * Phase 1: API エンドポイントの実装（v3.1.0）
 *
 * フォロワー・フォロー中数取得API（軽量、SWR用）
 * - GET: フォロワー数・フォロー中数のみを取得
 */

import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/core/logger";
import { COLLECTIONS } from "@/lib/firebase/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { convertStandardDates } from "@/lib/firebase/timestamp-utils";
import type { User } from "@/lib/core/types";
import { notFound, handleApiError } from "@/lib/core/error-handler";

/**
 * ユーザースラッグからユーザーIDを解決します
 */
async function resolveUserIdFromSlug(
	userSlug: string,
): Promise<string | null> {
	try {
		const usersSnapshot = await adminDb
			.collection(COLLECTIONS.USERS)
			.where("slug", "==", userSlug)
			.limit(1)
			.get();

		if (usersSnapshot.empty) {
			return null;
		}

		const userDoc = usersSnapshot.docs[0];
		const userData = convertStandardDates({
			id: userDoc.id,
			...userDoc.data(),
		}) as User;

		// google_id または auth_uid または document ID を返す
		return userData.google_id || userData.auth_uid || userDoc.id;
	} catch (error) {
		logger.error("Failed to resolve userId from slug", error);
		return null;
	}
}

/**
 * フォロワー数またはフォロー中数を取得（count専用クエリ）
 */
async function getFollowCount(
	userId: string,
	type: "followers" | "following",
): Promise<number> {
	try {
		const field = type === "followers" ? "following_id" : "follower_id";
		const snapshot = await adminDb
			.collection(COLLECTIONS.USER_FOLLOWS)
			.where(field, "==", userId)
			.count()
			.get();

		return snapshot.data().count;
	} catch (error) {
		logger.error(`Failed to get ${type} count`, error);
		return 0;
	}
}

/**
 * GET /api/users/[userSlug]/follow-list-summary
 * フォロワー数・フォロー中数のみを取得（軽量、SWR用）
 */
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ userSlug: string }> },
) {
	try {
		const { userSlug } = await params;

		// ユーザースラッグからユーザーIDを解決
		const userId = await resolveUserIdFromSlug(userSlug);
		if (!userId) {
			return notFound("User");
		}

		// フォロワー数とフォロー中数を並列取得
		const [followersCount, followingCount] = await Promise.all([
			getFollowCount(userId, "followers"),
			getFollowCount(userId, "following"),
		]);

		return NextResponse.json({
			followersCount,
			followingCount,
		});
	} catch (error: unknown) {
		return handleApiError(
			error instanceof Error ? error : new Error(String(error)),
			`/api/users/[userSlug]/follow-list-summary`,
		);
	}
}
