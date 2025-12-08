import { useEffect, useRef } from "react";
import { Itinerary, PlaceData } from "@/lib/core/types";

export interface MarkerData {
	marker: google.maps.marker.AdvancedMarkerElement;
	element: HTMLElement;
	itineraryId: string;
}

export interface UseTeardropMarkersOptions {
	map: google.maps.Map | null;
	itineraries: Itinerary[];
	onItineraryClick?: (itineraryId: string) => void;
	onPoiDataUpdate?: (poiData: {
		placeId: string;
		name: string;
		location: { lat: number; lng: number };
		placeData?: PlaceData;
	} | null) => void;
}

/**
 * ティアドロップ形状のマーカーを管理
 * AdvancedMarkerElementの適切な破棄処理を含む
 */
export function useTeardropMarkers({
	map,
	itineraries,
	onItineraryClick,
	onPoiDataUpdate,
}: UseTeardropMarkersOptions) {
	const markersRef = useRef<MarkerData[]>([]);
	const onItineraryClickRef = useRef(onItineraryClick);
	const onPoiDataUpdateRef = useRef(onPoiDataUpdate);

	// 意図的にuseRefで保持（依存配列の警告を避けるため）
	useEffect(() => {
		onItineraryClickRef.current = onItineraryClick;
	}, [onItineraryClick]);

	useEffect(() => {
		onPoiDataUpdateRef.current = onPoiDataUpdate;
	}, [onPoiDataUpdate]);

	useEffect(() => {
		if (!map) return;

		// 既存のマーカーを適切に破棄
		markersRef.current.forEach((markerData) => {
			if (markerData.marker) {
				// Google推奨の方法で破棄
				markerData.marker.setMap(null);
				// DOM要素も明示的に削除（孤児DOMノードを防ぐ）
				if (markerData.element && markerData.element.parentNode) {
					markerData.element.parentNode.removeChild(markerData.element);
				}
			}
		});
		markersRef.current = [];

		// 位置情報があるitinerariesをフィルタリング
		const validItineraries = itineraries.filter(
			(itinerary) => !!itinerary.place_data?.geometry?.location,
		);

		// ティアドロップ形状のマーカーを作成
		const newMarkers = validItineraries.map((itinerary) => {
			const position = {
				lat: itinerary.place_data!.geometry!.location.lat,
				lng: itinerary.place_data!.geometry!.location.lng,
			};

			// ティアドロップ形状のマーカー要素を作成
			const teardropElement = document.createElement("div");
			teardropElement.className = "teardrop-marker";

			// ラベル（番号）を追加
			const labelElement = document.createElement("div");
			labelElement.className = "teardrop-label";
			labelElement.textContent = itinerary.sort_number.toString();
			teardropElement.appendChild(labelElement);

			// AdvancedMarkerElementを作成
			const marker = new window.google.maps.marker.AdvancedMarkerElement({
				map,
				position,
				title: itinerary.title,
				content: teardropElement,
			});

			marker.addListener("click", () => {
				// POIダイアログを表示
				if (itinerary.place_data?.place_id) {
					const newPoiData = {
						placeId: itinerary.place_data.place_id,
						name: itinerary.title,
						location: {
							lat: itinerary.place_data.geometry!.location.lat,
							lng: itinerary.place_data.geometry!.location.lng,
						},
						placeData: itinerary.place_data,
					};
					onPoiDataUpdateRef.current?.(newPoiData);
				}

				// 左ペインのItineraryにスクロール
				onItineraryClickRef.current?.(itinerary.id);
			});

			return { marker, element: teardropElement, itineraryId: itinerary.id };
		});

		markersRef.current = newMarkers;

		// クリーンアップ
		return () => {
			markersRef.current.forEach((markerData) => {
				if (markerData.marker) {
					markerData.marker.setMap(null);
					if (markerData.element && markerData.element.parentNode) {
						markerData.element.parentNode.removeChild(markerData.element);
					}
				}
			});
		};
	}, [map, itineraries]);

	return { markersRef };
}

