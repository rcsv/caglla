import { initializeApp } from 'firebase/app'
import { getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, getDocs, getDoc, query, where, orderBy } from 'firebase/firestore'
import { firebaseConfig } from './firebase'

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)

// Firestore types
export interface User {
  id: string
  google_id: string
  name?: string
  email?: string
  preferred_currency?: string
  skip_confirm_delete?: boolean
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

// Collection names
export const COLLECTIONS = {
  USERS: 'users',
  TRIPS: 'trips',
  DAYS: 'days',
  ITINERARIES: 'itineraries',
  TRIP_USERS: 'trip_users'
} as const

// Helper functions for Firestore operations
export const firestoreHelpers = {
  // Convert Firestore document to typed object
  docToObject: <T>(doc: any): T => ({
    id: doc.id,
    ...doc.data(),
    created_at: doc.data().created_at?.toDate(),
    updated_at: doc.data().updated_at?.toDate()
  }),

  // Convert object to Firestore document data
  objectToDoc: (obj: any) => {
    const { id, ...data } = obj
    return {
      ...data,
      created_at: obj.created_at || new Date(),
      updated_at: new Date()
    }
  }
}
