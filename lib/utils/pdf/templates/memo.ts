/**
 * メモページテンプレート
 */

import type { PdfContext } from "../types";
import { escapeHtml } from "../helpers/utils";

/**
 * メモページを生成
 * @returns ページHTMLの配列（1ページ分）
 */
export function generateMemoPage(ctx: PdfContext): string[] {
	const { trip, days } = ctx;

	const memoQuotes = [
		"To travel is to live. - Hans Christian Andersen",
		"The journey of a thousand miles begins with a single step. - Lao Tzu",
		"Adventure awaits those who dare to explore. - Unknown",
		"Travel makes one modest. You see what a tiny place you occupy in the world. - Gustave Flaubert",
		"Life is either a daring adventure or nothing at all. - Helen Keller",
	];
	const randomQuote = memoQuotes[Math.floor(Math.random() * memoQuotes.length)];

	const pageHtml = `
    <div class="page memo-page">
      <div class="page-header">
        <div>${escapeHtml(trip.title || "無題の旅行").toUpperCase()} - MEMO</div>
      </div>
      
      <div class="page-title">Memo</div>
      <div class="page-subtitle">メモ</div>
      
      <div class="memo-subtitle">My highlight</div>
      
      <div class="memo-lines">
        ${Array.from({ length: 20 }, () => '<div class="memo-line"></div>').join("")}
      </div>
      
      <div class="memo-quote">
        ${randomQuote}
      </div>
      
      <div class="page-footer">
        <div>${4 + days.length} | caglla travel manager</div>
      </div>
    </div>
  `;

	return [pageHtml];
}
