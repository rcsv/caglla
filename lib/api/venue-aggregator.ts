/**
 * Venue Information Aggregator
 * Google Places、TripAdvisor、Foursquareのデータを統合
 *
 * ⚠️ サーバーサイド専用 - クライアント側からは使用しないこと
 * クライアント側からは /api/venue/aggregate エンドポイント経由で使用
 */

import logger from "@/lib/core/logger";
import { tripAdvisorAPI } from "./tripadvisor";
import { foursquareAPI } from "./foursquare";
import type { PlaceData } from "@/lib/core/types";
import type {
	TripAdvisorLocation,
	TripAdvisorReview,
	TripAdvisorPhoto,
} from "./tripadvisor";
import type {
	FoursquareLocation,
	FoursquareTip,
	FoursquarePhoto,
} from "./foursquare";

/**
 * 統合されたVenue情報
 */
export interface AggregatedVenueData {
	// Google Places (基本情報)
	google: PlaceData | null;

	// TripAdvisor (レビュー・評価重視)
	tripAdvisor: {
		details: TripAdvisorLocation | null;
		reviews: TripAdvisorReview[];
		photos: TripAdvisorPhoto[];
	};

	// Foursquare (Tips・写真重視)
	foursquare: {
		details: FoursquareLocation | null;
		tips: FoursquareTip[];
		photos: FoursquarePhoto[];
	};

	// 統合評価情報
	aggregatedRating?: {
		averageRating: number;
		totalReviews: number;
		sources: Array<{
			source: "google" | "tripadvisor" | "foursquare";
			rating: number;
			reviewCount: number;
		}>;
	};

	// 統合写真情報
	aggregatedPhotos?: Array<{
		url: string;
		source: "google" | "tripadvisor" | "foursquare";
		width?: number;
		height?: number;
	}>;
}

/**
 * レビュー・Tipの統合表示用
 */
export interface UnifiedReview {
	id: string;
	source: "google" | "tripadvisor" | "foursquare";
	author: string;
	rating?: number;
	text: string;
	date: string;
	helpful_votes?: number;
	url?: string;
}

class VenueAggregator {
	/**
	 * Google PlaceデータからTripAdvisorとFoursquareの情報を取得して統合
	 */
	async getAggregatedVenueData(
		googlePlaceData: PlaceData,
	): Promise<AggregatedVenueData> {
		const { name, geometry } = googlePlaceData;
		const { lat, lng } = geometry.location;

		logger.debug("🔍 Venue Aggregator: データ取得開始", { name, lat, lng });

		try {
			// TripAdvisorとFoursquareのデータを並行取得
			const [tripAdvisorData, foursquareData] = await Promise.all([
				tripAdvisorAPI.getDetailsByGooglePlace(name, lat, lng),
				foursquareAPI.getDetailsByGooglePlace(name, lat, lng),
			]);

			// 評価情報を統合
			const aggregatedRating = this.calculateAggregatedRating(
				googlePlaceData,
				tripAdvisorData.details,
				foursquareData.details,
			);

			// 写真情報を統合
			const aggregatedPhotos = this.aggregatePhotos(
				googlePlaceData,
				tripAdvisorData.photos,
				foursquareData.photos,
			);

			const result: AggregatedVenueData = {
				google: googlePlaceData,
				tripAdvisor: tripAdvisorData,
				foursquare: foursquareData,
				aggregatedRating,
				aggregatedPhotos,
			};

			logger.debug("✅ Venue Aggregator: データ統合完了", {
				hasTripAdvisor: !!tripAdvisorData.details,
				hasFoursquare: !!foursquareData.details,
				totalReviews: aggregatedRating?.totalReviews || 0,
				totalPhotos: aggregatedPhotos?.length || 0,
			});

			return result;
		} catch (error) {
			logger.error("❌ Venue Aggregator: データ取得エラー", error);

			// エラー時はGoogle Placesデータのみ返す
			return {
				google: googlePlaceData,
				tripAdvisor: { details: null, reviews: [], photos: [] },
				foursquare: { details: null, tips: [], photos: [] },
			};
		}
	}

	/**
	 * 複数ソースの評価を統合計算
	 */
	private calculateAggregatedRating(
		googleData: PlaceData | null,
		tripAdvisorData: TripAdvisorLocation | null,
		foursquareData: FoursquareLocation | null,
	) {
		const sources: Array<{
			source: "google" | "tripadvisor" | "foursquare";
			rating: number;
			reviewCount: number;
		}> = [];

		// Google Places
		if (googleData?.rating && googleData?.user_ratings_total) {
			sources.push({
				source: "google",
				rating: googleData.rating,
				reviewCount: googleData.user_ratings_total,
			});
		}

		// TripAdvisor (評価は文字列なので数値に変換)
		if (tripAdvisorData?.rating && tripAdvisorData?.num_reviews) {
			sources.push({
				source: "tripadvisor",
				rating: parseFloat(tripAdvisorData.rating),
				reviewCount: parseInt(tripAdvisorData.num_reviews, 10),
			});
		}

		// Foursquare (10点満点を5点満点に変換)
		if (foursquareData?.rating && foursquareData?.stats?.total_ratings) {
			sources.push({
				source: "foursquare",
				rating: foursquareData.rating / 2, // 10点満点→5点満点
				reviewCount: foursquareData.stats.total_ratings,
			});
		}

		if (sources.length === 0) {
			return undefined;
		}

		// 加重平均を計算（レビュー数で重み付け）
		const totalReviews = sources.reduce((sum, s) => sum + s.reviewCount, 0);
		const weightedRating =
			sources.reduce((sum, s) => sum + s.rating * s.reviewCount, 0) /
			totalReviews;

		return {
			averageRating: Math.round(weightedRating * 10) / 10, // 小数第1位まで
			totalReviews,
			sources,
		};
	}

