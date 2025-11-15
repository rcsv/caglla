/**
 * User Follow API Routes
 * 
 * Phase 1-3-3: API Routes実装（v3.0.0）
 * 
 * Social Operationsを使用して、フォロー機能のAPIエンドポイントを提供します。
 * - GET: フォロー状態取得
 * - POST: フォロー
 * - DELETE: フォロー解除
 */

import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/core/logger'
import { followUser, unfollowUser, getFollowState } from '@/lib/social/user-follows'
import { getTestFirestore } from '@/lib/__tests__/helpers/test-firestore'
import { COLLECTIONS } from '@/lib/firebase/firestore'
import { asUserId } from '@/lib/core/types/identity'
import type { Firestore } from 'firebase-admin/firestore'
import type { User } from '@/lib/core/types'
import { convertStandardDates } from '@/lib/firebase/timestamp-utils'
import { unauthorized, notFound, badRequest, handleApiError } from '@/lib/core/error-handler'

/**
 * adminAuthをlazy importします（テスト環境でも動作するように）
 */
async function getAdminAuth() {
  try {
    const adminModule = await import('@/lib/firebase/admin')
    return adminModule.adminAuth
  } catch (error) {
    throw new Error('Firebase Admin SDK is not available')
  }
}

/**
 * モックトークンからユーザーIDを抽出（テスト環境用）
 */
function extractUserIdFromMockToken(token: string): string | null {
  if (token.startsWith('mock-token-')) {
    return token.replace('mock-token-', '')
  }
  return null
}

/**
 * リクエストからユーザーIDを取得します（テスト環境ではモックトークンを処理）
 */
async function resolveAuthUserId(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const idToken = authHeader.split('Bearer ')[1]
  if (!idToken) return null

  // テスト環境ではモックトークンを処理
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    const mockUserId = extractUserIdFromMockToken(idToken)
    if (mockUserId) {
      return mockUserId
    }
  }

  try {
    const adminAuth = await getAdminAuth()
    const decoded = await adminAuth.verifyIdToken(idToken)
    return decoded.uid
  } catch (error) {
    logger.warn('Failed to verify ID token for user follow endpoint', error)
    return null
  }
}

/**
 * ユーザースラッグからユーザーIDを解決します（API Routes用）
 */
async function resolveUserIdFromSlug(
  userSlug: string,
  db?: Firestore
): Promise<string | null> {
  const firestore = db || getFirestore()

  // テスト環境では、userSlugから推測可能なuserIdを返す
  if (process.env.FIRESTORE_EMULATOR_HOST && db) {
    // テスト環境では、userSlugからuserIdを推測（例: user1-slug -> user1）
    const usersSnapshot = await firestore
      .collection(COLLECTIONS.USERS)
      .where('slug', '==', userSlug)
      .limit(1)
      .get()

    if (usersSnapshot.empty) {
      return null
    }

    const userDoc = usersSnapshot.docs[0]
    const userData = convertStandardDates({
      id: userDoc.id,
      ...userDoc.data(),
    }) as User

    return userData.google_id || userDoc.id
  }

  // 本番環境では、Admin SDKを使用
  try {
    const adminModule = await import('@/lib/firebase/admin')
    const adminDb = adminModule.adminDb

    const usersSnapshot = await adminDb
      .collection(COLLECTIONS.USERS)
      .where('slug', '==', userSlug)
      .limit(1)
      .get()

    if (usersSnapshot.empty) {
      return null
    }

    const userDoc = usersSnapshot.docs[0]
    const userData = convertStandardDates({
      id: userDoc.id,
      ...userDoc.data(),
    }) as User

    return userData.google_id || userDoc.id
  } catch (error) {
    logger.error('Failed to resolve userId from slug', error)
    return null
  }
}

/**
 * Firestoreインスタンスを取得します（テスト環境ではエミュレータを使用）
 */
function getFirestore(): Firestore | undefined {
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    return getTestFirestore()
  }
  // 本番環境では、Social Operations内でadminDbを使用
  return undefined
}

/**
 * GET /api/users/[userSlug]/follow
 * フォロー状態を取得します
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userSlug: string }> }
) {
  try {
    const followerId = await resolveAuthUserId(request)
    if (!followerId) {
      return unauthorized('Authorization header required')
    }

    const { userSlug } = await params

    // ユーザースラッグからユーザーIDを解決
    const db = getFirestore()
    const followingId = await resolveUserIdFromSlug(userSlug, db)

    if (!followingId) {
      return notFound('User')
    }

    const state = await getFollowState(followerId, followingId, db)

    return NextResponse.json(state)
  } catch (error: unknown) {
    return handleApiError(
      error instanceof Error ? error : new Error(String(error)),
      `/api/users/[userSlug]/follow`
    )
  }
}

/**
 * POST /api/users/[userSlug]/follow
 * ユーザーをフォローします
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userSlug: string }> }
) {
  try {
    const followerId = await resolveAuthUserId(request)
    if (!followerId) {
      return unauthorized('Authorization header required')
    }

    const { userSlug } = await params

    // ユーザースラッグからユーザーIDを解決
    const db = getFirestore()
    const followingId = await resolveUserIdFromSlug(userSlug, db)

    if (!followingId) {
      return notFound('User')
    }

    const follow = await followUser(followerId, followingId, db)

    return NextResponse.json(follow, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes('Cannot follow yourself') || error.message.includes('yourself')) {
        return badRequest('Cannot follow yourself')
      }
      if (error.message.includes('Already following') || error.message.includes('already')) {
        // 409 Conflict は標準的なエラーレスポンスなので、そのまま返す
        return NextResponse.json({ error: 'Already following this user' }, { status: 409 })
      }
      if (error.message.includes('User not found')) {
        return notFound('User')
      }
    }

    return handleApiError(
      error instanceof Error ? error : new Error(String(error)),
      `/api/users/[userSlug]/follow`
    )
  }
}

/**
 * DELETE /api/users/[userSlug]/follow
 * フォローを解除します
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userSlug: string }> }
) {
  try {
    const followerId = await resolveAuthUserId(request)
    if (!followerId) {
      return unauthorized('Authorization header required')
    }

    const { userSlug } = await params

    // ユーザースラッグからユーザーIDを解決
    const db = getFirestore()
    const followingId = await resolveUserIdFromSlug(userSlug, db)

    if (!followingId) {
      return notFound('User')
    }

    await unfollowUser(followerId, followingId, db)

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes('Cannot unfollow yourself') || error.message.includes('yourself')) {
        return badRequest('Cannot unfollow yourself')
      }
      if (error.message.includes('Not following this user') || error.message.includes('Not following')) {
        return notFound('Not following this user')
      }
      if (error.message.includes('Only follower can unfollow') || error.message.includes('follower')) {
        // 403 Forbidden は標準的なエラーレスポンスなので、そのまま返す
        return NextResponse.json({ error: 'Only follower can unfollow' }, { status: 403 })
      }
      if (error.message.includes('User not found')) {
        return notFound('User')
      }
    }

    return handleApiError(
      error instanceof Error ? error : new Error(String(error)),
      `/api/users/[userSlug]/follow`
    )
  }
}

