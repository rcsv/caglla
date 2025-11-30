/**
 * User Follow API Routes のテスト
 *
 * Phase 1-3-3: API Routes実装（テストファースト）
 *
 * 注意: これらのテストはFirestoreエミュレータを起動している必要があります。
 * エミュレータ起動: pnpm emulators:start:firestore
 *
 * 使用方法:
 *   1. エミュレータを起動: pnpm emulators:start:firestore
 *   2. 別のターミナルでテスト実行: pnpm test:firestore -- user-follows
 */

import {
	createAuthHeader,
	createUnauthenticatedHeader,
} from "@/lib/__tests__/helpers/test-auth";
import { createMockUserData } from "@/lib/__tests__/helpers/test-data";
import { getTestFirestore } from "@/lib/__tests__/helpers/test-firestore";
import { COLLECTIONS } from "@/lib/firebase/firestore";
import type { User } from "@/lib/core/types";
import type { Firestore } from "firebase-admin/firestore";
import { NextRequest } from "next/server";
import {
	POST as followUser,
	DELETE as unfollowUser,
	GET as getFollowState,
} from "@/app/api/users/[userSlug]/follow/route";

// ヘルパー関数：API Routesを呼び出す
async function handleFollowUser(
	request: NextRequest,
	userSlug: string,
): Promise<Response> {
	return await followUser(request, { params: Promise.resolve({ userSlug }) });
}

async function handleUnfollowUser(
	request: NextRequest,
	userSlug: string,
): Promise<Response> {
	return await unfollowUser(request, { params: Promise.resolve({ userSlug }) });
}

async function handleGetFollowState(
	request: NextRequest,
	userSlug: string,
): Promise<Response> {
	return await getFollowState(request, {
		params: Promise.resolve({ userSlug }),
	});
}

