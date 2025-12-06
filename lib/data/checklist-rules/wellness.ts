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
				title: "水着（スパによっては必要）",
				description: "スパの規定を確認",
				longDescription: "バスやシャワーでのルールによっては、水泳帽が必要な場合があります。",
				category: "packing",
				priority: "medium",
				condition: { type: "always" },
			},
			{
				title: "サンダル",
				description: "スパ内での移動用",
				longDescription: "スパ内での移動に便利なサンダルを持ち込みましょう。",
				category: "packing",
				priority: "low",
				condition: { type: "always" },
			},
		],
	},
];
