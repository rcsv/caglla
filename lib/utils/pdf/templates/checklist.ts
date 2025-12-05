/**
 * チェックリストページテンプレート
 */

import type { PdfContext } from "../types";

/**
 * チェックリストページを生成
 * @returns ページHTMLの配列（1ページ分）
 */
export function generateChecklistPage(ctx: PdfContext): string[] {
	const pageHtml = `
    <div class="page checklist-page">
      <div class="page-header">
        <div>APPENDIX - CHECKLIST</div>
      </div>
      
      <div class="page-title">Checklist</div>
      <div class="page-subtitle">チェックリスト</div>
      
      <div class="checklist-content">
        <p style="color: #666; font-style: italic;">このセクションは準備中です。旅行前に必要な準備項目を別途チェックリストとして作成することをお勧めします。</p>
      </div>
      
      <div class="page-footer">
        <div>i | caglla travel manager</div>
      </div>
    </div>
  `;

	return [pageHtml];
}
