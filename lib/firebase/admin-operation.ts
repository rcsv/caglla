import { adminDb, adminStorage } from './admin'
import { COLLECTIONS } from '@/lib/firebase/firestore'
import type { User, Trip, Day, Itinerary, TripUser } from '@/lib/core/types'
import { convertStandardDates, toDateOrNull } from './timestamp-utils'
import logger from '@/lib/core/logger'

// Helper functions for Firestore Admin operations
const adminFirestoreHelpers = {
  // Convert Firestore document to typed object
  docToObject: <T>(doc: any): T => {
    return convertStandardDates({
      id: doc.id,
      ...doc.data(),
    }) as T
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

  /**
   * Firebase Auth UIDでユーザーを取得（推奨）
   * Phase 1-1.5: 認証プロバイダーマルチ対応化
   * 
   * まず auth_uid で検索し、見つからなければ google_id で検索（後方互換性）
   */
  async getUserByAuthUid(authUid: string): Promise<User | null> {
    // まず auth_uid で検索
    const byAuthUid = await adminDb
      .collection(COLLECTIONS.USERS)
      .where('auth_uid', '==', authUid)
      .limit(1)
      .get()
    
    if (!byAuthUid.empty) {
      return adminFirestoreHelpers.docToObject<User>(byAuthUid.docs[0])
    }
    
    // 後方互換性: google_id で検索
    return this.getUserByGoogleId(authUid)
  },

  /**
   * Google IDでユーザーを取得（後方互換性のため残す）
   * Phase 1-1.5: 認証プロバイダーマルチ対応化
   * 
   * @deprecated getUserByAuthUid() の使用を推奨
   */
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
    // 既存のユーザーを検索（auth_uid または google_id で検索）
    // Phase 1-1.5: 認証プロバイダーマルチ対応化
    const existingUser = userData.auth_uid
      ? await this.getUserByAuthUid(userData.auth_uid)
      : userData.google_id
      ? await this.getUserByGoogleId(userData.google_id)
      : null
    
    if (existingUser) {
      // 既存ユーザーの場合、明示的に変更されたフィールドのみ更新
      const updateData: any = {}
      
      // preferencesは常に更新
      if (userData.preferences) {
        // マージ時にundefinedの値を除外する
        const cleanedPreferences = Object.entries(userData.preferences).reduce((acc, [key, value]) => {
          if (value !== undefined) {
            acc[key] = value
          }
          return acc
        }, {} as any)
        
        updateData.preferences = {
          ...existingUser.preferences,
          ...cleanedPreferences
        }
      }
      
      // 既存ユーザーにplanIdがない場合はデフォルト値を設定
      if (!existingUser.planId) {
        updateData.planId = 'season_traveler'
      }
      
      // 名前が明示的に変更された場合のみ更新
      if (userData.name && userData.name !== existingUser.name) {
        updateData.name = userData.name
        updateData.slug = userData.slug
      }
      
      // メールが明示的に変更された場合のみ更新
      if (userData.email && userData.email !== existingUser.email) {
        updateData.email = userData.email
      }
      
      // プロフィール画像が明示的に変更された場合のみ更新
      if (userData.profile_image_url && userData.profile_image_url !== existingUser.profile_image_url) {
        updateData.profile_image_url = userData.profile_image_url
      }

      // bioが明示的に変更された場合のみ更新
      if (userData.bio !== undefined && userData.bio !== existingUser.bio) {
        updateData.bio = userData.bio
      }

      // genderが明示的に変更された場合のみ更新
      if (userData.gender !== undefined && userData.gender !== existingUser.gender) {
        updateData.gender = userData.gender
      }
      
      if (Object.keys(updateData).length > 0) {
        await this.updateUser(existingUser.id, updateData)
      }
      
      return {
        ...existingUser,
        ...updateData,
        updated_at: new Date()
      }
    } else {
      // 新規ユーザーの場合、auth_uidを設定（google_idから取得、または指定されたauth_uidを使用）
      // Phase 1-1.5: 認証プロバイダーマルチ対応化
      const userDataWithAuthUid = {
        ...userData,
        // auth_uidが指定されていない場合、google_idを使用（後方互換性）
        auth_uid: userData.auth_uid || userData.google_id || '',
        // google_idが指定されている場合、後方互換性のため保持
        google_id: userData.google_id || (userData.auth_uid ? undefined : undefined)
      }
      
      // auth_uidが設定されていない場合はエラー
      if (!userDataWithAuthUid.auth_uid) {
        throw new Error('auth_uid or google_id is required for user creation')
      }
      
      return await this.createUser(userDataWithAuthUid)
    }
  }
}

