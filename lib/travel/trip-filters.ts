/**
 * Trip Filtering and Classification Operations
 *
 * Tripのフィルタリング・分類・ソート機能を提供します。
 * コンポーネント内で直接実装されていたロジックをライブラリ関数として統一します。
 */

import type { Trip, TripStatus, AccessLevel } from "@/lib/core/types";
import { toDateOrNull } from "@/lib/firebase/timestamp-utils";
import { getTripStatus } from "@/lib/utils/trip-status";
import { dateUtils } from "@/lib/utils/date";
import logger from "@/lib/core/logger";

/**
 * フィルタリングオプション
 */
export interface FilterOptions {
	status?: TripStatus;
	accessLevel?: AccessLevel | "private" | "shared" | "public";
	startDate?: Date;
	endDate?: Date;
}

/**
 * 進行中のTripを取得します
 *
 * 判定条件: `start_date <= referenceDate <= end_date`
 *
 * @param trips - フィルタリング対象のTrip配列
 * @param referenceDate - 基準日時（デフォルト: 現在日時）
 * @returns 進行中のTrip配列
 *
 * @example
 * ```typescript
 * const ongoingTrips = filterOngoingTrips(trips)
 * // または特定の日付を基準にする場合
 * const ongoingTrips = filterOngoingTrips(trips, new Date('2024-12-25'))
 * ```
 */
export function filterOngoingTrips(
	trips: Trip[],
	referenceDate?: Date,
): Trip[] {
	const today = referenceDate ? new Date(referenceDate) : dateUtils.getToday();
	today.setHours(0, 0, 0, 0);

	return trips.filter((trip) => {
		// テンプレートは Ongoing に表示しない
		if (trip.is_template === true) return false;

		const startDate = toDateOrNull(trip.start_date);
		const endDate = toDateOrNull(trip.end_date);
		if (!startDate || !endDate) return false;

		const normalizedStartDate = new Date(startDate);
		normalizedStartDate.setHours(0, 0, 0, 0);

		const normalizedEndDate = new Date(endDate);
		normalizedEndDate.setHours(0, 0, 0, 0);
		
		// end_date が start_date より前の場合は除外
		if (normalizedEndDate < normalizedStartDate) return false;
		
		// end_date はその日の終わり（23:59:59.999）として扱うため、次の日の00:00:00と比較
		normalizedEndDate.setDate(normalizedEndDate.getDate() + 1);

		return normalizedStartDate <= today && today < normalizedEndDate;
	});
}

/**
 * 近日のTripを取得します（未来のTripのみ）
 *
 * 判定条件: `start_date >= referenceDate`
 *
 * @param trips - フィルタリング対象のTrip配列
 * @param referenceDate - 基準日時（デフォルト: 現在日時）
 * @returns 近日のTrip配列
 *
 * @example
 * ```typescript
 * const upcomingTrips = filterUpcomingTrips(trips)
 * ```
 */
export function filterUpcomingTrips(
	trips: Trip[],
	referenceDate?: Date,
): Trip[] {
	const today = referenceDate ? new Date(referenceDate) : dateUtils.getToday();
	today.setHours(0, 0, 0, 0);

	return trips.filter((trip) => {
		// テンプレートは Upcoming に表示しない
		if (trip.is_template === true) return false;

		const startDate = toDateOrNull(trip.start_date);
		if (!startDate) return false;

		const normalizedStartDate = new Date(startDate);
		normalizedStartDate.setHours(0, 0, 0, 0);

		return normalizedStartDate >= today;
	});
}

/**
 * 完了したTripを取得します
 *
 * 判定条件: `end_date < referenceDate`
 *
 * @param trips - フィルタリング対象のTrip配列
 * @param referenceDate - 基準日時（デフォルト: 現在日時）
 * @returns 完了したTrip配列
 *
 * @example
 * ```typescript
 * const completedTrips = filterCompletedTrips(trips)
 * ```
 */
export function filterCompletedTrips(
	trips: Trip[],
	referenceDate?: Date,
): Trip[] {
	const today = referenceDate ? new Date(referenceDate) : dateUtils.getToday();
	today.setHours(0, 0, 0, 0);

	return trips.filter((trip) => {
		const endDate = toDateOrNull(trip.end_date);
		if (!endDate) return false;

		const normalizedEndDate = new Date(endDate);
		normalizedEndDate.setHours(0, 0, 0, 0);

		return normalizedEndDate < today;
	});
}

/**
 * 計画中のTripを取得します
 *
 * 判定条件: `getTripStatus(trip) === 'PLANNING'`
 *
 * @param trips - フィルタリング対象のTrip配列
 * @param referenceDate - 基準日時（デフォルト: 現在日時）
 * @returns 計画中のTrip配列
 *
 * @example
 * ```typescript
 * const planningTrips = filterPlanningTrips(trips)
 * ```
 */
export function filterPlanningTrips(
	trips: Trip[],
	referenceDate?: Date,
): Trip[] {
	return trips.filter((trip) => {
		return getTripStatus(trip, referenceDate) === "PLANNING";
	});
}

/**
 * 更新日時でソート（降順）
 *
 * `updated_at` が存在する場合は `updated_at`、なければ `created_at` を使用します。
 *
 * @param trips - ソート対象のTrip配列
 * @returns ソート済みのTrip配列（更新日時の新しい順）
 *
 * @example
 * ```typescript
 * const sortedTrips = sortTripsByUpdatedAt(trips)
 * ```
 */
export function sortTripsByUpdatedAt(trips: Trip[]): Trip[] {
	return [...trips].sort((a, b) => {
		const aDate = toDateOrNull(a.updated_at || a.created_at);
		const bDate = toDateOrNull(b.updated_at || b.created_at);
		if (!aDate || !bDate) return 0;
		return bDate.getTime() - aDate.getTime();
	});
}

