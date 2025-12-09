import { useState, useEffect, useCallback, useRef } from "react";
import logger from "@/lib/core/logger";
import { placesApiHelpers } from "@/lib/api/google/places";
import { getCachedPlace, placesCacheManager } from "@/lib/travel/places-cache";
import {
	getCachedPlaceImage,
	CachedImageInfo,
} from "@/lib/storage/image-cache";
import type {
	AggregatedVenueData,
	UnifiedReview,
} from "@/lib/api/venue-aggregator";
import type { PlaceData, SupportedLanguage } from "@/lib/core/types";

const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 1週間（7日）

interface POICache {
	placeDetails: any;
	aggregatedData: AggregatedVenueData | null;
	unifiedReviews: UnifiedReview[];
	timestamp: number;
}

export function usePOIDetails(
	placeId: string | undefined,
	placeData: PlaceData | undefined,
	language: SupportedLanguage,
	onClose?: () => void,
) {
	const [placeDetails, setPlaceDetails] = useState<any>(null);
	const [aggregatedData, setAggregatedData] =
		useState<AggregatedVenueData | null>(null);
	const [unifiedReviews, setUnifiedReviews] = useState<UnifiedReview[]>([]);
	const [cachedImages, setCachedImages] = useState<CachedImageInfo[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [imageLoading, setImageLoading] = useState(false);

	// POIキャッシュ（TTL付き）
	const poiCacheRef = useRef(new Map<string, POICache>());

	// AbortControllerのref（race condition対策）
	const abortControllerRef = useRef<AbortController | null>(null);

	const cacheImages = useCallback(async (photos: any[]) => {
		if (!photos || photos.length === 0) return;

		setImageLoading(true);
		try {
			const imagePromises = photos.map(async (photo) => {
				const googlePhotoUrl = placesApiHelpers.getPhotoUrl(
					photo.photo_reference,
					300,
				);
				return await getCachedPlaceImage(
					photo.photo_reference,
					googlePhotoUrl,
					{
						width: 300,
						height: 300,
						quality: 80,
					},
				);
			});

			const cachedImageResults = await Promise.all(imagePromises);
			setCachedImages(cachedImageResults);

			logger.debug("POIDialog: 画像キャッシュ完了", {
				total: cachedImageResults.length,
				cached: cachedImageResults.filter((img) => img.cached).length,
				new: cachedImageResults.filter((img) => !img.cached).length,
			});
		} catch (error) {
			logger.error("画像キャッシュエラー", error);
		} finally {
			setImageLoading(false);
		}
	}, []);

	const fetchPlaceDetails = useCallback(async () => {
		if (!placeId) return;

		// 既存のリクエストをキャンセル（race condition対策）
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
		}

		// 新しいAbortControllerを作成
		const abortController = new AbortController();
		abortControllerRef.current = abortController;

		// TTLキャッシュチェック（5分間有効）
		const cached = poiCacheRef.current.get(placeId);
		if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
			// abortチェック
			if (abortController.signal.aborted) return;

			logger.debug("✅ Using TTL cached POI data", { placeId });
			setPlaceDetails(cached.placeDetails);
			setAggregatedData(cached.aggregatedData);
			setUnifiedReviews(cached.unifiedReviews);
			// キャッシュされた画像も復元
			if (
				cached.placeDetails?.photos &&
				cached.placeDetails.photos.length > 0
			) {
				await cacheImages(cached.placeDetails.photos);
				// abortチェック
				if (abortController.signal.aborted) return;
			}
			return;
		}

		// abortチェック
		if (abortController.signal.aborted) return;

		setLoading(true);
		setError(null);

		try {
			// abortチェック
			if (abortController.signal.aborted) return;

			// placeDataがあり、vicinityが存在する場合はそれを使用
			if (placeData) {
				if (placeData.vicinity) {
					// abortチェック
					if (abortController.signal.aborted) return;

					logger.debug("✅ Using place_data with vicinity from Itinerary");
					setPlaceDetails(placeData);

					// placeDataのreviewsをunifiedReviews形式に変換
					const reviews: UnifiedReview[] = [];
					if (placeData.reviews && Array.isArray(placeData.reviews)) {
						for (const review of placeData.reviews) {
							reviews.push({
								id: `google-${review.author_name}-${review.time}`,
								source: "google" as const,
								author: review.author_name || "Anonymous",
								rating: review.rating || 0,
								text: review.text || "",
								date: review.relative_time_description || "",
								helpful_votes: undefined,
							});
						}
						setUnifiedReviews(reviews);
						logger.debug("✅ Google reviews converted from placeData", {
							count: reviews.length,
						});
					}

					setLoading(false);
					return;
				}

				// abortチェック
				if (abortController.signal.aborted) return;

				// vicinityがない場合はPlacesCacheをチェック
				logger.debug("⚠️ place_data missing vicinity, checking PlacesCache...");
				const cachedData = await getCachedPlace(placeId);

				// abortチェック
				if (abortController.signal.aborted) return;

				if (cachedData && cachedData.vicinity) {
					logger.debug("✅ Found vicinity in PlacesCache, merging data");
					const mergedData = {
						...placeData,
						vicinity: cachedData.vicinity,
						business_status: cachedData.business_status,
						url: cachedData.url,
						icon: cachedData.icon,
					};
					setPlaceDetails(mergedData);

					// マージされたデータのreviewsをunifiedReviews形式に変換
					const reviews: UnifiedReview[] = [];
					if (mergedData.reviews && Array.isArray(mergedData.reviews)) {
						for (const review of mergedData.reviews) {
							reviews.push({
								id: `google-${review.author_name}-${review.time}`,
								source: "google" as const,
								author: review.author_name || "Anonymous",
								rating: review.rating || 0,
								text: review.text || "",
								date: review.relative_time_description || "",
								helpful_votes: undefined,
							});
						}
						setUnifiedReviews(reviews);
						logger.debug("✅ Google reviews converted from merged data", {
							count: reviews.length,
						});
					}

					setLoading(false);
					return;
				}
			}

			// abortチェック
			if (abortController.signal.aborted) return;

			logger.debug("🔍 Checking PlacesCache for place_id:", placeId);

			const cachedData = await getCachedPlace(placeId);

			// abortチェック
			if (abortController.signal.aborted) return;

			if (cachedData) {
				logger.debug("✅ Found cached data:", cachedData.name);
				setPlaceDetails(cachedData);

				// PlacesCacheのreviewsをunifiedReviews形式に変換
				const reviews: UnifiedReview[] = [];
				if (cachedData.reviews && Array.isArray(cachedData.reviews)) {
					for (const review of cachedData.reviews) {
						reviews.push({
							id: `google-${review.author_name}-${review.time}`,
							source: "google" as const,
							author: review.author_name || "Anonymous",
							rating: review.rating || 0,
							text: review.text || "",
							date: review.relative_time_description || "",
							helpful_votes: undefined,
						});
					}
					setUnifiedReviews(reviews);
					logger.debug("✅ Google reviews converted from cache", {
						count: reviews.length,
					});
				}

				setLoading(false);
				return;
			}

			logger.debug("❌ No cached data found, calling Google Places API...");

			// POIDialogで必要なフィールドを明示的に要求
			const requiredFields = [
				"price_level",
				"rating",
				"user_ratings_total",
				"editorial_summary",
				"reviews",
				"opening_hours",
				"website",
				"formatted_phone_number",
			];

			const details = await placesApiHelpers.getPlaceDetails(
				placeId,
				language,
				requiredFields,
			);

			// abortチェック
			if (abortController.signal.aborted) return;

			setPlaceDetails(details);

			logger.debug("💾 Saving to PlacesCache...");
			await placesCacheManager.fetchAndCachePlace(placeId, language);

			// abortチェック
			if (abortController.signal.aborted) return;

			logger.debug("✅ Data saved to PlacesCache");

			if (details?.photos && details.photos.length > 0) {
				await cacheImages(details.photos);
				// abortチェック
				if (abortController.signal.aborted) return;
			}

			// TripAdvisor/Foursquare集約は無効化（コスト削減・エラー回避）
			// Google Places APIのレビューのみ使用
			const aggregated: AggregatedVenueData | null = null;
			const reviews: UnifiedReview[] = [];

			// Google Places APIのレビューをunifiedReviews形式に変換
			if (details?.reviews && Array.isArray(details.reviews)) {
				for (const review of details.reviews) {
					reviews.push({
						id: `google-${review.author_name}-${review.time}`,
						source: "google" as const,
						author: review.author_name || "Anonymous",
						rating: review.rating || 0,
						text: review.text || "",
						date: review.relative_time_description || "",
						helpful_votes: undefined,
					});
				}
				logger.debug("✅ Google reviews converted to unified format", {
					count: reviews.length,
				});
			}

			logger.debug(
				"⏭️ Skipping external venue data (TripAdvisor/Foursquare disabled)",
			);
			setAggregatedData(null);
			setUnifiedReviews(reviews);

			// キャッシュに保存
			poiCacheRef.current.set(placeId, {
				placeDetails: details,
				aggregatedData: aggregated,
				unifiedReviews: reviews,
				timestamp: Date.now(),
			});
			logger.debug("💾 POI data cached", { placeId });
		} catch (err) {
			// AbortErrorは無視（意図的なキャンセル）
			if (err instanceof Error && err.name === "AbortError") {
				return;
			}
			// abortされていない場合のみエラーを設定
			if (!abortController.signal.aborted) {
				logger.error("POI詳細取得エラー", err);
				setError("詳細情報の取得に失敗しました");
				setTimeout(() => {
					onClose?.();
				}, 100);
			}
		} finally {
			// abortされていない場合のみloadingをfalseに
			if (!abortController.signal.aborted) {
				setLoading(false);
			}
		}
	}, [placeId, placeData, language, cacheImages, onClose]);

	useEffect(() => {
		if (!placeId) return;

		// 新しいPOIを取得する前に旧データをリセット
		setPlaceDetails(null);
		setAggregatedData(null);
		setUnifiedReviews([]);
		setCachedImages([]);
		setError(null);

		void fetchPlaceDetails();

		// クリーンアップ: コンポーネントアンマウント時またはplaceId変更時にリクエストをキャンセル
		return () => {
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}
		};
	}, [placeId, fetchPlaceDetails]);

	return {
		placeDetails,
		aggregatedData,
		unifiedReviews,
		cachedImages,
		loading,
		error,
		imageLoading,
	};
}