	/**
	 * 複数ソースの写真を統合
	 */
	private aggregatePhotos(
		googleData: PlaceData | null,
		tripAdvisorPhotos: TripAdvisorPhoto[],
		foursquarePhotos: FoursquarePhoto[],
	): Array<{
		url: string;
		source: "google" | "tripadvisor" | "foursquare";
		width?: number;
		height?: number;
	}> {
		const photos: Array<{
			url: string;
			source: "google" | "tripadvisor" | "foursquare";
			width?: number;
			height?: number;
		}> = [];

		// Google Photos (既存のplacesApiHelpers経由で取得する想定)
		// ここではURLのみを含める
		if (googleData?.photos) {
			googleData.photos.slice(0, 5).forEach((photo) => {
				photos.push({
					url: photo.photo_reference, // 実際にはplacesApiHelpers.getPhotoUrl()で変換
					source: "google",
					width: photo.width,
					height: photo.height,
				});
			});
		}

		// TripAdvisor Photos
		tripAdvisorPhotos.slice(0, 5).forEach((photo) => {
			const imageUrl =
				photo.images.large?.url ||
				photo.images.medium?.url ||
				photo.images.small?.url;
			if (imageUrl) {
				photos.push({
					url: imageUrl,
					source: "tripadvisor",
				});
			}
		});

		// Foursquare Photos
		foursquarePhotos.slice(0, 5).forEach((photo) => {
			photos.push({
				url: foursquareAPI.getPhotoUrl(photo, "medium"),
				source: "foursquare",
				width: photo.width,
				height: photo.height,
			});
		});

		return photos;
	}

	/**
	 * レビューとTipsを統一フォーマットに変換
	 */
	unifyReviews(aggregatedData: AggregatedVenueData): UnifiedReview[] {
		const reviews: UnifiedReview[] = [];

		// Google Reviews
		if (aggregatedData.google?.reviews) {
			aggregatedData.google.reviews.forEach((review) => {
				reviews.push({
					id: `google-${review.time}`,
					source: "google",
					author: review.author_name,
					rating: review.rating,
					text: review.text,
					date: new Date(review.time * 1000).toISOString(),
				});
			});
		}

		// TripAdvisor Reviews
		aggregatedData.tripAdvisor.reviews.forEach((review) => {
			reviews.push({
				id: `tripadvisor-${review.id}`,
				source: "tripadvisor",
				author: review.user.username,
				rating: review.rating,
				text: review.text,
				date: review.published_date,
				helpful_votes: review.helpful_votes,
				url: review.url,
			});
		});

		// Foursquare Tips
		aggregatedData.foursquare.tips.forEach((tip) => {
			reviews.push({
				id: `foursquare-${tip.id}`,
				source: "foursquare",
				author: "Foursquare User", // Foursquare Tipsには著者情報がない
				text: tip.text,
				date: tip.created_at,
				helpful_votes: tip.agree_count,
			});
		});

		// 日付順にソート（新しい順）
		return reviews.sort(
			(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
		);
	}

	/**
	 * 価格情報を統合（複数ソースから最も信頼できる情報を選択）
	 */
	getAggregatedPriceLevel(aggregatedData: AggregatedVenueData): {
		priceLevel: number;
		source: "google" | "tripadvisor" | "foursquare";
	} | null {
		// Google Places の price_level を優先
		if (
			aggregatedData.google?.price_level !== undefined &&
			aggregatedData.google.price_level >= 0
		) {
			return {
				priceLevel: aggregatedData.google.price_level,
				source: "google",
			};
		}

		// TripAdvisor の price_level を次に優先
		if (aggregatedData.tripAdvisor.details?.price_level) {
			const priceMap: Record<string, number> = {
				$: 1,
				"$$ - $$$": 2,
				$$$$: 3,
			};
			const priceLevel =
				priceMap[aggregatedData.tripAdvisor.details.price_level];
			if (priceLevel) {
				return { priceLevel, source: "tripadvisor" };
			}
		}

		// Foursquare の price を使用（1-4スケール）
		if (aggregatedData.foursquare.details?.price) {
			return {
				priceLevel: aggregatedData.foursquare.details.price,
				source: "foursquare",
			};
		}

		return null;
	}

	/**
	 * 営業時間情報を統合
	 */
	getAggregatedOpeningHours(aggregatedData: AggregatedVenueData): {
		weekdayText?: string[];
		openNow?: boolean;
		source: "google" | "tripadvisor" | "foursquare";
	} | null {
		// Google Places の営業時間を優先
		if (aggregatedData.google?.opening_hours) {
			return {
				weekdayText: aggregatedData.google.opening_hours.weekday_text,
				openNow: aggregatedData.google.opening_hours.open_now,
				source: "google",
			};
		}

		// TripAdvisor の営業時間
		if (aggregatedData.tripAdvisor.details?.hours?.weekday_text) {
			return {
				weekdayText: aggregatedData.tripAdvisor.details.hours.weekday_text,
				source: "tripadvisor",
			};
		}

		// Foursquare の営業時間
		if (aggregatedData.foursquare.details?.hours) {
			const hours = aggregatedData.foursquare.details.hours;
			return {
				weekdayText: hours.display ? [hours.display] : undefined,
				openNow: hours.open_now,
				source: "foursquare",
			};
		}

		return null;
	}
}

// シングルトンインスタンス
export const venueAggregator = new VenueAggregator();
