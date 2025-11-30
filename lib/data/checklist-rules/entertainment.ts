/**
 * Entertainment（遊び）関連のチェックリストルール
 */

import { ChecklistGenerationRule } from "./types";

export const ENTERTAINMENT_RULES: ChecklistGenerationRule[] = [
	{
		id: "beach_rule",
		secondaryCategory: "beach",
		items: [
			{
				title: "水着",
				description: "ビーチで泳ぐ場合",
				category: "packing",
				priority: "high",
				condition: { type: "always" },
			},
			{
				title: "サンダル・ビーチサンダル",
				description: "ビーチ用の履物",
				category: "packing",
				priority: "high",
				condition: { type: "always" },
			},
			{
				title: "日焼け止め",
				description: "SPF50+推奨",
				category: "packing",
				priority: "high",
				condition: { type: "always" },
			},
			{
				title: "サングラス",
				description: "紫外線から目を守る",
				category: "packing",
				priority: "medium",
				condition: { type: "always" },
			},
			{
				title: "ビーチバッグ",
				description: "荷物を砂から守る",
				category: "packing",
				priority: "low",
				condition: { type: "always" },
			},
		],
	},
];
