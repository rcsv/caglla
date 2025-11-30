/**
 * Trip Comments API Routes のテスト
 *
 * Phase 1-3-2: API Routes実装（テストファースト）
 *
 * 注意: これらのテストはFirestoreエミュレータを起動している必要があります。
 * エミュレータ起動: pnpm emulators:start:firestore
 *
 * 使用方法:
 *   1. エミュレータを起動: pnpm emulators:start:firestore
 *   2. 別のターミナルでテスト実行: pnpm test:firestore -- trip-comments
 */

import {
	createAuthHeader,
	createUnauthenticatedHeader,
} from "@/lib/__tests__/helpers/test-auth";
import {
	createMockTrip,
	createMockPublicTrip,
} from "@/lib/__tests__/helpers/test-data";
import { getTestFirestore } from "@/lib/__tests__/helpers/test-firestore";
import { COLLECTIONS } from "@/lib/firebase/firestore";
import type { Trip } from "@/lib/core/types";
import type { Firestore } from "firebase-admin/firestore";
import { NextRequest } from "next/server";
import {
	GET as getTripComments,
	POST as createComment,
	PUT as updateComment,
	DELETE as deleteComment,
} from "@/app/api/trip/[tripSlug]/comments/route";

// ヘルパー関数：API Routesを呼び出す
async function handleCreateComment(
	request: NextRequest,
	tripSlug: string,
): Promise<Response> {
	return await createComment(request, {
		params: Promise.resolve({ tripSlug }),
	});
}

async function handleUpdateComment(
	request: NextRequest,
	tripSlug: string,
	commentId: string,
): Promise<Response> {
	return await updateComment(request, {
		params: Promise.resolve({ tripSlug, commentId }),
	});
}

async function handleDeleteComment(
	request: NextRequest,
	tripSlug: string,
	commentId: string,
): Promise<Response> {
	return await deleteComment(request, {
		params: Promise.resolve({ tripSlug, commentId }),
	});
}

async function handleGetComments(
	request: NextRequest,
	tripSlug: string,
): Promise<Response> {
	return await getTripComments(request, {
		params: Promise.resolve({ tripSlug }),
	});
}

