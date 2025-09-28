// 共通の型定義ファイル
// このファイルでプロジェクト全体で使用する型を定義します

// PlaceData型（Google Places APIのレスポンス）
export interface PlaceData {
  place_id: string
  name: string
  formatted_address: string
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
  address_components?: Array<{
    long_name: string
    short_name: string
    types: string[]
  }>
  photos?: Array<{
    photo_reference: string
    height: number
    width: number
  }>
  rating?: number
  user_ratings_total?: number
  price_level?: number
  types?: string[]
}

// Itinerary型（日程項目）
export interface Itinerary {
  id: string
  day_id: string
  sort_number: number
  title: string
  description?: string
  location?: string
  place_data?: PlaceData | null
  start_time?: string
  end_time?: string
  cost_amount?: number | null
  cost_currency?: string
  created_at: string
  updated_at: string
}

// Day型（日程）
export interface Day {
  id: string
  trip_id: string
  day_number: number
  description?: string
  created_at: string
  updated_at: string
  itineraries?: Itinerary[]
}

// User型（ユーザー）
export interface User {
  id: string
  name: string
  email: string
  avatar_url?: string
  google_id?: string
}

// Trip型（旅行）
export interface Trip {
  id: string
  user_id: string
  title: string
  description?: string
  start_date: string
  end_date: string
  status: string
  access_level: 'private' | 'public'
  image_url?: string
  destination?: string
  destination_place?: PlaceData
  created_at: string
  updated_at: string
  days?: Day[]
  creator?: User
}

// APIレスポンス用の型
export interface TripResponse extends Trip {
  // APIから返される追加フィールドがあればここに追加
}

export interface ItineraryResponse extends Itinerary {
  // APIから返される追加フィールドがあればここに追加
}

export interface DayResponse extends Day {
  // APIから返される追加フィールドがあればここに追加
}

// フォーム用の型（オプショナルフィールドを必須にする）
export interface TripFormData {
  title: string
  description?: string
  start_date: string
  end_date: string
  access_level: 'private' | 'public'
  image_url?: string
  destination?: string
}

export interface ItineraryFormData {
  title: string
  description?: string
  location?: string
  place_data?: PlaceData | null
  start_time?: string
  end_time?: string
  cost_amount?: number | null
  cost_currency?: string
}

export interface DayFormData {
  day_number: number
  description?: string
}
