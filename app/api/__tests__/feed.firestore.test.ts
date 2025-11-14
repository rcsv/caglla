/**
 * Feed API Routes のテスト
 * 
 * Phase 1-3-4: API Routes実装（テストファースト）
 * 
 * 注意: これらのテストはFirestoreエミュレータを起動している必要があります。
 * エミュレータ起動: pnpm emulators:start:firestore
 * 
 * 使用方法:
 *   1. エミュレータを起動: pnpm emulators:start:firestore
 *   2. 別のターミナルでテスト実行: pnpm test:firestore -- feed
 */

import { createAuthHeader, createUnauthenticatedHeader } from '@/lib/__tests__/helpers/test-auth'
import { createMockTrip, createMockPublicTrip } from '@/lib/__tests__/helpers/test-data'
import { getTestFirestore } from '@/lib/__tests__/helpers/test-firestore'
import { COLLECTIONS } from '@/lib/firebase/firestore'
import type { Trip } from '@/lib/core/types'
import type { Firestore } from 'firebase-admin/firestore'
import { NextRequest } from 'next/server'
import { GET as getPublicFeed } from '@/app/api/feed/public/route'
import { GET as getTrendingFeedRoute } from '@/app/api/feed/trending/route'
import { GET as getFollowingFeedRoute } from '@/app/api/feed/following/route'

// ヘルパー関数：API Routesを呼び出す
async function handleGetPublicFeed(request: NextRequest): Promise<Response> {
  return await getPublicFeed(request)
}

async function handleGetTrendingFeed(request: NextRequest): Promise<Response> {
  return await getTrendingFeedRoute(request)
}

async function handleGetFollowingFeed(request: NextRequest): Promise<Response> {
  return await getFollowingFeedRoute(request)
}

