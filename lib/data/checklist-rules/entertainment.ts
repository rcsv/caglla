/**
 * Entertainment（遊び）関連のチェックリストルール
 */

import type { ChecklistGenerationRule } from "./types";

export const ENTERTAINMENT_RULES: ChecklistGenerationRule[] = [
	{
		id: "beach_rule",
		secondaryCategory: "beach",
		items: [
			{
				itemKey: "swimsuit",
				title: "checklist.items.beach_rule.swimsuit.title",
				description: "checklist.items.beach_rule.swimsuit.description",
				category: "packing",
				priority: "high",
				condition: { type: "always" },
			},
			{
				itemKey: "sandals_beach_sandals",
				title: "checklist.items.beach_rule.sandals_beach_sandals.title",
				description: "checklist.items.beach_rule.sandals_beach_sandals.description",
				category: "packing",
				priority: "high",
				condition: { type: "always" },
			},
			{
				itemKey: "sunscreen",
				title: "checklist.items.beach_rule.sunscreen.title",
				description: "checklist.items.beach_rule.sunscreen.description",
				category: "packing",
				priority: "high",
				condition: { type: "always" },
			},
			{
				itemKey: "sunglasses",
				title: "checklist.items.beach_rule.sunglasses.title",
				description: "checklist.items.beach_rule.sunglasses.description",
				category: "packing",
				priority: "medium",
				condition: { type: "always" },
			},
			{
				itemKey: "beach_bag",
				title: "checklist.items.beach_rule.beach_bag.title",
				description: "checklist.items.beach_rule.beach_bag.description",
				category: "packing",
				priority: "low",
				condition: { type: "always" },
			},
		],
	},
];
