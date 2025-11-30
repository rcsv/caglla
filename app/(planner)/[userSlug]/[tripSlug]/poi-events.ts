/**
 * POI関連のCustomEvent型定義
 *
 * @timelineから@mapへの連携に使用するCustomEventの型定義
 */

import type { POIData } from "./POIProvider";

/**
 * POIを開くイベント
 *
 * @timelineでItineraryをクリックした際に発火される
 */
export interface PlannerPOIOpenEvent extends CustomEvent {
	type: "planner:poi-open";
	detail: POIData;
}

/**
 * POIを開くイベントを発火
 *
 * @param poiData - 表示するPOIデータ
 */
export function dispatchPOIOpen(poiData: POIData): void {
	if (typeof window === "undefined") return;

	const event = new CustomEvent("planner:poi-open", {
		detail: poiData,
	});
	window.dispatchEvent(event);
}

/**
 * POIを閉じるイベント
 */
export interface PlannerPOICloseEvent extends CustomEvent {
	type: "planner:poi-close";
}

/**
 * POIを閉じるイベントを発火
 */
export function dispatchPOIClose(): void {
	if (typeof window === "undefined") return;

	const event = new CustomEvent("planner:poi-close");
	window.dispatchEvent(event);
}
