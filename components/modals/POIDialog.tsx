"use client";

import { useMemo } from "react";
import { useTrip } from "@/app/(planner)/[userSlug]/[tripSlug]/TripProvider";
import { POIDialogBody } from "@/components/poi/POIDialogBody";
import { POIDialogHeader } from "@/components/poi/POIDialogHeader";
import { usePOIDialogState } from "@/hooks/usePOIDialogState";
import { useAuth } from "@/lib/contexts/auth";
import { isDevelopment } from "@/lib/core/env-validation";
import type { PlaceData } from "@/lib/core/types";
import { usePOIDetails } from "@/lib/hooks/usePOIDetails";
import { t } from "@/lib/i18n";
import { getZoomForPlaceTypes } from "@/lib/travel/map-zoom";
import { getUserLanguage } from "@/lib/utils/language";
import { getAggregatedPriceLevel } from "@/lib/utils/venue-pricing";
import ImageGalleryModal from "./ImageGalleryModal";
import { parseOpeningHours } from "./utils/parse-opening-hours";

interface POIDialogProps {
	poiData: {
		placeId: string;
		name: string;
		location: {
			lat: number;
			lng: number;
		};
		placeData?: PlaceData; // Itinerariesに保存されているplace_data
		orderNumber?: number; // マップピン番号
	} | null;
	onClose: () => void;
	onAddToItinerary?: (placeId: string, dayId: string) => void;
	// availableDaysは削除（Structural Fix: TripProviderから直接取得）
	className?: string;
}

export default function POIDialog({
	poiData,
	onClose,
	onAddToItinerary,
	className = "",
}: POIDialogProps) {
	const { user } = useAuth();
	const language = getUserLanguage(user);

	// Structural Fix: availableDaysをTripProviderから取得（中央集約）
	// テンプレートモード対応済み（日付がない場合は "Day 1", "Day 2" 形式）
	const { availableDays } = useTrip();

	// placeIdだけを抽出してメモ化（poiDataオブジェクトの参照変更を無視）
	const currentPlaceId = poiData?.placeId;
	const currentPlaceData = poiData?.placeData;

	// データ取得をカスタムhookに委譲
	const {
		placeDetails,
		aggregatedData,
		unifiedReviews,
		cachedImages,
		loading,
		error,
		imageLoading,
	} = usePOIDetails(currentPlaceId, currentPlaceData, language, onClose);

	// UI状態管理（useReducer版）
	const { state, dispatch, buttonRef, popupRef } =
		usePOIDialogState(currentPlaceId);

	// 価格レベルをメモ化
	const priceLevel = useMemo(() => {
		if (!aggregatedData) return null;
		// AggregatedVenueDataからprice_levelを抽出
		const priceData = {
			google: aggregatedData.google
				? { price_level: aggregatedData.google.price_level }
				: undefined,
			tripAdvisor: aggregatedData.tripAdvisor
				? {
						details: {
							price_level: aggregatedData.tripAdvisor.details?.price_level,
						},
					}
				: undefined,
			foursquare: aggregatedData.foursquare
				? {
						details: {
							price: aggregatedData.foursquare.details?.price,
						},
					}
				: undefined,
		};
		return getAggregatedPriceLevel(priceData);
	}, [aggregatedData]);

	if (!poiData) return null;

	// イメージギャラリーを開く
	const handleOpenImageGallery = () => {
		if (placeDetails?.photos && placeDetails.photos.length > 0) {
			dispatch({ type: "SHOW_GALLERY", show: true });
		}
	};

	// イメージギャラリーを閉じる
	const handleCloseImageGallery = () => {
		dispatch({ type: "SHOW_GALLERY", show: false });
	};

	// 営業時間の解析（言語設定とタイムゾーンを渡す）
	const openingHoursInfo = parseOpeningHours(
		placeDetails?.opening_hours?.weekday_text,
		language === "ja" ? "ja" : "en",
		new Date(),
		placeDetails?.utc_offset_minutes,
	);

	// 曜日ラベル（i18n対応、等幅フォント用の短縮形）
	const dayLabels = [
		t("poi.weekday.sundayShort", language),
		t("poi.weekday.mondayShort", language),
		t("poi.weekday.tuesdayShort", language),
		t("poi.weekday.wednesdayShort", language),
		t("poi.weekday.thursdayShort", language),
		t("poi.weekday.fridayShort", language),
		t("poi.weekday.saturdayShort", language),
	];

	const zoomTypes = placeDetails?.types ?? poiData.placeData?.types ?? null;
	const debugZoomLevel = getZoomForPlaceTypes(zoomTypes);
	const showZoomDebugInfo = isDevelopment();

	return (
		<div
			className={`absolute bottom-4 left-4 right-4 zidx-float-modal ${className}`}
		>
			<div className="bg-white border-t border-gray-200 shadow-lg rounded-t-lg w-full">
				<POIDialogHeader
					name={poiData.name}
					vicinity={placeDetails?.vicinity}
					orderNumber={poiData.orderNumber}
					onClose={onClose}
					onAddToItinerary={onAddToItinerary}
					availableDays={availableDays}
					showDaySelector={state.showDaySelector}
					popupPosition={state.popupPosition}
					buttonRef={buttonRef}
					popupRef={popupRef}
					dispatch={dispatch}
					placeId={poiData.placeId}
				/>

				<POIDialogBody
					loading={loading}
					error={error}
					placeDetails={placeDetails}
					aggregatedData={
						aggregatedData
							? {
									aggregatedRating: aggregatedData.aggregatedRating,
								}
							: null
					}
					unifiedReviews={unifiedReviews}
					priceLevel={priceLevel}
					openingHoursInfo={openingHoursInfo}
					dayLabels={dayLabels}
					cachedImages={cachedImages}
					currentPhotoIndex={state.currentPhotoIndex}
					imageLoading={imageLoading}
					showAllHours={state.showAllHours}
					showAllReviews={state.showAllReviews}
					dispatch={dispatch}
					placeName={poiData.name}
					onOpenImageGallery={handleOpenImageGallery}
					debugZoomLevel={debugZoomLevel}
					showZoomDebugInfo={showZoomDebugInfo}
					language={language}
				/>
			</div>

			{/* イメージギャラリーモーダル */}
			{placeDetails?.photos && placeDetails.photos.length > 0 && (
				<ImageGalleryModal
					isOpen={state.showImageGallery}
					onClose={handleCloseImageGallery}
					images={placeDetails.photos}
					placeName={poiData.name}
					initialIndex={state.currentPhotoIndex}
				/>
			)}
		</div>
	);
}
