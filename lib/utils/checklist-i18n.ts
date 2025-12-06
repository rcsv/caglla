/**
 * チェックリストアイテムのi18n解決ユーティリティ
 */

import { t } from "@/lib/i18n";
import type { ChecklistItem } from "@/lib/core/types/activity";

/**
 * チェックリストアイテムのi18nキーを解決
 * i18nキーの形式: checklist.items.{ruleId}.{itemKey}.{field}
 * 
 * @param item - チェックリストアイテム（title/description/longDescriptionがi18nキーまたは直接テキスト）
 * @param ruleId - ルールID（generatedFromから取得可能）
 * @param itemKey - アイテムキー（マスタデータのitemKeyから取得可能）
 * @returns 解決されたテキスト（i18nキーが存在しない場合は元の文字列を返す）
 */
export function resolveChecklistItemText(
	item: ChecklistItem & { itemKey?: string },
	ruleId?: string,
	itemKey?: string,
): {
	title: string;
	description?: string;
	longDescription?: string;
} {
	// item.titleが既にi18nキーの場合は、それを直接解決
	if (item.title.startsWith("checklist.items.")) {
		// i18nキーからruleIdとitemKeyを抽出（例: "checklist.items.lunch_rule.allergy_translation.title"）
		const titleMatch = item.title.match(/^checklist\.items\.([^.]+)\.([^.]+)\.title$/);
		if (titleMatch) {
			const extractedRuleId = titleMatch[1];
			const extractedItemKey = titleMatch[2];
			
			// descriptionとlongDescriptionも同じruleIdとitemKeyを使用して解決
			const descriptionKey = item.description?.startsWith("checklist.items.")
				? item.description
				: `checklist.items.${extractedRuleId}.${extractedItemKey}.description`;
			const longDescriptionKey = item.longDescription?.startsWith("checklist.items.")
				? item.longDescription
				: `checklist.items.${extractedRuleId}.${extractedItemKey}.longDescription`;

			return {
				title: tryResolveI18nKey(item.title, item.title),
				description: item.description
					? tryResolveI18nKey(descriptionKey, item.description)
					: undefined,
				longDescription: item.longDescription
					? tryResolveI18nKey(longDescriptionKey, item.longDescription)
					: undefined,
			};
		}
		// パターンが一致しない場合は、そのまま解決を試みる
		return {
			title: tryResolveI18nKey(item.title, item.title),
			description: item.description?.startsWith("checklist.items.")
				? tryResolveI18nKey(item.description, item.description)
				: item.description,
			longDescription: item.longDescription?.startsWith("checklist.items.")
				? tryResolveI18nKey(item.longDescription, item.longDescription)
				: item.longDescription,
		};
	}

	// ruleIdが未指定の場合は、item.ruleId → item.generatedFrom → "unknown"の順で使用
	const actualRuleId = ruleId || item.ruleId || item.generatedFrom || "unknown";
	
	// itemKeyが未指定の場合はtitleから生成（スラッグ化）
	const actualItemKey = itemKey || item.itemKey || slugify(item.title);

	// i18nキーを構築
	const titleKey = `checklist.items.${actualRuleId}.${actualItemKey}.title`;
	const descriptionKey = `checklist.items.${actualRuleId}.${actualItemKey}.description`;
	const longDescriptionKey = `checklist.items.${actualRuleId}.${actualItemKey}.longDescription`;

	// i18nキーを解決（存在しない場合は元の文字列を返す）
	const resolvedTitle = tryResolveI18nKey(titleKey, item.title);
	const resolvedDescription = item.description
		? tryResolveI18nKey(descriptionKey, item.description)
		: undefined;
	const resolvedLongDescription = item.longDescription
		? tryResolveI18nKey(longDescriptionKey, item.longDescription)
		: undefined;

	return {
		title: resolvedTitle,
		description: resolvedDescription,
		longDescription: resolvedLongDescription,
	};
}

/**
 * i18nキーを解決を試みる（存在しない場合はフォールバック値を返す）
 */
function tryResolveI18nKey(
	key: string,
	fallback: string,
): string {
	try {
		const resolved = t(key as any);
		// キーが存在しない場合、t()はキー自体を返す可能性がある
		// その場合はフォールバックを使用
		if (resolved === key) {
			return fallback;
		}
		return resolved;
	} catch {
		return fallback;
	}
}

/**
 * 文字列をスラッグ化（i18nキー用）
 */
function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^\w\s-]/g, "") // 特殊文字を削除
		.replace(/\s+/g, "_") // スペースをアンダースコアに
		.replace(/-+/g, "_") // ハイフンをアンダースコアに
		.replace(/^_+|_+$/g, ""); // 先頭・末尾のアンダースコアを削除
}

