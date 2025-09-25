import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore'
import { db, COLLECTIONS, firestoreHelpers } from './firestore'
import type { User, Trip, Day, Itinerary, TripUser } from './firestore'

// User operations
export const userOperations = {
  async createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const docRef = await addDoc(collection(db, COLLECTIONS.USERS), {
      ...userData,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    })
    
    const docSnap = await getDoc(docRef)
    return firestoreHelpers.docToObject<User>(docSnap)
  },

  async getUserByGoogleId(googleId: string): Promise<User | null> {
    const q = query(collection(db, COLLECTIONS.USERS), where('google_id', '==', googleId))
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) return null
    
    return firestoreHelpers.docToObject<User>(querySnapshot.docs[0])
  },

  async updateUser(userId: string, userData: Partial<User>): Promise<void> {
    const userRef = doc(db, COLLECTIONS.USERS, userId)
    await updateDoc(userRef, {
      ...userData,
      updated_at: serverTimestamp()
    })
  }
}

// Trip operations
export const tripOperations = {
  async createTrip(tripData: Omit<Trip, 'id' | 'created_at' | 'updated_at'>): Promise<Trip> {
    const docRef = await addDoc(collection(db, COLLECTIONS.TRIPS), {
      ...tripData,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    })
    
    const docSnap = await getDoc(docRef)
    return firestoreHelpers.docToObject<Trip>(docSnap)
  },

  async getTripsByUserId(userId: string): Promise<Trip[]> {
    const q = query(
      collection(db, COLLECTIONS.TRIPS), 
      where('user_id', '==', userId),
      orderBy('created_at', 'desc')
    )
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => firestoreHelpers.docToObject<Trip>(doc))
  },

  async getTripById(tripId: string): Promise<Trip | null> {
    const docRef = doc(db, COLLECTIONS.TRIPS, tripId)
    const docSnap = await getDoc(docRef)
    
    if (!docSnap.exists()) return null
    
    return firestoreHelpers.docToObject<Trip>(docSnap)
  },

  async updateTrip(tripId: string, tripData: Partial<Trip>): Promise<void> {
    const tripRef = doc(db, COLLECTIONS.TRIPS, tripId)
    await updateDoc(tripRef, {
      ...tripData,
      updated_at: serverTimestamp()
    })
  },

  async deleteTrip(tripId: string): Promise<void> {
    // Delete related days and itineraries first
    await dayOperations.deleteDaysByTripId(tripId)
    
    // Delete trip
    const tripRef = doc(db, COLLECTIONS.TRIPS, tripId)
    await deleteDoc(tripRef)
  },

  async getPublicTrips(): Promise<Trip[]> {
    const q = query(
      collection(db, COLLECTIONS.TRIPS), 
      where('access_level', '==', 'public'),
      orderBy('created_at', 'desc')
    )
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => firestoreHelpers.docToObject<Trip>(doc))
  }
}

// Day operations
export const dayOperations = {
  async createDay(dayData: Omit<Day, 'id' | 'created_at' | 'updated_at'>): Promise<Day> {
    const docRef = await addDoc(collection(db, COLLECTIONS.DAYS), {
      ...dayData,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    })
    
    const docSnap = await getDoc(docRef)
    return firestoreHelpers.docToObject<Day>(docSnap)
  },

  async getDaysByTripId(tripId: string): Promise<Day[]> {
    const q = query(
      collection(db, COLLECTIONS.DAYS), 
      where('trip_id', '==', tripId),
      orderBy('day_number', 'asc')
    )
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => firestoreHelpers.docToObject<Day>(doc))
  },

  async updateDay(dayId: string, dayData: Partial<Day>): Promise<void> {
    const dayRef = doc(db, COLLECTIONS.DAYS, dayId)
    await updateDoc(dayRef, {
      ...dayData,
      updated_at: serverTimestamp()
    })
  },

  async deleteDaysByTripId(tripId: string): Promise<void> {
    const days = await this.getDaysByTripId(tripId)
    
    for (const day of days) {
      // Delete related itineraries first
      await itineraryOperations.deleteItinerariesByDayId(day.id)
      
      // Delete day
      const dayRef = doc(db, COLLECTIONS.DAYS, day.id)
      await deleteDoc(dayRef)
    }
  }
}

// Itinerary operations
export const itineraryOperations = {
  async createItinerary(itineraryData: Omit<Itinerary, 'id' | 'created_at' | 'updated_at'>): Promise<Itinerary> {
    const docRef = await addDoc(collection(db, COLLECTIONS.ITINERARIES), {
      ...itineraryData,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    })
    
    const docSnap = await getDoc(docRef)
    return firestoreHelpers.docToObject<Itinerary>(docSnap)
  },

  async getItinerariesByDayId(dayId: string): Promise<Itinerary[]> {
    const q = query(
      collection(db, COLLECTIONS.ITINERARIES), 
      where('day_id', '==', dayId),
      orderBy('sort_number', 'asc')
    )
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => firestoreHelpers.docToObject<Itinerary>(doc))
  },

  async updateItinerary(itineraryId: string, itineraryData: Partial<Itinerary>): Promise<void> {
    const itineraryRef = doc(db, COLLECTIONS.ITINERARIES, itineraryId)
    await updateDoc(itineraryRef, {
      ...itineraryData,
      updated_at: serverTimestamp()
    })
  },

  async deleteItinerary(itineraryId: string): Promise<void> {
    const itineraryRef = doc(db, COLLECTIONS.ITINERARIES, itineraryId)
    await deleteDoc(itineraryRef)
  },

  async deleteItinerariesByDayId(dayId: string): Promise<void> {
    const itineraries = await this.getItinerariesByDayId(dayId)
    
    for (const itinerary of itineraries) {
      const itineraryRef = doc(db, COLLECTIONS.ITINERARIES, itinerary.id)
      await deleteDoc(itineraryRef)
    }
  }
}

// TripUser operations (for sharing trips)
export const tripUserOperations = {
  async addUserToTrip(tripId: string, userId: string): Promise<TripUser> {
    const docRef = await addDoc(collection(db, COLLECTIONS.TRIP_USERS), {
      trip_id: tripId,
      user_id: userId,
      created_at: serverTimestamp()
    })
    
    const docSnap = await getDoc(docRef)
    return firestoreHelpers.docToObject<TripUser>(docSnap)
  },

  async getUsersByTripId(tripId: string): Promise<TripUser[]> {
    const q = query(collection(db, COLLECTIONS.TRIP_USERS), where('trip_id', '==', tripId))
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => firestoreHelpers.docToObject<TripUser>(doc))
  },

  async getTripsByUserId(userId: string): Promise<TripUser[]> {
    const q = query(collection(db, COLLECTIONS.TRIP_USERS), where('user_id', '==', userId))
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => firestoreHelpers.docToObject<TripUser>(doc))
  },

  async removeUserFromTrip(tripId: string, userId: string): Promise<void> {
    const q = query(
      collection(db, COLLECTIONS.TRIP_USERS), 
      where('trip_id', '==', tripId),
      where('user_id', '==', userId)
    )
    const querySnapshot = await getDocs(q)
    
    for (const docSnap of querySnapshot.docs) {
      await deleteDoc(docSnap.ref)
    }
  }
}
