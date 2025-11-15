import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/core/logger'
import { badRequest, internalError, parseRequestBody, handleApiError } from '@/lib/core/error-handler'

const GOOGLE_PLACES_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
// 新Places API (v1) のsearchNearbyエンドポイント
const GOOGLE_PLACES_API_URL_NEARBY = 'https://places.googleapis.com/v1/places:searchNearby'

export async function POST(request: NextRequest) {
  try {
    if (!GOOGLE_PLACES_API_KEY) {
      return internalError('Google Places API key is not configured')
    }

    const body = await parseRequestBody<{
      location?: { lat: number; lng: number }
      radius?: number
    }>(request)
    const { location, radius } = body
    
    if (!location || !location.lat || !location.lng) {
      return badRequest('Location (lat, lng) is required')
    }

    logger.debug('Searching nearby places with new Places API v1', { location, radius })

    // 新Places API (v1) のsearchNearbyを呼び出し
    const response = await fetch(GOOGLE_PLACES_API_URL_NEARBY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.types'
      },
      body: JSON.stringify({
        locationRestriction: {
          circle: {
            center: {
              latitude: location.lat,
              longitude: location.lng
            },
            radius: radius || 50 // デフォルト50メートル
          }
        },
        languageCode: 'en',
        maxResultCount: 5
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      logger.error('Google Places API (searchNearby) error:', errorData)
      throw new Error(`Google Places API error: ${response.status}`)
    }

    const data = await response.json()
    
    logger.debug('Nearby search results count:', data.places?.length || 0)
    
    // 旧API形式に変換（互換性のため）
    const legacyFormat = {
      status: data.places && data.places.length > 0 ? 'OK' : 'ZERO_RESULTS',
      results: (data.places || []).map((place: any) => ({
        place_id: place.id,
        name: place.displayName?.text || '',
        formatted_address: place.formattedAddress || '',
        geometry: {
          location: {
            lat: place.location?.latitude || 0,
            lng: place.location?.longitude || 0
          }
        },
        types: place.types || []
      }))
    }
    
    logger.debug('Nearby search response (legacy format):', legacyFormat)
    
    return NextResponse.json(legacyFormat)
  } catch (error) {
    return handleApiError(
      error instanceof Error ? error : new Error(String(error)),
      '/api/places/nearby'
    )
  }
}