describe("Trip Comments API Routes", () => {
	let db: Firestore;
	let publicTrip: Trip;
	let privateTrip: Trip;
	let userId: string;
	let otherUserId: string;

	beforeAll(async () => {
		db = getTestFirestore();
	});

	beforeEach(async () => {
		// テストデータのクリーンアップ
		const tripsSnapshot = await db.collection(COLLECTIONS.TRIPS).get();
		const commentsSnapshot = await db
			.collection(COLLECTIONS.TRIP_COMMENTS)
			.get();
		const batch = db.batch();
		tripsSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
		commentsSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
		await batch.commit();

		// テストデータのセットアップ
		userId = "user1";
		otherUserId = "user2";

		// 公開トリップとプライベートトリップを作成
		publicTrip = createMockPublicTrip({
			id: "public-trip-1",
			user_id: otherUserId,
			slug: "public-trip-1",
			access_level: "public",
			social_stats: {
				likes_count: 0,
				comments_count: 0,
				shares_count: 0,
				views_count: 0,
				replicas_count: 0,
			},
		});

		privateTrip = createMockTrip({
			id: "private-trip-1",
			user_id: otherUserId,
			slug: "private-trip-1",
			access_level: "private",
		});

		await db.collection(COLLECTIONS.TRIPS).doc(publicTrip.id).set(publicTrip);
		await db.collection(COLLECTIONS.TRIPS).doc(privateTrip.id).set(privateTrip);
	});

	describe("POST /api/trip/[tripSlug]/comments", () => {
		it("should allow authenticated users to create comments on public trips", async () => {
			const request = new NextRequest(
				"http://localhost/api/trip/public-trip-1/comments",
				{
					method: "POST",
					headers: createAuthHeader(userId),
					body: JSON.stringify({
						content: "Great trip!",
						userName: "Test User",
					}),
				},
			);

			const response = await handleCreateComment(request, "public-trip-1");
			const data = await response.json();

			expect(response.status).toBe(201);
			expect(data.id).toBeDefined();
			expect(data.content).toBe("Great trip!");
			expect(data.trip_id).toBe(publicTrip.id);
			expect(data.user_id).toBe(userId);

			// データベースにコメントが追加されたことを確認
			const commentRef = db.collection(COLLECTIONS.TRIP_COMMENTS).doc(data.id);
			const commentDoc = await commentRef.get();
			expect(commentDoc.exists).toBe(true);

			// Tripのsocial_statsが更新されたことを確認
			const tripDoc = await db
				.collection(COLLECTIONS.TRIPS)
				.doc(publicTrip.id)
				.get();
			const tripData = tripDoc.data() as Trip;
			expect(tripData.social_stats?.comments_count).toBe(1);
		});

		it("should allow creating nested comments", async () => {
			// 親コメントを作成
			const parentRequest = new NextRequest(
				"http://localhost/api/trip/public-trip-1/comments",
				{
					method: "POST",
					headers: createAuthHeader(userId),
					body: JSON.stringify({
						content: "Parent comment",
						userName: "Test User",
					}),
				},
			);
			const parentResponse = await handleCreateComment(
				parentRequest,
				"public-trip-1",
			);
			const parentData = await parentResponse.json();

			// ネストコメントを作成
			const nestedRequest = new NextRequest(
				"http://localhost/api/trip/public-trip-1/comments",
				{
					method: "POST",
					headers: createAuthHeader(otherUserId),
					body: JSON.stringify({
						content: "Reply to parent",
						userName: "Other User",
						parentCommentId: parentData.id,
					}),
				},
			);
			const nestedResponse = await handleCreateComment(
				nestedRequest,
				"public-trip-1",
			);
			const nestedData = await nestedResponse.json();

			expect(nestedResponse.status).toBe(201);
			expect(nestedData.parent_comment_id).toBe(parentData.id);
		});

		it("should deny commenting on private trips", async () => {
			const request = new NextRequest(
				"http://localhost/api/trip/private-trip-1/comments",
				{
					method: "POST",
					headers: createAuthHeader(userId),
					body: JSON.stringify({
						content: "Should not work",
						userName: "Test User",
					}),
				},
			);

			const response = await handleCreateComment(request, "private-trip-1");

			expect(response.status).toBe(403);
		});

		it("should deny unauthenticated users from commenting", async () => {
			const request = new NextRequest(
				"http://localhost/api/trip/public-trip-1/comments",
				{
					method: "POST",
					headers: createUnauthenticatedHeader(),
					body: JSON.stringify({
						content: "Should not work",
						userName: "Test User",
					}),
				},
			);

			const response = await handleCreateComment(request, "public-trip-1");

			expect(response.status).toBe(401);
		});
	});

	describe("PUT /api/trip/[tripSlug]/comments/[commentId]", () => {
		let commentId: string;

		beforeEach(async () => {
			// テスト前にコメントを作成
			const request = new NextRequest(
				"http://localhost/api/trip/public-trip-1/comments",
				{
					method: "POST",
					headers: createAuthHeader(userId),
					body: JSON.stringify({
						content: "Original content",
						userName: "Test User",
					}),
				},
			);
			const response = await handleCreateComment(request, "public-trip-1");
			const data = await response.json();
			commentId = data.id;
		});

		it("should allow comment owner to update comment", async () => {
			const request = new NextRequest(
				`http://localhost/api/trip/public-trip-1/comments/${commentId}`,
				{
					method: "PUT",
					headers: createAuthHeader(userId),
					body: JSON.stringify({
						content: "Updated content",
					}),
				},
			);

			const response = await handleUpdateComment(
				request,
				"public-trip-1",
				commentId,
			);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.content).toBe("Updated content");
			expect(data.updated_at).toBeDefined();
		});

		it("should deny updating comment by non-owner", async () => {
			const request = new NextRequest(
				`http://localhost/api/trip/public-trip-1/comments/${commentId}`,
				{
					method: "PUT",
					headers: createAuthHeader(otherUserId),
					body: JSON.stringify({
						content: "Hacked content",
					}),
				},
			);

			const response = await handleUpdateComment(
				request,
				"public-trip-1",
				commentId,
			);

			expect(response.status).toBe(403);
		});
	});

	describe("DELETE /api/trip/[tripSlug]/comments/[commentId]", () => {
		let commentId: string;

		beforeEach(async () => {
			// テスト前にコメントを作成
			const request = new NextRequest(
				"http://localhost/api/trip/public-trip-1/comments",
				{
					method: "POST",
					headers: createAuthHeader(userId),
					body: JSON.stringify({
						content: "Content to delete",
						userName: "Test User",
					}),
				},
			);
			const response = await handleCreateComment(request, "public-trip-1");
			const data = await response.json();
			commentId = data.id;
		});

		it("should allow comment owner to delete comment", async () => {
			const request = new NextRequest(
				`http://localhost/api/trip/public-trip-1/comments/${commentId}`,
				{
					method: "DELETE",
					headers: createAuthHeader(userId),
				},
			);

			const response = await handleDeleteComment(
				request,
				"public-trip-1",
				commentId,
			);

			expect(response.status).toBe(200);

			// コメントは論理削除される（deleted: true）
			const commentRef = db
				.collection(COLLECTIONS.TRIP_COMMENTS)
				.doc(commentId);
			const commentDoc = await commentRef.get();
			const commentData = commentDoc.data();
			expect(commentData?.deleted).toBe(true);

			// Tripのsocial_statsが更新されたことを確認
			const tripDoc = await db
				.collection(COLLECTIONS.TRIPS)
				.doc(publicTrip.id)
				.get();
			const tripData = tripDoc.data() as Trip;
			expect(tripData.social_stats?.comments_count).toBe(0);
		});

		it("should deny deleting comment by non-owner", async () => {
			const request = new NextRequest(
				`http://localhost/api/trip/public-trip-1/comments/${commentId}`,
				{
					method: "DELETE",
					headers: createAuthHeader(otherUserId),
				},
			);

			const response = await handleDeleteComment(
				request,
				"public-trip-1",
				commentId,
			);

			expect(response.status).toBe(403);
		});
	});

	describe("GET /api/trip/[tripSlug]/comments", () => {
		beforeEach(async () => {
			// 複数のコメントを作成
			const request1 = new NextRequest(
				"http://localhost/api/trip/public-trip-1/comments",
				{
					method: "POST",
					headers: createAuthHeader(userId),
					body: JSON.stringify({
						content: "Comment 1",
						userName: "User 1",
					}),
				},
			);
			await handleCreateComment(request1, "public-trip-1");

			const request2 = new NextRequest(
				"http://localhost/api/trip/public-trip-1/comments",
				{
					method: "POST",
					headers: createAuthHeader(otherUserId),
					body: JSON.stringify({
						content: "Comment 2",
						userName: "User 2",
					}),
				},
			);
			await handleCreateComment(request2, "public-trip-1");

			// 削除されたコメントも作成
			const request3 = new NextRequest(
				"http://localhost/api/trip/public-trip-1/comments",
				{
					method: "POST",
					headers: createAuthHeader(userId),
					body: JSON.stringify({
						content: "Deleted comment",
						userName: "User 1",
					}),
				},
			);
			const response3 = await handleCreateComment(request3, "public-trip-1");
			const data3 = await response3.json();

			const deleteRequest = new NextRequest(
				`http://localhost/api/trip/public-trip-1/comments/${data3.id}`,
				{
					method: "DELETE",
					headers: createAuthHeader(userId),
				},
			);
			await handleDeleteComment(deleteRequest, "public-trip-1", data3.id);
		});

		it("should return comments for public trips (excluding deleted)", async () => {
			const request = new NextRequest(
				"http://localhost/api/trip/public-trip-1/comments",
				{
					method: "GET",
					headers: createAuthHeader(userId),
				},
			);

			const response = await handleGetComments(request, "public-trip-1");
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(Array.isArray(data)).toBe(true);
			expect(data.length).toBe(2);
			expect(data.every((c: TripComment) => !c.deleted)).toBe(true);
			expect(data.some((c: TripComment) => c.content === "Comment 1")).toBe(
				true,
			);
			expect(data.some((c: TripComment) => c.content === "Comment 2")).toBe(
				true,
			);
		});

		it("should deny access to private trip comments", async () => {
			const request = new NextRequest(
				"http://localhost/api/trip/private-trip-1/comments",
				{
					method: "GET",
					headers: createAuthHeader(userId),
				},
			);

			const response = await handleGetComments(request, "private-trip-1");

			expect(response.status).toBe(403);
		});

		it("should return comments sorted by created_at (ascending)", async () => {
			const request = new NextRequest(
				"http://localhost/api/trip/public-trip-1/comments",
				{
					method: "GET",
					headers: createAuthHeader(userId),
				},
			);

			const response = await handleGetComments(request, "public-trip-1");
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.length).toBeGreaterThan(0);

			// created_atでソートされていることを確認
			for (let i = 1; i < data.length; i++) {
				const prev = data[i - 1].created_at;
				const curr = data[i].created_at;
				const prevTime =
					prev instanceof Date ? prev.getTime() : new Date(prev).getTime();
				const currTime =
					curr instanceof Date ? curr.getTime() : new Date(curr).getTime();
				expect(prevTime).toBeLessThanOrEqual(currTime);
			}
		});
	});
});
