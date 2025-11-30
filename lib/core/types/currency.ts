/**
 * 通貨・タイムゾーン・コスト関連の型定義
 */

import type { FirestoreDate } from "./common";
import type { PlaceData } from "./place";

// ============================================================================
// 通貨・コスト関連
// ============================================================================

/**
 * 通貨情報
 */
export interface CurrencyInfo {
	code: string;
	name: string;
	symbol: string;
	country: string;
}

/**
 * コストサマリー
 */
export interface CostSummary {
	currency: string;
	total: number;
	count: number;
	currencyInfo: {
		code: string;
		name: string;
		symbol: string;
		country: string;
	};
}

/**
 * Tripコストサマリー
 */
export interface TripCostSummary {
	totalCosts: CostSummary[];
	hasCosts: boolean;
}

// ============================================================================
// タイムゾーン関連
// ============================================================================

/**
 * タイムゾーン情報
 */
export interface TimezoneInfo {
	timezone: string;
	offset: number; // UTCからのオフセット（分）
	city: string;
	country: string;
}

/**
 * タイムゾーン推定失敗ログ
 */
export interface TimezoneFailureLog {
	id: string;
	place_data: PlaceData;
	failure_reason:
		| "city_not_found"
		| "country_not_found"
		| "address_parse_failed";
	detected_city?: string;
	detected_country?: string;
	formatted_address: string;
	created_at: FirestoreDate;
	user_id?: string;
	status: "pending" | "processed" | "ignored";
}

/**
 * バッチ更新用のタイムゾーンマッピング
 */
export interface TimezoneMappingUpdate {
	city_name: string;
	timezone: string;
	confidence: "high" | "medium" | "low";
	source: "user_feedback" | "batch_analysis" | "manual";
	created_at: FirestoreDate;
}

/**
 * 通貨推定失敗ログ
 */
export interface CurrencyFailureLog {
	id: string;
	place_data: PlaceData;
	failure_reason:
		| "country_not_found"
		| "city_not_found"
		| "address_parse_failed";
	detected_city?: string;
	detected_country?: string;
	formatted_address: string;
	created_at: FirestoreDate;
	user_id?: string;
	status: "pending" | "processed" | "ignored";
}

/**
 * バッチ更新用の通貨マッピング
 */
export interface CurrencyMappingUpdate {
	city_name: string;
	currency: string;
	confidence: "high" | "medium" | "low";
	source: "user_feedback" | "batch_analysis" | "manual";
	created_at: FirestoreDate;
}
