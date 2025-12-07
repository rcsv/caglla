# TripMap.tsx リファクタリング計画

## 概要

`TripMap.tsx` (1263行) は現在、多くのビジネスロジックがコンポーネント内に混在しています。この計画では、ロジックを適切に分離し、保守性とテスタビリティを向上させます。

## 現状の問題点

### 1. ユーティリティ関数がコンポーネント内に定義されている
- `calculateDistance` (28-45行目) - 2点間の距離計算
- `smoothMoveToLocation` (48-83行目) - 地図の滑らかな移動

### 2. 複雑な初期化ロジックがuseEffect内にある
- Google Maps APIの読み込みと初期化 (316-585行目)
- イベントリスナーの設定
- DirectionsService/DirectionsRendererの初期化

### 3. POI処理ロジックが深く入り込んでいる
- POIクリック処理 (381-491行目、494-527行目)
- Place Details API呼び出し
- POIデータの状態管理

### 4. マーカー管理ロジックが複雑
- ティアドロップマーカーの作成と管理 (630-742行目)
- 検索結果マーカーの管理 (254-313行目)
- POIマーカーの管理 (861-963行目)
- マーカーのクリアと更新

### 5. ルート描画ロジックが混在
- ルート計算と描画 (746-788行目)
- 選択されたItinerary間のルート表示 (1037-1119行目)

### 6. ビューポート管理ロジックが複雑
- フォーカスモードに応じたビュー調整 (790-844行目)
- 選択されたItineraryへのフォーカス (965-1035行目)

### 7. 検索機能ロジックがコンポーネント内にある
- 検索結果の処理 (214-252行目、254-313行目)

### 8. 日付フォーマットロジックがインラインで実行されている
- availableDaysの計算 (1221-1259行目)

## リファクタリング戦略

### フェーズ1: ユーティリティ関数の抽出（低リスク）

#### 1.1 距離計算関数の抽出
**ファイル**: `lib/utils/distance.ts` (新規作成)

```typescript
/**
 * 2点間の距離を計算する（Haversine formula）
 * @param lat1 始点の緯度
 * @param lng1 始点の経度
 * @param lat2 終点の緯度
 * @param lng2 終点の経度
 * @returns 距離（km）
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // 地球の半径（km）
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
```

#### 1.2 地図移動関数の抽出
**ファイル**: `lib/travel/map-utils.ts` (新規作成)

```typescript
import { calculateDistance } from "@/lib/utils/distance";

const SMOOTH_PAN_DISTANCE_THRESHOLD = 5; // 約5km

/**
 * 滑らかな移動でマップを更新する
 * 距離が近い場合はパン、遠い場合は即座に移動
 */
export function smoothMoveToLocation(
  map: google.maps.Map,
  targetLat: number,
  targetLng: number,
  targetZoom: number,
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

  if (distance < SMOOTH_PAN_DISTANCE_THRESHOLD) {
    // 近い場合は滑らかなパン
    map.panTo({ lat: targetLat, lng: targetLng });

    // ズームレベルも段階的に変更
    const currentZoom = map.getZoom();
    if (currentZoom !== targetZoom) {
      setTimeout(() => {
        map.setZoom(targetZoom);
      }, 300); // パンの完了後にズーム
    }
  } else {
    // 遠い場合は即座に移動
    map.setCenter({ lat: targetLat, lng: targetLng });
    map.setZoom(targetZoom);
  }
}
```

#### 1.3 日付フォーマットロジックの抽出
**ファイル**: `lib/utils/trip-date-formatter.ts` (新規作成)

```typescript
import { Day } from "@/lib/core/types";
import { dateUtils } from "@/lib/utils/date";
import { getUserLanguage } from "@/lib/utils/language";
import type { User } from "@/lib/core/types";

export interface FormattedDay {
  id: string;
  date: string;
  title?: string;
}

/**
 * Tripの日付をフォーマットして利用可能な日付リストを作成
 * 複数の年が含まれる場合は年も表示
 */
export function formatAvailableDays(
  days: Day[],
  user: User | null | undefined,
): FormattedDay[] {
  const sortedDays = days.sort(
    (a, b) => (a.day_number || 0) - (b.day_number || 0),
  );

  // 複数の年が含まれるかチェック
  const years = new Set<number>();
  sortedDays.forEach((day) => {
    if (day.date) {
      try {
        const date = dateUtils.toDate(day.date);
        if (date) {
          years.add(date.getFullYear());
        }
      } catch {
        // 日付が無効な場合はスキップ
      }
    }
  });

  // 複数の年が含まれる場合は年も表示、そうでなければ省略
  const includeYear = years.size > 1;

  return sortedDays.map((day) => ({
    id: day.id,
    date: dateUtils.formatDate(
      day.date,
      {
        month: "long",
        day: "numeric",
        weekday: "short",
        year: includeYear ? "numeric" : undefined,
      },
      getUserLanguage(user),
    ),
    title: day.description,
  }));
}
```

