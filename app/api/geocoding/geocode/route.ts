import { NextRequest, NextResponse } from 'next/server'

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

    const { address } = await request.json()
    
    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      )
    }

    // Google Geocoding APIを呼び出し
    const response = await fetch(
      `${GOOGLE_GEOCODING_API_URL}/json?address=${encodeURIComponent(address)}&key=${GOOGLE_GEOCODING_API_KEY}&language=ja&region=jp`
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
    console.error('Error in geocoding proxy:', error)
    return NextResponse.json(
      { error: 'Failed to geocode address' },
      { status: 500 }
    )
  }
}
