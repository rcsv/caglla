/**
 * Params解決ミドルウェア
 * Next.js 15 の `params: Promise` 問題を吸収
 */

import { NextRequest, NextResponse } from 'next/server'
import type { Middleware, MiddlewareContext } from '@/lib/core/middleware'
import { badRequest } from '@/lib/core/error-handler'

/**
 * Params解決ミドルウェア
 * 
 * composeMiddleware 側で既に params は解決されているため、
 * このミドルウェアは主に明示的に params が必要なことを示すために使用
 * 
 * params が存在しない場合はエラーを返す
 * 
 * @returns Middleware 関数
 * 
 * @example
 * ```typescript
 * export const PUT = composeMiddleware(
 *   withErrorHandling,
 *   withAuth(),
 *   withParams(),
 *   withTripOwnership()
 * )(async (request, ctx) => {
 *   // ctx.params が保証されている
 *   const { tripSlug } = ctx.params!
 *   // ...
 * })
 * ```
 */
export function withParams(): Middleware {
  return async (request: NextRequest, ctx: MiddlewareContext): Promise<MiddlewareContext | NextResponse> => {
    // composeMiddleware 側で既に params は解決されている
    // 存在しない場合はエラーを返す（明示的に params が必要な場合）
    
    if (!ctx.params) {
      return badRequest('Route parameters are required')
    }

    return ctx
  }
}

