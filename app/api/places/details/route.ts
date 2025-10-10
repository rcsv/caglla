import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/core/logger'

const GOOGLE_PLACES_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
const GOOGLE_PLACES_API_URL = 'https://maps.googleapis.com/maps/api/place'

export async function POST(request: NextRequest) {
  try {
    if (!GOOGLE_PLACES_API_KEY) {
      return NextResponse.json(
        { error: 'Google Places API key is not configured' },
        { status: 500 }
      )
    }

    const { placeId } = await request.json()
    
    if (!placeId) {
      return NextResponse.json(
        { error: 'Place ID is required' },
        { status: 400 }
      )
    }

    const fields = [
      'place_id',
      'name',
      'formatted_address',
      'address_components',
      'geometry',
      'types',
      'rating',
      'price_level',
      'photos',
      'opening_hours',
      'international_phone_number',
      'website',
      'editorial_summary'
    ].join(',')

    // Google Places APIを呼び出し
    const response = await fetch(
      `${GOOGLE_PLACES_API_URL}/details/json?place_id=${placeId}&fields=${fields}&key=${GOOGLE_PLACES_API_KEY}&language=ja&region=jp`
    )

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.status !== 'OK') {
      throw new Error(`Google Places API error: ${data.status}`)
    }

    return NextResponse.json(data)
  } catch (error) {
    logger.error('Error in places details proxy:', error)
    return NextResponse.json(
      { error: 'Failed to get place details' },
      { status: 500 }
    )
  }
}
