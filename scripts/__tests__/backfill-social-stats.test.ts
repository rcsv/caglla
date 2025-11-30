/**
 * バックフィルスクリプトのテスト
 *
 * Phase 1-2: Firestoreスキーマ拡張とセキュリティルール（テストファースト）
 *
 * 注意: これらのテストはロジックのテストです。
 * Firestoreエミュレータを使った統合テストは別途実装する必要があります。
 */

import { createMockTrip } from "@/lib/__tests__/helpers/test-data";
import type { TripSocialStats } from "@/lib/core/types/social";
import {
	hasCompleteSocialStats,
	completeSocialStats,
} from "../backfill-social-stats";

describe("backfillSocialStats helpers", () => {
	describe("hasCompleteSocialStats", () => {
		it("should return true for complete social_stats", () => {
			const completeStats: TripSocialStats = {
				likes_count: 5,
				comments_count: 3,
				shares_count: 2,
				views_count: 100,
				replicas_count: 1,
			};

			expect(hasCompleteSocialStats(completeStats)).toBe(true);
		});

		it("should return false for null", () => {
			expect(hasCompleteSocialStats(null)).toBe(false);
		});

		it("should return false for undefined", () => {
			expect(hasCompleteSocialStats(undefined)).toBe(false);
		});

		it("should return false for partial social_stats", () => {
			const partialStats = {
				likes_count: 5,
				// comments_count が欠けている
			};

			expect(hasCompleteSocialStats(partialStats)).toBe(false);
		});

		it("should return false for empty object", () => {
			expect(hasCompleteSocialStats({})).toBe(false);
		});
	});

	describe("completeSocialStats", () => {
		it("should return default stats for null", () => {
			const result = completeSocialStats(null);
			expect(result).toEqual({
				likes_count: 0,
				comments_count: 0,
				shares_count: 0,
				views_count: 0,
				replicas_count: 0,
			});
		});

		it("should return default stats for undefined", () => {
			const result = completeSocialStats(undefined);
			expect(result).toEqual({
				likes_count: 0,
				comments_count: 0,
				shares_count: 0,
				views_count: 0,
				replicas_count: 0,
			});
		});

		it("should preserve existing values and fill missing fields", () => {
			const partialStats = {
				likes_count: 5,
				comments_count: 3,
				// shares_count, views_count, replicas_count が欠けている
			};

			const result = completeSocialStats(partialStats);
			expect(result).toEqual({
				likes_count: 5,
				comments_count: 3,
				shares_count: 0,
				views_count: 0,
				replicas_count: 0,
			});
		});

		it("should preserve all existing values when complete", () => {
			const completeStats: TripSocialStats = {
				likes_count: 5,
				comments_count: 3,
				shares_count: 2,
				views_count: 100,
				replicas_count: 1,
			};

			const result = completeSocialStats(completeStats);
			expect(result).toEqual(completeStats);
		});

		it("should handle non-number values by defaulting to 0", () => {
			const invalidStats = {
				likes_count: "invalid" as unknown as number,
				comments_count: 3,
			};

			const result = completeSocialStats(invalidStats);
			expect(result).toEqual({
				likes_count: 0, // 無効な値は0に
				comments_count: 3,
				shares_count: 0,
				views_count: 0,
				replicas_count: 0,
			});
		});
	});
});
