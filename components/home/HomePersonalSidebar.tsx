"use client";

import { useMemo } from "react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { t } from "@/lib/i18n";
import type { Trip } from "@/lib/core/types";
import { useHomeTrips } from "@/hooks/useHomeTrips";
import { ACTIVE_COVER_POOL, UPCOMING_COVER_POOL } from "@/lib/images/cover-pools";
import { assignCoverImage } from "@/lib/utils/trip-image";
import RecentlyCheckedSection from "@/components/home/RecentlyCheckedSection";
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

type Props = {
	trips: Trip[];
	onCreateTrip: () => void;
};

export default function HomePersonalSidebar({ trips, onCreateTrip }: Props) {
	// today/tomorrowをuseMemoで固定（SSR/CSRの差異を防ぐ）
	const today = useMemo(() => {
		const date = new Date();
		date.setHours(0, 0, 0, 0);
		return date;
	}, []);

	const tomorrow = useMemo(() => {
		const date = new Date(today);
		date.setDate(date.getDate() + 1);
		return date;
	}, [today]);

	// カスタムフックでTripをフィルタリング・ソート
	const { activeTrips, upcomingTrips } = useHomeTrips(trips, tomorrow);

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
						onCreate={onCreateTrip}
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
						onCreate={onCreateTrip}
						createButtonText={t("home.dashboard.ongoingTrips.createNew")}
					/>
				) : (
					<div className="space-y-2">
						{upcomingTrips.map((trip, index) => {
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
