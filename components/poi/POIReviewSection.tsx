"use client";

import { t } from "@/lib/i18n";
import type { POIDialogAction } from "@/hooks/usePOIDialogState";

interface UnifiedReview {
	id: string;
	source: "google" | "tripadvisor" | "foursquare";
	author: string;
	rating?: number;
	text: string;
	date: string;
	helpful_votes?: number;
}

interface POIReviewSectionProps {
	unifiedReviews: UnifiedReview[];
	showAllReviews: boolean;
	dispatch: React.Dispatch<POIDialogAction>;
	language: string;
}

export function POIReviewSection({
	unifiedReviews,
	showAllReviews,
	dispatch,
	language,
}: POIReviewSectionProps) {
	if (unifiedReviews.length === 0) return null;

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<h4 className="text-xs font-semibold text-gray-700">
					{t("poi.reviewsAndTips")}
				</h4>
				{unifiedReviews.length > 3 && (
					<button
						type="button"
						onClick={() =>
							dispatch({
								type: "SHOW_REVIEWS",
								show: !showAllReviews,
							})
						}
						className="text-xs text-blue-600 hover:text-blue-700"
					>
						{showAllReviews
							? t("poi.showPartial")
							: t("poi.showAll").replace(
									"{count}",
									unifiedReviews.length.toString(),
								)}
					</button>
				)}
			</div>
			{(showAllReviews ? unifiedReviews : unifiedReviews.slice(0, 3)).map(
				(review) => (
					<div
						key={review.id}
						className="text-xs border-l-2 border-gray-200 pl-3 py-1"
					>
						<div className="flex items-center justify-between mb-1.5">
							<div className="flex items-center gap-1.5">
								<span className="font-medium text-gray-900">
									{review.author}
								</span>
								<span className="text-xs text-gray-400">
									{review.source === "google" && (
										<svg
											className="w-3 h-3"
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
									{review.source === "tripadvisor" && "🦉"}
									{review.source === "foursquare" && (
										<svg
											className="w-3 h-3"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
										>
											<title>Foursquare</title>
											<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
											<circle cx="12" cy="9" r="2" fill="currentColor" />
										</svg>
									)}
								</span>
							</div>
							{review.rating && (
								<div className="flex items-center space-x-0.5">
									<svg
										className="w-3 h-3 text-yellow-400"
										fill="currentColor"
										viewBox="0 0 20 20"
									>
										<title>{review.rating} stars</title>
										<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
									</svg>
									<span className="text-gray-600">{review.rating}</span>
								</div>
							)}
						</div>
						<p className="text-gray-700 line-clamp-2 leading-relaxed">
							{review.text}
						</p>
						{review.helpful_votes && review.helpful_votes > 0 && (
							<div className="mt-1 text-xs text-gray-500">
								👍{" "}
								{t("poi.helpfulVotes").replace(
									"{count}",
									review.helpful_votes.toString(),
								)}
							</div>
						)}
					</div>
				),
			)}
		</div>
	);
}

