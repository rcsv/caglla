"use client";

import { Icon } from "@iconify/react";
import Link from "next/link";
import { t } from "@/lib/i18n";
import type { Trip } from "@/lib/core/types";
import type { RecentTripEntry } from "@/lib/utils/recent-trips";
import { useHomeTrips } from "@/hooks/useHomeTrips";
import { ACTIVE_COVER_POOL, UPCOMING_COVER_POOL } from "@/lib/images/cover-pools";
import { assignCoverImage } from "@/lib/utils/trip-image";
import OngoingTripCard from "@/components/tripcard/OngoingTripCard";
import UpcomingTripCard from "@/components/tripcard/UpcomingTripCard";

/**
 * エンプティ状態のUIコンポーネント
 */
interface EmptyStateProps {
	icon: string;
	text: string;
	onCreate: () => void;
	createButtonText: string;
}

function EmptyState({
	icon,
	text,
	onCreate,
	createButtonText,
}: EmptyStateProps) {
	return (
		<div className="text-center py-4 text-gray-500">
			<Icon icon={icon} className="h-8 w-8 mx-auto mb-2 text-gray-400" />
			<p className="text-xs mb-2">{text}</p>
			<button
				type="button"
				onClick={onCreate}
				className="inline-block text-indigo-600 hover:text-indigo-800 text-xs"
			>
				{createButtonText}
			</button>
		</div>
	);
}

/**
 * セクションヘッダーコンポーネント
 */
interface SectionHeaderProps {
	title: string;
	icon: string;
	iconColor: string;
	subtitle?: string;
	viewAllLink?: string;
	viewAllText?: string;
}

function SectionHeader({
	title,
	icon,
	iconColor,
	subtitle,
	viewAllLink,
	viewAllText,
}: SectionHeaderProps) {
	return (
		<div className="flex items-center justify-between mb-3">
			<h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
				<Icon icon={icon} className={`h-5 w-5 ${iconColor}`} />
				{title}
			</h2>
			{subtitle && (
				<span className="text-xs text-gray-400">{subtitle}</span>
			)}
			{viewAllLink && viewAllText && (
				<Link
					href={viewAllLink}
					className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
				>
					{viewAllText}
					<Icon icon="mdi:chevron-right" className="h-3 w-3" />
				</Link>
			)}
		</div>
	);
}

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
	// カスタムフックでTripをフィルタリング・ソート
	const { activeTrips, upcomingTrips } = useHomeTrips(
		trips,
		referenceDateForUpcoming,
	);

	return (
		<div className="lg:col-span-3 space-y-6">
			{/* 進行中のTrip */}
			<section className="bg-white rounded-sm shadow-sm border border-gray-200 p-4">
				<SectionHeader
					title={t("home.dashboard.ongoingTrips.title")}
					icon="mdi:map-marker-path"
					iconColor="text-indigo-600"
					subtitle={t("home.dashboard.ongoingTrips.subtitle")}
				/>

				{activeTrips.length === 0 ? (
					<EmptyState
						icon="mdi:map-outline"
						text={t("home.dashboard.ongoingTrips.empty")}
						onCreate={onOpenCreateTrip}
						createButtonText={t("home.dashboard.ongoingTrips.createNew")}
					/>
				) : (
					<div className="space-y-4">
						{activeTrips.map((trip, index) => {
							const coverImage = assignCoverImage(
								trip,
								index,
								ACTIVE_COVER_POOL,
							);

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
				<SectionHeader
					title={t("home.dashboard.upcomingTrips.title")}
					icon="mdi:calendar-clock"
					iconColor="text-emerald-600"
					viewAllLink="/plan"
					viewAllText={t("home.dashboard.upcomingTrips.viewAll")}
				/>

				{upcomingTrips.length === 0 ? (
					<EmptyState
						icon="mdi:calendar-outline"
						text={t("home.dashboard.upcomingTrips.empty")}
						onCreate={onOpenCreateTrip}
						createButtonText={t("home.dashboard.ongoingTrips.createNew")}
					/>
				) : (
					<div className="space-y-2">
						{upcomingTrips.map((trip: Trip, index: number) => {
							const imageUrl = assignCoverImage(
								trip,
								index,
								UPCOMING_COVER_POOL,
							);

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
						{t("home.recentlyChecked.title")}
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
						{t("home.recentlyChecked.empty")}
					</div>
				)}

				{recentTrips && recentTrips.length > 0 && (
					<div className="space-y-3">
						{recentTrips.map((trip) => (
							<Link
								key={`${trip.tripId}-${trip.viewedAt}`}
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
