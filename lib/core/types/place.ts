/**
 * 場所・地理情報関連の型定義
 */

import type { FirestoreDate } from "./common";
import type { SupportedLanguage } from "./language";

// ============================================================================
// 場所・地理情報関連
// ============================================================================

/**
 * Google Places API から取得される場所データ
 */
export interface PlaceData {
	place_id: string;
	name: string;
	formatted_address: string;
	geometry: {
		location: {
			lat: number;
			lng: number;
		};
	};
	// Basic Data（無料）
	address_components?: Array<{
		long_name: string;
		short_name: string;
		types: string[];
	}>;
	vicinity?: string; // 周辺情報（短縮住所）
	business_status?: string; // 'OPERATIONAL' | 'CLOSED_TEMPORARILY' | 'CLOSED_PERMANENTLY'
	types?: string[];
	photos?: Array<{
		photo_reference: string;
		height: number;
		width: number;
	}>;
	url?: string; // Google MapsのURL
	icon?: string; // アイコンURL
	utc_offset_minutes?: number; // タイムゾーンオフセット（分単位、例: JST = 540）
	// Contact Data（$3.00/1,000件）
	formatted_phone_number?: string;
	international_phone_number?: string;
	website?: string;
	opening_hours?: {
		open_now?: boolean; // リアルタイム情報
		weekday_text?: string[];
	};
	// Atmosphere Data（$5.00/1,000件）
	rating?: number;
	user_ratings_total?: number;
	price_level?: number;
	editorial_summary?: {
		overview: string;
	};
	reviews?: Array<{
		author_name: string;
		rating: number;
		text: string;
		time: number;
		relative_time_description?: string;
	}>;
}

// ============================================================================
// Google Places API Cache
// ============================================================================

/**
 * Google Places API のキャッシュデータ
 * v2.0.0: 言語別キャッシュ対応
 */
export interface PlacesCache {
	// スキーマバージョン管理
	format_version: string;
	place_id: string;
	language: SupportedLanguage; // 言語コード（v2.0.0で追加）
	name: string;
	formatted_address: string;
	geometry: {
		location: {
			lat: number;
			lng: number;
		};
	};
	// Basic Data（無料）
	address_components?: Array<{
		long_name: string;
		short_name: string;
		types: string[];
	}>;
	vicinity?: string;
	business_status?: string;
	types?: string[];
	photos?: Array<{
		photo_reference: string;
		height: number;
		width: number;
	}>;
	url?: string;
	icon?: string;
	utc_offset_minutes?: number; // タイムゾーンオフセット（分単位、例: JST = 540）
	// Contact Data（$3.00/1,000件）
	formatted_phone_number?: string;
	international_phone_number?: string;
	website?: string;
	opening_hours?: {
		open_now?: boolean; // リアルタイム情報（キャッシュから除外推奨）
		weekday_text?: string[];
	};
	// Atmosphere Data（$5.00/1,000件）
	rating?: number;
	user_ratings_total?: number;
	price_level?: number;
	editorial_summary?: {
		overview: string;
	};
	reviews?: Array<{
		author_name: string;
		rating: number;
		text: string;
		time: number;
		relative_time_description?: string;
	}>;
	// メタデータ
	cached_at: FirestoreDate;
	last_accessed: FirestoreDate;
	access_count: number;
	// 永続的な欠損フラグ（本当に使う7個のフィールドのみ対象）
	missing_data_flags?: Record<string, boolean>;
}

/**
 * Firestore保存用（日時フィールドはDate）
 */
export interface PlacesCacheInput
	extends Omit<PlacesCache, "cached_at" | "last_accessed"> {
	cached_at: Date;
	last_accessed: Date;
}

/**
 * Firestore取得用（日時フィールドはFirestoreDate）
 */
export interface PlacesCacheDocument
	extends Omit<PlacesCache, "cached_at" | "last_accessed"> {
	cached_at: FirestoreDate;
	last_accessed: FirestoreDate;
}
