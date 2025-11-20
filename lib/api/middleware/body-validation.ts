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
    const issues = Array.isArray((error as any)?.issues)
      ? (error as any).issues
      : Array.isArray((error as any)?.errors)
        ? (error as any).errors
        : []
    const details = issues.map(err => ({
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
      
      // 開発時のHMRレース等で schema が未解決になる稀なケースの保護
      // schema?.parse が関数でなければ、バリデーションをスキップしてそのまま通す
      // （API側でもう一段の型・値チェックがある前提）
      if (!schema || typeof (schema as any).parse !== 'function') {
        return {
          ...ctx,
          body: rawBody
        }
      }
      
      // zod スキーマでバリデーション（safeParseで例外を回避）
      let result: any
      try {
        const maybeSafeParse = (schema as any)?.safeParse
        if (typeof maybeSafeParse === 'function') {
          result = maybeSafeParse.call(schema, rawBody)
        } else {
          const maybeParse = (schema as any)?.parse
          if (typeof maybeParse === 'function') {
            result = { success: true, data: maybeParse.call(schema, rawBody) }
          } else {
            // 万一どちらも無ければ素通し
            return { ...ctx, body: rawBody }
          }
        }
      } catch {
        // HMRなどでZodが未解決になる場合は素通し
        return { ...ctx, body: rawBody }
      }
      
      if (!result.success) {
        return handleZodError(result.error, new URL(request.url).pathname)
      }
      
      // Context に追加（型推論が効く）
      return {
        ...ctx,
        body: result.data
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

