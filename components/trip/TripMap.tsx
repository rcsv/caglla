"use client";
import logger from "@/lib/core/logger";

import { useRef, useState } from "react";
import type { Itinerary, Trip, PlaceData } from "@/lib/core/types";
import type { PlaceSearchResult } from "@/lib/core/types";
import { getZIndexClass } from "@/lib/core/z-index";
import POIDialog from "@/components/modals/POIDialog";
import MapSearchOverlay from "./MapSearchOverlay";
import Loading from "@/components/common/Loading";
import { t } from "@/lib/i18n";
import { useMapInitialization } from "@/hooks/useMapInitialization";
import { usePOIDetails } from "@/hooks/usePOIDetails";
import { usePOIClickListener } from "@/hooks/usePOIClickListener";
import { useTeardropMarkers } from "@/hooks/useTeardropMarkers";
import { useSelectedMarkerHighlight } from "@/hooks/useSelectedMarkerHighlight";
import { useRouteRenderer } from "@/hooks/useRouteRenderer";
import { useMapViewport } from "@/hooks/useMapViewport";
import { useSearchMarkerCreation } from "@/hooks/useSearchMarkerCreation";
import { useSearchResultMarkers } from "@/hooks/useSearchResultMarkers";
import { usePOIMarker } from "@/hooks/usePOIMarker";
import { useTripMapState } from "@/hooks/useTripMapState";

interface TripMapProps {
	itineraries: Itinerary[];
	trip?: Trip; // 追加: Day 一覧を取得するために必要
	selectedItineraryId?: string | null;
	selectedDayId?: string | null;
	onItineraryClick?: (itineraryId: string) => void;
	onPoiDataUpdate?: (
		poiData: {
			placeId: string;
			name: string;
			location: { lat: number; lng: number };
			placeData?: PlaceData;
		} | null,
	) => void;
	onAddFromPOI?: (placeId: string, dayId: string) => Promise<void>; // POIから追加する際のハンドラー
	poiData?: {
		placeId: string;
		name: string;
		location: { lat: number; lng: number };
		placeData?: PlaceData;
	} | null;
	className?: string;
	focusMode?: "all" | "day" | "single"; // フォーカスモードを追加
	initialCenter?: { lat: number; lng: number }; // 初期センター位置（未指定時は東京）
	// 追加: 地図操作を親へ通知（スクロール連動の即停止用）
	onMapInteractionStart?: () => void;
	// 追加: スクロール連動状態と明示的再開の要求
	scrollSyncEnabled?: boolean;
	onRequestEnableScrollSync?: () => void;
}

declare global {
	interface Window {
		google: typeof google;
		initMap: () => void;
	}
}

