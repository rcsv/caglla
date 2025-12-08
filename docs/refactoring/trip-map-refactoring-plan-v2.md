# TripMap.tsx リファクタリング計画 v2（実務改善版）

## 概要

`TripMap.tsx` (1263行) のリファクタリング計画。実務で詰まりやすいポイントを考慮し、プロダクション級の地図エンジンに昇格させるための改善版。

## 現状の問題点

[前版と同じ - 省略]

## リファクタリング戦略（改善版）

### フェーズ0: 状態管理の統合（新規追加・優先度: 高）

#### 0.1 TripMapStateReducer の導入
**ファイル**: `hooks/useTripMapState.ts` (新規作成)

地図UIは状態が多いため、`useReducer`で統合管理する。

```typescript
import { useReducer, useCallback } from "react";
import { Itinerary, Trip, PlaceData } from "@/lib/core/types";

export interface TripMapState {
  focusMode: "all" | "day" | "single";
  selectedItineraryId: string | null;
  scrollSyncEnabled: boolean;
  poiData: {
    placeId: string;
    name: string;
    location: { lat: number; lng: number };
    placeData?: PlaceData;
  } | null;
  searchResults: any[];
  viewport: {
    center?: { lat: number; lng: number };
    bounds?: {
      north: number;
      south: number;
      east: number;
      west: number;
    };
  };
  userMovedMap: boolean; // ユーザーが手動で地図を動かしたか
}

export type TripMapAction =
  | { type: "SET_FOCUS_MODE"; payload: "all" | "day" | "single" }
  | { type: "SELECT_ITINERARY"; payload: string | null }
  | { type: "SET_SCROLL_SYNC"; payload: boolean }
  | { type: "SET_POI_DATA"; payload: TripMapState["poiData"] }
  | { type: "SET_SEARCH_RESULTS"; payload: any[] }
  | { type: "SET_VIEWPORT"; payload: TripMapState["viewport"] }
  | { type: "USER_MOVED_MAP"; payload: boolean }
  | { type: "RESET_VIEWPORT" };

const initialState: TripMapState = {
  focusMode: "all",
  selectedItineraryId: null,
  scrollSyncEnabled: true,
  poiData: null,
  searchResults: [],
  viewport: {},
  userMovedMap: false,
};

function tripMapReducer(
  state: TripMapState,
  action: TripMapAction,
): TripMapState {
  switch (action.type) {
    case "SET_FOCUS_MODE":
      return { ...state, focusMode: action.payload };
    case "SELECT_ITINERARY":
      return { ...state, selectedItineraryId: action.payload };
    case "SET_SCROLL_SYNC":
      return { ...state, scrollSyncEnabled: action.payload };
    case "SET_POI_DATA":
      return { ...state, poiData: action.payload };
    case "SET_SEARCH_RESULTS":
      return { ...state, searchResults: action.payload };
    case "SET_VIEWPORT":
      return { ...state, viewport: action.payload };
    case "USER_MOVED_MAP":
      return { ...state, userMovedMap: action.payload };
    case "RESET_VIEWPORT":
      return { ...state, viewport: {}, userMovedMap: false };
    default:
      return state;
  }
}

export function useTripMapState(initialProps?: Partial<TripMapState>) {
  const [state, dispatch] = useReducer(tripMapReducer, {
    ...initialState,
    ...initialProps,
  });

  const actions = {
    setFocusMode: useCallback(
      (mode: "all" | "day" | "single") =>
        dispatch({ type: "SET_FOCUS_MODE", payload: mode }),
      [],
    ),
    selectItinerary: useCallback(
      (id: string | null) =>
        dispatch({ type: "SELECT_ITINERARY", payload: id }),
      [],
    ),
    setScrollSync: useCallback(
      (enabled: boolean) =>
        dispatch({ type: "SET_SCROLL_SYNC", payload: enabled }),
      [],
    ),
    setPoiData: useCallback(
      (data: TripMapState["poiData"]) =>
        dispatch({ type: "SET_POI_DATA", payload: data }),
      [],
    ),
    setSearchResults: useCallback(
      (results: any[]) =>
        dispatch({ type: "SET_SEARCH_RESULTS", payload: results }),
      [],
    ),
    setViewport: useCallback(
      (viewport: TripMapState["viewport"]) =>
        dispatch({ type: "SET_VIEWPORT", payload: viewport }),
      [],
    ),
    userMovedMap: useCallback(
      (moved: boolean) =>
        dispatch({ type: "USER_MOVED_MAP", payload: moved }),
      [],
    ),
    resetViewport: useCallback(
      () => dispatch({ type: "RESET_VIEWPORT" }),
      [],
    ),
  };

  return { state, actions };
}
```

