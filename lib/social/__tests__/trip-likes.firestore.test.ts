/**
 * Trip Likes Social Operations のテスト
 * 
 * Phase 1-4: Firestore操作関数（テストファースト）
 * 
 * 注意: これらのテストはFirestoreエミュレータを起動している必要があります。
 * エミュレータ起動: pnpm emulators:start:firestore
 * 
 * 使用方法:
 *   1. エミュレータを起動: pnpm emulators:start:firestore
 *   2. 別のターミナルでテスト実行: pnpm test:firestore -- trip-likes
 */

import { createMockTrip, createMockPublicTrip } from '@/lib/__tests__/helpers/test-data'
import { getTestFirestore } from '@/lib/__tests__/helpers/test-firestore'
import { COLLECTIONS } from '@/lib/firebase/firestore'
import { asUserId, asTripId, asUserSlug, asTripSlug } from '@/lib/core/types/identity'
import type { Trip } from '@/lib/core/types'
import type { Firestore } from 'firebase-admin/firestore'

// TODO: Phase 1-4で実装するSocial Operations
// import { toggleTripLike, getTripLikeState } from '@/lib/social/trip-likes'

// テスト用のモック関数（実装後、実際のSocial Operationsに置き換え）
async function toggleTripLike(
  userId: string,
  tripSlug: string,
  action: 'like' | 'unlike' | 'toggle' = 'toggle',
  db?: Firestore
): Promise<{ liked: boolean; likesCount: number }> {
  // TODO: 実装
  throw new Error('Not implemented')
}

async function getTripLikeState(
  tripSlug: string,
  userId: string | null,
  db?: Firestore
): Promise<{ count: number; liked: boolean }> {
  // TODO: 実装
  throw new Error('Not implemented')
}

