/**
 * TripAdvisor Content API Integration
 * @see https://www.tripadvisor.com/developers/content-api
 * 
 * ⚠️ サーバーサイド専用 - クライアント側からは使用しないこと
 */

import logger from '@/lib/core/logger'

export interface TripAdvisorLocation {
  location_id: string
  name: string
  description?: string
  web_url?: string
  address_obj?: {
    street1?: string
    street2?: string
    city?: string
    state?: string
    country?: string
    postalcode?: string
    address_string?: string
  }
  latitude?: string
  longitude?: string
  rating?: string
  rating_image_url?: string
  num_reviews?: string
  review_rating_count?: {
    1?: string
    2?: string
    3?: string
    4?: string
    5?: string
  }
  photo?: {
    images?: {
      small?: { url: string }
      medium?: { url: string }
      large?: { url: string }
      original?: { url: string }
    }
  }
  awards?: Array<{
    award_type: string
    year: string
    images?: {
      small?: string
      large?: string
    }
    categories?: string[]
    display_name?: string
  }>
  cuisine?: Array<{
    name: string
    localized_name: string
  }>
  price_level?: string
  hours?: {
    weekday_text?: string[]
  }
  phone?: string
  website?: string
  email?: string
  ranking_data?: {
    ranking_string?: string
    ranking?: string
    ranking_out_of?: string
  }
}

export interface TripAdvisorReview {
  id: string
  lang: string
  location_id: string
  published_date: string
  rating: number
  helpful_votes: number
  rating_image_url: string
  url: string
  text: string
  title: string
  trip_type?: string
  travel_date?: string
  user: {
    username: string
    user_location?: {
      name?: string
    }
  }
}

export interface TripAdvisorPhoto {
  id: string
  caption?: string
  published_date: string
  images: {
    thumbnail?: { url: string; width: number; height: number }
    small?: { url: string; width: number; height: number }
    medium?: { url: string; width: number; height: number }
    large?: { url: string; width: number; height: number }
    original?: { url: string; width: number; height: number }
  }
  user?: {
    username: string
  }
}

export interface TripAdvisorSearchResult {
  location_id: string
  name: string
  distance?: string
  rating?: string
  num_reviews?: string
  address_obj?: {
    city?: string
    state?: string
    country?: string
    address_string?: string
  }
}

class TripAdvisorAPI {
  private apiKey: string
  private baseUrl = 'https://api.content.tripadvisor.com/api/v1'

  constructor() {
    this.apiKey = process.env.TRIPADVISOR_API_KEY || ''
    
    if (!this.apiKey) {
      logger.warn('⚠️ TripAdvisor API key not configured')
    } else {
      logger.debug('✅ TripAdvisor API key configured (length:', this.apiKey.length, ')')
    }
  }

  private async makeRequest<T>(endpoint: string, params: Record<string, string> = {}): Promise<T | null> {
    if (!this.apiKey) {
      logger.warn('TripAdvisor API key not configured, skipping request')
      return null
    }

    try {
      const queryParams = new URLSearchParams({
        key: this.apiKey,
        language: 'ja', // 日本語優先
        ...params
      })

      const url = `${this.baseUrl}${endpoint}?${queryParams.toString()}`
      
      logger.debug('TripAdvisor API Request:', url.replace(this.apiKey, 'REDACTED'))

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        logger.error('TripAdvisor API error:', {
          status: response.status,
          statusText: response.statusText,
          url: url.replace(this.apiKey, 'REDACTED'),
          error: errorText,
          headers: Object.fromEntries(response.headers.entries())
        })
        
        // 403エラーの場合、APIキーの問題の可能性
        if (response.status === 403) {
          logger.error('TripAdvisor 403 Forbidden - API key may be invalid or expired')
        }
        
        return null
      }

      const data = await response.json()
      return data as T
    } catch (error) {
      logger.error('TripAdvisor API request failed:', error)
      return null
    }
  }

  /**
   * 場所名と座標から TripAdvisor のロケーションを検索
   */
  async searchLocation(name: string, lat: number, lng: number): Promise<TripAdvisorSearchResult[]> {
    const response = await this.makeRequest<{ data: TripAdvisorSearchResult[] }>(
      '/location/search',
      {
        searchQuery: name,
        latLong: `${lat},${lng}`,
        radius: '1', // 1km radius
        radiusUnit: 'km'
      }
    )

    return response?.data || []
  }

  /**
   * ロケーションIDから詳細情報を取得
   */
  async getLocationDetails(locationId: string): Promise<TripAdvisorLocation | null> {
    return await this.makeRequest<TripAdvisorLocation>(
      `/location/${locationId}/details`
    )
  }

  /**
   * ロケーションのレビューを取得
   */
  async getLocationReviews(locationId: string, limit: number = 5): Promise<TripAdvisorReview[]> {
    const response = await this.makeRequest<{ data: TripAdvisorReview[] }>(
      `/location/${locationId}/reviews`,
      {
        limit: limit.toString()
      }
    )

    return response?.data || []
  }

  /**
   * ロケーションの写真を取得
   */
  async getLocationPhotos(locationId: string, limit: number = 10): Promise<TripAdvisorPhoto[]> {
    const response = await this.makeRequest<{ data: TripAdvisorPhoto[] }>(
      `/location/${locationId}/photos`,
      {
        limit: limit.toString()
      }
    )

    return response?.data || []
  }

  /**
   * Google Place IDから対応するTripAdvisor情報を検索して取得
   */
  async getDetailsByGooglePlace(placeName: string, lat: number, lng: number): Promise<{
    details: TripAdvisorLocation | null
    reviews: TripAdvisorReview[]
    photos: TripAdvisorPhoto[]
  }> {
    try {
      // 1. 場所を検索
      const searchResults = await this.searchLocation(placeName, lat, lng)
      
      if (!searchResults || searchResults.length === 0) {
        logger.debug('TripAdvisor: No matching location found')
        return { details: null, reviews: [], photos: [] }
      }

      // 最も近い結果を使用
      const locationId = searchResults[0].location_id

      // 2. 詳細情報、レビュー、写真を並行取得
      const [details, reviews, photos] = await Promise.all([
        this.getLocationDetails(locationId),
        this.getLocationReviews(locationId, 5),
        this.getLocationPhotos(locationId, 5)
      ])

      logger.debug('TripAdvisor: データ取得完了', {
        locationId,
        hasDetails: !!details,
        reviewCount: reviews.length,
        photoCount: photos.length
      })

      return { details, reviews, photos }
    } catch (error) {
      logger.error('TripAdvisor: データ取得エラー:', error)
      return { details: null, reviews: [], photos: [] }
    }
  }
}

// シングルトンインスタンス
export const tripAdvisorAPI = new TripAdvisorAPI()

