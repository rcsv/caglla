/**
 * Trip Likes API Routes
 * 
 * Phase 1-3-1: API Routes実装（v3.0.0）
 * 
 * Social Operationsを使用して、いいね機能のAPIエンドポイントを提供します。
 * - GET: いいね状態取得
 * - POST: いいね追加/削除（toggle）
 * - DELETE: いいね削除
 */

import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/core/logger'
import { toggleTripLike, getTripLikeState } from '@/lib/social/trip-likes'
import { getTestFirestore } from '@/lib/__tests__/helpers/test-firestore'
import type { Firestore } from 'firebase-admin/firestore'

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
    logger.warn('Failed to verify ID token for trip likes endpoint', error)
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
 * GET /api/trip/[tripSlug]/likes
 * いいね状態を取得します
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tripSlug: string }> }
) {
  try {
    const { tripSlug } = await params
    const userId = await resolveAuthUserId(request)
    const db = getFirestore()

    const result = await getTripLikeState(tripSlug, userId, db)

    return NextResponse.json({
      likesCount: result.count,
      likedByMe: result.liked,
    })
  } catch (error: unknown) {
    logger.error('Failed to fetch trip like state', error)
    
    if (error instanceof Error) {
      if (error.message.includes('Trip not found')) {
        return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
      }
      if (error.message.includes('Private trips')) {
        return NextResponse.json({ error: 'Likes available only for public trips' }, { status: 403 })
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch like state' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/trip/[tripSlug]/likes
 * いいねを追加/削除します（toggle動作、またはactionで指定）
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripSlug: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
    }

    const idToken = authHeader.split('Bearer ')[1]
    if (!idToken) {
      return NextResponse.json({ error: 'Invalid authorization header' }, { status: 401 })
    }

    // テスト環境ではモックトークンを処理
    let userId: string
    if (process.env.FIRESTORE_EMULATOR_HOST) {
      const mockUserId = extractUserIdFromMockToken(idToken)
      if (mockUserId) {
        userId = mockUserId
      } else {
        const adminAuth = await getAdminAuth()
        const decoded = await adminAuth.verifyIdToken(idToken)
        userId = decoded.uid
      }
    } else {
      const adminAuth = await getAdminAuth()
      const decoded = await adminAuth.verifyIdToken(idToken)
      userId = decoded.uid
    }

    const { tripSlug } = await params
    const body = await request.json().catch(() => ({}))
    const action = body?.action === 'like' || body?.action === 'unlike' ? body.action : 'toggle'
    const db = getFirestore()

    const result = await toggleTripLike(userId, tripSlug, action, db)

    return NextResponse.json({
      likesCount: result.likesCount,
      likedByMe: result.liked,
    })
  } catch (error: unknown) {
    logger.error('Failed to toggle trip like', error)
    
    if (error instanceof Error) {
      if (error.message.includes('Trip not found')) {
        return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
      }
      if (error.message.includes('Likes available only for public trips')) {
        return NextResponse.json({ error: 'Likes available only for public trips' }, { status: 403 })
      }
      if (error.message.includes('Cannot like your own trip') || error.message.includes('own')) {
        return NextResponse.json({ error: 'Cannot like your own trip' }, { status: 403 })
      }
      if (error.message.includes('already liked')) {
        return NextResponse.json({ error: 'Trip is already liked' }, { status: 409 })
      }
      if (error.message.includes('not liked')) {
        return NextResponse.json({ error: 'Trip is not liked' }, { status: 404 })
      }
    }

    return NextResponse.json(
      { error: 'Failed to toggle like' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/trip/[tripSlug]/likes
 * いいねを削除します
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tripSlug: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
    }

    const idToken = authHeader.split('Bearer ')[1]
    if (!idToken) {
      return NextResponse.json({ error: 'Invalid authorization header' }, { status: 401 })
    }

    // テスト環境ではモックトークンを処理
    let userId: string
    if (process.env.FIRESTORE_EMULATOR_HOST) {
      const mockUserId = extractUserIdFromMockToken(idToken)
      if (mockUserId) {
        userId = mockUserId
      } else {
        const adminAuth = await getAdminAuth()
        const decoded = await adminAuth.verifyIdToken(idToken)
        userId = decoded.uid
      }
    } else {
      const adminAuth = await getAdminAuth()
      const decoded = await adminAuth.verifyIdToken(idToken)
      userId = decoded.uid
    }

    const { tripSlug } = await params
    const db = getFirestore()

    const result = await toggleTripLike(userId, tripSlug, 'unlike', db)

    return NextResponse.json({
      likesCount: result.likesCount,
      likedByMe: result.liked,
    })
  } catch (error: unknown) {
    logger.error('Failed to unlike trip', error)
    
    if (error instanceof Error) {
      if (error.message.includes('Trip not found')) {
        return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
      }
      if (error.message.includes('Likes available only for public trips')) {
        return NextResponse.json({ error: 'Likes available only for public trips' }, { status: 403 })
      }
      if (error.message.includes('not liked')) {
        return NextResponse.json({ error: 'Trip is not liked' }, { status: 404 })
      }
    }

    return NextResponse.json(
      { error: 'Failed to unlike' },
      { status: 500 }
    )
  }
}