### フェーズ1: ユーティリティ関数の抽出（改善版）

#### 1.1 距離計算関数の抽出
**ファイル**: `lib/utils/distance.ts` (新規作成)

[前版と同じ - 省略]

#### 1.2 地図移動関数の抽出（改善版）
**ファイル**: `lib/travel/map-utils.ts` (新規作成)

```typescript
import { calculateDistance } from "@/lib/utils/distance";

const SMOOTH_PAN_DISTANCE_THRESHOLD = 5; // 約5km

export interface SmoothMoveOptions {
  onMoveStart?: () => void;
  onMoveComplete?: () => void;
}

/**
 * 滑らかな移動でマップを更新する
 * 距離が近い場合はパン、遠い場合は即座に移動
 * 
 * @param map Google Maps Map インスタンス
 * @param targetLat 目標緯度
 * @param targetLng 目標経度
 * @param targetZoom 目標ズームレベル
 * @param options オプション（コールバックなど）
 */
export function smoothMoveToLocation(
  map: google.maps.Map,
  targetLat: number,
  targetLng: number,
  targetZoom: number,
  options?: SmoothMoveOptions,
): void {
  const currentCenter = map.getCenter();
  if (!currentCenter) return;

  const currentLat = currentCenter.lat();
  const currentLng = currentCenter.lng();

  const distance = calculateDistance(
    currentLat,
    currentLng,
    targetLat,
    targetLng,
  );

  options?.onMoveStart?.();

  if (distance < SMOOTH_PAN_DISTANCE_THRESHOLD) {
    // 近い場合は滑らかなパン
    map.panTo({ lat: targetLat, lng: targetLng });

    // ズームレベルも段階的に変更
    const currentZoom = map.getZoom();
    if (currentZoom !== targetZoom) {
      setTimeout(() => {
        map.setZoom(targetZoom);
        options?.onMoveComplete?.();
      }, 300); // パンの完了後にズーム
    } else {
      options?.onMoveComplete?.();
    }
  } else {
    // 遠い場合は即座に移動
    map.setCenter({ lat: targetLat, lng: targetLng });
    map.setZoom(targetZoom);
    options?.onMoveComplete?.();
  }
}
```

#### 1.3 日付フォーマットロジックの抽出
[前版と同じ - 省略]

### フェーズ2: カスタムフックの作成（改善版）

#### 2.1 地図初期化フック（改善版）
**ファイル**: `hooks/useMapInitialization.ts` (新規作成)

```typescript
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
  mapRef: React.RefObject<HTMLDivElement>;
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
```

#### 2.2 POI処理フック（改善版・責務分離）
**ファイル**: `hooks/usePOIDetails.ts` (新規作成) - Place Details API呼び出し専用

```typescript
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
```

**ファイル**: `hooks/usePOIClickListener.ts` (新規作成) - POIクリックイベント専用

```typescript
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
```

#### 2.3 マーカー管理フック（改善版・AdvancedMarkerElementの適切な破棄）
**ファイル**: `hooks/useTeardropMarkers.ts` (新規作成) - ティアドロップマーカー専用

```typescript
import { useEffect, useRef } from "react";
import { Itinerary, PlaceData } from "@/lib/core/types";
import logger from "@/lib/core/logger";

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
```

**ファイル**: `hooks/useSelectedMarkerHighlight.ts` (新規作成) - 選択マーカーのハイライト専用

```typescript
import { useEffect } from "react";
import { MarkerData } from "./useTeardropMarkers";

export interface UseSelectedMarkerHighlightOptions {
  markersRef: React.MutableRefObject<MarkerData[]>;
  selectedItineraryId: string | null;
}

/**
 * 選択されたマーカーをハイライト
 * 責務を分離して70行以下を維持
 */
export function useSelectedMarkerHighlight({
  markersRef,
  selectedItineraryId,
}: UseSelectedMarkerHighlightOptions) {
  useEffect(() => {
    if (!selectedItineraryId) {
      // 選択解除時はすべて通常状態に
      markersRef.current.forEach((markerData) => {
        markerData.element.className = "teardrop-marker";
      });
      return;
    }

    markersRef.current.forEach((markerData) => {
      if (markerData.itineraryId === selectedItineraryId) {
        markerData.element.className = "teardrop-marker selected";
      } else {
        markerData.element.className = "teardrop-marker";
      }
    });
  }, [markersRef, selectedItineraryId]);
}
```

