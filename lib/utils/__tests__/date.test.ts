import { dateUtils } from "../date";
import { t } from "@/lib/i18n";
import type { FirestoreDate } from "@/lib/core/types";

describe("dateUtils", () => {
	describe("isValidDate", () => {
		it("should return true for valid Date object", () => {
			const date = new Date("2024-01-01");
			expect(dateUtils.isValidDate(date)).toBe(true);
		});

		it("should return false for invalid date", () => {
			expect(dateUtils.isValidDate(new Date("invalid"))).toBe(false);
		});

		it("should return false for null", () => {
			expect(dateUtils.isValidDate(null)).toBe(false);
		});

		it("should return false for undefined", () => {
			expect(dateUtils.isValidDate(undefined)).toBe(false);
		});
	});

	describe("formatDate", () => {
		it("should format date correctly", () => {
			const date = new Date("2024-01-01");
			const result = dateUtils.formatDate(date);
			expect(result).toContain("2024");
			expect(result).toContain("1");
		});

		it("should return error message for invalid date", () => {
			expect(dateUtils.formatDate(null as any)).toBe(t("date.notSet", "en"));
		});

		it("should return localized error message when language is specified", () => {
			expect(dateUtils.formatDate(null as any, undefined, "ja")).toBe(
				t("date.notSet", "ja"),
			);
		});

		it("should use custom format options", () => {
			const date = new Date("2024-01-01");
			const result = dateUtils.formatDate(date, {
				year: "numeric",
				month: "short",
			});
			expect(result).toContain("2024");
			expect(result).toContain("1");
		});
	});

	describe("formatDateRange", () => {
		it("should format date range correctly", () => {
			const startDate = new Date("2024-01-01");
			const endDate = new Date("2024-01-03");
			const result = dateUtils.formatDateRange(startDate, endDate);
			expect(result).toBeTruthy();
		});

		it("should return error message for invalid dates", () => {
			expect(dateUtils.formatDateRange(null as any, null as any)).toBe(
				t("date.notSet", "en"),
			);
		});

		it("should return localized error message for invalid dates when language is specified", () => {
			expect(dateUtils.formatDateRange(null as any, null as any, "ja")).toBe(
				t("date.notSet", "ja"),
			);
		});

		it("should format same date correctly", () => {
			const date = new Date("2024-01-01");
			const result = dateUtils.formatDateRange(date, date);
			expect(result).toBe("1/1");
		});
	});

	describe("sortTripsByDate", () => {
		it("should sort trips into future and past correctly", () => {
			const today = new Date();
			const yesterday = new Date(today);
			yesterday.setDate(yesterday.getDate() - 1);

			const tomorrow = new Date(today);
			tomorrow.setDate(tomorrow.getDate() + 1);

			const trips = [
				{ id: "1", start_date: yesterday } as any,
				{ id: "2", start_date: tomorrow } as any,
				{ id: "3", start_date: today } as any,
			];

			const result = dateUtils.sortTripsByDate(trips);
			expect(result.futureTrips.length).toBeGreaterThan(0);
			expect(result.pastTrips.length).toBeGreaterThan(0);
		});

		it("should handle empty array", () => {
			const result = dateUtils.sortTripsByDate([]);
			expect(result.futureTrips).toEqual([]);
			expect(result.pastTrips).toEqual([]);
		});

		it("should sort future trips in ascending order", () => {
			const today = new Date();
			const day1 = new Date(today);
			day1.setDate(day1.getDate() + 1);

			const day2 = new Date(today);
			day2.setDate(day2.getDate() + 2);

			const day3 = new Date(today);
			day3.setDate(day3.getDate() + 3);

			const trips = [
				{ id: "3", start_date: day3 } as any,
				{ id: "1", start_date: day1 } as any,
				{ id: "2", start_date: day2 } as any,
			];

			const result = dateUtils.sortTripsByDate(trips);
			expect(result.futureTrips[0].id).toBe("1");
			expect(result.futureTrips[1].id).toBe("2");
			expect(result.futureTrips[2].id).toBe("3");
		});

		it("should sort past trips in descending order", () => {
			const today = new Date();
			const day1 = new Date(today);
			day1.setDate(day1.getDate() - 1);

			const day2 = new Date(today);
			day2.setDate(day2.getDate() - 2);

			const day3 = new Date(today);
			day3.setDate(day3.getDate() - 3);

			const trips = [
				{ id: "1", start_date: day1 } as any,
				{ id: "3", start_date: day3 } as any,
				{ id: "2", start_date: day2 } as any,
			];

			const result = dateUtils.sortTripsByDate(trips);
			expect(result.pastTrips[0].id).toBe("1");
			expect(result.pastTrips[1].id).toBe("2");
			expect(result.pastTrips[2].id).toBe("3");
		});
	});

	describe("isFutureTrip", () => {
		it("should return true for future dates", () => {
			const tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);
			expect(dateUtils.isFutureTrip(tomorrow)).toBe(true);
		});

		it("should return false for past dates", () => {
			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);
			expect(dateUtils.isFutureTrip(yesterday)).toBe(false);
		});

		it("should return false for null dates", () => {
			expect(dateUtils.isFutureTrip(null)).toBe(false);
		});
	});

	describe("isPastTrip", () => {
		it("should return true for past dates", () => {
			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);
			expect(dateUtils.isPastTrip(yesterday)).toBe(true);
		});

		it("should return false for future dates", () => {
			const tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);
			expect(dateUtils.isPastTrip(tomorrow)).toBe(false);
		});

		it("should return false for null dates", () => {
			expect(dateUtils.isPastTrip(null)).toBe(false);
		});
	});
});
