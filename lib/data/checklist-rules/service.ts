/**
 * Service（サービス）関連のチェックリストルール
 */

import type { ChecklistGenerationRule } from "./types";

export const SERVICE_RULES: ChecklistGenerationRule[] = [
	{
		id: "currency_exchange_rule",
		secondaryCategory: "currency_exchange",
		items: [
			{
				itemKey: "cash_for_exchange",
				title: "checklist.items.currency_exchange_rule.cash_for_exchange.title",
				description: "checklist.items.currency_exchange_rule.cash_for_exchange.description",
				category: "preparation",
				priority: "high",
				condition: { type: "always" },
			},
			{
				itemKey: "passport_for_exchange",
				title: "checklist.items.currency_exchange_rule.passport_for_exchange.title",
				description: "checklist.items.currency_exchange_rule.passport_for_exchange.description",
				category: "packing",
				priority: "high",
				condition: { type: "always" },
			},
		],
	},
	{
		id: "sim_purchase_rule",
		secondaryCategory: "sim_purchase",
		items: [
			{
				itemKey: "sim_free_smartphone",
				title: "checklist.items.sim_purchase_rule.sim_free_smartphone.title",
				description: "checklist.items.sim_purchase_rule.sim_free_smartphone.description",
				category: "preparation",
				priority: "high",
				condition: { type: "always" },
			},
			{
				itemKey: "passport_for_sim",
				title: "checklist.items.sim_purchase_rule.passport_for_sim.title",
				description: "checklist.items.sim_purchase_rule.passport_for_sim.description",
				category: "packing",
				priority: "high",
				condition: { type: "always" },
			},
		],
	},

	// ============================================================================
	// 共通（長期滞在）
	// ============================================================================
	{
		id: "long_stay_rule",
		secondaryCategory: "check_in",
		items: [
			{
				itemKey: "common_medicines",
				title: "checklist.items.long_stay_rule.common_medicines.title",
				description: "checklist.items.long_stay_rule.common_medicines.description",
				category: "packing",
				priority: "high",
				condition: { type: "duration", minDays: 7 },
			},
			{
				itemKey: "multivitamin",
				title: "checklist.items.long_stay_rule.multivitamin.title",
				description: "checklist.items.long_stay_rule.multivitamin.description",
				category: "packing",
				priority: "medium",
				condition: { type: "duration", minDays: 14 },
			},
			{
				itemKey: "folding_umbrella",
				title: "checklist.items.long_stay_rule.folding_umbrella.title",
				description: "checklist.items.long_stay_rule.folding_umbrella.description",
				category: "packing",
				priority: "medium",
				condition: { type: "duration", minDays: 7 },
			},
			{
				itemKey: "charger_mobile_battery",
				title: "checklist.items.long_stay_rule.charger_mobile_battery.title",
				description: "checklist.items.long_stay_rule.charger_mobile_battery.description",
				category: "packing",
				priority: "high",
				condition: { type: "duration", minDays: 3 },
			},
			{
				itemKey: "adapter_plug",
				title: "checklist.items.long_stay_rule.adapter_plug.title",
				description: "checklist.items.long_stay_rule.adapter_plug.description",
				category: "packing",
				priority: "high",
				condition: { type: "duration", minDays: 3 },
			},
		],
	},

	// ============================================================================
	// Transportation（乗り物）関連 - 追加
	// ============================================================================
	{
		id: "train_rule",
		secondaryCategory: "train",
		items: [
			{
				itemKey: "rail_pass_ticket",
				title: "checklist.items.train_rule.rail_pass_ticket.title",
				description: "checklist.items.train_rule.rail_pass_ticket.description",
				category: "preparation",
				priority: "high",
				condition: { type: "always" },
			},
			{
				itemKey: "route_map_app",
				title: "checklist.items.train_rule.route_map_app.title",
				description: "checklist.items.train_rule.route_map_app.description",
				category: "preparation",
				priority: "medium",
				condition: { type: "always" },
			},
			{
				itemKey: "ic_card",
				title: "checklist.items.train_rule.ic_card.title",
				description: "checklist.items.train_rule.ic_card.description",
				category: "packing",
				priority: "medium",
				condition: { type: "destination", countries: ["JP"] },
			},
		],
	},
	{
		id: "bus_rule",
		secondaryCategory: "bus",
		items: [
			{
				itemKey: "bus_ticket_reservation",
				title: "checklist.items.bus_rule.bus_ticket_reservation.title",
				description: "checklist.items.bus_rule.bus_ticket_reservation.description",
				category: "preparation",
				priority: "high",
				condition: { type: "always" },
			},
			{
				itemKey: "bus_location_time",
				title: "checklist.items.bus_rule.bus_location_time.title",
				description: "checklist.items.bus_rule.bus_location_time.description",
				category: "preparation",
				priority: "high",
				condition: { type: "always" },
			},
			{
				itemKey: "neck_pillow_blanket",
				title: "checklist.items.bus_rule.neck_pillow_blanket.title",
				description: "checklist.items.bus_rule.neck_pillow_blanket.description",
				category: "packing",
				priority: "low",
				condition: { type: "always" },
			},
		],
	},
	{
		id: "taxi_rule",
		secondaryCategory: "taxi",
		items: [
			{
				itemKey: "taxi_app_install",
				title: "checklist.items.taxi_rule.taxi_app_install.title",
				description: "checklist.items.taxi_rule.taxi_app_install.description",
				category: "preparation",
				priority: "high",
				condition: { type: "always" },
			},
			{
				itemKey: "destination_address_memo",
				title: "checklist.items.taxi_rule.destination_address_memo.title",
				description: "checklist.items.taxi_rule.destination_address_memo.description",
				category: "preparation",
				priority: "medium",
				condition: { type: "always" },
			},
			{
				itemKey: "cash_change",
				title: "checklist.items.taxi_rule.cash_change.title",
				description: "checklist.items.taxi_rule.cash_change.description",
				category: "packing",
				priority: "high",
				condition: { type: "always" },
			},
		],
	},
	{
		id: "ferry_rule",
		secondaryCategory: "ferry",
		items: [
			{
				itemKey: "ferry_ticket_reservation",
				title: "checklist.items.ferry_rule.ferry_ticket_reservation.title",
				description: "checklist.items.ferry_rule.ferry_ticket_reservation.description",
				category: "preparation",
				priority: "high",
				condition: { type: "always" },
			},
			{
				itemKey: "boarding_time_location",
				title: "checklist.items.ferry_rule.boarding_time_location.title",
				description: "checklist.items.ferry_rule.boarding_time_location.description",
				category: "preparation",
				priority: "high",
				condition: { type: "always" },
			},
			{
				itemKey: "motion_sickness_medicine",
				title: "checklist.items.ferry_rule.motion_sickness_medicine.title",
				description: "checklist.items.ferry_rule.motion_sickness_medicine.description",
				category: "packing",
				priority: "medium",
				condition: { type: "always" },
			},
			{
				itemKey: "warm_clothing",
				title: "checklist.items.ferry_rule.warm_clothing.title",
				description: "checklist.items.ferry_rule.warm_clothing.description",
				category: "packing",
				priority: "medium",
				condition: { type: "always" },
			},
		],
	},
];
