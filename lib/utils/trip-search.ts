/**
 * 旅行データの検索ユーティリティ
 */

import type { Trip } from "@/lib/core/types";

/**
 * 旅行データを検索する
 * @param trips - 検索対象の旅行配列
 * @param query - 検索クエリ
 * @param searchFields - 検索対象フィールド
 * @returns 検索結果の旅行配列
 */
export function searchTrips(
	trips: Trip[],
	query: string,
	searchFields: Array<
		keyof Trip | "creator.name" | "destination_place.name" | "description"
	> = ["title", "destination", "description", "creator.name"],
): Trip[] {
	if (!query || query.trim().length === 0) {
		return trips;
	}

	const normalizedQuery = query.toLowerCase().trim();

	return trips.filter((trip) => {
		return searchFields.some((field) => {
			let value: string | null | undefined;

			if (field === "creator.name") {
				value = trip.creator?.name;
			} else if (field === "destination_place.name") {
				value = trip.destination_place?.name;
			} else if (field === "description") {
				value = trip.description;
			} else {
				value = trip[field] as string | null | undefined;
			}

			if (!value) return false;
			return value.toLowerCase().includes(normalizedQuery);
		});
	});
}

