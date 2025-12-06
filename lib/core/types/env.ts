/**
 * 環境変数関連の型定義
 */

// ============================================================================
// 環境変数関連
// ============================================================================

/**
 * 必須環境変数
 */
export interface RequiredEnvVars {
	// Firebase Configuration
	NEXT_PUBLIC_FIREBASE_API_KEY: string;
	NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: string;
	NEXT_PUBLIC_FIREBASE_PROJECT_ID: string;
	NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: string;
	NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: string;
	NEXT_PUBLIC_FIREBASE_APP_ID: string;

	// Firebase Admin SDK Configuration
	FIREBASE_PROJECT_ID: string;
	FIREBASE_CLIENT_EMAIL: string;
	FIREBASE_PRIVATE_KEY: string;

	// Google Places API
	NEXT_PUBLIC_GOOGLE_PLACES_API_KEY: string;

	// Google Maps API
	NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: string;

	// Unsplash API
	NEXT_PUBLIC_UNSPLASH_ACCESS_KEY: string;
}

/**
 * オプション環境変数（AI関連）
 */
export interface AIServiceEnvVars {
	// Gemini API (for checklist longDescription generation)
	GEMINI_API_KEY?: string;
}

/**
 * オプション環境変数
 */
export interface OptionalEnvVars {
	NEXT_PUBLIC_GOOGLE_MAP_ID?: string;
	NEXT_PUBLIC_APP_URL?: string;
	UNSPLASH_ACCESS_KEY?: string;
	UNSPLASH_SECRET_KEY?: string;
	DB_HOST?: string;
	DB_USER?: string;
	DB_PASSWORD?: string;
	DB_NAME?: string;
	// External Venue APIs (サーバーサイド専用)
	TRIPADVISOR_API_KEY?: string;
	FOURSQUARE_API_KEY?: string;
	// SelectPdf API (サーバーサイド専用)
	SELECTPDF_API_KEY?: string;
	// Google API Keys (サーバーサイド専用 - サイト制限なし)
	GOOGLE_MAPS_API_KEY?: string;
	GOOGLE_PLACES_API_KEY?: string;
	// Gemini API (サーバーサイド専用 - チェックリストlongDescription生成用)
	GEMINI_API_KEY?: string;
}
