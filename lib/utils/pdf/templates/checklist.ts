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
        not implemented yet
      </div>
      
      <div class="page-footer">
        <div>i | caglla travel manager</div>
      </div>
    </div>
  `;

	return [pageHtml];
}
