/**
 * Tripの進行状態を計算するヘルパー関数
 */

import type { Trip, TripStatus } from "@/lib/core/types";
import { toDateOrNull } from "@/lib/firebase/timestamp-utils";

/**
 * Tripが現在進行中かどうかを判定
 * @param trip - 判定するTripオブジェクト
 * @param referenceDate - 基準日時（デフォルト: 現在日時、テスト用に指定可能）
 * @returns 進行中の場合true
 */
export function isTripActive(trip: Trip, referenceDate?: Date): boolean {
	return getTripStatus(trip, referenceDate) === "ACTIVE";
}

/**
 * Tripの進行状態を計算する
 *
 * 判定ロジック:
 * 1. `is_cancelled === true` → `'CANCELLED'`
 * 2. 日付が未設定 → `'PLANNING'`
 * 3. `start_date <= 今日 <= end_date` → `'ACTIVE'`
 * 4. `end_date < 今日` → `'COMPLETED'`
 * 5. `start_date > 今日` → `'PLANNING'`
 *
 * @param trip - 状態を判定するTripオブジェクト
 * @param referenceDate - 基準日時（デフォルト: 現在日時、テスト用に指定可能）
 * @returns TripStatus
 *
 * @example
 * ```typescript
 * const status = getTripStatus(trip)
 * if (status === 'ACTIVE') {
 *   // 旅行中の処理
 * }
 * ```
 */
export function getTripStatus(trip: Trip, referenceDate?: Date): TripStatus {
	// 1. キャンセルチェック
	if (trip.is_cancelled === true) {
		return "CANCELLED";
	}

	// 2. 日付が未設定の場合は計画中
	if (!trip.start_date || !trip.end_date) {
		return "PLANNING";
	}

	const startDate = toDateOrNull(trip.start_date);
	const endDate = toDateOrNull(trip.end_date);

	if (!startDate || !endDate) {
		return "PLANNING";
	}

	// 3. 基準日時を取得（デフォルト: 現在）
	const today = referenceDate ? new Date(referenceDate) : new Date();
	today.setHours(0, 0, 0, 0);

	// 日付の時分秒を0にリセット（日付比較のみ）
	const normalizedStartDate = new Date(startDate);
	normalizedStartDate.setHours(0, 0, 0, 0);

	const normalizedEndDate = new Date(endDate);
	normalizedEndDate.setHours(0, 0, 0, 0);

	// 4. 旅行中かどうか（start_date <= 今日 <= end_date）
	if (normalizedStartDate <= today && today <= normalizedEndDate) {
		return "ACTIVE";
	}

	// 5. 完了かどうか（end_date < 今日）
	if (normalizedEndDate < today) {
		return "COMPLETED";
	}

	// 6. 計画中（start_date > 今日）
	return "PLANNING";
}
