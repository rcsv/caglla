"use client";

import { useState } from "react";
import {
	aggregateCostsWithDetails,
	CostSummaryWithDetails,
	formatMultipleCostSummaries,
} from "@/lib/travel/cost-aggregation";
import { currencyUtils } from "@/lib/utils/currency";
import { dateUtils } from "@/lib/utils/date";
import Card from "@/components/common/Card";
import { MoneyIcon } from "@/components/common/icons/MoneyIcon";
import type { Itinerary, Day } from "@/lib/core/types";
import { t } from "@/lib/i18n";

interface TripCostDisplayProps {
	itineraries: Itinerary[];
	days?: Day[];
	className?: string;
}

export default function TripCostDisplay({
	itineraries,
	days,
	className = "",
}: TripCostDisplayProps) {
	const [expandedCurrencies, setExpandedCurrencies] = useState<Set<string>>(
		new Set(),
	);

	// Aggregate costs with detailed information
	const costSummary = aggregateCostsWithDetails(itineraries, days);

	const toggleCurrency = (currency: string) => {
		const newExpanded = new Set(expandedCurrencies);
		if (newExpanded.has(currency)) {
			newExpanded.delete(currency);
		} else {
			newExpanded.add(currency);
		}
		setExpandedCurrencies(newExpanded);
	};

	if (!costSummary.hasCosts) {
		return (
			<Card
				title={
					<div className="flex items-center">
						<MoneyIcon className="w-5 h-5 mr-2" color="#16a34a" />
						{t("cost.title")}
					</div>
				}
				className={className}
			>
				<div className="text-center py-4">
					<div className="text-gray-500 mb-2">
						<svg
							className="w-12 h-12 mx-auto mb-3 text-gray-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={1}
								d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
					</div>
					<p className="text-gray-600 text-sm">{t("cost.empty")}</p>
					<p className="text-gray-500 text-xs mt-2">
						{t("cost.empty.description")}
					</p>
				</div>
			</Card>
		);
	}

	return (
		<Card
			title={
				<div className="flex items-center">
					<MoneyIcon className="w-5 h-5 mr-2" color="#16a34a" />
					{t("cost.title")}
				</div>
			}
			className={className}
		>
			<div className="space-y-2">
				{costSummary.totalCosts.map((cost: CostSummaryWithDetails) => (
					<div key={cost.currency}>
						{/* Currency header with total */}
						<div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md">
							<div className="flex items-center">
								<span className="text-sm font-medium text-gray-600 mr-2">
									{cost.currencyInfo.name}
								</span>
								<span className="text-xs text-gray-500">
									({cost.count}
									{t("cost.items")})
								</span>
							</div>
							<div className="flex items-center gap-2">
								<div className="text-lg font-bold text-gray-900">
									{currencyUtils.formatAmount(cost.total, cost.currency)}
								</div>
								{cost.items && cost.items.length > 0 && (
									<button
										onClick={() => toggleCurrency(cost.currency)}
										className="text-xs text-emerald-600 hover:text-emerald-700 transition-colors whitespace-nowrap"
										aria-expanded={expandedCurrencies.has(cost.currency)}
									>
										{expandedCurrencies.has(cost.currency)
											? t("cost.collapse")
											: t("cost.viewDetails")}
									</button>
								)}
							</div>
						</div>

						{/* Detailed items list (shown when expanded) */}
						{expandedCurrencies.has(cost.currency) && cost.items && (
							<div className="mt-2 space-y-1">
								{cost.items.map((item) => (
									<div
										key={item.itineraryId}
										className="flex items-center justify-between py-1.5 px-3 text-sm bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
									>
										<div className="flex-1 min-w-0">
											<div className="font-medium text-gray-700 truncate">
												{item.itineraryTitle}
											</div>
											<div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
												{item.dayDate && (
													<span>
														{dateUtils.formatDate(item.dayDate)}
														{item.dayNumber && ` (Day ${item.dayNumber})`}
													</span>
												)}
												{item.placeName && (
													<>
														{item.dayDate && <span>•</span>}
														<span className="truncate">{item.placeName}</span>
													</>
												)}
											</div>
										</div>
										<div className="text-right ml-4 flex-shrink-0">
											<div className="font-semibold text-gray-900">
												{currencyUtils.formatAmount(item.amount, cost.currency)}
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				))}

				{costSummary.totalCosts.length > 1 && (
					<div className="border-t border-gray-200 pt-3 mt-3">
						<div className="flex items-center justify-between">
							<span className="text-sm font-medium text-gray-600">
								{t("cost.total")}
							</span>
							<span className="text-sm text-gray-500">
								{formatMultipleCostSummaries(costSummary.totalCosts)}
							</span>
						</div>
					</div>
				)}
			</div>

			<div className="mt-3 pt-3 border-t border-gray-200">
				<p className="text-xs text-gray-500">💡 {t("cost.hint.edit")}</p>
			</div>
		</Card>
	);
}
