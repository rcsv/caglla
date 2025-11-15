/**
 * API Key Context Middleware
 * 
 * 外部APIキーを context に追加するミドルウェア
 * Context 累積型に統一することで mental model が簡単になる
 */

import { NextRequest, NextResponse } from 'next/server'
import type { Middleware, MiddlewareContext } from '@/lib/core/middleware'
import { internalError } from '@/lib/core/error-handler'

/**
 * Google Places API Key を context に追加するミドルウェア
 * 
 * @returns Middleware 関数
 * 
 * @example
 * ```typescript
 * export const POST = composeMiddleware(
 *   withErrorHandling,
 *   withGooglePlacesKey()
 * )(async (request, ctx) => {
 *   const apiKey = ctx.apiKeys!.GOOGLE_PLACES!
 *   // API呼び出し
 * })
 * ```
 */
export function withGooglePlacesKey(): Middleware {
  return async (request: NextRequest, ctx: MiddlewareContext): Promise<MiddlewareContext | NextResponse> => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
    if (!key) {
      return internalError('Google Places API key is not configured')
    }
    
    return {
      ...ctx,
      apiKeys: {
        ...ctx.apiKeys,
        GOOGLE_PLACES: key
      }
    }
  }
}

/**
 * Google Geocoding API Key を context に追加するミドルウェア
 * (Google Places API Key と共用)
 * 
 * @returns Middleware 関数
 * 
 * @example
 * ```typescript
 * export const POST = composeMiddleware(
 *   withErrorHandling,
 *   withGoogleGeocodingKey()
 * )(async (request, ctx) => {
 *   const apiKey = ctx.apiKeys!.GOOGLE_GEOCODING!
 *   // API呼び出し
 * })
 * ```
 */
export function withGoogleGeocodingKey(): Middleware {
  return async (request: NextRequest, ctx: MiddlewareContext): Promise<MiddlewareContext | NextResponse> => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY // 共用
    if (!key) {
      return internalError('Google Geocoding API key is not configured')
    }
    
    return {
      ...ctx,
      apiKeys: {
        ...ctx.apiKeys,
        GOOGLE_GEOCODING: key
      }
    }
  }
}

/**
 * Unsplash API Key を context に追加するミドルウェア
 * 
 * @returns Middleware 関数
 * 
 * @example
 * ```typescript
 * export const POST = composeMiddleware(
 *   withErrorHandling,
 *   withUnsplashKey()
 * )(async (request, ctx) => {
 *   const apiKey = ctx.apiKeys!.UNSPLASH!
 *   // API呼び出し
 * })
 * ```
 */
export function withUnsplashKey(): Middleware {
  return async (request: NextRequest, ctx: MiddlewareContext): Promise<MiddlewareContext | NextResponse> => {
    const key = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY || process.env.UNSPLASH_ACCESS_KEY
    if (!key) {
      return internalError('Unsplash API key is not configured')
    }
    
    return {
      ...ctx,
      apiKeys: {
        ...ctx.apiKeys,
        UNSPLASH: key
      }
    }
  }
}

