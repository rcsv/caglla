/**
 * Culture（文化）関連のチェックリストルール
 */

import type { ChecklistGenerationRule } from "./types";

export const CULTURE_RULES: ChecklistGenerationRule[] = [
	{
		id: "aquarium_rule",
		secondaryCategory: "aquarium",
		items: [
			{
				title: "カメラ・スマホ",
				description: "海洋生物の撮影用",
				category: "packing",
				priority: "medium",
				condition: { type: "always" },
			},
			{
				title: "双眼鏡",
				description: "遠くの生物観察に便利",
				category: "packing",
				priority: "low",
				condition: { type: "always" },
			},
			{
				title: "防水ケース",
				description: "水槽近くでの撮影用",
				category: "packing",
				priority: "low",
				condition: { type: "always" },
			},
		],
	},
	{
		id: "temple_shrine_rule",
		secondaryCategory: "temple_shrine",
		items: [
			{
				title: "長ズボンまたはロングスカート",
				description: "寺院・モスクでは肌の露出を控える",
				category: "packing",
				priority: "high",
				condition: { type: "destination", continents: ["AS", "AF"] },
			},
			{
				title: "ストール・スカーフ",
				description: "頭を覆う必要がある場合に",
				category: "packing",
				priority: "medium",
				condition: { type: "destination", continents: ["AS", "AF"] },
			},
		],
	},
];