describe('Feed API Routes', () => {
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
    const followsSnapshot = await db.collection(COLLECTIONS.USER_FOLLOWS).get()
    const batch = db.batch()
    tripsSnapshot.docs.forEach((doc) => batch.delete(doc.ref))
    followsSnapshot.docs.forEach((doc) => batch.delete(doc.ref))
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

  describe('GET /api/feed/public', () => {
    it('should return only public trips', async () => {
      const request = new NextRequest('http://localhost/api/feed/public', {
        method: 'GET',
        headers: createAuthHeader(userId),
      })

      const response = await handleGetPublicFeed(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data.trips)).toBe(true)
      expect(data.trips.length).toBe(3)
      expect(data.trips.every((trip: Trip) => trip.access_level === 'public')).toBe(true)
      expect(data.trips.some((trip: Trip) => trip.id === publicTrip1.id)).toBe(true)
      expect(data.trips.some((trip: Trip) => trip.id === publicTrip2.id)).toBe(true)
      expect(data.trips.some((trip: Trip) => trip.id === publicTrip3.id)).toBe(true)
    })

    it('should exclude private trips', async () => {
      const request = new NextRequest('http://localhost/api/feed/public', {
        method: 'GET',
        headers: createAuthHeader(userId),
      })

      const response = await handleGetPublicFeed(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.trips.some((trip: Trip) => trip.id === privateTrip.id)).toBe(false)
    })

    it('should respect limit query parameter', async () => {
      const request = new NextRequest('http://localhost/api/feed/public?limit=2', {
        method: 'GET',
        headers: createAuthHeader(userId),
      })

      const response = await handleGetPublicFeed(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.trips.length).toBe(2)
    })

    it('should support pagination with cursor', async () => {
      // 最初のページを取得
      const request1 = new NextRequest('http://localhost/api/feed/public?limit=2', {
        method: 'GET',
        headers: createAuthHeader(userId),
      })

      const response1 = await handleGetPublicFeed(request1)
      const data1 = await response1.json()

      expect(response1.status).toBe(200)
      expect(data1.trips.length).toBe(2)
      expect(data1.nextCursor).toBeDefined()

      // 次のページを取得
      if (data1.nextCursor) {
        const request2 = new NextRequest(
          `http://localhost/api/feed/public?limit=2&cursor=${data1.nextCursor}`,
          {
            method: 'GET',
            headers: createAuthHeader(userId),
          }
        )

        const response2 = await handleGetPublicFeed(request2)
        const data2 = await response2.json()

        expect(response2.status).toBe(200)
        expect(data2.trips.length).toBe(1)
      }
    })

    it('should sort by created_at descending', async () => {
      const request = new NextRequest('http://localhost/api/feed/public', {
        method: 'GET',
        headers: createAuthHeader(userId),
      })

      const response = await handleGetPublicFeed(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.trips.length).toBeGreaterThan(0)

      // created_atでソートされていることを確認
      for (let i = 1; i < data.trips.length; i++) {
        const prev = data.trips[i - 1].created_at
        const curr = data.trips[i].created_at
        const prevTime = prev instanceof Date ? prev.getTime() : new Date(prev).getTime()
        const currTime = curr instanceof Date ? curr.getTime() : new Date(curr).getTime()
        expect(prevTime).toBeGreaterThanOrEqual(currTime)
      }
    })
  })

  describe('GET /api/feed/trending', () => {
    it('should return only public trips sorted by trending_score', async () => {
      const request = new NextRequest('http://localhost/api/feed/trending', {
        method: 'GET',
        headers: createAuthHeader(userId),
      })

      const response = await handleGetTrendingFeed(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data.trips)).toBe(true)
      expect(data.trips.length).toBe(3)
      expect(data.trips.every((trip: Trip) => trip.access_level === 'public')).toBe(true)

      // trending_scoreでソートされていることを確認（降順）
      for (let i = 1; i < data.trips.length; i++) {
        const prev = data.trips[i - 1].trending_score || 0
        const curr = data.trips[i].trending_score || 0
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

      const request = new NextRequest('http://localhost/api/feed/trending', {
        method: 'GET',
        headers: createAuthHeader(userId),
      })

      const response = await handleGetTrendingFeed(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.trips.some((trip: Trip) => trip.id === tripWithoutScore.id)).toBe(false)
    })

    it('should respect limit query parameter', async () => {
      const request = new NextRequest('http://localhost/api/feed/trending?limit=2', {
        method: 'GET',
        headers: createAuthHeader(userId),
      })

      const response = await handleGetTrendingFeed(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.trips.length).toBe(2)
    })

    it('should support pagination with cursor', async () => {
      // 最初のページを取得
      const request1 = new NextRequest('http://localhost/api/feed/trending?limit=2', {
        method: 'GET',
        headers: createAuthHeader(userId),
      })

      const response1 = await handleGetTrendingFeed(request1)
      const data1 = await response1.json()

      expect(response1.status).toBe(200)
      expect(data1.trips.length).toBe(2)
      expect(data1.nextCursor).toBeDefined()

      // 次のページを取得
      if (data1.nextCursor) {
        const request2 = new NextRequest(
          `http://localhost/api/feed/trending?limit=2&cursor=${data1.nextCursor}`,
          {
            method: 'GET',
            headers: createAuthHeader(userId),
          }
        )

        const response2 = await handleGetTrendingFeed(request2)
        const data2 = await response2.json()

        expect(response2.status).toBe(200)
        expect(data2.trips.length).toBe(1)
      }
    })
  })

  describe('GET /api/feed/following', () => {
    beforeEach(async () => {
      // テスト前にフォロー関係を作成
      await db.collection(COLLECTIONS.USER_FOLLOWS).doc(`${userId}_${otherUserId}`).set({
        follower_id: userId,
        following_id: otherUserId,
        created_at: new Date(),
      })
    })

    it('should return only public trips from followed users', async () => {
      const request = new NextRequest('http://localhost/api/feed/following', {
        method: 'GET',
        headers: createAuthHeader(userId),
      })

      const response = await handleGetFollowingFeed(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data.trips)).toBe(true)
      expect(data.trips.length).toBeGreaterThan(0)
      expect(data.trips.every((trip: Trip) => trip.access_level === 'public')).toBe(true)
      expect(data.trips.every((trip: Trip) => trip.user_id === otherUserId)).toBe(true)
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

      const request = new NextRequest('http://localhost/api/feed/following', {
        method: 'GET',
        headers: createAuthHeader(userId),
      })

      const response = await handleGetFollowingFeed(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.trips.some((trip: Trip) => trip.id === tripFromNonFollowed.id)).toBe(false)
    })

    it('should exclude private trips even from followed users', async () => {
      const request = new NextRequest('http://localhost/api/feed/following', {
        method: 'GET',
        headers: createAuthHeader(userId),
      })

      const response = await handleGetFollowingFeed(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.trips.some((trip: Trip) => trip.id === privateTrip.id)).toBe(false)
    })

    it('should respect limit query parameter', async () => {
      const request = new NextRequest('http://localhost/api/feed/following?limit=2', {
        method: 'GET',
        headers: createAuthHeader(userId),
      })

      const response = await handleGetFollowingFeed(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.trips.length).toBeLessThanOrEqual(2)
    })

    it('should support pagination with cursor', async () => {
      // 最初のページを取得
      const request1 = new NextRequest('http://localhost/api/feed/following?limit=2', {
        method: 'GET',
        headers: createAuthHeader(userId),
      })

      const response1 = await handleGetFollowingFeed(request1)
      const data1 = await response1.json()

      expect(response1.status).toBe(200)
      expect(data1.trips.length).toBeLessThanOrEqual(2)
      if (data1.trips.length === 2) {
        expect(data1.nextCursor).toBeDefined()

        // 次のページを取得
        if (data1.nextCursor) {
          const request2 = new NextRequest(
            `http://localhost/api/feed/following?limit=2&cursor=${data1.nextCursor}`,
            {
              method: 'GET',
              headers: createAuthHeader(userId),
            }
          )

          const response2 = await handleGetFollowingFeed(request2)
          const data2 = await response2.json()

          expect(response2.status).toBe(200)
          expect(data2.trips.length).toBeGreaterThanOrEqual(0)
        }
      }
    })

    it('should sort by created_at descending', async () => {
      const request = new NextRequest('http://localhost/api/feed/following', {
        method: 'GET',
        headers: createAuthHeader(userId),
      })

      const response = await handleGetFollowingFeed(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      if (data.trips.length > 1) {
        // created_atでソートされていることを確認
        for (let i = 1; i < data.trips.length; i++) {
          const prev = data.trips[i - 1].created_at
          const curr = data.trips[i].created_at
          const prevTime = prev instanceof Date ? prev.getTime() : new Date(prev).getTime()
          const currTime = curr instanceof Date ? curr.getTime() : new Date(curr).getTime()
          expect(prevTime).toBeGreaterThanOrEqual(currTime)
        }
      }
    })

    it('should deny unauthenticated users', async () => {
      const request = new NextRequest('http://localhost/api/feed/following', {
        method: 'GET',
        headers: createUnauthenticatedHeader(),
      })

      const response = await handleGetFollowingFeed(request)

      expect(response.status).toBe(401)
    })
  })
})