export default function TripMap({
	itineraries,
	trip,
	selectedItineraryId = null,
	selectedDayId = null,
	onItineraryClick,
	onPoiDataUpdate,
	onAddFromPOI,
	poiData,
	className = "",
	focusMode = "all", // デフォルトは全体表示
	initialCenter,
	onMapInteractionStart,
	scrollSyncEnabled,
	onRequestEnableScrollSync: _onRequestEnableScrollSync,
}: TripMapProps) {
	const mapRef = useRef<HTMLDivElement | null>(null);

	// 状態管理の統合
	const { state, actions } = useTripMapState({
		focusMode: focusMode || "all",
		selectedItineraryId: selectedItineraryId || null,
		scrollSyncEnabled: scrollSyncEnabled ?? true,
		poiData: poiData || null,
	});

	// 地図初期化
	const {
		map,
		directionsService,
		directionsRenderer,
		loading,
		error,
	} = useMapInitialization({
		mapRef,
		initialCenter,
		onMapInteractionStart: () => {
			actions.setScrollSync(false);
			onMapInteractionStart?.();
		},
		onUserMovedMap: (moved) => {
			actions.userMovedMap(moved);
		},
	});

	// POI処理
	const { fetchPlaceDetails } = usePOIDetails();
	const [internalPoiData, setInternalPoiData] = useState<{
		placeId: string;
		name: string;
		location: { lat: number; lng: number };
		placeData?: PlaceData;
	} | null>(null);

	usePOIClickListener({
		map,
		onPOIClick: (poiData) => {
			const poiDataWithPlaceData = {
				...poiData,
				placeData: poiData.placeData,
			};
			setInternalPoiData(poiDataWithPlaceData);
			actions.setPoiData(poiDataWithPlaceData);
			onPoiDataUpdate?.(poiDataWithPlaceData);
		},
		fetchPlaceDetails,
	});

	// マーカー管理
	const { markersRef } = useTeardropMarkers({
		map,
		itineraries,
		onItineraryClick: (id) => {
			actions.selectItinerary(id);
			onItineraryClick?.(id);
		},
		onPoiDataUpdate: (data) => {
			if (data) {
				setInternalPoiData(data);
				actions.setPoiData(data);
				onPoiDataUpdate?.(data);
			} else {
				setInternalPoiData(null);
				actions.setPoiData(null);
				onPoiDataUpdate?.(null);
			}
		},
	});

	useSelectedMarkerHighlight({
		markersRef,
		selectedItineraryId: state.selectedItineraryId,
	});

	// ルート描画
	useRouteRenderer({
		map,
		directionsService,
		directionsRenderer,
		itineraries,
		selectedItineraryId: state.selectedItineraryId,
	});

	// ビューポート管理
	useMapViewport({
		map,
		directionsRenderer,
		itineraries,
		selectedItineraryId: state.selectedItineraryId,
		focusMode: state.focusMode,
		scrollSyncEnabled: state.scrollSyncEnabled,
		userMovedMap: state.userMovedMap,
		initialCenter,
		onProgrammaticMove: () => {
			// プログラムによる移動なのでuserMovedMapをfalseに
			actions.userMovedMap(false);
		},
	});

	// 検索機能
	const { createSearchMarker } = useSearchMarkerCreation({
		map,
		onPlaceChosen: () => {
			// 検索結果選択時の処理（必要に応じて追加）
		},
	});

	const { updateSearchResults } = useSearchResultMarkers({
		map,
		onPoiDataUpdate: (data) => {
			if (data) {
				setInternalPoiData(data);
				actions.setPoiData(data);
				onPoiDataUpdate?.(data);
			}
		},
	});

	// POIマーカー管理
	usePOIMarker({
		map,
		poiData: poiData || state.poiData || internalPoiData,
		selectedItineraryId: state.selectedItineraryId,
		itineraries,
	});

	// 地図の現在のビューポートを取得する関数
	const getMapViewport = () => {
		if (!map) return { center: undefined, bounds: undefined };

		const center = map.getCenter();
		// getBoundsは型定義に存在しないため、anyとして扱う
		const bounds = (map as any).getBounds?.();

		return {
			center: center ? { lat: center.lat(), lng: center.lng() } : undefined,
			bounds: bounds
				? {
						north: bounds.getNorthEast().lat(),
						south: bounds.getSouthWest().lat(),
						east: bounds.getNorthEast().lng(),
						west: bounds.getSouthWest().lng(),
					}
				: undefined,
		};
	};

	// 検索結果の場所にパン・ズームするハンドラー
	const handleSearchPlaceChosen = (place: PlaceData) => {
		createSearchMarker(place);
		actions.setScrollSync(false);
		onMapInteractionStart?.();
	};

	// 検索結果一覧のピンをDROPアニメーションで順次描画
	const handleSearchResultsUpdated = (results: PlaceSearchResult[]) => {
		updateSearchResults(results);
	};


	return (
		<div className={`relative ${className}`}>
			{loading && (
				<div
					className={`absolute inset-0 bg-gray-100 ${getZIndexClass("MAIN_CONTENT")}`}
				>
					<Loading
						center
						size="sm"
						color="blue"
						message={t("loading.mapLoading")}
					/>
				</div>
			)}

			{error && (
				<div
					className={`absolute inset-0 bg-red-50 flex items-center justify-center ${getZIndexClass("MAIN_CONTENT")}`}
				>
					<div className="text-center p-4">
						<div className="text-red-500 text-lg mb-2">
							{t("tripMap.loadFailedWarning")}
						</div>
						<p className="text-sm text-red-600 mb-4">{error}</p>
						<button
							type="button"
							onClick={() => window.location.reload()}
							className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
						>
							ページを再読み込み
						</button>
					</div>
				</div>
			)}

			<div ref={mapRef} className="w-full h-full" />

			{/* 検索オーバーレイ */}
			<MapSearchOverlay
				onPlaceChosen={handleSearchPlaceChosen}
				getMapViewport={getMapViewport}
				onSearchResultsUpdated={handleSearchResultsUpdated}
				hideSuggestions
				placeholder={t("placeSearch.placeholder")}
				position="top-left"
			/>

			{/* マップのオーバーレイ情報 */}
			<div
				className={`absolute top-4 right-4 max-w-xs sm:max-w-sm pointer-events-auto ${getZIndexClass("MAP_OVERLAY")}`}
			>
				<div className="bg-white/90 backdrop-blur-sm border border-gray-200 shadow-md rounded-lg px-4 py-3 text-sm text-gray-700 space-y-1">
					<div className="flex items-center justify-between gap-2">
						<span className="font-semibold text-gray-900">
							{t("tripMap.overlay.title")}
						</span>
						{selectedDayId && (
							<span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
								{t("tripMap.overlay.filtering")}
							</span>
						)}
					</div>
					<div className="text-sm text-gray-600 leading-snug">
						{t("tripMap.overlay.displayingLocations").replace(
							"{count}",
							itineraries
								.filter((i) => i.place_data?.geometry?.location)
								.length.toString(),
						)}
					</div>
					{selectedDayId && (
						<div className="text-xs text-red-600">
							{t("tripMap.overlay.filteredByDay")}
						</div>
					)}
				</div>
			</div>

			{/* 同期状態のオーバーレイは削除（スクロール連動機能を無効化） */}

			{/* POIダイアログ */}
			<POIDialog
				poiData={poiData || internalPoiData}
				onClose={() => {
					setInternalPoiData(null);
					actions.setPoiData(null);
					onPoiDataUpdate?.(null);
				}}
				onAddToItinerary={async (placeId: string, dayId: string) => {
					if (onAddFromPOI) {
						// 親コンポーネントの新しいハンドラーを使用（ローディング状態付き）
						await onAddFromPOI(placeId, dayId);
						// POI ダイアログを閉じる
						setInternalPoiData(null);
						actions.setPoiData(null);
						onPoiDataUpdate?.(null);
					} else {
						// フォールバック: 古い動作（デバッグ用）
						logger.warn(
							"onAddFromPOI is not provided, POI add功能が利用できません",
						);
					}
				}}
			/>
		</div>
	);
}
