/**
 * API認証ヘルパー関数
 */

import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase/admin'
import type { DecodedIdToken } from 'firebase-admin/auth'
import logger from '@/lib/core/logger'

/**
 * Bearer tokenを検証してユーザー情報を返す
 * @deprecated Use requireAuth() for better error handling
 */
export async function verifyAuthToken(request: NextRequest): Promise<{ uid: string } | null> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  try {
    const decodedToken = await adminAuth.verifyIdToken(token)
    return { uid: decodedToken.uid }
  } catch (error) {
    return null
  }
}

/**
 * 認証結果の型定義
 */
export interface AuthResult {
  userId: string
  decodedToken: DecodedIdToken
}

/**
 * 認証チェックとユーザーID取得を一度に実行
 * 認証に失敗した場合はエラーレスポンスを返す
 * 
 * @param request - Next.js リクエストオブジェクト
 * @returns 認証成功時は AuthResult、失敗時は NextResponse（エラーレスポンス）
 * 
 * @example
 * ```typescript
 * const auth = await requireAuth(request)
 * if (auth instanceof NextResponse) {
 *   return auth // エラーレスポンスをそのまま返す
 * }
 * const { userId, decodedToken } = auth
 * ```
 */
export async function requireAuth(
  request: NextRequest
): Promise<AuthResult | NextResponse> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Authorization header required' },
      { status: 401 }
    )
  }

  const idToken = authHeader.split('Bearer ')[1]
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    return {
      userId: decodedToken.uid,
      decodedToken
    }
  } catch (error) {
    logger.error('Token verification failed:', error)
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    )
  }
}

