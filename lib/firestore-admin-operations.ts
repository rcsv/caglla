import { adminDb } from './firebase-admin'
import { COLLECTIONS } from '@/lib/firestore'
import type { User, Trip, Day, Itinerary, TripUser } from '@/lib/firestore'

// Helper functions for Firestore Admin operations
const adminFirestoreHelpers = {
  // Convert Firestore document to typed object
  docToObject: <T>(doc: any): T => {
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      created_at: data.created_at?.toDate ? data.created_at.toDate() : data.created_at,
      updated_at: data.updated_at?.toDate ? data.updated_at.toDate() : data.updated_at,
      start_date: data.start_date?.toDate ? data.start_date.toDate() : data.start_date,
      end_date: data.end_date?.toDate ? data.end_date.toDate() : data.end_date,
      date: data.date?.toDate ? data.date.toDate() : data.date,
      // destination_place is already an object, no conversion needed
    } as T
  }
}

// User operations (Admin SDK version)
export const adminUserOperations = {
  async createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const docRef = await adminDb.collection(COLLECTIONS.USERS).add({
      ...userData,
      created_at: new Date(),
      updated_at: new Date()
    })
    
    const docSnap = await docRef.get()
    return adminFirestoreHelpers.docToObject<User>(docSnap)
  },

  async getUserByGoogleId(googleId: string): Promise<User | null> {
    const querySnapshot = await adminDb.collection(COLLECTIONS.USERS)
      .where('google_id', '==', googleId)
      .get()
    
    if (querySnapshot.empty) return null
    
    return adminFirestoreHelpers.docToObject<User>(querySnapshot.docs[0])
  },

  async updateUser(userId: string, userData: Partial<User>): Promise<void> {
    const userRef = adminDb.collection(COLLECTIONS.USERS).doc(userId)
    await userRef.update({
      ...userData,
      updated_at: new Date()
    })
  },

  async createOrUpdateUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    // 既存のユーザーを検索
    const existingUser = await this.getUserByGoogleId(userData.google_id)
    
    if (existingUser) {
      // 既存ユーザーの場合、preferencesのみ更新
      const updatedPreferences = {
        ...existingUser.preferences,
        ...userData.preferences
      }
      
      await this.updateUser(existingUser.id, {
        preferences: updatedPreferences,
        name: userData.name,
        email: userData.email,
        profile_image_url: userData.profile_image_url
      })
      
      return {
        ...existingUser,
        ...userData,
        preferences: updatedPreferences,
        updated_at: new Date()
      }
    } else {
      // 新規ユーザーの場合、作成
      return await this.createUser(userData)
    }
  }
}

// Trip operations (Admin SDK version)
export const adminTripOperations = {
  async createTrip(tripData: Omit<Trip, 'id' | 'created_at' | 'updated_at'>): Promise<Trip> {
    const docRef = await adminDb.collection(COLLECTIONS.TRIPS).add({
      ...tripData,
      created_at: new Date(),
      updated_at: new Date()
    })
    
    const docSnap = await docRef.get()
    return adminFirestoreHelpers.docToObject<Trip>(docSnap)
  },

  async getTripsByUserId(userId: string): Promise<Trip[]> {
    const querySnapshot = await adminDb.collection(COLLECTIONS.TRIPS)
      .where('user_id', '==', userId)
      .get()
    
    const trips = querySnapshot.docs.map(doc => adminFirestoreHelpers.docToObject<Trip>(doc))
    
    // Sort by created_at on the client side (descending)
    return trips.sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
  },

  async getTripById(tripId: string): Promise<Trip | null> {
    const docRef = adminDb.collection(COLLECTIONS.TRIPS).doc(tripId)
    const docSnap = await docRef.get()
    
    if (!docSnap.exists) return null
    
    return adminFirestoreHelpers.docToObject<Trip>(docSnap)
  },

  async updateTrip(tripId: string, tripData: Partial<Trip>): Promise<void> {
    const tripRef = adminDb.collection(COLLECTIONS.TRIPS).doc(tripId)
    await tripRef.update({
      ...tripData,
      updated_at: new Date()
    })
  },

  async deleteTrip(tripId: string): Promise<void> {
    // Delete related days and itineraries first
    await adminDayOperations.deleteDaysByTripId(tripId)
    
    // Delete trip
    const tripRef = adminDb.collection(COLLECTIONS.TRIPS).doc(tripId)
    await tripRef.delete()
  },

  async getPublicTrips(): Promise<Trip[]> {
    const querySnapshot = await adminDb.collection(COLLECTIONS.TRIPS)
      .where('access_level', '==', 'public')
      .get()
    
    const trips = querySnapshot.docs.map(doc => adminFirestoreHelpers.docToObject<Trip>(doc))
    
    // Sort by created_at on the client side (descending)
    return trips.sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
  }
}

