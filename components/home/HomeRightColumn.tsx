"use client";

import { Icon } from "@iconify/react";
import Link from "next/link";
import { t } from "@/lib/i18n";
import type { Trip } from "@/lib/core/types";
import {
	filterOngoingTrips,
	filterUpcomingTrips,
	sortTripsByUpdatedAt,
	sortTripsByStartDate,
} from "@/lib/travel/trip-filters";
import type { RecentTripEntry } from "@/lib/utils/recent-trips";
import OngoingTripCard from "@/components/tripcard/OngoingTripCard";
import UpcomingTripCard from "@/components/tripcard/UpcomingTripCard";

interface HomeRightColumnProps {
	trips: Trip[];
	today: Date;
	referenceDateForUpcoming: Date;
	recentTrips: RecentTripEntry[] | null;
	onOpenCreateTrip: () => void;
}

export function HomeRightColumn({
	trips,
	today,
	referenceDateForUpcoming,
	recentTrips,
	onOpenCreateTrip,
}: HomeRightColumnProps) {
	// 進行中のTrip（期間内のもののみ、最大3件）
	// テンプレートは除外
	const nonTemplateTrips = trips.filter((trip) => trip.is_template !== true);
	const tripsSortedByRecent = sortTripsByUpdatedAt(nonTemplateTrips);
	const ongoingTrips = filterOngoingTrips(tripsSortedByRecent);
	// 進行中の旅行のみを表示（フォールバックなし）
	const activeTrips = ongoingTrips.slice(0, 3);

	// 近日のTrip（referenceDateForUpcoming より先のみ、開始日順、最大3件）
	const upcomingTrips = sortTripsByStartDate(
		filterUpcomingTrips(trips, referenceDateForUpcoming),
	).slice(0, 3);

	const activeCoverPool = [
		"1491557345352-5929e343eb89",
		"1500530855697-b586d89ba3ee",
		"1507525428034-b723cf961d3e",
		"1500048993953-d23a436266cf",
	];

	const upcomingCoverPool = [
		"1508672019048-805c876b67e2",
		"1526772662000-3f88f10405ff",
		"1519817914152-22f90e1e37e8",
		"1500534314209-a25ddb2bd429",
	];

	const getCoverImage = (trip: Trip, index: number, pool: string[]) => {
		if (trip.image_url) {
			return trip.image_url;
		}
		const id = pool[index % pool.length];
		return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=70`;
	};

	return (
		<div className="lg:col-span-3 space-y-6">
			{/* 進行中のTrip */}
			<section className="bg-white rounded-sm shadow-sm border border-gray-200 p-4">
				<div className="flex items-center justify-between mb-3">
					<h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
						<Icon
							icon="mdi:map-marker-path"
							className="h-5 w-5 text-indigo-600"
						/>
						{t("home.dashboard.ongoingTrips.title")}
					</h2>
					<span className="text-xs text-gray-400">
						{t("home.dashboard.ongoingTrips.subtitle")}
					</span>
				</div>

				{activeTrips.length === 0 ? (
					<div className="text-center py-4 text-gray-500">
						<Icon
							icon="mdi:map-outline"
							className="h-8 w-8 mx-auto mb-2 text-gray-400"
						/>
						<p className="text-xs mb-2">
							{t("home.dashboard.ongoingTrips.empty")}
						</p>
						<button
							onClick={onOpenCreateTrip}
							className="inline-block text-indigo-600 hover:text-indigo-800 text-xs"
						>
							{t("home.dashboard.ongoingTrips.createNew")}
						</button>
					</div>
				) : (
					<div className="space-y-4">
						{activeTrips.map((trip, index) => {
							const coverImage = getCoverImage(trip, index, activeCoverPool);

							return (
								<OngoingTripCard
									key={trip.id}
									trip={trip}
									coverImage={coverImage}
									today={today}
									priority={index === 0}
								/>
							);
						})}
					</div>
				)}
			</section>

			{/* Upcoming Trips */}
			<section className="bg-white rounded-sm shadow-sm border border-gray-200 p-4">
				<div className="flex items-center justify-between mb-3">
					<h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
						<Icon
							icon="mdi:calendar-clock"
							className="h-5 w-5 text-emerald-600"
						/>
						{t("home.dashboard.upcomingTrips.title")}
					</h2>
					<Link
						href="/plan"
						className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
					>
						{t("home.dashboard.upcomingTrips.viewAll")}
						<Icon icon="mdi:chevron-right" className="h-3 w-3" />
					</Link>
				</div>

				{upcomingTrips.length === 0 ? (
					<div className="text-center py-4 text-gray-500">
						<Icon
							icon="mdi:calendar-outline"
							className="h-8 w-8 mx-auto mb-2 text-gray-400"
						/>
						<p className="text-xs mb-2">
							{t("home.dashboard.upcomingTrips.empty")}
						</p>
						<button
							onClick={onOpenCreateTrip}
							className="inline-block text-indigo-600 hover:text-indigo-800 text-xs"
						>
							{t("home.dashboard.ongoingTrips.createNew")}
						</button>
					</div>
				) : (
					<div className="space-y-2">
						{upcomingTrips.map((trip, index) => {
							const imageUrl = getCoverImage(trip, index, upcomingCoverPool);

							return (
								<UpcomingTripCard
									key={trip.id}
									trip={trip}
									imageUrl={imageUrl}
									today={today}
									priority={index === 0}
								/>
							);
						})}
					</div>
				)}
			</section>

			{/* Recently Checked */}
			<section className="bg-white rounded-sm shadow-sm border border-gray-200 p-4">
				<div className="flex items-center justify-between mb-3">
					<h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
						<Icon
							icon="mdi:clock-time-four-outline"
							className="h-5 w-5 text-purple-500"
						/>
						Recently You Checked
					</h2>
					{/* v1 では View All の遷移先未定のため、ボタンは非表示 */}
				</div>

				{recentTrips === null && (
					<div className="space-y-3">
						<div className="h-16 rounded-sm bg-gray-100 animate-pulse" />
						<div className="h-16 rounded-sm bg-gray-100 animate-pulse" />
					</div>
				)}

				{recentTrips && recentTrips.length === 0 && (
					<div className="border border-dashed border-gray-300 rounded-sm p-4 text-center text-xs text-gray-500">
						You haven’t viewed any trips recently.
					</div>
				)}

				{recentTrips && recentTrips.length > 0 && (
					<div className="space-y-3">
						{recentTrips.map((trip) => (
							<Link
								key={trip.tripId + trip.viewedAt}
								href={`/${trip.creatorSlug}/${trip.slug}`}
								className="flex items-center gap-3 rounded-sm border border-gray-200 px-3 py-2 hover:border-purple-300 hover:bg-purple-50 transition-colors"
							>
								<div className="flex-1 min-w-0">
									<p className="text-sm font-semibold text-gray-900 truncate">
										{trip.title || "Untitled Trip"}
									</p>
									<p className="text-xs text-gray-500 truncate">
										{trip.destination || "No destination"}
									</p>
								</div>
								<div className="ml-2 text-[10px] text-gray-400 whitespace-nowrap">
									{trip.viewedAt.slice(0, 10)}
								</div>
							</Link>
						))}
					</div>
				)}
			</section>
		</div>
	);
}
