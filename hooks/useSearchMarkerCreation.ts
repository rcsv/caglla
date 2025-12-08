import { useState } from "react";
import { PlaceData } from "@/lib/core/types";
import { getZoomForPlaceTypes } from "@/lib/travel/map-zoom";
import { smoothMoveToLocation } from "@/lib/travel/map-utils";

export interface UseSearchMarkerCreationOptions {
	map: google.maps.Map | null;
	onPlaceChosen?: (place: PlaceData) => void;
}

/**
 * 検索結果のマーカーを生成
 * 責務を分離して70行以下を維持
 */
export function useSearchMarkerCreation({
	map,
	onPlaceChosen,
}: UseSearchMarkerCreationOptions) {
	const [searchMarker, setSearchMarker] = useState<any>(null);

	const createSearchMarker = (place: PlaceData) => {
		if (!map || !place.geometry?.location) return;

		const { lat, lng } = place.geometry.location;
		const zoom = getZoomForPlaceTypes(place.types);

		// 既存の検索マーカーをクリア
		if (searchMarker) {
			searchMarker.setMap(null);
			if (searchMarker.content && searchMarker.content.parentNode) {
				searchMarker.content.parentNode.removeChild(searchMarker.content);
			}
		}

		// 検索結果用のカスタムマーカー要素を作成
		const searchMarkerElement = document.createElement("div");
		searchMarkerElement.className = "search-result-marker";
		searchMarkerElement.innerHTML = `
      <div class="w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
        <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
        </svg>
      </div>
    `;

		// 新しい検索マーカーを作成
		const marker = new window.google.maps.marker.AdvancedMarkerElement({
			map,
			position: { lat, lng },
			title: place.name,
			content: searchMarkerElement,
		});

		setSearchMarker(marker);
		smoothMoveToLocation(map, lat, lng, zoom);
		onPlaceChosen?.(place);
	};

	return { createSearchMarker, searchMarker };
}