#### 2.4 ルート描画フック
[前版と同じ - 改善点のみ記載]

#### 2.5 ビューポート管理フック（改善版・userMovedMap対応）
**ファイル**: `hooks/useMapViewport.ts` (新規作成)

```typescript
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
```

### フェーズ3: 検索機能の分離（改善版）

#### 3.1 検索マーカー管理フック（分割版）
**ファイル**: `hooks/useSearchMarkerCreation.ts` (新規作成) - マーカー生成専用

```typescript
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
```

**ファイル**: `hooks/useSearchResultMarkers.ts` (新規作成) - 検索結果ピン専用

```typescript
import { useState, useEffect } from "react";
import type { PlaceSearchResult } from "@/lib/core/types";
import logger from "@/lib/core/logger";

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
```

### フェーズ4: POIマーカー管理の分離
[前版と同じ - AdvancedMarkerElementの適切な破棄処理を追加]

## 実装順序と優先度（改善版）

### フェーズ0: 状態管理の統合（新規・優先度: 最高）
1. ✅ `hooks/useTripMapState.ts` の作成
2. ✅ `TripMap.tsx` での使用に置き換え

**推定工数**: 3-4時間

### フェーズ1: ユーティリティ関数の抽出（優先度: 高、リスク: 低）
[前版と同じ]

### フェーズ2: カスタムフックの作成（優先度: 高、リスク: 中・改善版）
1. ✅ `hooks/useMapInitialization.ts` の作成（userMovedMap対応）
2. ✅ `hooks/usePOIDetails.ts` の作成（API呼び出し専用）
3. ✅ `hooks/usePOIClickListener.ts` の作成（イベント処理専用）
4. ✅ `hooks/useTeardropMarkers.ts` の作成（マーカー生成専用・適切な破棄）
5. ✅ `hooks/useSelectedMarkerHighlight.ts` の作成（ハイライト専用）
6. ✅ `hooks/useRouteRenderer.ts` の作成
7. ✅ `hooks/useMapViewport.ts` の作成（userMovedMap対応）
8. ✅ `TripMap.tsx` での使用に置き換え

**推定工数**: 10-14時間（分割により増加）

### フェーズ3: 検索機能の分離（優先度: 中、リスク: 中・改善版）
1. ✅ `hooks/useSearchMarkerCreation.ts` の作成
2. ✅ `hooks/useSearchResultMarkers.ts` の作成
3. ✅ `TripMap.tsx` での使用に置き換え

**推定工数**: 4-5時間（分割により増加）

### フェーズ4: POIマーカー管理の分離（優先度: 中、リスク: 低）
[前版と同じ・適切な破棄処理を追加]

## リファクタリング後のTripMap.tsx構造（改善版）

```typescript
export default function TripMap({
  // props
}: TripMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // 状態管理の統合
  const { state, actions } = useTripMapState({
    focusMode: focusMode || "all",
    selectedItineraryId: selectedItineraryId || null,
    scrollSyncEnabled: scrollSyncEnabled ?? true,
  });

  // カスタムフックの使用
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
    },
    onUserMovedMap: (moved) => {
      actions.userMovedMap(moved);
    },
  });

  const { fetchPlaceDetails } = usePOIDetails();

  usePOIClickListener({
    map,
    onPOIClick: (poiData) => {
      actions.setPoiData(poiData);
      onPoiDataUpdate?.(poiData);
    },
    fetchPlaceDetails,
  });

  const { markersRef } = useTeardropMarkers({
    map,
    itineraries,
    onItineraryClick: (id) => {
      actions.selectItinerary(id);
      onItineraryClick?.(id);
    },
    onPoiDataUpdate: (data) => {
      actions.setPoiData(data);
      onPoiDataUpdate?.(data);
    },
  });

  useSelectedMarkerHighlight({
    markersRef,
    selectedItineraryId: state.selectedItineraryId,
  });

  useRouteRenderer({
    map,
    directionsService,
    directionsRenderer,
    itineraries,
    selectedItineraryId: state.selectedItineraryId,
  });

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

  const { createSearchMarker } = useSearchMarkerCreation({
    map,
    onPlaceChosen: (place) => {
      // 検索結果選択時の処理
    },
  });

  const { updateSearchResults } = useSearchResultMarkers({
    map,
    onPoiDataUpdate: (data) => {
      actions.setPoiData(data);
      onPoiDataUpdate?.(data);
    },
  });

  usePOIMarker({
    map,
    poiData: poiData || state.poiData,
    selectedItineraryId: state.selectedItineraryId,
    itineraries,
  });

  // ビューポート取得関数
  const getMapViewport = () => {
    if (!map) return { center: undefined, bounds: undefined };
    const center = map.getCenter();
    const bounds = map.getBounds();
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

  // 日付フォーマット
  const availableDays = useMemo(
    () => formatAvailableDays(trip?.days || [], user),
    [trip?.days, user],
  );

  return (
    <div className={`relative ${className}`}>
      {/* UI レンダリング */}
    </div>
  );
}
```

