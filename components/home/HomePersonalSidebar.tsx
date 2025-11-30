"use client";

import { Icon } from "@iconify/react";
import Link from "next/link";
import type { Trip } from "@/lib/core/types";
import { t } from "@/lib/i18n";
import {
	filterOngoingTrips,
	filterUpcomingTrips,
	sortTripsByUpdatedAt,
	sortTripsByStartDate,
} from "@/lib/travel/trip-filters";
import OngoingTripCard from "@/components/tripcard/OngoingTripCard";
import UpcomingTripCard from "@/components/tripcard/UpcomingTripCard";
import RecentlyCheckedSection from "@/components/home/RecentlyCheckedSection";

type Props = {
	trips: Trip[];
	onCreateTrip: () => void;
};

export default function HomePersonalSidebar({ trips, onCreateTrip }: Props) {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const tomorrow = new Date(today);
	tomorrow.setDate(tomorrow.getDate() + 1);

	const tripsSortedByRecent = sortTripsByUpdatedAt(trips);
	const ongoingTrips = filterOngoingTrips(tripsSortedByRecent);
	const activeTrips = (
		ongoingTrips.length > 0 ? ongoingTrips : tripsSortedByRecent
	).slice(0, 3);

	const upcomingTrips = sortTripsByStartDate(
		filterUpcomingTrips(trips, tomorrow),
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
							onClick={onCreateTrip}
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
							onClick={onCreateTrip}
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
								/>
							);
						})}
					</div>
				)}
			</section>

			{/* Recently Checked */}
			<RecentlyCheckedSection />
		</div>
	);
}
