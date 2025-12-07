/**
 * Shopping（買い物）関連のチェックリストルール
 */

import type { ChecklistGenerationRule } from "./types";

export const SHOPPING_RULES: ChecklistGenerationRule[] = [
	{
		id: "shopping_rule",
		secondaryCategory: "souvenir",
		items: [
			{
				itemKey: "eco_bag_folding",
				title: "checklist.items.shopping_rule.eco_bag_folding.title",
				description: "checklist.items.shopping_rule.eco_bag_folding.description",
				longDescription: "checklist.items.shopping_rule.eco_bag_folding.longDescription",
				category: "packing",
				priority: "medium",
				condition: { type: "always" },
			},
			{
				itemKey: "cash_souvenir_budget",
				title: "checklist.items.shopping_rule.cash_souvenir_budget.title",
				description: "checklist.items.shopping_rule.cash_souvenir_budget.description",
				longDescription: "checklist.items.shopping_rule.cash_souvenir_budget.longDescription",
				category: "packing",
				priority: "medium",
				condition: { type: "always" },
			},
		],
	},
];
