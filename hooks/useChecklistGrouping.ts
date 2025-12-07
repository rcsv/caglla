import { useMemo } from "react";
import type { ChecklistItem } from "@/lib/core/types";
import { getPrimaryCategoryFromSecondary } from "@/lib/data/activity-categories";

interface GroupedItems {
	[key: string]: ChecklistItem[];
}

export function useChecklistGrouping(items: ChecklistItem[]) {
	const groupedPrepItems = useMemo(() => {
		const prepItems = items.filter((i) => i.category === "preparation");
		return prepItems.reduce((acc, item) => {
			let groupKey = "custom";

			// カスタムアイテムは常にcustomグループ
			if (item.isCustom) {
				groupKey = "custom";
			} else if (item.generatedFrom) {
				// generatedFromが有効かチェック
				const primaryCategory = getPrimaryCategoryFromSecondary(
					item.generatedFrom,
				);
				if (primaryCategory) {
					groupKey = item.generatedFrom; // secondaryCategory ID
				}
				// primaryCategoryがnullの場合はcustomグループへfallback
			}

			if (!acc[groupKey]) acc[groupKey] = [];
			acc[groupKey].push(item);
			return acc;
		}, {} as GroupedItems);
	}, [items]);

	const groupedPackItems = useMemo(() => {
		const packItems = items.filter((i) => i.category === "packing");
		return packItems.reduce((acc, item) => {
			let groupKey = "custom";

			// カスタムアイテムは常にcustomグループ
			if (item.isCustom) {
				groupKey = "custom";
			} else if (item.generatedFrom) {
				// generatedFromが有効かチェック
				const primaryCategory = getPrimaryCategoryFromSecondary(
					item.generatedFrom,
				);
				if (primaryCategory) {
					groupKey = item.generatedFrom; // secondaryCategory ID
				}
				// primaryCategoryがnullの場合はcustomグループへfallback
			}

			if (!acc[groupKey]) acc[groupKey] = [];
			acc[groupKey].push(item);
			return acc;
		}, {} as GroupedItems);
	}, [items]);

	return {
		groupedPrepItems,
		groupedPackItems,
	};
}

