/**
 * Wellness（健康）関連のチェックリストルール
 */

import type{ ChecklistGenerationRule } from "./types";

export const WELLNESS_RULES: ChecklistGenerationRule[] = [
	{
		id: "spa_rule",
		secondaryCategory: "spa",
		items: [
			{
				itemKey: "swimsuit_for_spa",
				title: "checklist.items.spa_rule.swimsuit_for_spa.title",
				description: "checklist.items.spa_rule.swimsuit_for_spa.description",
				longDescription: "checklist.items.spa_rule.swimsuit_for_spa.longDescription",
				category: "packing",
				priority: "medium",
				condition: { type: "always" },
			},
			{
				itemKey: "sandals",
				title: "checklist.items.spa_rule.sandals.title",
				description: "checklist.items.spa_rule.sandals.description",
				longDescription: "checklist.items.spa_rule.sandals.longDescription",
				category: "packing",
				priority: "low",
				condition: { type: "always" },
			},
		],
	},
];
