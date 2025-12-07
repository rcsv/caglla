/**
 * Homeページ用のTripフィルタリング・ソートフック
 */

import { useMemo } from "react";
import type { Trip } from "@/lib/core/types";
import {
	filterOngoingTrips,
	filterUpcomingTrips,
	sortTripsByUpdatedAt,
	sortTripsByStartDate,
} from "@/lib/travel/trip-filters";

interface UseHomeTripsOptions {
	excludeTemplates?: boolean;
	maxOngoing?: number;
	maxUpcoming?: number;
}

/**
 * Homeページで使用する進行中・近日のTripを取得
 * @param trips - 全Trip配列
 * @param referenceDateForUpcoming - 近日判定の基準日
 * @param options - オプション
 * @returns フィルタリング・ソート済みのTrip配列
 */
export function useHomeTrips(
	trips: Trip[],
	referenceDateForUpcoming: Date,
	options: UseHomeTripsOptions = {},
) {
	const {
		excludeTemplates = true,
		maxOngoing = 3,
		maxUpcoming = 3,
	} = options;

	// テンプレート除外
	const nonTemplateTrips = useMemo(
		() =>
			excludeTemplates
				? trips.filter((trip) => trip.is_template !== true)
				: trips,
		[trips, excludeTemplates],
	);

	// 最近更新順にソート
	const tripsSortedByRecent = useMemo(
		() => sortTripsByUpdatedAt(nonTemplateTrips),
		[nonTemplateTrips],
	);

	// 進行中のTrip
	const ongoingTrips = useMemo(
		() => filterOngoingTrips(tripsSortedByRecent),
		[tripsSortedByRecent],
	);

	const activeTrips = useMemo(
		() => ongoingTrips.slice(0, maxOngoing),
		[ongoingTrips, maxOngoing],
	);

	// 近日のTrip
	const upcomingTrips = useMemo(
		() =>
			sortTripsByStartDate(
				filterUpcomingTrips(trips, referenceDateForUpcoming),
			).slice(0, maxUpcoming),
		[trips, referenceDateForUpcoming, maxUpcoming],
	);

	return {
		activeTrips,
		upcomingTrips,
	};
}

