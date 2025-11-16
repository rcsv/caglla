import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import logger from '@/lib/core/logger'
import { composeMiddleware } from '@/lib/core/middleware'
import { withBodyValidation, withGooglePlacesKey } from '@/lib/api/middleware'
import { DistanceSchema } from '@/lib/schemas/distance'
import { withExternalApiErrorHandler } from '@/lib/api/external-api-helpers'

const GOOGLE_DISTANCE_MATRIX_API_URL = 'https://maps.googleapis.com/maps/api/distancematrix/json'

/**
 * POST /api/distance - 距離・時間計算
 * 
 * zod スキーマバリデーション + Context ミドルウェアで移行済み
 * 
 * Before:
 * ```typescript
 * const body = await parseRequestBody<{...}>(request)
 * if (!origins || !destinations) {
 *   return badRequest('Origins and destinations are required')
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
  withBodyValidation(DistanceSchema)
)(async (request: NextRequest, ctx) => {
  try {
    // ctx.apiKeys, ctx.body が保証されている（型推論が効く）
    const GOOGLE_PLACES_API_KEY = ctx.apiKeys!.GOOGLE_PLACES!
    
    // zod スキーマでバリデーション済み & 型推論
    type BodyType = z.infer<typeof DistanceSchema>
    const body = ctx.body as BodyType
    const { origins, destinations, mode = 'driving' } = body

    // Distance Matrix APIを呼び出し（エラーハンドリング付き）
    const data = await withExternalApiErrorHandler(
      async () => {
        const params = new URLSearchParams({
          origins: Array.isArray(origins) ? origins.join('|') : origins,
          destinations: Array.isArray(destinations) ? destinations.join('|') : destinations,
          mode: mode, // driving, walking, bicycling, transit
          language: 'ja',
          region: 'jp',
          key: GOOGLE_PLACES_API_KEY
        })

        const response = await fetch(`${GOOGLE_DISTANCE_MATRIX_API_URL}?${params}`, {
          signal: AbortSignal.timeout(10000) // 10秒でタイムアウト
        })

        if (!response.ok) {
          throw new Error(`Google Distance Matrix API error: ${response.status}`)
        }

        const result = await response.json()
        
        if (result.status !== 'OK') {
          throw new Error(`Google Distance Matrix API error: ${result.status}`)
        }

        return result
      },
      'Google Distance Matrix API',
      '/api/distance'
    )

    if (data instanceof NextResponse) {
      return data
    }

    return NextResponse.json(data)
  } catch (error) {
    // エラーハンドリングは composeMiddleware 側で自動的に適用される
    // ただし、このエンドポイントは外部API呼び出しを含むため、詳細なエラーハンドリングが必要
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error('Error in distance:', error)
    return NextResponse.json(
      { error: 'Failed to calculate distance', details: errorMessage },
      { status: 500 }
    )
  }
})
