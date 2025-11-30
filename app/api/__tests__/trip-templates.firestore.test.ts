/**
 * Trip Templates API Routes のテスト
 *
 * 注意: これらのテストはFirestoreエミュレータを起動している必要があります。
 * エミュレータ起動: pnpm emulators:start:firestore
 *
 * 使用方法:
 *   1. エミュレータを起動: pnpm emulators:start:firestore
 *   2. 別のターミナルでテスト実行: pnpm test:firestore -- trip-templates
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
import { GET as getTemplateTripsRoute } from "@/app/api/trips/templates/route";
import { GET as getMySharedTripsRoute } from "@/app/api/trips/my-shares/route";

// ヘルパー関数：API Routesを呼び出す
async function handleGetTemplateTrips(request: NextRequest): Promise<Response> {
	return await getTemplateTripsRoute(request);
}

async function handleGetMySharedTrips(request: NextRequest): Promise<Response> {
	return await getMySharedTripsRoute(request);
}

describe("Trip Templates API Routes", () => {
	let db: Firestore;
	let templateTrip1: Trip;
	let templateTrip2: Trip;
	let publicNonTemplateTrip: Trip;
	let privateTemplateTrip: Trip;
	let userId: string;
	let otherUserId: string;

	beforeAll(async () => {
		db = getTestFirestore();
	});

	beforeEach(async () => {
		// テストデータのクリーンアップ
		const tripsSnapshot = await db.collection(COLLECTIONS.TRIPS).get();
		const batch = db.batch();
		tripsSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
		await batch.commit();

		// テストデータのセットアップ
		userId = "user1";
		otherUserId = "user2";

		// 公開テンプレートTripを作成
		templateTrip1 = createMockPublicTrip({
			id: "template-trip-1",
			user_id: otherUserId,
			slug: "template-trip-1",
			access_level: "public",
			is_template: true,
			title: "京都グルメプラン",
		});

		templateTrip2 = createMockPublicTrip({
			id: "template-trip-2",
			user_id: otherUserId,
			slug: "template-trip-2",
			access_level: "public",
			is_template: true,
			title: "沖縄ビーチプラン",
		});

		// 公開だがテンプレートではないTrip
		publicNonTemplateTrip = createMockPublicTrip({
			id: "public-non-template-1",
			user_id: otherUserId,
			slug: "public-non-template-1",
			access_level: "public",
			is_template: false,
			title: "通常の公開Trip",
		});

		// テンプレートだがプライベートなTrip
		privateTemplateTrip = createMockTrip({
			id: "private-template-1",
			user_id: otherUserId,
			slug: "private-template-1",
			access_level: "private",
			is_template: true,
			title: "プライベートテンプレート",
		});

		await db
			.collection(COLLECTIONS.TRIPS)
			.doc(templateTrip1.id)
			.set(templateTrip1);
		await db
			.collection(COLLECTIONS.TRIPS)
			.doc(templateTrip2.id)
			.set(templateTrip2);
		await db
			.collection(COLLECTIONS.TRIPS)
			.doc(publicNonTemplateTrip.id)
			.set(publicNonTemplateTrip);
		await db
			.collection(COLLECTIONS.TRIPS)
			.doc(privateTemplateTrip.id)
			.set(privateTemplateTrip);
	});

	describe("GET /api/trips/templates", () => {
		it("should return public template trips only", async () => {
			const request = new NextRequest(
				"http://localhost:3000/api/trips/templates",
			);
			const response = await handleGetTemplateTrips(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.trips).toHaveLength(2);
			expect(data.trips.map((t: Trip) => t.id)).toContain("template-trip-1");
			expect(data.trips.map((t: Trip) => t.id)).toContain("template-trip-2");
			expect(data.trips.map((t: Trip) => t.id)).not.toContain(
				"public-non-template-1",
			);
			expect(data.trips.map((t: Trip) => t.id)).not.toContain(
				"private-template-1",
			);
			expect(data.trips.every((t: Trip) => t.is_template === true)).toBe(true);
			expect(data.trips.every((t: Trip) => t.access_level === "public")).toBe(
				true,
			);
		});

		it("should exclude user trips when excludeMyTrips=true and user is authenticated", async () => {
			// 自分のテンプレートTripを作成
			const myTemplateTrip = createMockPublicTrip({
				id: "my-template-trip-1",
				user_id: userId,
				slug: "my-template-trip-1",
				access_level: "public",
				is_template: true,
				title: "自分のテンプレート",
			});
			await db
				.collection(COLLECTIONS.TRIPS)
				.doc(myTemplateTrip.id)
				.set(myTemplateTrip);

			const request = new NextRequest(
				`http://localhost:3000/api/trips/templates?excludeMyTrips=true`,
				{
					headers: createAuthHeader(userId),
				},
			);
			const response = await handleGetTemplateTrips(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.trips).toHaveLength(2);
			expect(data.trips.map((t: Trip) => t.id)).not.toContain(
				"my-template-trip-1",
			);
			expect(data.trips.every((t: Trip) => t.user_id !== userId)).toBe(true);
		});

		it("should respect limit parameter", async () => {
			const request = new NextRequest(
				"http://localhost:3000/api/trips/templates?limit=1",
			);
			const response = await handleGetTemplateTrips(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.trips).toHaveLength(1);
			expect(data.nextCursor).toBeDefined();
		});

		it("should support pagination with cursor", async () => {
			const firstRequest = new NextRequest(
				"http://localhost:3000/api/trips/templates?limit=1",
			);
			const firstResponse = await handleGetTemplateTrips(firstRequest);
			const firstData = await firstResponse.json();

			expect(firstData.trips).toHaveLength(1);
			expect(firstData.nextCursor).toBeDefined();

			const secondRequest = new NextRequest(
				`http://localhost:3000/api/trips/templates?limit=1&cursor=${firstData.nextCursor}`,
			);
			const secondResponse = await handleGetTemplateTrips(secondRequest);
			const secondData = await secondResponse.json();

			expect(secondData.trips).toHaveLength(1);
			expect(secondData.trips[0].id).not.toBe(firstData.trips[0].id);
		});

		it("should return empty array when no template trips exist", async () => {
			// すべてのTripを削除
			const tripsSnapshot = await db.collection(COLLECTIONS.TRIPS).get();
			const batch = db.batch();
			tripsSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
			await batch.commit();

			const request = new NextRequest(
				"http://localhost:3000/api/trips/templates",
			);
			const response = await handleGetTemplateTrips(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.trips).toHaveLength(0);
			expect(data.nextCursor).toBeUndefined();
		});

		it("should return 400 for invalid limit parameter", async () => {
			const request = new NextRequest(
				"http://localhost:3000/api/trips/templates?limit=200",
			);
			const response = await handleGetTemplateTrips(request);

			expect(response.status).toBe(400);
		});
	});

	describe("GET /api/trips/my-shares", () => {
		beforeEach(async () => {
			// 自分の公開Tripを作成
			const myPublicTrip1 = createMockPublicTrip({
				id: "my-public-trip-1",
				user_id: userId,
				slug: "my-public-trip-1",
				access_level: "public",
				is_template: false,
				title: "自分の公開Trip 1",
			});

			const myPublicTrip2 = createMockPublicTrip({
				id: "my-public-trip-2",
				user_id: userId,
				slug: "my-public-trip-2",
				access_level: "public",
				is_template: false,
				title: "自分の公開Trip 2",
			});

			// 自分のプライベートTripを作成
			const myPrivateTrip = createMockTrip({
				id: "my-private-trip-1",
				user_id: userId,
				slug: "my-private-trip-1",
				access_level: "private",
				is_template: false,
				title: "自分のプライベートTrip",
			});

			await db
				.collection(COLLECTIONS.TRIPS)
				.doc(myPublicTrip1.id)
				.set(myPublicTrip1);
			await db
				.collection(COLLECTIONS.TRIPS)
				.doc(myPublicTrip2.id)
				.set(myPublicTrip2);
			await db
				.collection(COLLECTIONS.TRIPS)
				.doc(myPrivateTrip.id)
				.set(myPrivateTrip);
		});

		it("should return only user's public trips", async () => {
			const request = new NextRequest(
				"http://localhost:3000/api/trips/my-shares",
				{
					headers: createAuthHeader(userId),
				},
			);
			const response = await handleGetMySharedTrips(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.trips).toHaveLength(2);
			expect(data.trips.map((t: Trip) => t.id)).toContain("my-public-trip-1");
			expect(data.trips.map((t: Trip) => t.id)).toContain("my-public-trip-2");
			expect(data.trips.map((t: Trip) => t.id)).not.toContain(
				"my-private-trip-1",
			);
			expect(data.trips.every((t: Trip) => t.user_id === userId)).toBe(true);
			expect(data.trips.every((t: Trip) => t.access_level === "public")).toBe(
				true,
			);
		});

		it("should not return other users' public trips", async () => {
			const request = new NextRequest(
				"http://localhost:3000/api/trips/my-shares",
				{
					headers: createAuthHeader(userId),
				},
			);
			const response = await handleGetMySharedTrips(request);
			const data = await response.json();

			expect(data.trips.map((t: Trip) => t.id)).not.toContain(
				"template-trip-1",
			);
			expect(data.trips.map((t: Trip) => t.id)).not.toContain(
				"template-trip-2",
			);
			expect(data.trips.map((t: Trip) => t.id)).not.toContain(
				"public-non-template-1",
			);
		});

		it("should require authentication", async () => {
			const request = new NextRequest(
				"http://localhost:3000/api/trips/my-shares",
				{
					headers: createUnauthenticatedHeader(),
				},
			);
			const response = await handleGetMySharedTrips(request);

			expect(response.status).toBe(401);
		});

		it("should respect limit parameter", async () => {
			const request = new NextRequest(
				"http://localhost:3000/api/trips/my-shares?limit=1",
				{
					headers: createAuthHeader(userId),
				},
			);
			const response = await handleGetMySharedTrips(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.trips).toHaveLength(1);
			expect(data.nextCursor).toBeDefined();
		});

		it("should support pagination with cursor", async () => {
			const firstRequest = new NextRequest(
				"http://localhost:3000/api/trips/my-shares?limit=1",
				{
					headers: createAuthHeader(userId),
				},
			);
			const firstResponse = await handleGetMySharedTrips(firstRequest);
			const firstData = await firstResponse.json();

			expect(firstData.trips).toHaveLength(1);
			expect(firstData.nextCursor).toBeDefined();

			const secondRequest = new NextRequest(
				`http://localhost:3000/api/trips/my-shares?limit=1&cursor=${firstData.nextCursor}`,
				{
					headers: createAuthHeader(userId),
				},
			);
			const secondResponse = await handleGetMySharedTrips(secondRequest);
			const secondData = await secondResponse.json();

			expect(secondData.trips).toHaveLength(1);
			expect(secondData.trips[0].id).not.toBe(firstData.trips[0].id);
		});

		it("should return empty array when user has no public trips", async () => {
			const request = new NextRequest(
				"http://localhost:3000/api/trips/my-shares",
				{
					headers: createAuthHeader("nonexistent-user"),
				},
			);
			const response = await handleGetMySharedTrips(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.trips).toHaveLength(0);
			expect(data.nextCursor).toBeUndefined();
		});

		it("should return 400 for invalid limit parameter", async () => {
			const request = new NextRequest(
				"http://localhost:3000/api/trips/my-shares?limit=200",
				{
					headers: createAuthHeader(userId),
				},
			);
			const response = await handleGetMySharedTrips(request);

			expect(response.status).toBe(400);
		});
	});
});