describe('Trip Likes Social Operations', () => {
  let db: Firestore
  let publicTrip: Trip
  let privateTrip: Trip
  let userId: string
  let otherUserId: string

  beforeAll(async () => {
    db = getTestFirestore()
  })

  beforeEach(async () => {
    // テストデータのクリーンアップ
    const tripsSnapshot = await db.collection(COLLECTIONS.TRIPS).get()
    const likesSnapshot = await db.collection(COLLECTIONS.TRIP_LIKES).get()
    const batch = db.batch()
    tripsSnapshot.docs.forEach((doc) => batch.delete(doc.ref))
    likesSnapshot.docs.forEach((doc) => batch.delete(doc.ref))
    await batch.commit()

    // テストデータのセットアップ
    userId = 'user1'
    otherUserId = 'user2'

    // 公開トリップとプライベートトリップを作成
    publicTrip = createMockPublicTrip({
      id: 'public-trip-1',
      user_id: otherUserId,
      slug: 'public-trip-1',
      access_level: 'public',
      social_stats: {
        likes_count: 0,
        comments_count: 0,
        shares_count: 0,
        views_count: 0,
        replicas_count: 0,
      },
    })

    privateTrip = createMockTrip({
      id: 'private-trip-1',
      user_id: otherUserId,
      slug: 'private-trip-1',
      access_level: 'private',
    })

    await db.collection(COLLECTIONS.TRIPS).doc(publicTrip.id).set(publicTrip)
    await db.collection(COLLECTIONS.TRIPS).doc(privateTrip.id).set(privateTrip)
  })

  describe('toggleTripLike', () => {
    it('should add like to public trip and update social_stats atomically', async () => {
      const result = await toggleTripLike(userId, 'public-trip-1', 'like', db)

      expect(result.liked).toBe(true)
      expect(result.likesCount).toBe(1)

      // データベースにいいねが追加されたことを確認
      const likeRef = db
        .collection(COLLECTIONS.TRIP_LIKES)
        .doc(`${userId}_${publicTrip.id}`)
      const likeDoc = await likeRef.get()
      expect(likeDoc.exists).toBe(true)
      expect(likeDoc.data()?.user_id).toBe(userId)
      expect(likeDoc.data()?.trip_id).toBe(publicTrip.id)

      // Tripのsocial_statsが更新されたことを確認
      const tripDoc = await db.collection(COLLECTIONS.TRIPS).doc(publicTrip.id).get()
      const tripData = tripDoc.data() as Trip
      expect(tripData.social_stats?.likes_count).toBe(1)
    })

    it('should remove like from public trip and update social_stats atomically', async () => {
      // 最初にいいねを作成
      await db.collection(COLLECTIONS.TRIP_LIKES).doc(`${userId}_${publicTrip.id}`).set({
        trip_id: publicTrip.id,
        user_id: userId,
        created_at: new Date(),
      })

      await db.collection(COLLECTIONS.TRIPS).doc(publicTrip.id).update({
        'social_stats.likes_count': 1,
      })

      const result = await toggleTripLike(userId, 'public-trip-1', 'unlike', db)

      expect(result.liked).toBe(false)
      expect(result.likesCount).toBe(0)

      // データベースからいいねが削除されたことを確認
      const likeRef = db
        .collection(COLLECTIONS.TRIP_LIKES)
        .doc(`${userId}_${publicTrip.id}`)
      const likeDoc = await likeRef.get()
      expect(likeDoc.exists).toBe(false)

      // Tripのsocial_statsが更新されたことを確認
      const tripDoc = await db.collection(COLLECTIONS.TRIPS).doc(publicTrip.id).get()
      const tripData = tripDoc.data() as Trip
      expect(tripData.social_stats?.likes_count).toBe(0)
    })

    it('should toggle like state if action is toggle', async () => {
      // 最初はいいねがない
      const result1 = await toggleTripLike(userId, 'public-trip-1', 'toggle', db)
      expect(result1.liked).toBe(true)
      expect(result1.likesCount).toBe(1)

      // 2回目はいいねを削除
      const result2 = await toggleTripLike(userId, 'public-trip-1', 'toggle', db)
      expect(result2.liked).toBe(false)
      expect(result2.likesCount).toBe(0)
    })

    it('should deny liking private trips', async () => {
      await expect(
        toggleTripLike(userId, 'private-trip-1', 'like', db)
      ).rejects.toThrow('private')
    })

    it('should not allow trip owners to like their own trips', async () => {
      await expect(
        toggleTripLike(otherUserId, 'public-trip-1', 'like', db)
      ).rejects.toThrow('own')
    })

    it('should throw error if trip is already liked and action is like', async () => {
      // 最初にいいねを作成
      await db.collection(COLLECTIONS.TRIP_LIKES).doc(`${userId}_${publicTrip.id}`).set({
        trip_id: publicTrip.id,
        user_id: userId,
        created_at: new Date(),
      })

      await expect(
        toggleTripLike(userId, 'public-trip-1', 'like', db)
      ).rejects.toThrow('already liked')
    })

    it('should throw error if trip is not liked and action is unlike', async () => {
      await expect(
        toggleTripLike(userId, 'public-trip-1', 'unlike', db)
      ).rejects.toThrow('not liked')
    })

    it('should handle concurrent likes atomically', async () => {
      // 複数のユーザーが同時にいいねする
      const promises = [
        toggleTripLike('user3', 'public-trip-1', 'like', db),
        toggleTripLike('user4', 'public-trip-1', 'like', db),
        toggleTripLike('user5', 'public-trip-1', 'like', db),
      ]

      const results = await Promise.all(promises)

      // すべて成功する
      results.forEach((result) => {
        expect(result.liked).toBe(true)
      })

      // 最終的ないいね数が正しいことを確認
      const tripDoc = await db.collection(COLLECTIONS.TRIPS).doc(publicTrip.id).get()
      const tripData = tripDoc.data() as Trip
      expect(tripData.social_stats?.likes_count).toBe(3)
    })
  })

  describe('getTripLikeState', () => {
    beforeEach(async () => {
      // 複数のユーザーがいいねを作成
      await db.collection(COLLECTIONS.TRIP_LIKES).doc(`${userId}_${publicTrip.id}`).set({
        trip_id: publicTrip.id,
        user_id: userId,
        created_at: new Date(),
      })

      await db.collection(COLLECTIONS.TRIP_LIKES).doc(`user3_${publicTrip.id}`).set({
        trip_id: publicTrip.id,
        user_id: 'user3',
        created_at: new Date(),
      })

      await db.collection(COLLECTIONS.TRIPS).doc(publicTrip.id).update({
        'social_stats.likes_count': 2,
      })
    })

    it('should return likes count and liked state for authenticated users', async () => {
      const result = await getTripLikeState('public-trip-1', userId, db)

      expect(result.count).toBe(2)
      expect(result.liked).toBe(true) // ユーザーがいいねしている
    })

    it('should return liked=false if user has not liked the trip', async () => {
      const result = await getTripLikeState('public-trip-1', 'user4', db)

      expect(result.count).toBe(2)
      expect(result.liked).toBe(false)
    })

    it('should return liked=false for unauthenticated users', async () => {
      const result = await getTripLikeState('public-trip-1', null, db)

      expect(result.count).toBe(2)
      expect(result.liked).toBe(false)
    })

    it('should throw error for private trips', async () => {
      await expect(
        getTripLikeState('private-trip-1', userId, db)
      ).rejects.toThrow('private')
    })
  })
})