### フェーズ2: カスタムフックの作成（中リスク）

#### 2.1 地図初期化フック
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
}

export function useMapInitialization({
  mapRef,
  initialCenter,
  onMapInteractionStart,
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

  useEffect(() => {
    onMapInteractionStartRef.current = onMapInteractionStart;
  }, [onMapInteractionStart]);

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
        newMap.addListener("dragstart", () =>
          onMapInteractionStartRef.current?.(),
        );
        newMap.addListener("zoom_changed", () =>
          onMapInteractionStartRef.current?.(),
        );

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

#### 2.2 POI処理フック
**ファイル**: `hooks/usePOIHandler.ts` (新規作成)

```typescript
import { useState, useRef, useEffect } from "react";
import { PlaceData } from "@/lib/core/types";
import { getUserLanguage } from "@/lib/utils/language";
import { useAuth } from "@/lib/contexts/auth";
import logger from "@/lib/core/logger";

export interface POIData {
  placeId: string;
  name: string;
  location: { lat: number; lng: number };
  placeData?: PlaceData;
}

export interface UsePOIHandlerOptions {
  map: google.maps.Map | null;
  onPoiDataUpdate?: (poiData: POIData | null) => void;
}

export function usePOIHandler({
  map,
  onPoiDataUpdate,
}: UsePOIHandlerOptions) {
  const { user } = useAuth();
  const [internalPoiData, setInternalPoiData] = useState<POIData | null>(null);
  const onPoiDataUpdateRef = useRef(onPoiDataUpdate);

  useEffect(() => {
    onPoiDataUpdateRef.current = onPoiDataUpdate;
  }, [onPoiDataUpdate]);

  const handlePOIClick = async (event: any) => {
    if (!map || !event.placeId) return;

    onPoiDataUpdateRef.current?.(null);

    // Place Details APIから詳細情報を取得
    try {
      const language = getUserLanguage(user);
      const response = await fetch("/api/places/details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          placeId: event.placeId,
          language: language,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === "OK" && data.result) {
          const newPoiData: POIData = {
            placeId: event.placeId,
            name: data.result.name || "POI",
            location: {
              lat: event.latLng.lat(),
              lng: event.latLng.lng(),
            },
            placeData: data.result,
          };
          setInternalPoiData(newPoiData);
          onPoiDataUpdateRef.current?.(newPoiData);
        }
      }
    } catch (error) {
      logger.error("Error fetching place details:", error);
      // フォールバック処理
      const newPoiData: POIData = {
        placeId: event.placeId,
        name: "POI",
        location: {
          lat: event.latLng.lat(),
          lng: event.latLng.lng(),
        },
      };
      setInternalPoiData(newPoiData);
      onPoiDataUpdateRef.current?.(newPoiData);
    }
  };

  const handlePOIClickEvent = (event: any) => {
    if (!event.placeId) return;

    const newPoiData: POIData = {
      placeId: event.placeId,
      name: event.displayName || "POI",
      location: {
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
      },
    };
    setInternalPoiData(newPoiData);
    onPoiDataUpdateRef.current?.(newPoiData);
  };

  const setupPOIListeners = (map: google.maps.Map) => {
    // clickイベント（フォールバック）
    map.addListener("click", handlePOIClick);

    // poi_clickイベント
    map.addListener("poi_click", (event: any) => {
      event.stop();
      handlePOIClickEvent(event);
    });
  };

  return {
    internalPoiData,
    setInternalPoiData,
    setupPOIListeners,
  };
}
```

#### 2.3 マーカー管理フック
**ファイル**: `hooks/useMapMarkers.ts` (新規作成)

```typescript
import { useEffect, useRef, useState } from "react";
import { Itinerary, PlaceData } from "@/lib/core/types";
import type { PlaceSearchResult } from "@/lib/core/types";
import { getZoomForPlaceTypes } from "@/lib/travel/map-zoom";
import { smoothMoveToLocation } from "@/lib/travel/map-utils";
import logger from "@/lib/core/logger";

export interface MarkerData {
  marker: google.maps.marker.AdvancedMarkerElement;
  element: HTMLElement;
  itineraryId: string;
}

export interface UseMapMarkersOptions {
  map: google.maps.Map | null;
  itineraries: Itinerary[];
  selectedItineraryId?: string | null;
  focusMode?: "all" | "day" | "single";
  onItineraryClick?: (itineraryId: string) => void;
  onPoiDataUpdate?: (poiData: {
    placeId: string;
    name: string;
    location: { lat: number; lng: number };
    placeData?: PlaceData;
  } | null) => void;
}

export function useMapMarkers({
  map,
  itineraries,
  selectedItineraryId,
  focusMode,
  onItineraryClick,
  onPoiDataUpdate,
}: UseMapMarkersOptions) {
  const markersRef = useRef<MarkerData[]>([]);
  const onItineraryClickRef = useRef(onItineraryClick);
  const onPoiDataUpdateRef = useRef(onPoiDataUpdate);

  useEffect(() => {
    onItineraryClickRef.current = onItineraryClick;
  }, [onItineraryClick]);

  useEffect(() => {
    onPoiDataUpdateRef.current = onPoiDataUpdate;
  }, [onPoiDataUpdate]);

  // マーカーの作成と更新ロジック
  useEffect(() => {
    if (!map) return;

    // 既存のマーカーをクリア
    markersRef.current.forEach((markerData) => {
      if (markerData.marker) {
        markerData.marker.map = null;
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

        // 個別フォーカスモードの場合
        if (focusMode === "single") {
          const zoom = getZoomForPlaceTypes(itinerary.place_data?.types);
          smoothMoveToLocation(
            map,
            position.lat,
            position.lng,
            zoom,
          );
        }
      });

      return { marker, element: teardropElement, itineraryId: itinerary.id };
    });

    markersRef.current = newMarkers;
  }, [map, itineraries, focusMode]);

  // 選択されたマーカーのハイライト
  useEffect(() => {
    if (!selectedItineraryId) return;

    markersRef.current.forEach((markerData) => {
      if (markerData.itineraryId === selectedItineraryId) {
        markerData.element.className = "teardrop-marker selected";
      } else {
        markerData.element.className = "teardrop-marker";
      }
    });
  }, [selectedItineraryId]);

  return { markersRef };
}
```

#### 2.4 ルート描画フック
**ファイル**: `hooks/useRouteRenderer.ts` (新規作成)

```typescript
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

    if (!selectedItineraryId) {
      directionsRenderer.setMap(null);
      return;
    }

    const selectedIndex = itineraries.findIndex(
      (it) => it.id === selectedItineraryId,
    );
    if (selectedIndex === -1) {
      directionsRenderer.setMap(null);
      return;
    }

    const selectedItinerary = itineraries[selectedIndex];
    const nextItinerary = itineraries[selectedIndex + 1];

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

    directionsService.route(
      {
        origin,
        destination,
        travelMode: window.google.maps.TravelMode.WALKING,
      },
      (result: any, status: any) => {
        if (status === "OK" && result) {
          directionsRenderer.setMap(map);
          directionsRenderer.setDirections(result);
        } else {
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
```

#### 2.5 ビューポート管理フック
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
  initialCenter?: { lat: number; lng: number };
}

export function useMapViewport({
  map,
  directionsRenderer,
  itineraries,
  selectedItineraryId,
  focusMode,
  scrollSyncEnabled,
  initialCenter,
}: UseMapViewportOptions) {
  useEffect(() => {
    if (!map) return;

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
        smoothMoveToLocation(map, position.lat, position.lng, zoom);
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
    } else if (initialCenter) {
      // 行先が無い場合は初期センターへ
      map.setCenter(initialCenter);
      map.setZoom(11);
    }
  }, [
    map,
    directionsRenderer,
    itineraries,
    selectedItineraryId,
    focusMode,
    scrollSyncEnabled,
    initialCenter,
  ]);
}
```

### フェーズ3: 検索機能の分離（中リスク）

#### 3.1 検索マーカー管理フック
**ファイル**: `hooks/useSearchMarkers.ts` (新規作成)

```typescript
import { useState, useEffect } from "react";
import { PlaceData } from "@/lib/core/types";
import type { PlaceSearchResult } from "@/lib/core/types";
import { getZoomForPlaceTypes } from "@/lib/travel/map-zoom";
import { smoothMoveToLocation } from "@/lib/travel/map-utils";
import logger from "@/lib/core/logger";

