/**
 * 旅程ページテンプレート
 */

import type { PdfContext } from "../types";
import { escapeHtml } from "../helpers/utils";
import { extractLodgingItineraries, generateLodgingSidebar } from "../helpers/lodging";
import { toDateOrNull } from "@/lib/firebase/timestamp-utils";
import { dateUtils } from "@/lib/utils/date";
import { t } from "@/lib/i18n";
import type { SupportedLanguage } from "@/lib/core/types";

/**
 * 旅程ページを生成（各日付ごとに1ページ）
 * @returns ページHTMLの配列（各日付ごとに1ページ）
 */
export function generateItineraryPages(ctx: PdfContext): string[] {
	const { trip, days, itinerariesByDay, config } = ctx;
	const language = (config.language || "en") as SupportedLanguage;

	return days
		.sort((a, b) => {
			const dateA = toDateOrNull(a.date);
			const dateB = toDateOrNull(b.date);
			if (!dateA || !dateB) return 0;
			return dateA.getTime() - dateB.getTime();
		})
		.map((day, index) => {
			const dayDate = toDateOrNull(day.date);
			const dayTitle = dayDate
				? `${dateUtils.formatDate(dayDate)} (Day ${index + 1})`
				: `Day ${index + 1}`;

			const itineraries = itinerariesByDay[day.id] || [];
			const sortedItineraries = itineraries.sort((a, b) => {
				const timeA = a.start_time || "";
				const timeB = b.start_time || "";
				return timeA.localeCompare(timeB);
			});

			// Lodging（accommodation）を抽出
			const lodgingItineraries = extractLodgingItineraries(sortedItineraries);
			const lodgingSidebar = generateLodgingSidebar(lodgingItineraries, language);

			// 2段組レイアウトかどうか（5つ以上の予定がある場合）
			const useTwoColumns = sortedItineraries.length >= 5;
			const gridClass = useTwoColumns ? "two-columns" : "";
			
			// 列優先レイアウトのための行数を計算
			const itemCount = sortedItineraries.length;
			const rowCount = useTwoColumns ? Math.ceil(itemCount / 2) : itemCount;
			const gridStyle = useTwoColumns
				? `style="grid-template-rows: repeat(${rowCount}, auto);"`
				: "";

			const itineraryItems =
				sortedItineraries.length > 0
					? sortedItineraries
							.map((item, itemIndex) => {
								// 2列レイアウトの場合の矢印を決定
								let arrows = "";
								if (useTwoColumns) {
									const rowCount = Math.ceil(itemCount / 2);
									const isLeftColumn = itemIndex < rowCount;
									const isRightColumn = itemIndex >= rowCount;
									const isLastInLeftColumn = itemIndex === rowCount - 1;
									const isFirstInRightColumn = itemIndex === rowCount;
									const isLastItem = itemIndex === itemCount - 1;
									
									// 左列のアイテム（最後以外）→ 下矢印
									if (isLeftColumn && !isLastInLeftColumn) {
										arrows += '<div class="itinerary-arrow down">↓</div>';
									}
									// 左列の最後のアイテム → 右下矢印（下と右の組み合わせ）
									if (isLastInLeftColumn) {
										arrows += '<div class="itinerary-arrow down">↓</div>';
										arrows += '<div class="itinerary-arrow horizontal left-to-right">→</div>';
									}
									// 右列の最初のアイテム → 上矢印
									if (isFirstInRightColumn) {
										arrows += '<div class="itinerary-arrow up">↑</div>';
									}
									// 右列のアイテム（最後以外）→ 下矢印
									if (isRightColumn && !isLastItem) {
										arrows += '<div class="itinerary-arrow down">↓</div>';
									}
								}
								
								return `
            <div class="itinerary-item">
              ${item.start_time ? `<div class="itinerary-time">⏰ ${item.start_time}</div>` : ""}
              <div class="itinerary-name">${escapeHtml(item.title || t("pdf.itinerary.untitled", language))}</div>
              ${item.description ? `<div class="itinerary-description">${escapeHtml(item.description)}</div>` : ""}
              ${(item as any).note ? `<div class="itinerary-note">${escapeHtml((item as any).note)}</div>` : ""}
              ${(item as any).address ? `<div class="itinerary-address">📍 ${escapeHtml((item as any).address)}</div>` : ""}
              ${arrows}
            </div>
          `;
							})
							.join("")
					: `<div class="reservations-content">${escapeHtml(t("pdf.itinerary.empty", language))}</div>`;

			return `
        <div class="page itinerary-page">
          <div class="page-header">
            <div>${escapeHtml((trip.title || t("pdf.trip.untitled", language)).toUpperCase())} - DAILY SCHEDULE</div>
          </div>
          
          <div class="itinerary-page-content">
            <div class="itinerary-main">
              <div class="day-title">${dayTitle}</div>
              <div class="itinerary-items-grid ${gridClass}" ${gridStyle}>
                ${itineraryItems}
              </div>
            </div>
            ${lodgingSidebar}
          </div>
          
          <div class="page-footer">
            <div>${3 + index} | caglla travel manager</div>
          </div>
        </div>
      `;
		});
}
