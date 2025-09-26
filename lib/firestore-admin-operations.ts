import { adminDb } from './firebase-admin'
import { COLLECTIONS } from './firestore'
import type { User, Trip, Day, Itinerary, TripUser } from './firestore'

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
      .orderBy('created_at', 'desc')
      .get()
    
    return querySnapshot.docs.map(doc => adminFirestoreHelpers.docToObject<Trip>(doc))
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
      .orderBy('created_at', 'desc')
      .get()
    
    return querySnapshot.docs.map(doc => adminFirestoreHelpers.docToObject<Trip>(doc))
  }
}

// Day operations (Admin SDK version)
export const adminDayOperations = {
  async createDay(dayData: Omit<Day, 'id' | 'created_at' | 'updated_at'>): Promise<Day> {
    const docRef = await adminDb.collection(COLLECTIONS.DAYS).add({
      ...dayData,
      created_at: new Date(),
      updated_at: new Date()
    })
    
    const docSnap = await docRef.get()
    return adminFirestoreHelpers.docToObject<Day>(docSnap)
  },

  async getDaysByTripId(tripId: string): Promise<Day[]> {
    const querySnapshot = await adminDb.collection(COLLECTIONS.DAYS)
      .where('trip_id', '==', tripId)
      .orderBy('day_number', 'desc')
      .get()
    
    return querySnapshot.docs.map(doc => adminFirestoreHelpers.docToObject<Day>(doc))
  },

  async updateDay(dayId: string, dayData: Partial<Day>): Promise<void> {
    const dayRef = adminDb.collection(COLLECTIONS.DAYS).doc(dayId)
    await dayRef.update({
      ...dayData,
      updated_at: new Date()
    })
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
      .orderBy('sort_number', 'desc')
      .get()
    
    return querySnapshot.docs.map(doc => adminFirestoreHelpers.docToObject<Itinerary>(doc))
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
    
    return querySnapshot.docs.map(doc => adminFirestoreHelpers.docToObject<TripUser>(doc))
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