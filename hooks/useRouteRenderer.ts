import { useEffect } from "react";
import { Itinerary } from "@/lib/core/types";
import { routeOptimizer } from "@/lib/travel/route-optimization";
import logger from "@/lib/core/logger";

export interface UseRouteRendererOptions {
	map: google.maps.Map | null;
	directionsService: google.maps.DirectionsService | null;
	directionsRenderer: google.maps.DirectionsRenderer | null;
	itineraries: Itinerary[];
	selectedItineraryId?: string | null;
}

/**
 * ルート描画を管理
 * 全体ルートと選択されたItinerary間のルートを描画
 */
export function useRouteRenderer({
	map,
	directionsService,
	directionsRenderer,
	itineraries,
	selectedItineraryId,
}: UseRouteRendererOptions) {
	// 全体ルートの描画
	useEffect(() => {
		if (!map || !directionsService || !directionsRenderer) return;

		const validItineraries = itineraries.filter(
			(itinerary) => !!itinerary.place_data?.geometry?.location,
		);

		if (validItineraries.length < 2) {
			directionsRenderer.setMap(null);
			return;
		}

		const waypoints = validItineraries.slice(1, -1).map((itinerary) => ({
			location: {
				lat: itinerary.place_data!.geometry!.location.lat,
				lng: itinerary.place_data!.geometry!.location.lng,
			},
		}));

		routeOptimizer.calculateRouteDebounced(
			{
				origin: `${validItineraries[0].place_data!.geometry!.location.lat},${validItineraries[0].place_data!.geometry!.location.lng}`,
				destination: `${validItineraries[validItineraries.length - 1].place_data!.geometry!.location.lat},${validItineraries[validItineraries.length - 1].place_data!.geometry!.location.lng}`,
				waypoints: waypoints.map(
					(wp) => `${wp.location.lat},${wp.location.lng}`,
				),
				travelMode: "DRIVING",
			},
			directionsService,
			(result: any, status: any) => {
				if (status === "OK") {
					directionsRenderer.setDirections(result);
				}
			},
		);
	}, [map, directionsService, directionsRenderer, itineraries]);

	// 選択されたItinerary間のルート表示
	useEffect(() => {
		if (!map || !directionsService || !directionsRenderer) return;

		// selectedItineraryIdがnullの場合、ルートをクリア
		if (!selectedItineraryId) {
			directionsRenderer.setMap(null);
			return;
		}

		// 選択されたitineraryを見つける
		const selectedIndex = itineraries.findIndex(
			(it) => it.id === selectedItineraryId,
		);
		if (selectedIndex === -1) {
			directionsRenderer.setMap(null);
			return;
		}

		const selectedItinerary = itineraries[selectedIndex];
		const nextItinerary = itineraries[selectedIndex + 1];

		// 次のitineraryが存在しない、または座標がない場合はルートをクリア
		if (
			!nextItinerary ||
			!selectedItinerary.place_data?.geometry?.location ||
			!nextItinerary.place_data?.geometry?.location
		) {
			directionsRenderer.setMap(null);
			return;
		}

		const origin = {
			lat: selectedItinerary.place_data.geometry.location.lat,
			lng: selectedItinerary.place_data.geometry.location.lng,
		};
		const destination = {
			lat: nextItinerary.place_data.geometry.location.lat,
			lng: nextItinerary.place_data.geometry.location.lng,
		};

		// Directions APIを呼び出してルートを取得
		logger.debug("🛣️ TripMap: Requesting route", {
			from: selectedItinerary.title,
			to: nextItinerary.title,
			origin,
			destination,
		});

		directionsService.route(
			{
				origin,
				destination,
				travelMode: window.google.maps.TravelMode.WALKING, // 徒歩ルート
			},
			(result: any, status: any) => {
				if (status === "OK" && result) {
					logger.debug("✅ TripMap: Route found", {
						from: selectedItinerary.title,
						to: nextItinerary.title,
						distance: result.routes[0]?.legs[0]?.distance?.text,
						duration: result.routes[0]?.legs[0]?.duration?.text,
					});
					directionsRenderer.setMap(map);
					directionsRenderer.setDirections(result);
				} else {
					// エラーの場合は無視（道路が繋がっていない場合など）
					logger.debug("⚠️ TripMap: Route not found (ignored)", {
						from: selectedItinerary.title,
						to: nextItinerary.title,
						status,
					});
					directionsRenderer.setMap(null);
				}
			},
		);
	}, [
		map,
		directionsService,
		directionsRenderer,
		itineraries,
		selectedItineraryId,
	]);
}

