/**
 * Users API Routes のテスト
 * 
 * Phase 2: ユーザー管理APIテスト実装
 * 
 * 注意: これらのテストはFirestoreエミュレータを起動している必要があります。
 * エミュレータ起動: pnpm emulators:start:firestore
 * 
 * 使用方法:
 *   1. エミュレータを起動: pnpm emulators:start:firestore
 *   2. 別のターミナルでテスト実行: pnpm test:firestore -- users
 */

import { createAuthHeader, createUnauthenticatedHeader, createMockUser } from '@/lib/__tests__/helpers/test-auth'
import { getTestFirestore } from '@/lib/__tests__/helpers/test-firestore'
import { COLLECTIONS } from '@/lib/firebase/firestore'
import type { User } from '@/lib/core/types'
import type { Firestore } from 'firebase-admin/firestore'
import { NextRequest } from 'next/server'
import { GET as getUsers, POST as postUsers } from '@/app/api/users/route'
import { GET as getUserBySlug, PUT as putUserBySlug } from '@/app/api/users/[userSlug]/route'
import { POST as checkSlug } from '@/app/api/users/check-slug/route'
import { GET as getUserPlan, PUT as putUserPlan } from '@/app/api/user/plan/route'
import { PlanId } from '@/lib/subscription/restriction'

// ヘルパー関数：API Routesを呼び出す
async function handleGetUsers(request: NextRequest): Promise<Response> {
  return await getUsers(request)
}

async function handlePostUsers(request: NextRequest): Promise<Response> {
  return await postUsers(request)
}

async function handleGetUserBySlug(request: NextRequest, userSlug: string): Promise<Response> {
  return await getUserBySlug(request, { params: Promise.resolve({ userSlug }) })
}

async function handlePutUserBySlug(request: NextRequest, userSlug: string): Promise<Response> {
  return await putUserBySlug(request, { params: Promise.resolve({ userSlug }) })
}

async function handleCheckSlug(request: NextRequest): Promise<Response> {
  return await checkSlug(request)
}

async function handleGetUserPlan(request: NextRequest): Promise<Response> {
  return await getUserPlan(request)
}

async function handlePutUserPlan(request: NextRequest): Promise<Response> {
  return await putUserPlan(request)
}

