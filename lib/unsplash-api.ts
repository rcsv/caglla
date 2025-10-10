// Unsplash API統合ヘルパー関数
// 旅行の目的地に関連する画像を自動取得する機能を提供

import { UnsplashPhoto, UnsplashSearchResponse, UnsplashRandomResponse } from './types'
import logger from './logger'

export interface UnsplashApiConfig {
  accessKey: string
  baseUrl?: string
}

export interface UnsplashSearchOptions {
  query: string
  page?: number
  perPage?: number
  orientation?: 'landscape' | 'portrait' | 'squarish'
  orderBy?: 'relevant' | 'latest'
}

export interface UnsplashRandomOptions {
  query?: string
  count?: number
  orientation?: 'landscape' | 'portrait' | 'squarish'
}

class UnsplashApiError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message)
    this.name = 'UnsplashApiError'
  }
}

export class UnsplashApiClient {
  private config: UnsplashApiConfig
  private baseUrl: string

  constructor(config: UnsplashApiConfig) {
    this.config = config
    this.baseUrl = config.baseUrl || 'https://api.unsplash.com'
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Client-ID ${this.config.accessKey}`,
        'Accept-Version': 'v1',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new UnsplashApiError(
        errorData.errors?.[0] || `Unsplash API error: ${response.statusText}`,
        response.status
      )
    }

    return response.json()
  }

  /**
   * キーワードで画像を検索
   */
  async searchPhotos(options: UnsplashSearchOptions): Promise<UnsplashSearchResponse> {
    const params = new URLSearchParams({
      query: options.query,
      page: String(options.page || 1),
      per_page: String(options.perPage || 10),
      ...(options.orientation && { orientation: options.orientation }),
      ...(options.orderBy && { order_by: options.orderBy }),
    })

    return this.makeRequest<UnsplashSearchResponse>(`/search/photos?${params}`)
  }

  /**
   * ランダムな画像を取得（キーワード指定可能）
   */
  async getRandomPhoto(options: UnsplashRandomOptions = {}): Promise<UnsplashRandomResponse> {
    const params = new URLSearchParams({
      ...(options.query && { query: options.query }),
      ...(options.count && { count: String(options.count) }),
      ...(options.orientation && { orientation: options.orientation }),
    })

    const queryString = params.toString()
    return this.makeRequest<UnsplashRandomResponse>(`/photos/random${queryString ? `?${queryString}` : ''}`)
  }

  /**
   * 旅行の目的地に関連する画像を取得
   */
  async getTravelPhoto(destination: string): Promise<UnsplashPhoto | null> {
    try {
      // まず検索で関連画像を探す
      const searchResults = await this.searchPhotos({
        query: `${destination} travel tourism`,
        perPage: 5,
        orientation: 'landscape',
        orderBy: 'relevant'
      })

      if (searchResults.results.length > 0) {
        // 最初の結果を返す
        return searchResults.results[0]
      }

      // 検索結果がない場合はランダム画像を取得
      const randomPhoto = await this.getRandomPhoto({
        query: 'travel',
        orientation: 'landscape'
      })

      return randomPhoto as UnsplashPhoto
    } catch (error) {
      logger.error('Failed to fetch travel photo:', error)
      return null
    }
  }

  /**
   * 複数の画像オプションを取得
   */
  async getTravelPhotoOptions(destination: string, count: number = 3): Promise<UnsplashPhoto[]> {
    try {
      const searchResults = await this.searchPhotos({
        query: `${destination} travel tourism`,
        perPage: count,
        orientation: 'landscape',
        orderBy: 'relevant'
      })

      return searchResults.results.slice(0, count)
    } catch (error) {
      logger.error('Failed to fetch travel photo options:', error)
      return []
    }
  }
}

// シングルトンインスタンス
let unsplashClient: UnsplashApiClient | null = null

export function getUnsplashClient(): UnsplashApiClient {
  if (!unsplashClient) {
    const accessKey = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY || process.env.UNSPLASH_ACCESS_KEY
    
    if (!accessKey) {
      throw new Error('Unsplash access key is not configured. Please set NEXT_PUBLIC_UNSPLASH_ACCESS_KEY or UNSPLASH_ACCESS_KEY in your environment variables.')
    }

    unsplashClient = new UnsplashApiClient({ accessKey })
  }

  return unsplashClient
}

// 便利なヘルパー関数
export const unsplashApiHelpers = {
  /**
   * 旅行の目的地に関連する画像を取得
   */
  async getTravelPhoto(destination: string): Promise<string | null> {
    try {
      const client = getUnsplashClient()
      const photo = await client.getTravelPhoto(destination)
      
      if (photo) {
        return photo.urls.regular // 適度なサイズの画像URLを返す
      }
      
      return null
    } catch (error) {
      logger.error('Failed to get travel photo:', error)
      return null
    }
  },

  /**
   * 複数の画像オプションを取得
   */
  async getTravelPhotoOptions(destination: string, count: number = 3): Promise<Array<{ url: string; description?: string; photographer: string }>> {
    try {
      const client = getUnsplashClient()
      const photos = await client.getTravelPhotoOptions(destination, count)
      
      return photos.map(photo => ({
        url: photo.urls.regular,
        description: photo.description || photo.alt_description,
        photographer: photo.user.name
      }))
    } catch (error) {
      logger.error('Failed to get travel photo options:', error)
      return []
    }
  },

  /**
   * 画像のクレジット情報を取得
   */
  async getPhotoCredit(photoUrl: string): Promise<{ photographer: string; unsplashUrl: string } | null> {
    try {
      // 画像URLから写真IDを抽出（簡易実装）
      // 実際の実装では、より詳細な情報が必要
      return {
        photographer: 'Unsplash',
        unsplashUrl: 'https://unsplash.com'
      }
    } catch (error) {
      logger.error('Failed to get photo credit:', error)
      return null
    }
  }
}

// エクスポート
export { UnsplashApiError }
export default UnsplashApiClient
