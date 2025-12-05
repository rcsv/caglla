/**
 * メモページテンプレート
 */

import type { PdfContext } from "../types";
import { escapeHtml, getDeterministicIndex } from "../helpers/utils";
import { t } from "@/lib/i18n";
import type { SupportedLanguage } from "@/lib/core/types";

/**
 * メモページを生成
 * @returns ページHTMLの配列（1ページ分）
 */
export function generateMemoPage(ctx: PdfContext): string[] {
	const { trip, days, config } = ctx;
	const language = (config.language || "en") as SupportedLanguage;

	const memoQuotes = [
		"To travel is to live. - Hans Christian Andersen",
		"The journey of a thousand miles begins with a single step. - Lao Tzu",
		"Adventure awaits those who dare to explore. - Unknown",
		"Travel makes one modest. You see what a tiny place you occupy in the world. - Gustave Flaubert",
		"Life is either a daring adventure or nothing at all. - Helen Keller",
	];
	const quoteIndex = getDeterministicIndex(trip.id, memoQuotes.length);
	const selectedQuote = memoQuotes[quoteIndex];

	const pageHtml = `
    <div class="page memo-page">
      <div class="page-header">
        <div>${escapeHtml((trip.title || t("pdf.trip.untitled", language)).toUpperCase())} - ${escapeHtml(t("pdf.memo.header", language))}</div>
      </div>
      
      <div class="page-title">${escapeHtml(t("pdf.memo.title", language))}</div>
      <div class="page-subtitle">${escapeHtml(t("pdf.memo.subtitle", language))}</div>
      
      <div class="memo-subtitle">${escapeHtml(t("pdf.memo.highlight", language))}</div>
      
      <div class="memo-lines">
        ${Array.from({ length: 20 }, () => '<div class="memo-line"></div>').join("")}
      </div>
      
      <div class="memo-quote">
        ${selectedQuote}
      </div>
      
      <div class="page-footer">
        <div>${4 + days.length} | caglla travel manager</div>
      </div>
    </div>
  `;

	return [pageHtml];
}
