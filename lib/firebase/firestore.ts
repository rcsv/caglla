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
  TRIP_SHARES: 'trip_shares',
  USER_FOLLOWS: 'user_follows',
  COMMENT_LIKES: 'comment_likes',
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
  // DayEditorから呼び出される際に tripSlug が必要
  // Day オブジェクトから trip_id を取得できる必要があるが、ここでは持っていない
  // そのため、updates に trip_slug を含める必要がある
  // または、呼び出し元で trip_slug を取得して API 経由で更新する
  
  // 一時的な実装: クライアント側から直接更新を試みる
  // 注意: これは Firestore セキュリティルールで拒否される可能性がある
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
