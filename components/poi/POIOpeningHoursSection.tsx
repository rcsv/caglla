"use client";

import { t } from "@/lib/i18n";
import type { POIDialogAction } from "@/hooks/usePOIDialogState";

interface OpeningHoursInfo {
	isOpen: boolean;
	openingSoon: boolean;
	currentHours?: string;
	openDays: boolean[];
	weekdayText: string[];
}

interface POIOpeningHoursSectionProps {
	openingHoursInfo: OpeningHoursInfo;
	showAllHours: boolean;
	dayLabels: string[];
	dispatch: React.Dispatch<POIDialogAction>;
	language: string;
}

export function POIOpeningHoursSection({
	openingHoursInfo,
	showAllHours,
	dayLabels,
	dispatch,
	language,
}: POIOpeningHoursSectionProps) {
	return (
		<div className="relative">
			<div
				className="flex items-center space-x-2 text-xs cursor-pointer"
				onMouseEnter={() => dispatch({ type: "SHOW_ALL_HOURS", show: true })}
				onMouseLeave={() => dispatch({ type: "SHOW_ALL_HOURS", show: false })}
			>
				<span
					className={
						openingHoursInfo.isOpen
							? "text-green-600 font-medium"
							: openingHoursInfo.openingSoon
								? "text-orange-600 font-medium"
								: "text-red-600 font-medium"
					}
				>
					{openingHoursInfo.isOpen
						? t("poi.openingHours.open", language)
						: openingHoursInfo.openingSoon
							? t("poi.openingHours.openingSoon", language)
							: t("poi.openingHours.closed", language)}
				</span>
				{openingHoursInfo.currentHours && (
					<span className="text-gray-600">
						{openingHoursInfo.currentHours}
					</span>
				)}
				<span className="text-gray-400">|</span>
				<div className="flex space-x-1 font-mono text-xs">
					{dayLabels.map((day, index) => {
						// Google APIは月曜始まりなので、インデックスを調整
						const apiIndex = index === 0 ? 6 : index - 1;
						const isOpen = openingHoursInfo.openDays[apiIndex];
						return (
							<span
								key={index}
								className={`${isOpen ? "text-gray-700" : "text-gray-300"}`}
							>
								{day}
							</span>
						);
					})}
				</div>
			</div>

			{/* ホバー時に全営業時間を表示 */}
			{showAllHours && (
				<div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg p-2 zidx-float-modal-content min-w-[200px] z-50">
					<div className="space-y-0.5 text-xs text-gray-700">
						{openingHoursInfo.weekdayText.map((day: string, index: number) => (
							<div key={index}>{day}</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

