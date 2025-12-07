"use client";

import { Icon } from "@iconify/react";
import Link from "next/link";
import Image from "next/image";
import { t } from "@/lib/i18n";
import type { Trip } from "@/lib/core/types";
import { resolveSocialStats } from "@/lib/social/trip-social-utils";
import { useTemplates } from "@/hooks/useTemplates";
import { useUserData } from "@/lib/contexts/user-data";
import { isSameUser } from "@/lib/auth/client-identity-helpers";
import FollowButton from "@/components/social/FollowButton";
import LikeButton from "@/components/social/LikeButton";

export function IdeasCatalog() {
	const { trips, loading, error } = useTemplates(20, true); // excludeMyTrips = true
	const { userData } = useUserData();

	if (loading) {
		return (
			<section className="grid gap-4 md:grid-cols-2">
				<div className="h-64 rounded-sm bg-gray-100 animate-pulse" />
				<div className="h-64 rounded-sm bg-gray-100 animate-pulse" />
				<div className="h-64 rounded-sm bg-gray-100 animate-pulse" />
				<div className="h-64 rounded-sm bg-gray-100 animate-pulse" />
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
					{t("home.mainTabs.ideas.empty")}
				</p>
			</section>
		);
	}

	return (
		<section className="grid gap-4 md:grid-cols-2">
			{trips.map((trip) => {
				const creator = trip.creator;
				const creatorName = creator?.name || "Unknown Creator";
				const creatorAvatar =
					creator?.profile_image_url ||
					`https://api.dicebear.com/7.x/avataaars/svg?seed=${creatorName}`;
				const title = trip.title || trip.destination || "Untitled Template";
				const destination =
					trip.destination_place?.name || trip.destination || "";
				const region = destination || "Unknown Region";
				const days = trip.stats?.days
					? `${trip.stats.days}日間`
					: trip.day_count
						? `${trip.day_count}日間`
						: "";
				const summary = trip.description || "";
				const cover =
					trip.image_url ||
					"https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80";
				const socialStats = resolveSocialStats(trip);
				const tripUrl =
					creator?.slug && trip.slug
						? `/${creator.slug}/${trip.slug}`
						: `/trip/${trip.id}`;

				return (
					<Link key={trip.id} href={tripUrl}>
						<article className="group flex flex-col overflow-hidden rounded-sm border border-slate-200 bg-white shadow-sm hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer">
							<div className="relative h-40 w-full overflow-hidden">
								<Image
									src={cover}
									alt={title}
									width={256}
									height={192}
									className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
								/>
								<div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/0" />
								<div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
									<div>
										<p className="text-[11px] font-medium text-slate-100">
											{region}
										</p>
										{days && <p className="text-xs text-slate-200">{days}</p>}
									</div>
									<div
										onClick={(e) => {
											e.preventDefault();
											e.stopPropagation();
										}}
										className="flex items-center"
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
								</div>
							</div>
							<div className="flex flex-1 flex-col gap-3 p-4">
								<h3 className="text-sm font-semibold text-slate-900 line-clamp-2">
									{title}
								</h3>
								{summary && (
									<p className="text-xs text-slate-600 line-clamp-2">
										{summary}
									</p>
								)}
								<div className="mt-auto flex items-center justify-between pt-2">
									<div className="flex items-center gap-2">
										<Image
											src={creatorAvatar}
											alt={creatorName}
											width={28}
											height={28}
											className="h-7 w-7 rounded-full border border-slate-200"
										/>
										<div>
											<p className="text-xs font-semibold text-slate-800">
												{creatorName}
											</p>
										</div>
										{trip.creator?.slug &&
											trip.creator &&
											userData &&
											!isSameUser(trip.creator, userData) && (
												<div
													onClick={(e) => {
														e.preventDefault();
														e.stopPropagation();
													}}
												>
													<FollowButton
														userSlug={trip.creator.slug || ""}
														variant="icon"
														size="sm"
													/>
												</div>
											)}
									</div>
									<button
										type="button"
										onClick={(e) => {
											e.preventDefault();
											// TODO: プラン複製機能を実装
										}}
										className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-700 hover:border-indigo-200 hover:text-indigo-600"
									>
										<Icon icon="mdi:content-copy" className="h-3 w-3" />
										{t("home.mainTabs.duplicatePlan")}
									</button>
								</div>
							</div>
						</article>
					</Link>
				);
			})}
		</section>
	);
}

