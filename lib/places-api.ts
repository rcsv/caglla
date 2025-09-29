// Google Places API integration utilities
import { PlaceData } from './firestore'
import type { PlaceSearchResult, PlaceDetailsResult } from './types'

// Re-export types for backward compatibility
export type { PlaceSearchResult, PlaceDetailsResult }

// Google Places API configuration
const GOOGLE_PLACES_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
const GOOGLE_PLACES_API_URL = 'https://maps.googleapis.com/maps/api/place'

export const placesApiHelpers = {
  // 場所を検索する
  async searchPlaces(query: string): Promise<PlaceSearchResult[]> {
    if (!GOOGLE_PLACES_API_KEY) {
      throw new Error('Google Places API key is not configured')
    }

    console.log('Searching places with query:', query)
    console.log('API Key configured:', !!GOOGLE_PLACES_API_KEY)

    try {
      // プロキシサーバー経由でAPIを呼び出し（CORS問題を回避）
      const response = await fetch('/api/places/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query })
      })

      console.log('Search response status:', response.status)

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
      console.error('Error searching places:', error)
      throw error
    }
  },

  // 場所の詳細情報を取得する
  async getPlaceDetails(placeId: string): Promise<PlaceDetailsResult> {
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
        body: JSON.stringify({ placeId })
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
        address_components: result.address_components?.map((component: any) => ({
          long_name: component.long_name,
          short_name: component.short_name,
          types: component.types || []
        })),
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
        })),
        opening_hours: result.opening_hours ? {
          open_now: result.opening_hours.open_now,
          weekday_text: result.opening_hours.weekday_text || []
        } : undefined,
        international_phone_number: result.international_phone_number,
        website: result.website
      }
    } catch (error) {
      console.error('Error getting place details:', error)
      throw error
    }
  },

  // 写真のURLを生成する
  getPhotoUrl(photoReference: string, maxWidth: number = 400): string {
    if (!GOOGLE_PLACES_API_KEY) {
      return ''
    }
    
    return `${GOOGLE_PLACES_API_URL}/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${GOOGLE_PLACES_API_KEY}`
  },

  // 場所の種類を日本語に変換する
  getTypeLabel(type: string): string {
    const typeLabels: { [key: string]: string } = {
      'tourist_attraction': '観光地',
      'restaurant': 'レストラン',
      'lodging': '宿泊施設',
      'shopping_mall': 'ショッピングモール',
      'airport': '空港',
      'train_station': '駅',
      'bus_station': 'バス停',
      'hospital': '病院',
      'bank': '銀行',
      'gas_station': 'ガソリンスタンド',
      'park': '公園',
      'museum': '博物館',
      'church': '教会',
      'temple': '寺院',
      'shrine': '神社',
      'zoo': '動物園',
      'aquarium': '水族館',
      'amusement_park': '遊園地',
      'beach': 'ビーチ',
      'mountain': '山',
      'lake': '湖',
      'river': '川',
      'island': '島',
      'city': '都市',
      'administrative_area_level_1': '都道府県',
      'administrative_area_level_2': '市区町村',
      'country': '国'
    }

    return typeLabels[type] || type
  },

  // 価格レベルを日本語に変換する
  getPriceLevelLabel(priceLevel: number): string {
    const labels = ['無料', '安い', '普通', '高い', 'とても高い']
    return labels[priceLevel] || '不明'
  }
}
