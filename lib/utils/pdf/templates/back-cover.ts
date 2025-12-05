/**
 * 裏表紙ページテンプレート
 */

import type { PdfContext } from "../types";

/**
 * 裏表紙ページを生成
 * @returns ページHTMLの配列（1ページ分）
 */
export function generateBackCoverPage(ctx: PdfContext): string[] {
	const pageHtml = `
    <div class="page back-cover-page">
      <div class="back-cover-title">Caglla</div>
      <div class="back-cover-meta">
        Travel Manager<br>
        <br>
        Website: https://caglla.travel<br>
        Version: 1.0<br>
        <br>
        This travel companion book was created using Caglla Travel Manager.<br>
        Please make sure to double-check all reservations, times, and contact details before departure.
      </div>
    </div>
  `;

	return [pageHtml];
}
