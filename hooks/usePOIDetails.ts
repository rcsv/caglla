import { useState, useCallback } from "react";
import { PlaceData } from "@/lib/core/types";
import { getUserLanguage } from "@/lib/utils/language";
import { useAuth } from "@/lib/contexts/auth";
import logger from "@/lib/core/logger";

export interface POIDetailsResult {
	placeId: string;
	name: string;
	location: { lat: number; lng: number };
	placeData?: PlaceData;
}

/**
 * Place Details APIを呼び出して詳細情報を取得
 * サーバ側でキャッシュされることを前提とする
 */
export function usePOIDetails() {
	const { user } = useAuth();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchPlaceDetails = useCallback(
		async (placeId: string, location: { lat: number; lng: number }) => {
			setLoading(true);
			setError(null);

			try {
				const language = getUserLanguage(user);
				const response = await fetch("/api/places/details", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						placeId,
						language,
					}),
				});

				if (!response.ok) {
					throw new Error(`Place Details API error: ${response.status}`);
				}

				const data = await response.json();
				if (data.status === "OK" && data.result) {
					const result: POIDetailsResult = {
						placeId,
						name: data.result.name || "POI",
						location,
						placeData: data.result,
					};
					return result;
				} else {
					// フォールバック
					return {
						placeId,
						name: "POI",
						location,
					} as POIDetailsResult;
				}
			} catch (err) {
				logger.error("Error fetching place details:", err);
				setError(err instanceof Error ? err.message : "Unknown error");
				// フォールバック
				return {
					placeId,
					name: "POI",
					location,
				} as POIDetailsResult;
			} finally {
				setLoading(false);
			}
		},
		[user],
	);

	return { fetchPlaceDetails, loading, error };
}

