"use client";

import { useState, useMemo } from "react";
import { Icon } from "@iconify/react";
import { t } from "@/lib/i18n";
import type { Trip } from "@/lib/core/types";
import { toDateOrNull } from "@/lib/firebase/timestamp-utils";
import { resolveSocialStats } from "@/lib/social/trip-social-utils";
import { TripStatsRow } from "@/components/tripcard/TripStatsRow";
import { TripSocialStatsRow } from "@/components/tripcard/TripSocialStatsRow";
import TripShareSettingsModal from "@/components/modals/TripShareSettingsModal";
import { searchTrips } from "@/lib/utils/trip-search";

type MyShareView = {
	id: string;
	title: string;
	location: string;
	visibility: string;
	expires: string;
	updatedAt: string;
	attributes?: {
		days?: number;
		venues?: number;
		photos?: number;
		checklists?: number;
	};
	stats: {
		likes: number;
		comments: number;
		saves: number;
		clones: number;
	};
};

const MY_SHARED_TRIPS = [
	{
		id: "share-taiwan",
		title: "春の台湾・台北と九份",
		location: "台北 / 九份",
		visibility: "フォロワーまで",
		expires: "2025/05まで公開",
		updatedAt: "昨日更新",
		attributes: { days: 4, venues: 12, photos: 48, checklists: 6 },
		stats: { likes: 54, comments: 12, saves: 9, clones: 4 },
	},
	{
		id: "share-venice",
		title: "ヴェネツィア水上バースデー旅",
		location: "イタリア・ヴェネツィア",
		visibility: "全体公開",
		expires: "期限なし",
		updatedAt: "3日前",
		attributes: { days: 3, venues: 9, photos: 32, checklists: 5 },
		stats: { likes: 102, comments: 18, saves: 15, clones: 6 },
	},
	{
		id: "share-nagano",
		title: "軽井沢でワーケーション",
		location: "長野・軽井沢",
		visibility: "リンク限定",
		expires: "2025/01で自動非公開",
		updatedAt: "10日前",
		attributes: { days: 2, venues: 7, photos: 20, checklists: 8 },
		stats: { likes: 23, comments: 4, saves: 3, clones: 2 },
	},
];

function mapTripToMyShareView(trip: Trip): MyShareView {
	const updatedAtDate = toDateOrNull(trip.updated_at as any);
	const updatedAt = updatedAtDate
		? updatedAtDate.toLocaleDateString()
		: trip.updated_at
			? String(trip.updated_at)
			: "";

	const accessLevel = trip.access_level;
	let visibility = "";
	if (accessLevel === "public") {
		visibility = t("home.mainTabs.visibility.public");
	} else if (accessLevel === "unlisted") {
		visibility = t("home.mainTabs.visibility.linkOnly");
	} else {
		visibility = t("home.mainTabs.visibility.follower");
	}

	const resolvedStats = resolveSocialStats(trip);

	return {
		id: trip.id,
		title: trip.title || trip.destination || "Untitled Trip",
		location:
			trip.destination_place?.name ||
			trip.destination ||
			trip.destination_place?.formatted_address ||
			"",
		visibility,
		expires: "", // v1 では期限情報は未実装
		updatedAt,
		attributes: {
			days: trip.stats?.days,
			venues: trip.stats?.itineraries,
			photos: trip.stats?.photos,
			checklists: trip.stats?.checklists,
		},
		stats: {
			likes: resolvedStats.likes,
			comments: resolvedStats.comments,
			saves: resolvedStats.shares,
			clones: resolvedStats.replicas,
		},
	};
}

interface MyShareManagerProps {
	trips?: Trip[] | null;
	loading: boolean;
	onRefresh?: () => void;
	searchQuery?: string;
	filter?: string | null;
}

