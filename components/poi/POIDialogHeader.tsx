"use client";

import { t } from "@/lib/i18n";
import type { AvailableDay } from "@/app/(planner)/[userSlug]/[tripSlug]/TripProvider";
import { calculatePopupPosition } from "@/lib/utils/popup-position";
import type { POIDialogAction } from "@/hooks/usePOIDialogState";
import { TeardropMarker } from "@/components/common/TeardropMarker";

interface POIDialogHeaderProps {
	name: string;
	vicinity?: string;
	orderNumber?: number;
	onClose: () => void;
	onAddToItinerary?: (placeId: string, dayId: string) => void;
	availableDays?: AvailableDay[];
	showDaySelector: boolean;
	popupPosition: "top" | "bottom";
	buttonRef: React.RefObject<HTMLButtonElement>;
	popupRef: React.RefObject<HTMLDivElement>;
	dispatch: React.Dispatch<POIDialogAction>;
	placeId: string;
	language: string;
}

export function POIDialogHeader({
	name,
	vicinity,
	orderNumber,
	onClose,
	onAddToItinerary,
	availableDays,
	showDaySelector,
	popupPosition,
	buttonRef,
	popupRef,
	dispatch,
	placeId: _placeId,
	language,
}: POIDialogHeaderProps) {
	const handleToggleDaySelector = () => {
		if (!showDaySelector) {
			const position = calculatePopupPosition({
				buttonElement: buttonRef.current,
				estimatedPopupHeight: Math.min(
					(availableDays?.length ?? 0) * 60 + 40,
					300,
				),
			});
			dispatch({ type: "SET_POPUP_POSITION", position });
		}
		dispatch({ type: "TOGGLE_DAY_SELECTOR" });
	};

	const handleAddToDay = (dayId: string) => {
		if (onAddToItinerary) {
			onAddToItinerary(_placeId, dayId);
			dispatch({ type: "TOGGLE_DAY_SELECTOR" });
		}
	};

	return (
		<div className="flex items-center justify-between p-4 border-b border-gray-200">
			<div className="flex items-center space-x-2 flex-1 min-w-0">
				<div className="flex-shrink-0">
					<TeardropMarker number={orderNumber ?? 0} />
				</div>
				<div
					className={`flex-1 min-w-0 ${!vicinity ? "flex items-center" : ""}`}
				>
					<div>
						<h3 className="text-xl font-bold text-gray-900 leading-tight">
							{name}
						</h3>
						{vicinity && (
							<p className="text-sm text-gray-600 mt-0.5">{vicinity}</p>
						)}
					</div>
				</div>
			</div>
			<div className="flex items-center space-x-1 ml-2">
				{onAddToItinerary && availableDays && availableDays.length > 0 && (
					<div className="relative">
						<button
							type="button"
							ref={buttonRef}
							onClick={handleToggleDaySelector}
							className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm"
							aria-label={t("poi.addToItinerary")}
						>
							<svg
								className="w-4 h-4"
								fill="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<title>{t("poi.addToItinerary")}</title>
								<path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
							</svg>
							<span>{t("poi.addToItinerary")}</span>
						</button>
						{showDaySelector && (
							<div
								ref={popupRef}
								className={`absolute right-0 bg-white border border-gray-200 rounded-lg shadow-lg zidx-float-modal-content min-w-[200px] max-h-[300px] overflow-y-auto scrollbar-hide ${
									popupPosition === "bottom"
										? "top-full mt-1"
										: "bottom-full mb-1"
								}`}
							>
								<div className="p-2">
									<div className="text-xs font-medium text-gray-500 px-2 py-1 sticky top-0 bg-white border-b border-gray-100">
										{t("poi.daySelector.title")}
									</div>
									<div className="max-h-[240px] overflow-y-auto scrollbar-hide">
										{availableDays.map((day) => (
											<button
												type="button"
												key={day.id}
												onClick={() => handleAddToDay(day.id)}
												className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 rounded transition-colors"
											>
												<div className="font-medium text-gray-900">
													{day.date}
												</div>
												{day.title && (
													<div className="text-xs text-gray-600">
														{day.title}
													</div>
												)}
											</button>
										))}
									</div>
								</div>
							</div>
						)}
					</div>
				)}
				<button
					type="button"
					onClick={onClose}
					className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
					aria-label={t("common.close")}
				>
					<svg
						className="w-5 h-5 text-gray-500"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<title>{t("common.close")}</title>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>
		</div>
	);
}

