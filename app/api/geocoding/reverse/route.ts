import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/logger'

const GOOGLE_GEOCODING_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
const GOOGLE_GEOCODING_API_URL = 'https://maps.googleapis.com/maps/api/geocode'

export async function POST(request: NextRequest) {
  try {
    if (!GOOGLE_GEOCODING_API_KEY) {
      return NextResponse.json(
        { error: 'Google Geocoding API key is not configured' },
        { status: 500 }
      )
    }

    const { lat, lng } = await request.json()
    
    if (lat === undefined || lng === undefined) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      )
    }

    // Google Geocoding APIを呼び出し
    const response = await fetch(
      `${GOOGLE_GEOCODING_API_URL}/json?latlng=${lat},${lng}&key=${GOOGLE_GEOCODING_API_KEY}&language=ja&region=jp`
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
    logger.error('Error in reverse geocoding proxy:', error)
    return NextResponse.json(
      { error: 'Failed to reverse geocode coordinates' },
      { status: 500 }
    )
  }
}
