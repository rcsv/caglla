/**
 * 地理情報・ジオコーディング関連の型定義
 */

// ============================================================================
// 地理情報関連
// ============================================================================

/**
 * 距離行列の結果
 */
export interface DistanceMatrixResult {
  distance: {
    text: string
    value: number
  }
  duration: {
    text: string
    value: number
  }
  status: string
}

/**
 * 距離行列のレスポンス
 */
export interface DistanceMatrixResponse {
  destination_addresses: string[]
  origin_addresses: string[]
  rows: Array<{
    elements: DistanceMatrixResult[]
  }>
  status: string
}

/**
 * ジオコーディングの結果
 */
export interface GeocodingResult {
  place_id: string
  formatted_address: string
  address_components: Array<{
    long_name: string
    short_name: string
    types: string[]
  }>
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
  types: string[]
}

/**
 * ジオコーディングのレスポンス
 */
export interface GeocodingResponse {
  results: GeocodingResult[]
  status: string
}

