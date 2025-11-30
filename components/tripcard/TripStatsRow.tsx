"use client";

import React from "react";
import { Icon } from "@iconify/react";

export type TripStatsFields = "days" | "venues" | "photos" | "checklists";

export interface TripStatsRowProps {
	days?: number;
	venues?: number;
	photos?: number;
	checklists?: number;
	fields?: TripStatsFields[];
	className?: string;
}

export const TripStatsRow: React.FC<TripStatsRowProps> = ({
	days,
	venues,
	photos,
	checklists,
	fields = ["days", "venues", "photos", "checklists"],
	className = "",
}) => {
	const shouldShow = {
		days: fields.includes("days") && days != null,
		venues: fields.includes("venues") && venues != null,
		photos: fields.includes("photos") && photos != null,
		checklists: fields.includes("checklists") && checklists != null,
	};

	if (
		!shouldShow.days &&
		!shouldShow.venues &&
		!shouldShow.photos &&
		!shouldShow.checklists
	) {
		return null;
	}

	return (
		<div
			className={`mt-1 flex flex-wrap gap-3 text-[11px] text-slate-500 ${className}`}
		>
			{shouldShow.days && (
				<span className="inline-flex items-center gap-1">
					<Icon
						icon="mdi:calendar-range"
						className="h-3.5 w-3.5 text-slate-400"
					/>
					<span>{days} days</span>
				</span>
			)}
			{shouldShow.venues && (
				<span className="inline-flex items-center gap-1">
					<Icon
						icon="mdi:map-marker-radius"
						className="h-3.5 w-3.5 text-slate-400"
					/>
					<span>{venues} venues</span>
				</span>
			)}
			{shouldShow.photos && (
				<span className="inline-flex items-center gap-1">
					<Icon
						icon="mdi:image-multiple"
						className="h-3.5 w-3.5 text-slate-400"
					/>
					<span>{photos}</span>
				</span>
			)}
			{shouldShow.checklists && (
				<span className="inline-flex items-center gap-1">
					<Icon
						icon="mdi:check-decagram"
						className="h-3.5 w-3.5 text-slate-400"
					/>
					<span>{checklists}</span>
				</span>
			)}
		</div>
	);
};
