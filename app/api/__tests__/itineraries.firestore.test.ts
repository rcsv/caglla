/**
 * Itineraries API Routes のテスト
 *
 * Phase 3: 日程・スケジュール管理APIテスト実装
 *
 * 注意: これらのテストはFirestoreエミュレータを起動している必要があります。
 * エミュレータ起動: pnpm emulators:start:firestore
 *
 * 使用方法:
 *   1. エミュレータを起動: pnpm emulators:start:firestore
 *   2. 別のターミナルでテスト実行: pnpm test:firestore -- itineraries
 */

import {
	createAuthHeader,
	createUnauthenticatedHeader,
} from "@/lib/__tests__/helpers/test-auth";
import {
	createMockTrip,
	createMockDay,
	createMockItinerary,
} from "@/lib/__tests__/helpers/test-data";
import { getTestFirestore } from "@/lib/__tests__/helpers/test-firestore";
import { COLLECTIONS } from "@/lib/firebase/firestore";
import type { Trip, Day, Itinerary } from "@/lib/core/types";
import type { Firestore } from "firebase-admin/firestore";
import { NextRequest } from "next/server";
import {
	GET as getItineraries,
	POST as postItineraries,
} from "@/app/api/itineraries/route";
import {
	PUT as putItinerary,
	DELETE as deleteItinerary,
} from "@/app/api/itineraries/[id]/route";
import { POST as insertItinerary } from "@/app/api/itineraries/insert/route";
import { PUT as moveItinerary } from "@/app/api/itineraries/move-to-day/route";
import { POST as duplicateItinerary } from "@/app/api/itineraries/duplicate-to-day/route";
import { POST as reorderItineraries } from "@/app/api/itineraries/reorder/route";

// ヘルパー関数：API Routesを呼び出す
async function handleGetItineraries(request: NextRequest): Promise<Response> {
	return await getItineraries(request);
}

async function handlePostItineraries(request: NextRequest): Promise<Response> {
	return await postItineraries(request);
}

async function handlePutItinerary(
	request: NextRequest,
	itineraryId: string,
): Promise<Response> {
	return await putItinerary(request, {
		params: Promise.resolve({ id: itineraryId }),
	});
}

async function handleDeleteItinerary(
	request: NextRequest,
	itineraryId: string,
): Promise<Response> {
	return await deleteItinerary(request, {
		params: Promise.resolve({ id: itineraryId }),
	});
}

async function handleInsertItinerary(request: NextRequest): Promise<Response> {
	return await insertItinerary(request);
}

async function handleMoveItinerary(request: NextRequest): Promise<Response> {
	return await moveItinerary(request);
}

async function handleDuplicateItinerary(
	request: NextRequest,
): Promise<Response> {
	return await duplicateItinerary(request);
}

async function handleReorderItineraries(
	request: NextRequest,
): Promise<Response> {
	return await reorderItineraries(request);
}

