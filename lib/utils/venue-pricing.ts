/**
 * 複数のソース（Google Places、TripAdvisor、Foursquare）から
 * 価格レベルを集約するユーティリティ
 */

export interface AggregatedData {
	google?: { price_level?: number };
	tripAdvisor?: { details?: { price_level?: string } };
	foursquare?: { details?: { price?: number } };
}

/**
 * 複数のソース（Google Places、TripAdvisor、Foursquare）から
 * 価格レベルを集約して返す
 *
 * 優先順位:
 * 1. Google Placesの価格レベル（数値 0-4）
 * 2. TripAdvisorの価格レベル（文字列 "$" - "$$$$"）
 * 3. Foursquareの価格レベル（数値 1-4）
 *
 * @param data 集約されたデータ
 * @returns 価格レベル（1-4）またはnull
 */
export function getAggregatedPriceLevel(
	data: AggregatedData | null | undefined,
): number | null {
	if (!data) return null;

	// Google Placesの価格レベル
	if (data.google?.price_level !== undefined) {
		return data.google.price_level;
	}

	// TripAdvisorの価格レベル（文字列 "$" - "$$$$"）
	if (data.tripAdvisor?.details?.price_level) {
		return data.tripAdvisor.details.price_level.length;
	}

	// Foursquareの価格レベル（数値 1-4）
	if (data.foursquare?.details?.price !== undefined) {
		return data.foursquare.details.price;
	}

	return null;
}

