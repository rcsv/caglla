// Google Geocoding API integration utilities
import { PlaceData } from '@/lib/core/types'
import logger from '@/lib/core/logger'
import type { GeocodingResult, GeocodingResponse } from '@/lib/core/types'

// Google Geocoding API configuration
const GOOGLE_GEOCODING_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY // 同じAPIキーを使用
const GOOGLE_GEOCODING_API_URL = 'https://maps.googleapis.com/maps/api/geocode'

export const geocodingApiHelpers = {
  // 住所から地理情報を取得する
  async geocodeAddress(address: string): Promise<GeocodingResult[]> {
    if (!GOOGLE_GEOCODING_API_KEY) {
      throw new Error('Google Geocoding API key is not configured')
    }

    logger.debug('Geocoding address:', address)

    try {
      // サーバーサイドでは直接Google Geocoding APIを呼び出し
      const response = await fetch(
        `${GOOGLE_GEOCODING_API_URL}/json?address=${encodeURIComponent(address)}&key=${GOOGLE_GEOCODING_API_KEY}&language=ja&region=jp`
      )

      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        throw new Error(`Geocoding API error: ${data.status}`)
      }

      return data.results || []
    } catch (error) {
      logger.error('Error geocoding address:', error)
      throw error
    }
  },

  // 座標から住所を取得する（逆ジオコーディング）
  async reverseGeocode(lat: number, lng: number): Promise<GeocodingResult[]> {
    if (!GOOGLE_GEOCODING_API_KEY) {
      throw new Error('Google Geocoding API key is not configured')
    }

    logger.debug('Reverse geocoding coordinates:', lat, lng)

    try {
      // サーバーサイドでは直接Google Geocoding APIを呼び出し
      const response = await fetch(
        `${GOOGLE_GEOCODING_API_URL}/json?latlng=${lat},${lng}&key=${GOOGLE_GEOCODING_API_KEY}&language=ja&region=jp`
      )

      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        throw new Error(`Geocoding API error: ${data.status}`)
      }

      return data.results || []
    } catch (error) {
      logger.error('Error reverse geocoding:', error)
      throw error
    }
  },

  // Geocoding結果からPlaceData形式に変換
  convertToPlaceData(geocodingResult: GeocodingResult): PlaceData {
    return {
      place_id: geocodingResult.place_id,
      name: geocodingResult.formatted_address,
      formatted_address: geocodingResult.formatted_address,
      address_components: geocodingResult.address_components,
      geometry: geocodingResult.geometry,
      types: geocodingResult.types
    }
  }
}
