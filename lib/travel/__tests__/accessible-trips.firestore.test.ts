/**
 * Accessible Trips のテスト
 *
 * 注意: これらのテストはFirestoreエミュレータを起動している必要があります。
 * エミュレータ起動: pnpm emulators:start:firestore
 *
 * 使用方法:
 *   1. エミュレータを起動: pnpm emulators:start:firestore
 *   2. 別のターミナルでテスト実行: pnpm test:firestore -- accessible-trips
 */

import {
	createMockTrip,
	createMockPublicTrip,
} from "@/lib/__tests__/helpers/test-data";
import { getTestFirestore } from "@/lib/__tests__/helpers/test-firestore";
import { COLLECTIONS } from "@/lib/firebase/firestore";
import type { Trip, TripUser } from "@/lib/core/types";
import type { Firestore } from "firebase-admin/firestore";
import { getAccessibleTrips } from "@/lib/travel/accessible-trips";

// TripUserのモックデータを作成するヘルパー
function createMockTripUser(
	tripId: string,
	userId: string,
	overrides?: Partial<TripUser>,
): TripUser {
	return {
		id: `${userId}_${tripId}`,
		trip_id: tripId,
		user_id: userId,
		created_at: new Date(),
		...overrides,
	};
}

describe("getAccessibleTrips", () => {
	let db: Firestore;
	let userId: string;
	let otherUserId: string;

	beforeAll(async () => {
		db = getTestFirestore();
	}, 10000); // タイムアウトを10秒に設定

	beforeEach(async () => {
		// テストデータのクリーンアップ
		const tripsSnapshot = await db.collection(COLLECTIONS.TRIPS).get();
		const batch = db.batch();
		tripsSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
		await batch.commit();

		const tripUsersSnapshot = await db.collection(COLLECTIONS.TRIP_USERS).get();
		const tripUsersBatch = db.batch();
		tripUsersSnapshot.docs.forEach((doc) => tripUsersBatch.delete(doc.ref));
		await tripUsersBatch.commit();

		// テストデータのセットアップ
		userId = "user1";
		otherUserId = "user2";
	});

	describe("所有Tripの取得", () => {
		it("should return owned trips only when includeShared=false", async () => {
			// 自分のTripを作成
			const ownedTrip1 = createMockTrip({
				id: "owned-trip-1",
				user_id: userId,
				title: "自分のTrip 1",
				created_at: new Date("2024-01-01"),
			});

			const ownedTrip2 = createMockTrip({
				id: "owned-trip-2",
				user_id: userId,
				title: "自分のTrip 2",
				created_at: new Date("2024-01-02"),
			});

			// 他人のTripを作成
			const otherTrip = createMockTrip({
				id: "other-trip-1",
				user_id: otherUserId,
				title: "他人のTrip",
			});

			await db.collection(COLLECTIONS.TRIPS).doc(ownedTrip1.id).set(ownedTrip1);
			await db.collection(COLLECTIONS.TRIPS).doc(ownedTrip2.id).set(ownedTrip2);
			await db.collection(COLLECTIONS.TRIPS).doc(otherTrip.id).set(otherTrip);

			const result = await getAccessibleTrips(
				userId,
				{ includeShared: false },
				db,
			);

			expect(result.trips).toHaveLength(2);
			expect(result.trips.map((t) => t.id)).toContain("owned-trip-1");
			expect(result.trips.map((t) => t.id)).toContain("owned-trip-2");
			expect(result.trips.map((t) => t.id)).not.toContain("other-trip-1");
			expect(result.trips.every((t) => t.user_id === userId)).toBe(true);
		});

		it("should return trips sorted by created_at DESC", async () => {
			const trip1 = createMockTrip({
				id: "trip-1",
				user_id: userId,
				title: "Trip 1",
				created_at: new Date("2024-01-01"),
			});

			const trip2 = createMockTrip({
				id: "trip-2",
				user_id: userId,
				title: "Trip 2",
				created_at: new Date("2024-01-02"),
			});

			const trip3 = createMockTrip({
				id: "trip-3",
				user_id: userId,
				title: "Trip 3",
				created_at: new Date("2024-01-03"),
			});

			await db.collection(COLLECTIONS.TRIPS).doc(trip1.id).set(trip1);
			await db.collection(COLLECTIONS.TRIPS).doc(trip2.id).set(trip2);
			await db.collection(COLLECTIONS.TRIPS).doc(trip3.id).set(trip3);

			const result = await getAccessibleTrips(
				userId,
				{ includeShared: false },
				db,
			);

			expect(result.trips).toHaveLength(3);
			expect(result.trips[0].id).toBe("trip-3");
			expect(result.trips[1].id).toBe("trip-2");
			expect(result.trips[2].id).toBe("trip-1");
		});
	});

	describe("共有Tripの取得", () => {
		it("should return both owned and shared trips when includeShared=true", async () => {
			// 自分のTripを作成
			const ownedTrip = createMockTrip({
				id: "owned-trip-1",
				user_id: userId,
				title: "自分のTrip",
				created_at: new Date("2024-01-01"),
			});

			// 他人のTripを作成（共有用）
			const sharedTrip = createMockTrip({
				id: "shared-trip-1",
				user_id: otherUserId,
				title: "共有されたTrip",
				created_at: new Date("2024-01-02"),
			});

			await db.collection(COLLECTIONS.TRIPS).doc(ownedTrip.id).set(ownedTrip);
			await db.collection(COLLECTIONS.TRIPS).doc(sharedTrip.id).set(sharedTrip);

			// trip_usersコレクションに共有情報を追加
			const tripUser = createMockTripUser(sharedTrip.id, userId);
			await db
				.collection(COLLECTIONS.TRIP_USERS)
				.doc(tripUser.id)
				.set(tripUser);

			const result = await getAccessibleTrips(
				userId,
				{ includeShared: true },
				db,
			);

			expect(result.trips).toHaveLength(2);
			expect(result.trips.map((t) => t.id)).toContain("owned-trip-1");
			expect(result.trips.map((t) => t.id)).toContain("shared-trip-1");
		});

		it("should not return duplicate trips when user owns and is shared with the same trip", async () => {
			// 自分が所有するTrip
			const ownedTrip = createMockTrip({
				id: "owned-trip-1",
				user_id: userId,
				title: "自分のTrip",
				created_at: new Date("2024-01-01"),
			});

			await db.collection(COLLECTIONS.TRIPS).doc(ownedTrip.id).set(ownedTrip);

			// 同じTripを共有としても追加（実際には起こらないが、テストとして）
			const tripUser = createMockTripUser(ownedTrip.id, userId);
			await db
				.collection(COLLECTIONS.TRIP_USERS)
				.doc(tripUser.id)
				.set(tripUser);

			const result = await getAccessibleTrips(
				userId,
				{ includeShared: true },
				db,
			);

			// 重複しないことを確認
			expect(result.trips).toHaveLength(1);
			expect(result.trips[0].id).toBe("owned-trip-1");
		});
	});

	describe("ページネーション", () => {
		it("should respect limit parameter", async () => {
			// 複数のTripを作成
			const trips = Array.from({ length: 10 }, (_, i) =>
				createMockTrip({
					id: `trip-${i + 1}`,
					user_id: userId,
					title: `Trip ${i + 1}`,
					created_at: new Date(`2024-01-${String(i + 1).padStart(2, "0")}`),
				}),
			);

			for (const trip of trips) {
				await db.collection(COLLECTIONS.TRIPS).doc(trip.id).set(trip);
			}

			const result = await getAccessibleTrips(
				userId,
				{ limit: 5, includeShared: false },
				db,
			);

			expect(result.trips).toHaveLength(5);
			expect(result.nextCursor).toBeDefined();
		});

		it("should support pagination with cursor", async () => {
			// 複数のTripを作成
			const trips = Array.from({ length: 5 }, (_, i) =>
				createMockTrip({
					id: `trip-${i + 1}`,
					user_id: userId,
					title: `Trip ${i + 1}`,
					created_at: new Date(`2024-01-${String(i + 1).padStart(2, "0")}`),
				}),
			);

			for (const trip of trips) {
				await db.collection(COLLECTIONS.TRIPS).doc(trip.id).set(trip);
			}

			// 最初のページを取得
			const firstResult = await getAccessibleTrips(
				userId,
				{ limit: 2, includeShared: false },
				db,
			);

			expect(firstResult.trips).toHaveLength(2);
			expect(firstResult.nextCursor).toBeDefined();

			// 次のページを取得
			const secondResult = await getAccessibleTrips(
				userId,
				{ limit: 2, cursor: firstResult.nextCursor, includeShared: false },
				db,
			);

			expect(secondResult.trips).toHaveLength(2);
			expect(secondResult.trips[0].id).not.toBe(firstResult.trips[0].id);
			expect(secondResult.trips[0].id).not.toBe(firstResult.trips[1].id);
		});
	});

	describe("フィルタリング", () => {
		it("should filter by status=PLANNING", async () => {
			const planningTrip = createMockTrip({
				id: "planning-trip",
				user_id: userId,
				title: "計画中のTrip",
				status: "PLANNING",
				created_at: new Date("2024-01-01"),
			});

			const activeTrip = createMockTrip({
				id: "active-trip",
				user_id: userId,
				title: "旅行中のTrip",
				status: "ACTIVE",
				start_date: new Date("2024-01-01"),
				end_date: new Date("2024-12-31"),
				created_at: new Date("2024-01-02"),
			});

			await db
				.collection(COLLECTIONS.TRIPS)
				.doc(planningTrip.id)
				.set(planningTrip);
			await db.collection(COLLECTIONS.TRIPS).doc(activeTrip.id).set(activeTrip);

			const result = await getAccessibleTrips(
				userId,
				{ includeShared: false, status: "PLANNING" },
				db,
			);

			expect(result.trips).toHaveLength(1);
			expect(result.trips[0].id).toBe("planning-trip");
		});

		it("should filter by accessLevel=public", async () => {
			const publicTrip = createMockPublicTrip({
				id: "public-trip",
				user_id: userId,
				title: "公開Trip",
				created_at: new Date("2024-01-01"),
			});

			const privateTrip = createMockTrip({
				id: "private-trip",
				user_id: userId,
				title: "プライベートTrip",
				access_level: "private",
				created_at: new Date("2024-01-02"),
			});

			await db.collection(COLLECTIONS.TRIPS).doc(publicTrip.id).set(publicTrip);
			await db
				.collection(COLLECTIONS.TRIPS)
				.doc(privateTrip.id)
				.set(privateTrip);

			const result = await getAccessibleTrips(
				userId,
				{ includeShared: false, accessLevel: "public" },
				db,
			);

			expect(result.trips).toHaveLength(1);
			expect(result.trips[0].id).toBe("public-trip");
		});

		it("should filter by accessLevel=shared", async () => {
			// 自分のTrip
			const ownedTrip = createMockTrip({
				id: "owned-trip",
				user_id: userId,
				title: "自分のTrip",
				created_at: new Date("2024-01-01"),
			});

			// 共有されたTrip
			const sharedTrip = createMockTrip({
				id: "shared-trip",
				user_id: otherUserId,
				title: "共有されたTrip",
				created_at: new Date("2024-01-02"),
			});

			await db.collection(COLLECTIONS.TRIPS).doc(ownedTrip.id).set(ownedTrip);
			await db.collection(COLLECTIONS.TRIPS).doc(sharedTrip.id).set(sharedTrip);

			// trip_usersコレクションに共有情報を追加
			const tripUser = createMockTripUser(sharedTrip.id, userId);
			await db
				.collection(COLLECTIONS.TRIP_USERS)
				.doc(tripUser.id)
				.set(tripUser);

			const result = await getAccessibleTrips(
				userId,
				{ includeShared: true, accessLevel: "shared" },
				db,
			);

			expect(result.trips).toHaveLength(1);
			expect(result.trips[0].id).toBe("shared-trip");
			expect(result.trips[0].user_id).not.toBe(userId);
		});
	});

	describe("エッジケース", () => {
		it("should return empty array when user has no trips", async () => {
			const result = await getAccessibleTrips(
				userId,
				{ includeShared: false },
				db,
			);

			expect(result.trips).toHaveLength(0);
			expect(result.nextCursor).toBeUndefined();
		});

		it("should handle trip_users with more than 10 shared trips (Firestore in query limit)", async () => {
			// 12個の共有Tripを作成
			const sharedTrips = Array.from({ length: 12 }, (_, i) =>
				createMockTrip({
					id: `shared-trip-${i + 1}`,
					user_id: otherUserId,
					title: `共有Trip ${i + 1}`,
					created_at: new Date(`2024-01-${String(i + 1).padStart(2, "0")}`),
				}),
			);

			for (const trip of sharedTrips) {
				await db.collection(COLLECTIONS.TRIPS).doc(trip.id).set(trip);

				// trip_usersコレクションに共有情報を追加
				const tripUser = createMockTripUser(trip.id, userId);
				await db
					.collection(COLLECTIONS.TRIP_USERS)
					.doc(tripUser.id)
					.set(tripUser);
			}

			const result = await getAccessibleTrips(
				userId,
				{ includeShared: true },
				db,
			);

			// 12個すべての共有Tripが取得できることを確認
			expect(result.trips).toHaveLength(12);
			expect(result.trips.every((t) => t.user_id === otherUserId)).toBe(true);
		});
	});
});
