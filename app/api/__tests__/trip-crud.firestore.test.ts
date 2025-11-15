/**
 * Trip CRUD API Routes のテスト
 * 
 * Phase 2: トリップ管理APIテスト実装
 * 
 * 注意: これらのテストはFirestoreエミュレータを起動している必要があります。
 * エミュレータ起動: pnpm emulators:start:firestore
 * 
 * 使用方法:
 *   1. エミュレータを起動: pnpm emulators:start:firestore
 *   2. 別のターミナルでテスト実行: pnpm test:firestore -- trip-crud
 */

import { createAuthHeader, createUnauthenticatedHeader } from '@/lib/__tests__/helpers/test-auth'
import { createMockTrip, createMockPublicTrip, createMockTemplateTrip } from '@/lib/__tests__/helpers/test-data'
import { getTestFirestore } from '@/lib/__tests__/helpers/test-firestore'
import { COLLECTIONS } from '@/lib/firebase/firestore'
import type { Trip, Day } from '@/lib/core/types'
import type { Firestore } from 'firebase-admin/firestore'
import { NextRequest } from 'next/server'
import { GET as getTrip, PUT as putTrip, DELETE as deleteTrip } from '@/app/api/trip/[tripSlug]/route'
import { POST as publishTrip, DELETE as unpublishTrip } from '@/app/api/trip/[tripSlug]/publish/route'
import { POST as replicateTrip } from '@/app/api/trip/[tripSlug]/replica/route'

// ヘルパー関数：API Routesを呼び出す
async function handleGetTrip(request: NextRequest, tripSlug: string): Promise<Response> {
  return await getTrip(request, { params: Promise.resolve({ tripSlug }) })
}

async function handlePutTrip(request: NextRequest, tripSlug: string): Promise<Response> {
  return await putTrip(request, { params: Promise.resolve({ tripSlug }) })
}

async function handleDeleteTrip(request: NextRequest, tripSlug: string): Promise<Response> {
  return await deleteTrip(request, { params: Promise.resolve({ tripSlug }) })
}

async function handlePublishTrip(request: NextRequest, tripSlug: string): Promise<Response> {
  return await publishTrip(request, { params: Promise.resolve({ tripSlug }) })
}

async function handleUnpublishTrip(request: NextRequest, tripSlug: string): Promise<Response> {
  return await unpublishTrip(request, { params: Promise.resolve({ tripSlug }) })
}

async function handleReplicateTrip(request: NextRequest, tripSlug: string): Promise<Response> {
  return await replicateTrip(request, { params: Promise.resolve({ tripSlug }) })
}

