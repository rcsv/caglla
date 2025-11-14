/**
 * Trip Likes API Routes のテスト（構造定義）
 * 
 * Phase 1-3: API Routes実装（テストファースト）
 * 
 * 注意: これらのテストはFirestoreエミュレータを起動している必要があります。
 * エミュレータ起動: pnpm emulators:start:firestore
 * 
 * 使用方法:
 *   1. エミュレータを起動: pnpm emulators:start:firestore
 *   2. 別のターミナルでテスト実行: pnpm test:firestore -- trip-likes
 * 
 * 実装方針:
 *   - テスト構造を先に定義（テストファースト）
 *   - Phase 1-4でSocial Operationsを実装後、それを使用してAPI Routesを実装
 *   - 現在は、テストの期待動作を定義し、実装後に対応
 */

import { createAuthHeader, createUnauthenticatedHeader } from '@/lib/__tests__/helpers/test-auth'
import { createMockTrip, createMockPublicTrip } from '@/lib/__tests__/helpers/test-data'
import { getTestFirestore } from '@/lib/__tests__/helpers/test-firestore'
import { COLLECTIONS } from '@/lib/firebase/firestore'
import type { Trip } from '@/lib/core/types'
import type { Firestore } from 'firebase-admin/firestore'
import { NextRequest, NextResponse } from 'next/server'

// TODO: Phase 1-4で実装するSocial Operationsを使用
// import { toggleTripLike, getTripLikeState } from '@/lib/social/trip-likes'

// テスト用のモックハンドラー（実装後、実際のSocial OperationsまたはAPI Routesに置き換え）
async function handleLikeTrip(request: NextRequest, tripSlug: string): Promise<Response> {
  // TODO: Phase 1-4で実装後、実際のSocial Operationを呼び出す
  // const userId = await getUserIdFromRequest(request)
  // const result = await toggleTripLike(userId, tripSlug, 'like')
  // return NextResponse.json(result)
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 })
}

async function handleUnlikeTrip(request: NextRequest, tripSlug: string): Promise<Response> {
  // TODO: Phase 1-4で実装後、実際のSocial Operationを呼び出す
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 })
}

async function handleGetTripLikes(request: NextRequest, tripSlug: string): Promise<Response> {
  // TODO: Phase 1-4で実装後、実際のSocial Operationを呼び出す
  // const userId = await getUserIdFromRequest(request)
  // const result = await getTripLikeState(tripSlug, userId)
  // return NextResponse.json(result)
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 })
}

describe('Trip Likes API Routes', () => {
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

  describe('POST /api/trip/[tripSlug]/likes', () => {
    it('should allow authenticated users to like public trips', async () => {
      const request = new NextRequest('http://localhost/api/trip/public-trip-1/likes', {
        method: 'POST',
        headers: createAuthHeader(userId),
      })

      const response = await handleLikeTrip(request, 'public-trip-1')
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.liked).toBe(true)
      expect(data.likesCount).toBeGreaterThanOrEqual(1)

      // データベースにいいねが追加されたことを確認（v3.0.0ではtrip_likesコレクションを使用）
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

    it('should deny liking private trips', async () => {
      const request = new NextRequest('http://localhost/api/trip/private-trip-1/likes', {
        method: 'POST',
        headers: createAuthHeader(userId),
      })

      const response = await handleLikeTrip(request, 'private-trip-1')
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBeDefined()
    })

    it('should deny unauthenticated users from liking trips', async () => {
      const request = new NextRequest('http://localhost/api/trip/public-trip-1/likes', {
        method: 'POST',
        headers: createUnauthenticatedHeader(),
      })

      const response = await handleLikeTrip(request, 'public-trip-1')

      expect(response.status).toBe(401)
    })

    it('should not allow trip owners to like their own trips', async () => {
      const request = new NextRequest('http://localhost/api/trip/public-trip-1/likes', {
        method: 'POST',
        headers: createAuthHeader(otherUserId), // トリップの所有者
      })

      const response = await handleLikeTrip(request, 'public-trip-1')
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toContain('own')
    })

    it('should return 409 if trip is already liked', async () => {
      // 最初にいいねを作成
      await db.collection(COLLECTIONS.TRIP_LIKES).doc(`${userId}_${publicTrip.id}`).set({
        trip_id: publicTrip.id,
        user_id: userId,
        created_at: new Date(),
      })

      // Tripのsocial_statsを更新
      await db.collection(COLLECTIONS.TRIPS).doc(publicTrip.id).update({
        'social_stats.likes_count': 1,
      })

      const request = new NextRequest('http://localhost/api/trip/public-trip-1/likes', {
        method: 'POST',
        headers: createAuthHeader(userId),
      })

      const response = await handleLikeTrip(request, 'public-trip-1')
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toContain('already liked')
    })
  })

  describe('DELETE /api/trip/[tripSlug]/likes', () => {
    beforeEach(async () => {
      // テスト前にいいねを作成
      await db.collection(COLLECTIONS.TRIP_LIKES).doc(`${userId}_${publicTrip.id}`).set({
        trip_id: publicTrip.id,
        user_id: userId,
        created_at: new Date(),
      })

      // Tripのsocial_statsを更新
      await db.collection(COLLECTIONS.TRIPS).doc(publicTrip.id).update({
        'social_stats.likes_count': 1,
      })
    })

    it('should allow authenticated users to unlike trips they liked', async () => {
      const request = new NextRequest('http://localhost/api/trip/public-trip-1/likes', {
        method: 'DELETE',
        headers: createAuthHeader(userId),
      })

      const response = await handleUnlikeTrip(request, 'public-trip-1')
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.liked).toBe(false)

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

    it('should return 404 if trip is not liked', async () => {
      // いいねを削除（初回は存在する）
      const request1 = new NextRequest('http://localhost/api/trip/public-trip-1/likes', {
        method: 'DELETE',
        headers: createAuthHeader(userId),
      })
      await handleUnlikeTrip(request1, 'public-trip-1')

      // 2回目の削除は404を返す
      const request2 = new NextRequest('http://localhost/api/trip/public-trip-1/likes', {
        method: 'DELETE',
        headers: createAuthHeader(userId),
      })
      const response = await handleUnlikeTrip(request2, 'public-trip-1')
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toContain('not liked')
    })
  })

  describe('GET /api/trip/[tripSlug]/likes', () => {
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

      // Tripのsocial_statsを更新
      await db.collection(COLLECTIONS.TRIPS).doc(publicTrip.id).update({
        'social_stats.likes_count': 2,
      })
    })

    it('should return likes count for public trips', async () => {
      const request = new NextRequest('http://localhost/api/trip/public-trip-1/likes', {
        method: 'GET',
        headers: createAuthHeader(userId),
      })

      const response = await handleGetTripLikes(request, 'public-trip-1')
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.count).toBe(2)
      expect(data.liked).toBe(true) // 認証済みユーザーがいいねしている場合
    })

    it('should return liked=false if user has not liked the trip', async () => {
      const request = new NextRequest('http://localhost/api/trip/public-trip-1/likes', {
        method: 'GET',
        headers: createAuthHeader('user4'), // いいねしていないユーザー
      })

      const response = await handleGetTripLikes(request, 'public-trip-1')
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.count).toBe(2)
      expect(data.liked).toBe(false)
    })

    it('should deny access to private trip likes', async () => {
      const request = new NextRequest('http://localhost/api/trip/private-trip-1/likes', {
        method: 'GET',
        headers: createAuthHeader(userId),
      })

      const response = await handleGetTripLikes(request, 'private-trip-1')

      expect(response.status).toBe(403)
    })
  })
})
