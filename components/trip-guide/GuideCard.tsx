"use client";

import { Icon } from "@iconify/react";
import Link from "next/link";
import Image from "next/image";
import type { Trip } from "@/lib/core/types";
import { toDateOrNull } from "@/lib/firebase/timestamp-utils";
import { resolveSocialStats } from "@/lib/social/trip-social-utils";
import { TripStatsRow } from "@/components/tripcard/TripStatsRow";
import { TripSocialStatsRow } from "@/components/tripcard/TripSocialStatsRow";
import { t } from "@/lib/i18n";

interface GuideCardProps {
	trip: Trip;
	variant: "draft" | "published";
	onEdit: (trip: Trip) => void;
	onDelete: (trip: Trip) => void;
	onPublish?: (trip: Trip) => void;
	onUnpublish?: (trip: Trip) => void;
	onViewAnalytics?: (trip: Trip) => void;
}

/**
 * ガイドカードコンポーネント
 *
 * 執筆中または公開済みのガイドを表示するカードです。
 *
 * @remarks
 * 将来のコレクション分離時も、このコンポーネントはそのまま使用可能です。
 * Trip 型が Template 型に変わっても、構造が同じであれば動作します。
 */
export function GuideCard({
	trip,
	variant,
	onEdit,
	onDelete,
	onPublish,
	onUnpublish,
	onViewAnalytics,
}: GuideCardProps) {
	const updatedAtDate = toDateOrNull(trip.updated_at as any);
	const updatedAt = updatedAtDate
		? updatedAtDate.toLocaleDateString()
		: trip.updated_at
			? String(trip.updated_at)
			: "";

	const resolvedStats = resolveSocialStats(trip);

	const getAccessLevelLabel = (accessLevel?: string) => {
		if (accessLevel === "public") return t("tripGuide.card.public", "Public");
		if (accessLevel === "unlisted")
			return t("tripGuide.card.sharedLink", "Shared link");
		return t("tripGuide.card.draft", "Draft");
	};

	const getAccessLevelColor = (accessLevel?: string) => {
		if (accessLevel === "public")
			return "text-green-600 bg-green-50 border-green-200";
		if (accessLevel === "unlisted")
			return "text-blue-600 bg-blue-50 border-blue-200";
		return "text-gray-600 bg-gray-50 border-gray-200";
	};

	const accessLevelLabel = getAccessLevelLabel(trip.access_level);
	const accessLevelColor = getAccessLevelColor(trip.access_level);

	const tripUrl =
		trip.creator?.slug && trip.slug
			? `/${trip.creator.slug}/${trip.slug}`
			: "#";

	// ドラフトバリアントの場合は横長レイアウト
	if (variant === "draft") {
		return (
			<div className="relative rounded-sm border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
				<div className="flex">
					{/* 画像（左側） */}
					{trip.image_url ? (
						<div className="relative w-32 h-32 flex-shrink-0">
							<Image
								src={trip.image_url}
								alt={trip.title || ""}
								fill
								sizes="128px"
								className="object-cover"
							/>
						</div>
					) : (
						<div className="w-32 h-32 flex-shrink-0 bg-gray-100 flex items-center justify-center">
							<Icon
								icon="mdi:image-outline"
								className="h-8 w-8 text-gray-400"
							/>
						</div>
					)}

					{/* コンテンツ（右側） */}
					<div className="flex-1 p-4 flex flex-col justify-between min-w-0">
						<div className="space-y-2">
							{/* ヘッダー */}
							<div className="flex items-start justify-between gap-2">
								<div className="flex-1 min-w-0">
									<Link href={tripUrl} className="block group">
										<h3 className="text-base font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
											{trip.title ||
												trip.destination ||
												t("tripGuide.card.untitled", "Untitled Guide")}
										</h3>
									</Link>
									{trip.destination && (
										<p className="text-sm text-gray-600 flex items-center gap-1 mt-1 truncate">
											<Icon
												icon="mdi:map-marker"
												className="h-4 w-4 text-indigo-500 flex-shrink-0"
											/>
											<span className="truncate">{trip.destination}</span>
										</p>
									)}
								</div>
							</div>

							{/* 更新日時 */}
							{updatedAt && (
								<p className="text-xs text-gray-400">
									{t("tripGuide.card.updated", "更新")}: {updatedAt}
								</p>
							)}
						</div>

						{/* アクションボタン */}
						<div className="flex items-center gap-2 pt-2 border-t border-gray-100 mt-2">
							<button
								onClick={() => onEdit(trip)}
								className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-sm hover:bg-gray-50 transition-colors"
							>
								<Icon icon="mdi:pencil" className="h-4 w-4" />
								{t("tripGuide.card.edit", "編集")}
							</button>

							{onPublish && (
								<button
									onClick={() => onPublish(trip)}
									className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-white bg-indigo-600 rounded-sm hover:bg-indigo-700 transition-colors"
								>
									<Icon icon="mdi:publish" className="h-4 w-4" />
									{t("tripGuide.card.publish", "公開")}
								</button>
							)}

							<button
								onClick={() => onDelete(trip)}
								className="inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-red-700 bg-white border border-red-300 rounded-sm hover:bg-red-50 transition-colors"
							>
								<Icon icon="mdi:delete" className="h-4 w-4" />
							</button>
						</div>
					</div>
				</div>
			</div>
		);
	}

	// 公開済みバリアントは従来の縦長レイアウト
	return (
		<div className="relative rounded-sm border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
			{/* 画像 */}
			{trip.image_url && (
				<div className="relative h-48 w-full">
					<Image
						src={trip.image_url}
						alt={trip.title || ""}
						fill
						sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
						className="object-cover"
					/>
				</div>
			)}

			<div className="p-4 space-y-3">
				{/* ヘッダー */}
				<div className="flex items-start justify-between gap-2">
					<div className="flex-1 min-w-0">
						<Link href={tripUrl} className="block group">
							<h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
								{trip.title ||
									trip.destination ||
									t("tripGuide.card.untitled", "Untitled Guide")}
							</h3>
						</Link>
						{trip.destination && (
							<p className="text-sm text-gray-600 flex items-center gap-1 mt-1 truncate">
								<Icon
									icon="mdi:map-marker"
									className="h-4 w-4 text-indigo-500 flex-shrink-0"
								/>
								<span className="truncate">{trip.destination}</span>
							</p>
						)}
					</div>
				</div>

				{/* 更新日時 */}
				{updatedAt && (
					<p className="text-xs text-gray-400">
						{t("tripGuide.card.updated", "更新")}: {updatedAt}
					</p>
				)}

				{/* 統計情報（公開済みの場合） */}
				{variant === "published" && (
					<div className="space-y-2">
						<TripStatsRow
							days={trip.stats?.days}
							venues={trip.stats?.itineraries}
							photos={trip.stats?.photos}
							checklists={trip.stats?.checklists}
						/>
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
				)}

				{/* アクションボタン */}
				<div className="flex items-center gap-2 pt-2 border-t border-gray-100">
					<button
						onClick={() => onEdit(trip)}
						className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-sm hover:bg-gray-50 transition-colors"
					>
						<Icon icon="mdi:pencil" className="h-4 w-4" />
						{t("tripGuide.card.edit", "編集")}
					</button>

					{variant === "draft" && onPublish && (
						<button
							onClick={() => onPublish(trip)}
							className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-white bg-indigo-600 rounded-sm hover:bg-indigo-700 transition-colors"
						>
							<Icon icon="mdi:publish" className="h-4 w-4" />
							{t("tripGuide.card.publish", "公開")}
						</button>
					)}

					{variant === "published" && onUnpublish && (
						<button
							onClick={() => onUnpublish(trip)}
							className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-sm hover:bg-gray-50 transition-colors"
						>
							<Icon icon="mdi:unpublish" className="h-4 w-4" />
							{t("tripGuide.card.unpublish", "非公開")}
						</button>
					)}

					{variant === "published" && onViewAnalytics && (
						<button
							onClick={() => onViewAnalytics(trip)}
							className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-sm hover:bg-gray-50 transition-colors"
						>
							<Icon icon="mdi:chart-line" className="h-4 w-4" />
							{t("tripGuide.card.analytics", "統計")}
						</button>
					)}

					<button
						onClick={() => onDelete(trip)}
						className="inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-red-700 bg-white border border-red-300 rounded-sm hover:bg-red-50 transition-colors"
					>
						<Icon icon="mdi:delete" className="h-4 w-4" />
					</button>
				</div>
			</div>
		</div>
	);
}
