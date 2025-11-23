/**
 * Following Feed API Route
 * 
 * Phase 1-3-4: API Routes実装（v3.0.0）
 * 
 * フォロー中フィードを取得します。
 * - GET: フォロー中フィード取得（created_atでソート、降順）
 */

import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/core/logger'
import { getFollowingFeed } from '@/lib/travel/feed'
import { getTestFirestore } from '@/lib/__tests__/helpers/test-firestore'
import type { Firestore } from 'firebase-admin/firestore'
import { unauthorized, notFound, badRequest, handleApiError } from '@/lib/core/error-handler'
import { adminDb } from '@/lib/firebase/admin'

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
    logger.warn('Failed to verify ID token for following feed endpoint', error)
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
  // 本番環境では adminDb を使用
  return adminDb as Firestore | undefined
}

/**
 * GET /api/feed/following
 * フォロー中フィードを取得します
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await resolveAuthUserId(request)
    if (!userId) {
      return unauthorized('Authorization header required')
    }

    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const cursor = searchParams.get('cursor') || undefined

    const limit = limitParam ? parseInt(limitParam, 10) : 20

    if (isNaN(limit) || limit < 1 || limit > 100) {
      return badRequest('Invalid limit parameter (1-100)')
    }

    const db = getFirestore()

    const result = await getFollowingFeed(userId, limit, cursor, db)

    return NextResponse.json(result)
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes('User not found')) {
        return notFound('User')
      }
    }

    return handleApiError(
      error instanceof Error ? error : new Error(String(error)),
      `/api/feed/following`
    )
  }
}

