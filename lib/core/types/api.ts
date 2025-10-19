/**
 * API レスポンス用の型定義
 */

import type { Trip, Day, Itinerary } from './trip'
import type { PlaceData } from './place'
import type { ActivityTag } from './activity'
import type { AccessLevel } from './common'

// ============================================================================
// API レスポンス用の型
// ============================================================================

/**
 * Trip API レスポンス
 */
export interface TripResponse extends Trip {
  // APIから返される追加フィールドがあればここに追加
}

/**
 * Itinerary API レスポンス
 */
export interface ItineraryResponse extends Itinerary {
  // APIから返される追加フィールドがあればここに追加
}

/**
 * Day API レスポンス
 */
export interface DayResponse extends Day {
  // APIから返される追加フィールドがあればここに追加
}

/**
 * Place検索結果（Places APIから返されるデータ）
 */
export interface PlaceSearchResult {
  place_id: string
  name: string
  formatted_address: string
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
  types: string[]
  rating?: number
  price_level?: number
  photos?: Array<{
    photo_reference: string
    height: number
    width: number
  }>
}

/**
 * Place詳細結果（PlaceDataと同じ、後方互換性のためのエイリアス）
 */
export interface PlaceDetailsResult extends PlaceData {}

// ============================================================================
// フォーム用の型（オプショナルフィールドを必須にする）
// ============================================================================

/**
 * Trip作成・更新フォームデータ
 */
export interface TripFormData {
  title: string
  description?: string
  start_date: string
  end_date: string
  access_level: AccessLevel | 'private' | 'public'  // 後方互換性のため両方許可
  image_url?: string
  destination?: string
}

/**
 * Itinerary作成・更新フォームデータ
 */
export interface ItineraryFormData {
  title: string
  description?: string
  location?: string
  // 新設: 保存は place_id を推奨（place_data は後方互換）
  place_id?: string | null
  place_data?: PlaceData | null
  start_time?: string
  end_time?: string
  timezone?: string
  cost_amount?: number | null
  cost_currency?: string
  activity_tag?: ActivityTag | null
}

/**
 * Day作成・更新フォームデータ
 */
export interface DayFormData {
  day_number: number
  description?: string
}