export function MyShareManager({
	trips,
	loading,
	onRefresh,
	searchQuery = "",
	filter = null,
}: MyShareManagerProps) {
	const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);

	const hasRealTrips = trips && trips.length > 0;

	// 検索とフィルタを適用
	const filteredTrips = useMemo(() => {
		if (!hasRealTrips) return [];

		let result = [...trips!];

		// 検索
		if (searchQuery.trim()) {
			result = searchTrips(result, searchQuery, [
				"title",
				"destination",
				"description",
			]);
		}

		// フィルタ
		if (filter) {
			const filterKey = filter.toLowerCase();
			if (filterKey.includes("public")) {
				result = result.filter((trip) => trip.access_level === "public");
			} else if (filterKey.includes("follower")) {
				result = result.filter((trip) => trip.access_level === "private");
			} else if (filterKey.includes("link") || filterKey.includes("unlisted")) {
				result = result.filter((trip) => trip.access_level === "unlisted");
			}
			// expires フィルタは将来実装
		}

		return result;
	}, [trips, hasRealTrips, searchQuery, filter]);

	const viewTrips: MyShareView[] = hasRealTrips
		? filteredTrips.map(mapTripToMyShareView)
		: MY_SHARED_TRIPS.map((trip) => ({
				id: trip.id,
				title: trip.title,
				location: trip.location,
				visibility: trip.visibility,
				expires: trip.expires,
				updatedAt: trip.updatedAt,
				attributes: trip.attributes,
				stats: trip.stats,
			}));

	const handleOpenModal = (trip: Trip) => {
		setSelectedTrip(trip);
		setIsModalOpen(true);
	};

	const handleCloseModal = () => {
		setIsModalOpen(false);
		setSelectedTrip(null);
	};

	const handleSuccess = () => {
		onRefresh?.();
	};

	return (
		<>
			<section className="space-y-3">
				{loading && !hasRealTrips && (
					<div className="space-y-2">
						<div className="h-16 rounded-sm bg-gray-100 animate-pulse" />
						<div className="h-16 rounded-sm bg-gray-100 animate-pulse" />
					</div>
				)}

				{!loading && !hasRealTrips && (
					<p className="text-xs text-slate-500">
						{t("home.mainTabs.shares.empty")}
					</p>
				)}

				{hasRealTrips && filteredTrips.length === 0 && (
					<p className="text-xs text-slate-500">
						{searchQuery || filter
							? t("home.mainTabs.shares.noResults")
							: t("home.mainTabs.shares.empty")}
					</p>
				)}

				{viewTrips.map((viewTrip) => {
					// viewTrip から元の Trip オブジェクトを取得
					const originalTrip = hasRealTrips
						? trips!.find((t) => t.id === viewTrip.id)
						: null;

					return (
						<article
							key={viewTrip.id}
							className="flex items-start justify-between gap-3 rounded-sm border border-slate-200 border-l-4 border-l-gray-300 bg-white p-4 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all"
						>
							<div className="flex-1 min-w-0 space-y-1">
								<h3 className="text-sm font-semibold text-slate-900 truncate">
									{viewTrip.title}
								</h3>
								<p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5 truncate">
									<Icon
										icon="mdi:map-marker"
										className="h-3.5 w-3.5 text-indigo-500 flex-shrink-0"
									/>
									<span className="truncate">{viewTrip.location}</span>
								</p>
								<p className="text-[11px] text-slate-500">
									{viewTrip.visibility} ・ {viewTrip.expires}
								</p>
								<p className="text-[11px] text-slate-400">
									{viewTrip.updatedAt}
								</p>
								{/* 旅行属性: 日数・スポット数・写真枚数・チェックリスト数 */}
								<TripStatsRow
									days={viewTrip.attributes?.days}
									venues={viewTrip.attributes?.venues}
									photos={viewTrip.attributes?.photos}
									checklists={viewTrip.attributes?.checklists}
								/>
							</div>
							<div className="flex flex-col items-end gap-2">
								{/* SNS的なリアクション・複製数 */}
								<TripSocialStatsRow
									stats={{
										likes: viewTrip.stats.likes,
										comments: viewTrip.stats.comments,
										shares: viewTrip.stats.saves,
										views: 0,
										replicas: viewTrip.stats.clones,
									}}
								/>
								{originalTrip && (
									<button
										type="button"
										onClick={() => handleOpenModal(originalTrip)}
										className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-700 hover:border-indigo-200 hover:text-indigo-600"
									>
										<Icon icon="mdi:tune" className="h-3 w-3" />
										{t("home.mainTabs.editShareSettings")}
									</button>
								)}
							</div>
						</article>
					);
				})}
			</section>

			<TripShareSettingsModal
				isOpen={isModalOpen}
				onClose={handleCloseModal}
				trip={selectedTrip}
				onSuccess={handleSuccess}
			/>
		</>
	);
}

