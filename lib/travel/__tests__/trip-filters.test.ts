/**
 * Trip Filters のテスト
 *
 * Tripのフィルタリング・分類・ソート機能のテスト
 */

import {
	createMockTrip,
	createMockPublicTrip,
} from "@/lib/__tests__/helpers/test-data";
import type { Trip } from "@/lib/core/types";
import {
	filterOngoingTrips,
	filterUpcomingTrips,
	filterCompletedTrips,
	filterPlanningTrips,
	sortTripsByUpdatedAt,
	sortTripsByCreatedAt,
	sortTripsByStartDate,
	groupTripsByYear,
	filterTripsByStatus,
	filterTripsByAccessLevel,
	filterTrips,
} from "@/lib/travel/trip-filters";

describe("Trip Filters", () => {
	let today: Date;
	let tomorrow: Date;
	let yesterday: Date;
	let nextWeek: Date;
	let lastWeek: Date;

	beforeEach(() => {
		today = new Date();
		today.setHours(0, 0, 0, 0);

		tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);

		yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);

		nextWeek = new Date(today);
		nextWeek.setDate(nextWeek.getDate() + 7);

		lastWeek = new Date(today);
		lastWeek.setDate(lastWeek.getDate() - 7);
	});

	describe("filterOngoingTrips", () => {
		it("should return trips that are currently ongoing", () => {
			const ongoingTrip = createMockTrip({
				id: "ongoing-1",
				start_date: yesterday,
				end_date: tomorrow,
			});

			const futureTrip = createMockTrip({
				id: "future-1",
				start_date: tomorrow,
				end_date: nextWeek,
			});

			const pastTrip = createMockTrip({
				id: "past-1",
				start_date: lastWeek,
				end_date: yesterday,
			});

			const trips: Trip[] = [ongoingTrip, futureTrip, pastTrip];

			const result = filterOngoingTrips(trips);

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe("ongoing-1");
		});

		it("should return empty array when no trips are ongoing", () => {
			const futureTrip = createMockTrip({
				id: "future-1",
				start_date: tomorrow,
				end_date: nextWeek,
			});

			const trips: Trip[] = [futureTrip];

			const result = filterOngoingTrips(trips);

			expect(result).toHaveLength(0);
		});

		it("should handle trips without dates", () => {
			const tripWithoutDates = createMockTrip({
				id: "no-dates-1",
				start_date: undefined,
				end_date: undefined,
			});

			const trips: Trip[] = [tripWithoutDates];

			const result = filterOngoingTrips(trips);

			expect(result).toHaveLength(0);
		});

		it("should accept custom reference date", () => {
			const referenceDate = new Date("2024-06-15");
			const ongoingTrip = createMockTrip({
				id: "ongoing-1",
				start_date: new Date("2024-06-10"),
				end_date: new Date("2024-06-20"),
			});

			const trips: Trip[] = [ongoingTrip];

			const result = filterOngoingTrips(trips, referenceDate);

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe("ongoing-1");
		});
	});

	describe("filterUpcomingTrips", () => {
		it("should return trips that start in the future", () => {
			const upcomingTrip = createMockTrip({
				id: "upcoming-1",
				start_date: tomorrow,
				end_date: nextWeek,
			});

			const pastTrip = createMockTrip({
				id: "past-1",
				start_date: lastWeek,
				end_date: yesterday,
			});

			const trips: Trip[] = [upcomingTrip, pastTrip];

			const result = filterUpcomingTrips(trips);

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe("upcoming-1");
		});

		it("should include trips starting today", () => {
			const tripStartingToday = createMockTrip({
				id: "today-1",
				start_date: today,
				end_date: tomorrow,
			});

			const trips: Trip[] = [tripStartingToday];

			const result = filterUpcomingTrips(trips);

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe("today-1");
		});
	});

	describe("filterCompletedTrips", () => {
		it("should return trips that ended in the past", () => {
			const completedTrip = createMockTrip({
				id: "completed-1",
				start_date: lastWeek,
				end_date: yesterday,
			});

			const ongoingTrip = createMockTrip({
				id: "ongoing-1",
				start_date: yesterday,
				end_date: tomorrow,
			});

			const trips: Trip[] = [completedTrip, ongoingTrip];

			const result = filterCompletedTrips(trips);

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe("completed-1");
		});
	});

	describe("filterPlanningTrips", () => {
		it("should return trips with PLANNING status", () => {
			const planningTrip1 = createMockTrip({
				id: "planning-1",
				start_date: undefined,
				end_date: undefined,
			});

			const planningTrip2 = createMockTrip({
				id: "planning-2",
				start_date: tomorrow,
				end_date: nextWeek,
				status: "PLANNING",
			});

			const activeTrip = createMockTrip({
				id: "active-1",
				start_date: yesterday,
				end_date: tomorrow,
			});

			const trips: Trip[] = [planningTrip1, planningTrip2, activeTrip];

			const result = filterPlanningTrips(trips);

			expect(result.length).toBeGreaterThanOrEqual(1);
			expect(result.some((t) => t.id === "planning-1")).toBe(true);
		});
	});

	describe("sortTripsByUpdatedAt", () => {
		it("should sort trips by updated_at descending", () => {
			const trip1 = createMockTrip({
				id: "trip-1",
				updated_at: new Date("2024-01-01"),
				created_at: new Date("2024-01-01"),
			});

			const trip2 = createMockTrip({
				id: "trip-2",
				updated_at: new Date("2024-01-03"),
				created_at: new Date("2024-01-01"),
			});

			const trip3 = createMockTrip({
				id: "trip-3",
				updated_at: new Date("2024-01-02"),
				created_at: new Date("2024-01-01"),
			});

			const trips: Trip[] = [trip1, trip2, trip3];

			const result = sortTripsByUpdatedAt(trips);

			expect(result[0].id).toBe("trip-2");
			expect(result[1].id).toBe("trip-3");
			expect(result[2].id).toBe("trip-1");
		});

		it("should fallback to created_at when updated_at is missing", () => {
			const trip1 = createMockTrip({
				id: "trip-1",
				updated_at: undefined,
				created_at: new Date("2024-01-01"),
			});

			const trip2 = createMockTrip({
				id: "trip-2",
				updated_at: undefined,
				created_at: new Date("2024-01-02"),
			});

			const trips: Trip[] = [trip1, trip2];

			const result = sortTripsByUpdatedAt(trips);

			expect(result[0].id).toBe("trip-2");
			expect(result[1].id).toBe("trip-1");
		});
	});

	describe("sortTripsByCreatedAt", () => {
		it("should sort trips by created_at descending", () => {
			const trip1 = createMockTrip({
				id: "trip-1",
				created_at: new Date("2024-01-01"),
			});

			const trip2 = createMockTrip({
				id: "trip-2",
				created_at: new Date("2024-01-03"),
			});

			const trip3 = createMockTrip({
				id: "trip-3",
				created_at: new Date("2024-01-02"),
			});

			const trips: Trip[] = [trip1, trip2, trip3];

			const result = sortTripsByCreatedAt(trips);

			expect(result[0].id).toBe("trip-2");
			expect(result[1].id).toBe("trip-3");
			expect(result[2].id).toBe("trip-1");
		});
	});

	describe("sortTripsByStartDate", () => {
		it("should sort trips by start_date ascending", () => {
			const trip1 = createMockTrip({
				id: "trip-1",
				start_date: new Date("2024-01-03"),
			});

			const trip2 = createMockTrip({
				id: "trip-2",
				start_date: new Date("2024-01-01"),
			});

			const trip3 = createMockTrip({
				id: "trip-3",
				start_date: new Date("2024-01-02"),
			});

			const trips: Trip[] = [trip1, trip2, trip3];

			const result = sortTripsByStartDate(trips);

			expect(result[0].id).toBe("trip-2");
			expect(result[1].id).toBe("trip-3");
			expect(result[2].id).toBe("trip-1");
		});
	});

	describe("groupTripsByYear", () => {
		it("should group trips by year", () => {
			const trip2023 = createMockTrip({
				id: "trip-2023",
				start_date: new Date("2023-06-15"),
			});

			const trip2024a = createMockTrip({
				id: "trip-2024a",
				start_date: new Date("2024-01-15"),
			});

			const trip2024b = createMockTrip({
				id: "trip-2024b",
				start_date: new Date("2024-06-15"),
			});

			const trips: Trip[] = [trip2023, trip2024a, trip2024b];

			const result = groupTripsByYear(trips);

			expect(result[2023]).toHaveLength(1);
			expect(result[2023][0].id).toBe("trip-2023");
			expect(result[2024]).toHaveLength(2);
			expect(result[2024].map((t) => t.id)).toContain("trip-2024a");
			expect(result[2024].map((t) => t.id)).toContain("trip-2024b");
		});

		it("should use current year for trips without start_date", () => {
			const currentYear = new Date().getFullYear();
			const tripWithoutDate = createMockTrip({
				id: "trip-no-date",
				start_date: undefined,
			});

			const trips: Trip[] = [tripWithoutDate];

			const result = groupTripsByYear(trips);

			expect(result[currentYear]).toHaveLength(1);
			expect(result[currentYear][0].id).toBe("trip-no-date");
		});
	});

	describe("filterTripsByStatus", () => {
		it("should filter trips by status", () => {
			const planningTrip = createMockTrip({
				id: "planning-1",
				start_date: tomorrow,
				end_date: nextWeek,
			});

			const activeTrip = createMockTrip({
				id: "active-1",
				start_date: yesterday,
				end_date: tomorrow,
			});

			const trips: Trip[] = [planningTrip, activeTrip];

			const planningResult = filterTripsByStatus(trips, "PLANNING");
			expect(planningResult).toHaveLength(1);
			expect(planningResult[0].id).toBe("planning-1");

			const activeResult = filterTripsByStatus(trips, "ACTIVE");
			expect(activeResult).toHaveLength(1);
			expect(activeResult[0].id).toBe("active-1");
		});
	});

	describe("filterTripsByAccessLevel", () => {
		it("should filter trips by access level", () => {
			const privateTrip = createMockTrip({
				id: "private-1",
				access_level: "private",
			});

			const publicTrip = createMockPublicTrip({
				id: "public-1",
				access_level: "public",
			});

			const trips: Trip[] = [privateTrip, publicTrip];

			const privateResult = filterTripsByAccessLevel(trips, "private");
			expect(privateResult).toHaveLength(1);
			expect(privateResult[0].id).toBe("private-1");

			const publicResult = filterTripsByAccessLevel(trips, "public");
			expect(publicResult).toHaveLength(1);
			expect(publicResult[0].id).toBe("public-1");
		});
	});

	describe("filterTrips", () => {
		it("should filter trips by multiple criteria", () => {
			const publicPlanningTrip = createMockPublicTrip({
				id: "public-planning-1",
				start_date: tomorrow,
				end_date: nextWeek,
				access_level: "public",
			});

			const privatePlanningTrip = createMockTrip({
				id: "private-planning-1",
				start_date: tomorrow,
				end_date: nextWeek,
				access_level: "private",
			});

			const publicActiveTrip = createMockPublicTrip({
				id: "public-active-1",
				start_date: yesterday,
				end_date: tomorrow,
				access_level: "public",
			});

			const trips: Trip[] = [
				publicPlanningTrip,
				privatePlanningTrip,
				publicActiveTrip,
			];

			// 公開 + 計画中のTrip
			const result = filterTrips(trips, {
				status: "PLANNING",
				accessLevel: "public",
			});

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe("public-planning-1");
		});

		it("should filter trips by date range", () => {
			const tripInRange = createMockTrip({
				id: "in-range-1",
				start_date: new Date("2024-06-10"),
				end_date: new Date("2024-06-20"),
			});

			const tripBeforeRange = createMockTrip({
				id: "before-range-1",
				start_date: new Date("2024-05-10"),
				end_date: new Date("2024-05-20"),
			});

			const trips: Trip[] = [tripInRange, tripBeforeRange];

			const result = filterTrips(trips, {
				startDate: new Date("2024-06-01"),
				endDate: new Date("2024-06-30"),
			});

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe("in-range-1");
		});
	});
});
