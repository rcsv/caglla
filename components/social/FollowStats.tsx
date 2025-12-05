"use client";

import React, { useState, useEffect, useCallback, useImperativeHandle } from "react";
import { makeAuthenticatedRequest } from "@/lib/api/helpers";
import logger from "@/lib/core/logger";
import { t } from "@/lib/i18n";

interface FollowStatsProps {
	userSlug: string;
	onFollowersClick: () => void;
	onFollowingClick: () => void;
}

interface FollowStatsData {
	followersCount: number;
	followingCount: number;
}

export interface FollowStatsHandle {
	mutate: () => void;
}

/**
 * FollowStats Component
 *
 * フォロワー・フォロー中数の表示コンポーネント
 * - 数字だけ太字で表示（Instagram風）
 * - クリック可能なリンク（最低 42px × 42px のヒットボックス）
 * - SWR/React Query でフォロー数を取得（将来的にSWR導入を考慮）
 */
const FollowStats = React.forwardRef<FollowStatsHandle, FollowStatsProps>(
	function FollowStats(
		{ userSlug, onFollowersClick, onFollowingClick },
		ref,
	) {
		const [stats, setStats] = useState<FollowStatsData | null>(null);
		const [loading, setLoading] = useState(true);
		const [error, setError] = useState<string | null>(null);

		const fetchStats = useCallback(async () => {
			try {
				setLoading(true);
				setError(null);

				const response = await makeAuthenticatedRequest(
					`/api/users/${userSlug}/follow-list-summary`,
				);

				if (!response.ok) {
					throw new Error("Failed to fetch follow stats");
				}

				const data = await response.json();
				setStats({
					followersCount: data.followersCount || 0,
					followingCount: data.followingCount || 0,
				});
			} catch (err) {
				logger.error("Error fetching follow stats:", err);
				setError(err instanceof Error ? err.message : "Failed to fetch stats");
			} finally {
				setLoading(false);
			}
		}, [userSlug]);

		useEffect(() => {
			if (userSlug) {
				void fetchStats();
			}
		}, [userSlug, fetchStats]);

		// 外部からmutateを呼び出せるようにする（SWR導入時の互換性のため）
		const mutate = useCallback(() => {
			void fetchStats();
		}, [fetchStats]);

		// mutate関数を公開（FollowButtonから呼び出し可能にする）
		useImperativeHandle(
			ref,
			() => ({
				mutate,
			}),
			[mutate],
		);

		if (loading) {
			return (
				<div className="flex items-center gap-6">
					<div className="h-6 w-16 bg-gray-200 animate-pulse rounded" />
					<div className="h-6 w-16 bg-gray-200 animate-pulse rounded" />
				</div>
			);
		}

		if (error || !stats) {
			return null;
		}

		return (
			<div className="flex items-center gap-6">
				{/* フォロワー数 */}
				<button
					type="button"
					onClick={onFollowersClick}
					className="flex items-center gap-2 min-h-[42px] min-w-[42px] px-2 py-1 hover:opacity-70 transition-opacity"
					aria-label={t("social.followers.count", { count: stats.followersCount })}
				>
					<span className="font-bold text-gray-900">{stats.followersCount}</span>
					<span className="text-gray-600">{t("social.followers")}</span>
				</button>

				{/* フォロー中数 */}
				<button
					type="button"
					onClick={onFollowingClick}
					className="flex items-center gap-2 min-h-[42px] min-w-[42px] px-2 py-1 hover:opacity-70 transition-opacity"
					aria-label={t("social.following.count", { count: stats.followingCount })}
				>
					<span className="font-bold text-gray-900">{stats.followingCount}</span>
					<span className="text-gray-600">{t("social.following")}</span>
				</button>
			</div>
		);
	},
);

export default FollowStats;
