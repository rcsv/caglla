/**
 * Trip Publish Operations
 *
 * Tripの公開/非公開機能を提供します。
 */

import { makeAuthenticatedRequest } from "@/lib/api/helpers";
import type { Trip } from "@/lib/core/types";
import logger from "@/lib/core/logger";

/**
 * Tripを公開します
 *
 * @param tripSlug - TripスラッグまたはID
 * @param slug - 公開用のスラッグ（オプション、未指定の場合は自動生成）
 * @returns 更新されたTrip
 * @throws Error 公開に失敗した場合
 *
 * @example
 * ```typescript
 * const publishedTrip = await publishTrip('my-trip-slug', 'public-trip-slug')
 * ```
 */
export async function publishTrip(
	tripSlug: string,
	slug?: string,
): Promise<Trip> {
	try {
		logger.debug("Publishing trip", { tripSlug, slug });

		const body: Record<string, any> = {};
		if (slug) {
			body.slug = slug;
		}

		const response = await makeAuthenticatedRequest(
			`/api/trip/${tripSlug}/publish`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(body),
			},
		);

		if (!response.ok) {
			const error = await response
				.json()
				.catch(() => ({ error: "Unknown error" }));
			throw new Error(
				error.error || `Failed to publish trip: ${response.status}`,
			);
		}

		const result = await response.json();
		logger.debug("Trip published successfully", {
			tripId: result.trip?.id || tripSlug,
		});
		return result.trip;
	} catch (error) {
		logger.error("Error publishing trip:", error);
		throw error;
	}
}

/**
 * Tripを非公開にします
 *
 * @param tripSlug - TripスラッグまたはID
 * @returns 更新されたTrip
 * @throws Error 非公開化に失敗した場合
 *
 * @example
 * ```typescript
 * const unpublishedTrip = await unpublishTrip('my-trip-slug')
 * ```
 */
export async function unpublishTrip(tripSlug: string): Promise<Trip> {
	try {
		logger.debug("Unpublishing trip", { tripSlug });

		const response = await makeAuthenticatedRequest(
			`/api/trip/${tripSlug}/publish`,
			{
				method: "DELETE",
			},
		);

		if (!response.ok) {
			const error = await response
				.json()
				.catch(() => ({ error: "Unknown error" }));
			throw new Error(
				error.error || `Failed to unpublish trip: ${response.status}`,
			);
		}

		const result = await response.json();
		logger.debug("Trip unpublished successfully", {
			tripId: result.trip?.id || tripSlug,
		});
		return result.trip;
	} catch (error) {
		logger.error("Error unpublishing trip:", error);
		throw error;
	}
}
