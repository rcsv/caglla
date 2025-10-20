// Places API キャッシュ管理
import { adminDb } from '@/lib/firebase/admin'
import { getCacheKey, getFallbackLanguages } from '@/lib/utils/language'
import logger from '@/lib/core/logger'
import type { PlacesCache, PlacesCacheInput, SupportedLanguage, PlaceDetailsResult, PlaceData } from '@/lib/core/types'
import { toDateOrNull } from '@/lib/firebase/timestamp-utils'

const PLACES_CACHE_COLLECTION = 'places_cache'
const CACHE_FORMAT_VERSION = '2.0.0'

/**
 * キャッシュから場所データを取得
 * 
 * @param placeId - Google Places API の place_id
 * @param language - 言語コード
 * @returns キャッシュされた場所データ、存在しない場合は null
 */
export async function getPlaceFromCache(
  placeId: string,
  language: SupportedLanguage
): Promise<PlacesCache | null> {
  try {
    const cacheKey = getCacheKey(placeId, language)
    const docRef = adminDb.collection(PLACES_CACHE_COLLECTION).doc(cacheKey)
    const doc = await docRef.get()
    
    if (!doc.exists) {
      logger.debug('Cache miss:', { placeId, language, cacheKey })
      return null
    }
    
    logger.debug('Cache hit:', { placeId, language, cacheKey })
    
    // アクセス統計を非同期で更新（レスポンスを待たない）
    docRef.update({
      last_accessed: new Date(),
      access_count: (doc.data()?.access_count || 0) + 1
    }).catch((err: any) => {
      logger.warn('Failed to update cache metadata:', err)
    })
    
    return doc.data() as PlacesCache
  } catch (error) {
    logger.error('Error getting place from cache:', error)
    return null
  }
}

/**
 * フォールバック言語を含めてキャッシュから場所データを取得
 * 
 * 優先順位: 指定言語 → 英語 → 日本語
 * 
 * @param placeId - Google Places API の place_id
 * @param preferredLanguage - 優先言語
 * @returns キャッシュされた場所データ、全て存在しない場合は null
 */
export async function getPlaceFromCacheWithFallback(
  placeId: string,
  preferredLanguage: SupportedLanguage
): Promise<PlacesCache | null> {
  const fallbackLanguages = getFallbackLanguages(preferredLanguage)
  
  for (const lang of fallbackLanguages) {
    const cached = await getPlaceFromCache(placeId, lang)
    if (cached) {
      if (lang !== preferredLanguage) {
        logger.info('Using fallback language:', { 
          placeId, 
          preferred: preferredLanguage, 
          fallback: lang 
        })
      }
      return cached
    }
  }
  
  logger.debug('No cache found for any fallback language:', { placeId, fallbackLanguages })
  return null
}

/**
 * キャッシュに場所データを保存
 * 
 * @param placeData - 保存する場所データ
 * @param language - 言語コード
 */
export async function savePlaceToCache(
  placeData: PlaceDetailsResult,
  language: SupportedLanguage
): Promise<void> {
  try {
    const cacheKey = getCacheKey(placeData.place_id, language)
    const docRef = adminDb.collection(PLACES_CACHE_COLLECTION).doc(cacheKey)
    
    const cacheData: PlacesCacheInput = {
      ...placeData,
      format_version: CACHE_FORMAT_VERSION,
      place_id: placeData.place_id,
      language: language,
      cached_at: new Date(),
      last_accessed: new Date(),
      access_count: 1
    }
    
    // merge: true でレースコンディション対策
    await docRef.set(cacheData, { merge: true })
    
    logger.info('Saved place to cache:', { 
      placeId: placeData.place_id, 
      language, 
      cacheKey 
    })
  } catch (error) {
    logger.error('Error saving place to cache:', error)
    throw error
  }
}

/**
 * PlacesCacheからPlaceDataに変換（メタデータを除外）
 * 
 * @param placesCache - PlacesCacheオブジェクト
 * @returns PlaceDataオブジェクト
 */
export function convertPlacesCacheToPlaceData(placesCache: PlacesCache): PlaceData {
  return {
    place_id: placesCache.place_id,
    name: placesCache.name,
    formatted_address: placesCache.formatted_address,
    geometry: placesCache.geometry,
    address_components: placesCache.address_components,
    photos: placesCache.photos,
    rating: placesCache.rating,
    user_ratings_total: placesCache.user_ratings_total,
    price_level: placesCache.price_level,
    types: placesCache.types,
    opening_hours: placesCache.opening_hours,
    international_phone_number: placesCache.international_phone_number,
    website: placesCache.website,
    editorial_summary: placesCache.editorial_summary,
  }
}

