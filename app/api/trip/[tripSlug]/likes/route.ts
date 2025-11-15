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
import { z } from 'zod'
import logger from '@/lib/core/logger'
import { toggleTripLike, getTripLikeState } from '@/lib/social/trip-likes'
import { getTestFirestore } from '@/lib/__tests__/helpers/test-firestore'
import type { Firestore } from 'firebase-admin/firestore'
import { unauthorized, notFound, handleApiError } from '@/lib/core/error-handler'
import { ToggleTripLikeSchema } from '@/lib/schemas/trip-social'

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
    if (error instanceof Error) {
      if (error.message.includes('Trip not found')) {
        return notFound('Trip')
      }
      if (error.message.includes('Private trips')) {
        // 403 Forbidden は標準的なエラーレスポンスなので、そのまま返す
        return NextResponse.json({ error: 'Likes available only for public trips' }, { status: 403 })
      }
    }

    return handleApiError(
      error instanceof Error ? error : new Error(String(error)),
      `/api/trip/[tripSlug]/likes`
    )
  }
}

/**
 * POST /api/trip/[tripSlug]/likes
 * いいねを追加/削除します（toggle動作、またはactionで指定）
 * 
 * zod スキーマバリデーション + Context ミドルウェアで移行済み
 * 
 * Before:
 * ```typescript
 * const body = await parseRequestBody<{ action?: 'like' | 'unlike' }>(request)
 * const action = body?.action === 'like' || body?.action === 'unlike' ? body.action : 'toggle'
 * ```
 * 
 * After:
 * ```typescript
 * // ctx.body が型安全 & バリデ済み
 * // デフォルト値が zod スキーマで設定済み
 * ```
 * 
 * 注意: 認証は既存の `resolveAuthUserId` を使用（テスト環境対応のため）
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripSlug: string }> }
) {
  try {
    const userId = await resolveAuthUserId(request)
    if (!userId) {
      return unauthorized('Authorization header required')
    }

    const { tripSlug } = await params
    
    // zod スキーマでバリデーション
    let rawBody: unknown
    try {
      rawBody = await request.json().catch(() => ({}))
    } catch (parseError) {
      rawBody = {}
    }
    
    let body: z.infer<typeof ToggleTripLikeSchema>
    try {
      body = ToggleTripLikeSchema.parse(rawBody)
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: validationError.errors.map(err => ({
              path: err.path.join('.'),
              message: err.message
            }))
          },
          { status: 400 }
        )
      }
      throw validationError
    }
    
    const { action } = body
    const db = getFirestore()

    const result = await toggleTripLike(userId, tripSlug, action, db)

    return NextResponse.json({
      likesCount: result.likesCount,
      likedByMe: result.liked,
    })
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes('Trip not found')) {
        return notFound('Trip')
      }
      if (error.message.includes('Likes available only for public trips')) {
        // 403 Forbidden は標準的なエラーレスポンスなので、そのまま返す
        return NextResponse.json({ error: 'Likes available only for public trips' }, { status: 403 })
      }
      if (error.message.includes('Cannot like your own trip') || error.message.includes('own')) {
        // 403 Forbidden は標準的なエラーレスポンスなので、そのまま返す
        return NextResponse.json({ error: 'Cannot like your own trip' }, { status: 403 })
      }
      if (error.message.includes('already liked')) {
        // 409 Conflict は標準的なエラーレスポンスなので、そのまま返す
        return NextResponse.json({ error: 'Trip is already liked' }, { status: 409 })
      }
      if (error.message.includes('not liked')) {
        return notFound('Trip is not liked')
      }
    }

    return handleApiError(
      error instanceof Error ? error : new Error(String(error)),
      `/api/trip/[tripSlug]/likes`
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
    const userId = await resolveAuthUserId(request)
    if (!userId) {
      return unauthorized('Authorization header required')
    }

    const { tripSlug } = await params
    const db = getFirestore()

    const result = await toggleTripLike(userId, tripSlug, 'unlike', db)

    return NextResponse.json({
      likesCount: result.likesCount,
      likedByMe: result.liked,
    })
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes('Trip not found')) {
        return notFound('Trip')
      }
      if (error.message.includes('Likes available only for public trips')) {
        // 403 Forbidden は標準的なエラーレスポンスなので、そのまま返す
        return NextResponse.json({ error: 'Likes available only for public trips' }, { status: 403 })
      }
      if (error.message.includes('not liked')) {
        return notFound('Trip is not liked')
      }
    }

    return handleApiError(
      error instanceof Error ? error : new Error(String(error)),
      `/api/trip/[tripSlug]/likes`
    )
  }
}
