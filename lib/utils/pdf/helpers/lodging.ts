/**
 * Lodging（宿泊）関連のヘルパー関数
 */

import type { Itinerary } from "@/lib/core/types";
import { escapeHtml } from "./utils";

/**
 * Lodging（宿泊）のitineraryを抽出
 */
export function extractLodgingItineraries(itineraries: Itinerary[]): Itinerary[] {
	return itineraries.filter((itinerary) => {
		const primaryCategory = itinerary.activity_tag?.primaryCategory;
		return primaryCategory === "accommodation";
	});
}

/**
 * Lodgingサイドバーを生成
 */
export function generateLodgingSidebar(lodgingItineraries: Itinerary[]): string {
	if (lodgingItineraries.length === 0) return "";

	const lodgingCards = lodgingItineraries.map((lodging) => {
		const photoRef = lodging.place_data?.photos?.[0]?.photo_reference;
		const photoUrl = photoRef
			? `/api/places/photo?photoreference=${encodeURIComponent(photoRef)}&maxwidth=400`
			: null;
		const address = lodging.location || lodging.place_data?.formatted_address || "";
		const name = lodging.title || "";

		return `
      <div class="lodging-card">
        ${photoUrl ? `<img src="${escapeHtml(photoUrl)}" alt="${escapeHtml(name)}" class="lodging-photo" />` : ""}
        ${name ? `<div class="lodging-name">${escapeHtml(name)}</div>` : ""}
        ${address ? `<div class="lodging-address">${escapeHtml(address)}</div>` : ""}
      </div>
    `;
	}).join("");

	return `
    <div class="itinerary-sidebar">
      <div class="lodging-sidebar">
        <div class="lodging-sidebar-title">Lodging</div>
        ${lodgingCards}
      </div>
    </div>
  `;
}