## 追加の改善点

### 1. Place Details APIのキャッシュ戦略

**サーバ側の実装推奨**: `app/api/places/details/route.ts`

```typescript
// 軽いキャッシュの例（Firestore使用）
import { getCachedPlaceDetails, setCachedPlaceDetails } from "@/lib/api/places-cache";

export async function POST(req: NextRequest) {
  const { placeId, language } = await req.json();

  // キャッシュをチェック（24時間有効）
  const cached = await getCachedPlaceDetails(placeId, language);
  if (cached) {
    return Response.json({ status: "OK", result: cached });
  }

  // API呼び出し
  const result = await fetchPlaceDetailsFromGoogle(placeId, language);

  // キャッシュに保存
  await setCachedPlaceDetails(placeId, language, result);

  return Response.json({ status: "OK", result });
}
```

### 2. 型定義の整理

**ファイル**: `hooks/useTripMapState.types.ts` (新規作成)

```typescript
// 各フックのexport型定義を整理
export type { TripMapState, TripMapAction } from "./useTripMapState";
export type { MapInitializationResult } from "./useMapInitialization";
export type { POIDetailsResult } from "./usePOIDetails";
export type { MarkerData } from "./useTeardropMarkers";
// ... など
```

### 3. 依存配列のコメント

各フックで意図的にuseRefを使用している箇所にコメントを追加：

```typescript
// 意図的にuseRefで保持（依存配列の警告を避けるため）
// onPoiDataUpdateは親コンポーネントから頻繁に変更される可能性があるが、
// 最新の参照を常に使用したいためuseRefを使用
useEffect(() => {
  onPoiDataUpdateRef.current = onPoiDataUpdate;
}, [onPoiDataUpdate]);
```

## 期待される効果（改善版）

### 1. コードの可読性向上
- コンポーネントが約250-300行に削減（前版よりさらに削減）
- 各責務が明確に分離
- 状態管理が一元化され、追跡しやすい

### 2. テスタビリティの向上
- 各フックが70行以下で、テストが容易
- 状態管理がreducerで統一され、テストしやすい
- モックが容易

### 3. 再利用性の向上
- より細かく分割されたフックで、柔軟な組み合わせが可能
- ユーティリティ関数の再利用

### 4. 保守性の向上
- 変更の影響範囲が明確
- バグの特定が容易
- AdvancedMarkerElementの適切な破棄でメモリリークを防止

### 5. UXの向上
- userMovedMap状態により、ユーザー操作と自動フォーカスの競合を防止
- より自然な地図操作体験

## 注意事項（改善版）

1. **段階的な実装**: フェーズ0から順に実装
2. **型安全性の維持**: TypeScriptの型定義を適切に設定
3. **既存機能の維持**: リファクタリング中も既存の機能が動作することを確認
4. **パフォーマンス**: フックの依存配列を適切に設定し、不要な再レンダリングを防ぐ
5. **テスト**: 各フェーズで既存のテストが通ることを確認し、必要に応じて新しいテストを追加
6. **メモリリーク対策**: AdvancedMarkerElementの適切な破棄処理を必ず実装
7. **APIキャッシュ**: Place Details APIの過剰課金を防ぐため、サーバ側でキャッシュを実装

## 次のステップ

1. フェーズ0の実装を開始（状態管理の統合）
2. 各フェーズでコードレビューを実施
3. リファクタリング完了後、パフォーマンステストを実施
4. メモリリークテストを実施（Chrome DevToolsで確認）
5. ドキュメントを更新

