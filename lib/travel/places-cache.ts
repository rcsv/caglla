/**
 * Google Places API Cache Management
 *
 * FirestoreにGoogle Places APIの結果をキャッシュし、
 * APIコールを削減してコストとパフォーマンスを最適化します。
 */

import {
	getFirestore,
	doc,
	getDoc,
	setDoc,
	updateDoc,
	collection,
	query,
	where,
	getDocs,
	orderBy,
	limit,
	writeBatch,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { PlacesCache, PlaceData, SupportedLanguage } from "../core/types";
import { toDateOrNull } from "@/lib/firebase/timestamp-utils";
import { COLLECTIONS } from "@/lib/firebase/firestore";
import logger from "@/lib/core/logger";
import { placesApiHelpers } from "@/lib/api/google/places";
import { timezoneUtils } from "@/lib/utils/timezone";
import { DEFAULT_LANGUAGE } from "@/lib/utils/language";

// キャッシュの有効期限設定
const CACHE_EXPIRY = {
	// 基本情報（住所、座標など）は1年間有効
	BASIC_INFO_DAYS: 365,
	// 動的情報（営業時間、評価など）は30日間有効
	DYNAMIC_INFO_DAYS: 30,
	// 写真は30日間有効
	PHOTOS_DAYS: 30,
} as const;

// キャッシュフォーマットバージョン管理
const CACHE_FORMAT_VERSION = "2.0.0"; // メジャー.マイナー.パッチ（新Places API v1対応）
const SUPPORTED_VERSIONS = ["2.0.0", "1.1.0"]; // サポート対象バージョン（1.1.0は互換モード）

export class PlacesCacheManager {
	private db = getFirestore();
	private auth = getAuth();

	/**
	 * place_idでキャッシュを検索
	 * @param placeId Google Places APIのplace_id
	 * @returns キャッシュされたデータまたはnull
	 */
	async getCachedPlace(placeId: string): Promise<PlacesCache | null> {
		try {
			logger.debug("🔍 Attempting to get cached place:", placeId);
			//logger.debug('🔐 Auth state:', this.auth.currentUser ? 'authenticated' : 'not authenticated')
			const docRef = doc(this.db, COLLECTIONS.PLACES_CACHE, placeId);
			const docSnap = await getDoc(docRef);

			if (!docSnap.exists()) {
				// logger.debug('❌ No cached document found for:', placeId)
				return null;
			}

			const data = docSnap.data() as PlacesCache;
			logger.debug("✅ Found cached data:", data.name);

			// バージョン互換性をチェック
			if (!this.isCacheVersionCompatible(data)) {
				//logger.debug('⚠️ Incompatible cache version for:', placeId)
				// 互換性のないキャッシュは削除（非同期）
				this.deleteIncompatibleCache(placeId).catch((err) =>
					logger.error("Failed to delete incompatible cache", err),
				);
				return null;
			}

			// キャッシュの有効期限をチェック
			if (this.isCacheExpired(data)) {
				// logger.debug('⚠️ Cached data expired for:', placeId)
				// 期限切れのキャッシュは削除（非同期）
				this.deleteExpiredCache(1).catch((err) =>
					logger.error("Failed to delete expired cache", err),
				);
				return null;
			}

			// アクセス統計を更新（非同期）
			this.updateAccessStats(placeId);

			return data;
		} catch (error) {
			logger.error("❌ Error getting cached place:", error);
			return null;
		}
	}

	/**
	 * Google Places APIからデータを取得してキャッシュに保存
	 * @param placeId Google Places APIのplace_id
	 * @param language 言語コード（デフォルト: 'ja'）
	 * @returns 取得したデータ
	 */
	async fetchAndCachePlace(
		placeId: string,
		language: SupportedLanguage = DEFAULT_LANGUAGE,
	): Promise<PlacesCache | null> {
		try {
			// Google Places APIからデータを取得
			const placeData = await placesApiHelpers.getPlaceDetails(
				placeId,
				language,
			);

			// PlacesCache形式に変換（undefined値を除外）
			const cacheData: any = {
				format_version: CACHE_FORMAT_VERSION,
				place_id: placeData.place_id,
				name: placeData.name,
				formatted_address: placeData.formatted_address,
				geometry: placeData.geometry,
				// メタデータ
				cached_at: new Date(),
				last_accessed: new Date(),
				access_count: 1,
			};

			// Basic Data（無料）
			if (placeData.address_components)
				cacheData.address_components = placeData.address_components;
			if (placeData.vicinity) cacheData.vicinity = placeData.vicinity;
			if (placeData.business_status)
				cacheData.business_status = placeData.business_status;
			if (placeData.types) {
				// point_of_interestを除外（ほぼ全ての場所に含まれるため）
				cacheData.types = placeData.types.filter(
					(type: string) => type !== "point_of_interest",
				);
			}
			if (placeData.photos) cacheData.photos = placeData.photos;
			if (placeData.url) cacheData.url = placeData.url;
			if (placeData.icon) cacheData.icon = placeData.icon;

			// Contact Data（$3.00/1,000件）
			if (placeData.formatted_phone_number)
				cacheData.formatted_phone_number = placeData.formatted_phone_number;
			if (placeData.international_phone_number)
				cacheData.international_phone_number =
					placeData.international_phone_number;
			if (placeData.website) cacheData.website = placeData.website;
			if (placeData.opening_hours) {
				// weekday_textのみキャッシュ（open_nowはリアルタイム情報なので除外）
				cacheData.opening_hours = {
					weekday_text: placeData.opening_hours.weekday_text,
				};
			}

			// Atmosphere Data（$5.00/1,000件）
			if (placeData.rating !== undefined) cacheData.rating = placeData.rating;
			if (placeData.user_ratings_total !== undefined)
				cacheData.user_ratings_total = placeData.user_ratings_total;
			if (placeData.price_level !== undefined)
				cacheData.price_level = placeData.price_level;
			if (placeData.editorial_summary)
				cacheData.editorial_summary = placeData.editorial_summary;
			if (placeData.reviews) cacheData.reviews = placeData.reviews;

			// タイムゾーン情報を推定（address_componentsから国コードや都市名を使用）
			// Google Timezone APIはreferer制限があるため使用しない
			// 代わりに、既存のtimezoneUtils.getTimezoneFromPlaceを使用
				try {
				const detectedTimezone = timezoneUtils.getTimezoneFromPlace(placeData);
				if (detectedTimezone && detectedTimezone !== "UTC") {
					cacheData.timezone = detectedTimezone;
					// utc_offset_minutesは計算（分単位）
					// タイムゾーン名からオフセットを計算
					try {
						const offsetMinutes = timezoneUtils.getTimezoneOffset(detectedTimezone);
						if (offsetMinutes !== 0) {
							cacheData.utc_offset_minutes = offsetMinutes;
						}
					} catch (offsetError) {
						// オフセット計算に失敗しても、タイムゾーンIDは保存する
						logger.debug("Failed to calculate UTC offset:", offsetError);
					}
					}
				} catch (error) {
				// タイムゾーン推定に失敗しても、Places APIのデータは保存する
				logger.warn("Failed to estimate timezone information:", error);
			}

			// Firestoreに保存（新形式: {place_id}_{language}）
			// logger.debug('💾 Saving cache data:', cacheData)
			const cacheKey = `${placeId}_${language}`;
			const docRef = doc(this.db, COLLECTIONS.PLACES_CACHE, cacheKey);
			await setDoc(docRef, cacheData);
			logger.debug("✅ Successfully saved to PlacesCache (NEW FORMAT)", {
				cacheKey,
				timezone: cacheData.timezone,
			});

			return cacheData;
		} catch (error) {
			logger.error("Error fetching and caching place:", error);
			return null;
		}
	}

	/**
	 * place_idでデータを取得（キャッシュ優先、なければAPIから取得）
	 * @param placeId Google Places APIのplace_id
	 * @returns データまたはnull
	 */
	async getPlace(placeId: string): Promise<PlacesCache | null> {
		// まずキャッシュを確認
		const cachedData = await this.getCachedPlace(placeId);
		if (cachedData) {
			return cachedData;
		}

		// キャッシュにない場合はAPIから取得してキャッシュ
		return await this.fetchAndCachePlace(placeId);
	}

	/**
	 * 複数のplace_idでデータを取得
	 * @param placeIds place_idの配列
	 * @returns place_idをキーとしたデータのマップ
	 */
	async getPlaces(placeIds: string[]): Promise<Map<string, PlacesCache>> {
		const results = new Map<string, PlacesCache>();

		// 並列でデータを取得
		const promises = placeIds.map(async (placeId) => {
			const data = await this.getPlace(placeId);
			if (data) {
				results.set(placeId, data);
			}
		});

		await Promise.all(promises);
		return results;
	}

	/**
	 * キャッシュのバージョン互換性をチェック
	 * @param cacheData キャッシュデータ
	 * @returns 互換性があるかどうか
	 */
	private isCacheVersionCompatible(cacheData: PlacesCache): boolean {
		if (!cacheData.format_version) {
			logger.debug("⚠️ No format_version found, treating as incompatible");
			return false;
		}

		const isCompatible = SUPPORTED_VERSIONS.includes(cacheData.format_version);
		if (!isCompatible) {
			logger.debug(
				`⚠️ Incompatible format_version: ${cacheData.format_version}`,
			);
		} else {
			// logger.debug(`✅ Compatible format_version: ${cacheData.format_version}`)
		}

		return isCompatible;
	}

	/**
	 * キャッシュの有効期限をチェック（情報の種類別）
	 * @param cacheData キャッシュデータ
	 * @returns 期限切れかどうか
	 */
	private isCacheExpired(cacheData: PlacesCache): boolean {
		if (!cacheData.cached_at) {
			return true; // cached_atがない場合は期限切れとする
		}

		const cachedAt = toDateOrNull(cacheData.cached_at);
		if (!cachedAt) {
			logger.error(
				"Invalid cached_at type:",
				typeof cacheData.cached_at,
				cacheData.cached_at,
			);
			return true;
		}

		const now = new Date();
		const daysSinceCached = Math.floor(
			(now.getTime() - cachedAt.getTime()) / (1000 * 60 * 60 * 24),
		);

		// 動的情報（営業時間、評価）がある場合は7日間で期限切れ
		if (cacheData.opening_hours || cacheData.rating !== undefined) {
			if (daysSinceCached > CACHE_EXPIRY.DYNAMIC_INFO_DAYS) {
				logger.info(`⚠️ Dynamic info expired (${daysSinceCached} days old)`);
				return true;
			}
		}

		// 写真がある場合は30日間で期限切れ
		if (cacheData.photos && cacheData.photos.length > 0) {
			if (daysSinceCached > CACHE_EXPIRY.PHOTOS_DAYS) {
				logger.info(`⚠️ Photos expired (${daysSinceCached} days old)`);
				return true;
			}
		}

		// 基本情報は1年間有効
		if (daysSinceCached > CACHE_EXPIRY.BASIC_INFO_DAYS) {
			logger.info(`⚠️ Basic info expired (${daysSinceCached} days old)`);
			return true;
		}

		// logger.debug(`✅ Cache is still valid (${daysSinceCached} days old)`)
		return false;
	}

	/**
	 * アクセス統計を更新
	 * @param placeId place_id
	 */
	private async updateAccessStats(placeId: string): Promise<void> {
		try {
			const docRef = doc(this.db, COLLECTIONS.PLACES_CACHE, placeId);
			await updateDoc(docRef, {
				last_accessed: new Date(),
				access_count: await this.incrementAccessCount(placeId),
			});
		} catch (error) {
			logger.error("Error updating access stats:", error);
		}
	}

	/**
	 * 互換性のないキャッシュを削除
	 * @param placeId place_id
	 */
	private async deleteIncompatibleCache(placeId: string): Promise<void> {
		try {
			const docRef = doc(this.db, COLLECTIONS.PLACES_CACHE, placeId);
			await setDoc(docRef, {}, { merge: false }); // 完全削除
			logger.debug(`🗑️ Deleted incompatible cache for: ${placeId}`);
		} catch (error) {
			logger.error("Error deleting incompatible cache:", error);
		}
	}

	/**
	 * アクセス回数をインクリメント
	 * @param placeId place_id
	 * @returns 新しいアクセス回数
	 */
	private async incrementAccessCount(placeId: string): Promise<number> {
		try {
			const docRef = doc(this.db, COLLECTIONS.PLACES_CACHE, placeId);
			const docSnap = await getDoc(docRef);

			if (docSnap.exists()) {
				const data = docSnap.data() as PlacesCache;
				return (data.access_count || 0) + 1;
			}

			return 1;
		} catch (error) {
			logger.error("Error incrementing access count:", error);
			return 1;
		}
	}

	/**
	 * 期限切れのキャッシュを削除（情報の種類別）
	 * @param batchSize 一度に処理する件数（デフォルト: 100）
	 * @returns 削除された件数
	 */
	async deleteExpiredCache(batchSize: number = 100): Promise<number> {
		try {
			const q = query(
				collection(this.db, COLLECTIONS.PLACES_CACHE),
				limit(batchSize),
			);

			const querySnapshot = await getDocs(q);
			const batch = writeBatch(this.db);
			let deletedCount = 0;

			querySnapshot.docs.forEach((doc) => {
				const data = doc.data() as PlacesCache;
				if (this.isCacheExpired(data)) {
					batch.delete(doc.ref);
					deletedCount++;
				}
			});

			if (deletedCount > 0) {
				await batch.commit();
				logger.debug(`🗑️ Deleted ${deletedCount} expired cache entries`);
			}

			return deletedCount;
		} catch (error) {
			logger.error("Error deleting expired cache:", error);
			return 0;
		}
	}

	/**
	 * 人気のPOIを取得（アクセス回数順）
	 * @param limit 取得件数
	 * @returns 人気のPOIリスト
	 */
	async getPopularPlaces(limitCount: number = 10): Promise<PlacesCache[]> {
		try {
			const q = query(
				collection(this.db, COLLECTIONS.PLACES_CACHE),
				orderBy("access_count", "desc"),
				limit(limitCount),
			);

			const querySnapshot = await getDocs(q);
			return querySnapshot.docs.map((doc) => doc.data() as PlacesCache);
		} catch (error) {
			logger.error("Error getting popular places:", error);
			return [];
		}
	}

	/**
	 * 最近アクセスされたPOIを取得
	 * @param limit 取得件数
	 * @returns 最近アクセスされたPOIリスト
	 */
	async getRecentlyAccessedPlaces(
		limitCount: number = 10,
	): Promise<PlacesCache[]> {
		try {
			const q = query(
				collection(this.db, COLLECTIONS.PLACES_CACHE),
				orderBy("last_accessed", "desc"),
				limit(limitCount),
			);

			const querySnapshot = await getDocs(q);
			return querySnapshot.docs.map((doc) => doc.data() as PlacesCache);
		} catch (error) {
			logger.error("Error getting recently accessed places:", error);
			return [];
		}
	}

	/**
	 * キャッシュ統計を取得
	 * @returns キャッシュの統計情報
	 */
	async getCacheStats(): Promise<{
		totalPlaces: number;
		totalAccesses: number;
		averageAccessCount: number;
	}> {
		try {
			const q = query(collection(this.db, COLLECTIONS.PLACES_CACHE));
			const querySnapshot = await getDocs(q);

			let totalAccesses = 0;
			const totalPlaces = querySnapshot.docs.length;

			querySnapshot.docs.forEach((doc) => {
				const data = doc.data() as PlacesCache;
				totalAccesses += data.access_count || 0;
			});

			return {
				totalPlaces,
				totalAccesses,
				averageAccessCount: totalPlaces > 0 ? totalAccesses / totalPlaces : 0,
			};
		} catch (error) {
			logger.error("Error getting cache stats:", error);
			return {
				totalPlaces: 0,
				totalAccesses: 0,
				averageAccessCount: 0,
			};
		}
	}
}

// シングルトンインスタンス
export const placesCacheManager = new PlacesCacheManager();

// 便利な関数
export const getCachedPlace = (placeId: string) =>
	placesCacheManager.getCachedPlace(placeId);
export const getCachedPlaces = (placeIds: string[]) =>
	placesCacheManager.getPlaces(placeIds);

// バージョン管理ユーティリティ
export const getCacheFormatVersion = () => CACHE_FORMAT_VERSION;
export const getSupportedVersions = () => [...SUPPORTED_VERSIONS];
export const isVersionSupported = (version: string) =>
	SUPPORTED_VERSIONS.includes(version);
export const getPopularPlaces = (limit?: number) =>
	placesCacheManager.getPopularPlaces(limit);
export const getRecentlyAccessedPlaces = (limit?: number) =>
	placesCacheManager.getRecentlyAccessedPlaces(limit);
export const getCacheStats = () => placesCacheManager.getCacheStats();

/**
 * PlacesCacheをPlaceDataに変換する
 * @param placesCache PlacesCacheオブジェクト
 * @returns PlaceDataオブジェクト（メタデータを除外）
 */
export const convertPlacesCacheToPlaceData = (
	placesCache: PlacesCache | null,
): PlaceData | null => {
	if (!placesCache) return null;

	const placeData: PlaceData = {
		place_id: placesCache.place_id,
		name: placesCache.name,
		formatted_address: placesCache.formatted_address,
		geometry: placesCache.geometry,
	};

	// Basic Data（無料）
	if (placesCache.address_components)
		placeData.address_components = placesCache.address_components;
	if (placesCache.vicinity) placeData.vicinity = placesCache.vicinity;
	if (placesCache.business_status)
		placeData.business_status = placesCache.business_status;
	if (placesCache.types) placeData.types = placesCache.types;
	if (placesCache.photos) placeData.photos = placesCache.photos;
	if (placesCache.url) placeData.url = placesCache.url;
	if (placesCache.icon) placeData.icon = placesCache.icon;

	// Contact Data（$3.00/1,000件）
	if (placesCache.formatted_phone_number)
		placeData.formatted_phone_number = placesCache.formatted_phone_number;
	if (placesCache.international_phone_number)
		placeData.international_phone_number =
			placesCache.international_phone_number;
	if (placesCache.website) placeData.website = placesCache.website;
	if (placesCache.opening_hours)
		placeData.opening_hours = placesCache.opening_hours;

	// Atmosphere Data（$5.00/1,000件）
	if (placesCache.rating !== undefined) placeData.rating = placesCache.rating;
	if (placesCache.user_ratings_total !== undefined)
		placeData.user_ratings_total = placesCache.user_ratings_total;
	if (placesCache.price_level !== undefined)
		placeData.price_level = placesCache.price_level;
	if (placesCache.editorial_summary)
		placeData.editorial_summary = placesCache.editorial_summary;
	if (placesCache.reviews) placeData.reviews = placesCache.reviews;

	return placeData;
};
