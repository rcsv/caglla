/**
 * Context 累積型ミドルウェアシステム
 *
 * このシステムは、Next.js Route Handler における制御フローを統一し、
 * 「後方から湧いてくるカオス」を封じるための基盤です。
 *
 * 特徴:
 * - handler の型が統一される（`(request, ctx)`）
 * - 型の `T | NextResponse` を排除し、handler には成功時の値のみを渡す
 * - ミドルウェアが context を累積させることで、型の複雑化を回避
 * - Next.js 15 の `params: Promise` 問題を完全に吸収
 */

import { NextRequest, NextResponse } from "next/server";
import type { AuthResult } from "@/lib/api/auth-helpers";
import type {
	TripOwnershipResult,
	DayOwnershipResult,
} from "@/lib/api/authorization-helpers";
import { handleApiError } from "@/lib/core/error-handler";

/**
 * ミドルウェアコンテキストの型定義
 * ミドルウェアが順次 context を肥やしていく
 *
 * 拡張可能にするため、intersection 型を使用
 */
export interface BaseMiddlewareContext {
	// 認証情報（認証ミドルウェアが追加）
	auth?: AuthResult;

	// Trip所有権情報（Trip所有権チェックミドルウェアが追加）
	trip?: TripOwnershipResult;

	// Day所有権情報（Day所有権チェックミドルウェアが追加）
	day?: DayOwnershipResult;

	// 動的パラメータ（Next.js Route Handler の params）
	// Next.js 15 では Promise だが、composeMiddleware 側で解決済み
	params?: Record<string, any>;

	// API Keys（外部APIキーが必要な場合に追加）
	apiKeys?: {
		GOOGLE_PLACES?: string;
		GOOGLE_MAPS?: string;
		GOOGLE_GEOCODING?: string;
		UNSPLASH?: string;
	};
}

/**
 * ミドルウェアコンテキスト（拡張可能）
 * 将来の拡張に対応するため、intersection 型で定義
 */
export type MiddlewareContext = BaseMiddlewareContext & Record<string, any>;

/**
 * ミドルウェア関数の型定義
 *
 * request と context を受け取り、context を拡張するか NextResponse を返す
 * 成功時は context を拡張して返し、エラー時は NextResponse を返す
 */
export type Middleware = (
	request: NextRequest,
	ctx: MiddlewareContext,
) => Promise<MiddlewareContext | NextResponse>;

/**
 * Route Handler 関数の型定義
 *
 * context には必要な値が全て揃っている（純粋なデータのみ）
 * NextResponse を返すことで、型の複雑化を回避
 */
export type RouteHandler = (
	request: NextRequest,
	ctx: MiddlewareContext,
) => Promise<NextResponse>;

/**
 * 複数のミドルウェアを組み合わせる
 * Context を累積させる方式
 *
 * Next.js 15 の `params: Promise` 問題を完全に吸収し、
 * 全てのミドルウェアが「普通の params」を受け取れるようにする
 *
 * @param middlewares - 実行する順序でミドルウェアを指定
 * @returns Route Handler を返す関数
 *
 * @example
 * ```typescript
 * export const PUT = composeMiddleware(
 *   withErrorHandling,
 *   withAuth,
 *   withTripOwnership
 * )(async (request, ctx) => {
 *   // ctx.auth, ctx.trip, ctx.params が全て揃っている
 *   const { userId } = ctx.auth!
 *   const { tripId, trip } = ctx.trip!
 *   // ...
 * })
 * ```
 */
export function composeMiddleware(...middlewares: Middleware[]) {
	return (handler: RouteHandler) => {
		return async (
			request: NextRequest,
			context?: { params?: Promise<Record<string, any>> },
		): Promise<NextResponse> => {
			// 初期 context を構築
			// Next.js 15 の params: Promise 問題をここで完全に吸収
			let ctx: MiddlewareContext = {};

			// params があれば先に解決（全てのミドルウェアが「普通の params」を受け取れるようにする）
			if (context?.params) {
				try {
					ctx.params = await context.params;
				} catch (error) {
					return NextResponse.json(
						{ error: "Failed to resolve route parameters" },
						{ status: 500 },
					);
				}
			}

			// ミドルウェアを順次実行
			for (const mw of middlewares) {
				const result = await mw(request, ctx);

				// エラーレスポンスの場合は即座に返す
				if (result instanceof NextResponse) {
					return result;
				}

				// Context を累積（前のミドルウェアが追加した情報を保持しつつ、新しい情報を追加）
				ctx = result;
			}

			// 最終的に handler を実行（ctx には必要な値が全て揃っている）
			// エラーハンドリングもここで実行
			try {
				return await handler(request, ctx);
			} catch (error) {
				const path = new URL(request.url).pathname;
				return handleApiError(
					error instanceof Error ? error : new Error(String(error)),
					path,
				);
			}
		};
	};
}
