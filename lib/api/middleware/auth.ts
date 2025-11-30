/**
 * 認証ミドルウェア
 * Context 累積型ミドルウェアとして実装
 */

import { NextRequest, NextResponse } from "next/server";
import type { Middleware, MiddlewareContext } from "@/lib/core/middleware";
import { requireAuth } from "@/lib/api/auth-helpers";

/**
 * 認証チェックミドルウェア
 *
 * request から認証情報を取得し、context に `auth` を追加する
 * 既に `ctx.auth` が存在する場合は、そのまま context を返す（重複チェックを避ける）
 *
 * @returns Middleware 関数
 *
 * @example
 * ```typescript
 * export const POST = composeMiddleware(
 *   withErrorHandling,
 *   withAuth()
 * )(async (request, ctx) => {
 *   // ctx.auth が保証されている
 *   const { userId } = ctx.auth!
 *   // ...
 * })
 * ```
 */
export function withAuth(): Middleware {
	return async (
		request: NextRequest,
		ctx: MiddlewareContext,
	): Promise<MiddlewareContext | NextResponse> => {
		// 既に認証済みの場合は、そのまま context を返す（重複チェックを避ける）
		if (ctx.auth) {
			return ctx;
		}

		// 認証チェックを実行
		const auth = await requireAuth(request);

		// エラーレスポンスの場合はそのまま返す
		if (auth instanceof NextResponse) {
			return auth;
		}

		// Context に auth を追加して返す
		return {
			...ctx,
			auth,
		};
	};
}
