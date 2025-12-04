/**
 * 緊急連絡先ページテンプレート
 */

import type { PdfContext } from "../types";
import { escapeHtml } from "../helpers/utils";

/**
 * 緊急連絡先ページを生成
 * @returns ページHTMLの配列（1ページ分）
 */
export function generateEmergencyPage(ctx: PdfContext): string[] {
	const { trip, days } = ctx;

	const pageHtml = `
    <div class="page emergency-page">
      <div class="page-header">
        <div>${escapeHtml(trip.title || "無題の旅行").toUpperCase()} - EMERGENCY CONTACTS</div>
      </div>
      
      <div class="page-title">Emergency Contacts</div>
      <div class="page-subtitle">緊急連絡先</div>
      
      <div class="emergency-content">
        not implemented yet
      </div>
      
      <div class="page-footer">
        <div>${3 + days.length} | caglla travel manager</div>
      </div>
    </div>
  `;

	return [pageHtml];
}
