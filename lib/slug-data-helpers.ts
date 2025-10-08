/**
 * スラッグベースのデータ取得ヘルパー
 * userSlug/tripSlug から trip データを取得する機能
 */

import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import type { Trip, User } from './types'

/**
 * userSlug から user データを取得
 * @param userSlug ユーザーのスラッグ
 * @returns ユーザーデータまたはnull
 */
export async function getUserBySlug(userSlug: string): Promise<User | null> {
  const db = getFirestore()
  const usersRef = collection(db, 'users')
  const q = query(usersRef, where('slug', '==', userSlug))
  
  const querySnapshot = await getDocs(q)
  
  if (querySnapshot.empty) {
    return null
  }
  
  const userDoc = querySnapshot.docs[0]
  return {
    id: userDoc.id,
    ...userDoc.data(),
    // Firestore Timestamp型をDate型に変換
    created_at: userDoc.data().created_at?.toDate ? userDoc.data().created_at.toDate() : userDoc.data().created_at,
    updated_at: userDoc.data().updated_at?.toDate ? userDoc.data().updated_at.toDate() : userDoc.data().updated_at,
  } as User
}

/**
 * tripSlug と user_id から trip データを取得
 * @param tripSlug 旅行のスラッグ
 * @param userId ユーザーID（google_id）
 * @returns 旅行データまたはnull
 */
export async function getTripBySlug(tripSlug: string, userId: string): Promise<Trip | null> {
  const db = getFirestore()
  const tripsRef = collection(db, 'trips')
  const q = query(
    tripsRef, 
    where('slug', '==', tripSlug),
    where('user_id', '==', userId)
  )
  
  try {
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      return null
    }
    
    const tripDoc = querySnapshot.docs[0]
    const tripData = {
      id: tripDoc.id,
      ...tripDoc.data(),
      // Firestore Timestamp型をDate型に変換
      start_date: tripDoc.data().start_date?.toDate ? tripDoc.data().start_date.toDate() : tripDoc.data().start_date,
      end_date: tripDoc.data().end_date?.toDate ? tripDoc.data().end_date.toDate() : tripDoc.data().end_date,
      created_at: tripDoc.data().created_at?.toDate ? tripDoc.data().created_at.toDate() : tripDoc.data().created_at,
      updated_at: tripDoc.data().updated_at?.toDate ? tripDoc.data().updated_at.toDate() : tripDoc.data().updated_at,
    } as Trip

    // Daysを取得
    const daysRef = collection(db, 'days')
    const daysQuery = query(
      daysRef,
      where('trip_id', '==', tripDoc.id)
    )
    
    const daysSnapshot = await getDocs(daysQuery)
    const days = daysSnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        // Firestore Timestamp型をDate型に変換
        date: data.date?.toDate ? data.date.toDate() : data.date,
        created_at: data.created_at?.toDate ? data.created_at.toDate() : data.created_at,
        updated_at: data.updated_at?.toDate ? data.updated_at.toDate() : data.updated_at,
      }
    })

    // 各DayのItinerariesを取得
    const daysWithItineraries = await Promise.all(
      days.map(async (day) => {
        const itinerariesRef = collection(db, 'itineraries')
        const itinerariesQuery = query(
          itinerariesRef,
          where('day_id', '==', day.id)
        )
        
        const itinerariesSnapshot = await getDocs(itinerariesQuery)
        const itineraries = itinerariesSnapshot.docs.map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data,
            // Firestore Timestamp型をDate型に変換
            created_at: data.created_at?.toDate ? data.created_at.toDate() : data.created_at,
            updated_at: data.updated_at?.toDate ? data.updated_at.toDate() : data.updated_at,
          }
        })

        return {
          ...day,
          itineraries
        }
      })
    )

    return {
      ...tripData,
      days: daysWithItineraries
    } as Trip
  } catch (error) {
    console.error('❌ getTripBySlug: Query failed', error)
    throw error
  }
}

/**
 * userSlug と tripSlug から trip データを取得（完全版）
 * @param userSlug ユーザーのスラッグ
 * @param tripSlug 旅行のスラッグ
 * @returns 旅行データ（creator情報付き）またはnull
 */
export async function getTripBySlugs(userSlug: string, tripSlug: string): Promise<Trip | null> {
  // 1. userSlug から user を取得
  const user = await getUserBySlug(userSlug)
  if (!user) {
    return null
  }
  
  // 2. tripSlug と user.google_id から trip を取得
  const trip = await getTripBySlug(tripSlug, user.google_id)
  if (!trip) {
    return null
  }
  
  // 3. creator情報を追加
  return {
    ...trip,
    creator: user
  }
}

/**
 * tripId から userSlug と tripSlug を取得（リダイレクト用）
 * @param tripId 旅行ID
 * @returns { userSlug, tripSlug } または null
 */
export async function getSlugsFromTripId(tripId: string): Promise<{ userSlug: string; tripSlug: string } | null> {
  const db = getFirestore()
  
  // 1. trip を取得
  const tripRef = doc(db, 'trips', tripId)
  const tripDoc = await getDoc(tripRef)
  
  if (!tripDoc.exists()) {
    return null
  }
  
  const trip = tripDoc.data() as Trip
  
  // 2. user を取得（user_idはgoogle_idなので、whereクエリを使用）
  const usersRef = collection(db, 'users')
  const userQuery = query(usersRef, where('google_id', '==', trip.user_id))
  const userQuerySnapshot = await getDocs(userQuery)
  
  if (userQuerySnapshot.empty) {
    return null
  }
  
  const userDoc = userQuerySnapshot.docs[0]
  const user = userDoc.data() as User
  
  // 3. スラッグが存在するかチェック
  if (!user.slug || !trip.slug) {
    return null
  }
  
  return {
    userSlug: user.slug,
    tripSlug: trip.slug
  }
}

/**
 * ユーザーの全旅行のスラッグ一覧を取得
 * @param userId ユーザーID
 * @returns 旅行スラッグの配列
 */
export async function getUserTripSlugs(userId: string): Promise<string[]> {
  const db = getFirestore()
  const tripsRef = collection(db, 'trips')
  const q = query(tripsRef, where('user_id', '==', userId))
  
  const querySnapshot = await getDocs(q)
  
  return querySnapshot.docs
    .map(doc => doc.data().slug)
    .filter(slug => slug) // slugが存在するもののみ
}

/**
 * 全ユーザーのスラッグ一覧を取得
 * @returns ユーザースラッグの配列
 */
export async function getAllUserSlugs(): Promise<string[]> {
  const db = getFirestore()
  const usersRef = collection(db, 'users')
  const q = query(usersRef, where('slug', '!=', null))
  
  const querySnapshot = await getDocs(q)
  
  return querySnapshot.docs
    .map(doc => doc.data().slug)
    .filter(slug => slug) // slugが存在するもののみ
}
