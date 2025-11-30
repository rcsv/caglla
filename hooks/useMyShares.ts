"use client";

import { useEffect, useState, useCallback } from "react";
import type { Trip } from "@/lib/core/types";
import { useAuth } from "@/lib/contexts/auth";
import logger from "@/lib/core/logger";

interface UseMySharesResult {
	trips: Trip[] | null;
	loading: boolean;
	error: Error | null;
	refresh: () => Promise<void>;
}

export function useMyShares(): UseMySharesResult {
	const { user, loading: authLoading } = useAuth();
	const [trips, setTrips] = useState<Trip[] | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	const fetchMyShares = useCallback(async () => {
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

			logger.debug("Fetching my shares", { userId: user.uid });

			const res = await fetch("/api/trips/my-shares?limit=20", {
				method: "GET",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
			});

			if (!res.ok) {
				const errorText = await res.text();
				logger.error("Failed to fetch my shares", {
					status: res.status,
					error: errorText,
				});
				throw new Error(`Failed to fetch my shares: ${res.status}`);
			}

			const json = await res.json();

			logger.debug("My shares fetched successfully", {
				count: json.trips?.length ?? 0,
			});
			setTrips(json.trips ?? []);
		} catch (e: any) {
			logger.error("Error fetching my shares", e);
			setError(e instanceof Error ? e : new Error(String(e)));
			setTrips([]);
		} finally {
			setLoading(false);
		}
	}, [user, authLoading]);

	useEffect(() => {
		fetchMyShares();
	}, [fetchMyShares]);

	return { trips, loading, error, refresh: fetchMyShares };
}
