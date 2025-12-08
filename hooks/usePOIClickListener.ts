import { useEffect, useRef } from "react";
import { POIDetailsResult } from "./usePOIDetails";

export interface UsePOIClickListenerOptions {
	map: google.maps.Map | null;
	onPOIClick: (poiData: POIDetailsResult) => void;
	fetchPlaceDetails: (
		placeId: string,
		location: { lat: number; lng: number },
	) => Promise<POIDetailsResult>;
}

/**
 * Google MapsのPOIクリックイベントを処理
 * poi_clickイベントとclickイベント（フォールバック）の両方をハンドル
 */
export function usePOIClickListener({
	map,
	onPOIClick,
	fetchPlaceDetails,
}: UsePOIClickListenerOptions) {
	const onPOIClickRef = useRef(onPOIClick);
	const fetchPlaceDetailsRef = useRef(fetchPlaceDetails);

	// 意図的にuseRefで保持（依存配列の警告を避けるため）
	// onPOIClickは親コンポーネントから頻繁に変更される可能性があるが、
	// 最新の参照を常に使用したいためuseRefを使用
	useEffect(() => {
		onPOIClickRef.current = onPOIClick;
	}, [onPOIClick]);

	useEffect(() => {
		fetchPlaceDetailsRef.current = fetchPlaceDetails;
	}, [fetchPlaceDetails]);

	useEffect(() => {
		if (!map) return;

		// clickイベント（フォールバック）
		const clickListener = map.addListener("click", async (event: any) => {
			if (!event.placeId) return;

			try {
				const result = await fetchPlaceDetailsRef.current(
					event.placeId,
					{
						lat: event.latLng.lat(),
						lng: event.latLng.lng(),
					},
				);
				onPOIClickRef.current(result);
			} catch (error) {
				// エラーはfetchPlaceDetails内で処理済み
			}
		});

		// poi_clickイベント（推奨）
		const poiClickListener = map.addListener(
			"poi_click",
			async (event: any) => {
				event.stop();
				if (!event.placeId) return;

				const result: POIDetailsResult = {
					placeId: event.placeId,
					name: event.displayName || "POI",
					location: {
						lat: event.latLng.lat(),
						lng: event.latLng.lng(),
					},
				};
				onPOIClickRef.current(result);
			},
		);

		return () => {
			if (clickListener) {
				google.maps.event.removeListener(clickListener);
			}
			if (poiClickListener) {
				google.maps.event.removeListener(poiClickListener);
			}
		};
	}, [map]);
}

