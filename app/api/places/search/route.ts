import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import logger from '@/lib/core/logger'
import { isSupportedLanguage, DEFAULT_LANGUAGE } from '@/lib/utils/language'
import type { SupportedLanguage } from '@/lib/core/types'
import { composeMiddleware } from '@/lib/core/middleware'
import { withBodyValidation, withGooglePlacesKey } from '@/lib/api/middleware'
import { PlaceSearchSchema } from '@/lib/schemas/place'
import { withExternalApiErrorHandler, parseApiResponse } from '@/lib/api/external-api-helpers'

// 新Places API (v1) のエンドポイント
const GOOGLE_PLACES_API_URL_NEW = 'https://places.googleapis.com/v1/places:searchText'

/**
 * POST /api/places/search - 場所検索
 * 
 * zod スキーマバリデーション + Context ミドルウェアで移行済み
 * 
 * Before:
 * ```typescript
 * const body = await parseRequestBody<{...}>(request)
 * if (!query || query.length < 2) {
 *   return badRequest('Query must be at least 2 characters long')
 * }
 * ```
 * 
 * After:
 * ```typescript
 * // ctx.body が型安全 & バリデ済み
 * // すべての if 文バリデーションが消える
 * ```
 */
export const POST = composeMiddleware(
  withGooglePlacesKey(),
  withBodyValidation(PlaceSearchSchema)
)(async (request: NextRequest, ctx) => {
  try {
    // ctx.apiKeys, ctx.body が保証されている（型推論が効く）
    const GOOGLE_PLACES_API_KEY = ctx.apiKeys!.GOOGLE_PLACES!
    
    // zod スキーマでバリデーション済み & 型推論
    type BodyType = z.infer<typeof PlaceSearchSchema>
    const body = ctx.body as BodyType
    const { query, language, locationBias } = body

    // 言語バリデーション（zod スキーマでデフォルト値が設定済み）
    const validLanguage: SupportedLanguage = language && isSupportedLanguage(language) 
      ? language 
      : DEFAULT_LANGUAGE

    logger.debug('Searching for place with new Places API v1', { query, language: validLanguage, hasLocationBias: !!locationBias })

    // 新Places API (v1) を呼び出し
    const data = await withExternalApiErrorHandler(
      async () => {
        const response = await fetch(GOOGLE_PLACES_API_URL_NEW, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
            'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.types,places.rating,places.userRatingCount,places.priceLevel,places.photos'
          },
          body: JSON.stringify({
            textQuery: query,
            languageCode: validLanguage,  // 動的に設定
            // regionCode を削除（言語で地域を固定しない）
            maxResultCount: 20,
            // locationBias を条件付きで追加（地図の現在位置を考慮した検索）
            ...(locationBias && { locationBias })
          })
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(`Google Places API error: ${response.status} - ${JSON.stringify(errorData)}`)
        }

        return await response.json() as { places?: any[] }
      },
      'Google Places API',
      '/api/places/search'
    )

    if (data instanceof NextResponse) {
      return data
    }
    
    logger.debug('Search results count:', data.places?.length || 0)
    
    // 旧API形式に変換
    const legacyFormat = {
      status: data.places && data.places.length > 0 ? 'OK' : 'ZERO_RESULTS',
      results: (data.places || []).map((place: any) => ({
        place_id: place.id?.replace('places/', ''),
        name: place.displayName?.text || place.displayName || place.name,
        formatted_address: place.formattedAddress,
        geometry: place.location ? {
          location: {
            lat: place.location.latitude,
            lng: place.location.longitude
          }
        } : undefined,
        types: place.types || [],
        rating: place.rating,
        price_level: place.priceLevel ? (() => {
          // Google Places API v1 returns 'PRICE_LEVEL_*' format
          const priceLevels = ['PRICE_LEVEL_FREE', 'PRICE_LEVEL_INEXPENSIVE', 'PRICE_LEVEL_MODERATE', 'PRICE_LEVEL_EXPENSIVE', 'PRICE_LEVEL_VERY_EXPENSIVE']
          const index = priceLevels.indexOf(place.priceLevel)
          return index >= 0 ? index : undefined
        })() : undefined,
        photos: place.photos?.map((photo: any) => ({
          photo_reference: photo.name,
          height: photo.heightPx,
          width: photo.widthPx
        }))
      }))
    }

    return NextResponse.json(legacyFormat)
  } catch (error) {
    // エラーハンドリングは composeMiddleware 側で自動的に適用される
    // ただし、このエンドポイントは外部API呼び出しを含むため、詳細なエラーハンドリングが必要
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error('Error in places/search:', error)
    return NextResponse.json(
      { error: 'Failed to search places', details: errorMessage },
      { status: 500 }
    )
  }
})
