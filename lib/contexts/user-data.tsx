"use client";

import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	ReactNode,
	useCallback,
} from "react";
import logger from "@/lib/core/logger";
import { useAuth } from "@/lib/contexts/auth";
import { makeAuthenticatedRequest } from "@/lib/api/helpers";
import {
	PlanId,
	RestrictionType,
	PLAN_CONFIGS,
} from "@/lib/subscription/restriction";
import type { Trip, User } from "@/lib/core/types";
import { calculateTripStats } from "@/lib/travel/trip-stats";

interface UserDataContextType {
	// ユーザー情報
	userData: User | null;
	userDataLoading: boolean;
	userDataError: string | null;

	// プラン情報
	userPlanId: PlanId;
	planConfig: any;
	planLoading: boolean;
	planError: string | null;

	// 旅行データ
	trips: Trip[];
	tripsLoading: boolean;
	tripsError: string | null;

	// 統計情報
	tripCount: number;
	privateTripCount: number;

	// 更新関数
	refreshUserData: () => Promise<void>;
	refreshUserPlan: () => Promise<void>;
	refreshTrips: () => Promise<void>;
	addTrip: (trip: Trip) => void;
	updateTrip: (tripId: string, updates: Partial<Trip>) => void;
	removeTrip: (tripId: string) => void;
}

const UserDataContext = createContext<UserDataContextType | undefined>(
	undefined,
);

interface UserDataProviderProps {
	children: ReactNode;
}

export function UserDataProvider({ children }: UserDataProviderProps) {
	const { user } = useAuth();

	// ユーザー情報の状態
	const [userData, setUserData] = useState<User | null>(null);
	const [userDataLoading, setUserDataLoading] = useState(false);
	const [userDataError, setUserDataError] = useState<string | null>(null);

	// プラン情報の状態（デフォルト値を設定）
	const [userPlanId, setUserPlanId] = useState<PlanId>(PlanId.SEASON_TRAVELER);
	const [planLoading, setPlanLoading] = useState(false);
	const [planError, setPlanError] = useState<string | null>(null);

	// 旅行データの状態
	const [trips, setTrips] = useState<Trip[]>([]);
	const [tripsLoading, setTripsLoading] = useState(false);
	const [tripsError, setTripsError] = useState<string | null>(null);

	// ユーザー情報を取得
	const refreshUserData = useCallback(async () => {
		if (!user) return;

		try {
			setUserDataLoading(true);
			setUserDataError(null);

			const response = await makeAuthenticatedRequest("/api/users", {
				method: "GET",
			});

			if (response.ok) {
				const data = await response.json();
				setUserData(data.user);
			} else {
				logger.error("Failed to fetch user data:", response.status);
				setUserDataError("ユーザー情報の取得に失敗しました");
			}
		} catch (error) {
			logger.error("Error fetching user data:", error);
			setUserDataError("ユーザー情報の取得に失敗しました");
		} finally {
			setUserDataLoading(false);
		}
	}, [user]);

	// ユーザープラン情報を取得
	const refreshUserPlan = useCallback(async () => {
		if (!user) return;

		try {
			setPlanLoading(true);
			setPlanError(null);

			const response = await makeAuthenticatedRequest("/api/user/plan", {
				method: "GET",
			});

			if (response.ok) {
				const data = await response.json();
				setUserPlanId(data.planId);
			} else {
				logger.error("Failed to fetch user plan:", response.status);
				// フォールバック: ユーザーオブジェクトからplanIdを取得
				if (user.planId) {
					setUserPlanId(user.planId as PlanId);
				}
			}
		} catch (error) {
			logger.error("Error fetching user plan:", error);
			setPlanError("プラン情報の取得に失敗しました");
			// フォールバック: ユーザーオブジェクトからplanIdを取得
			if (user.planId) {
				setUserPlanId(user.planId as PlanId);
			}
		} finally {
			setPlanLoading(false);
		}
	}, [user]);

	// 旅行データを取得
	const refreshTrips = useCallback(async () => {
		if (!user) return;

		try {
			setTripsLoading(true);
			setTripsError(null);

			const response = await makeAuthenticatedRequest(
				"/api/trips/accessible?includeShared=true",
			);

			if (response.ok) {
				const data = await response.json();
				setTrips(data.trips || []);
			} else {
				logger.error("Failed to fetch trips:", response.status);
				setTripsError("旅行データの取得に失敗しました");
			}
		} catch (error) {
			logger.error("Error fetching trips:", error);
			setTripsError("旅行データの取得に失敗しました");
		} finally {
			setTripsLoading(false);
		}
	}, [user]);

	// 旅行を追加
	const addTrip = (trip: Trip) => {
		setTrips((prev) => [trip, ...prev]);
	};

	// 旅行を更新
	const updateTrip = (tripId: string, updates: Partial<Trip>) => {
		setTrips((prev) =>
			prev.map((trip) => (trip.id === tripId ? { ...trip, ...updates } : trip)),
		);
	};

	// 旅行を削除
	const removeTrip = (tripId: string) => {
		setTrips((prev) => prev.filter((trip) => trip.id !== tripId));
	};

	// 統計情報を計算
	const tripStats = calculateTripStats(trips);
	const tripCount = tripStats.total;
	const privateTripCount = tripStats.private;

	// 初期データ読み込み
	useEffect(() => {
		if (user) {
			refreshUserData();
			refreshUserPlan();
			refreshTrips();
		}
	}, [user, refreshUserData, refreshUserPlan, refreshTrips]);

	const value: UserDataContextType = {
		// ユーザー情報
		userData,
		userDataLoading,
		userDataError,

		// プラン情報
		userPlanId,
		planConfig: PLAN_CONFIGS[userPlanId],
		planLoading,
		planError,

		// 旅行データ
		trips,
		tripsLoading,
		tripsError,

		// 統計情報
		tripCount,
		privateTripCount,

		// 更新関数
		refreshUserData,
		refreshUserPlan,
		refreshTrips,
		addTrip,
		updateTrip,
		removeTrip,
	};

	return (
		<UserDataContext.Provider value={value}>
			{children}
		</UserDataContext.Provider>
	);
}

export function useUserData() {
	const context = useContext(UserDataContext);
	if (context === undefined) {
		throw new Error("useUserData must be used within a UserDataProvider");
	}
	return context;
}
