"use client";

import React from "react";
import { Icon } from "@iconify/react";
import type { ResolvedTripSocialStats } from "@/lib/social/trip-social-utils";

export interface TripSocialStatsRowProps {
	stats: ResolvedTripSocialStats;
	className?: string;
	showComments?: boolean;
	showShares?: boolean;
	showReplicas?: boolean;
}

interface SocialStatItemProps {
	icon: string;
	value: number;
	className?: string;
}

const SocialStatItem: React.FC<SocialStatItemProps> = ({
	icon,
	value,
	className,
}) => {
	return (
		<span className={`inline-flex items-center gap-1 ${className ?? ""}`}>
			<Icon icon={icon} className="h-3 w-3" />
			<span className="tabular-nums">{value}</span>
		</span>
	);
};

export const TripSocialStatsRow: React.FC<TripSocialStatsRowProps> = ({
	stats,
	className = "",
	showComments = true,
	showShares = true,
	showReplicas = true,
}) => {
	const { likes, comments, shares, replicas } = stats;

	return (
		<div
			className={`flex items-center gap-2 text-[11px] text-slate-500 ${className}`}
		>
			<SocialStatItem icon="mdi:heart-outline" value={likes} />
			{showComments && (
				<SocialStatItem icon="mdi:message-outline" value={comments} />
			)}
			{showShares && <SocialStatItem icon="mdi:share-outline" value={shares} />}
			{showReplicas && (
				<SocialStatItem icon="mdi:content-copy" value={replicas} />
			)}
		</div>
	);
};
