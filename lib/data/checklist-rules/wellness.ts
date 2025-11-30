/**
 * Wellness（健康）関連のチェックリストルール
 */

import { ChecklistGenerationRule } from "./types";

export const WELLNESS_RULES: ChecklistGenerationRule[] = [
	{
		id: "spa_rule",
		secondaryCategory: "spa",
		items: [
			{
				title: "水着（スパによっては必要）",
				description: "スパの規定を確認",
				category: "packing",
				priority: "medium",
				condition: { type: "always" },
			},
			{
				title: "サンダル",
				description: "スパ内での移動用",
				category: "packing",
				priority: "low",
				condition: { type: "always" },
			},
		],
	},
];
