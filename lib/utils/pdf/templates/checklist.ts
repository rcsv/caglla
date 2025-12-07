/**
 * チェックリストページテンプレート
 */

import type { PdfContext } from "../types";
import { resolveChecklistItemText } from "@/lib/utils/checklist-i18n";
import { t } from "@/lib/i18n";
import { escapeHtml } from "../helpers/utils";

/**
 * チェックリストページを生成
 * @returns ページHTMLの配列（複数ページに分割される可能性がある）
 */
export function generateChecklistPage(ctx: PdfContext): string[] {
	const { checklist = [], config } = ctx;
	const language = config.language || "en";

	// チェックリストがない場合は空のページを返す
	if (!checklist || checklist.length === 0) {
		const emptyPageHtml = `
      <div class="page checklist-page">
        <div class="page-header">
          <div>APPENDIX - CHECKLIST</div>
        </div>
        
        <div class="page-title">${t("checklist.title", language)}</div>
        
        <div class="checklist-content">
          <p style="color: #666; font-style: italic; text-align: center; margin-top: 100px;">
            ${t("checklist.noItems", language)}
          </p>
        </div>
        
        <div class="page-footer">
          <div>i | caglla travel manager</div>
        </div>
      </div>
    `;
		return [emptyPageHtml];
	}

	// カテゴリー別に分類
	const preparationItems = checklist.filter(
		(item) => item.category === "preparation",
	);
	const packingItems = checklist.filter(
		(item) => item.category === "packing",
	);

	// アイテムを解決（i18nキーから実際のテキストに変換）
	const resolveItems = (items: typeof checklist) => {
		return items.map((item) => {
			const resolved = resolveChecklistItemText(
				item,
				item.ruleId,
				item.itemKey,
			);
			return {
				...item,
				resolvedTitle: resolved.title,
				resolvedDescription: resolved.description,
			};
		});
	};

	const resolvedPreparation = resolveItems(preparationItems);
	const resolvedPacking = resolveItems(packingItems);

	// ページ生成（1ページに収まるように調整 - コンパクト形式）
	const generateChecklistSection = (
		title: string,
		items: typeof resolvedPreparation,
	) => {
		if (items.length === 0) return "";

		const itemsHtml = items
			.map((item) => {
				const checked = item.done ? "☑" : "☐";
				return `
          <div class="checklist-item-compact">
            <span class="checklist-checkbox-compact">${checked}</span>
            <span class="checklist-title-compact">${escapeHtml(item.resolvedTitle)}</span>
          </div>
        `;
			})
			.join("");

		return `
      <div class="checklist-section">
        <h3 class="checklist-section-title">${escapeHtml(title)}</h3>
        <div class="checklist-items-compact">
          ${itemsHtml}
        </div>
      </div>
    `;
	};

	const pageHtml = `
    <div class="page checklist-page">
      <div class="page-header">
        <div>APPENDIX - CHECKLIST</div>
      </div>
      
      <div class="page-title">${t("checklist.title", language)}</div>
      
      <div class="checklist-content">
        ${generateChecklistSection(t("checklist.preparing.title", language), resolvedPreparation)}
        ${generateChecklistSection(t("checklist.packing.title", language), resolvedPacking)}
      </div>
      
      <div class="page-footer">
        <div>i | caglla travel manager</div>
      </div>
    </div>
  `;

	return [pageHtml];
}
