"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import type { Trip } from "@/lib/core/types";
import { toDateOrNull } from "@/lib/firebase/timestamp-utils";
import { resolveSocialStats } from "@/lib/social/trip-social-utils";
import { TripStatsRow } from "@/components/tripcard/TripStatsRow";
import { TripSocialStatsRow } from "@/components/tripcard/TripSocialStatsRow";
import { t } from "@/lib/i18n";

interface MyGuidesSectionProps {
	trips?: Trip[] | null;
	loading: boolean;
	onRefresh?: () => void;
}

export function MyGuidesSection({
	trips,
	loading,
	onRefresh,
}: MyGuidesSectionProps) {
	const hasTrips = trips && trips.length > 0;

	const getAccessLevelLabel = (accessLevel?: string) => {
		if (accessLevel === "public") return "Public";
		if (accessLevel === "unlisted") return "Shared link";
		return "Draft";
	};

	const getAccessLevelColor = (accessLevel?: string) => {
		if (accessLevel === "public")
			return "text-green-600 bg-green-50 border-green-200";
		if (accessLevel === "unlisted")
			return "text-blue-600 bg-blue-50 border-blue-200";
		return "text-gray-600 bg-gray-50 border-gray-200";
	};

	return (
		<section className="bg-white rounded-sm shadow-sm border border-gray-200 p-4">
			<div className="flex items-center justify-between mb-4">
				<h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
					<Icon
						icon="mdi:book-edit-outline"
						className="h-5 w-5 text-purple-600"
					/>
					執筆中の Guide
				</h2>
				<Link
					href="/home?tab=ideas"
					className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
				>
					すべて見る
					<Icon icon="mdi:chevron-right" className="h-3 w-3" />
				</Link>
			</div>

			{loading && !hasTrips && (
				<div className="space-y-2">
					<div className="h-16 rounded-sm bg-gray-100 animate-pulse" />
					<div className="h-16 rounded-sm bg-gray-100 animate-pulse" />
				</div>
			)}

			{!loading && !hasTrips && (
				<div className="text-center py-4 text-gray-500">
					<Icon
						icon="mdi:book-outline"
						className="h-8 w-8 mx-auto mb-2 text-gray-400"
					/>
					<p className="text-xs mb-2">執筆中の Guide はありません</p>
				</div>
			)}

			{!loading && hasTrips && (
				<div className="space-y-3">
					{trips!.slice(0, 5).map((trip) => {
						const updatedAtDate = toDateOrNull(trip.updated_at as any);
						const updatedAt = updatedAtDate
							? updatedAtDate.toLocaleDateString()
							: trip.updated_at
								? String(trip.updated_at)
								: "";

						const resolvedStats = resolveSocialStats(trip);
						const accessLevelLabel = getAccessLevelLabel(trip.access_level);
						const accessLevelColor = getAccessLevelColor(trip.access_level);

						return (
							<Link
								key={trip.id}
								href={
									trip.creator?.slug && trip.slug
										? `/${trip.creator.slug}/${trip.slug}`
										: "#"
								}
								className="block rounded-sm border border-slate-200 border-l-4 border-l-purple-400 bg-white p-3 shadow-sm hover:border-purple-300 hover:shadow-md transition-all"
							>
								<div className="flex items-start justify-between gap-3">
									<div className="flex-1 min-w-0 space-y-1">
										<div className="flex items-center gap-2">
											<h3 className="text-sm font-semibold text-slate-900 truncate">
												{trip.title || trip.destination || "Untitled Guide"}
											</h3>
											<span
												className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${accessLevelColor}`}
											>
												{accessLevelLabel}
											</span>
										</div>
										{trip.destination && (
											<p className="text-xs text-gray-600 flex items-center gap-1 truncate">
												<Icon
													icon="mdi:map-marker"
													className="h-3.5 w-3.5 text-indigo-500 flex-shrink-0"
												/>
												<span className="truncate">{trip.destination}</span>
											</p>
										)}
										{updatedAt && (
											<p className="text-[11px] text-slate-400">
												更新: {updatedAt}
											</p>
										)}
										{/* 旅行属性: 日数・スポット数・写真枚数・チェックリスト数 */}
										<TripStatsRow
											days={trip.stats?.days}
											venues={trip.stats?.itineraries}
											photos={trip.stats?.photos}
											checklists={trip.stats?.checklists}
										/>
									</div>
									<div className="flex flex-col items-end gap-2">
										{/* SNS的なリアクション・複製数 */}
										<TripSocialStatsRow
											stats={{
												likes: resolvedStats.likes,
												comments: resolvedStats.comments,
												shares: resolvedStats.shares,
												views: resolvedStats.views,
												replicas: resolvedStats.replicas,
											}}
										/>
									</div>
								</div>
							</Link>
						);
					})}
				</div>
			)}
		</section>
	);
}
