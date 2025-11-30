// API エラーハンドリングユーティリティ
// 本番環境での情報漏洩を防ぎ、統一されたエラーレスポンスを提供

import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/core/logger";
import { requireAuth, type AuthResult } from "@/lib/api/auth-helpers";
// エラーコードの定義
export enum ApiErrorCode {
	// 400系エラー
	BAD_REQUEST = "BAD_REQUEST",
	UNAUTHORIZED = "UNAUTHORIZED",
	FORBIDDEN = "FORBIDDEN",
	NOT_FOUND = "NOT_FOUND",
	VALIDATION_ERROR = "VALIDATION_ERROR",

	// 500系エラー
	INTERNAL_ERROR = "INTERNAL_ERROR",
	DATABASE_ERROR = "DATABASE_ERROR",
	EXTERNAL_API_ERROR = "EXTERNAL_API_ERROR",
	CONFIGURATION_ERROR = "CONFIGURATION_ERROR",
}

// APIエラークラス
export class ApiError extends Error {
	public readonly statusCode: number;
	public readonly errorCode: ApiErrorCode;
	public readonly details?: any;

	constructor(
		message: string,
		statusCode: number,
		errorCode: ApiErrorCode,
		details?: any,
	) {
		super(message);
		this.name = "ApiError";
		this.statusCode = statusCode;
		this.errorCode = errorCode;
		this.details = details;
	}
}

// エラーレスポンスの型定義
interface ErrorResponse {
	error: {
		code: ApiErrorCode;
		message: string;
		details?: any;
	};
	timestamp: string;
	path?: string;
}

// 開発環境かどうかを判定
function isDevelopment(): boolean {
	return process.env.NODE_ENV === "development";
}

// エラーメッセージのサニタイズ
function sanitizeErrorMessage(error: Error): string {
	const message = error.message;

	// 本番環境では機密情報を含む可能性のあるメッセージをフィルタリング
	if (!isDevelopment()) {
		// ファイルパスを削除
		const sanitized = message.replace(/\/[^\s]+\.(ts|js|tsx|jsx)/g, "[file]");

		// 環境変数名を削除
		return sanitized.replace(/process\.env\.[A-Z_]+/g, "[env_var]");
	}

	return message;
}

// エラーの詳細情報をサニタイズ
function sanitizeErrorDetails(details: any): any {
	if (!isDevelopment()) {
		// 本番環境では詳細情報を返さない
		return undefined;
	}

	// 開発環境でも機密情報は削除
	if (typeof details === "object" && details !== null) {
		const sanitized: any = {};
		const sensitiveKeys = [
			"password",
			"token",
			"apiKey",
			"secret",
			"credential",
		];

		for (const key in details) {
			if (Object.prototype.hasOwnProperty.call(details, key)) {
				const lowerKey = key.toLowerCase();
				const isSensitive = sensitiveKeys.some((sensitive) =>
					lowerKey.includes(sensitive.toLowerCase()),
				);

				if (!isSensitive) {
					sanitized[key] = details[key];
				}
			}
		}

		return sanitized;
	}

	return details;
}

// エラーレスポンスを生成
function createErrorResponse(
	error: Error | ApiError,
	path?: string,
): ErrorResponse {
	let statusCode: number;
	let errorCode: ApiErrorCode;
	let message: string;
	let details: any;

	if (error instanceof ApiError) {
		statusCode = error.statusCode;
		errorCode = error.errorCode;
		message = sanitizeErrorMessage(error);
		details = sanitizeErrorDetails(error.details);
	} else {
		// 予期しないエラー
		statusCode = 500;
		errorCode = ApiErrorCode.INTERNAL_ERROR;

		if (isDevelopment()) {
			message = sanitizeErrorMessage(error);
			details = {
				stack: error.stack,
				type: error.constructor.name,
			};
		} else {
			message = "An internal server error occurred";
			details = undefined;
		}
	}

	// エラーをログに記録
	logger.error(`API Error: ${errorCode}`, error, { path, statusCode });

	return {
		error: {
			code: errorCode,
			message,
			details,
		},
		timestamp: new Date().toISOString(),
		path,
	};
}

// エラーハンドラー関数
export function handleApiError(
	error: Error | ApiError,
	path?: string,
): NextResponse {
	const errorResponse = createErrorResponse(error, path);
	const statusCode = error instanceof ApiError ? error.statusCode : 500;

	return NextResponse.json(errorResponse, { status: statusCode });
}

// よく使うエラーのファクトリー関数
export function createBadRequestError(
	message: string,
	details?: any,
): ApiError {
	return new ApiError(message, 400, ApiErrorCode.BAD_REQUEST, details);
}

export function createUnauthorizedError(
	message: string = "Unauthorized",
): ApiError {
	return new ApiError(message, 401, ApiErrorCode.UNAUTHORIZED);
}

export function createForbiddenError(message: string = "Forbidden"): ApiError {
	return new ApiError(message, 403, ApiErrorCode.FORBIDDEN);
}

export function createNotFoundError(message: string, details?: any): ApiError {
	return new ApiError(message, 404, ApiErrorCode.NOT_FOUND, details);
}

export function createValidationError(
	message: string,
	details?: any,
): ApiError {
	return new ApiError(message, 400, ApiErrorCode.VALIDATION_ERROR, details);
}

export function createInternalError(
	message: string = "Internal server error",
): ApiError {
	return new ApiError(message, 500, ApiErrorCode.INTERNAL_ERROR);
}

