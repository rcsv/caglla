import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import logger from '@/lib/core/logger'
import { composeMiddleware } from '@/lib/core/middleware'
import { withBodyValidation, withGoogleGeocodingKey } from '@/lib/api/middleware'
import { GeocodeSchema } from '@/lib/schemas/geocoding'
import { withExternalApiErrorHandler } from '@/lib/api/external-api-helpers'

const GOOGLE_GEOCODING_API_URL = 'https://maps.googleapis.com/maps/api/geocode'

/**
 * POST /api/geocoding/geocode - 住所→座標変換
 * 
 * zod スキーマバリデーション + Context ミドルウェアで移行済み
 * 
 * Before:
 * ```typescript
 * const body = await parseRequestBody<{...}>(request)
 * if (!address) {
 *   return badRequest('Address is required')
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
  withGoogleGeocodingKey(),
  withBodyValidation(GeocodeSchema)
)(async (request: NextRequest, ctx) => {
  try {
    // ctx.apiKeys, ctx.body が保証されている（型推論が効く）
    const GOOGLE_GEOCODING_API_KEY = ctx.apiKeys!.GOOGLE_GEOCODING!
    
    // zod スキーマでバリデーション済み & 型推論
    type BodyType = z.infer<typeof GeocodeSchema>
    const body = ctx.body as BodyType
    const { address } = body

    // Google Geocoding APIを呼び出し
    const data = await withExternalApiErrorHandler(
      async () => {
        const response = await fetch(
          `${GOOGLE_GEOCODING_API_URL}/json?address=${encodeURIComponent(address)}&key=${GOOGLE_GEOCODING_API_KEY}&language=en&region=jp`
        )

        if (!response.ok) {
          throw new Error(`Google Geocoding API error: ${response.status}`)
        }

        const result = await response.json()
        
        if (result.status !== 'OK' && result.status !== 'ZERO_RESULTS') {
          throw new Error(`Google Geocoding API error: ${result.status}`)
        }

        return result
      },
      'Google Geocoding API',
      '/api/geocoding/geocode'
    )

    if (data instanceof NextResponse) {
      return data
    }

    return NextResponse.json(data)
  } catch (error) {
    // エラーハンドリングは composeMiddleware 側で自動的に適用される
    // ただし、このエンドポイントは外部API呼び出しを含むため、詳細なエラーハンドリングが必要
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error('Error in geocoding/geocode:', error)
    return NextResponse.json(
      { error: 'Failed to geocode address', details: errorMessage },
      { status: 500 }
    )
  }
})
