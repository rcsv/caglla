"use client";

import { t } from "@/lib/i18n";

interface AggregatedRating {
	averageRating: number;
	totalReviews: number;
	sources: Array<{
		source: string;
		rating: number;
		reviewCount: number;
	}>;
}

interface POIPriceSectionProps {
	aggregatedRating?: AggregatedRating;
	placeRating?: number;
	placeReviewCount?: number;
	priceLevel: number | null;
	language: string;
}

export function POIPriceSection({
	aggregatedRating,
	placeRating,
	placeReviewCount,
	priceLevel,
	language,
}: POIPriceSectionProps) {
	return (
		<div className="flex items-center flex-wrap gap-4">
			{/* 統合された評価情報 */}
			{aggregatedRating ? (
				<div className="flex items-center space-x-1.5">
					<div className="flex items-center">
						{[...Array(5)].map((_, i) => (
							<svg
								key={i}
								className={`w-3.5 h-3.5 ${
									i < Math.floor(aggregatedRating.averageRating)
										? "text-yellow-400"
										: "text-gray-300"
								}`}
								fill="currentColor"
								viewBox="0 0 20 20"
							>
								<title>{i + 1} star</title>
								<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
							</svg>
						))}
					</div>
					<span className="text-gray-700 font-medium">
						{aggregatedRating.averageRating.toFixed(1)}
					</span>
					<span className="text-gray-500 text-xs">
						(
						{t("poi.reviewCount", language).replace(
							"{count}",
							aggregatedRating.totalReviews.toLocaleString(),
						)}
						)
					</span>
					<div className="flex items-center gap-1 ml-1">
						{aggregatedRating.sources.map((source, idx) => (
							<span
								key={idx}
								className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600"
								title={`${source.source}: ${source.rating} ${t("poi.reviewCount", language).replace("{count}", source.reviewCount.toString())}`}
							>
								{source.source === "google" && (
									<svg
										className="w-3.5 h-3.5"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
									>
										<title>Google</title>
										<path d="M3.5 6.5l5.4-2.1 5.2 2.1 5.4-2.1v12.9l-5.4 2.1-5.2-2.1-5.4 2.1V6.5z" />
										<path d="M8.9 4.4v12.9" />
										<path d="M14.1 6.5v12.9" />
									</svg>
								)}
								{source.source === "tripadvisor" && "🦉"}
								{source.source === "foursquare" && (
									<svg
										className="w-3.5 h-3.5"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
									>
										<title>Foursquare</title>
										<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
										<circle
											cx="12"
											cy="9"
											r="2"
											fill="currentColor"
										/>
									</svg>
								)}
							</span>
						))}
					</div>
				</div>
			) : (
				placeRating && (
					<div className="flex items-center space-x-1.5">
						<div className="flex items-center">
							{[...Array(5)].map((_, i) => (
								<svg
									key={i}
									className={`w-3.5 h-3.5 ${
										i < Math.floor(placeRating)
											? "text-yellow-400"
											: "text-gray-300"
									}`}
									fill="currentColor"
									viewBox="0 0 20 20"
								>
									<title>{i + 1} star</title>
									<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
								</svg>
							))}
						</div>
						<span className="text-gray-700 font-medium">{placeRating}</span>
						{placeReviewCount && (
							<span className="text-gray-500 text-xs">
								(
								{t("poi.reviewCount", language).replace(
									"{count}",
									placeReviewCount.toLocaleString(),
								)}
								)
							</span>
						)}
					</div>
				)
			)}

			{/* 統合された価格情報 */}
			{priceLevel && (
				<span className="text-gray-700 font-medium">
					{"¥".repeat(priceLevel)}
				</span>
			)}
		</div>
	);
}

