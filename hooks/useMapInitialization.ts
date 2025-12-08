import { useEffect, useState, useRef } from "react";
import { loadGoogleMapsAPI } from "@/lib/api/google/maps-loader";
import { getUserLanguage } from "@/lib/utils/language";
import { useAuth } from "@/lib/contexts/auth";
import logger from "@/lib/core/logger";
import { t } from "@/lib/i18n";

export interface MapInitializationResult {
	map: google.maps.Map | null;
	directionsService: google.maps.DirectionsService | null;
	directionsRenderer: google.maps.DirectionsRenderer | null;
	loading: boolean;
	error: string | null;
}

export interface MapInitializationOptions {
	mapRef: React.RefObject<HTMLDivElement | null>;
	initialCenter?: { lat: number; lng: number };
	onMapInteractionStart?: () => void;
	onUserMovedMap?: (moved: boolean) => void; // 追加
}

export function useMapInitialization({
	mapRef,
	initialCenter,
	onMapInteractionStart,
	onUserMovedMap,
}: MapInitializationOptions): MapInitializationResult {
	const { user } = useAuth();
	const [map, setMap] = useState<google.maps.Map | null>(null);
	const [directionsService, setDirectionsService] =
		useState<google.maps.DirectionsService | null>(null);
	const [directionsRenderer, setDirectionsRenderer] =
		useState<google.maps.DirectionsRenderer | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const onMapInteractionStartRef = useRef(onMapInteractionStart);
	const onUserMovedMapRef = useRef(onUserMovedMap);

	// 意図的にuseRefで保持（依存配列の警告を避けるため）
	// onMapInteractionStartは親コンポーネントから頻繁に変更される可能性があるが、
	// 最新の参照を常に使用したいためuseRefを使用
	useEffect(() => {
		onMapInteractionStartRef.current = onMapInteractionStart;
	}, [onMapInteractionStart]);

	useEffect(() => {
		onUserMovedMapRef.current = onUserMovedMap;
	}, [onUserMovedMap]);

	useEffect(() => {
		let isMounted = true;
		let createdMap: google.maps.Map | null = null;
		let createdDirectionsRenderer: google.maps.DirectionsRenderer | null = null;
		let mapElement: HTMLDivElement | null = null;

		const pointerHandler = () => {
			onMapInteractionStartRef.current?.();
		};

		const initializeMap = async () => {
			try {
				setLoading(true);
				setError(null);

				const language = getUserLanguage(user);
				await loadGoogleMapsAPI(language);

				if (!mapRef.current || !window.google) {
					throw new Error(t("tripMap.loadFailed"));
				}

				mapElement = mapRef.current;

				const defaultCenter = initialCenter || { lat: 35.6762, lng: 139.6503 };
				const newMap = new window.google.maps.Map(mapElement, {
					zoom: 10,
					center: defaultCenter,
					mapTypeControl: false,
					streetViewControl: false,
					fullscreenControl: false,
					zoomControl: true,
					zoomControlOptions: {
						position: window.google.maps.ControlPosition.TOP_RIGHT,
					},
					mapId: "trip-map-teardrop-markers",
					clickableIcons: true,
				});

				const newDirectionsService = new window.google.maps.DirectionsService();
				const newDirectionsRenderer = new window.google.maps.DirectionsRenderer({
					suppressMarkers: true,
					preserveViewport: true,
					polylineOptions: {
						strokeColor: "#3B82F6",
						strokeWeight: 4,
					},
				});

				newDirectionsRenderer.setMap(newMap);

				createdMap = newMap;
				createdDirectionsRenderer = newDirectionsRenderer;

				if (isMounted) {
					setDirectionsService(newDirectionsService);
					setDirectionsRenderer(newDirectionsRenderer);
				}

				// イベントリスナーの設定
				// dragstart → ユーザーが地図を動かした
				newMap.addListener("dragstart", () => {
					onMapInteractionStartRef.current?.();
					onUserMovedMapRef.current?.(true);
				});

				newMap.addListener("zoom_changed", () => {
					onMapInteractionStartRef.current?.();
				});

				if (mapElement) {
					mapElement.addEventListener("pointerdown", pointerHandler, {
						passive: true,
					});
					mapElement.addEventListener("touchstart", pointerHandler, {
						passive: true,
					});
				}

				if (!isMounted) {
					return;
				}

				setMap(newMap);
				setDirectionsService(newDirectionsService);
				setDirectionsRenderer(newDirectionsRenderer);
				setLoading(false);
			} catch (error) {
				if (!isMounted) {
					return;
				}
				logger.error("Google Maps APIの読み込みに失敗しました:", error);
				setError(
					error instanceof Error ? error.message : t("countryMap.loadFailed"),
				);
				setLoading(false);
			}
		};

		initializeMap();

		return () => {
			isMounted = false;
			if (mapElement) {
				mapElement.removeEventListener("pointerdown", pointerHandler);
				mapElement.removeEventListener("touchstart", pointerHandler);
			}
			if (createdDirectionsRenderer) {
				createdDirectionsRenderer.setMap(null);
			}
			if (createdMap && typeof window !== "undefined" && window.google) {
				google.maps.event.clearInstanceListeners(createdMap);
			}
		};
	}, [mapRef, initialCenter, user]);

	return {
		map,
		directionsService,
		directionsRenderer,
		loading,
		error,
	};
}

