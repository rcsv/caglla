import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/core/logger'
import { internalError, handleApiError } from '@/lib/core/error-handler'

/**
 * 外部APIヘルパー関数群
 * Google API、Unsplash APIなどの外部API呼び出しをサポート
 */

/**
 * Google Places API Keyの取得と検証
 * @returns API Key、またはエラーレスポンス
 */
export function requireGooglePlacesApiKey(): string | NextResponse {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    return internalError('Google Places API key is not configured')
  }
  return apiKey
}

/**
 * Google Geocoding API Keyの取得と検証
 * @returns API Key、またはエラーレスポンス
 */
export function requireGoogleGeocodingApiKey(): string | NextResponse {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY // Geocoding APIはPlaces APIキーと共用
  if (!apiKey) {
    return internalError('Google Geocoding API key is not configured')
  }
  return apiKey
}

/**
 * Unsplash API Keyの取得と検証
 * @returns API Key、またはエラーレスポンス
 */
export function requireUnsplashApiKey(): string | NextResponse {
  const apiKey = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY || process.env.UNSPLASH_ACCESS_KEY
  if (!apiKey) {
    return internalError('Unsplash API key is not configured')
  }
  return apiKey
}

/**
 * 外部API呼び出しのエラーハンドリング付きラッパー
 * エラー発生時に適切なエラーレスポンスを返す
 * 
 * @param apiCall - 外部API呼び出し関数
 * @param apiName - API名（ログ用）
 * @param endpoint - エンドポイント名（エラーハンドリング用）
 * @returns API呼び出し結果、またはエラーレスポンス
 * 
 * @example
 * ```typescript
 * const result = await withExternalApiErrorHandler(
 *   async () => {
 *     const response = await fetch(apiUrl, options)
 *     if (!response.ok) {
 *       throw new Error(`API error: ${response.status}`)
 *     }
 *     return await response.json()
 *   },
 *   'Google Places API',
 *   '/api/places/search'
 * )
 * if (result instanceof NextResponse) {
 *   return result // エラーレスポンス
 * }
 * // resultはAPI呼び出し結果
 * ```
 */
export async function withExternalApiErrorHandler<T>(
  apiCall: () => Promise<T>,
  apiName: string,
  endpoint: string
): Promise<T | NextResponse> {
  try {
    return await apiCall()
  } catch (error) {
    logger.error(`${apiName} error:`, error)
    
    // エラーの詳細をログに記録
    if (error instanceof Error) {
      logger.error(`Error details: ${error.message}`, { endpoint, apiName })
    }
    
    return handleApiError(
      error instanceof Error ? error : new Error(String(error)),
      endpoint
    )
  }
}

/**
 * fetchレスポンスのエラーチェックとパース
 * エラー発生時に適切なエラーレスポンスを返す
 * 
 * @param response - fetchレスポンス
 * @param apiName - API名（ログ用）
 * @param endpoint - エンドポイント名（エラーハンドリング用）
 * @returns パースされたJSONデータ、またはエラーレスポンス
 */
export async function parseApiResponse<T>(
  response: Response,
  apiName: string,
  endpoint: string
): Promise<T | NextResponse> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    logger.error(`${apiName} error:`, {
      status: response.status,
      statusText: response.statusText,
      errorData,
      endpoint
    })
    return internalError(`${apiName} error: ${response.status} ${response.statusText}`)
  }
  
  try {
    const data = await response.json()
    return data as T
  } catch (error) {
    logger.error(`Failed to parse ${apiName} response:`, error)
    return internalError(`Failed to parse ${apiName} response`)
  }
}

