// Distance Matrix API integration utilities
import type {
	DistanceMatrixResult,
	DistanceMatrixResponse,
} from "@/lib/core/types";
import logger from "@/lib/core/logger";
import { t } from "@/lib/i18n";

// Re-export types for backward compatibility
export type { DistanceMatrixResult, DistanceMatrixResponse };

export const distanceApiHelpers = {
	// 2つの地点間の距離と時間を計算する
	async calculateDistance(
		origin: string | { lat: number; lng: number },
		destination: string | { lat: number; lng: number },
		mode: "driving" | "walking" | "bicycling" | "transit" = "driving",
	): Promise<DistanceMatrixResult | null> {
		try {
			// 座標の場合は文字列に変換
			const originStr =
				typeof origin === "string" ? origin : `${origin.lat},${origin.lng}`;

			const destinationStr =
				typeof destination === "string"
					? destination
					: `${destination.lat},${destination.lng}`;

			const response = await fetch("/api/distance", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					origins: originStr,
					destinations: destinationStr,
					mode,
				}),
				signal: AbortSignal.timeout(10000), // 10秒でタイムアウト
			});

			if (!response.ok) {
				throw new Error(`Distance API error: ${response.status}`);
			}

			const data: DistanceMatrixResponse = await response.json();

			if (data.status !== "OK" || !data.rows[0]?.elements[0]) {
				return null;
			}

			const element = data.rows[0].elements[0];

			if (element.status !== "OK") {
				return null;
			}

			return element;
		} catch (error) {
			logger.error("Error calculating distance:", error);
			return null;
		}
	},

	// 距離をkmに変換
	metersToKm(meters: number): number {
		return Math.round((meters / 1000) * 10) / 10;
	},

	// 時間を分に変換
	secondsToMinutes(seconds: number): number {
		return Math.round(seconds / 60);
	},

	// 時間を時間単位に変換（5時間以上は時間表示、未満は分表示）
	formatDuration(seconds: number): string {
		const minutes = Math.round(seconds / 60);
		const hours = Math.floor(minutes / 60);
		const remainingMinutes = minutes % 60;

		if (hours >= 1) {
			if (remainingMinutes === 0) {
				return `${hours}${t("unit.hour")}`;
			} else {
				return `${hours}${t("unit.hour")}${remainingMinutes}${t("unit.minute")}`;
			}
		} else {
			return `${minutes}${t("unit.minute")}`;
		}
	},

	// 距離と時間のテキストをフォーマット
	formatDistanceAndDuration(distance: DistanceMatrixResult): string {
		const km = this.metersToKm(distance.distance.value);
		const duration = this.formatDuration(distance.duration.value);

		return `${km}km / ${duration}`;
	},

	// 複数の地点間の総距離をバッチ計算
	async calculateTotalDistance(
		places: Array<{
			geometry?: { location: { lat: number; lng: number } };
			name: string;
		}>,
		mode: "driving" | "walking" | "bicycling" | "transit" = "driving",
	): Promise<{
		totalDistance: { meters: number; kilometers: number; text: string };
		totalDuration: {
			seconds: number;
			minutes: number;
			hours: number;
			text: string;
		};
		segments: Array<{ from: string; to: string; distance: any; duration: any }>;
		segmentCount: number;
	} | null> {
		try {
			const response = await fetch("/api/distance/batch", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					places,
					mode,
				}),
				signal: AbortSignal.timeout(15000), // 15秒でタイムアウト（バッチ処理は時間がかかるため）
			});

		if (!response.ok) {
			let errorData: any = {};
			try {
				errorData = await response.json();
			} catch {
				// JSONパースエラーの場合は空オブジェクト
			}
			
			logger.error("Batch distance API error:", {
				status: response.status,
				statusText: response.statusText,
				error: errorData.error || errorData.message || "Unknown error",
				errorData: errorData,
			});
			return null;
		}

			const data = await response.json();

			// エラーレスポンスの場合はnullを返す
			if (data.error) {
				logger.error("Batch distance calculation error:", data.error);
				return null;
			}

			return data;
	} catch (error) {
		logger.error("Error calculating total distance:", {
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		});
		return null;
	}
	},
};
