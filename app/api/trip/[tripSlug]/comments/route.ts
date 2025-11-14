/**
 * Trip Comments API Routes
 * 
 * Phase 1-3-2: API Routes実装（v3.0.0）
 * 
 * Social Operationsを使用して、コメント機能のAPIエンドポイントを提供します。
 * - GET: コメント一覧取得
 * - POST: コメント作成
 * - PUT: コメント更新
 * - DELETE: コメント削除（論理削除）
 */

import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/core/logger'
import {
  createTripComment,
  updateTripComment,
  deleteTripComment,
  getTripComments,
} from '@/lib/social/trip-comments'
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
    logger.warn('Failed to verify ID token for trip comments endpoint', error)
    return null
  }
}

/**
 * ユーザー情報を取得します（userName, userAvatar）
 */
async function getUserInfo(userId: string): Promise<{ name: string; avatar?: string }> {
  // テスト環境では、userIdから推測可能な情報を返す
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    return {
      name: `User ${userId}`,
      avatar: undefined,
    }
  }

  // 本番環境では、Firestoreからユーザー情報を取得（lazy import）
  try {
    const adminModule = await import('@/lib/firebase/admin-operation')
    const user = await adminModule.adminUserOperations.getUserByGoogleId(userId)
    if (user) {
      return {
        name: user.name || `User ${userId}`,
        avatar: user.profile_image_url,
      }
    }
  } catch (error) {
    logger.warn('Failed to get user info for trip comments endpoint', error)
  }

  return {
    name: `User ${userId}`,
    avatar: undefined,
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
 * GET /api/trip/[tripSlug]/comments
 * コメント一覧を取得します
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tripSlug: string }> }
) {
  try {
    const { tripSlug } = await params
    const db = getFirestore()

    const comments = await getTripComments(tripSlug, db)

    return NextResponse.json(comments)
  } catch (error: unknown) {
    logger.error('Failed to fetch trip comments', error)

    if (error instanceof Error) {
      if (error.message.includes('Trip not found')) {
        return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
      }
      if (error.message.includes('Comments available only for public trips')) {
        return NextResponse.json({ error: 'Comments available only for public trips' }, { status: 403 })
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/trip/[tripSlug]/comments
 * コメントを作成します
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
    const content = typeof body.content === 'string' ? body.content.trim() : ''
    const userName = typeof body.userName === 'string' ? body.userName.trim() : ''
    const userAvatar = typeof body.userAvatar === 'string' ? body.userAvatar.trim() : undefined
    const parentCommentId =
      typeof body.parentCommentId === 'string' && body.parentCommentId.trim()
        ? body.parentCommentId.trim()
        : undefined

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // userNameが提供されない場合、ユーザー情報から取得
    let finalUserName = userName
    let finalUserAvatar = userAvatar
    if (!finalUserName) {
      const userInfo = await getUserInfo(userId)
      finalUserName = userInfo.name
      if (!finalUserAvatar && userInfo.avatar) {
        finalUserAvatar = userInfo.avatar
      }
    }

    const db = getFirestore()

    const comment = await createTripComment(
      userId,
      finalUserName,
      finalUserAvatar,
      tripSlug,
      content,
      parentCommentId,
      db
    )

    return NextResponse.json(comment, { status: 201 })
  } catch (error: unknown) {
    logger.error('Failed to create trip comment', error)

    if (error instanceof Error) {
      if (error.message.includes('Trip not found')) {
        return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
      }
      if (error.message.includes('Comments available only for public trips')) {
        return NextResponse.json({ error: 'Comments available only for public trips' }, { status: 403 })
      }
      if (error.message.includes('Parent comment not found')) {
        return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 })
      }
      if (error.message.includes('Parent comment does not belong to this trip')) {
        return NextResponse.json({ error: 'Parent comment does not belong to this trip' }, { status: 400 })
      }
      if (error.message.includes('Cannot reply to deleted comment')) {
        return NextResponse.json({ error: 'Cannot reply to deleted comment' }, { status: 400 })
      }
    }

    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/trip/[tripSlug]/comments/[commentId]
 * コメントを更新します
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tripSlug: string; commentId: string }> }
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

    const { tripSlug, commentId } = await params
    const body = await request.json().catch(() => ({}))
    const content = typeof body.content === 'string' ? body.content.trim() : ''

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const db = getFirestore()

    const updatedComment = await updateTripComment(commentId, userId, content, db)

    return NextResponse.json(updatedComment)
  } catch (error: unknown) {
    logger.error('Failed to update trip comment', error)

    if (error instanceof Error) {
      if (error.message.includes('Comment not found')) {
        return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
      }
      if (error.message.includes('Only comment owner can update') || error.message.includes('owner')) {
        return NextResponse.json({ error: 'Only comment owner can update' }, { status: 403 })
      }
      if (error.message.includes('Cannot update deleted comment')) {
        return NextResponse.json({ error: 'Cannot update deleted comment' }, { status: 400 })
      }
    }

    return NextResponse.json(
      { error: 'Failed to update comment' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/trip/[tripSlug]/comments/[commentId]
 * コメントを論理削除します
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tripSlug: string; commentId: string }> }
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

    const { tripSlug, commentId } = await params
    const db = getFirestore()

    await deleteTripComment(commentId, userId, db)

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    logger.error('Failed to delete trip comment', error)

    if (error instanceof Error) {
      if (error.message.includes('Comment not found')) {
        return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
      }
      if (error.message.includes('Only comment owner can delete') || error.message.includes('owner')) {
        return NextResponse.json({ error: 'Only comment owner can delete' }, { status: 403 })
      }
    }

    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    )
  }
}

