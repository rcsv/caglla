// Google Places API integration utilities
import { PlaceData } from '@/lib/core/types'
import logger from '@/lib/core/logger'
import { getUserLanguage, DEFAULT_LANGUAGE } from '@/lib/utils/language'
import type { PlaceSearchResult, PlaceDetailsResult, SupportedLanguage, User } from '@/lib/core/types'

// Re-export types for backward compatibility
export type { PlaceSearchResult, PlaceDetailsResult }

// Google Places API configuration
const GOOGLE_PLACES_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
const GOOGLE_PLACES_API_URL = 'https://maps.googleapis.com/maps/api/place'

export const placesApiHelpers = {
  // 場所を検索する
  async searchPlaces(
    query: string, 
    language: SupportedLanguage = DEFAULT_LANGUAGE,
    locationBias?: {
      circle?: { center: { latitude: number; longitude: number }; radius: number }
      rectangle?: { low: { latitude: number; longitude: number }; high: { latitude: number; longitude: number } }
    }
  ): Promise<PlaceSearchResult[]> {
    if (!GOOGLE_PLACES_API_KEY) {
      throw new Error('Google Places API key is not configured')
    }

    logger.debug('Searching places with query:', query)
    logger.debug('API Key configured:', !!GOOGLE_PLACES_API_KEY)

    try {
      // プロキシサーバー経由でAPIを呼び出し（CORS問題を回避）
      const response = await fetch('/api/places/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, language, locationBias })
      })

      logger.debug('Search response status:', response.status)

      if (!response.ok) {
        throw new Error(`Places API error: ${response.status}`)
      }

      const data = await response.json()
      
      // ZERO_RESULTSは正常なレスポンス（検索結果なし）
      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        throw new Error(`Places API error: ${data.status}`)
      }

      return data.results.map((result: any) => ({
        place_id: result.place_id,
        name: result.name,
        formatted_address: result.formatted_address,
        geometry: {
          location: {
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng
          }
        },
        types: result.types || [],
        rating: result.rating,
        price_level: result.price_level,
        photos: result.photos?.map((photo: any) => ({
          photo_reference: photo.photo_reference,
          height: photo.height,
          width: photo.width
        }))
      }))
    } catch (error) {
      logger.error('Error searching places:', error)
      throw error
    }
  },

  // 場所の詳細情報を取得する
  async getPlaceDetails(
    placeId: string, 
    language: SupportedLanguage = DEFAULT_LANGUAGE
  ): Promise<PlaceDetailsResult> {
    if (!GOOGLE_PLACES_API_KEY) {
      throw new Error('Google Places API key is not configured')
    }

    try {
      // プロキシサーバー経由でAPIを呼び出し（CORS問題を回避）
      const response = await fetch('/api/places/details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ placeId, language })
      })

      if (!response.ok) {
        throw new Error(`Places API error: ${response.status}`)
      }

      const data = await response.json()
      
      // ZERO_RESULTSは正常なレスポンス（検索結果なし）
      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        throw new Error(`Places API error: ${data.status}`)
      }

      const result = data.result
      return {
        place_id: result.place_id,
        name: result.name,
        formatted_address: result.formatted_address,
        // Basic Data（無料）
        address_components: result.address_components?.map((component: any) => ({
          long_name: component.long_name,
          short_name: component.short_name,
          types: component.types || []
        })),
        vicinity: result.vicinity,
        business_status: result.business_status,
        geometry: {
          location: {
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng
          }
        },
        types: result.types || [],
        photos: result.photos?.map((photo: any) => ({
          photo_reference: photo.photo_reference,
          height: photo.height,
          width: photo.width
        })),
        url: result.url,
        icon: result.icon,
        // Contact Data（$3.00/1,000件）
        formatted_phone_number: result.formatted_phone_number,
        international_phone_number: result.international_phone_number,
        website: result.website,
        opening_hours: result.opening_hours ? {
          open_now: result.opening_hours.open_now,
          weekday_text: result.opening_hours.weekday_text || []
        } : undefined,
        // Atmosphere Data（$5.00/1,000件）
        rating: result.rating,
        user_ratings_total: result.user_ratings_total,
        price_level: result.price_level,
        editorial_summary: result.editorial_summary ? {
          overview: result.editorial_summary.overview
        } : undefined,
        reviews: result.reviews?.map((review: any) => ({
          author_name: review.author_name,
          rating: review.rating,
          text: review.text,
          time: review.time,
          relative_time_description: review.relative_time_description
        }))
      }
    } catch (error) {
      logger.error('Error getting place details:', error)
      throw error
    }
  },

  // 写真のURLを生成する（プロキシ経由でCORS問題を解決）
  getPhotoUrl(photoReference: string, maxWidth: number = 800): string {
    if (!photoReference) {
      return ''
    }

    // プロキシエンドポイント経由で写真を取得（CORS問題を解決）
    const params = new URLSearchParams({
      photoreference: photoReference,
      maxwidth: maxWidth.toString()
    })

    return `/api/places/photo?${params.toString()}`
  },

  // レスポンシブな写真サイズを取得するヘルパー関数
  getResponsivePhotoSize(containerWidth: number = 400, devicePixelRatio: number = window.devicePixelRatio || 1): number {
    // デバイスピクセル比を考慮して適切なサイズを計算
    const baseSize = Math.min(containerWidth * devicePixelRatio, 1600) // 最大1600px
    return Math.max(baseSize, 200) // 最小200px
  },

  // 写真のURLをレスポンシブに生成する
  getResponsivePhotoUrl(photoReference: string, containerWidth: number = 400): string {
    if (!photoReference) {
      return ''
    }

    const size = this.getResponsivePhotoSize(containerWidth)
    return this.getPhotoUrl(photoReference, size)
  },

  // 場所の種類を英語で表示する（多言語対応のため日本語ラベルを廃止）
  getTypeLabel(type: string): string {
    // シンプルに英語のまま表示（多言語対応のため）
    // 日本語ラベルは廃止して、英語のまま表示することでバグ感を解消
    return type
  },

  // 価格レベルを英語で表示する（多言語対応のため日本語ラベルを廃止）
  getPriceLevelLabel(priceLevel: number): string {
    // シンプルに英語のまま表示（多言語対応のため）
    const labels = ['Free', 'Inexpensive', 'Moderate', 'Expensive', 'Very Expensive']
    return labels[priceLevel] || 'Unknown'
  }
}
