import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore'

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
  status: string
  access_level: 'private' | 'public'
  image_url?: string
  created_at: Date
  updated_at: Date
  days?: Day[]
  creator?: User
}

export interface Day {
  id: string
  trip_id: string
  day_number: number
  date: Date
  description?: string
  created_at: Date
  updated_at: Date
  itineraries?: Itinerary[]
}

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
  created_at: Date
  updated_at: Date
}

export interface TripUser {
  id: string
  trip_id: string
  user_id: string
  created_at: Date
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

// Update day function
export async function updateDay(dayId: string, updates: Partial<Day>): Promise<Day> {
  const db = getFirestore()
  const dayRef = doc(db, COLLECTIONS.DAYS, dayId)
  
  const updateData = {
    ...updates,
    updated_at: new Date()
  }
  
  await updateDoc(dayRef, updateData)
  
  // Return updated day data
  const updatedDoc = await getDoc(dayRef)
  if (!updatedDoc.exists()) {
    throw new Error('Day not found')
  }
  
  return {
    id: updatedDoc.id,
    ...updatedDoc.data()
  } as Day
}
