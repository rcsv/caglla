/**
 * Comment Likes API Routes
 *
 * コメントへのいいね機能のAPIエンドポイントを提供します。
 * - GET: いいね状態取得
 * - POST: いいね追加/削除（toggle）
 * - DELETE: いいね削除
 */

import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/core/logger";
import {
	toggleCommentLike,
	getCommentLikeState,
} from "@/lib/social/comment-likes";
import { getTestFirestore } from "@/lib/__tests__/helpers/test-firestore";
import type { Firestore } from "firebase-admin/firestore";
import {
	unauthorized,
	notFound,
	handleApiError,
} from "@/lib/core/error-handler";
import { adminDb } from "@/lib/firebase/admin";

/**
 * adminAuthをlazy importします（テスト環境でも動作するように）
 */
async function getAdminAuth() {
	try {
		const adminModule = await import("@/lib/firebase/admin");
		return adminModule.adminAuth;
	} catch (error) {
		throw new Error("Firebase Admin SDK is not available");
	}
}

/**
 * モックトークンからユーザーIDを抽出（テスト環境用）
 */
function extractUserIdFromMockToken(token: string): string | null {
	if (token.startsWith("mock-token-")) {
		return token.replace("mock-token-", "");
	}
	return null;
}

/**
 * リクエストからユーザーIDを取得します（テスト環境ではモックトークンを処理）
 */
async function resolveAuthUserId(request: NextRequest): Promise<string | null> {
	const authHeader = request.headers.get("authorization");
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return null;
	}

	const idToken = authHeader.split("Bearer ")[1];
	if (!idToken) return null;

	// テスト環境ではモックトークンを処理
	if (process.env.FIRESTORE_EMULATOR_HOST) {
		const mockUserId = extractUserIdFromMockToken(idToken);
		if (mockUserId) {
			return mockUserId;
		}
	}

	try {
		const adminAuth = await getAdminAuth();
		const decoded = await adminAuth.verifyIdToken(idToken);
		return decoded.uid;
	} catch (error) {
		logger.warn("Failed to verify ID token for comment likes endpoint", error);
		return null;
	}
}

/**
 * Firestoreインスタンスを取得します（テスト環境ではエミュレータを使用）
 */
function getFirestore(): Firestore {
	if (process.env.FIRESTORE_EMULATOR_HOST) {
		return getTestFirestore();
	}
	// 本番環境では、adminDbを直接使用
	if (!adminDb) {
		throw new Error("Firebase Admin SDK is not available");
	}
	return adminDb;
}

/**
 * GET /api/trip/[tripSlug]/comments/[commentId]/likes
 * コメントへのいいね状態を取得します
 */
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ tripSlug: string; commentId: string }> },
) {
	try {
		const userId = await resolveAuthUserId(request);
		if (!userId) {
			return unauthorized("Authorization header required");
		}

		const { commentId } = await params;
		const db = getFirestore();

		const state = await getCommentLikeState(userId, commentId, db);

		return NextResponse.json(state);
	} catch (error: unknown) {
		if (error instanceof Error) {
			if (error.message.includes("Comment not found")) {
				return notFound("Comment");
			}
		}

		return handleApiError(
			error instanceof Error ? error : new Error(String(error)),
			`/api/trip/[tripSlug]/comments/[commentId]/likes`,
		);
	}
}

/**
 * POST /api/trip/[tripSlug]/comments/[commentId]/likes
 * コメントへのいいねをトグルします（追加/削除）
 */
export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ tripSlug: string; commentId: string }> },
) {
	try {
		const userId = await resolveAuthUserId(request);
		if (!userId) {
			return unauthorized("Authorization header required");
		}

		const { commentId } = await params;
		const db = getFirestore();

		// リクエストボディからactionを取得（オプション、デフォルトは'toggle'）
		let action: "like" | "unlike" | "toggle" = "toggle";
		try {
			const body = await request.json().catch(() => ({}));
			if (body.action && ["like", "unlike", "toggle"].includes(body.action)) {
				action = body.action;
			}
		} catch {
			// ボディが空の場合はデフォルトの'toggle'を使用
		}

		const result = await toggleCommentLike(userId, commentId, action, db);

		return NextResponse.json(result);
	} catch (error: unknown) {
		if (error instanceof Error) {
			if (error.message.includes("Comment not found")) {
				return notFound("Comment");
			}
			if (error.message.includes("Cannot like your own comment")) {
				return NextResponse.json(
					{ error: "Cannot like your own comment" },
					{ status: 403 },
				);
			}
			if (error.message.includes("Cannot like deleted comment")) {
				return NextResponse.json(
					{ error: "Cannot like deleted comment" },
					{ status: 400 },
				);
			}
			if (error.message.includes("Comment is already liked")) {
				return NextResponse.json(
					{ error: "Comment is already liked" },
					{ status: 409 },
				);
			}
			if (error.message.includes("Comment is not liked")) {
				return NextResponse.json(
					{ error: "Comment is not liked" },
					{ status: 409 },
				);
			}
		}

		return handleApiError(
			error instanceof Error ? error : new Error(String(error)),
			`/api/trip/[tripSlug]/comments/[commentId]/likes`,
		);
	}
}

/**
 * DELETE /api/trip/[tripSlug]/comments/[commentId]/likes
 * コメントへのいいねを削除します
 */
export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ tripSlug: string; commentId: string }> },
) {
	try {
		const userId = await resolveAuthUserId(request);
		if (!userId) {
			return unauthorized("Authorization header required");
		}

		const { commentId } = await params;
		const db = getFirestore();

		const result = await toggleCommentLike(userId, commentId, "unlike", db);

		return NextResponse.json(result);
	} catch (error: unknown) {
		if (error instanceof Error) {
			if (error.message.includes("Comment not found")) {
				return notFound("Comment");
			}
			if (error.message.includes("Comment is not liked")) {
				return NextResponse.json(
					{ error: "Comment is not liked" },
					{ status: 409 },
				);
			}
		}

		return handleApiError(
			error instanceof Error ? error : new Error(String(error)),
			`/api/trip/[tripSlug]/comments/[commentId]/likes`,
		);
	}
}
