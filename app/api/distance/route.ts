import { NextRequest, NextResponse } from 'next/server'

const GOOGLE_PLACES_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
const GOOGLE_DISTANCE_MATRIX_API_URL = 'https://maps.googleapis.com/maps/api/distancematrix/json'

export async function POST(request: NextRequest) {
  try {
    if (!GOOGLE_PLACES_API_KEY) {
      return NextResponse.json(
        { error: 'Google Places API key is not configured' },
        { status: 500 }
      )
    }

    const { origins, destinations, mode = 'driving' } = await request.json()
    
    if (!origins || !destinations) {
      return NextResponse.json(
        { error: 'Origins and destinations are required' },
        { status: 400 }
      )
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

    const response = await fetch(`${GOOGLE_DISTANCE_MATRIX_API_URL}?${params}`)

    if (!response.ok) {
      throw new Error(`Google Distance Matrix API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.status !== 'OK') {
      throw new Error(`Google Distance Matrix API error: ${data.status}`)
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in distance matrix API:', error)
    return NextResponse.json(
      { error: 'Failed to calculate distance and duration' },
      { status: 500 }
    )
  }
}
