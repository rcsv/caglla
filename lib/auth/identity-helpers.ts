/**
 * 識別子解決・比較ヘルパー
 * 
 * UserId/UserSlug や TripId/TripSlug の解決と比較を行う関数を提供します。
 * これにより、型安全性を保ちながら実際のデータベースクエリを行います。
 */

import { db } from '@/lib/firebase/client'
import { adminDb } from '@/lib/firebase/admin'
import { COLLECTIONS } from '@/lib/firebase/firestore'
import type {
  UserId,
  UserSlug,
  TripId,
  TripSlug,
  isSameUser as IsSameUserType,
  isSameTrip as IsSameTripType,
} from '@/lib/core/types/identity'
import { asUserId, asUserSlug, asTripId, asTripSlug } from '@/lib/core/types/identity'
import type { User, Trip } from '@/lib/core/types'
import logger from '@/lib/core/logger'

// ============================================================================
// User ID ↔ User Slug 解決
// ============================================================================

/**
 * UserSlug から UserId を解決
 * 
 * @param userSlug UserSlug
 * @returns UserId または null
 */
export async function resolveUserIdFromSlug(userSlug: UserSlug): Promise<UserId | null> {
  try {
    if (!db) {
      logger.error('Firestore client not initialized')
      return null
    }
    const usersRef = db.collection(COLLECTIONS.USERS)
    const querySnapshot = await usersRef.where('slug', '==', userSlug).limit(1).get()
    
    if (querySnapshot.empty) {
      logger.debug('User not found by slug:', userSlug)
      return null
    }
    
    const userDoc = querySnapshot.docs[0]
    const userData = userDoc.data() as User
    const userId = userData.google_id || userDoc.id
    
    return asUserId(userId)
  } catch (error) {
    logger.error('Failed to resolve userId from slug:', error)
    return null
  }
}

/**
 * UserId から UserSlug を解決
 * 
 * @param userId UserId
 * @returns UserSlug または null
 */
export async function resolveUserSlugFromId(userId: UserId): Promise<UserSlug | null> {
  try {
    if (!db) {
      logger.error('Firestore client not initialized')
      return null
    }
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get()
    
    if (!userDoc.exists) {
      // google_id で検索を試みる
      const querySnapshot = await db
        .collection(COLLECTIONS.USERS)
        .where('google_id', '==', userId)
        .limit(1)
        .get()
      
      if (querySnapshot.empty) {
        logger.debug('User not found by id:', userId)
        return null
      }
      
      const userData = querySnapshot.docs[0].data() as User
      return userData.slug ? asUserSlug(userData.slug) : null
    }
    
    const userData = userDoc.data() as User
    return userData.slug ? asUserSlug(userData.slug) : null
  } catch (error) {
    logger.error('Failed to resolve userSlug from id:', error)
    return null
  }
}

// ============================================================================
// Trip ID ↔ Trip Slug 解決
// ============================================================================

/**
 * TripSlug から TripId を解決（ユーザーID必須）
 * 
 * @param tripSlug TripSlug
 * @param userId UserId（所有者）
 * @returns TripId または null
 */
export async function resolveTripIdFromSlug(
  tripSlug: TripSlug,
  userId: UserId
): Promise<TripId | null> {
  try {
    if (!db) {
      logger.error('Firestore client not initialized')
      return null
    }
    const tripsRef = db.collection(COLLECTIONS.TRIPS)
    const querySnapshot = await tripsRef
      .where('slug', '==', tripSlug)
      .where('user_id', '==', userId)
      .limit(1)
      .get()
    
    if (querySnapshot.empty) {
      logger.debug('Trip not found by slug:', { tripSlug, userId })
      return null
    }
    
    const tripDoc = querySnapshot.docs[0]
    return asTripId(tripDoc.id)
  } catch (error) {
    logger.error('Failed to resolve tripId from slug:', error)
    return null
  }
}

/**
 * TripId から TripSlug を解決
 * 
 * @param tripId TripId
 * @returns TripSlug または null
 */
export async function resolveTripSlugFromId(tripId: TripId): Promise<TripSlug | null> {
  try {
    if (!db) {
      logger.error('Firestore client not initialized')
      return null
    }
    const tripDoc = await db.collection(COLLECTIONS.TRIPS).doc(tripId).get()
    
    if (!tripDoc.exists) {
      logger.debug('Trip not found by id:', tripId)
      return null
    }
    
    const tripData = tripDoc.data() as Trip
    return tripData.slug ? asTripSlug(tripData.slug) : null
  } catch (error) {
    logger.error('Failed to resolve tripSlug from id:', error)
    return null
  }
}

// ============================================================================
// 比較関数（実際のデータベースクエリを伴う）
// ============================================================================

/**
 * UserId と UserSlug が同じユーザーを指しているかどうかを判定
 * 
 * 注意: この関数は実データベースクエリを伴うため、頻繁な呼び出しを避けること。
 * 可能な限り事前に解決しておくことを推奨。
 * 
 * @param userId UserId（Firebase Auth UID）
 * @param userSlug UserSlug（URL-safe スラッグ）
 * @returns 同じユーザーの場合 true
 */