// Trip operations (Admin SDK version)
export const adminTripOperations = {
  /**
   * tripId or tripSlug いずれかを受け取り、確実に Trip を解決する
   * - まずはIDとして doc() 直叩き
   * - 見つからなければ slug フィールドで検索
   * 見つからない場合は null
   */
  async resolveTripByIdOrSlug(idOrSlug: string): Promise<{ id: string; trip: Trip } | null> {
    // Try as document ID
    const byId = await adminDb.collection(COLLECTIONS.TRIPS).doc(idOrSlug).get()
    if (byId.exists) {
      return { id: byId.id, trip: adminFirestoreHelpers.docToObject<Trip>(byId) }
    }

    // Fallback to slug query
    const bySlugSnap = await adminDb
      .collection(COLLECTIONS.TRIPS)
      .where('slug', '==', idOrSlug)
      .limit(1)
      .get()

    if (bySlugSnap.empty) return null

    const docSnap = bySlugSnap.docs[0]
    return { id: docSnap.id, trip: adminFirestoreHelpers.docToObject<Trip>(docSnap) }
  },
  async createTrip(tripData: Omit<Trip, 'id' | 'created_at' | 'updated_at'>): Promise<Trip> {
    const docRef = await adminDb.collection(COLLECTIONS.TRIPS).add({
      ...tripData,
      created_at: new Date(),
      updated_at: new Date()
    })
    
    const docSnap = await docRef.get()
    return adminFirestoreHelpers.docToObject<Trip>(docSnap)
  },

  /**
   * ユーザーIDで旅行を取得（後方互換性対応）
   * 
   * まず users コレクションのドキュメントIDで検索し、
   * 見つからない場合は google_id で検索（後方互換性）
   * 
   * @param userId - users コレクションのドキュメントID または google_id
   * @returns 旅行の配列
   */
  async getTripsByUserId(userId: string): Promise<Trip[]> {
    // まず users コレクションのドキュメントIDで検索
    const byDocumentId = await adminDb.collection(COLLECTIONS.TRIPS)
      .where('user_id', '==', userId)
      .get()
    
    if (!byDocumentId.empty) {
      const trips = byDocumentId.docs.map((doc: any) => adminFirestoreHelpers.docToObject<Trip>(doc))
    // Sort by created_at on the client side (descending)
    return trips.sort((a: Trip, b: Trip) => {
      const aDate = toDateOrNull(a.created_at) ;
      const bDate = toDateOrNull(b.created_at) ;
      if (!aDate || !bDate) return 0 
      return bDate.getTime() - aDate.getTime();
    })
    }
    
    // 後方互換性: google_id で検索（既存データが google_id で保存されている場合）
    // ユーザーが存在するか確認
    const user = await adminUserOperations.getUserByAuthUid(userId)
    if (user && user.id !== userId) {
      // userId が google_id の場合、users.id で再検索
      const byUserDocumentId = await adminDb.collection(COLLECTIONS.TRIPS)
        .where('user_id', '==', user.id)
        .get()
      
      if (!byUserDocumentId.empty) {
        const trips = byUserDocumentId.docs.map((doc: any) => adminFirestoreHelpers.docToObject<Trip>(doc))
        return trips.sort((a: Trip, b: Trip) => {
          const aDate = toDateOrNull(a.created_at) ;
          const bDate = toDateOrNull(b.created_at) ;
          if (!aDate || !bDate) return 0 
          return bDate.getTime() - aDate.getTime();
        })
      }
    }
    
    // どちらでも見つからない場合は空配列を返す
    return []
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
    // Delete trip image from Storage before deleting trip document
    try {
      logger.info('Starting trip deletion process:', { tripId })
      const tripDoc = await adminDb.collection(COLLECTIONS.TRIPS).doc(tripId).get()
      if (tripDoc.exists) {
        const tripData = tripDoc.data()
        const imageUrl = tripData?.image_url
        const userId = tripData?.user_id
        logger.info('Trip document found, checking for image:', { tripId, hasImageUrl: !!imageUrl, imageUrl, userId })
        
        if (imageUrl) {
          logger.info('Attempting to delete trip image:', { tripId, imageUrl })
          await this.deleteTripImage(imageUrl, tripId)
          
          // Note: deleteTripImage() handles both /trips/{tripId}/images/ and /users/{userId}/avatar/ paths
          // The imageUrl format is parsed correctly regardless of the path
        } else {
          logger.debug('No image URL found for trip:', { tripId })
        }
      } else {
        logger.warn('Trip document does not exist:', { tripId })
      }
    } catch (error) {
      logger.error('Failed to delete trip image before trip deletion:', { error, tripId })
      // Continue with trip deletion even if image deletion fails
    }
    
    // Delete related days and itineraries first
    await adminDayOperations.deleteDaysByTripId(tripId)
    
    // Delete trip
    const tripRef = adminDb.collection(COLLECTIONS.TRIPS).doc(tripId)
    await tripRef.delete()
    logger.info('Trip deletion completed:', { tripId })
  },

  async deleteTripImage(imageUrl: string, tripId: string): Promise<void> {
    try {
      // Check if imageUrl is valid
      if (!imageUrl || typeof imageUrl !== 'string') {
        logger.warn('Invalid imageUrl provided to deleteTripImage:', { imageUrl, tripId })
        return
      }

      logger.debug('Attempting to delete trip image:', { imageUrl, tripId })

      // Extract the path from the URL
      let path: string
      try {
        const url = new URL(imageUrl)
        logger.debug('Parsed URL pathname:', url.pathname)

        // Check if this is a Firebase Storage URL
        if (!url.pathname.includes('/o/')) {
          logger.warn('URL does not appear to be a Firebase Storage URL:', { imageUrl, tripId })
          return
        }

        const pathParts = url.pathname.split('/o/')
        if (pathParts.length < 2) {
          logger.warn('Invalid Firebase Storage URL format:', { imageUrl, tripId })
          return
        }

        const pathWithParams = pathParts[1]
        if (!pathWithParams) {
          logger.warn('No path found in Firebase Storage URL:', { imageUrl, tripId })
          return
        }

        // Remove query parameters
        path = decodeURIComponent(pathWithParams.split('?')[0])
        logger.debug('Extracted path:', { path, tripId })

        if (!path) {
          logger.warn('Empty path extracted from URL:', { imageUrl, tripId })
          return
        }
      } catch (urlError) {
        logger.error('Error parsing image URL:', { error: urlError, imageUrl, tripId })
        return
      }

      // Delete the file using Firebase Admin Storage
      if (!adminStorage) {
        logger.error('Admin Storage not initialized', { tripId })
        return
      }

      logger.debug('Getting storage bucket:', { tripId })
      const bucket = adminStorage.bucket()
      logger.debug('Storage bucket obtained:', { bucketName: bucket.name, tripId })
      
      const file = bucket.file(path)
      logger.debug('File reference created:', { path, fullPath: file.name, tripId })
      
      // Check if file exists before attempting to delete
      logger.debug('Checking if file exists:', { path, tripId })
      const [exists] = await file.exists()
      logger.debug('File exists check result:', { exists, path, tripId })
      
      if (!exists) {
        logger.warn('Image file does not exist in Storage:', { path, tripId })
        return
      }

      logger.info('Deleting file from Storage:', { path, tripId })
      await file.delete()
      logger.info('Successfully deleted trip image from Storage:', { path, tripId })
    } catch (error) {
      logger.error('Failed to delete trip image:', { error, imageUrl, tripId })
      // Don't throw error - image deletion failure should not block trip deletion
    }
  },

  /**
   * Move image from avatar path to trip path
   * @param oldImageUrl - The old image URL (from /users/{userId}/avatar/)
   * @param tripId - The trip ID
   * @returns The new image URL (from /trips/{tripId}/images/)
   */
  async moveImageToTripPath(oldImageUrl: string, tripId: string): Promise<string> {
    try {
      if (!oldImageUrl || typeof oldImageUrl !== 'string') {
        throw new Error('Invalid imageUrl provided')
      }

      if (!adminStorage) {
        throw new Error('Admin Storage not initialized')
      }

      logger.info('Starting image move operation:', { oldImageUrl, tripId })

      // Extract the old path from the URL
      let oldPath: string
      try {
        const url = new URL(oldImageUrl)
        if (!url.pathname.includes('/o/')) {
          throw new Error('URL does not appear to be a Firebase Storage URL')
        }

        const pathParts = url.pathname.split('/o/')
        if (pathParts.length < 2) {
          throw new Error('Invalid Firebase Storage URL format')
        }

        const pathWithParams = pathParts[1]
        if (!pathWithParams) {
          throw new Error('No path found in Firebase Storage URL')
        }

        oldPath = decodeURIComponent(pathWithParams.split('?')[0])
        logger.debug('Extracted old path:', { oldPath, tripId })

        if (!oldPath) {
          throw new Error('Empty path extracted from URL')
        }
      } catch (urlError) {
        logger.error('Error parsing image URL:', { error: urlError, oldImageUrl, tripId })
        throw new Error(`Failed to parse image URL: ${urlError instanceof Error ? urlError.message : String(urlError)}`)
      }

      // Check if the old path is actually an avatar path
      // Path format: "users/{userId}/avatar/{fileName}" (no leading slash)
      const isAvatarPath = oldPath.includes('users/') && oldPath.includes('/avatar/')
      if (!isAvatarPath) {
        logger.warn('Image path is not an avatar path, skipping move:', { oldPath, tripId })
        return oldImageUrl // Return original URL if not an avatar path
      }

      // Extract file name from old path
      const fileName = oldPath.split('/').pop() || `image_${Date.now()}.jpg`
      const newPath = `trips/${tripId}/images/${fileName}`

      logger.debug('Moving image:', { oldPath, newPath, tripId })

      const bucket = adminStorage.bucket()
      
      // Check if old file exists
      const oldFile = bucket.file(oldPath)
      const [exists] = await oldFile.exists()
      if (!exists) {
        logger.warn('Source image does not exist, skipping move:', { oldPath, tripId })
        return oldImageUrl // Return original URL if source doesn't exist
      }

      // Copy to new location
      const newFile = bucket.file(newPath)
      await oldFile.copy(newFile)
      logger.info('Image copied to new location:', { newPath, tripId })

      // Get the new download URL
      const [newUrl] = await newFile.getSignedUrl({
        action: 'read',
        expires: '03-09-2491' // Far future date (effectively permanent)
      })

      logger.info('Got new download URL:', { newUrl, tripId })

      // Delete the old file
      await oldFile.delete()
      logger.info('Deleted old image file:', { oldPath, tripId })

      logger.info('Image move operation completed successfully:', { oldPath, newPath, newUrl, tripId })
      return newUrl
    } catch (error) {
      logger.error('Failed to move image to trip path:', { error, oldImageUrl, tripId })
      throw error // Throw error so caller can handle it
    }
  },

  async getPublicTrips(): Promise<Trip[]> {
    const querySnapshot = await adminDb.collection(COLLECTIONS.TRIPS)
      .where('access_level', '==', 'public')
      .get()
    
    const trips = querySnapshot.docs.map((doc: any) => adminFirestoreHelpers.docToObject<Trip>(doc))
    
    // Sort by created_at on the client side (descending)
    return trips.sort((a: Trip, b: Trip) => {
      const aDate = toDateOrNull(a.created_at) ;
      const bDate = toDateOrNull(b.created_at) ;
      if (!aDate || !bDate) return 0 
      return bDate.getTime() - aDate.getTime();
    })
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

  async getDay(dayId: string): Promise<Day | null> {
    const dayRef = adminDb.collection(COLLECTIONS.DAYS).doc(dayId)
    const docSnap = await dayRef.get()
    if (!docSnap.exists) {
      return null
    }
    return adminFirestoreHelpers.docToObject<Day>(docSnap)
  },

  async getDaysByTripId(tripId: string): Promise<Day[]> {
    const querySnapshot = await adminDb.collection(COLLECTIONS.DAYS)
      .where('trip_id', '==', tripId)
      .get()
    
    const days = querySnapshot.docs.map((doc: any) => adminFirestoreHelpers.docToObject<Day>(doc))
    
    // Sort by day_number on the client side
    return days.sort((a: Day, b: Day) => a.day_number - b.day_number)
  },

  async updateDay(dayId: string, dayData: Partial<Day>): Promise<Day> {
    const dayRef = adminDb.collection(COLLECTIONS.DAYS).doc(dayId)
    await dayRef.update({
      ...dayData,
      updated_at: new Date()
    })
    
    // 更新されたドキュメントを取得して返す
    const updatedDoc = await dayRef.get()
    if (!updatedDoc.exists) {
      throw new Error('Day not found after update')
    }
    return adminFirestoreHelpers.docToObject<Day>(updatedDoc)
  },

  async deleteDay(dayId: string): Promise<void> {
    // Get the day to be deleted
    const dayToDelete = await this.getDay(dayId)
    if (!dayToDelete) {
      throw new Error('Day not found')
    }
    
    // Delete related itineraries first
    await adminItineraryOperations.deleteItinerariesByDayId(dayId)
    
    // Delete day
    const dayRef = adminDb.collection(COLLECTIONS.DAYS).doc(dayId)
    await dayRef.delete()
    
    // Renumber remaining days
    const remainingDays = await this.getDaysByTripId(dayToDelete.trip_id)
    const batch = adminDb.batch()
    
    remainingDays
      .filter(d => d.day_number > dayToDelete.day_number)
      .forEach(day => {
        const ref = adminDb.collection(COLLECTIONS.DAYS).doc(day.id)
        batch.update(ref, { day_number: day.day_number - 1 })
      })
    
    await batch.commit()
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
    await adminDb.runTransaction(async (transaction: any) => {
      // 既存のdayドキュメントを取得
      const existingDaysQuery = adminDb.collection(COLLECTIONS.DAYS)
        .where('trip_id', '==', tripId)
      
      const existingDaysSnapshot = await transaction.get(existingDaysQuery)
      
      // 既存のdayドキュメントを削除
      existingDaysSnapshot.docs.forEach((doc: any) => {
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
    
    const itineraries = querySnapshot.docs.map((doc: any) => adminFirestoreHelpers.docToObject<Itinerary>(doc))
    
    // Sort by sort_number on the client side (ascending)
    return itineraries.sort((a: Itinerary, b: Itinerary) => a.sort_number - b.sort_number)
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
    
    return querySnapshot.docs.map((doc: any) => adminFirestoreHelpers.docToObject<TripUser>(doc))
  },

  async getTripsByUserId(userId: string): Promise<TripUser[]> {
    const querySnapshot = await adminDb.collection(COLLECTIONS.TRIP_USERS)
      .where('user_id', '==', userId)
      .get()
    
    const tripUsers = querySnapshot.docs.map((doc: any) => adminFirestoreHelpers.docToObject<TripUser>(doc))
    
    // Sort by created_at on the client side (descending)
    return tripUsers.sort((a: TripUser, b: TripUser) => {
      const aDate = toDateOrNull(a.created_at) ;
      const bDate = toDateOrNull(b.created_at) ;

      if (!aDate || !bDate) return 0 
      return bDate.getTime() - aDate.getTime();
    })
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