// Day operations (Admin SDK version)
export const adminDayOperations = {
  async createDay(dayData: Omit<Day, 'id' | 'created_at' | 'updated_at'>): Promise<Day> {
    // undefined値をフィルタリング
    const cleanDayData = Object.fromEntries(
      Object.entries(dayData).filter(([_, value]) => value !== undefined)
    )
    
    const docRef = await adminDb.collection(COLLECTIONS.DAYS).add({
      ...cleanDayData,
      created_at: new Date(),
      updated_at: new Date()
    })
    
    const docSnap = await docRef.get()
    return adminFirestoreHelpers.docToObject<Day>(docSnap)
  },

  async getDaysByTripId(tripId: string): Promise<Day[]> {
    const querySnapshot = await adminDb.collection(COLLECTIONS.DAYS)
      .where('trip_id', '==', tripId)
      .get()
    
    const days = querySnapshot.docs.map(doc => adminFirestoreHelpers.docToObject<Day>(doc))
    
    // Sort by day_number on the client side
    return days.sort((a, b) => a.day_number - b.day_number)
  },

  async updateDay(dayId: string, dayData: Partial<Day>): Promise<void> {
    const dayRef = adminDb.collection(COLLECTIONS.DAYS).doc(dayId)
    await dayRef.update({
      ...dayData,
      updated_at: new Date()
    })
  },

  async deleteDay(dayId: string): Promise<void> {
    // Delete related itineraries first
    await adminItineraryOperations.deleteItinerariesByDayId(dayId)
    
    // Delete day
    const dayRef = adminDb.collection(COLLECTIONS.DAYS).doc(dayId)
    await dayRef.delete()
  },

  async deleteDaysByTripId(tripId: string): Promise<void> {
    const days = await this.getDaysByTripId(tripId)
    
    for (const day of days) {
      // Delete related itineraries first
      await adminItineraryOperations.deleteItinerariesByDayId(day.id)
      
      // Delete day
      const dayRef = adminDb.collection(COLLECTIONS.DAYS).doc(day.id)
      await dayRef.delete()
    }
  },

  async updateDaysForTrip(tripId: string, startDate: Date, endDate: Date): Promise<void> {
    // 既存のdayドキュメントを削除
    await this.deleteDaysByTripId(tripId)
    
    // 新しい日程でdayドキュメントを作成
    const start = new Date(startDate)
    const end = new Date(endDate)
    const days: Omit<Day, 'id' | 'created_at' | 'updated_at'>[] = []
    
    let currentDate = new Date(start)
    let dayNumber = 1
    
    while (currentDate <= end) {
      const dayData: Omit<Day, 'id' | 'created_at' | 'updated_at'> = {
        trip_id: tripId,
        day_number: dayNumber,
        date: new Date(currentDate)
      }
      
      // descriptionは省略（undefinedではなく存在しないフィールドとして扱う）
      days.push(dayData)
      
      currentDate.setDate(currentDate.getDate() + 1)
      dayNumber++
    }
    
    // 新しいdayドキュメントを作成
    for (const dayData of days) {
      await this.createDay(dayData)
    }
  },

  async updateDaysForTripAtomic(tripId: string, startDate: Date, endDate: Date): Promise<void> {
    // トランザクションを使用してアトミックに更新
    await adminDb.runTransaction(async (transaction) => {
      // 既存のdayドキュメントを取得
      const existingDaysQuery = adminDb.collection(COLLECTIONS.DAYS)
        .where('trip_id', '==', tripId)
      
      const existingDaysSnapshot = await transaction.get(existingDaysQuery)
      
      // 既存のdayドキュメントを削除
      existingDaysSnapshot.docs.forEach(doc => {
        transaction.delete(doc.ref)
      })
      
      // 新しい日程でdayドキュメントを作成
      const start = new Date(startDate)
      const end = new Date(endDate)
      
      let currentDate = new Date(start)
      let dayNumber = 1
      
      while (currentDate <= end) {
        const dayRef = adminDb.collection(COLLECTIONS.DAYS).doc()
        
        const dayData = {
          trip_id: tripId,
          day_number: dayNumber,
          date: new Date(currentDate),
          created_at: new Date(),
          updated_at: new Date()
        }
        
        transaction.set(dayRef, dayData)
        
        currentDate.setDate(currentDate.getDate() + 1)
        dayNumber++
      }
    })
  }
}

