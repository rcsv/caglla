/**
 * Adventure（探検）関連のチェックリストルール
 */

import type { ChecklistGenerationRule } from "./types";

export const ADVENTURE_RULES: ChecklistGenerationRule[] = [
	{
		id: "hiking_rule",
		secondaryCategory: "hiking",
		items: [
			{
				itemKey: "trekking_shoes",
				title: "checklist.items.hiking_rule.trekking_shoes.title",
				description: "checklist.items.hiking_rule.trekking_shoes.description",
				category: "packing",
				priority: "high",
				condition: { type: "always" },
			},
			{
				itemKey: "rainwear",
				title: "checklist.items.hiking_rule.rainwear.title",
				description: "checklist.items.hiking_rule.rainwear.description",
				category: "packing",
				priority: "high",
				condition: { type: "always" },
			},
			{
				itemKey: "hat_sunglasses",
				title: "checklist.items.hiking_rule.hat_sunglasses.title",
				description: "checklist.items.hiking_rule.hat_sunglasses.description",
				category: "packing",
				priority: "medium",
				condition: { type: "always" },
			},
			{
				itemKey: "water_bottle_hydration",
				title: "checklist.items.hiking_rule.water_bottle_hydration.title",
				description: "checklist.items.hiking_rule.water_bottle_hydration.description",
				category: "packing",
				priority: "high",
				condition: { type: "always" },
			},
			{
				itemKey: "trail_food_energy_bar",
				title: "checklist.items.hiking_rule.trail_food_energy_bar.title",
				description: "checklist.items.hiking_rule.trail_food_energy_bar.description",
				category: "packing",
				priority: "medium",
				condition: { type: "always" },
			},
			{
				itemKey: "first_aid_kit",
				title: "checklist.items.hiking_rule.first_aid_kit.title",
				description: "checklist.items.hiking_rule.first_aid_kit.description",
				category: "packing",
				priority: "high",
				condition: { type: "always" },
			},
		],
	},
	{
		id: "water_sports_rule",
		secondaryCategory: "water_sports",
		items: [
			{
				itemKey: "swimsuit",
				title: "checklist.items.water_sports_rule.swimsuit.title",
				description: "checklist.items.water_sports_rule.swimsuit.description",
				category: "packing",
				priority: "high",
				condition: { type: "always" },
			},
			{
				itemKey: "rash_guard",
				title: "checklist.items.water_sports_rule.rash_guard.title",
				description: "checklist.items.water_sports_rule.rash_guard.description",
				category: "packing",
				priority: "medium",
				condition: { type: "always" },
			},
			{
				itemKey: "beach_towel",
				title: "checklist.items.water_sports_rule.beach_towel.title",
				description: "checklist.items.water_sports_rule.beach_towel.description",
				category: "packing",
				priority: "medium",
				condition: { type: "always" },
			},
			{
				itemKey: "sunscreen_spf50",
				title: "checklist.items.water_sports_rule.sunscreen_spf50.title",
				description: "checklist.items.water_sports_rule.sunscreen_spf50.description",
				category: "packing",
				priority: "high",
				condition: { type: "always" },
			},
			{
				itemKey: "waterproof_phone_case",
				title: "checklist.items.water_sports_rule.waterproof_phone_case.title",
				description: "checklist.items.water_sports_rule.waterproof_phone_case.description",
				category: "packing",
				priority: "low",
				condition: { type: "always" },
			},
			{
				itemKey: "goggles_snorkel_set",
				title: "checklist.items.water_sports_rule.goggles_snorkel_set.title",
				description: "checklist.items.water_sports_rule.goggles_snorkel_set.description",
				category: "packing",
				priority: "medium",
				condition: { type: "always" },
			},
		],
	},
	{
		id: "diving_rule",
		secondaryCategory: "diving",
		items: [
			{
				itemKey: "diving_license_card",
				title: "checklist.items.diving_rule.diving_license_card.title",
				description: "checklist.items.diving_rule.diving_license_card.description",
				category: "packing",
				priority: "high",
				condition: { type: "always" },
			},
			{
				itemKey: "logbook",
				title: "checklist.items.diving_rule.logbook.title",
				description: "checklist.items.diving_rule.logbook.description",
				category: "packing",
				priority: "medium",
				condition: { type: "always" },
			},
			{
				itemKey: "underwater_camera",
				title: "checklist.items.diving_rule.underwater_camera.title",
				description: "checklist.items.diving_rule.underwater_camera.description",
				category: "packing",
				priority: "low",
				condition: { type: "always" },
			},
		],
	},
];
