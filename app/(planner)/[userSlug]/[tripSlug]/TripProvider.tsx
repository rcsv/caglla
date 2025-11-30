"use client";

import {
	createContext,
	useContext,
	ReactNode,
	useState,
	useCallback,
	useEffect,
	useMemo,
} from "react";
import type { Trip } from "@/lib/core/types";
import { useRouter, useParams } from "next/navigation";
import { makeAuthenticatedRequest, getIdToken } from "@/lib/api/helpers";
import { useAuth } from "@/lib/contexts/auth";
import logger from "@/lib/core/logger";
import { toDateOrNull } from "@/lib/firebase/timestamp-utils";

export interface AvailableDay {
	id: string;
	date: string; // ISO string or display string (e.g. "Day 1")
	title: string;
}

interface TripContextValue {
	trip: Trip | null;
	loading: boolean;
	error: "not-found" | "forbidden" | "unknown" | null;
	updateTrip: (updates: Partial<Trip> | ((prev: Trip) => Trip)) => void;
	refreshTrip: () => Promise<void>;
	availableDays: AvailableDay[];
}

const TripContext = createContext<TripContextValue | undefined>(undefined);

interface TripProviderProps {
	trip: Trip | null;
	children: ReactNode;
}

/**
 * TripProvider
 *
 * TripデータをContext経由で提供します。
 * 読み取り専用として設計されており、mutationsはAPI Route経由で行います。
 * ただし、楽観的更新のためにローカルstateでの更新もサポートします。
 */
export function TripProvider({
	trip: initialTrip,
	children,
}: TripProviderProps) {
	const [trip, setTrip] = useState<Trip | null>(initialTrip);
	const [loading, setLoading] = useState(!initialTrip);
	const [error, setError] = useState<
		"not-found" | "forbidden" | "unknown" | null
	>(null);
	const router = useRouter();
	const params = useParams<{ tripSlug: string }>();
	const { user, loading: authLoading } = useAuth();

	// Server ComponentでTripが取得できない場合、Client Component側で再取得を試みる
	useEffect(() => {
		// 認証状態の読み込みが完了するまで待つ
		if (authLoading) return;

		if (!initialTrip && params?.tripSlug) {
			const fetchTrip = async () => {
				try {
					setLoading(true);
					setError(null);

					logger.debug("TripProvider: Fetching trip from API", {
						tripSlug: params.tripSlug,
						hasUser: !!user,
					});

					// 認証されている場合は認証付きリクエスト、そうでない場合は通常のfetch
					let response: Response;
					if (user) {
						try {
							response = await makeAuthenticatedRequest(
								`/api/trip/${params.tripSlug}`,
							);
						} catch (authErr: any) {
							// 認証エラーの場合は通常のfetchにフォールバック
							logger.debug(
								"TripProvider: Auth failed, falling back to unauthenticated request",
								authErr,
							);
							response = await fetch(`/api/trip/${params.tripSlug}`);
						}
					} else {
						// 認証されていない場合は通常のfetch
						response = await fetch(`/api/trip/${params.tripSlug}`);
					}

					if (response.ok) {
						const tripData = await response.json();
						logger.debug("TripProvider: Trip fetched successfully", {
							tripId: tripData.id,
						});
						setTrip(tripData);
						setError(null);
					} else if (response.status === 404) {
						logger.warn("TripProvider: Trip not found", {
							tripSlug: params.tripSlug,
						});
						setError("not-found");
					} else if (response.status === 403) {
						logger.warn("TripProvider: Access forbidden", {
							tripSlug: params.tripSlug,
						});
						setError("forbidden");
					} else {
						logger.error("TripProvider: Failed to fetch trip", {
							status: response.status,
							tripSlug: params.tripSlug,
						});
						setError("unknown");
					}
				} catch (err) {
					logger.error("TripProvider: Error fetching trip", err);
					setError("unknown");
				} finally {
					setLoading(false);
				}
			};

			void fetchTrip();
		} else if (initialTrip) {
			setTrip(initialTrip);
			setError(null);
			setLoading(false);
		}
	}, [initialTrip, params?.tripSlug, user, authLoading]);

	// 初期tripが変更された場合（Server Componentからの再fetch）にstateを更新
	useEffect(() => {
		if (initialTrip) {
			setTrip(initialTrip);
			setError(null);
			setLoading(false);
		}
	}, [initialTrip]);

	// 楽観的更新用のローカルstate更新
	const updateTrip = useCallback(
		(updates: Partial<Trip> | ((prev: Trip) => Trip)) => {
			setTrip((prev) => {
				if (typeof updates === "function") {
					return updates(prev);
				}
				return { ...prev, ...updates };
			});
		},
		[],
	);

	// サーバーから再取得（API経由で直接取得してstateを更新）
	const refreshTrip = useCallback(async () => {
		if (!params?.tripSlug) {
			logger.warn("TripProvider: Cannot refresh trip without tripSlug");
			return;
		}

		try {
			logger.debug("TripProvider: Refreshing trip data", {
				tripSlug: params.tripSlug,
			});

			// 認証されている場合は認証付きリクエスト、そうでない場合は通常のfetch
			let response: Response;
			if (user) {
				try {
					response = await makeAuthenticatedRequest(
						`/api/trip/${params.tripSlug}`,
					);
				} catch (authErr: any) {
					logger.debug(
						"TripProvider: Auth failed during refresh, falling back to unauthenticated request",
						authErr,
					);
					response = await fetch(`/api/trip/${params.tripSlug}`);
				}
			} else {
				response = await fetch(`/api/trip/${params.tripSlug}`);
			}

			if (response.ok) {
				const tripData = await response.json();
				logger.debug("TripProvider: Trip refreshed successfully", {
					tripId: tripData.id,
				});
				setTrip(tripData);
				setError(null);
			} else {
				logger.error("TripProvider: Failed to refresh trip", {
					status: response.status,
				});
			}
		} catch (err) {
			logger.error("TripProvider: Error refreshing trip", err);
		}
	}, [params?.tripSlug, user]);

	// availableDaysを中央集約的に生成（POIDialog、左メニューなどで共有）
	const availableDays = useMemo<AvailableDay[]>(() => {
		if (!trip?.days) return [];

		return trip.days.map((d, index) => {
			const dayDate = toDateOrNull(d.date);

			// テンプレートモードの場合は日付が存在しないので、"Day 1", "Day 2" 形式を使用
			const dateDisplay = dayDate ? dayDate.toISOString() : `Day ${index + 1}`;

			return {
				id: d.id,
				date: dateDisplay,
				title: d.description || "",
			};
		});
	}, [trip?.days]);

	return (
		<TripContext.Provider
			value={{ trip, loading, error, updateTrip, refreshTrip, availableDays }}
		>
			{children}
		</TripContext.Provider>
	);
}

/**
 * useTrip hook
 *
 * TripProviderからTripデータを取得します。
 */
export function useTrip(): TripContextValue {
	const context = useContext(TripContext);
	if (context === undefined) {
		throw new Error("useTrip must be used within a TripProvider");
	}
	return context;
}
