// Google Timezone API integration utilities
import logger from "@/lib/core/logger";

// Google Timezone API configuration
function getApiKey(): string | undefined {
	if (typeof window === "undefined") {
		// サーバー側
		return (
			process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
			process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
		);
	}
	// クライアント側: Next.jsがビルド時に埋め込んだ値を使用
	return (
		typeof process !== "undefined" &&
		(process.env?.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
			process.env?.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY)
	);
}

const GOOGLE_TIMEZONE_API_URL =
	"https://maps.googleapis.com/maps/api/timezone/json";

export interface TimezoneResult {
	timeZoneId: string; // IANA timezone ID (例: "Asia/Tokyo")
	timeZoneName: string; // タイムゾーン名 (例: "Japan Standard Time")
	rawOffset: number; // UTCからのオフセット（秒）
	dstOffset: number; // サマータイムオフセット（秒）
}

export interface TimezoneResponse {
	status: string;
	timeZoneId?: string;
	timeZoneName?: string;
	rawOffset?: number;
	dstOffset?: number;
	errorMessage?: string;
}

export const timezoneApiHelpers = {
	/**
	 * 座標からタイムゾーン情報を取得
	 * @param latitude 緯度
	 * @param longitude 経度
	 * @param timestamp Unixタイムスタンプ（秒単位、デフォルトは現在時刻）
	 * @returns タイムゾーン情報
	 */
	async getTimezone(
		latitude: number,
		longitude: number,
		timestamp?: number,
	): Promise<TimezoneResult | null> {
		const apiKey = getApiKey();
		if (!apiKey) {
			logger.warn("Google Timezone API key is not configured");
			return null;
		}

		// timestampが指定されていない場合は現在時刻を使用
		const unixTimestamp = timestamp || Math.floor(Date.now() / 1000);

		try {
			const url = new URL(GOOGLE_TIMEZONE_API_URL);
			url.searchParams.set("location", `${latitude},${longitude}`);
			url.searchParams.set("timestamp", unixTimestamp.toString());
			url.searchParams.set("key", apiKey);

			const response = await fetch(url.toString());

			if (!response.ok) {
				logger.error(
					`Google Timezone API error: ${response.status} ${response.statusText}`,
				);
				return null;
			}

			const data: TimezoneResponse = await response.json();

			if (data.status !== "OK") {
				logger.warn(
					`Google Timezone API returned status: ${data.status}`,
					data.errorMessage,
				);
				return null;
			}

			if (
				!data.timeZoneId ||
				!data.timeZoneName ||
				data.rawOffset === undefined ||
				data.dstOffset === undefined
			) {
				logger.warn("Google Timezone API response missing required fields");
				return null;
			}

			return {
				timeZoneId: data.timeZoneId,
				timeZoneName: data.timeZoneName,
				rawOffset: data.rawOffset,
				dstOffset: data.dstOffset,
			};
		} catch (error) {
			logger.error("Error calling Google Timezone API:", error);
			return null;
		}
	},
};
