import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/core/logger'
import { badRequest, internalError, parseRequestBody, handleApiError } from '@/lib/core/error-handler'

const GOOGLE_GEOCODING_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
const GOOGLE_GEOCODING_API_URL = 'https://maps.googleapis.com/maps/api/geocode'

export async function POST(request: NextRequest) {
  try {
    if (!GOOGLE_GEOCODING_API_KEY) {
      return internalError('Google Geocoding API key is not configured')
    }

    const body = await parseRequestBody<{
      lat?: number
      lng?: number
    }>(request)
    const { lat, lng } = body
    
    if (lat === undefined || lng === undefined) {
      return badRequest('Latitude and longitude are required')
    }

    // Google Geocoding APIを呼び出し
    const response = await fetch(
      `${GOOGLE_GEOCODING_API_URL}/json?latlng=${lat},${lng}&key=${GOOGLE_GEOCODING_API_KEY}&language=en&region=jp`
    )

    if (!response.ok) {
      throw new Error(`Google Geocoding API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Geocoding API error: ${data.status}`)
    }

    return NextResponse.json(data)
  } catch (error) {
    return handleApiError(
      error instanceof Error ? error : new Error(String(error)),
      '/api/geocoding/reverse'
    )
  }
}
