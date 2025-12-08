import { useState } from "react";
import type { PlaceSearchResult } from "@/lib/core/types";

export interface UseSearchResultMarkersOptions {
	map: google.maps.Map | null;
	onPoiDataUpdate?: (poiData: {
		placeId: string;
		name: string;
		location: { lat: number; lng: number };
	} | null) => void;
}

/**
 * 検索結果一覧のピンをDROPアニメーションで順次描画
 * 責務を分離して70行以下を維持
 */
export function useSearchResultMarkers({
	map,
	onPoiDataUpdate,
}: UseSearchResultMarkersOptions) {
	const [searchResultMarkers, setSearchResultMarkers] = useState<any[]>([]);

	const updateSearchResults = (results: PlaceSearchResult[]) => {
		if (!map) return;

		// 既存の検索結果ピンをクリア
		searchResultMarkers.forEach((m) => {
			m.setMap(null);
			if (m.content && m.content.parentNode) {
				m.content.parentNode.removeChild(m.content);
			}
		});
		setSearchResultMarkers([]);

		// 先頭から順にストンストン落とす（最大10件）
		const limited = results.slice(0, 10);
		const newMarkers: any[] = [];

		limited.forEach((r, index) => {
			const pos = r.geometry?.location;
			if (!pos) return;

			setTimeout(() => {
				const pinPath =
					"M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z";
				const scale = 1.25;
				const icon = {
					path: pinPath,
					fillColor: "#F59E0B",
					fillOpacity: 1,
					strokeColor: "#FFFFFF",
					strokeWeight: 2,
					scale,
					anchor: new window.google.maps.Point(12 * scale, 24 * scale),
				} as google.maps.Symbol;

				const mk = new window.google.maps.Marker({
					map,
					position: { lat: pos.lat, lng: pos.lng },
					title: r.name,
					animation: window.google.maps.Animation.DROP,
					icon,
				});

				mk.addListener("click", () => {
					const newPoiData = {
						placeId: r.place_id,
						name: r.name,
						location: { lat: pos.lat, lng: pos.lng },
					};
					onPoiDataUpdate?.(newPoiData);
				});

				newMarkers.push(mk);
				setSearchResultMarkers([...newMarkers]);
			}, index * 120);
		});
	};

	return { updateSearchResults, searchResultMarkers };
}

