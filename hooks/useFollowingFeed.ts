"use client";

import { useEffect, useState, useCallback } from "react";
import type { Trip } from "@/lib/core/types";
import { useAuth } from "@/lib/contexts/auth";
import logger from "@/lib/core/logger";

interface UseFollowingFeedResult {
	trips: Trip[] | null;
	loading: boolean;
	error: Error | null;
	refresh: () => Promise<void>;
	nextCursor?: string;
}

export function useFollowingFeed(limit: number = 20): UseFollowingFeedResult {
	const { user, loading: authLoading } = useAuth();
	const [trips, setTrips] = useState<Trip[] | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);
	const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);

	const fetchFollowingFeed = useCallback(async () => {
		// 認証が完了していない、またはユーザーがログインしていない場合は待機
		if (authLoading || !user) {
			setLoading(true);
			return;
		}

		try {
			setLoading(true);
			setError(null);

			// ユーザーが確実にログインしている状態でトークンを取得
			const token = await user.getIdToken();
			if (!token) {
				throw new Error("Failed to get ID token");
			}

			logger.debug("Fetching following feed", { userId: user.uid, limit });

			const res = await fetch(`/api/feed/following?limit=${limit}`, {
				method: "GET",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
			});

			if (!res.ok) {
				const errorText = await res.text();
				logger.error("Failed to fetch following feed", {
					status: res.status,
					error: errorText,
				});
				throw new Error(`Failed to fetch following feed: ${res.status}`);
			}

			const json = await res.json();

			logger.debug("Following feed fetched successfully", {
				count: json.trips?.length ?? 0,
			});
			setTrips(json.trips ?? []);
			setNextCursor(json.nextCursor);
		} catch (e: any) {
			logger.error("Error fetching following feed", e);
			setError(e instanceof Error ? e : new Error(String(e)));
			setTrips([]);
		} finally {
			setLoading(false);
		}
	}, [user, authLoading, limit]);

	useEffect(() => {
		fetchFollowingFeed();
	}, [fetchFollowingFeed]);

	return { trips, loading, error, refresh: fetchFollowingFeed, nextCursor };
}