/**
 * 作成日時でソート（降順）
 *
 * @param trips - ソート対象のTrip配列
 * @returns ソート済みのTrip配列（作成日時の新しい順）
 *
 * @example
 * ```typescript
 * const sortedTrips = sortTripsByCreatedAt(trips)
 * ```
 */
export function sortTripsByCreatedAt(trips: Trip[]): Trip[] {
	return [...trips].sort((a, b) => {
		const aDate = toDateOrNull(a.created_at);
		const bDate = toDateOrNull(b.created_at);
		if (!aDate || !bDate) return 0;
		return bDate.getTime() - aDate.getTime();
	});
}

/**
 * 開始日でソート（昇順）
 *
 * @param trips - ソート対象のTrip配列
 * @returns ソート済みのTrip配列（開始日の早い順）
 *
 * @example
 * ```typescript
 * const sortedTrips = sortTripsByStartDate(trips)
 * ```
 */
export function sortTripsByStartDate(trips: Trip[]): Trip[] {
	return [...trips].sort((a, b) => {
		const aDate = toDateOrNull(a.start_date);
		const bDate = toDateOrNull(b.start_date);
		if (!aDate || !bDate) return 0;
		return aDate.getTime() - bDate.getTime();
	});
}

/**
 * 年別にグループ化します
 *
 * `start_date` の年を基準にグループ化します。
 * `start_date` が存在しない場合は現在の年を使用します。
 *
 * @param trips - グループ化対象のTrip配列
 * @returns 年をキーとしたTrip配列のマップ
 *
 * @example
 * ```typescript
 * const tripsByYear = groupTripsByYear(trips)
 * // { 2024: [...trips], 2023: [...trips], ... }
 * ```
 */
export function groupTripsByYear(trips: Trip[]): Record<number, Trip[]> {
	const today = new Date();
	const currentYear = today.getFullYear();

	return trips.reduce(
		(acc, trip) => {
			const startDate = trip.start_date ? toDateOrNull(trip.start_date) : null;
			const year = startDate ? startDate.getFullYear() : currentYear;

			if (!acc[year]) {
				acc[year] = [];
			}
			acc[year].push(trip);
			return acc;
		},
		{} as Record<number, Trip[]>,
	);
}

/**
 * ステータス別にフィルタリングします
 *
 * @param trips - フィルタリング対象のTrip配列
 * @param status - フィルタリングするステータス
 * @param referenceDate - 基準日時（デフォルト: 現在日時）
 * @returns フィルタリング済みのTrip配列
 *
 * @example
 * ```typescript
 * const activeTrips = filterTripsByStatus(trips, 'ACTIVE')
 * ```
 */
export function filterTripsByStatus(
	trips: Trip[],
	status: TripStatus,
	referenceDate?: Date,
): Trip[] {
	return trips.filter((trip) => {
		return getTripStatus(trip, referenceDate) === status;
	});
}

/**
 * アクセスレベル別にフィルタリングします
 *
 * @param trips - フィルタリング対象のTrip配列
 * @param accessLevel - フィルタリングするアクセスレベル
 * @returns フィルタリング済みのTrip配列
 *
 * @example
 * ```typescript
 * const publicTrips = filterTripsByAccessLevel(trips, 'public')
 * const privateTrips = filterTripsByAccessLevel(trips, 'private')
 * ```
 */
export function filterTripsByAccessLevel(
	trips: Trip[],
	accessLevel: AccessLevel | "private" | "shared" | "public",
): Trip[] {
	return trips.filter((trip) => {
		return trip.access_level === accessLevel;
	});
}

/**
 * 複合フィルタリング
 *
 * 複数の条件を組み合わせてフィルタリングします。
 *
 * @param trips - フィルタリング対象のTrip配列
 * @param options - フィルタリングオプション
 * @param referenceDate - 基準日時（デフォルト: 現在日時）
 * @returns フィルタリング済みのTrip配列
 *
 * @example
 * ```typescript
 * const filteredTrips = filterTrips(trips, {
 *   status: 'ACTIVE',
 *   accessLevel: 'public'
 * })
 * ```
 */
export function filterTrips(
	trips: Trip[],
	options: FilterOptions,
	referenceDate?: Date,
): Trip[] {
	let result = [...trips];

	// ステータスでフィルタリング
	if (options.status) {
		result = filterTripsByStatus(result, options.status, referenceDate);
	}

	// アクセスレベルでフィルタリング
	if (options.accessLevel) {
		result = filterTripsByAccessLevel(result, options.accessLevel);
	}

	// 開始日でフィルタリング（指定日以降）
	if (options.startDate) {
		const startDate = new Date(options.startDate);
		startDate.setHours(0, 0, 0, 0);
		result = result.filter((trip) => {
			const tripStartDate = toDateOrNull(trip.start_date);
			if (!tripStartDate) return false;
			const normalizedTripStartDate = new Date(tripStartDate);
			normalizedTripStartDate.setHours(0, 0, 0, 0);
			return normalizedTripStartDate >= startDate;
		});
	}

	// 終了日でフィルタリング（指定日以前）
	if (options.endDate) {
		const endDate = new Date(options.endDate);
		endDate.setHours(0, 0, 0, 0);
		result = result.filter((trip) => {
			const tripEndDate = toDateOrNull(trip.end_date);
			if (!tripEndDate) return false;
			const normalizedTripEndDate = new Date(tripEndDate);
			normalizedTripEndDate.setHours(0, 0, 0, 0);
			return normalizedTripEndDate <= endDate;
		});
	}

	logger.debug("Trips filtered", {
		originalCount: trips.length,
		filteredCount: result.length,
		options,
	});

	return result;
}