export async function isSameUser(userId: UserId, userSlug: UserSlug): Promise<boolean> {
  const resolvedUserId = await resolveUserIdFromSlug(userSlug)
  if (!resolvedUserId) {
    return false
  }
  return userId === resolvedUserId
}

/**
 * 2つの UserId が同じユーザーを指しているかどうかを判定（同期版）
 * 
 * 注意: これは単純な文字列比較のため、型安全性を保証するために関数でラップしています。
 * 実データベースクエリは不要な場合に使用してください。
 * 
 * @param userId1 最初の UserId
 * @param userId2 2番目の UserId
 * @returns 同じユーザーの場合 true
 */
export function isSameUserSync(userId1: UserId, userId2: UserId): boolean {
  return userId1 === userId2
}

/**
 * TripId と TripSlug が同じトリップを指しているかどうかを判定
 * 
 * @param tripId TripId
 * @param tripSlug TripSlug
 * @returns 同じトリップの場合 true
 */
export async function isSameTrip(tripId: TripId, tripSlug: TripSlug): Promise<boolean> {
  const resolvedTripId = await resolveTripIdFromSlug(tripSlug, asUserId('')) // userId が必要なため、別の解決方法を使用
  
  // より効率的な方法: TripId から Trip を取得して slug を比較
  try {
    if (!db) {
      logger.error('Firestore client not initialized')
      return false
    }
    const tripDoc = await db.collection(COLLECTIONS.TRIPS).doc(tripId).get()
    
    if (!tripDoc.exists) {
      return false
    }
    
    const tripData = tripDoc.data() as Trip
    return tripData.slug === tripSlug
  } catch (error) {
    logger.error('Failed to compare trip id and slug:', error)
    return false
  }
}

// ============================================================================
// Admin SDK 版（サーバーサイド用）
// ============================================================================

/**
 * UserSlug から UserId を解決（Admin SDK版）
 * 
 * @param userSlug UserSlug
 * @returns UserId または null
 */
export async function adminResolveUserIdFromSlug(userSlug: UserSlug): Promise<UserId | null> {
  try {
    const querySnapshot = await adminDb
      .collection(COLLECTIONS.USERS)
      .where('slug', '==', userSlug)
      .limit(1)
      .get()
    
    if (querySnapshot.empty) {
      logger.debug('User not found by slug (admin):', userSlug)
      return null
    }
    
    const userDoc = querySnapshot.docs[0]
    const userData = userDoc.data() as User
    const userId = userData.google_id || userDoc.id
    
    return asUserId(userId)
  } catch (error) {
    logger.error('Failed to resolve userId from slug (admin):', error)
    return null
  }
}

/**
 * UserId から UserSlug を解決（Admin SDK版）
 * 
 * @param userId UserId
 * @returns UserSlug または null
 */
export async function adminResolveUserSlugFromId(userId: UserId): Promise<UserSlug | null> {
  try {
    const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(userId).get()
    
    if (!userDoc.exists) {
      // google_id で検索を試みる
      const querySnapshot = await adminDb
        .collection(COLLECTIONS.USERS)
        .where('google_id', '==', userId)
        .limit(1)
        .get()
      
      if (querySnapshot.empty) {
        logger.debug('User not found by id (admin):', userId)
        return null
      }
      
      const userData = querySnapshot.docs[0].data() as User
      return userData.slug ? asUserSlug(userData.slug) : null
    }
    
    const userData = userDoc.data() as User
    return userData.slug ? asUserSlug(userData.slug) : null
  } catch (error) {
    logger.error('Failed to resolve userSlug from id (admin):', error)
    return null
  }
}

/**
 * TripSlug から TripId を解決（Admin SDK版、ユーザーID必須）
 * 
 * @param tripSlug TripSlug
 * @param userId UserId（所有者）
 * @returns TripId または null
 */
export async function adminResolveTripIdFromSlug(
  tripSlug: TripSlug,
  userId: UserId
): Promise<TripId | null> {
  try {
    const querySnapshot = await adminDb
      .collection(COLLECTIONS.TRIPS)
      .where('slug', '==', tripSlug)
      .where('user_id', '==', userId)
      .limit(1)
      .get()
    
    if (querySnapshot.empty) {
      logger.debug('Trip not found by slug (admin):', { tripSlug, userId })
      return null
    }
    
    const tripDoc = querySnapshot.docs[0]
    return asTripId(tripDoc.id)
  } catch (error) {
    logger.error('Failed to resolve tripId from slug (admin):', error)
    return null
  }
}

/**
 * TripId から TripSlug を解決（Admin SDK版）
 * 
 * @param tripId TripId
 * @returns TripSlug または null
 */
export async function adminResolveTripSlugFromId(tripId: TripId): Promise<TripSlug | null> {
  try {
    const tripDoc = await adminDb.collection(COLLECTIONS.TRIPS).doc(tripId).get()
    
    if (!tripDoc.exists) {
      logger.debug('Trip not found by id (admin):', tripId)
      return null
    }
    
    const tripData = tripDoc.data() as Trip
    return tripData.slug ? asTripSlug(tripData.slug) : null
  } catch (error) {
    logger.error('Failed to resolve tripSlug from id (admin):', error)
    return null
  }
}

