/**
 * 予約情報ページテンプレート
 */

import type { PdfContext } from "../types";
import type { ReservationType, Itinerary, ReservationInfo } from "@/lib/core/types";
import { escapeHtml } from "../helpers/utils";
import {
	extractReservations,
	getReservationTypeLabel,
	generateFlightReservationCard,
	generateStandardReservationCard,
} from "../helpers/reservation";

/**
 * 予約情報ページを生成
 * @returns ページHTMLの配列（1ページ分）
 */
export function generateReservationsPage(ctx: PdfContext): string[] {
	const reservations = extractReservations(ctx);
	
	// 予約タイプ別にグループ化
	const reservationsByType = reservations.reduce(
		(acc, { itinerary, reservation }) => {
			const type = reservation.type;
			if (!acc[type]) {
				acc[type] = [];
			}
			acc[type].push({ itinerary, reservation });
			return acc;
		},
		{} as Record<ReservationType, Array<{ itinerary: Itinerary; reservation: ReservationInfo }>>,
	);
	
	// 予約タイプの順序
	const typeOrder: ReservationType[] = ["flight", "hotel", "rental_car", "dining", "other"];
	
	// 予約がない場合
	if (reservations.length === 0) {
		const pageHtml = `
    <div class="page reservations-page">
      <div class="page-header">
        <div>${escapeHtml((ctx.trip.title || "無題の旅行").toUpperCase())} - RESERVATIONS</div>
      </div>
      
      <div class="page-title">Reservations</div>
      <div class="page-subtitle">予約情報</div>
      
      <div class="reservation-empty">
        No reservations found. Please add reservations to your itinerary.
      </div>
      
      <div class="page-footer">
        <div>2 | caglla travel manager</div>
      </div>
    </div>
  `;
		return [pageHtml];
	}
	
	// 各予約タイプのセクションを生成
	const sections = typeOrder
		.filter((type) => reservationsByType[type] && reservationsByType[type].length > 0)
		.map((type) => {
			const typeReservations = reservationsByType[type];
			const reservationCards = typeReservations
				.map(({ itinerary, reservation }) => {
					if (type === "flight") {
						return generateFlightReservationCard(itinerary, reservation);
					} else {
						return generateStandardReservationCard(itinerary, reservation);
					}
				})
				.join("");
			
			return `
        <div class="reservation-section">
          <div class="reservation-section-title">${getReservationTypeLabel(type)}</div>
          ${reservationCards}
        </div>
      `;
		})
		.join("");
	
	const pageHtml = `
    <div class="page reservations-page">
      <div class="page-header">
        <div>${escapeHtml((ctx.trip.title || "無題の旅行").toUpperCase())} - RESERVATIONS</div>
      </div>
      
      <div class="page-title">Reservations</div>
      <div class="page-subtitle">予約情報</div>
      
      <div class="reservations-content">
        ${sections}
      </div>
      
      <div class="page-footer">
        <div>2 | caglla travel manager</div>
      </div>
    </div>
  `;

	return [pageHtml];
}