export interface UseSearchMarkersOptions {
  map: google.maps.Map | null;
  onPlaceChosen?: (place: PlaceData) => void;
  onPoiDataUpdate?: (poiData: {
    placeId: string;
    name: string;
    location: { lat: number; lng: number };
  } | null) => void;
}

export function useSearchMarkers({
  map,
  onPlaceChosen,
  onPoiDataUpdate,
}: UseSearchMarkersOptions) {
  const [searchMarker, setSearchMarker] = useState<any>(null);
  const [searchResultMarkers, setSearchResultMarkers] = useState<any[]>([]);

  const handleSearchPlaceChosen = (place: PlaceData) => {
    if (!map || !place.geometry?.location) return;

    const { lat, lng } = place.geometry.location;
    const zoom = getZoomForPlaceTypes(place.types);

    // 既存の検索マーカーをクリア
    if (searchMarker) {
      searchMarker.map = null;
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

  const handleSearchResultsUpdated = (results: PlaceSearchResult[]) => {
    if (!map) return;

    // 既存の検索結果ピンをクリア
    searchResultMarkers.forEach((m) => m.setMap(null));
    setSearchResultMarkers([]);

    // 先頭から順にストンストン落とす（最大10件）
    const limited = results.slice(0, 10);
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

        setSearchResultMarkers((prev) => [...prev, mk]);
      }, index * 120);
    });
  };

  return {
    handleSearchPlaceChosen,
    handleSearchResultsUpdated,
  };
}
```

### フェーズ4: POIマーカー管理の分離（低リスク）

#### 4.1 POIマーカー管理フック
**ファイル**: `hooks/usePOIMarker.ts` (新規作成)

```typescript
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
```

## 実装順序と優先度

### フェーズ1: ユーティリティ関数の抽出（優先度: 高、リスク: 低）
1. ✅ `lib/utils/distance.ts` の作成
2. ✅ `lib/travel/map-utils.ts` の作成
3. ✅ `lib/utils/trip-date-formatter.ts` の作成
4. ✅ `TripMap.tsx` での使用に置き換え

**推定工数**: 2-3時間

### フェーズ2: カスタムフックの作成（優先度: 高、リスク: 中）
1. ✅ `hooks/useMapInitialization.ts` の作成
2. ✅ `hooks/usePOIHandler.ts` の作成
3. ✅ `hooks/useMapMarkers.ts` の作成
4. ✅ `hooks/useRouteRenderer.ts` の作成
5. ✅ `hooks/useMapViewport.ts` の作成
6. ✅ `TripMap.tsx` での使用に置き換え

**推定工数**: 8-12時間

### フェーズ3: 検索機能の分離（優先度: 中、リスク: 中）
1. ✅ `hooks/useSearchMarkers.ts` の作成
2. ✅ `TripMap.tsx` での使用に置き換え

**推定工数**: 3-4時間

### フェーズ4: POIマーカー管理の分離（優先度: 中、リスク: 低）
1. ✅ `hooks/usePOIMarker.ts` の作成
2. ✅ `TripMap.tsx` での使用に置き換え

**推定工数**: 2-3時間

## リファクタリング後のTripMap.tsx構造

```typescript
export default function TripMap({
  // props
}: TripMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

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
    onMapInteractionStart,
  });

  const { internalPoiData, setInternalPoiData, setupPOIListeners } =
    usePOIHandler({
      map,
      onPoiDataUpdate,
    });

  const { markersRef } = useMapMarkers({
    map,
    itineraries,
    selectedItineraryId,
    focusMode,
    onItineraryClick,
    onPoiDataUpdate,
  });

  useRouteRenderer({
    map,
    directionsService,
    directionsRenderer,
    itineraries,
    selectedItineraryId,
  });

  useMapViewport({
    map,
    directionsRenderer,
    itineraries,
    selectedItineraryId,
    focusMode,
    scrollSyncEnabled,
    initialCenter,
  });

  const { handleSearchPlaceChosen, handleSearchResultsUpdated } =
    useSearchMarkers({
      map,
      onPoiDataUpdate,
    });

  usePOIMarker({
    map,
    poiData: poiData || internalPoiData,
    selectedItineraryId,
    itineraries,
  });

  // POIリスナーの設定
  useEffect(() => {
    if (map) {
      setupPOIListeners(map);
    }
  }, [map, setupPOIListeners]);

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

## 期待される効果

### 1. コードの可読性向上
- コンポーネントが約300-400行に削減
- 各責務が明確に分離

### 2. テスタビリティの向上
- ユーティリティ関数とカスタムフックを個別にテスト可能
- モックが容易

### 3. 再利用性の向上
- カスタムフックを他のコンポーネントでも使用可能
- ユーティリティ関数の再利用

### 4. 保守性の向上
- 変更の影響範囲が明確
- バグの特定が容易

## 注意事項

1. **段階的な実装**: 一度にすべてを変更せず、フェーズごとに実装とテストを実施
2. **型安全性の維持**: TypeScriptの型定義を適切に設定
3. **既存機能の維持**: リファクタリング中も既存の機能が動作することを確認
4. **パフォーマンス**: フックの依存配列を適切に設定し、不要な再レンダリングを防ぐ
5. **テスト**: 各フェーズで既存のテストが通ることを確認し、必要に応じて新しいテストを追加

## 次のステップ

1. フェーズ1の実装を開始
2. 各フェーズでコードレビューを実施
3. リファクタリング完了後、パフォーマンステストを実施
4. ドキュメントを更新

