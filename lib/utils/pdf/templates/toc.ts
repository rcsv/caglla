/**
 * 目次ページテンプレート
 */

import type { PdfContext } from "../types";
import { escapeHtml } from "../helpers/utils";
import { generateStaticMapUrl } from "../helpers/map";
import { toDateOrNull } from "@/lib/firebase/timestamp-utils";
import { dateUtils } from "@/lib/utils/date";

/**
 * 目次ページを生成
 * @returns ページHTMLの配列（1ページ分）
 */
export function generateTocPage(ctx: PdfContext): string[] {
	const { trip, days } = ctx;
	
	const startDate = trip.start_date
		? dateUtils.formatDate(toDateOrNull(trip.start_date) || new Date())
		: "未定";
	const endDate = trip.end_date
		? dateUtils.formatDate(toDateOrNull(trip.end_date) || new Date())
		: "未定";

	// 自動生成の格言
	const quotes = [
		"This trip isn't just a plan. It's a story waiting to be written.",
		"Adventure awaits those who dare to explore.",
		"Travel is the only thing you buy that makes you richer.",
		"The world is a book, and those who do not travel read only one page.",
		"Life is either a daring adventure or nothing at all.",
	];
	const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

	// Google Maps Static APIのURLを生成
	const mapUrl = generateStaticMapUrl(
		trip.destination_place_id,
		(trip as any).destination_place,
	);
	const mapImageHtml = mapUrl
		? `<img src="${escapeHtml(mapUrl)}" alt="Destination Map" style="width: 100%; height: 100%; object-fit: cover;" />`
		: `<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666; font-size: 10pt;">🗺️ 主要目的地の地図<br><small>${escapeHtml(trip.destination || "目的地")}</small></div>`;

	// 表紙画像の取得
	const coverImage =
		(trip as any).cover_image || (trip as any).image_url || "";

	const pageHtml = `
    <div class="page toc-page">
      <div class="page-header">
        <div>${escapeHtml(trip.title || "無題の旅行").toUpperCase()} - TABLE OF CONTENTS</div>
      </div>
      
      <div class="toc-header">
        <div class="toc-brand-title">CAGLLA</div>
        <div class="toc-title">TABLE OF CONTENTS</div>
      </div>
      
      <div class="toc-content">
        <div class="toc-left">
          <div class="toc-main-title">${escapeHtml(trip.title || "無題の旅行")}</div>
          <div class="toc-meta">${days.length}日間の旅行 | ${escapeHtml(trip.destination || "目的地")}</div>
          <div class="toc-meta-sub">${startDate} - ${endDate}</div>
          <div class="toc-meta-description">${escapeHtml(trip.description || "No description")}</div>
          
          <div class="toc-section">
            <div class="toc-section-title">ARTICLES</div>
            <div class="toc-item">
              <div class="toc-item-title">Reservations</div>
              <div class="toc-item-page">2</div>
            </div>
            <div class="toc-item">
              <div class="toc-item-title">Daily Schedule</div>
              <div class="toc-item-page">3</div>
            </div>
            <div class="toc-item">
              <div class="toc-item-title">Emergency Contacts</div>
              <div class="toc-item-page">${3 + days.length}</div>
            </div>
            <div class="toc-item">
              <div class="toc-item-title">MEMO メモ</div>
              <div class="toc-item-page">${4 + days.length}</div>
            </div>
          </div>
          
          <div class="toc-section">
            <div class="toc-section-title">Appendix</div>
            <div class="toc-item">
              <div class="toc-item-title">A. CHECKLIST チェックリスト</div>
              <div class="toc-item-page">i</div>
            </div>
          </div>
        </div>
        
        <div class="toc-right">
          <div class="toc-map">
            ${mapImageHtml}
          </div>
          
          <div class="toc-quote">
            "${randomQuote}"
          </div>
          
          <div class="toc-colophon">
            <div>This travel companion book was created using "Caglla Travel Manager".</div>
            <div>Published on ${new Date().toLocaleDateString("ja-JP")}</div>
            <div>Website: https://caglla.travel</div>
            <div>Printed in PDF</div>
            <div>Version: 1.0</div>
            <br>
            <div>This booklet is for reference only. Please verify all information before your trip.</div>
          </div>

          ${coverImage ? `
          <div class="toc-cover-image">
            <div class="toc-cover-image-title">Cover Image</div>
            <img src="${escapeHtml(coverImage)}" alt="Cover Image" />
            <div class="toc-cover-caption">
              Local image of the destination. Selected by: ${escapeHtml((trip as any).creator_name || (trip as any).creator?.name || "Unknown")}
            </div>
          </div>
          ` : ""}
        </div>
      </div>
      
      <div class="page-footer">
        <div>CAGLLA TRAVEL MANAGER | 1</div>
      </div>
    </div>
  `;

	return [pageHtml];
}
