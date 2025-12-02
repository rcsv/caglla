import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { validateClientEnvironment } from "@/lib/core/env-validation";
import { getUserLanguage } from "@/lib/utils/language";
import type { SupportedLanguage } from "@/lib/core/types";

// Google Maps APIの読み込み状態
let isOptionsSet = false;
let isLoaded = false;
let loadPromise: Promise<void> | null = null;

/**
 * Google Maps APIを一度だけ読み込む共通ローダー
 * 複数のコンポーネントから呼び出されても重複読み込みを防ぐ
 */
export async function loadGoogleMapsAPI(
	language?: SupportedLanguage,
): Promise<void> {
	// 既に読み込み済みの場合は即座に返す
	if (isLoaded) {
		return Promise.resolve();
	}

	// 読み込み中の場合は同じPromiseを返す
	if (loadPromise) {
		return loadPromise;
	}

	// 環境変数を検証して取得
	let apiKey: string;
	let userLanguage: string;

	try {
		// ここは警告が出るので、監視スクリプトを使わない
		const env = validateClientEnvironment({ suppressWarnings: true });
		apiKey =
			env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
			env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

		if (!apiKey) {
			throw new Error("Google Maps API key not found");
		}

		// 言語設定を取得（ユーザー設定または指定された言語）
		userLanguage = language || getUserLanguage() || "en";
	} catch (error) {
		// 開発環境での環境変数エラーの場合は、直接 process.env から取得を試行
		if (process.env.NODE_ENV !== "production") {
			console.warn(
				"Environment validation failed, falling back to direct process.env access:",
				error,
			);
		}

		apiKey =
			process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
			process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY ||
			"dev-fallback-key";

		if (!apiKey) {
			throw new Error("Google Maps API key not found");
		}

		// 言語設定を取得（ユーザー設定または指定された言語）
		userLanguage = language || getUserLanguage() || "en";
	}

	// setOptions は一度だけ呼び出す必要がある
	if (!isOptionsSet) {
		setOptions({
			key: apiKey,
			version: "weekly",
			language: userLanguage,
		});
		isOptionsSet = true;
	}

	// 必要なライブラリを読み込み
	loadPromise = Promise.all([
		importLibrary("maps"),
		importLibrary("places"),
		importLibrary("marker"),
		importLibrary("geometry"),
	])
		.then(() => {
			isLoaded = true;
		})
		.catch((error) => {
			// エラーが発生した場合は状態をリセット
			isLoaded = false;
			loadPromise = null;
			throw error;
		});

	return loadPromise;
}

/**
 * Google Maps APIが読み込み済みかどうかを確認
 */
export function isGoogleMapsLoaded(): boolean {
	return isLoaded && typeof window !== "undefined" && !!window.google;
}

/**
 * Google Maps APIの読み込み状態をリセット（テスト用）
 */
export function resetGoogleMapsLoader(): void {
	isOptionsSet = false;
	isLoaded = false;
	loadPromise = null;
}
