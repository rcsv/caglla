"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import Image from "next/image";
import { t } from "@/lib/i18n";
import type { Trip } from "@/lib/core/types";
import { toDateOrNull } from "@/lib/firebase/timestamp-utils";
import { resolveSocialStats } from "@/lib/social/trip-social-utils";
import { useFollowingFeed } from "@/hooks/useFollowingFeed";
import { useUserData } from "@/lib/contexts/user-data";
import { isSameUser } from "@/lib/auth/client-identity-helpers";
import FollowButton from "@/components/social/FollowButton";
import LikeButton from "@/components/social/LikeButton";
import TripCommentModal from "@/components/modals/TripCommentModal";
import { formatRelativeTime } from "@/lib/utils/date";
import { isTripActive } from "@/lib/utils/trip-status";
import { searchTrips } from "@/lib/utils/trip-search";
import { useMemo } from "react";

interface FriendsTimelineProps {
	searchQuery?: string;
	filter?: string | null;
}

export function FriendsTimeline({
	searchQuery = "",
	filter = null,
}: FriendsTimelineProps) {
	const { trips, loading, error } = useFollowingFeed(20);
	const { userData } = useUserData();
	const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
	const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);

	// 検索とフィルタを適用
	const filteredTrips = useMemo(() => {
		if (!trips) return [];

		let result = [...trips];

		// 検索
		if (searchQuery.trim()) {
			result = searchTrips(result, searchQuery, [
				"title",
				"destination",
				"description",
				"creator.name",
			]);
		}

		// フィルタ
		if (filter) {
			const filterKey = filter.toLowerCase();
			if (filterKey.includes("active")) {
				result = result.filter((trip) => isTripActive(trip));
			} else if (filterKey.includes("recent")) {
				result = result.sort((a, b) => {
					const dateA = toDateOrNull(a.created_at);
					const dateB = toDateOrNull(b.created_at);
					if (!dateA || !dateB) return 0;
					return dateB.getTime() - dateA.getTime();
				});
			} else if (filterKey.includes("template")) {
				result = result.filter((trip) => trip.is_template === true);
			}
		}

		return result;
	}, [trips, searchQuery, filter]);

	if (loading) {
		return (
			<section className="space-y-4">
				<div className="h-32 rounded-sm bg-gray-100 animate-pulse" />
				<div className="h-32 rounded-sm bg-gray-100 animate-pulse" />
				<div className="h-32 rounded-sm bg-gray-100 animate-pulse" />
			</section>
		);
	}

	if (error) {
		return (
			<section className="space-y-4">
				<p className="text-sm text-red-600">
					{t("home.mainTabs.error", { message: error.message })}
				</p>
			</section>
		);
	}

	if (!trips || trips.length === 0) {
		return (
			<section className="space-y-4">
				<p className="text-sm text-slate-500">
					{t("home.mainTabs.friends.empty")}
				</p>
			</section>
		);
	}

	if (filteredTrips.length === 0) {
		return (
			<section className="space-y-4">
				<p className="text-sm text-slate-500">
					{searchQuery || filter
						? t("home.mainTabs.friends.noResults")
						: t("home.mainTabs.friends.empty")}
				</p>
			</section>
		);
	}

	const handleCommentClick = (trip: Trip) => {
		setSelectedTrip(trip);
		setIsCommentModalOpen(true);
	};

	return (
		<>
			<section className="space-y-6">
				{filteredTrips.map((trip) => {
					const creator = trip.creator;
					const creatorName = creator?.name || "Unknown User";
					const userSlug = creator?.slug;
					const avatar =
						creator?.profile_image_url ||
						`https://api.dicebear.com/7.x/avataaars/svg?seed=${creatorName}`;
					const userHandle = userSlug ? `@${userSlug}` : "";
					const action = trip.is_template
						? t("home.mainTabs.action.templatePublished")
						: t("home.mainTabs.action.tripShared");
					const createdAt = toDateOrNull(trip.created_at);
					const timestamp = createdAt ? formatRelativeTime(createdAt) : "";
					const title = trip.title || trip.destination || "Untitled Trip";
					const location =
						trip.destination_place?.name || trip.destination || "";
					const summary = trip.description || "";
					const cover =
						trip.image_url ||
						"https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80";
					const isActive = isTripActive(trip);
					const socialStats = resolveSocialStats(trip);
					const tripUrl =
						userSlug && trip.slug
							? `/${userSlug}/${trip.slug}`
							: `/trip/${trip.id}`;
					const typeStyles = trip.is_template
						? "bg-amber-50 text-amber-700 border border-amber-100"
						: "bg-sky-50 text-sky-700 border border-sky-100";
					const typeLabel = trip.is_template
						? t("home.mainTabs.typeLabel.template")
						: t("home.mainTabs.typeLabel.shared");
					const hashtags = trip.hashtags || [];

					return (
						<article
							key={trip.id}
							className="relative overflow-hidden rounded-sm border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
						>
							<div className="flex flex-col gap-5 md:flex-row">
								<div className="flex-1">
									<div className="flex items-center justify-between gap-4">
										<div className="flex items-center gap-3">
											<Image
												src={avatar}
												alt={creatorName}
												width={48}
												height={48}
												className="h-12 w-12 rounded-full border border-slate-100 object-cover"
											/>
											<div>
												<p className="text-sm font-semibold text-slate-900">
													{creatorName}
												</p>
												<p className="text-xs text-slate-500">{action}</p>
											</div>
										</div>
										<div className="flex items-center gap-2">
											{userSlug &&
												creator &&
												userData &&
												!isSameUser(creator, userData) && (
													<div
														onClick={(e) => {
															e.preventDefault();
															e.stopPropagation();
														}}
													>
														<FollowButton
															userSlug={userSlug}
															variant="icon"
															size="sm"
														/>
													</div>
												)}
											{timestamp && (
												<span className="text-xs text-slate-400">
													{timestamp}
												</span>
											)}
										</div>
									</div>

									<div className="mt-4 flex flex-wrap items-center gap-2">
										<span
											className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${typeStyles}`}
										>
											<Icon
												icon={
													trip.is_template
														? "mdi:file-document-outline"
														: "mdi:share-variant"
												}
												className="h-3.5 w-3.5"
											/>
											{typeLabel}
										</span>
										{userHandle && (
											<span className="text-xs text-slate-400">
												{userHandle}
											</span>
										)}
									</div>

									<h2 className="mt-4 text-xl font-semibold text-slate-900">
										{title}
									</h2>
									{location && (
										<p className="mt-1 text-sm text-slate-500">{location}</p>
									)}
									{summary && (
										<p className="mt-3 text-sm leading-6 text-slate-600">
											{summary}
										</p>
									)}

									{hashtags.length > 0 && (
										<div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
											{hashtags.map((tag) => (
												<span
													key={`${trip.id}-${tag}`}
													className="rounded-full bg-slate-100 px-3 py-1"
												>
													#{tag}
												</span>
											))}
										</div>
									)}

									<div className="mt-5 flex flex-wrap gap-4 text-sm text-slate-500">
										<div
											onClick={(e) => {
												e.preventDefault();
												e.stopPropagation();
											}}
										>
											{trip.slug || trip.id ? (
												<LikeButton
													tripSlug={trip.slug || trip.id || ""}
													initialLiked={false}
													initialCount={Number(socialStats.likes) || 0}
													size="sm"
													showCount={true}
												/>
											) : null}
										</div>
										<button
											type="button"
											onClick={(e) => {
												e.preventDefault();
												e.stopPropagation();
												handleCommentClick(trip);
											}}
											className="inline-flex items-center gap-1 text-blue-500 hover:text-blue-600 transition-colors cursor-pointer"
										>
											<Icon icon="mdi:comment" className="h-4 w-4" />
											{socialStats.comments}
										</button>
										<span className="inline-flex items-center gap-1 text-emerald-500">
											<Icon icon="mdi:share" className="h-4 w-4" />
											{socialStats.shares}
										</span>
									</div>
								</div>

								<div className="md:w-64">
									<Link href={tripUrl}>
										<div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-slate-100">
											<Image
												src={cover}
												alt={title}
												width={256}
												height={192}
												className="h-full w-full object-cover transition duration-500 hover:scale-105"
											/>
											{isActive && (
												<span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-rose-500 px-3 py-1 text-xs font-semibold text-white">
													<span className="h-2 w-2 animate-pulse rounded-full bg-white" />
													LIVE
												</span>
											)}
										</div>
									</Link>
									<div className="mt-4 flex gap-2">
										<Link
											href={tripUrl}
											className="flex-1 rounded-sm bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 text-center"
										>
											{t("home.mainTabs.viewTrip")}
										</Link>
										<button
											type="button"
											onClick={(e) => {
												e.preventDefault();
												e.stopPropagation();
												// TODO: ブックマーク機能を実装
											}}
											className="rounded-sm border border-slate-200 p-2 text-slate-500 hover:border-slate-300 hover:text-slate-700"
										>
											<Icon icon="mdi:bookmark-outline" className="h-5 w-5" />
										</button>
									</div>
								</div>
							</div>
						</article>
					);
				})}
			</section>

			{selectedTrip && (
				<TripCommentModal
					isOpen={isCommentModalOpen}
					onClose={() => {
						setIsCommentModalOpen(false);
						setSelectedTrip(null);
					}}
					trip={selectedTrip}
				/>
			)}
		</>
	);
}