/**
 * destination_place_idからPlaceDataを解決（言語サフィックス対応）
 * 
 * @param destinationPlaceId - Google Places API の place_id
 * @param preferredLanguage - 優先言語（デフォルト: ユーザー言語）
 * @returns 解決されたPlaceData、見つからない場合はnull
 */
export async function resolveDestinationPlace(
  destinationPlaceId: string,
  preferredLanguage: SupportedLanguage
): Promise<PlaceData | null> {
  try {
    const placesCache = await getPlaceFromCacheWithFallback(destinationPlaceId, preferredLanguage)
    
    if (placesCache) {
      return convertPlacesCacheToPlaceData(placesCache)
    }
    
    return null
  } catch (error) {
    logger.error('Error resolving destination place:', error, { destinationPlaceId })
    return null
  }
}

/**
 * 複数の言語でキャッシュを一括取得
 * 
 * @param placeId - Google Places API の place_id
 * @param languages - 言語コードの配列
 * @returns 言語ごとのキャッシュデータ
 */
export async function getPlaceMultiLanguage(
  placeId: string,
  languages: SupportedLanguage[]
): Promise<Record<SupportedLanguage, PlacesCache | null>> {
  const results: Partial<Record<SupportedLanguage, PlacesCache | null>> = {}
  
  await Promise.all(
    languages.map(async (lang) => {
      results[lang] = await getPlaceFromCache(placeId, lang)
    })
  )
  
  return results as Record<SupportedLanguage, PlacesCache | null>
}

/**
 * キャッシュが古いか確認
 * 
 * Google Places API利用規約に基づき、すべてのデータは30日以内のキャッシュのみ許可。
 * デフォルトは14日（Soft TTL）で、30日を超えたデータは削除される。
 * 
 * @param cached - キャッシュデータ
 * @param maxAgeMs - 最大有効期間（ミリ秒）、デフォルト: 14日
 * @returns 古い場合は true
 */
export function isCacheStale(cached: PlacesCache, maxAgeMs: number = 14 * 24 * 60 * 60 * 1000): boolean {
  if (!cached.cached_at) return true
  
  const cachedDate = toDateOrNull(cached.cached_at)
  // 日時変換失敗や無効な値は期限切れとして扱う
  if (!cachedDate) return true
  
  const cachedTime = cachedDate.getTime()
  if (isNaN(cachedTime)) return true
  
  const age = Date.now() - cachedTime
  return age > maxAgeMs
}

/**
 * キャッシュを削除
 * 
 * @param placeId - Google Places API の place_id
 * @param language - 言語コード
 */
export async function deletePlaceCache(
  placeId: string,
  language: SupportedLanguage
): Promise<void> {
  try {
    const cacheKey = getCacheKey(placeId, language)
    const docRef = adminDb.collection(PLACES_CACHE_COLLECTION).doc(cacheKey)
    
    await docRef.delete()
    
    logger.info('Deleted place cache:', { placeId, language, cacheKey })
  } catch (error) {
    logger.error('Error deleting place cache:', error)
    throw error
  }
}

/**
 * 古いキャッシュを削除
 * 
 * Google Places API利用規約に基づき、30日を超えたキャッシュは削除される。
 * 
 * @param maxAgeMs - 削除対象の最大経過時間（ミリ秒）、デフォルト: 30日
 * @param batchSize - 一度に削除する件数
 * @returns 削除した件数
 */
export async function cleanupOldCache(
  maxAgeMs: number = 30 * 24 * 60 * 60 * 1000, // 30日（Google利用規約準拠）
  batchSize: number = 1000
): Promise<number> {
  try {
    const cutoffDate = new Date(Date.now() - maxAgeMs)
    
    const snapshot = await adminDb.collection(PLACES_CACHE_COLLECTION)
      .where('last_accessed', '<', cutoffDate)
      .limit(batchSize)
      .get()
    
    if (snapshot.empty) {
      logger.info('No old cache entries to clean up')
      return 0
    }
    
    const batch = adminDb.batch()
    snapshot.docs.forEach((doc: any) => {
      batch.delete(doc.ref)
    })
    
    await batch.commit()
    
    logger.info('Cleaned up old cache entries:', { 
      count: snapshot.size,
      cutoffDate: cutoffDate.toISOString()
    })
    
    return snapshot.size
  } catch (error) {
    logger.error('Error cleaning up old cache:', error)
    throw error
  }
}

