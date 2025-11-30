/**
 * クエリパラメータバリデーションミドルウェア
 * Context 累積型ミドルウェアとして実装
 *
 * zod スキーマを使用してクエリパラメータをバリデーションし、
 * 型安全なデータを Context に追加します。
 */

import { NextRequest, NextResponse } from "next/server";
import type { Middleware, MiddlewareContext } from "@/lib/core/middleware";
import { z } from "zod";
import { handleApiError } from "@/lib/core/error-handler";
import { createValidationError } from "@/lib/core/error-handler";

/**
 * zod エラーを ApiError に変換
 */
function handleZodError(error: unknown, path?: string): NextResponse {
	if (error instanceof z.ZodError) {
		const details = error.errors.map((err) => ({
			path: err.path.join("."),
			message: err.message,
			code: err.code,
		}));

		return handleApiError(
			createValidationError("Validation failed", { errors: details }),
			path,
		);
	}

	return handleApiError(
		error instanceof Error ? error : new Error(String(error)),
		path,
	);
}

/**
 * クエリパラメータバリデーションミドルウェア
 *
 * zod スキーマを使用してクエリパラメータをバリデーションし、
 * 型安全なデータを Context に追加します。
 *
 * @param schema - zod スキーマ
 * @returns Middleware 関数
 *
 * @example
 * ```typescript
 * const UnsplashQuerySchema = z.object({
 *   destination: z.string().min(1),
 *   count: z.number().int().positive().max(10).default(1).optional(),
 * })
 *
 * export const GET = composeMiddleware(
 *   withUnsplashKey(),
 *   withQueryValidation(UnsplashQuerySchema)
 * )(async (request, ctx) => {
 *   // ctx.query が型安全に推論される（UnsplashQuerySchema の型）
 *   const { destination, count } = ctx.query
 *   // ...
 * })
 * ```
 */
export function withQueryValidation<T extends z.ZodTypeAny>(
	schema: T,
): Middleware {
	return async (
		request: NextRequest,
		ctx: MiddlewareContext,
	): Promise<MiddlewareContext | NextResponse> => {
		try {
			// クエリパラメータを取得
			const { searchParams } = new URL(request.url);
			const rawQuery: Record<string, string | undefined> = {};

			// URLSearchParams をオブジェクトに変換
			searchParams.forEach((value, key) => {
				rawQuery[key] = value;
			});

			// zod スキーマでバリデーション（parse はエラーを throw する）
			let validated: unknown;
			try {
				validated = schema.parse(rawQuery);
			} catch (parseError) {
				// zod エラーの場合は詳細なバリデーションエラーを返す
				// zod エラーの判定を複数方法で確認（テスト環境での互換性向上）
				if (
					parseError instanceof z.ZodError ||
					(parseError &&
						typeof parseError === "object" &&
						"issues" in parseError &&
						Array.isArray((parseError as any).issues))
				) {
					return handleZodError(parseError, new URL(request.url).pathname);
				}
				// 予期しないエラー
				throw parseError;
			}

			// Context に追加（型推論が効く）
			return {
				...ctx,
				query: validated,
			};
		} catch (error) {
			// その他のエラー
			return handleApiError(
				error instanceof Error ? error : new Error(String(error)),
				new URL(request.url).pathname,
			);
		}
	};
}
