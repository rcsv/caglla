/**
 * Foursquare Places API Integration
 * @see https://location.foursquare.com/developer/reference/places-api-overview
 * 
 * ⚠️ サーバーサイド専用 - クライアント側からは使用しないこと
 */

import logger from '@/lib/core/logger'

export interface FoursquareLocation {
  fsq_id: string
  name: string
  description?: string
  geocodes: {
    main: {
      latitude: number
      longitude: number
    }
    roof?: {
      latitude: number
      longitude: number
    }
  }
  location: {
    address?: string
    locality?: string
    region?: string
    postcode?: string
    country?: string
    formatted_address?: string
    cross_street?: string
  }
  categories: Array<{
    id: number
    name: string
    icon: {
      prefix: string
      suffix: string
    }
  }>
  rating?: number
  popularity?: number
  price?: number
  hours?: {
    display?: string
    is_local_holiday?: boolean
    open_now?: boolean
    regular?: Array<{
      day: number
      open: string
      close: string
    }>
  }
  stats?: {
    total_photos?: number
    total_ratings?: number
    total_tips?: number
  }
  photos?: Array<{
    id: string
    created_at: string
    prefix: string
    suffix: string
    width: number
    height: number
  }>
  tips?: Array<{
    id: string
    created_at: string
    text: string
  }>
  tel?: string
  website?: string
  social_media?: {
    facebook_id?: string
    twitter?: string
    instagram?: string
  }
  verified?: boolean
  tastes?: string[]
  features?: {
    payment?: {
      credit_cards?: {
        accepts_credit_cards?: boolean
      }
    }
    food_and_drink?: {
      alcohol?: {
        bar_service?: boolean
        beer?: boolean
        wine?: boolean
      }
    }
    services?: {
      delivery?: boolean
      takeout?: boolean
      reservations?: boolean
    }
  }
}

export interface FoursquareTip {
  id: string
  created_at: string
  text: string
  url?: string
  lang?: string
  agree_count?: number
  disagree_count?: number
}

export interface FoursquarePhoto {
  id: string
  created_at: string
  prefix: string
  suffix: string
  width: number
  height: number
  classifications?: string[]
}

export interface FoursquareSearchResult {
  fsq_id: string
  name: string
  distance?: number
  geocodes: {
    main: {
      latitude: number
      longitude: number
    }
  }
  location: {
    formatted_address?: string
  }
  categories: Array<{
    id: number
    name: string
  }>
}

class FoursquareAPI {
  private apiKey: string
  private baseUrl = 'https://api.foursquare.com/v3'

  constructor() {
    this.apiKey = process.env.FOURSQUARE_API_KEY || ''
    
    if (!this.apiKey) {
      logger.warn('⚠️ Foursquare API key not configured')
    } else {
      logger.debug('✅ Foursquare API key configured (length:', this.apiKey.length, ')')
    }
  }

  private async makeRequest<T>(endpoint: string, params: Record<string, string> = {}): Promise<T | null> {
    if (!this.apiKey) {
      logger.warn('Foursquare API key not configured, skipping request')
      return null
    }

    try {
      const queryParams = new URLSearchParams(params)
      const url = queryParams.toString() 
        ? `${this.baseUrl}${endpoint}?${queryParams.toString()}`
        : `${this.baseUrl}${endpoint}`
      
      logger.debug('Foursquare API Request:', url)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': this.apiKey
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        logger.error('Foursquare API error:', {
          status: response.status,
          statusText: response.statusText,
          url: url,
          error: errorText
        })
        return null
      }

      const data = await response.json()
      return data as T
    } catch (error) {
      logger.error('Foursquare API request failed:', error)
      return null
    }
  }

  /**
   * 場所名と座標からFoursquareのロケーションを検索
   */
  async searchPlaces(query: string, lat: number, lng: number, limit: number = 10): Promise<FoursquareSearchResult[]> {
    const response = await this.makeRequest<{ results: FoursquareSearchResult[] }>(
      '/places/search',
      {
        query,
        ll: `${lat},${lng}`,
        limit: limit.toString(),
        radius: '1000' // 1km radius
      }
    )

    return response?.results || []
  }

  /**
   * Foursquare IDから詳細情報を取得
   */
  async getPlaceDetails(fsqId: string): Promise<FoursquareLocation | null> {
    const response = await this.makeRequest<FoursquareLocation>(
      `/places/${fsqId}`,
      {
        fields: [
          'fsq_id',
          'name',
          'description',
          'geocodes',
          'location',
          'categories',
          'rating',
          'popularity',
          'price',
          'hours',
          'stats',
          'photos',
          'tips',
          'tel',
          'website',
          'social_media',
          'verified',
          'tastes',
          'features'
        ].join(',')
      }
    )

    return response
  }

  /**
   * プレイスのTips（ユーザーコメント）を取得
   */
  async getPlaceTips(fsqId: string, limit: number = 10): Promise<FoursquareTip[]> {
    const response = await this.makeRequest<{ results: FoursquareTip[] }>(
      `/places/${fsqId}/tips`,
      {
        limit: limit.toString(),
        sort: 'POPULAR' // 人気順
      }
    )

    return response?.results || []
  }

  /**
   * プレイスの写真を取得
   */
  async getPlacePhotos(fsqId: string, limit: number = 10): Promise<FoursquarePhoto[]> {
    const response = await this.makeRequest<FoursquarePhoto[]>(
      `/places/${fsqId}/photos`,
      {
        limit: limit.toString(),
        sort: 'POPULAR' // 人気順
      }
    )

    return response || []
  }

  /**
   * 写真URLを生成
   */
  getPhotoUrl(photo: FoursquarePhoto, size: 'original' | 'large' | 'medium' | 'small' = 'medium'): string {
    const sizeMap = {
      original: 'original',
      large: '600x600',
      medium: '300x300',
      small: '100x100'
    }
    return `${photo.prefix}${sizeMap[size]}${photo.suffix}`
  }

  /**
   * Google Place情報から対応するFoursquare情報を検索して取得
   */
  async getDetailsByGooglePlace(placeName: string, lat: number, lng: number): Promise<{
    details: FoursquareLocation | null
    tips: FoursquareTip[]
    photos: FoursquarePhoto[]
  }> {
    try {
      // 1. 場所を検索
      const searchResults = await this.searchPlaces(placeName, lat, lng, 5)
      
      if (!searchResults || searchResults.length === 0) {
        logger.debug('Foursquare: No matching place found')
        return { details: null, tips: [], photos: [] }
      }

      // 最も近い結果を使用
      const fsqId = searchResults[0].fsq_id

      // 2. 詳細情報、Tips、写真を並行取得
      const [details, tips, photos] = await Promise.all([
        this.getPlaceDetails(fsqId),
        this.getPlaceTips(fsqId, 5),
        this.getPlacePhotos(fsqId, 5)
      ])

      logger.debug('Foursquare: データ取得完了', {
        fsqId,
        hasDetails: !!details,
        tipsCount: tips.length,
        photoCount: photos.length
      })

      return { details, tips, photos }
    } catch (error) {
      logger.error('Foursquare: データ取得エラー:', error)
      return { details: null, tips: [], photos: [] }
    }
  }
}

// シングルトンインスタンス
export const foursquareAPI = new FoursquareAPI()

