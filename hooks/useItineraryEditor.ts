import { Itinerary } from "@/lib/core/types";
import { useEntityEditor } from "./useEntityEditor";

/**
 * 旅程編集用カスタムフック
 *
 * useEntityEditorのラッパーで、Itinerary専用の型安全性を提供
 *
 * @param itinerary - 編集対象のItinerary
 * @param onUpdate - 更新成功時のコールバック
 */
export function useItineraryEditor(
	itinerary: Itinerary,
	onUpdate?: (updated: Itinerary) => void,
) {
	return useEntityEditor(itinerary, "itineraries", onUpdate);
}
