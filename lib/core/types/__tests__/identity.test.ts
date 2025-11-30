/**
 * 識別子型のテスト
 *
 * Phase 1-1: 型安全性による混同防止のテスト
 */

import {
	asUserId,
	asUserSlug,
	asTripId,
	asTripSlug,
	isSameUserId,
	isSameUserSlug,
	isSameTripId,
	isSameTripSlug,
	isValidUserId,
	isValidUserSlug,
	isValidTripId,
	isValidTripSlug,
	type UserId,
	type UserSlug,
	type TripId,
	type TripSlug,
} from "../identity";

describe("Identity Types", () => {
	describe("Type Assertions", () => {
		it("should create UserId from string", () => {
			const userId = asUserId("user123");
			expect(typeof userId).toBe("string");
			expect(userId).toBe("user123");
		});

		it("should create UserSlug from string", () => {
			const userSlug = asUserSlug("user-slug");
			expect(typeof userSlug).toBe("string");
			expect(userSlug).toBe("user-slug");
		});

		it("should create TripId from string", () => {
			const tripId = asTripId("trip123");
			expect(typeof tripId).toBe("string");
			expect(tripId).toBe("trip123");
		});

		it("should create TripSlug from string", () => {
			const tripSlug = asTripSlug("trip-slug");
			expect(typeof tripSlug).toBe("string");
			expect(tripSlug).toBe("trip-slug");
		});
	});

	describe("Comparison Functions", () => {
		it("should compare UserId correctly", () => {
			const userId1 = asUserId("user1");
			const userId2 = asUserId("user2");
			const userId1Copy = asUserId("user1");

			expect(isSameUserId(userId1, userId1Copy)).toBe(true);
			expect(isSameUserId(userId1, userId2)).toBe(false);
		});

		it("should compare UserSlug correctly", () => {
			const userSlug1 = asUserSlug("user-slug-1");
			const userSlug2 = asUserSlug("user-slug-2");
			const userSlug1Copy = asUserSlug("user-slug-1");

			expect(isSameUserSlug(userSlug1, userSlug1Copy)).toBe(true);
			expect(isSameUserSlug(userSlug1, userSlug2)).toBe(false);
		});

		it("should compare TripId correctly", () => {
			const tripId1 = asTripId("trip1");
			const tripId2 = asTripId("trip2");
			const tripId1Copy = asTripId("trip1");

			expect(isSameTripId(tripId1, tripId1Copy)).toBe(true);
			expect(isSameTripId(tripId1, tripId2)).toBe(false);
		});

		it("should compare TripSlug correctly", () => {
			const tripSlug1 = asTripSlug("trip-slug-1");
			const tripSlug2 = asTripSlug("trip-slug-2");
			const tripSlug1Copy = asTripSlug("trip-slug-1");

			expect(isSameTripSlug(tripSlug1, tripSlug1Copy)).toBe(true);
			expect(isSameTripSlug(tripSlug1, tripSlug2)).toBe(false);
		});
	});

	describe("Type Guards", () => {
		describe("isValidUserId", () => {
			it("should accept valid UserId format", () => {
				expect(isValidUserId("user12345678901234567890")).toBe(true);
				expect(isValidUserId("abc123XYZ4567890123456")).toBe(true); // 20文字以上
			});

			it("should reject invalid UserId format", () => {
				expect(isValidUserId("short")).toBe(false);
				expect(isValidUserId("user-slug")).toBe(false); // ハイフンを含む
				expect(isValidUserId("")).toBe(false);
			});
		});

		describe("isValidUserSlug", () => {
			it("should accept valid UserSlug format", () => {
				expect(isValidUserSlug("user-slug")).toBe(true);
				expect(isValidUserSlug("user123")).toBe(true);
				expect(isValidUserSlug("user-slug-123")).toBe(true);
			});

			it("should reject invalid UserSlug format", () => {
				expect(isValidUserSlug("UserSlug")).toBe(false); // 大文字を含む
				expect(isValidUserSlug("user_slug")).toBe(false); // アンダースコア
				expect(isValidUserSlug("")).toBe(false);
				expect(isValidUserSlug("a".repeat(51))).toBe(false); // 51文字以上
			});
		});

		describe("isValidTripId", () => {
			it("should accept valid TripId format", () => {
				expect(isValidTripId("trip12345678901234567890")).toBe(true);
				expect(isValidTripId("abc123XYZ4567890123456")).toBe(true); // 20文字以上
			});

			it("should reject invalid TripId format", () => {
				expect(isValidTripId("short")).toBe(false);
				expect(isValidTripId("trip-slug")).toBe(false); // ハイフンを含む
				expect(isValidTripId("")).toBe(false);
			});
		});

		describe("isValidTripSlug", () => {
			it("should accept valid TripSlug format", () => {
				expect(isValidTripSlug("trip-slug")).toBe(true);
				expect(isValidTripSlug("trip123")).toBe(true);
				expect(isValidTripSlug("trip-slug-123")).toBe(true);
			});

			it("should reject invalid TripSlug format", () => {
				expect(isValidTripSlug("TripSlug")).toBe(false); // 大文字を含む
				expect(isValidTripSlug("trip_slug")).toBe(false); // アンダースコア
				expect(isValidTripSlug("")).toBe(false);
				expect(isValidTripSlug("a".repeat(101))).toBe(false); // 101文字以上
			});
		});
	});

	describe("Type Safety", () => {
		it("should prevent mixing UserId and UserSlug in comparison", () => {
			const userId = asUserId("user1");
			const userSlug = asUserSlug("user1");

			// TypeScript のコンパイルエラーを防ぐため、型チェックのみ
			// 実際の比較では異なる型として扱われるため、直接比較はできない
			// このテストは型チェックが機能していることを確認するためのもの

			// 正しい比較方法
			expect(isSameUserId(userId, userId)).toBe(true);
			expect(isSameUserSlug(userSlug, userSlug)).toBe(true);

			// 型が異なるため、以下の比較はコンパイルエラーになる（意図的）
			// expect(userId === userSlug).toBe(true) // ❌ TypeScript エラー
		});

		it("should prevent mixing TripId and TripSlug in comparison", () => {
			const tripId = asTripId("trip1");
			const tripSlug = asTripSlug("trip1");

			// 正しい比較方法
			expect(isSameTripId(tripId, tripId)).toBe(true);
			expect(isSameTripSlug(tripSlug, tripSlug)).toBe(true);

			// 型が異なるため、以下の比較はコンパイルエラーになる（意図的）
			// expect(tripId === tripSlug).toBe(true) // ❌ TypeScript エラー
		});
	});
});
