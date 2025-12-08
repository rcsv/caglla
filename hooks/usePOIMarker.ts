import { useEffect, useRef } from "react";

export interface POIData {
	placeId: string;
	name: string;
	location: { lat: number; lng: number };
	placeData?: any;
}

export interface UsePOIMarkerOptions {
	map: google.maps.Map | null;
	poiData: POIData | null;
	selectedItineraryId?: string | null;
	itineraries: any[];
}

/**
 * POIダイアログ用の一時マーカーを制御
 * AdvancedMarkerElementの適切な破棄処理を含む
 */
export function usePOIMarker({
	map,
	poiData,
	selectedItineraryId,
	itineraries,
}: UsePOIMarkerOptions) {
	const poiMarkerRef = useRef<any>(null);

	useEffect(() => {
		if (!map) return;

		const cleanupMarker = () => {
			if (poiMarkerRef.current) {
				poiMarkerRef.current.setMap(null);
				if (
					poiMarkerRef.current.content &&
					poiMarkerRef.current.content.parentNode
				) {
					poiMarkerRef.current.content.parentNode.removeChild(
						poiMarkerRef.current.content,
					);
				}
				poiMarkerRef.current = null;
			}
		};

		cleanupMarker();

		if (!poiData) {
			return cleanupMarker;
		}

		const selectedItinerary = selectedItineraryId
			? itineraries.find((itinerary) => itinerary.id === selectedItineraryId)
			: null;
		const selectedPlaceId = selectedItinerary?.place_data?.place_id;

		// 選択中Itineraryと同一の場所であれば既存マーカーで十分なので表示しない
		if (
			selectedPlaceId &&
			poiData.placeId &&
			poiData.placeId === selectedPlaceId
		) {
			return cleanupMarker;
		}

		const positionSource =
			poiData.placeData?.geometry?.location || poiData.location;
		const rawLat = positionSource?.lat;
		const rawLng = positionSource?.lng;
		const lat = typeof rawLat === "function" ? rawLat() : rawLat;
		const lng = typeof rawLng === "function" ? rawLng() : rawLng;

		if (
			typeof lat !== "number" ||
			typeof lng !== "number" ||
			Number.isNaN(lat) ||
			Number.isNaN(lng)
		) {
			return cleanupMarker;
		}

		// POIマーカーの作成
		const markerContainer = document.createElement("div");
		markerContainer.style.position = "relative";
		markerContainer.style.transform = "translate(-50%, -100%)";

		const markerBody = document.createElement("div");
		markerBody.style.width = "22px";
		markerBody.style.height = "22px";
		markerBody.style.borderRadius = "9999px";
		markerBody.style.backgroundColor = "#2563eb";
		markerBody.style.border = "3px solid #ffffff";
		markerBody.style.boxShadow = "0 6px 12px rgba(37, 99, 235, 0.35)";
		markerBody.style.display = "flex";
		markerBody.style.alignItems = "center";
		markerBody.style.justifyContent = "center";

		const markerInner = document.createElement("div");
		markerInner.style.width = "6px";
		markerInner.style.height = "6px";
		markerInner.style.borderRadius = "9999px";
		markerInner.style.backgroundColor = "#ffffff";

		markerBody.appendChild(markerInner);

		const markerStem = document.createElement("div");
		markerStem.style.position = "absolute";
		markerStem.style.bottom = "-10px";
		markerStem.style.left = "50%";
		markerStem.style.transform = "translateX(-50%)";
		markerStem.style.width = "2px";
		markerStem.style.height = "12px";
		markerStem.style.backgroundColor = "#2563eb";

		markerContainer.appendChild(markerBody);
		markerContainer.appendChild(markerStem);

		const marker = new window.google.maps.marker.AdvancedMarkerElement({
			map,
			position: { lat, lng },
			content: markerContainer,
			zIndex: 600,
		});

		poiMarkerRef.current = marker;

		return cleanupMarker;
	}, [map, poiData, selectedItineraryId, itineraries]);
}

