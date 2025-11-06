/**
 * 旅行・旅程関連の型定義
 */

import type { FirestoreDate, AccessLevel } from './common'
import type { PlaceData } from './place'
import type { ActivityTag } from './activity'
import type { User } from './user'

// 循環依存を避けるため、ReservationInfoは後でインポート
// import type { ReservationInfo } from './reservation'

// ============================================================================
// 旅行・旅程関連
// ============================================================================

/**
 * Itinerary（旅程）
 */
export interface Itinerary {
  id: string
  day_id: string
  sort_number: number
  title: string
  description?: string
  location?: string
  // Firestoreには place_id を保存し、実体は places_cache から解決する
  place_id?: string | null
  place_data?: PlaceData | null
  start_time?: string
  end_time?: string
  timezone?: string
  cost_amount?: number | null
  cost_currency?: string
  // アクティビティタグ（2段階分類）
  activity_tag?: ActivityTag | null
  // 予約情報（ReservationInfoは循環依存回避のためanyで型付け）
  reservation?: any | null  // ReservationInfo
  created_at: FirestoreDate
  updated_at: FirestoreDate
}

/**
 * Day（日程）
 */
export interface Day {
  id: string
  trip_id: string
  day_number: number
  date: FirestoreDate
  description?: string
  created_at: FirestoreDate
  updated_at: FirestoreDate
  itineraries?: Itinerary[]
}

/**
 * Trip（旅行）
 */
export interface Trip {
  id: string
  user_id: string
  title: string
  slug?: string // URL-safe スラッグ
  description?: string
  destination?: string // 後方互換性のため残す
  // Firestoreには destination_place_id を保存し、実体は places_cache から解決する
  destination_place_id?: string
  destination_place?: PlaceData // UI向けに解決済みのデータ（読み取り時に付与）
  start_date?: FirestoreDate
  end_date?: FirestoreDate
  status: string
  access_level: AccessLevel | 'private' | 'public'  // 後方互換性のため両方許可
  image_url?: string
  ical_public_token?: string // iCal公開用トークン（UUID）
  ical_enabled?: boolean // iCal公開が有効かどうか
  ical_last_accessed_at?: FirestoreDate // iCal最終アクセス日時（統計用）
  default_currency?: string // デフォルト通貨コード（例: 'USD', 'JPY', 'EUR'）
  created_at: FirestoreDate
  updated_at: FirestoreDate
  days?: Day[]
  creator?: User
}

/**
 * TripUser（旅行参加者）
 */
export interface TripUser {
  id: string
  trip_id: string
  user_id: string
  created_at: FirestoreDate
}