// Itinerary operations (Admin SDK version)
export const adminItineraryOperations = {
  async createItinerary(itineraryData: Omit<Itinerary, 'id' | 'created_at' | 'updated_at'>): Promise<Itinerary> {
    const docRef = await adminDb.collection(COLLECTIONS.ITINERARIES).add({
      ...itineraryData,
      created_at: new Date(),
      updated_at: new Date()
    })
    
    const docSnap = await docRef.get()
    return adminFirestoreHelpers.docToObject<Itinerary>(docSnap)
  },

  async getItinerariesByDayId(dayId: string): Promise<Itinerary[]> {
    const querySnapshot = await adminDb.collection(COLLECTIONS.ITINERARIES)
      .where('day_id', '==', dayId)
      .get()
    
    const itineraries = querySnapshot.docs.map(doc => adminFirestoreHelpers.docToObject<Itinerary>(doc))
    
    // Sort by sort_number on the client side (descending)
    return itineraries.sort((a, b) => b.sort_number - a.sort_number)
  },

  async updateItinerary(itineraryId: string, itineraryData: Partial<Itinerary>): Promise<void> {
    const itineraryRef = adminDb.collection(COLLECTIONS.ITINERARIES).doc(itineraryId)
    await itineraryRef.update({
      ...itineraryData,
      updated_at: new Date()
    })
  },

  async deleteItinerary(itineraryId: string): Promise<void> {
    const itineraryRef = adminDb.collection(COLLECTIONS.ITINERARIES).doc(itineraryId)
    await itineraryRef.delete()
  },

  async deleteItinerariesByDayId(dayId: string): Promise<void> {
    const itineraries = await this.getItinerariesByDayId(dayId)
    
    for (const itinerary of itineraries) {
      const itineraryRef = adminDb.collection(COLLECTIONS.ITINERARIES).doc(itinerary.id)
      await itineraryRef.delete()
    }
  }
}

// TripUser operations (Admin SDK version)
export const adminTripUserOperations = {
  async addUserToTrip(tripId: string, userId: string): Promise<TripUser> {
    const docRef = await adminDb.collection(COLLECTIONS.TRIP_USERS).add({
      trip_id: tripId,
      user_id: userId,
      created_at: new Date()
    })
    
    const docSnap = await docRef.get()
    return adminFirestoreHelpers.docToObject<TripUser>(docSnap)
  },

  async getUsersByTripId(tripId: string): Promise<TripUser[]> {
    const querySnapshot = await adminDb.collection(COLLECTIONS.TRIP_USERS)
      .where('trip_id', '==', tripId)
      .get()
    
    return querySnapshot.docs.map(doc => adminFirestoreHelpers.docToObject<TripUser>(doc))
  },

  async getTripsByUserId(userId: string): Promise<TripUser[]> {
    const querySnapshot = await adminDb.collection(COLLECTIONS.TRIP_USERS)
      .where('user_id', '==', userId)
      .get()
    
    const tripUsers = querySnapshot.docs.map(doc => adminFirestoreHelpers.docToObject<TripUser>(doc))
    
    // Sort by created_at on the client side (descending)
    return tripUsers.sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
  },

  async removeUserFromTrip(tripId: string, userId: string): Promise<void> {
    const querySnapshot = await adminDb.collection(COLLECTIONS.TRIP_USERS)
      .where('trip_id', '==', tripId)
      .where('user_id', '==', userId)
      .get()
    
    for (const docSnap of querySnapshot.docs) {
      await docSnap.ref.delete()
    }
  }
}