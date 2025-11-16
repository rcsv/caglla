/**
 * リクエストボディバリデーションミドルウェア
 * Context 累積型ミドルウェアとして実装
 * 
 * zod スキーマを使用してリクエストボディをバリデーションし、
 * 型安全なデータを Context に追加します。
 */

import { NextRequest, NextResponse } from 'next/server'
import type { Middleware, MiddlewareContext } from '@/lib/core/middleware'
import { z } from 'zod'
import { handleApiError } from '@/lib/core/error-handler'
import { createValidationError } from '@/lib/core/error-handler'

/**
 * zod エラーを ApiError に変換
 */
function handleZodError(error: unknown, path?: string): NextResponse {
  if (error instanceof z.ZodError) {
    const details = error.errors.map(err => ({
      path: err.path.join('.'),
      message: err.message,
      code: err.code
    }))

    return handleApiError(
      createValidationError(
        'Validation failed',
        { errors: details }
      ),
      path
    )
  }

  return handleApiError(
    error instanceof Error ? error : new Error(String(error)),
    path
  )
}

/**
 * リクエストボディバリデーションミドルウェア
 * 
 * zod スキーマを使用してリクエストボディをバリデーションし、
 * 型安全なデータを Context に追加します。
 * 
 * @param schema - zod スキーマ
 * @returns Middleware 関数
 * 
 * @example
 * ```typescript
 * const CreateTripSchema = z.object({
 *   title: z.string().min(1),
 *   description: z.string().optional(),
 * })
 * 
 * export const POST = composeMiddleware(
 *   withAuth(),
 *   withBodyValidation(CreateTripSchema)
 * )(async (request, ctx) => {
 *   // ctx.body が型安全に推論される（CreateTripSchema の型）
 *   const { title, description } = ctx.body
 *   // ...
 * })
 * ```
 */
export function withBodyValidation<T extends z.ZodTypeAny>(
  schema: T
): Middleware {
  return async (
    request: NextRequest,
    ctx: MiddlewareContext
  ): Promise<MiddlewareContext | NextResponse> => {
    try {
      // リクエストボディを取得
      let rawBody: unknown
      try {
        rawBody = await request.json()
      } catch (parseError) {
        // JSON パースエラーの場合
        return handleApiError(
          createValidationError(
            'Invalid JSON in request body',
            { error: parseError instanceof Error ? parseError.message : String(parseError) }
          ),
          new URL(request.url).pathname
        )
      }
      
      // zod スキーマでバリデーション（parse はエラーを throw する）
      let validated: unknown
      try {
        validated = schema.parse(rawBody)
      } catch (parseError) {
        // zod エラーの場合は詳細なバリデーションエラーを返す
        // zod エラーの判定を複数方法で確認（テスト環境での互換性向上）
        if (parseError instanceof z.ZodError || 
            (parseError && typeof parseError === 'object' && 'issues' in parseError && Array.isArray((parseError as any).issues))) {
          return handleZodError(parseError, new URL(request.url).pathname)
        }
        // 予期しないエラー
        throw parseError
      }
      
      // Context に追加（型推論が効く）
      return {
        ...ctx,
        body: validated
      }
    } catch (error) {
      
      // その他のエラー（JSON パースエラーなど）
      return handleApiError(
        error instanceof Error ? error : new Error(String(error)),
        new URL(request.url).pathname
      )
    }
  }
}

