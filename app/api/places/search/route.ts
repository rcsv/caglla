import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/core/logger'

const GOOGLE_PLACES_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
// 新Places API (v1) のエンドポイント
const GOOGLE_PLACES_API_URL_NEW = 'https://places.googleapis.com/v1/places:searchText'

export async function POST(request: NextRequest) {
  try {
    if (!GOOGLE_PLACES_API_KEY) {
      return NextResponse.json(
        { error: 'Google Places API key is not configured' },
        { status: 500 }
      )
    }

    const { query } = await request.json()
    
    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: 'Query must be at least 2 characters long' },
        { status: 400 }
      )
    }

    logger.debug('Searching for place with new Places API v1', { query })

    // 新Places API (v1) を呼び出し
    const response = await fetch(GOOGLE_PLACES_API_URL_NEW, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.types,places.rating,places.userRatingCount,places.priceLevel,places.photos'
      },
      body: JSON.stringify({
        textQuery: query,
        languageCode: 'ja',
        regionCode: 'JP',
        maxResultCount: 20
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      logger.error('Google Places API error:', errorData)
      throw new Error(`Google Places API error: ${response.status}`)
    }

    const data = await response.json()
    
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
    logger.error('Error in places search proxy', error)
    return NextResponse.json(
      { error: 'Failed to search places' },
      { status: 500 }
    )
  }
}