describe('Users API Routes', () => {
  let db: Firestore
  let userId: string
  let otherUserId: string
  let user: User
  let otherUser: User

  beforeAll(async () => {
    db = getTestFirestore()
  })

  beforeEach(async () => {
    // テストデータのクリーンアップ
    const usersSnapshot = await db.collection(COLLECTIONS.USERS).get()
    const batch = db.batch()
    usersSnapshot.docs.forEach((doc) => batch.delete(doc.ref))
    await batch.commit()

    // テストデータのセットアップ
    userId = 'user1'
    otherUserId = 'user2'

    // テスト用ユーザーを作成
    const mockUser1 = createMockUser(userId)
    const mockUser2 = createMockUser(otherUserId)

    user = {
      id: 'user1-doc-id',
      google_id: userId,
      name: mockUser1.displayName,
      email: mockUser1.email,
      slug: 'test-user-1',
      profile_image_url: mockUser1.photoURL,
      bio: 'Test bio',
      planId: PlanId.SEASON_TRAVELER,
      created_at: new Date(),
      updated_at: new Date(),
    }

    otherUser = {
      id: 'user2-doc-id',
      google_id: otherUserId,
      name: mockUser2.displayName,
      email: mockUser2.email,
      slug: 'test-user-2',
      profile_image_url: mockUser2.photoURL,
      bio: 'Other user bio',
      planId: PlanId.BACKPACKER,
      created_at: new Date(),
      updated_at: new Date(),
    }

    await db.collection(COLLECTIONS.USERS).doc(user.id).set(user)
    await db.collection(COLLECTIONS.USERS).doc(otherUser.id).set(otherUser)
  })

  describe('GET /api/users', () => {
    it('should return user data for authenticated user', async () => {
      const request = new NextRequest('http://localhost/api/users', {
        method: 'GET',
        headers: createAuthHeader(userId),
      })

      const response = await handleGetUsers(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.user).toBeDefined()
      expect(data.user.google_id).toBe(userId)
      expect(data.user.name).toBe(user.name)
    })

    it('should deny unauthenticated users', async () => {
      const request = new NextRequest('http://localhost/api/users', {
        method: 'GET',
        headers: createUnauthenticatedHeader(),
      })

      const response = await handleGetUsers(request)

      expect(response.status).toBe(401)
    })

    it('should return 404 for non-existent user', async () => {
      const request = new NextRequest('http://localhost/api/users', {
        method: 'GET',
        headers: createAuthHeader('non-existent-user'),
      })

      const response = await handleGetUsers(request)

      expect(response.status).toBe(404)
    })
  })

  describe('POST /api/users', () => {
    it('should create new user', async () => {
      const newUserId = 'new-user'
      const newUserData = createMockUser(newUserId)

      const request = new NextRequest('http://localhost/api/users', {
        method: 'POST',
        headers: createAuthHeader(newUserId),
        body: JSON.stringify({
          name: newUserData.displayName,
          email: newUserData.email,
          profile_image_url: newUserData.photoURL,
        }),
      })

      const response = await handlePostUsers(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.user).toBeDefined()
      expect(data.user.name).toBe(newUserData.displayName)
      expect(data.user.google_id).toBe(newUserId)

      // データベースにユーザーが作成されたことを確認
      const userQuery = await db.collection(COLLECTIONS.USERS).where('google_id', '==', newUserId).get()
      expect(userQuery.empty).toBe(false)
      const createdUser = userQuery.docs[0].data() as User
      expect(createdUser.name).toBe(newUserData.displayName)
    })

    it('should update existing user', async () => {
      const request = new NextRequest('http://localhost/api/users', {
        method: 'POST',
        headers: createAuthHeader(userId),
        body: JSON.stringify({
          name: 'Updated Name',
          bio: 'Updated bio',
        }),
      })

      const response = await handlePostUsers(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.user).toBeDefined()
      expect(data.user.name).toBe('Updated Name')
      expect(data.user.bio).toBe('Updated bio')

      // データベースにユーザーが更新されたことを確認
      const userDoc = await db.collection(COLLECTIONS.USERS).doc(user.id).get()
      const updatedUser = userDoc.data() as User
      expect(updatedUser.bio).toBe('Updated bio')
    })

    it('should deny unauthenticated users', async () => {
      const request = new NextRequest('http://localhost/api/users', {
        method: 'POST',
        headers: createUnauthenticatedHeader(),
        body: JSON.stringify({ name: 'Test User' }),
      })

      const response = await handlePostUsers(request)

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/users/[userSlug]', () => {
    it('should return public user data for any user', async () => {
      const request = new NextRequest(`http://localhost/api/users/${user.slug}`, {
        method: 'GET',
        headers: createUnauthenticatedHeader(),
      })

      const response = await handleGetUserBySlug(request, user.slug!)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.user).toBeDefined()
      expect(data.user.name).toBe(user.name)
      expect(data.user.slug).toBe(user.slug)
      expect(data.user.profile_image_url).toBe(user.profile_image_url)
      expect(data.user.bio).toBe(user.bio)
      // プライベート情報は返さない
      expect(data.user.email).toBeUndefined()
      expect(data.user.google_id).toBeUndefined()
      expect(data.user.planId).toBeUndefined()
    })

    it('should return 404 for non-existent user slug', async () => {
      const request = new NextRequest('http://localhost/api/users/non-existent-slug', {
        method: 'GET',
        headers: createUnauthenticatedHeader(),
      })

      const response = await handleGetUserBySlug(request, 'non-existent-slug')

      expect(response.status).toBe(404)
    })
  })

  describe('PUT /api/users/[userSlug]', () => {
    it('should update user data for authenticated owner', async () => {
      const request = new NextRequest(`http://localhost/api/users/${user.slug}`, {
        method: 'PUT',
        headers: createAuthHeader(userId),
        body: JSON.stringify({
          name: 'New Name',
          bio: 'New bio',
        }),
      })

      const response = await handlePutUserBySlug(request, user.slug!)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.user).toBeDefined()
      expect(data.user.name).toBe('New Name')
      expect(data.user.bio).toBe('New bio')

      // データベースにユーザーが更新されたことを確認
      const userDoc = await db.collection(COLLECTIONS.USERS).doc(user.id).get()
      const updatedUser = userDoc.data() as User
      expect(updatedUser.name).toBe('New Name')
      expect(updatedUser.bio).toBe('New bio')
    })

    it('should deny updating other users', async () => {
      const request = new NextRequest(`http://localhost/api/users/${otherUser.slug}`, {
        method: 'PUT',
        headers: createAuthHeader(userId), // 別のユーザーで認証
        body: JSON.stringify({
          name: 'Hacked Name',
        }),
      })

      const response = await handlePutUserBySlug(request, otherUser.slug!)

      expect(response.status).toBe(403)
    })

    it('should deny unauthenticated users', async () => {
      const request = new NextRequest(`http://localhost/api/users/${user.slug}`, {
        method: 'PUT',
        headers: createUnauthenticatedHeader(),
        body: JSON.stringify({ name: 'Test User' }),
      })

      const response = await handlePutUserBySlug(request, user.slug!)

      expect(response.status).toBe(401)
    })

    it('should return 400 if no fields to update', async () => {
      const request = new NextRequest(`http://localhost/api/users/${user.slug}`, {
        method: 'PUT',
        headers: createAuthHeader(userId),
        body: JSON.stringify({}),
      })

      const response = await handlePutUserBySlug(request, user.slug!)

      expect(response.status).toBe(400)
    })

    it('should generate new slug when name changes', async () => {
      const request = new NextRequest(`http://localhost/api/users/${user.slug}`, {
        method: 'PUT',
        headers: createAuthHeader(userId),
        body: JSON.stringify({
          name: 'Completely Different Name',
        }),
      })

      const response = await handlePutUserBySlug(request, user.slug!)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.user.name).toBe('Completely Different Name')
      expect(data.user.slug).not.toBe(user.slug)
    })
  })

  describe('POST /api/users/check-slug', () => {
    it('should return available if slug is not in use', async () => {
      const request = new NextRequest('http://localhost/api/users/check-slug', {
        method: 'POST',
        headers: createAuthHeader(userId),
        body: JSON.stringify({
          name: 'Unique New Name',
        }),
      })

      const response = await handleCheckSlug(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.isAvailable).toBe(true)
      expect(data.slug).toBeDefined()
    })

    it('should return unavailable if slug is already in use', async () => {
      // 既存のユーザーと同じ名前をチェック
      const request = new NextRequest('http://localhost/api/users/check-slug', {
        method: 'POST',
        headers: createAuthHeader(otherUserId), // 別のユーザーで認証
        body: JSON.stringify({
          name: user.name, // 既存のユーザー名と同じ
        }),
      })

      const response = await handleCheckSlug(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.isAvailable).toBe(false)
    })

    it('should return available if same user uses same name', async () => {
      // 既存ユーザーが同じ名前をチェック
      const request = new NextRequest('http://localhost/api/users/check-slug', {
        method: 'POST',
        headers: createAuthHeader(userId),
        body: JSON.stringify({
          name: user.name, // 自分の名前と同じ
        }),
      })

      const response = await handleCheckSlug(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.isAvailable).toBe(true) // 自分自身の名前は使用可能
    })

    it('should deny unauthenticated users', async () => {
      const request = new NextRequest('http://localhost/api/users/check-slug', {
        method: 'POST',
        headers: createUnauthenticatedHeader(),
        body: JSON.stringify({ name: 'Test User' }),
      })

      const response = await handleCheckSlug(request)

      expect(response.status).toBe(401)
    })

    it('should return 400 if name is missing', async () => {
      const request = new NextRequest('http://localhost/api/users/check-slug', {
        method: 'POST',
        headers: createAuthHeader(userId),
        body: JSON.stringify({}),
      })

      const response = await handleCheckSlug(request)

      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/user/plan', () => {
    it('should return user plan for authenticated user', async () => {
      const request = new NextRequest('http://localhost/api/user/plan', {
        method: 'GET',
        headers: createAuthHeader(userId),
      })

      const response = await handleGetUserPlan(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.planId).toBeDefined()
      expect(data.userId).toBeDefined()
      expect(data.planId).toBe(PlanId.SEASON_TRAVELER)
    })

    it('should deny unauthenticated users', async () => {
      const request = new NextRequest('http://localhost/api/user/plan', {
        method: 'GET',
        headers: createUnauthenticatedHeader(),
      })

      const response = await handleGetUserPlan(request)

      expect(response.status).toBe(401)
    })

    it('should return 404 for non-existent user', async () => {
      const request = new NextRequest('http://localhost/api/user/plan', {
        method: 'GET',
        headers: createAuthHeader('non-existent-user'),
      })

      const response = await handleGetUserPlan(request)

      expect(response.status).toBe(404)
    })
  })

  describe('PUT /api/user/plan', () => {
    it('should update user plan for authenticated user', async () => {
      const request = new NextRequest('http://localhost/api/user/plan', {
        method: 'PUT',
        headers: createAuthHeader(userId),
        body: JSON.stringify({
          planId: PlanId.BACKPACKER,
        }),
      })

      const response = await handlePutUserPlan(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.planId).toBe(PlanId.BACKPACKER)

      // データベースにプランが更新されたことを確認
      const userDoc = await db.collection(COLLECTIONS.USERS).doc(user.id).get()
      const updatedUser = userDoc.data() as User
      expect(updatedUser.planId).toBe(PlanId.BACKPACKER)
    })

    it('should deny unauthenticated users', async () => {
      const request = new NextRequest('http://localhost/api/user/plan', {
        method: 'PUT',
        headers: createUnauthenticatedHeader(),
        body: JSON.stringify({ planId: PlanId.BACKPACKER }),
      })

      const response = await handlePutUserPlan(request)

      expect(response.status).toBe(401)
    })

    it('should return 400 for invalid plan ID', async () => {
      const request = new NextRequest('http://localhost/api/user/plan', {
        method: 'PUT',
        headers: createAuthHeader(userId),
        body: JSON.stringify({
          planId: 'invalid-plan-id',
        }),
      })

      const response = await handlePutUserPlan(request)

      expect(response.status).toBe(400)
    })

    it('should return 404 for non-existent user', async () => {
      const request = new NextRequest('http://localhost/api/user/plan', {
        method: 'PUT',
        headers: createAuthHeader('non-existent-user'),
        body: JSON.stringify({ planId: PlanId.BACKPACKER }),
      })

      const response = await handlePutUserPlan(request)

      expect(response.status).toBe(404)
    })
  })
})

