/**
 * 管理者認証ミドルウェア
 * 
 * 認証 + 管理者権限チェックを行うミドルウェア
 * 
 * 管理者権限のチェック方法:
 * - Firebase Auth Token の `admin` カスタムクレームが `true` の場合
 * - Firebase Auth Token の `https://hasura.io/jwt/claims` の `x-hasura-default-role` が `'admin'` の場合
 */

import { NextRequest, NextResponse } from 'next/server'
import { Middleware, MiddlewareContext } from '@/lib/core/middleware'
import { withAuth } from './auth'
import { createForbiddenError } from '@/lib/core/error-handler'

/**
 * 管理者認証ミドルウェア
 * 
 * 認証 + 管理者権限チェックを実行
 * 
 * @returns Middleware
 */
export function withAdminAuth(): Middleware {
  return async (request: NextRequest, ctx: MiddlewareContext) => {
    // 1. 認証チェック（auth がなければ自動実行）
    if (!ctx.auth) {
      const result = await withAuth()(request, ctx)
      if (result instanceof NextResponse) {
        return result
      }
      ctx = result
    }

    // 2. 管理者権限チェック
    const { decodedToken } = ctx.auth!
    const isAdmin =
      (decodedToken as any).admin === true ||
      (decodedToken as any)['https://hasura.io/jwt/claims']?.['x-hasura-default-role'] === 'admin'

    if (!isAdmin) {
      throw createForbiddenError('Admin access required')
    }

    return ctx
  }
}

