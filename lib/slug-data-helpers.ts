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
    ...userDoc.data()
  } as User
}

/**
 * tripSlug と user_id から trip データを取得
 * @param tripSlug 旅行のスラッグ
 * @param userId ユーザーID（google_id）
 * @returns 旅行データまたはnull
 */
export async function getTripBySlug(tripSlug: string, userId: string): Promise<Trip | null> {
  console.log('🔍 getTripBySlug: Starting query', { tripSlug, userId })
  
  const db = getFirestore()
  const tripsRef = collection(db, 'trips')
  const q = query(
    tripsRef, 
    where('slug', '==', tripSlug),
    where('user_id', '==', userId)
  )
  
  try {
    const querySnapshot = await getDocs(q)
    console.log('📊 getTripBySlug: Query result', { 
      empty: querySnapshot.empty, 
      size: querySnapshot.size 
    })
    
    if (querySnapshot.empty) {
      console.log('❌ getTripBySlug: No trips found')
      return null
    }
    
    const tripDoc = querySnapshot.docs[0]
    const tripData = {
      id: tripDoc.id,
      ...tripDoc.data()
    } as Trip
    
    console.log('✅ getTripBySlug: Trip found', { 
      tripId: tripData.id, 
      accessLevel: tripData.access_level 
    })
    
    return tripData
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
  console.log('🔍 getTripBySlugs: Starting lookup', { userSlug, tripSlug })
  
  // 1. userSlug から user を取得
  const user = await getUserBySlug(userSlug)
  if (!user) {
    console.log('❌ getTripBySlugs: User not found', { userSlug })
    return null
  }
  console.log('✅ getTripBySlugs: User found', { userId: user.id, googleId: user.google_id })
  
  // 2. tripSlug と user.google_id から trip を取得
  const trip = await getTripBySlug(tripSlug, user.google_id)
  if (!trip) {
    console.log('❌ getTripBySlugs: Trip not found', { tripSlug, userId: user.google_id })
    return null
  }
  console.log('✅ getTripBySlugs: Trip found', { tripId: trip.id, accessLevel: trip.access_level })
  
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
