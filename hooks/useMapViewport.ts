import { useEffect } from "react";
import { Itinerary } from "@/lib/core/types";
import { getZoomForPlaceTypes } from "@/lib/travel/map-zoom";
import { smoothMoveToLocation } from "@/lib/travel/map-utils";

export interface UseMapViewportOptions {
	map: google.maps.Map | null;
	directionsRenderer: google.maps.DirectionsRenderer | null;
	itineraries: Itinerary[];
	selectedItineraryId?: string | null;
	focusMode?: "all" | "day" | "single";
	scrollSyncEnabled?: boolean;
	userMovedMap?: boolean; // 追加
	initialCenter?: { lat: number; lng: number };
	onProgrammaticMove?: () => void; // プログラムによる移動を通知
}

/**
 * ビューポート管理
 * userMovedMapがtrueの場合は自動フォーカスを抑制
 */
export function useMapViewport({
	map,
	directionsRenderer,
	itineraries,
	selectedItineraryId,
	focusMode,
	scrollSyncEnabled,
	userMovedMap = false, // 追加
	initialCenter,
	onProgrammaticMove,
}: UseMapViewportOptions) {
	useEffect(() => {
		if (!map) return;

		// ユーザーが手動で地図を動かした場合は自動フォーカスを抑制
		if (userMovedMap) {
			return;
		}

		const validItineraries = itineraries.filter(
			(itinerary) => !!itinerary.place_data?.geometry?.location,
		);

		// 個別フォーカスモード
		if (focusMode === "single" && selectedItineraryId) {
			const selectedItinerary = validItineraries.find(
				(it) => it.id === selectedItineraryId,
			);
			if (selectedItinerary) {
				if (directionsRenderer) {
					directionsRenderer.setMap(null);
				}
				const position = {
					lat: selectedItinerary.place_data!.geometry!.location.lat,
					lng: selectedItinerary.place_data!.geometry!.location.lng,
				};
				const zoom = getZoomForPlaceTypes(selectedItinerary.place_data?.types);
				smoothMoveToLocation(
					map,
					position.lat,
					position.lng,
					zoom,
					{
						onMoveStart: () => {
							// プログラムによる移動なのでuserMovedMapをfalseに
							onProgrammaticMove?.();
						},
					},
				);
			}
			return;
		}

		// スクロール連動が停止中は地図位置を自動で動かさない
		if (!scrollSyncEnabled) {
			return;
		}

		// 全体表示モード
		if (validItineraries.length === 1) {
			const only = validItineraries[0];
			const zoom = getZoomForPlaceTypes(only.place_data?.types);
			smoothMoveToLocation(
				map,
				only.place_data!.geometry!.location.lat,
				only.place_data!.geometry!.location.lng,
				zoom,
				{
					onMoveStart: () => {
						onProgrammaticMove?.();
					},
				},
			);
		} else if (validItineraries.length > 1) {
			if (directionsRenderer) {
				directionsRenderer.setMap(map);
			}
			const bounds = new window.google.maps.LatLngBounds();
			validItineraries.forEach((itinerary) => {
				bounds.extend({
					lat: itinerary.place_data!.geometry!.location.lat,
					lng: itinerary.place_data!.geometry!.location.lng,
				});
			});
			map.fitBounds(bounds);
			onProgrammaticMove?.();
		} else if (initialCenter) {
			// 行先が無い場合は初期センターへ
			map.setCenter(initialCenter);
			map.setZoom(11);
			onProgrammaticMove?.();
		}
	}, [
		map,
		directionsRenderer,
		itineraries,
		selectedItineraryId,
		focusMode,
		scrollSyncEnabled,
		userMovedMap, // 追加
		initialCenter,
		onProgrammaticMove,
	]);
}

