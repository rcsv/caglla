/**
 * Trip Statistics Operations
 *
 * Tripの統計・集計機能を提供します。
 * コンポーネント内で直接実装されていた統計計算ロジックをライブラリ関数として統一します。
 */

import type { Trip, TripStatus } from "@/lib/core/types";
import { getTripStatus } from "@/lib/utils/trip-status";
import logger from "@/lib/core/logger";

/**
 * Trip統計情報
 */
export interface TripStats {
	/** 合計数 */
	total: number;
	/** プライベートTrip数 */
	private: number;
	/** 共有Trip数（access_level === 'shared'） */
	shared: number;
	/** 公開Trip数 */
	public: number;
	/** テンプレートTrip数 */
	templates: number;
	/** 計画中Trip数 */
	planning: number;
	/** 旅行中Trip数 */
	active: number;
	/** 完了Trip数 */
	completed: number;
	/** キャンセルTrip数 */
	cancelled: number;
}

/**
 * Trip統計情報を計算します
 *
 * @param trips - 統計計算対象のTrip配列
 * @param referenceDate - 基準日時（デフォルト: 現在日時、ステータス計算用）
 * @returns Trip統計情報
 *
 * @example
 * ```typescript
 * const stats = calculateTripStats(trips)
 * console.log(`合計: ${stats.total}件、進行中: ${stats.active}件`)
 * ```
 */
export function calculateTripStats(
	trips: Trip[],
	referenceDate?: Date,
): TripStats {
	const stats: TripStats = {
		total: trips.length,
		private: 0,
		shared: 0,
		public: 0,
		templates: 0,
		planning: 0,
		active: 0,
		completed: 0,
		cancelled: 0,
	};

	for (const trip of trips) {
		// アクセスレベル別の集計
		if (trip.access_level === "private") {
			stats.private++;
		} else if (trip.access_level === "shared") {
			stats.shared++;
		} else if (trip.access_level === "public") {
			stats.public++;
		}

		// テンプレートTripの集計
		if (trip.is_template === true) {
			stats.templates++;
		}

		// ステータス別の集計
		const status = getTripStatus(trip, referenceDate);
		switch (status) {
			case "PLANNING":
				stats.planning++;
				break;
			case "ACTIVE":
				stats.active++;
				break;
			case "COMPLETED":
				stats.completed++;
				break;
			case "CANCELLED":
				stats.cancelled++;
				break;
		}
	}

	logger.debug("Trip stats calculated", {
		total: stats.total,
		byAccessLevel: {
			private: stats.private,
			shared: stats.shared,
			public: stats.public,
		},
		byStatus: {
			planning: stats.planning,
			active: stats.active,
			completed: stats.completed,
			cancelled: stats.cancelled,
		},
		templates: stats.templates,
	});

	return stats;
}
