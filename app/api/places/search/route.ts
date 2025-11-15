import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/core/logger'
import { isSupportedLanguage, DEFAULT_LANGUAGE } from '@/lib/utils/language'
import type { SupportedLanguage } from '@/lib/core/types'
import { badRequest, parseRequestBody, handleApiError } from '@/lib/core/error-handler'
import { requireGooglePlacesApiKey, withExternalApiErrorHandler, parseApiResponse } from '@/lib/api/external-api-helpers'

// 新Places API (v1) のエンドポイント
const GOOGLE_PLACES_API_URL_NEW = 'https://places.googleapis.com/v1/places:searchText'

export async function POST(request: NextRequest) {
  try {
    // API Keyの取得と検証
    const apiKeyResult = requireGooglePlacesApiKey()
    if (apiKeyResult instanceof NextResponse) {
      return apiKeyResult
    }
    const GOOGLE_PLACES_API_KEY = apiKeyResult

    const body = await parseRequestBody<{
      query?: string
      language?: SupportedLanguage
      locationBias?: any
    }>(request)
    const { query, language, locationBias } = body
    
    if (!query || query.length < 2) {
      return badRequest('Query must be at least 2 characters long')
    }

    // 言語バリデーション
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
          const priceLevels = ['FREE', 'INEXPENSIVE', 'MODERATE', 'EXPENSIVE', 'VERY_EXPENSIVE']
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
    return handleApiError(
      error instanceof Error ? error : new Error(String(error)),
      '/api/places/search'
    )
  }
}
