"use client";

import React from "react";
import { useUserData } from "@/lib/contexts/user-data";
import {
	RestrictionProvider,
	RestrictionType,
	PLAN_CONFIGS,
} from "@/lib/subscription/restriction";
import { Button } from "@/components/common/Button";
import StorageUsageDisplay from "@/components/ui/StorageUsageDisplay";
import Link from "next/link";
import { t } from "@/lib/i18n";

interface PlanInfoDisplayProps {
	className?: string;
}

export default function PlanInfoDisplay({
	className = "",
}: PlanInfoDisplayProps) {
	const { userPlanId, planConfig, planLoading, planError, tripCount } =
		useUserData();

	if (planLoading) {
		return (
			<div className={`bg-white border border-gray-200 p-4 ${className}`}>
				<div className="animate-pulse">
					<div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
					<div className="h-3 bg-gray-200 rounded w-1/2"></div>
				</div>
			</div>
		);
	}

	if (planError) {
		return (
			<div className={`bg-white border border-gray-200 p-4 ${className}`}>
				<div className="text-center text-red-600 text-sm">{planError}</div>
			</div>
		);
	}

	if (!userPlanId || !planConfig) {
		return (
			<div className={`bg-white border border-gray-200 p-4 ${className}`}>
				<div className="text-center text-gray-500 text-sm">
					{t("home.dashboard.planInfo.error")}
				</div>
			</div>
		);
	}

	const plan = planConfig;
	const isPaidPlan = userPlanId !== "season_traveler";

	const planTitleClass = (() => {
		const id = String(userPlanId);
		if (id.includes("globetrotter")) return "text-purple-600";
		if (id.includes("backpacker")) return "text-blue-600";
		return "text-gray-900";
	})();

	// 旅行数制限のプログレスバー
	const maxTrips = plan.limits[RestrictionType.MAX_TRIPS];
	const tripProgress = maxTrips === -1 ? 0 : (tripCount / maxTrips) * 100;

	// ストレージ制限（StorageUsageDisplayコンポーネントで動的に表示）

	return (
		<div className={`bg-white border border-gray-200 p-4 ${className}`}>
			{/* ヘッダー（プラン名のみ表示） */}
			<div className="flex items-center justify-between mb-4">
				<h3 className={`text-xl font-semibold ${planTitleClass}`}>
					{plan.name}
				</h3>
			</div>

			{/* 制限情報 */}
			<div className="space-y-4">
				{/* 旅行数制限 */}
				{maxTrips !== -1 && (
					<div>
						<div className="flex justify-between items-center mb-2">
							<span className="text-sm text-gray-600">
								{t("home.dashboard.planInfo.tripLimit")}
							</span>
							<span className="text-sm text-gray-900">
								{t("home.dashboard.planInfo.tripLimitCount")
									.replace("{count}", String(tripCount))
									.replace("{max}", String(maxTrips))}
							</span>
						</div>
						<div className="w-full bg-gray-200 rounded-full h-2">
							<div
								className={`h-2 rounded-full transition-all duration-300 ${
									tripProgress >= 100
										? "bg-red-500"
										: tripProgress >= 80
											? "bg-yellow-500"
											: "bg-blue-500"
								}`}
								style={{ width: `${Math.min(tripProgress, 100)}%` }}
							></div>
						</div>
					</div>
				)}

				{/* ストレージ使用量（動的表示） */}
				<StorageUsageDisplay showDetails={false} />
			</div>

			{/* プラン変更ボタン */}
			<div className="mt-4 pt-4 border-t border-gray-100">
				<Link href="/subscription" className="block">
					<Button variant="outline" size="sm" fullWidth>
						{t("home.dashboard.planInfo.changePlan")}
					</Button>
				</Link>
			</div>
		</div>
	);
}
