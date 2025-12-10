"use client";

import type { POIDialogAction } from "@/hooks/usePOIDialogState";
import type { SupportedLanguage } from "@/lib/core/types";
import { t } from "@/lib/i18n";
import { POIContactSection } from "./POIContactSection";
import { POIImageSection } from "./POIImageSection";
import { POIOpeningHoursSection } from "./POIOpeningHoursSection";
import { POIPriceSection } from "./POIPriceSection";
import { POIReviewSection } from "./POIReviewSection";
import { POITagsSection } from "./POITagsSection";

interface PlaceDetails {
	rating?: number;
	user_ratings_total?: number;
	types?: string[];
	editorial_summary?: {
		overview?: string;
	};
	opening_hours?: {
		weekday_text?: string[];
	};
	utc_offset_minutes?: number;
	business_status?: string;
	photos?: Array<{
		photo_reference: string;
		height?: number;
		width?: number;
	}>;
	formatted_phone_number?: string;
	website?: string;
	url?: string;
	vicinity?: string;
}

interface AggregatedRating {
	averageRating: number;
	totalReviews: number;
	sources: Array<{
		source: string;
		rating: number;
		reviewCount: number;
	}>;
}

interface UnifiedReview {
	id: string;
	source: "google" | "tripadvisor" | "foursquare";
	author: string;
	rating?: number;
	text: string;
	date: string;
	helpful_votes?: number;
}

interface OpeningHoursInfo {
	isOpen: boolean;
	openingSoon: boolean;
	currentHours?: string;
	openDays: boolean[];
	weekdayText: string[];
}

interface CachedImageInfo {
	url: string;
	cached: boolean;
}

interface POIDialogBodyProps {
	loading: boolean;
	error: string | null;
	placeDetails: PlaceDetails | null;
	aggregatedData?: {
		aggregatedRating?: AggregatedRating;
	} | null;
	unifiedReviews: UnifiedReview[];
	priceLevel: number | null;
	openingHoursInfo: OpeningHoursInfo | null;
	dayLabels: string[];
	cachedImages: CachedImageInfo[];
	currentPhotoIndex: number;
	imageLoading: boolean;
	showAllHours: boolean;
	showAllReviews: boolean;
	dispatch: React.Dispatch<POIDialogAction>;
	placeName: string;
	onOpenImageGallery: () => void;
	debugZoomLevel?: number;
	showZoomDebugInfo?: boolean;
	language: SupportedLanguage;
}

export function POIDialogBody({
	loading,
	error,
	placeDetails,
	aggregatedData,
	unifiedReviews,
	priceLevel,
	openingHoursInfo,
	dayLabels,
	cachedImages,
	currentPhotoIndex,
	imageLoading,
	showAllHours,
	showAllReviews,
	dispatch,
	placeName,
	onOpenImageGallery,
	debugZoomLevel,
	showZoomDebugInfo,
	language,
}: POIDialogBodyProps) {
	return (
		<div className="p-5 max-h-80 overflow-y-auto scrollbar-hide rounded-b-lg">
			{loading ? (
				<div className="flex items-center justify-center py-8">
					<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
					<span className="ml-2 text-sm text-gray-600">
						{t("poi.loadingInfo")}
					</span>
				</div>
			) : error ? (
				<div className="text-center py-8">
					<div className="text-red-500 text-sm">{error}</div>
				</div>
			) : placeDetails ? (
				<div className="flex gap-4">
					{/* メインコンテンツ */}
					<div className="flex-1 space-y-4 text-sm">
						{/* 価格帯と評価 */}
						<POIPriceSection
							aggregatedRating={aggregatedData?.aggregatedRating}
							placeRating={placeDetails.rating}
							placeReviewCount={placeDetails.user_ratings_total}
							priceLevel={priceLevel}
							language={language}
						/>

						{/* タグ（Types） */}
						<POITagsSection types={placeDetails.types} />

						{/* 概要（Editorial Summary） */}
						{placeDetails.editorial_summary?.overview && (
							<p className="text-gray-700 leading-relaxed">
								{placeDetails.editorial_summary.overview}
							</p>
						)}

						{/* 営業時間 */}
						{openingHoursInfo && (
							<POIOpeningHoursSection
								openingHoursInfo={openingHoursInfo}
								showAllHours={showAllHours}
								dayLabels={dayLabels}
								dispatch={dispatch}
								language={language}
							/>
						)}

						{/* 営業状況（business_status） */}
						{placeDetails.business_status &&
							placeDetails.business_status !== "OPERATIONAL" && (
								<div className="flex items-center space-x-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
									<svg
										className="w-3.5 h-3.5 text-yellow-600"
										fill="currentColor"
										viewBox="0 0 20 20"
									>
										<title>Warning</title>
										<path
											fillRule="evenodd"
											d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
											clipRule="evenodd"
										/>
									</svg>
									<span className="text-yellow-800">
										{placeDetails.business_status === "CLOSED_TEMPORARILY" &&
											t("poi.businessStatus.temporarilyClosed", language)}
										{placeDetails.business_status === "CLOSED_PERMANENTLY" &&
											t("poi.businessStatus.permanentlyClosed", language)}
									</span>
								</div>
							)}

						{/* 統合レビュー（Google + TripAdvisor + Foursquare） */}
						<POIReviewSection
							unifiedReviews={unifiedReviews}
							showAllReviews={showAllReviews}
							dispatch={dispatch}
						/>
					</div>

					{/* 画像・連絡先エリア（右サイド） */}
					<div className="w-36 flex-shrink-0 space-y-3">
						{/* 画像 */}
						{placeDetails.photos && placeDetails.photos.length > 0 && (
							<POIImageSection
								photos={placeDetails.photos}
								cachedImages={cachedImages}
								currentPhotoIndex={currentPhotoIndex}
								imageLoading={imageLoading}
								placeName={placeName}
								onOpenGallery={onOpenImageGallery}
								debugZoomLevel={debugZoomLevel}
								showZoomDebugInfo={showZoomDebugInfo}
								language={language}
							/>
						)}

						{/* 連絡先（画像の下） */}
						<POIContactSection
							formattedPhoneNumber={placeDetails.formatted_phone_number}
							website={placeDetails.website}
							googleMapsUrl={placeDetails.url}
							language={language}
						/>
					</div>
				</div>
			) : null}
		</div>
	);
}