export function createDatabaseError(message: string, details?: any): ApiError {
	return new ApiError(message, 500, ApiErrorCode.DATABASE_ERROR, details);
}

export function createExternalApiError(
	message: string,
	details?: any,
): ApiError {
	return new ApiError(message, 502, ApiErrorCode.EXTERNAL_API_ERROR, details);
}

export function createConfigurationError(message: string): ApiError {
	return new ApiError(message, 500, ApiErrorCode.CONFIGURATION_ERROR);
}

// APIルートハンドラーのラッパー関数
export function withErrorHandler<T>(
	handler: (request: Request, context?: any) => Promise<NextResponse<T>>,
) {
	return async (request: Request, context?: any): Promise<NextResponse> => {
		try {
			return await handler(request, context);
		} catch (error) {
			const path = new URL(request.url).pathname;
			return handleApiError(
				error instanceof Error ? error : new Error(String(error)),
				path,
			);
		}
	};
}

// リクエストボディのバリデーション
export function validateRequestBody<T>(
	body: any,
	requiredFields: (keyof T)[],
): T {
	const missingFields: string[] = [];

	for (const field of requiredFields) {
		if (!(field in body) || body[field] === undefined || body[field] === null) {
			missingFields.push(String(field));
		}
	}

	if (missingFields.length > 0) {
		throw createValidationError("Missing required fields", { missingFields });
	}

	return body as T;
}

// リクエストパラメータのバリデーション
export function validateRequiredParam(
	value: string | null | undefined,
	paramName: string,
): string {
	if (!value) {
		throw createBadRequestError(`Missing required parameter: ${paramName}`);
	}
	return value;
}

// 数値パラメータのバリデーション
export function validateNumberParam(
	value: string | null | undefined,
	paramName: string,
	options?: { min?: number; max?: number },
): number {
	const str = validateRequiredParam(value, paramName);
	const num = Number(str);

	if (isNaN(num)) {
		throw createValidationError(
			`Invalid number format for parameter: ${paramName}`,
		);
	}

	if (options?.min !== undefined && num < options.min) {
		throw createValidationError(
			`Parameter ${paramName} must be at least ${options.min}`,
		);
	}

	if (options?.max !== undefined && num > options.max) {
		throw createValidationError(
			`Parameter ${paramName} must be at most ${options.max}`,
		);
	}

	return num;
}

// JSONパースのバリデーション
export async function parseRequestBody<T>(request: Request): Promise<T> {
	try {
		// リクエストボディが空の場合は空オブジェクトを返す
		const contentType = request.headers.get("content-type");
		if (!contentType || !contentType.includes("application/json")) {
			return {} as T;
		}

		const text = await request.text();
		if (!text || text.trim() === "") {
			return {} as T;
		}

		const body = JSON.parse(text);
		return body as T;
	} catch (error) {
		throw createBadRequestError("Invalid JSON in request body", {
			error: error instanceof Error ? error.message : String(error),
		});
	}
}

// よく使うエラーレスポンスのショートカット関数
//
// Phase 6: エラー統一 - 統一されたエラーレスポンス形式を使用
//
// Before:
// ```typescript
// export function badRequest(message: string): NextResponse {
//   return NextResponse.json({ error: message }, { status: 400 })
// }
// ```
//
// After:
// ```typescript
// // ApiError と handleApiError を使用した統一された形式
// // エラーメッセージの国際化対応も可能
// ```
export function unauthorized(
	message = "Authorization header required",
): NextResponse {
	return handleApiError(createUnauthorizedError(message), undefined);
}

export function notFound(resource = "Resource"): NextResponse {
	return handleApiError(
		createNotFoundError(`${resource} not found`),
		undefined,
	);
}

/**
 * 400 Bad Request エラーを返す（統一されたエラーレスポンス形式）
 *
 * Phase 6: badRequest の乱立を zod エラーに統一
 *
 * Before:
 * ```typescript
 * export function badRequest(message: string): NextResponse {
 *   return NextResponse.json({ error: message }, { status: 400 })
 * }
 * ```
 *
 * After:
 * ```typescript
 * // ApiError と handleApiError を使用した統一された形式
 * // エラーメッセージの国際化対応も可能
 * ```
 */
export function badRequest(message: string, details?: any): NextResponse {
	return handleApiError(createBadRequestError(message, details), undefined);
}

export function internalError(message = "Internal server error"): NextResponse {
	return handleApiError(createInternalError(message), undefined);
}

// 認証付きAPIルートハンドラーのラッパー関数
/**
 * 認証チェックを含むAPIルートハンドラーのラッパー関数
 * 認証チェックとエラーハンドリングを自動化
 *
 * @param handler - 認証済みリクエストを処理するハンドラー関数
 * @returns Next.js Route Handler関数
 *
 * @example
 * ```typescript
 * export const POST = withAuth(async (request: NextRequest, auth) => {
 *   const { userId } = auth
 *   // ビジネスロジック
 *   const result = await doSomething(userId)
 *   return NextResponse.json({ result })
 * })
 * ```
 */
export function withAuth<T>(
	handler: (request: NextRequest, auth: AuthResult) => Promise<NextResponse<T>>,
) {
	return async (request: NextRequest): Promise<NextResponse> => {
		try {
			const auth = await requireAuth(request);
			if (auth instanceof NextResponse) {
				return auth; // 認証エラーをそのまま返す
			}
			return await handler(request, auth);
		} catch (error) {
			const path = new URL(request.url).pathname;
			return handleApiError(
				error instanceof Error ? error : new Error(String(error)),
				path,
			);
		}
	};
}
