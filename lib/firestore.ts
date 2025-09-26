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
  created_at: Date
  updated_at: Date
}

export interface Trip {
  id: string
  user_id: string
  title: string
  description?: string
  destination?: string
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
