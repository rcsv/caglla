/**
 * 予約関連のヘルパー関数
 */

import type { Itinerary, ReservationInfo, ReservationType } from "@/lib/core/types";
import type { PdfContext } from "../types";
import { toDateOrNull } from "@/lib/firebase/timestamp-utils";
import { escapeHtml } from "./utils";

/**
 * 予約情報を抽出（itinerariesByDayから）
 */
export function extractReservations(ctx: PdfContext): Array<{
	itinerary: Itinerary;
	reservation: ReservationInfo;
}> {
	const reservations: Array<{ itinerary: Itinerary; reservation: ReservationInfo }> = [];
	
	if (!ctx.itinerariesByDay) return reservations;
	
	for (const dayId in ctx.itinerariesByDay) {
		const itineraries = ctx.itinerariesByDay[dayId] || [];
		for (const itinerary of itineraries) {
			if (itinerary.reservation) {
				reservations.push({
					itinerary,
					reservation: itinerary.reservation,
				});
			}
		}
	}
	
	return reservations;
}

/**
 * 予約タイプのラベルを取得
 */
export function getReservationTypeLabel(type: ReservationType): string {
	const labels: Record<ReservationType, string> = {
		flight: "Flight",
		hotel: "Hotel",
		rental_car: "Rental Car",
		dining: "Dining",
		other: "Other",
	};
	return labels[type] || type;
}

/**
 * 予約サイトのラベルを取得
 */
export function getReservationSiteLabel(site?: string): string {
	if (!site) return "";
	const labels: Record<string, string> = {
		expedia: "Expedia",
		booking_com: "Booking.com",
		agoda: "Agoda",
		airbnb: "Airbnb",
		kayak: "Kayak",
		skyscanner: "Skyscanner",
		tripadvisor: "TripAdvisor",
		opentable: "OpenTable",
		tabelog: "Tabelog",
		hot_pepper: "Hot Pepper",
		ana: "ANA",
		jal: "JAL",
		rakuten_travel: "Rakuten Travel",
		jalan: "Jalan",
	};
	return labels[site] || site;
}

/**
 * フライト予約カードを生成
 */
export function generateFlightReservationCard(
	itinerary: Itinerary,
	reservation: ReservationInfo,
): string {
	const departure = reservation.departure_airport || "";
	const arrival = reservation.arrival_airport || "";
	const flightNumber = reservation.flight_number || "";
	const airline = reservation.airline || "";
	
	const departureDate = reservation.departure_at
		? toDateOrNull(reservation.departure_at)
		: null;
	const arrivalDate = reservation.arrival_at
		? toDateOrNull(reservation.arrival_at)
		: null;
	
	const formatDateTime = (date: Date | null): string => {
		if (!date) return "";
		return date.toLocaleString("ja-JP", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
		});
	};
	
	const departureTime = formatDateTime(departureDate);
	const arrivalTime = formatDateTime(arrivalDate);
	
	return `
    <div class="reservation-card">
      <div class="reservation-card-title">${escapeHtml(itinerary.title || "Flight")}</div>
      
      ${departure && arrival ? `
        <div class="flight-info">
          <div class="flight-route">
            <div class="flight-airport">${escapeHtml(departure)}</div>
            <div class="flight-arrow">→</div>
            <div class="flight-airport">${escapeHtml(arrival)}</div>
          </div>
          <div class="flight-details">
            ${flightNumber ? `<div class="flight-number">${escapeHtml(flightNumber)}</div>` : ""}
            ${airline ? `<div>${escapeHtml(airline)}</div>` : ""}
          </div>
        </div>
      ` : ""}
      
      ${departureTime ? `
        <div class="reservation-info-row">
          <span class="reservation-info-label">Departure:</span>
          <span class="reservation-info-value">${escapeHtml(departureTime)}</span>
        </div>
      ` : ""}
      
      ${arrivalTime ? `
        <div class="reservation-info-row">
          <span class="reservation-info-label">Arrival:</span>
          <span class="reservation-info-value">${escapeHtml(arrivalTime)}</span>
        </div>
      ` : ""}
      
      ${reservation.confirmation_number ? `
        <div class="reservation-info-row">
          <span class="reservation-info-label">Confirmation:</span>
          <span class="reservation-info-value">${escapeHtml(reservation.confirmation_number)}</span>
        </div>
      ` : ""}
      
      ${reservation.reservation_site ? `
        <div class="reservation-info-row">
          <span class="reservation-info-label">Booking Site:</span>
          <span class="reservation-info-value">${escapeHtml(getReservationSiteLabel(reservation.reservation_site))}</span>
        </div>
      ` : ""}
      
      ${reservation.notes ? `
        <div class="reservation-info-row">
          <span class="reservation-info-label">Notes:</span>
          <span class="reservation-info-value">${escapeHtml(reservation.notes)}</span>
        </div>
      ` : ""}
    </div>
  `;
}

/**
 * 標準予約カードを生成（ホテル、レンタカー、食事、その他）
 */
export function generateStandardReservationCard(
	itinerary: Itinerary,
	reservation: ReservationInfo,
): string {
	const startDate = reservation.start_date
		? toDateOrNull(reservation.start_date)
		: null;
	const endDate = reservation.end_date
		? toDateOrNull(reservation.end_date)
		: null;
	
	const formatDateTime = (date: Date | null): string => {
		if (!date) return "";
		return date.toLocaleString("ja-JP", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
		});
	};
	
	const startTime = formatDateTime(startDate);
	const endTime = formatDateTime(endDate);
	
	return `
    <div class="reservation-card">
      <div class="reservation-card-title">${escapeHtml(itinerary.title || "Reservation")}</div>
      
      ${startTime ? `
        <div class="reservation-info-row">
          <span class="reservation-info-label">Start:</span>
          <span class="reservation-info-value">${escapeHtml(startTime)}</span>
        </div>
      ` : ""}
      
      ${endTime ? `
        <div class="reservation-info-row">
          <span class="reservation-info-label">End:</span>
          <span class="reservation-info-value">${escapeHtml(endTime)}</span>
        </div>
      ` : ""}
      
      ${reservation.confirmation_number ? `
        <div class="reservation-info-row">
          <span class="reservation-info-label">Confirmation:</span>
          <span class="reservation-info-value">${escapeHtml(reservation.confirmation_number)}</span>
        </div>
      ` : ""}
      
      ${reservation.reservation_site ? `
        <div class="reservation-info-row">
          <span class="reservation-info-label">Booking Site:</span>
          <span class="reservation-info-value">${escapeHtml(getReservationSiteLabel(reservation.reservation_site))}</span>
        </div>
      ` : ""}
      
      ${itinerary.location || itinerary.place_data?.formatted_address ? `
        <div class="reservation-info-row">
          <span class="reservation-info-label">Location:</span>
          <span class="reservation-info-value">${escapeHtml(itinerary.location || itinerary.place_data?.formatted_address || "")}</span>
        </div>
      ` : ""}
      
      ${reservation.notes ? `
        <div class="reservation-info-row">
          <span class="reservation-info-label">Notes:</span>
          <span class="reservation-info-value">${escapeHtml(reservation.notes)}</span>
        </div>
      ` : ""}
    </div>
  `;
}