describe("User Follow API Routes", () => {
	let db: Firestore;
	let userId: string;
	let otherUserId: string;
	let userSlug: string;
	let otherUserSlug: string;

	beforeAll(async () => {
		db = getTestFirestore();
	});

	beforeEach(async () => {
		// テストデータのクリーンアップ
		const usersSnapshot = await db.collection(COLLECTIONS.USERS).get();
		const followsSnapshot = await db.collection(COLLECTIONS.USER_FOLLOWS).get();
		const batch = db.batch();
		usersSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
		followsSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
		await batch.commit();

		// テストデータのセットアップ
		userId = "user1";
		otherUserId = "user2";
		userSlug = "user1-slug";
		otherUserSlug = "user2-slug";

		// ユーザーデータを作成
		const user1: User = createMockUserData({
			id: "user1-doc-id",
			google_id: userId,
			slug: userSlug,
			name: "User 1",
		});

		const user2: User = createMockUserData({
			id: "user2-doc-id",
			google_id: otherUserId,
			slug: otherUserSlug,
			name: "User 2",
		});

		await db.collection(COLLECTIONS.USERS).doc("user1-doc-id").set(user1);
		await db.collection(COLLECTIONS.USERS).doc("user2-doc-id").set(user2);
	});

	describe("POST /api/users/[userSlug]/follow", () => {
		it("should allow authenticated users to follow other users", async () => {
			const request = new NextRequest(
				`http://localhost/api/users/${otherUserSlug}/follow`,
				{
					method: "POST",
					headers: createAuthHeader(userId),
				},
			);

			const response = await handleFollowUser(request, otherUserSlug);
			const data = await response.json();

			expect(response.status).toBe(201);
			expect(data.id).toBe(`${userId}_${otherUserId}`);
			expect(data.follower_id).toBe(userId);
			expect(data.following_id).toBe(otherUserId);

			// データベースにフォロー関係が追加されたことを確認
			const followRef = db.collection(COLLECTIONS.USER_FOLLOWS).doc(data.id);
			const followDoc = await followRef.get();
			expect(followDoc.exists).toBe(true);
		});

		it("should deny following self", async () => {
			const request = new NextRequest(
				`http://localhost/api/users/${userSlug}/follow`,
				{
					method: "POST",
					headers: createAuthHeader(userId),
				},
			);

			const response = await handleFollowUser(request, userSlug);

			expect(response.status).toBe(400);
		});

		it("should deny duplicate follow requests", async () => {
			// 最初のフォロー
			const request1 = new NextRequest(
				`http://localhost/api/users/${otherUserSlug}/follow`,
				{
					method: "POST",
					headers: createAuthHeader(userId),
				},
			);
			await handleFollowUser(request1, otherUserSlug);

			// 2回目のフォロー（既にフォローしている場合）
			const request2 = new NextRequest(
				`http://localhost/api/users/${otherUserSlug}/follow`,
				{
					method: "POST",
					headers: createAuthHeader(userId),
				},
			);
			const response = await handleFollowUser(request2, otherUserSlug);

			expect(response.status).toBe(409);
		});

		it("should deny unauthenticated users from following", async () => {
			const request = new NextRequest(
				`http://localhost/api/users/${otherUserSlug}/follow`,
				{
					method: "POST",
					headers: createUnauthenticatedHeader(),
				},
			);

			const response = await handleFollowUser(request, otherUserSlug);

			expect(response.status).toBe(401);
		});
	});

	describe("DELETE /api/users/[userSlug]/follow", () => {
		beforeEach(async () => {
			// テスト前にフォロー関係を作成
			const request = new NextRequest(
				`http://localhost/api/users/${otherUserSlug}/follow`,
				{
					method: "POST",
					headers: createAuthHeader(userId),
				},
			);
			await handleFollowUser(request, otherUserSlug);
		});

		it("should allow user to unfollow another user", async () => {
			const request = new NextRequest(
				`http://localhost/api/users/${otherUserSlug}/follow`,
				{
					method: "DELETE",
					headers: createAuthHeader(userId),
				},
			);

			const response = await handleUnfollowUser(request, otherUserSlug);

			expect(response.status).toBe(200);

			// フォロー関係が削除されたことを確認
			const followRef = db
				.collection(COLLECTIONS.USER_FOLLOWS)
				.doc(`${userId}_${otherUserId}`);
			const followDoc = await followRef.get();
			expect(followDoc.exists).toBe(false);
		});

		it("should deny unfollowing non-existing follow relationship", async () => {
			const request = new NextRequest(
				`http://localhost/api/users/${otherUserSlug}/follow`,
				{
					method: "DELETE",
					headers: createAuthHeader(userId),
				},
			);

			// 既にフォロー解除済みの場合、再度フォロー解除しようとする
			await handleUnfollowUser(request, otherUserSlug);
			const response = await handleUnfollowUser(request, otherUserSlug);

			expect(response.status).toBe(404);
		});

		it("should deny unauthenticated users from unfollowing", async () => {
			const request = new NextRequest(
				`http://localhost/api/users/${otherUserSlug}/follow`,
				{
					method: "DELETE",
					headers: createUnauthenticatedHeader(),
				},
			);

			const response = await handleUnfollowUser(request, otherUserSlug);

			expect(response.status).toBe(401);
		});
	});

	describe("GET /api/users/[userSlug]/follow", () => {
		beforeEach(async () => {
			// テスト前にフォロー関係を作成
			const request = new NextRequest(
				`http://localhost/api/users/${otherUserSlug}/follow`,
				{
					method: "POST",
					headers: createAuthHeader(userId),
				},
			);
			await handleFollowUser(request, otherUserSlug);
		});

		it("should return isFollowing=true if user is following", async () => {
			const request = new NextRequest(
				`http://localhost/api/users/${otherUserSlug}/follow`,
				{
					method: "GET",
					headers: createAuthHeader(userId),
				},
			);

			const response = await handleGetFollowState(request, otherUserSlug);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.isFollowing).toBe(true);
		});

		it("should return isFollowing=false if user is not following", async () => {
			const request = new NextRequest(
				`http://localhost/api/users/${otherUserSlug}/follow`,
				{
					method: "GET",
					headers: createAuthHeader(userId),
				},
			);

			// フォロー解除
			await handleUnfollowUser(
				new NextRequest(`http://localhost/api/users/${otherUserSlug}/follow`, {
					method: "DELETE",
					headers: createAuthHeader(userId),
				}),
				otherUserSlug,
			);

			// フォロー状態を確認
			const response = await handleGetFollowState(request, otherUserSlug);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.isFollowing).toBe(false);
		});

		it("should deny unauthenticated users from getting follow state", async () => {
			const request = new NextRequest(
				`http://localhost/api/users/${otherUserSlug}/follow`,
				{
					method: "GET",
					headers: createUnauthenticatedHeader(),
				},
			);

			const response = await handleGetFollowState(request, otherUserSlug);

			expect(response.status).toBe(401);
		});
	});
});
