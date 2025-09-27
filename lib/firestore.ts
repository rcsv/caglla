// Firestore collection names
export const COLLECTIONS = {
  USERS: 'users',
  TRIPS: 'trips',
  DAYS: 'days',
  ITINERARIES: 'itineraries',
  TRIP_USERS: 'trip_users'
} as const

// Type definitions for Firestore documents
export interface User {
  id: string
  google_id: string
  name: string
  email: string
  profile_image_url?: string
  preferences?: {
    currency?: string
    home_address?: string
    timezone?: string
    language?: string
    theme?: 'light' | 'dark'
    notifications?: boolean
  }
  created_at: Date
  updated_at: Date
}

export interface PlaceData {
  place_id: string
  name: string
  formatted_address: string
  address_components?: Array<{
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
  photos?: Array<{
    photo_reference: string
    height: number
    width: number
  }>
  rating?: number
  price_level?: number
  opening_hours?: {
    open_now: boolean
    weekday_text: string[]
  }
  international_phone_number?: string
  website?: string
}

export interface Trip {
  id: string
  user_id: string
  title: string
  description?: string
  destination?: string // 後方互換性のため残す
  destination_place?: PlaceData // 新しいGoogle Places API連携フィールド
  start_date?: Date
  end_date?: Date
  access_level: 'private' | 'public'
  image_url?: string
  created_at: Date
  updated_at: Date
}

export interface Day {
  id: string
  trip_id: string
  day_number: number
  date: Date
  description?: string
  created_at: Date
  updated_at: Date
}

export interface Itinerary {
  id: string
  day_id: string
  sort_number: number
  title: string
  description?: string
  location?: string
  start_time?: string
  end_time?: string
  created_at: Date
  updated_at: Date
}

export interface TripUser {
  id: string
  trip_id: string
  user_id: string
  created_at: Date
}
