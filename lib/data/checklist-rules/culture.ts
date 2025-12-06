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
				itemKey: "camera_smartphone",
				title: "checklist.items.aquarium_rule.camera_smartphone.title",
				description: "checklist.items.aquarium_rule.camera_smartphone.description",
				category: "packing",
				priority: "medium",
				condition: { type: "always" },
			},
			{
				itemKey: "binoculars",
				title: "checklist.items.aquarium_rule.binoculars.title",
				description: "checklist.items.aquarium_rule.binoculars.description",
				category: "packing",
				priority: "low",
				condition: { type: "always" },
			},
			{
				itemKey: "waterproof_case",
				title: "checklist.items.aquarium_rule.waterproof_case.title",
				description: "checklist.items.aquarium_rule.waterproof_case.description",
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
				itemKey: "long_pants_skirt",
				title: "checklist.items.temple_shrine_rule.long_pants_skirt.title",
				description: "checklist.items.temple_shrine_rule.long_pants_skirt.description",
				category: "packing",
				priority: "high",
				condition: { type: "destination", continents: ["AS", "AF"] },
			},
			{
				itemKey: "stole_scarf",
				title: "checklist.items.temple_shrine_rule.stole_scarf.title",
				description: "checklist.items.temple_shrine_rule.stole_scarf.description",
				category: "packing",
				priority: "medium",
				condition: { type: "destination", continents: ["AS", "AF"] },
			},
		],
	},
];
