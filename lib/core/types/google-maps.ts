/**
 * Google Maps API 型定義補助
 * @types/google.maps を前提に、安全な型を提供
 */

/// <reference types="google.maps" />

// Google Maps API グローバル参照
export interface GoogleMapsAPI {
	maps: typeof google.maps;
	places: typeof google.maps.places;
}

// マップ系共通Props
export interface MapComponentProps {
	google: GoogleMapsAPI;
	map?: google.maps.Map;
	initialCenter?: google.maps.LatLngLiteral;
	initialZoom?: number;
}

// ユーティリティ型
export type LatLngUnion = google.maps.LatLng | google.maps.LatLngLiteral;

export function isLatLng(obj: unknown): obj is google.maps.LatLng {
	return (
		!!obj &&
		typeof (obj as any).lat === "function" &&
		typeof (obj as any).lng === "function"
	);
}

export function isLatLngLiteral(
	obj: unknown,
): obj is google.maps.LatLngLiteral {
	const o = obj as any;
	return !!o && typeof o.lat === "number" && typeof o.lng === "number";
}

export function toLatLngLiteral(
	latLng: LatLngUnion,
): google.maps.LatLngLiteral {
	return isLatLng(latLng) ? { lat: latLng.lat(), lng: latLng.lng() } : latLng;
}
