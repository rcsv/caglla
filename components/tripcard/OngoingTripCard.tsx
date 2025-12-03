"use client";

import Link from "next/link";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { toDateOrNull } from "@/lib/firebase/timestamp-utils";
import { t } from "@/lib/i18n";
import type { Trip } from "@/lib/core/types";

interface OngoingTripCardProps {
	trip: Trip;
	coverImage: string;
	today: Date;
	priority?: boolean;
}

const DAY_MS = 1000 * 60 * 60 * 24;

export default function OngoingTripCard({
	trip,
	coverImage,
	today,
	priority = false,
}: OngoingTripCardProps) {
	const getTripUrl = () => {
		if (trip.creator?.slug && trip.slug) {
			return `/${trip.creator.slug}/${trip.slug}`;
		}
		return "/home";
	};

	const startDate = toDateOrNull(trip.start_date);
	const endDate = toDateOrNull(trip.end_date);
	
	// 終了日が過去の場合は表示しない（Ongoingに表示されるべきではない）
	if (endDate) {
		const normalizedEndDate = new Date(endDate);
		normalizedEndDate.setHours(0, 0, 0, 0);
		const normalizedToday = new Date(today);
		normalizedToday.setHours(0, 0, 0, 0);
		
		if (normalizedEndDate < normalizedToday) {
			return null; // 過去の旅行は表示しない
		}
	}
	
	const totalDays =
		startDate && endDate
			? Math.max(
					1,
					Math.ceil((endDate.getTime() - startDate.getTime()) / DAY_MS) + 1,
				)
			: null;
	const elapsedDays =
		startDate && totalDays
			? Math.min(
					totalDays,
					Math.max(
						0,
						Math.ceil((today.getTime() - startDate.getTime()) / DAY_MS) + 1,
					),
				)
			: null;
	const remainingDays = endDate
		? Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / DAY_MS))
		: null;
	const progress =
		totalDays && elapsedDays
			? Math.round((elapsedDays / totalDays) * 100)
			: null;

	return (
		<Link href={getTripUrl()} className="block">
			<article className="border border-gray-200 rounded overflow-hidden hover:border-indigo-300 hover:shadow-sm transition-all bg-white flex flex-col h-36 md:h-36">
				<div className="md:flex md:items-stretch flex-1 min-h-0">
					<div className="md:w-1/3 h-full bg-gray-100 flex-shrink-0 relative">
						<Image
							src={coverImage}
							alt={trip.title || "Trip cover"}
							fill
							sizes="(max-width: 768px) 100vw, 33vw"
							priority={priority}
							className="object-cover"
						/>
					</div>
					<div className="md:w-2/3 p-3 flex flex-col gap-2">
						<div>
							<h3 className="text-base font-semibold text-gray-900 line-clamp-2">
								{trip.title || "Untitled Trip"}
							</h3>
							<p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
								<Icon
									icon="mdi:map-marker"
									className="h-4 w-4 text-indigo-500"
								/>
								{trip.destination_place?.name ||
									trip.destination ||
									"No destination"}
							</p>
						</div>

						{trip.description && (
							<p className="text-sm text-gray-600 line-clamp-2">
								{trip.description}
							</p>
						)}

						{trip.start_date && trip.end_date && remainingDays !== null ? (
							<p className="text-sm text-gray-700">
								{(() => {
									const start = toDateOrNull(trip.start_date);
									const end = toDateOrNull(trip.end_date);
									if (!start || !end) return t("date.notSet");

									const startMonth = start.getMonth() + 1;
									const startDay = start.getDate();
									const endMonth = end.getMonth() + 1;
									const endDay = end.getDate();

									// Same month: 11/15 - 22
									// Different month: 11/15 - 12/22
									const dateRange =
										startMonth === endMonth
											? `${startMonth}/${startDay} - ${endDay}`
											: `${startMonth}/${startDay} - ${endMonth}/${endDay}`;

									// 終了日が今日の場合のみ「until today」を表示
									const normalizedEndDate = new Date(end);
									normalizedEndDate.setHours(0, 0, 0, 0);
									const normalizedToday = new Date(today);
									normalizedToday.setHours(0, 0, 0, 0);
									
									const restText =
										normalizedEndDate.getTime() === normalizedToday.getTime()
											? `(${t("home.dashboard.ongoingTrips.untilToday")})`
											: remainingDays === 0
												? `(${t("home.dashboard.ongoingTrips.untilToday")})`
												: `(rest ${remainingDays}${t("date.days")})`;

									return `${dateRange} ${restText}`;
								})()}
							</p>
						) : (
							<p className="text-sm text-gray-400">{t("date.notSet")}</p>
						)}

						<div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
							{trip.creator && (
								<span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-sm bg-gray-100">
									{trip.creator.profile_image_url ? (
										<Image
											src={trip.creator.profile_image_url}
											alt={trip.creator.name || "User"}
											width={16}
											height={16}
											className="rounded-full object-cover"
										/>
									) : (
										<Icon
											icon="mdi:account-circle"
											className="h-4 w-4 text-gray-500"
										/>
									)}
									{trip.creator.name || "You"}
								</span>
							)}
						</div>
					</div>
				</div>
				{progress !== null && (
					<div
						className="h-1.5 bg-gray-100"
						style={{
							background: `linear-gradient(to right, #6366f1 ${progress}%, #e5e7eb ${progress}%)`,
						}}
					>
						<span className="sr-only">Progress {progress}%</span>
					</div>
				)}
			</article>
		</Link>
	);
}
