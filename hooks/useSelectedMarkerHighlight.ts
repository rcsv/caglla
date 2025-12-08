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

