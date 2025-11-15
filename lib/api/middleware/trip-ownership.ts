/**
 * Trip所有権チェックミドルウェア
 * Context 累積型ミドルウェアとして実装
 * 
 * 実行順序を内部で自動解決し、開発者が順序を間違えても壊れない構造
 */

import { NextRequest, NextResponse } from 'next/server'
import type { Middleware, MiddlewareContext } from '@/lib/core/middleware'
import { requireAuth } from '@/lib/api/auth-helpers'
import { validateTripOwnership } from '@/lib/api/authorization-helpers'
import { badRequest } from '@/lib/core/error-handler'
import { handleApiError } from '@/lib/core/error-handler'
import { withAuth } from './auth'
import { withParams } from './params'

/**
 * Trip所有権チェックミドルウェア
 * 
 * 認証チェック → params解決 → 所有権チェック の順序を内部で自動解決
 * 
 * 注意: 
 * - DB アクセスは1回に最適化されている必要がある（N+1問題を回避）
 * - ctx.auth がなければ自動で withAuth を実行
 * - ctx.params がなければ自動で withParams を実行
 * 
 * @returns Middleware 関数
 * 
 * @example
 * ```typescript
 * export const PUT = composeMiddleware(
 *   withErrorHandling,
 *   withTripOwnership()  // 認証と所有権チェックが自動的に実行される
 * )(async (request, ctx) => {
 *   // ctx.auth, ctx.trip, ctx.params が全て揃っている
 *   const { userId } = ctx.auth!
 *   const { tripId, trip } = ctx.trip!
 *   const { tripSlug } = ctx.params!
 *   // ...
 * })
 * ```
 */
export function withTripOwnership(): Middleware {
  return async (request: NextRequest, ctx: MiddlewareContext): Promise<MiddlewareContext | NextResponse> => {
    try {
      // 1. auth がなければ自動で requireAuth を実行（順序を強制）
      if (!ctx.auth) {
        const auth = await requireAuth(request)
        if (auth instanceof NextResponse) {
          return auth // エラーレスポンスを返す
        }
        ctx = { ...ctx, auth }
      }

      // 2. params がなければ自動で解決（Next.js 15 の Promise 問題を吸収）
      if (!ctx.params) {
        return badRequest('Route parameters are required for trip ownership check')
      }

      const { tripSlug } = ctx.params
      if (!tripSlug || typeof tripSlug !== 'string') {
        return badRequest('tripSlug parameter is required')
      }

      // 3. 所有権チェック（DB アクセスは1回に最適化済み）
      const ownership = await validateTripOwnership(tripSlug, ctx.auth.userId)
      if (ownership instanceof NextResponse) {
        return ownership
      }

      // 4. Context に trip を追加して返す
      return {
        ...ctx,
        trip: ownership
      }
    } catch (error) {
      return handleApiError(
        error instanceof Error ? error : new Error(String(error)),
        new URL(request.url).pathname
      )
    }
  }
}

