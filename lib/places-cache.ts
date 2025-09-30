/**
 * Google Places API Cache Management
 * 
 * FirestoreにGoogle Places APIの結果をキャッシュし、
 * APIコールを削減してコストとパフォーマンスを最適化します。
 */

import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, orderBy, limit, writeBatch } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { PlacesCache, PlaceData } from './types'
import { COLLECTIONS } from './firestore'
import { placesApiHelpers } from './places-api'

// キャッシュの有効期限設定
const CACHE_EXPIRY = {
  // 基本情報（住所、座標など）は1年間有効
  BASIC_INFO_DAYS: 365,
  // 動的情報（営業時間、評価など）は7日間有効
  DYNAMIC_INFO_DAYS: 7,
  // 写真は30日間有効
  PHOTOS_DAYS: 30
} as const

// キャッシュフォーマットバージョン管理
const CACHE_FORMAT_VERSION = '1.0.0' // メジャー.マイナー.パッチ
const SUPPORTED_VERSIONS = ['1.0.0'] // サポート対象バージョン

export class PlacesCacheManager {
  private db = getFirestore()
  private auth = getAuth()

  /**
   * place_idでキャッシュを検索
   * @param placeId Google Places APIのplace_id
   * @returns キャッシュされたデータまたはnull
   */
  async getCachedPlace(placeId: string): Promise<PlacesCache | null> {
    try {
      console.log('🔍 Attempting to get cached place:', placeId)
      console.log('🔐 Auth state:', this.auth.currentUser ? 'authenticated' : 'not authenticated')
      const docRef = doc(this.db, COLLECTIONS.PLACES_CACHE, placeId)
      const docSnap = await getDoc(docRef)
      
      if (!docSnap.exists()) {
        console.log('❌ No cached document found for:', placeId)
        return null
      }

      const data = docSnap.data() as PlacesCache
      console.log('✅ Found cached data:', data.name)
      
      // バージョン互換性をチェック
      if (!this.isCacheVersionCompatible(data)) {
        console.log('⚠️ Incompatible cache version for:', placeId)
        // 互換性のないキャッシュは削除（非同期）
        this.deleteIncompatibleCache(placeId).catch(console.error)
        return null
      }
      
      // キャッシュの有効期限をチェック
      if (this.isCacheExpired(data)) {
        console.log('⚠️ Cached data expired for:', placeId)
        // 期限切れのキャッシュは削除（非同期）
        this.deleteExpiredCache(1).catch(console.error)
        return null
      }
      
      // アクセス統計を更新（非同期）
      this.updateAccessStats(placeId)
      
      return data
    } catch (error) {
      console.error('❌ Error getting cached place:', error)
      console.error('Error details:', error)
      return null
    }
  }

