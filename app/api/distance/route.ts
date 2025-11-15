import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/core/logger'
import { badRequest, parseRequestBody, handleApiError } from '@/lib/core/error-handler'
import { requireGooglePlacesApiKey, withExternalApiErrorHandler } from '@/lib/api/external-api-helpers'

const GOOGLE_DISTANCE_MATRIX_API_URL = 'https://maps.googleapis.com/maps/api/distancematrix/json'

export async function POST(request: NextRequest) {
  try {
    // API Keyの取得と検証
    const apiKeyResult = requireGooglePlacesApiKey()
    if (apiKeyResult instanceof NextResponse) {
      return apiKeyResult
    }
    const GOOGLE_PLACES_API_KEY = apiKeyResult

    const body = await parseRequestBody<{
      origins?: string | string[]
      destinations?: string | string[]
      mode?: 'driving' | 'walking' | 'bicycling' | 'transit'
    }>(request)
    const { origins, destinations, mode = 'driving' } = body
    
    if (!origins || !destinations) {
      return badRequest('Origins and destinations are required')
    }

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
    return handleApiError(
      error instanceof Error ? error : new Error(String(error)),
      '/api/distance'
    )
  }
}