describe('Trip CRUD API Routes', () => {
  let db: Firestore
  let userId: string
  let otherUserId: string
  let publicTrip: Trip
  let privateTrip: Trip
  let templateTrip: Trip

  beforeAll(async () => {
    db = getTestFirestore()
  })

  beforeEach(async () => {
    // テストデータのクリーンアップ
    const tripsSnapshot = await db.collection(COLLECTIONS.TRIPS).get()
    const daysSnapshot = await db.collection(COLLECTIONS.DAYS).get()
    const usersSnapshot = await db.collection(COLLECTIONS.USERS).get()
    const batch = db.batch()
    tripsSnapshot.docs.forEach((doc) => batch.delete(doc.ref))
    daysSnapshot.docs.forEach((doc) => batch.delete(doc.ref))
    usersSnapshot.docs.forEach((doc) => batch.delete(doc.ref))
    await batch.commit()

    // テストデータのセットアップ
    userId = 'user1'
    otherUserId = 'user2'

    // 公開トリップ、プライベートトリップ、テンプレートトリップを作成
    publicTrip = createMockPublicTrip({
      id: 'public-trip-1',
      user_id: otherUserId,
      slug: 'public-trip-1',
      title: 'Public Trip',
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
      user_id: userId,
      slug: 'private-trip-1',
      title: 'Private Trip',
      access_level: 'private',
    })

    templateTrip = createMockTemplateTrip({
      id: 'template-trip-1',
      user_id: otherUserId,
      slug: 'template-trip-1',
      title: 'Template Trip',
      access_level: 'public',
      is_template: true,
      day_count: 3,
    })

    await db.collection(COLLECTIONS.TRIPS).doc(publicTrip.id).set(publicTrip)
    await db.collection(COLLECTIONS.TRIPS).doc(privateTrip.id).set(privateTrip)
    await db.collection(COLLECTIONS.TRIPS).doc(templateTrip.id).set(templateTrip)

    // テンプレートトリップのDaysを作成（replicaテスト用）
    const templateDays: Day[] = []
    for (let i = 1; i <= 3; i++) {
      const day: Day = {
        id: `template-day-${i}`,
        trip_id: templateTrip.id,
        day_number: i,
        date: new Date(2024, 0, i),
        created_at: new Date(),
        updated_at: new Date(),
      }
      templateDays.push(day)
      await db.collection(COLLECTIONS.DAYS).doc(day.id).set(day)
    }
  })

  describe('GET /api/trip/[tripSlug]', () => {
    it('should return public trip for any user', async () => {
      const request = new NextRequest(`http://localhost/api/trip/${publicTrip.slug}`, {
        method: 'GET',
        headers: createUnauthenticatedHeader(),
      })

      const response = await handleGetTrip(request, publicTrip.slug!)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.id).toBe(publicTrip.id)
      expect(data.title).toBe(publicTrip.title)
      expect(data.access_level).toBe('public')
    })

    it('should return private trip for owner', async () => {
      const request = new NextRequest(`http://localhost/api/trip/${privateTrip.slug}`, {
        method: 'GET',
        headers: createAuthHeader(userId),
      })

      const response = await handleGetTrip(request, privateTrip.slug!)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.id).toBe(privateTrip.id)
      expect(data.title).toBe(privateTrip.title)
      expect(data.access_level).toBe('private')
    })

    it('should deny access to private trip for non-owner', async () => {
      const request = new NextRequest(`http://localhost/api/trip/${privateTrip.slug}`, {
        method: 'GET',
        headers: createAuthHeader(otherUserId), // 別のユーザーで認証
      })

      const response = await handleGetTrip(request, privateTrip.slug!)

      expect(response.status).toBe(403)
    })

    it('should deny access to private trip for unauthenticated users', async () => {
      const request = new NextRequest(`http://localhost/api/trip/${privateTrip.slug}`, {
        method: 'GET',
        headers: createUnauthenticatedHeader(),
      })

      const response = await handleGetTrip(request, privateTrip.slug!)

      expect(response.status).toBe(403)
    })

    it('should return 404 for non-existent trip', async () => {
      const request = new NextRequest('http://localhost/api/trip/non-existent-trip', {
        method: 'GET',
        headers: createUnauthenticatedHeader(),
      })

      const response = await handleGetTrip(request, 'non-existent-trip')

      expect(response.status).toBe(404)
    })
  })

  describe('PUT /api/trip/[tripSlug]', () => {
    it('should update trip for authenticated owner', async () => {
      const request = new NextRequest(`http://localhost/api/trip/${privateTrip.slug}`, {
        method: 'PUT',
        headers: createAuthHeader(userId),
        body: JSON.stringify({
          title: 'Updated Title',
          description: 'Updated description',
        }),
      })

      const response = await handlePutTrip(request, privateTrip.slug!)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      // データベースにトリップが更新されたことを確認
      const tripDoc = await db.collection(COLLECTIONS.TRIPS).doc(privateTrip.id).get()
      const updatedTrip = tripDoc.data() as Trip
      expect(updatedTrip.title).toBe('Updated Title')
    })

    it('should deny updating trip for non-owner', async () => {
      const request = new NextRequest(`http://localhost/api/trip/${privateTrip.slug}`, {
        method: 'PUT',
        headers: createAuthHeader(otherUserId), // 別のユーザーで認証
        body: JSON.stringify({
          title: 'Hacked Title',
        }),
      })

      const response = await handlePutTrip(request, privateTrip.slug!)

      expect(response.status).toBe(403)
    })

    it('should deny unauthenticated users', async () => {
      const request = new NextRequest(`http://localhost/api/trip/${privateTrip.slug}`, {
        method: 'PUT',
        headers: createUnauthenticatedHeader(),
        body: JSON.stringify({ title: 'Test Title' }),
      })

      const response = await handlePutTrip(request, privateTrip.slug!)

      expect(response.status).toBe(401)
    })

    it('should return 404 for non-existent trip', async () => {
      const request = new NextRequest('http://localhost/api/trip/non-existent-trip', {
        method: 'PUT',
        headers: createAuthHeader(userId),
        body: JSON.stringify({ title: 'Test Title' }),
      })

      const response = await handlePutTrip(request, 'non-existent-trip')

      expect(response.status).toBe(404)
    })
  })

  describe('DELETE /api/trip/[tripSlug]', () => {
    it('should delete trip for authenticated owner', async () => {
      const request = new NextRequest(`http://localhost/api/trip/${privateTrip.slug}`, {
        method: 'DELETE',
        headers: createAuthHeader(userId),
      })

      const response = await handleDeleteTrip(request, privateTrip.slug!)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      // データベースからトリップが削除されたことを確認
      const tripDoc = await db.collection(COLLECTIONS.TRIPS).doc(privateTrip.id).get()
      expect(tripDoc.exists).toBe(false)
    })

    it('should deny deleting trip for non-owner', async () => {
      const request = new NextRequest(`http://localhost/api/trip/${privateTrip.slug}`, {
        method: 'DELETE',
        headers: createAuthHeader(otherUserId), // 別のユーザーで認証
      })

      const response = await handleDeleteTrip(request, privateTrip.slug!)

      expect(response.status).toBe(403)
    })

    it('should deny unauthenticated users', async () => {
      const request = new NextRequest(`http://localhost/api/trip/${privateTrip.slug}`, {
        method: 'DELETE',
        headers: createUnauthenticatedHeader(),
      })

      const response = await handleDeleteTrip(request, privateTrip.slug!)

      expect(response.status).toBe(401)
    })

    it('should return 404 for non-existent trip', async () => {
      const request = new NextRequest('http://localhost/api/trip/non-existent-trip', {
        method: 'DELETE',
        headers: createAuthHeader(userId),
      })

      const response = await handleDeleteTrip(request, 'non-existent-trip')

      expect(response.status).toBe(404)
    })
  })

  describe('POST /api/trip/[tripSlug]/publish', () => {
    it('should publish private trip for authenticated owner', async () => {
      const request = new NextRequest(`http://localhost/api/trip/${privateTrip.slug}/publish`, {
        method: 'POST',
        headers: createAuthHeader(userId),
        body: JSON.stringify({}),
      })

      const response = await handlePublishTrip(request, privateTrip.slug!)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.trip.access_level).toBe('public')

      // データベースにトリップが公開されたことを確認
      const tripDoc = await db.collection(COLLECTIONS.TRIPS).doc(privateTrip.id).get()
      const updatedTrip = tripDoc.data() as Trip
      expect(updatedTrip.access_level).toBe('public')
    })

    it('should deny publishing trip for non-owner', async () => {
      const request = new NextRequest(`http://localhost/api/trip/${privateTrip.slug}/publish`, {
        method: 'POST',
        headers: createAuthHeader(otherUserId), // 別のユーザーで認証
        body: JSON.stringify({}),
      })

      const response = await handlePublishTrip(request, privateTrip.slug!)

      expect(response.status).toBe(403)
    })

    it('should deny unauthenticated users', async () => {
      const request = new NextRequest(`http://localhost/api/trip/${privateTrip.slug}/publish`, {
        method: 'POST',
        headers: createUnauthenticatedHeader(),
        body: JSON.stringify({}),
      })

      const response = await handlePublishTrip(request, privateTrip.slug!)

      expect(response.status).toBe(401)
    })

    it('should return 404 for non-existent trip', async () => {
      const request = new NextRequest('http://localhost/api/trip/non-existent-trip/publish', {
        method: 'POST',
        headers: createAuthHeader(userId),
        body: JSON.stringify({}),
      })

      const response = await handlePublishTrip(request, 'non-existent-trip')

      expect(response.status).toBe(404)
    })
  })

  describe('DELETE /api/trip/[tripSlug]/publish', () => {
    it('should unpublish public trip for authenticated owner', async () => {
      const request = new NextRequest(`http://localhost/api/trip/${publicTrip.slug}/publish`, {
        method: 'DELETE',
        headers: createAuthHeader(otherUserId), // 公開トリップの所有者
      })

      const response = await handleUnpublishTrip(request, publicTrip.slug!)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.trip.access_level).toBe('private')

      // データベースにトリップが非公開になったことを確認
      const tripDoc = await db.collection(COLLECTIONS.TRIPS).doc(publicTrip.id).get()
      const updatedTrip = tripDoc.data() as Trip
      expect(updatedTrip.access_level).toBe('private')
    })

    it('should deny unpublishing trip for non-owner', async () => {
      const request = new NextRequest(`http://localhost/api/trip/${publicTrip.slug}/publish`, {
        method: 'DELETE',
        headers: createAuthHeader(userId), // 別のユーザーで認証
      })

      const response = await handleUnpublishTrip(request, publicTrip.slug!)

      expect(response.status).toBe(403)
    })

    it('should deny unauthenticated users', async () => {
      const request = new NextRequest(`http://localhost/api/trip/${publicTrip.slug}/publish`, {
        method: 'DELETE',
        headers: createUnauthenticatedHeader(),
      })

      const response = await handleUnpublishTrip(request, publicTrip.slug!)

      expect(response.status).toBe(401)
    })

    it('should return 400 if trip is already private', async () => {
      const request = new NextRequest(`http://localhost/api/trip/${privateTrip.slug}/publish`, {
        method: 'DELETE',
        headers: createAuthHeader(userId),
      })

      const response = await handleUnpublishTrip(request, privateTrip.slug!)

      expect(response.status).toBe(400)
    })

    it('should return 404 for non-existent trip', async () => {
      const request = new NextRequest('http://localhost/api/trip/non-existent-trip/publish', {
        method: 'DELETE',
        headers: createAuthHeader(userId),
      })

      const response = await handleUnpublishTrip(request, 'non-existent-trip')

      expect(response.status).toBe(404)
    })
  })

  describe('POST /api/trip/[tripSlug]/replica', () => {
    it('should create replica from public template', async () => {
      const startDate = new Date(2024, 1, 1) // 2024年2月1日
      const request = new NextRequest(`http://localhost/api/trip/${templateTrip.slug}/replica`, {
        method: 'POST',
        headers: createAuthHeader(userId),
        body: JSON.stringify({
          startDate: startDate.toISOString(),
        }),
      })

      const response = await handleReplicateTrip(request, templateTrip.slug!)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.trip).toBeDefined()
      expect(data.trip.access_level).toBe('private') // レプリカは常にprivate
      expect(data.trip.is_template).toBe(false) // レプリカはテンプレートではない
      expect(data.trip.user_id).toBe(userId) // レプリカの所有者は現在のユーザー

      // データベースにレプリカが作成されたことを確認
      const replicaDoc = await db.collection(COLLECTIONS.TRIPS).doc(data.trip.id).get()
      expect(replicaDoc.exists).toBe(true)
      const replicaTrip = replicaDoc.data() as Trip
      expect(replicaTrip.user_id).toBe(userId)
      expect(replicaTrip.access_level).toBe('private')
      expect(replicaTrip.is_template).toBe(false)

      // Daysがコピーされたことを確認
      const replicaDays = await db
        .collection(COLLECTIONS.DAYS)
        .where('trip_id', '==', data.trip.id)
        .get()
      expect(replicaDays.size).toBe(3) // テンプレートには3日分のDaysがある
    })

    it('should deny creating replica from private template for non-owner', async () => {
      // プライベートテンプレートを作成
      const privateTemplate = createMockTemplateTrip({
        id: 'private-template-1',
        user_id: otherUserId,
        slug: 'private-template-1',
        access_level: 'private',
        is_template: true,
      })
      await db.collection(COLLECTIONS.TRIPS).doc(privateTemplate.id).set(privateTemplate)

      const request = new NextRequest(`http://localhost/api/trip/${privateTemplate.slug}/replica`, {
        method: 'POST',
        headers: createAuthHeader(userId), // 別のユーザーで認証
        body: JSON.stringify({
          startDate: new Date().toISOString(),
        }),
      })

      const response = await handleReplicateTrip(request, privateTemplate.slug!)

      expect(response.status).toBe(403)
    })

    it('should deny unauthenticated users', async () => {
      const request = new NextRequest(`http://localhost/api/trip/${templateTrip.slug}/replica`, {
        method: 'POST',
        headers: createUnauthenticatedHeader(),
        body: JSON.stringify({
          startDate: new Date().toISOString(),
        }),
      })

      const response = await handleReplicateTrip(request, templateTrip.slug!)

      expect(response.status).toBe(401)
    })

    it('should return 400 if trip is not a template', async () => {
      const request = new NextRequest(`http://localhost/api/trip/${publicTrip.slug}/replica`, {
        method: 'POST',
        headers: createAuthHeader(userId),
        body: JSON.stringify({
          startDate: new Date().toISOString(),
        }),
      })

      const response = await handleReplicateTrip(request, publicTrip.slug!)

      expect(response.status).toBe(400)
    })

    it('should return 400 if startDate is missing for template with days', async () => {
      const request = new NextRequest(`http://localhost/api/trip/${templateTrip.slug}/replica`, {
        method: 'POST',
        headers: createAuthHeader(userId),
        body: JSON.stringify({}),
      })

      const response = await handleReplicateTrip(request, templateTrip.slug!)

      expect(response.status).toBe(400)
    })

    it('should return 404 for non-existent trip', async () => {
      const request = new NextRequest('http://localhost/api/trip/non-existent-trip/replica', {
        method: 'POST',
        headers: createAuthHeader(userId),
        body: JSON.stringify({
          startDate: new Date().toISOString(),
        }),
      })

      const response = await handleReplicateTrip(request, 'non-existent-trip')

      expect(response.status).toBe(404)
    })
  })
})