  /**
   * Google Places APIからデータを取得してキャッシュに保存
   * @param placeId Google Places APIのplace_id
   * @returns 取得したデータ
   */
  async fetchAndCachePlace(placeId: string): Promise<PlacesCache | null> {
    try {
      // Google Places APIからデータを取得
      const placeData = await placesApiHelpers.getPlaceDetails(placeId)
      
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
        access_count: 1
      }
      
      // undefinedでない値のみ追加
      if (placeData.address_components) cacheData.address_components = placeData.address_components
      if (placeData.photos) cacheData.photos = placeData.photos
      if (placeData.rating !== undefined) cacheData.rating = placeData.rating
      if (placeData.user_ratings_total !== undefined) cacheData.user_ratings_total = placeData.user_ratings_total
      if (placeData.price_level !== undefined) cacheData.price_level = placeData.price_level
      if (placeData.types) cacheData.types = placeData.types
      if (placeData.opening_hours) {
        // open_nowは動的情報なので除外、weekday_textのみキャッシュ
        cacheData.opening_hours = {
          weekday_text: placeData.opening_hours.weekday_text
          // open_nowは除外（リアルタイム情報のため）
        }
      }
      if (placeData.international_phone_number) cacheData.international_phone_number = placeData.international_phone_number
      if (placeData.website) cacheData.website = placeData.website
      if (placeData.editorial_summary) cacheData.editorial_summary = placeData.editorial_summary
      
      // Firestoreに保存
      console.log('💾 Saving cache data:', cacheData)
      const docRef = doc(this.db, COLLECTIONS.PLACES_CACHE, placeId)
      await setDoc(docRef, cacheData)
      console.log('✅ Successfully saved to PlacesCache')
      
      return cacheData
    } catch (error) {
      console.error('Error fetching and caching place:', error)
      return null
    }
  }

  /**
   * place_idでデータを取得（キャッシュ優先、なければAPIから取得）
   * @param placeId Google Places APIのplace_id
   * @returns データまたはnull
   */
  async getPlace(placeId: string): Promise<PlacesCache | null> {
    // まずキャッシュを確認
    const cachedData = await this.getCachedPlace(placeId)
    if (cachedData) {
      return cachedData
    }
    
    // キャッシュにない場合はAPIから取得してキャッシュ
    return await this.fetchAndCachePlace(placeId)
  }

  /**
   * 複数のplace_idでデータを取得
   * @param placeIds place_idの配列
   * @returns place_idをキーとしたデータのマップ
   */
  async getPlaces(placeIds: string[]): Promise<Map<string, PlacesCache>> {
    const results = new Map<string, PlacesCache>()
    
    // 並列でデータを取得
    const promises = placeIds.map(async (placeId) => {
      const data = await this.getPlace(placeId)
      if (data) {
        results.set(placeId, data)
      }
    })
    
    await Promise.all(promises)
    return results
  }

  /**
   * キャッシュのバージョン互換性をチェック
   * @param cacheData キャッシュデータ
   * @returns 互換性があるかどうか
   */
  private isCacheVersionCompatible(cacheData: PlacesCache): boolean {
    if (!cacheData.format_version) {
      console.log('⚠️ No format_version found, treating as incompatible')
      return false
    }
    
    const isCompatible = SUPPORTED_VERSIONS.includes(cacheData.format_version)
    if (!isCompatible) {
      console.log(`⚠️ Incompatible format_version: ${cacheData.format_version}`)
    } else {
      console.log(`✅ Compatible format_version: ${cacheData.format_version}`)
    }
    
    return isCompatible
  }

  /**
   * キャッシュの有効期限をチェック（情報の種類別）
   * @param cacheData キャッシュデータ
   * @returns 期限切れかどうか
   */
  private isCacheExpired(cacheData: PlacesCache): boolean {
    if (!cacheData.cached_at) {
      return true // cached_atがない場合は期限切れとする
    }
    
    const cachedAt = typeof cacheData.cached_at === 'string' 
      ? new Date(cacheData.cached_at) 
      : cacheData.cached_at
    
    const now = new Date()
    const daysSinceCached = Math.floor((now.getTime() - cachedAt.getTime()) / (1000 * 60 * 60 * 24))
    
    // 動的情報（営業時間、評価）がある場合は7日間で期限切れ
    if (cacheData.opening_hours || cacheData.rating !== undefined) {
      if (daysSinceCached > CACHE_EXPIRY.DYNAMIC_INFO_DAYS) {
        console.log(`⚠️ Dynamic info expired (${daysSinceCached} days old)`)
        return true
      }
    }
    
    // 写真がある場合は30日間で期限切れ
    if (cacheData.photos && cacheData.photos.length > 0) {
      if (daysSinceCached > CACHE_EXPIRY.PHOTOS_DAYS) {
        console.log(`⚠️ Photos expired (${daysSinceCached} days old)`)
        return true
      }
    }
    
    // 基本情報は1年間有効
    if (daysSinceCached > CACHE_EXPIRY.BASIC_INFO_DAYS) {
      console.log(`⚠️ Basic info expired (${daysSinceCached} days old)`)
      return true
    }
    
    console.log(`✅ Cache is still valid (${daysSinceCached} days old)`)
    return false
  }

  /**
   * アクセス統計を更新
   * @param placeId place_id
   */
  private async updateAccessStats(placeId: string): Promise<void> {
    try {
      const docRef = doc(this.db, COLLECTIONS.PLACES_CACHE, placeId)
      await updateDoc(docRef, {
        last_accessed: new Date(),
        access_count: await this.incrementAccessCount(placeId)
      })
    } catch (error) {
      console.error('Error updating access stats:', error)
    }
  }

  /**
   * 互換性のないキャッシュを削除
   * @param placeId place_id
   */
  private async deleteIncompatibleCache(placeId: string): Promise<void> {
    try {
      const docRef = doc(this.db, COLLECTIONS.PLACES_CACHE, placeId)
      await setDoc(docRef, {}, { merge: false }) // 完全削除
      console.log(`🗑️ Deleted incompatible cache for: ${placeId}`)
    } catch (error) {
      console.error('Error deleting incompatible cache:', error)
    }
  }

  /**
   * アクセス回数をインクリメント
   * @param placeId place_id
   * @returns 新しいアクセス回数
   */
  private async incrementAccessCount(placeId: string): Promise<number> {
    try {
      const docRef = doc(this.db, COLLECTIONS.PLACES_CACHE, placeId)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        const data = docSnap.data() as PlacesCache
        return (data.access_count || 0) + 1
      }
      
      return 1
    } catch (error) {
      console.error('Error incrementing access count:', error)
      return 1
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
        limit(batchSize)
      )
      
      const querySnapshot = await getDocs(q)
      const batch = writeBatch(this.db)
      let deletedCount = 0
      
      querySnapshot.docs.forEach((doc) => {
        const data = doc.data() as PlacesCache
        if (this.isCacheExpired(data)) {
          batch.delete(doc.ref)
          deletedCount++
        }
      })
      
      if (deletedCount > 0) {
        await batch.commit()
        console.log(`🗑️ Deleted ${deletedCount} expired cache entries`)
      }
      
      return deletedCount
    } catch (error) {
      console.error('Error deleting expired cache:', error)
      return 0
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
        orderBy('access_count', 'desc'),
        limit(limitCount)
      )
      
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => doc.data() as PlacesCache)
    } catch (error) {
      console.error('Error getting popular places:', error)
      return []
    }
  }

  /**
   * 最近アクセスされたPOIを取得
   * @param limit 取得件数
   * @returns 最近アクセスされたPOIリスト
   */
  async getRecentlyAccessedPlaces(limitCount: number = 10): Promise<PlacesCache[]> {
    try {
      const q = query(
        collection(this.db, COLLECTIONS.PLACES_CACHE),
        orderBy('last_accessed', 'desc'),
        limit(limitCount)
      )
      
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => doc.data() as PlacesCache)
    } catch (error) {
      console.error('Error getting recently accessed places:', error)
      return []
    }
  }

  /**
   * キャッシュ統計を取得
   * @returns キャッシュの統計情報
   */
  async getCacheStats(): Promise<{
    totalPlaces: number
    totalAccesses: number
    averageAccessCount: number
  }> {
    try {
      const q = query(collection(this.db, COLLECTIONS.PLACES_CACHE))
      const querySnapshot = await getDocs(q)
      
      let totalAccesses = 0
      const totalPlaces = querySnapshot.docs.length
      
      querySnapshot.docs.forEach(doc => {
        const data = doc.data() as PlacesCache
        totalAccesses += data.access_count || 0
      })
      
      return {
        totalPlaces,
        totalAccesses,
        averageAccessCount: totalPlaces > 0 ? totalAccesses / totalPlaces : 0
      }
    } catch (error) {
      console.error('Error getting cache stats:', error)
      return {
        totalPlaces: 0,
        totalAccesses: 0,
        averageAccessCount: 0
      }
    }
  }
}

// シングルトンインスタンス
export const placesCacheManager = new PlacesCacheManager()

// 便利な関数
export const getCachedPlace = (placeId: string) => placesCacheManager.getCachedPlace(placeId)
export const getCachedPlaces = (placeIds: string[]) => placesCacheManager.getPlaces(placeIds)

// バージョン管理ユーティリティ
export const getCacheFormatVersion = () => CACHE_FORMAT_VERSION
export const getSupportedVersions = () => [...SUPPORTED_VERSIONS]
export const isVersionSupported = (version: string) => SUPPORTED_VERSIONS.includes(version)
export const getPopularPlaces = (limit?: number) => placesCacheManager.getPopularPlaces(limit)
export const getRecentlyAccessedPlaces = (limit?: number) => placesCacheManager.getRecentlyAccessedPlaces(limit)
export const getCacheStats = () => placesCacheManager.getCacheStats()
