/**
 * Day所有権チェックミドルウェア
 * Context 累積型ミドルウェアとして実装
 *
 * 実行順序を内部で自動解決し、開発者が順序を間違えても壊れない構造
 */

import { NextRequest, NextResponse } from "next/server";
import type { Middleware, MiddlewareContext } from "@/lib/core/middleware";
import { requireAuth } from "@/lib/api/auth-helpers";
import { validateDayOwnership } from "@/lib/api/authorization-helpers";
import { badRequest } from "@/lib/core/error-handler";
import { handleApiError } from "@/lib/core/error-handler";
import { withAuth } from "./auth";

/**
 * Day所有権チェックミドルウェア
 *
 * 認証チェック → Day所有権チェック の順序を内部で自動解決
 *
 * 注意:
 * - DB アクセスは1回に最適化されている必要がある（N+1問題を回避）
 * - ctx.auth がなければ自動で withAuth を実行
 * - ctx.params から dayId を取得するか、リクエストボディから day_id を取得
 *
 * @param options - オプション
 * @param options.source - dayId の取得元 ('params' | 'body' | 'query'), デフォルト: 'params'
 * @returns Middleware 関数
 *
 * @example
 * ```typescript
 * export const GET = composeMiddleware(
 *   withErrorHandling,
 *   withAuth(),
 *   withDayOwnership({ source: 'query' })  // 認証とDay所有権チェックが自動的に実行される
 * )(async (request, ctx) => {
 *   // ctx.auth, ctx.day, ctx.params が全て揃っている
 *   const { userId } = ctx.auth!
 *   const { dayId, tripId, trip } = ctx.day!
 *   // ...
 * })
 * ```
 */
export function withDayOwnership(options?: {
	source?: "params" | "body" | "query";
}): Middleware {
	const source = options?.source || "params";

	return async (
		request: NextRequest,
		ctx: MiddlewareContext,
	): Promise<MiddlewareContext | NextResponse> => {
		try {
			// 1. auth がなければ自動で requireAuth を実行（順序を強制）
			if (!ctx.auth) {
				const auth = await requireAuth(request);
				if (auth instanceof NextResponse) {
					return auth; // エラーレスポンスを返す
				}
				ctx = { ...ctx, auth };
			}

			// 2. dayId を取得
			let dayId: string | undefined;

			if (source === "params") {
				if (!ctx.params) {
					return badRequest(
						"Route parameters are required for day ownership check",
					);
				}
				dayId = ctx.params.dayId || ctx.params.day_id;
			} else if (source === "query") {
				const { searchParams } = new URL(request.url);
				dayId = searchParams.get("day_id") || undefined;
			} else if (source === "body") {
				// リクエストボディから取得（この場合は事前にパースが必要だが、簡易実装として）
				// 実際には、body パースミドルウェアと組み合わせることを想定
				return badRequest(
					"Body source not yet supported. Use params or query instead.",
				);
			}

			if (!dayId || typeof dayId !== "string") {
				return badRequest(
					`${source === "params" ? "dayId" : "day_id"} parameter is required`,
				);
			}

			// 3. 所有権チェック（DB アクセスは1回に最適化済み）
			const ownership = await validateDayOwnership(dayId, ctx.auth.userId);
			if (ownership instanceof NextResponse) {
				return ownership;
			}

			// 4. Context に day を追加して返す
			return {
				...ctx,
				day: ownership,
			};
		} catch (error) {
			return handleApiError(
				error instanceof Error ? error : new Error(String(error)),
				new URL(request.url).pathname,
			);
		}
	};
}
