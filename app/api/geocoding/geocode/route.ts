import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/core/logger'
import { badRequest, parseRequestBody, handleApiError } from '@/lib/core/error-handler'
import { requireGoogleGeocodingApiKey, withExternalApiErrorHandler } from '@/lib/api/external-api-helpers'

const GOOGLE_GEOCODING_API_URL = 'https://maps.googleapis.com/maps/api/geocode'

export async function POST(request: NextRequest) {
  try {
    // API Keyの取得と検証
    const apiKeyResult = requireGoogleGeocodingApiKey()
    if (apiKeyResult instanceof NextResponse) {
      return apiKeyResult
    }
    const GOOGLE_GEOCODING_API_KEY = apiKeyResult

    const body = await parseRequestBody<{
      address?: string
    }>(request)
    const { address } = body
    
    if (!address) {
      return badRequest('Address is required')
    }

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
    return handleApiError(
      error instanceof Error ? error : new Error(String(error)),
      '/api/geocoding/geocode'
    )
  }
}
