"use client";

import {
	getStorage,
	ref,
	getDownloadURL,
	uploadBytes,
	getMetadata,
} from "firebase/storage";
import app from "@/lib/firebase/client";

const storage = getStorage(app);

export interface ImageCacheOptions {
	width?: number;
	height?: number;
	quality?: number;
}

export interface CachedImageInfo {
	url: string;
	cached: boolean;
	cacheKey: string;
}

/**
 * Google Places APIの画像をFirebase Storageにキャッシュする
 */
export class ImageCacheManager {
	private static instance: ImageCacheManager;
	private cache: Map<string, string> = new Map();
	// 存在しない画像を記録（同じ画像への不要なリクエストを回避）
	private notFoundCache: Set<string> = new Set();

	static getInstance(): ImageCacheManager {
		if (!ImageCacheManager.instance) {
			ImageCacheManager.instance = new ImageCacheManager();
		}
		return ImageCacheManager.instance;
	}

	/**
	 * キャッシュキーを生成する
	 */
	private generateCacheKey(
		photoReference: string,
		options: ImageCacheOptions = {},
	): string {
		const { width = 300, height = 300, quality = 80 } = options;
		return `places-photos/${photoReference}_${width}x${height}_q${quality}.jpg`;
	}

	/**
	 * 画像がキャッシュされているかチェック
	 */
	async isCached(
		photoReference: string,
		options: ImageCacheOptions = {},
	): Promise<boolean> {
		const cacheKey = this.generateCacheKey(photoReference, options);

		try {
			const imageRef = ref(storage, cacheKey);
			await getMetadata(imageRef);
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * キャッシュされた画像のURLを取得
	 * 
	 * 新しいAPI Routeを使用して、404エラーを回避する
	 */
	async getCachedImageUrl(
		photoReference: string,
		options: ImageCacheOptions = {},
	): Promise<string | null> {
		const cacheKey = this.generateCacheKey(photoReference, options);

		// 既に「存在しない」ことが確認済みの場合は早期リターン
		if (this.notFoundCache.has(cacheKey)) {
			return null;
		}

		try {
			// まず、新しいAPI Routeに対してHEADリクエストを送って存在確認
			// HEADリクエストは404エラーをコンソールに表示しない
			const queryParams = new URLSearchParams();
			if (options.width) queryParams.set("width", options.width.toString());
			if (options.height) queryParams.set("height", options.height.toString());
			if (options.quality) queryParams.set("quality", options.quality.toString());

			const apiUrl = `/api/cached-place-image/${encodeURIComponent(photoReference)}?${queryParams.toString()}`;
			
			const headResponse = await fetch(apiUrl, { method: "HEAD" });

			// 204 (No Content) が返された場合は存在しない
			if (headResponse.status === 204) {
				this.notFoundCache.add(cacheKey);
				return null;
			}

			// 200が返された場合は存在する
			// API Routeが画像データを直接返すため、API RouteのURLをそのまま使用
			const url = apiUrl;

			// メモリキャッシュにも保存
			this.cache.set(cacheKey, url);
			// 「存在しない」キャッシュから削除（もしあれば）
			this.notFoundCache.delete(cacheKey);

			return url;
		} catch {
			// エラーが発生した場合は、「存在しない」として扱う
			// （ネットワークエラーなども含む）
			this.notFoundCache.add(cacheKey);
			// コンソールエラーは出力しない（404エラーのノイズを減らすため）
			return null;
		}
	}

	/**
	 * Google Places APIから画像を取得してFirebase Storageにキャッシュ
	 * 注意: このメソッドは、既にFirebase Storageに存在しないことが確認された後に呼ばれる
	 */
	async cacheAndGetImageUrl(
		photoReference: string,
		googlePhotoUrl: string,
		options: ImageCacheOptions = {},
	): Promise<string> {
		const cacheKey = this.generateCacheKey(photoReference, options);

		// メモリキャッシュから確認（念のため）
		if (this.cache.has(cacheKey)) {
			return this.cache.get(cacheKey)!;
		}

		// この時点でFirebase Storageには存在しないことが確定しているので、
		// 直接 Google Places API から取得してキャッシュする
		try {
			// Google Places APIから画像を取得
			const response = await fetch(googlePhotoUrl);
			if (!response.ok) {
				throw new Error(`Failed to fetch image: ${response.statusText}`);
			}

			const imageBlob = await response.blob();

			// Firebase Storageにアップロード
			const imageRef = ref(storage, cacheKey);
			await uploadBytes(imageRef, imageBlob, {
				contentType: "image/jpeg",
				customMetadata: {
					photoReference,
					originalUrl: googlePhotoUrl,
					cachedAt: new Date().toISOString(),
					...options,
				},
			});

			// アップロードされた画像のURLを取得
			const url = await getDownloadURL(imageRef);

			// メモリキャッシュに保存
			this.cache.set(cacheKey, url);
			// 「存在しない」キャッシュから削除（アップロード成功したため）
			this.notFoundCache.delete(cacheKey);

			return url;
		} catch (error) {
			console.error("Failed to cache image:", error);
			// キャッシュに失敗した場合は元のURLを返す
			return googlePhotoUrl;
		}
	}

	/**
	 * 画像を取得（キャッシュ優先）
	 */
	async getImageUrl(
		photoReference: string,
		googlePhotoUrl: string,
		options: ImageCacheOptions = {},
	): Promise<CachedImageInfo> {
		const cacheKey = this.generateCacheKey(photoReference, options);

		// メモリキャッシュから確認
		if (this.cache.has(cacheKey)) {
			return {
				url: this.cache.get(cacheKey)!,
				cached: true,
				cacheKey,
			};
		}

		// Firebase Storageから確認
		const cachedUrl = await this.getCachedImageUrl(photoReference, options);
		if (cachedUrl) {
			return {
				url: cachedUrl,
				cached: true,
				cacheKey,
			};
		}

		// キャッシュされていない場合はキャッシュしてから返す
		const url = await this.cacheAndGetImageUrl(
			photoReference,
			googlePhotoUrl,
			options,
		);
		return {
			url,
			cached: false,
			cacheKey,
		};
	}

	/**
	 * キャッシュをクリア（メモリのみ）
	 */
	clearMemoryCache(): void {
		this.cache.clear();
		this.notFoundCache.clear();
	}

	/**
	 * 特定の画像のキャッシュをクリア
	 */
	clearImageCache(
		photoReference: string,
		options: ImageCacheOptions = {},
	): void {
		const cacheKey = this.generateCacheKey(photoReference, options);
		this.cache.delete(cacheKey);
		this.notFoundCache.delete(cacheKey);
	}
}

// シングルトンインスタンスをエクスポート
export const imageCacheManager = ImageCacheManager.getInstance();

/**
 * 便利なヘルパー関数
 */
export const getCachedPlaceImage = async (
	photoReference: string,
	googlePhotoUrl: string,
	options: ImageCacheOptions = {},
): Promise<CachedImageInfo> => {
	return imageCacheManager.getImageUrl(photoReference, googlePhotoUrl, options);
};

/**
 * 複数の画像を並列でキャッシュ
 */
export const cacheMultipleImages = async (
	images: Array<{ photoReference: string; googlePhotoUrl: string }>,
	options: ImageCacheOptions = {},
): Promise<CachedImageInfo[]> => {
	const promises = images.map(({ photoReference, googlePhotoUrl }) =>
		imageCacheManager.getImageUrl(photoReference, googlePhotoUrl, options),
	);

	return Promise.all(promises);
};
