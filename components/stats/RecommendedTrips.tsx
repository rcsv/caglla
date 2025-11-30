"use client";
import logger from "@/lib/core/logger";
import { t } from "@/lib/i18n";

import React, { useEffect, useState } from "react";
import { getRecommendedTrips } from "@/lib/travel/trip-search";
import { useAuth } from "@/lib/contexts/auth";
import TripCard from "@/components/tripcard/TripCard";
import Loading from "@/components/common/Loading";
import type { Trip } from "@/lib/core/types";

export interface RecommendedTripsProps {
	limit?: number;
	className?: string;
}

export const RecommendedTrips: React.FC<RecommendedTripsProps> = ({
	limit = 6,
	className,
}) => {
	const [trips, setTrips] = useState<Trip[]>([]);
	const [loading, setLoading] = useState(true);
	const { user, loading: authLoading } = useAuth();

	useEffect(() => {
		const fetchRecommendations = async () => {
			// 認証が完了していない場合は待機
			if (authLoading) {
				logger.debug("🔍 RecommendedTrips: Waiting for auth...");
				return;
			}

			// ユーザーがログインしていない場合は空の配列を返す
			if (!user) {
				logger.debug("🔍 RecommendedTrips: No user, returning empty trips");
				setTrips([]);
				setLoading(false);
				return;
			}

			try {
				logger.debug(
					"🔍 RecommendedTrips: Fetching recommendations for user:",
					user.uid,
				);
				const result = await getRecommendedTrips(limit);
				logger.debug(
					"✅ RecommendedTrips: Got trips:",
					result.trips?.length || 0,
				);
				setTrips(result.trips || []);
			} catch (e) {
				logger.error("❌ RecommendedTrips: Fetch error:", e);
			} finally {
				setLoading(false);
			}
		};

		fetchRecommendations();
	}, [limit, user, authLoading]);

	if (authLoading) return <Loading className="py-8" />;
	if (loading) return <Loading className="py-8" />;
	if (trips.length === 0) return null;

	return (
		<section className={className}>
			<h3 className="text-xl font-semibold text-gray-900 mb-6">
				{t("recommendedTrips.title")}
			</h3>
			<div className="grid grid-cols-1 gap-4">
				{trips.map((trip) => (
					<TripCard key={trip.id} trip={trip} variant="horizontal" />
				))}
			</div>
		</section>
	);
};

export default RecommendedTrips;
