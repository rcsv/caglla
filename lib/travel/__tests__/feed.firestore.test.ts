/**
 * Feed Operations のテスト
 * 
 * フィード機能のFirestore操作関数のテスト
 * 
 * 注意: これらのテストはFirestoreエミュレータを起動している必要があります。
 * エミュレータ起動: pnpm emulators:start:firestore
 * 
 * 使用方法:
 *   1. エミュレータを起動: pnpm emulators:start:firestore
 *   2. 別のターミナルでテスト実行: pnpm test:firestore -- feed
 */

import { createMockTrip, createMockPublicTrip } from '@/lib/__tests__/helpers/test-data'
import { getTestFirestore } from '@/lib/__tests__/helpers/test-firestore'
import { COLLECTIONS } from '@/lib/firebase/firestore'
import type { Trip } from '@/lib/core/types'
import type { Firestore } from 'firebase-admin/firestore'

// Feed Operationsをインポート
import {
  getPublicFeed,
  getTrendingFeed,
  getFollowingFeed,
} from '@/lib/travel/feed'

describe('Feed Operations', () => {
  let db: Firestore
  let publicTrip1: Trip
  let publicTrip2: Trip
  let publicTrip3: Trip
  let privateTrip: Trip
  let userId: string
  let otherUserId: string

  beforeAll(async () => {
    db = getTestFirestore()
  })

  beforeEach(async () => {
    // テストデータのクリーンアップ
    const tripsSnapshot = await db.collection(COLLECTIONS.TRIPS).get()
    const batch = db.batch()
    tripsSnapshot.docs.forEach((doc) => batch.delete(doc.ref))
    await batch.commit()

    // テストデータのセットアップ
    userId = 'user1'
    otherUserId = 'user2'

    // 公開トリップを複数作成（異なるtrending_scoreとsocial_statsを持つ）
    publicTrip1 = createMockPublicTrip({
      id: 'public-trip-1',
      user_id: otherUserId,
      slug: 'public-trip-1',
      access_level: 'public',
      trending_score: 100,
      social_stats: {
        likes_count: 10,
        comments_count: 5,
        shares_count: 2,
        views_count: 100,
        replicas_count: 3,
      },
    })

    publicTrip2 = createMockPublicTrip({
      id: 'public-trip-2',
      user_id: otherUserId,
      slug: 'public-trip-2',
      access_level: 'public',
      trending_score: 50,
      social_stats: {
        likes_count: 5,
        comments_count: 2,
        shares_count: 1,
        views_count: 50,
        replicas_count: 1,
      },
    })

    publicTrip3 = createMockPublicTrip({
      id: 'public-trip-3',
      user_id: otherUserId,
      slug: 'public-trip-3',
      access_level: 'public',
      trending_score: 75,
      social_stats: {
        likes_count: 8,
        comments_count: 3,
        shares_count: 1,
        views_count: 75,
        replicas_count: 2,
      },
    })

    privateTrip = createMockTrip({
      id: 'private-trip-1',
      user_id: otherUserId,
      slug: 'private-trip-1',
      access_level: 'private',
    })

    await db.collection(COLLECTIONS.TRIPS).doc(publicTrip1.id).set(publicTrip1)
    await db.collection(COLLECTIONS.TRIPS).doc(publicTrip2.id).set(publicTrip2)
    await db.collection(COLLECTIONS.TRIPS).doc(publicTrip3.id).set(publicTrip3)
    await db.collection(COLLECTIONS.TRIPS).doc(privateTrip.id).set(privateTrip)
  })

  describe('getPublicFeed', () => {
    it('should return only public trips', async () => {
      const result = await getPublicFeed(20, undefined, db)

      expect(result.trips.length).toBe(3)
      expect(result.trips.every((trip) => trip.access_level === 'public')).toBe(true)
      expect(result.trips.some((trip) => trip.id === publicTrip1.id)).toBe(true)
      expect(result.trips.some((trip) => trip.id === publicTrip2.id)).toBe(true)
      expect(result.trips.some((trip) => trip.id === publicTrip3.id)).toBe(true)
    })

    it('should exclude private trips', async () => {
      const result = await getPublicFeed(20, undefined, db)

      expect(result.trips.some((trip) => trip.id === privateTrip.id)).toBe(false)
    })

    it('should respect limit parameter', async () => {
      const result = await getPublicFeed(2, undefined, db)

      expect(result.trips.length).toBe(2)
    })

    it('should support pagination with cursor', async () => {
      // 最初のページを取得
      const firstPage = await getPublicFeed(2, undefined, db)

      expect(firstPage.trips.length).toBe(2)
      expect(firstPage.nextCursor).toBeDefined()

      // 次のページを取得
      if (firstPage.nextCursor) {
        const secondPage = await getPublicFeed(2, firstPage.nextCursor, db)

        expect(secondPage.trips.length).toBe(1)
      }
    })

    it('should sort by created_at descending by default', async () => {
      const result = await getPublicFeed(20, undefined, db)

      expect(result.trips.length).toBeGreaterThan(0)
      // created_atでソートされていることを確認
      for (let i = 1; i < result.trips.length; i++) {
        const prev = result.trips[i - 1].created_at
        const curr = result.trips[i].created_at
        const prevTime = prev instanceof Date ? prev.getTime() : new Date(prev).getTime()
        const currTime = curr instanceof Date ? curr.getTime() : new Date(curr).getTime()
        expect(prevTime).toBeGreaterThanOrEqual(currTime)
      }
    })
  })

  describe('getTrendingFeed', () => {
    it('should return only public trips sorted by trending_score', async () => {
      const result = await getTrendingFeed(20, undefined, db)

      expect(result.trips.length).toBe(3)
      expect(result.trips.every((trip) => trip.access_level === 'public')).toBe(true)

      // trending_scoreでソートされていることを確認（降順）
      for (let i = 1; i < result.trips.length; i++) {
        const prev = result.trips[i - 1].trending_score || 0
        const curr = result.trips[i].trending_score || 0
        expect(prev).toBeGreaterThanOrEqual(curr)
      }
    })

    it('should exclude trips without trending_score', async () => {
      // trending_scoreがないトリップを作成
      const tripWithoutScore = createMockPublicTrip({
        id: 'public-trip-no-score',
        user_id: otherUserId,
        slug: 'public-trip-no-score',
        access_level: 'public',
        // trending_score: undefined
      })
      await db.collection(COLLECTIONS.TRIPS).doc(tripWithoutScore.id).set(tripWithoutScore)

      const result = await getTrendingFeed(20, undefined, db)

      expect(result.trips.some((trip) => trip.id === tripWithoutScore.id)).toBe(false)
    })

    it('should respect limit parameter', async () => {
      const result = await getTrendingFeed(2, undefined, db)

      expect(result.trips.length).toBe(2)
    })

    it('should support pagination with cursor', async () => {
      // 最初のページを取得
      const firstPage = await getTrendingFeed(2, undefined, db)

      expect(firstPage.trips.length).toBe(2)
      expect(firstPage.nextCursor).toBeDefined()

      // 次のページを取得
      if (firstPage.nextCursor) {
        const secondPage = await getTrendingFeed(2, firstPage.nextCursor, db)

        expect(secondPage.trips.length).toBe(1)
      }
    })
  })

  describe('getFollowingFeed', () => {
    beforeEach(async () => {
      // テスト前にフォロー関係を作成
      await db.collection(COLLECTIONS.USER_FOLLOWS).doc(`${userId}_${otherUserId}`).set({
        follower_id: userId,
        following_id: otherUserId,
        created_at: new Date(),
      })
    })

    it('should return only public trips from followed users', async () => {
      const result = await getFollowingFeed(userId, 20, undefined, db)

      expect(result.trips.length).toBeGreaterThan(0)
      expect(result.trips.every((trip) => trip.access_level === 'public')).toBe(true)
      expect(result.trips.every((trip) => trip.user_id === otherUserId)).toBe(true)
    })

    it('should exclude trips from non-followed users', async () => {
      // フォローしていないユーザーの公開トリップを作成
      const nonFollowedUserId = 'user3'
      const tripFromNonFollowed = createMockPublicTrip({
        id: 'public-trip-non-followed',
        user_id: nonFollowedUserId,
        slug: 'public-trip-non-followed',
        access_level: 'public',
      })
      await db.collection(COLLECTIONS.TRIPS).doc(tripFromNonFollowed.id).set(tripFromNonFollowed)

      const result = await getFollowingFeed(userId, 20, undefined, db)

      expect(result.trips.some((trip) => trip.id === tripFromNonFollowed.id)).toBe(false)
    })

    it('should exclude private trips even from followed users', async () => {
      const result = await getFollowingFeed(userId, 20, undefined, db)

      expect(result.trips.some((trip) => trip.id === privateTrip.id)).toBe(false)
    })

    it('should respect limit parameter', async () => {
      const result = await getFollowingFeed(userId, 2, undefined, db)

      expect(result.trips.length).toBeLessThanOrEqual(2)
    })

    it('should support pagination with cursor', async () => {
      // 最初のページを取得
      const firstPage = await getFollowingFeed(userId, 2, undefined, db)

      expect(firstPage.trips.length).toBeLessThanOrEqual(2)
      if (firstPage.trips.length === 2) {
        expect(firstPage.nextCursor).toBeDefined()

        // 次のページを取得
        if (firstPage.nextCursor) {
          const secondPage = await getFollowingFeed(userId, 2, firstPage.nextCursor, db)

          expect(secondPage.trips.length).toBeGreaterThanOrEqual(0)
        }
      }
    })

    it('should sort by created_at descending', async () => {
      const result = await getFollowingFeed(userId, 20, undefined, db)

      if (result.trips.length > 1) {
        // created_atでソートされていることを確認
        for (let i = 1; i < result.trips.length; i++) {
          const prev = result.trips[i - 1].created_at
          const curr = result.trips[i].created_at
          const prevTime = prev instanceof Date ? prev.getTime() : new Date(prev).getTime()
          const currTime = curr instanceof Date ? curr.getTime() : new Date(curr).getTime()
          expect(prevTime).toBeGreaterThanOrEqual(currTime)
        }
      }
    })
  })
})