describe("Itineraries API Routes", () => {
	let db: Firestore;
	let userId: string;
	let otherUserId: string;
	let trip: Trip;
	let day: Day;
	let itinerary: Itinerary;
	let otherTrip: Trip;
	let otherDay: Day;

	beforeAll(async () => {
		db = getTestFirestore();
	});

	beforeEach(async () => {
		// テストデータのクリーンアップ
		const tripsSnapshot = await db.collection(COLLECTIONS.TRIPS).get();
		const daysSnapshot = await db.collection(COLLECTIONS.DAYS).get();
		const itinerariesSnapshot = await db
			.collection(COLLECTIONS.ITINERARIES)
			.get();
		const batch = db.batch();
		tripsSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
		daysSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
		itinerariesSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
		await batch.commit();

		// テストデータのセットアップ
		userId = "user1";
		otherUserId = "user2";

		// トリップとデイを作成
		trip = createMockTrip({
			id: "trip-1",
			user_id: userId,
			slug: "trip-1",
			title: "Test Trip",
		});

		otherTrip = createMockTrip({
			id: "trip-2",
			user_id: otherUserId,
			slug: "trip-2",
			title: "Other Trip",
		});

		day = createMockDay(trip.id, {
			id: "day-1",
			trip_id: trip.id,
			day_number: 1,
			date: new Date(2024, 0, 1),
		});

		otherDay = createMockDay(otherTrip.id, {
			id: "day-2",
			trip_id: otherTrip.id,
			day_number: 1,
			date: new Date(2024, 0, 2),
		});

		itinerary = createMockItinerary(day.id, {
			id: "itinerary-1",
			day_id: day.id,
			trip_id: trip.id,
			title: "Test Itinerary",
			sort_number: 1,
			place_id: "place-123",
		});

		// データベースに保存
		await db.collection(COLLECTIONS.TRIPS).doc(trip.id).set(trip);
		await db.collection(COLLECTIONS.TRIPS).doc(otherTrip.id).set(otherTrip);
		await db.collection(COLLECTIONS.DAYS).doc(day.id).set(day);
		await db.collection(COLLECTIONS.DAYS).doc(otherDay.id).set(otherDay);
		await db
			.collection(COLLECTIONS.ITINERARIES)
			.doc(itinerary.id)
			.set(itinerary);
	});

	describe("GET /api/itineraries?day_id=xxx", () => {
		it("should return itineraries for authenticated owner", async () => {
			const request = new NextRequest(
				`http://localhost/api/itineraries?day_id=${day.id}`,
				{
					method: "GET",
					headers: createAuthHeader(userId),
				},
			);

			const response = await handleGetItineraries(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(Array.isArray(data)).toBe(true);
			expect(data.length).toBeGreaterThanOrEqual(1);
			expect(data[0].id).toBe(itinerary.id);
			expect(data[0].title).toBe(itinerary.title);
		});

		it("should deny access to other users days", async () => {
			const request = new NextRequest(
				`http://localhost/api/itineraries?day_id=${otherDay.id}`,
				{
					method: "GET",
					headers: createAuthHeader(userId), // 別のユーザーで認証
				},
			);

			const response = await handleGetItineraries(request);

			expect(response.status).toBe(403);
		});

		it("should deny unauthenticated users", async () => {
			const request = new NextRequest(
				`http://localhost/api/itineraries?day_id=${day.id}`,
				{
					method: "GET",
					headers: createUnauthenticatedHeader(),
				},
			);

			const response = await handleGetItineraries(request);

			expect(response.status).toBe(401);
		});

		it("should return 400 if day_id is missing", async () => {
			const request = new NextRequest("http://localhost/api/itineraries", {
				method: "GET",
				headers: createAuthHeader(userId),
			});

			const response = await handleGetItineraries(request);

			expect(response.status).toBe(400);
		});

		it("should return 404 for non-existent day", async () => {
			const request = new NextRequest(
				"http://localhost/api/itineraries?day_id=non-existent-day",
				{
					method: "GET",
					headers: createAuthHeader(userId),
				},
			);

			const response = await handleGetItineraries(request);

			expect(response.status).toBe(404);
		});

		it("should return empty array for day with no itineraries", async () => {
			// 新しいdayを作成（itinerariesなし）
			const emptyDay = createMockDay(trip.id, {
				id: "empty-day-1",
				trip_id: trip.id,
				day_number: 2,
				date: new Date(2024, 0, 2),
			});
			await db.collection(COLLECTIONS.DAYS).doc(emptyDay.id).set(emptyDay);

			const request = new NextRequest(
				`http://localhost/api/itineraries?day_id=${emptyDay.id}`,
				{
					method: "GET",
					headers: createAuthHeader(userId),
				},
			);

			const response = await handleGetItineraries(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(Array.isArray(data)).toBe(true);
			expect(data.length).toBe(0);
		});
	});

	describe("POST /api/itineraries", () => {
		it("should create itinerary for authenticated owner", async () => {
			const request = new NextRequest("http://localhost/api/itineraries", {
				method: "POST",
				headers: createAuthHeader(userId),
				body: JSON.stringify({
					day_id: day.id,
					title: "New Itinerary",
					place_id: "place-456",
				}),
			});

			const response = await handlePostItineraries(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.id).toBeDefined();
			expect(data.title).toBe("New Itinerary");
			expect(data.day_id).toBe(day.id);
			expect(data.sort_number).toBe(2); // 既存のitineraryがsort_number=1なので

			// データベースにitineraryが作成されたことを確認
			const itineraryDoc = await db
				.collection(COLLECTIONS.ITINERARIES)
				.doc(data.id)
				.get();
			expect(itineraryDoc.exists).toBe(true);
			const createdItinerary = itineraryDoc.data() as Itinerary;
			expect(createdItinerary.title).toBe("New Itinerary");
		});

		it("should deny creating itinerary for other users days", async () => {
			const request = new NextRequest("http://localhost/api/itineraries", {
				method: "POST",
				headers: createAuthHeader(userId), // 別のユーザーで認証
				body: JSON.stringify({
					day_id: otherDay.id,
					title: "Hacked Itinerary",
					place_id: "place-456",
				}),
			});

			const response = await handlePostItineraries(request);

			expect(response.status).toBe(403);
		});

		it("should deny unauthenticated users", async () => {
			const request = new NextRequest("http://localhost/api/itineraries", {
				method: "POST",
				headers: createUnauthenticatedHeader(),
				body: JSON.stringify({
					day_id: day.id,
					title: "Test Itinerary",
					place_id: "place-456",
				}),
			});

			const response = await handlePostItineraries(request);

			expect(response.status).toBe(401);
		});

		it("should return 400 if required fields are missing", async () => {
			const request = new NextRequest("http://localhost/api/itineraries", {
				method: "POST",
				headers: createAuthHeader(userId),
				body: JSON.stringify({
					day_id: day.id,
					// titleとplace_idが欠けている
				}),
			});

			const response = await handlePostItineraries(request);

			expect(response.status).toBe(400);
		});

		it("should return 404 for non-existent day", async () => {
			const request = new NextRequest("http://localhost/api/itineraries", {
				method: "POST",
				headers: createAuthHeader(userId),
				body: JSON.stringify({
					day_id: "non-existent-day",
					title: "Test Itinerary",
					place_id: "place-456",
				}),
			});

			const response = await handlePostItineraries(request);

			expect(response.status).toBe(404);
		});
	});

	describe("PUT /api/itineraries/[id]", () => {
		// 注意: 現在の実装では認証チェックがないため、認証不要としてテスト
		// TODO: 将来的には認証チェックを追加すべき
		it("should update itinerary (no auth required currently)", async () => {
			const request = new NextRequest(
				`http://localhost/api/itineraries/${itinerary.id}`,
				{
					method: "PUT",
					headers: {},
					body: JSON.stringify({
						title: "Updated Title",
						description: "Updated description",
					}),
				},
			);

			const response = await handlePutItinerary(request, itinerary.id);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.id).toBe(itinerary.id);
			expect(data.title).toBe("Updated Title");
			expect(data.description).toBe("Updated description");

			// データベースにitineraryが更新されたことを確認
			const itineraryDoc = await db
				.collection(COLLECTIONS.ITINERARIES)
				.doc(itinerary.id)
				.get();
			const updatedItinerary = itineraryDoc.data() as Itinerary;
			expect(updatedItinerary.title).toBe("Updated Title");
		});

		it("should return 404 for non-existent itinerary", async () => {
			const request = new NextRequest(
				"http://localhost/api/itineraries/non-existent-id",
				{
					method: "PUT",
					headers: {},
					body: JSON.stringify({
						title: "Test Title",
					}),
				},
			);

			const response = await handlePutItinerary(request, "non-existent-id");

			expect(response.status).toBe(404);
		});
	});

	describe("DELETE /api/itineraries/[id]", () => {
		// 注意: 現在の実装では認証チェックがないため、認証不要としてテスト
		// TODO: 将来的には認証チェックを追加すべき
		it("should delete itinerary (no auth required currently)", async () => {
			const request = new NextRequest(
				`http://localhost/api/itineraries/${itinerary.id}`,
				{
					method: "DELETE",
					headers: {},
				},
			);

			const response = await handleDeleteItinerary(request, itinerary.id);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);

			// データベースからitineraryが削除されたことを確認
			const itineraryDoc = await db
				.collection(COLLECTIONS.ITINERARIES)
				.doc(itinerary.id)
				.get();
			expect(itineraryDoc.exists).toBe(false);
		});

		it("should renumber subsequent itineraries after deletion", async () => {
			// 複数のitinerariesを作成
			const itinerary2 = createMockItinerary(day.id, {
				id: "itinerary-2",
				day_id: day.id,
				trip_id: trip.id,
				sort_number: 2,
			});
			const itinerary3 = createMockItinerary(day.id, {
				id: "itinerary-3",
				day_id: day.id,
				trip_id: trip.id,
				sort_number: 3,
			});
			await db
				.collection(COLLECTIONS.ITINERARIES)
				.doc(itinerary2.id)
				.set(itinerary2);
			await db
				.collection(COLLECTIONS.ITINERARIES)
				.doc(itinerary3.id)
				.set(itinerary3);

			// sort_number=2のitineraryを削除
			const request = new NextRequest(
				`http://localhost/api/itineraries/${itinerary2.id}`,
				{
					method: "DELETE",
					headers: {},
				},
			);

			const response = await handleDeleteItinerary(request, itinerary2.id);

			expect(response.status).toBe(200);

			// sort_number=3のitineraryがsort_number=2に変更されたことを確認
			const itinerary3Doc = await db
				.collection(COLLECTIONS.ITINERARIES)
				.doc(itinerary3.id)
				.get();
			const updatedItinerary3 = itinerary3Doc.data() as Itinerary;
			expect(updatedItinerary3.sort_number).toBe(2);
		});

		it("should return 404 for non-existent itinerary", async () => {
			const request = new NextRequest(
				"http://localhost/api/itineraries/non-existent-id",
				{
					method: "DELETE",
					headers: {},
				},
			);

			const response = await handleDeleteItinerary(request, "non-existent-id");

			expect(response.status).toBe(404);
		});
	});

	describe("POST /api/itineraries/insert", () => {
		it("should insert itinerary at specified position", async () => {
			const request = new NextRequest(
				"http://localhost/api/itineraries/insert",
				{
					method: "POST",
					headers: createAuthHeader(userId),
					body: JSON.stringify({
						day_id: day.id,
						title: "Inserted Itinerary",
						place_id: "place-789",
						insert_after_index: 0, // 最初の位置に挿入
					}),
				},
			);

			const response = await handleInsertItinerary(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.id).toBeDefined();
			expect(data.title).toBe("Inserted Itinerary");
			expect(data.sort_number).toBe(1); // 最初の位置に挿入

			// 既存のitineraryのsort_numberがインクリメントされたことを確認
			const existingItineraryDoc = await db
				.collection(COLLECTIONS.ITINERARIES)
				.doc(itinerary.id)
				.get();
			const updatedItinerary = existingItineraryDoc.data() as Itinerary;
			expect(updatedItinerary.sort_number).toBe(2);
		});

		it("should deny unauthenticated users", async () => {
			const request = new NextRequest(
				"http://localhost/api/itineraries/insert",
				{
					method: "POST",
					headers: createUnauthenticatedHeader(),
					body: JSON.stringify({
						day_id: day.id,
						title: "Test Itinerary",
						place_id: "place-789",
					}),
				},
			);

			const response = await handleInsertItinerary(request);

			expect(response.status).toBe(401);
		});

		it("should return 400 if required fields are missing", async () => {
			const request = new NextRequest(
				"http://localhost/api/itineraries/insert",
				{
					method: "POST",
					headers: createAuthHeader(userId),
					body: JSON.stringify({
						day_id: day.id,
						// titleとplace_idが欠けている
					}),
				},
			);

			const response = await handleInsertItinerary(request);

			expect(response.status).toBe(400);
		});
	});

	describe("POST /api/itineraries/move-to-day", () => {
		// 注意: 現在の実装では認証チェックがないため、認証不要としてテスト
		// TODO: 将来的には認証チェックを追加すべき
		it("should move itinerary to different day (no auth required currently)", async () => {
			// 移動先のdayを作成
			const targetDay = createMockDay(trip.id, {
				id: "target-day-1",
				trip_id: trip.id,
				day_number: 2,
				date: new Date(2024, 0, 2),
			});
			await db.collection(COLLECTIONS.DAYS).doc(targetDay.id).set(targetDay);

			const request = new NextRequest(
				"http://localhost/api/itineraries/move-to-day",
				{
					method: "PUT",
					headers: {},
					body: JSON.stringify({
						itinerary_id: itinerary.id,
						target_day_id: targetDay.id,
					}),
				},
			);

			const response = await handleMoveItinerary(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.id).toBe(itinerary.id);
			expect(data.day_id).toBe(targetDay.id);
			expect(data.sort_number).toBe(1); // 移動先のdayにはitinerariesがないので

			// データベースにitineraryが移動されたことを確認
			const itineraryDoc = await db
				.collection(COLLECTIONS.ITINERARIES)
				.doc(itinerary.id)
				.get();
			const movedItinerary = itineraryDoc.data() as Itinerary;
			expect(movedItinerary.day_id).toBe(targetDay.id);
		});

		it("should return 400 if required fields are missing", async () => {
			const request = new NextRequest(
				"http://localhost/api/itineraries/move-to-day",
				{
					method: "PUT",
					headers: {},
					body: JSON.stringify({
						// itinerary_idとtarget_day_idが欠けている
					}),
				},
			);

			const response = await handleMoveItinerary(request);

			expect(response.status).toBe(400);
		});

		it("should return 404 for non-existent itinerary", async () => {
			const request = new NextRequest(
				"http://localhost/api/itineraries/move-to-day",
				{
					method: "PUT",
					headers: {},
					body: JSON.stringify({
						itinerary_id: "non-existent-id",
						target_day_id: day.id,
					}),
				},
			);

			const response = await handleMoveItinerary(request);

			expect(response.status).toBe(404);
		});
	});

	describe("POST /api/itineraries/duplicate-to-day", () => {
		// 注意: 現在の実装では認証チェックがないため、認証不要としてテスト
		// TODO: 将来的には認証チェックを追加すべき
		it("should duplicate itinerary to different day (no auth required currently)", async () => {
			// 複製先のdayを作成
			const targetDay = createMockDay(trip.id, {
				id: "target-day-2",
				trip_id: trip.id,
				day_number: 3,
				date: new Date(2024, 0, 3),
			});
			await db.collection(COLLECTIONS.DAYS).doc(targetDay.id).set(targetDay);

			const request = new NextRequest(
				"http://localhost/api/itineraries/duplicate-to-day",
				{
					method: "POST",
					headers: {},
					body: JSON.stringify({
						itinerary_id: itinerary.id,
						target_day_id: targetDay.id,
					}),
				},
			);

			const response = await handleDuplicateItinerary(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.id).toBeDefined();
			expect(data.id).not.toBe(itinerary.id); // 新しいID
			expect(data.title).toContain(itinerary.title);
			expect(data.title).toContain("(複製)");
			expect(data.day_id).toBe(targetDay.id);
			expect(data.sort_number).toBe(1);

			// データベースに複製が作成されたことを確認
			const duplicateDoc = await db
				.collection(COLLECTIONS.ITINERARIES)
				.doc(data.id)
				.get();
			expect(duplicateDoc.exists).toBe(true);
			const duplicatedItinerary = duplicateDoc.data() as Itinerary;
			expect(duplicatedItinerary.day_id).toBe(targetDay.id);
		});

		it("should return 400 if required fields are missing", async () => {
			const request = new NextRequest(
				"http://localhost/api/itineraries/duplicate-to-day",
				{
					method: "POST",
					headers: {},
					body: JSON.stringify({
						// itinerary_idとtarget_day_idが欠けている
					}),
				},
			);

			const response = await handleDuplicateItinerary(request);

			expect(response.status).toBe(400);
		});

		it("should return 404 for non-existent itinerary", async () => {
			const request = new NextRequest(
				"http://localhost/api/itineraries/duplicate-to-day",
				{
					method: "POST",
					headers: {},
					body: JSON.stringify({
						itinerary_id: "non-existent-id",
						target_day_id: day.id,
					}),
				},
			);

			const response = await handleDuplicateItinerary(request);

			expect(response.status).toBe(404);
		});
	});

	describe("POST /api/itineraries/reorder", () => {
		// 注意: 現在の実装では認証チェックがないため、認証不要としてテスト
		// TODO: 将来的には認証チェックを追加すべき
		it("should reorder itineraries (no auth required currently)", async () => {
			// 複数のitinerariesを作成
			const itinerary2 = createMockItinerary(day.id, {
				id: "itinerary-2",
				day_id: day.id,
				trip_id: trip.id,
				sort_number: 2,
			});
			const itinerary3 = createMockItinerary(day.id, {
				id: "itinerary-3",
				day_id: day.id,
				trip_id: trip.id,
				sort_number: 3,
			});
			await db
				.collection(COLLECTIONS.ITINERARIES)
				.doc(itinerary2.id)
				.set(itinerary2);
			await db
				.collection(COLLECTIONS.ITINERARIES)
				.doc(itinerary3.id)
				.set(itinerary3);

			// 並び替え: 3, 1, 2の順にする
			const request = new NextRequest(
				"http://localhost/api/itineraries/reorder",
				{
					method: "POST",
					headers: {},
					body: JSON.stringify({
						dayId: day.id,
						itineraryIds: [itinerary3.id, itinerary.id, itinerary2.id],
					}),
				},
			);

			const response = await handleReorderItineraries(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);
			expect(data.reorderedCount).toBe(3);

			// データベースに並び替えが反映されたことを確認
			const itinerary3Doc = await db
				.collection(COLLECTIONS.ITINERARIES)
				.doc(itinerary3.id)
				.get();
			const updatedItinerary3 = itinerary3Doc.data() as Itinerary;
			expect(updatedItinerary3.sort_number).toBe(1);

			const itinerary1Doc = await db
				.collection(COLLECTIONS.ITINERARIES)
				.doc(itinerary.id)
				.get();
			const updatedItinerary1 = itinerary1Doc.data() as Itinerary;
			expect(updatedItinerary1.sort_number).toBe(2);

			const itinerary2Doc = await db
				.collection(COLLECTIONS.ITINERARIES)
				.doc(itinerary2.id)
				.get();
			const updatedItinerary2 = itinerary2Doc.data() as Itinerary;
			expect(updatedItinerary2.sort_number).toBe(3);
		});

		it("should return 400 if required fields are missing", async () => {
			const request = new NextRequest(
				"http://localhost/api/itineraries/reorder",
				{
					method: "POST",
					headers: {},
					body: JSON.stringify({
						// dayIdとitineraryIdsが欠けている
					}),
				},
			);

			const response = await handleReorderItineraries(request);

			expect(response.status).toBe(400);
		});
	});
});
