/**
 * エラーハンドリングミドルウェア
 * Context 累積型ミドルウェアとして実装
 */

import { NextRequest, NextResponse } from 'next/server'
import type { Middleware, MiddlewareContext, RouteHandler } from '@/lib/core/middleware'
import { handleApiError } from '@/lib/core/error-handler'

/**
 * エラーハンドリングミドルウェア
 * 
 * Route Handler のエラーをキャッチし、適切なエラーレスポンスを返す
 * 通常は composeMiddleware の最初に配置する
 * 
 * @param handler - Route Handler 関数
 * @returns エラーハンドリング付き Route Handler
 * 
 * @example
 * ```typescript
 * export const POST = composeMiddleware(
 *   withErrorHandling,  // 最初に配置
 *   withAuth()
 * )(async (request, ctx) => {
 *   // エラーが発生した場合、自動的に handleApiError が呼ばれる
 *   // ...
 * })
 * ```
 */
export const withErrorHandling: Middleware = async (
  request: NextRequest,
  ctx: MiddlewareContext
): Promise<MiddlewareContext | NextResponse> => {
  // エラーハンドリングミドルウェアは、実際には Route Handler 全体をラップする必要がある
  // ただし、composeMiddleware 側でエラーハンドリングを行うため、
  // このミドルウェアは主に明示的にエラーハンドリングが必要なことを示すために使用
  
  // このミドルウェア自体は何もしない（composeMiddleware 側でエラーハンドリングを行う）
  return ctx
}

/**
 * エラーハンドリング付き Route Handler ラッパー
 * 
 * composeMiddleware 内で Route Handler を実行する際に使用
 * 
 * @param handler - Route Handler 関数
 * @returns エラーハンドリング付き Route Handler
 */
export function withErrorHandlingWrapper(handler: RouteHandler): RouteHandler {
  return async (request: NextRequest, ctx: MiddlewareContext): Promise<NextResponse> => {
    try {
      return await handler(request, ctx)
    } catch (error) {
      const path = new URL(request.url).pathname
      return handleApiError(
        error instanceof Error ? error : new Error(String(error)),
        path
      )
    }
  }
}

