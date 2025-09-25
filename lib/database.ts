import { createPool, Pool } from 'mysql2/promise'

let pool: Pool

export function getPool(): Pool {
  if (!pool) {
    pool = createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    })
  }
  return pool
}

// Database types
export interface User {
  google_id: string
  name?: string
  email?: string
  preferred_currency?: string
  skip_confirm_delete?: boolean
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
  trip_id: string
  user_id: string
  created_at: Date
}
