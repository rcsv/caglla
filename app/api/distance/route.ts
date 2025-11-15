import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/core/logger'
import { badRequest, internalError, parseRequestBody, handleApiError } from '@/lib/core/error-handler'

const GOOGLE_PLACES_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
const GOOGLE_DISTANCE_MATRIX_API_URL = 'https://maps.googleapis.com/maps/api/distancematrix/json'

export async function POST(request: NextRequest) {
  try {
    if (!GOOGLE_PLACES_API_KEY) {
      return internalError('Google Places API key is not configured')
    }

    const body = await parseRequestBody<{
      origins?: string | string[]
      destinations?: string | string[]
      mode?: 'driving' | 'walking' | 'bicycling' | 'transit'
    }>(request)
    const { origins, destinations, mode = 'driving' } = body
    
    if (!origins || !destinations) {
      return badRequest('Origins and destinations are required')
    }

    // Distance Matrix APIを呼び出し
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

    const data = await response.json()
    
    if (data.status !== 'OK') {
      throw new Error(`Google Distance Matrix API error: ${data.status}`)
    }

    return NextResponse.json(data)
  } catch (error) {
    return handleApiError(
      error instanceof Error ? error : new Error(String(error)),
      '/api/distance'
    )
  }
}
