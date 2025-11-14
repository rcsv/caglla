import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore'
import type { 
  User, 
  PlaceData, 
  Trip, 
  Day, 
  Itinerary, 
  TripUser, 
  TripResponse, 
  ItineraryResponse, 
  DayResponse, 
  TripFormData, 
  ItineraryFormData, 
  DayFormData 
} from '@/lib/core/types'

// Firestore collection names
export const COLLECTIONS = {
  USERS: 'users',
  TRIPS: 'trips',
  DAYS: 'days',
  ITINERARIES: 'itineraries',
  TRIP_USERS: 'trip_users',
  PLACES_CACHE: 'places_cache',
  // v3.0.0 SNS機能コレクション
  TRIP_LIKES: 'trip_likes',
  TRIP_COMMENTS: 'trip_comments',
  USER_FOLLOWS: 'user_follows',
} as const

// Re-export types for backward compatibility
export type { 
  User, 
  PlaceData, 
  Trip, 
  Day, 
  Itinerary, 
  TripUser, 
  TripResponse, 
  ItineraryResponse, 
  DayResponse, 
  TripFormData, 
  ItineraryFormData, 
  DayFormData 
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
