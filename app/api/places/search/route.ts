import { NextRequest, NextResponse } from 'next/server'

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

    const { query } = await request.json()
    
    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: 'Query must be at least 2 characters long' },
        { status: 400 }
      )
    }

    console.log('API Key (first 10 chars):', GOOGLE_PLACES_API_KEY.substring(0, 10))
    console.log('Query:', query)

    // Google Places APIを呼び出し
    // 日本語検索の精度を向上させるため、typeパラメータを追加
    const apiUrl = `${GOOGLE_PLACES_API_URL}/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_PLACES_API_KEY}&language=ja&region=jp&type=establishment`
    console.log('API URL:', apiUrl.replace(GOOGLE_PLACES_API_KEY, 'API_KEY_HIDDEN'))
    
    const response = await fetch(apiUrl)

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status}`)
    }

    const data = await response.json()
    
    // ZERO_RESULTSは正常なレスポンス（検索結果なし）
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API error: ${data.status}`)
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in places search proxy:', error)
    return NextResponse.json(
      { error: 'Failed to search places' },
      { status: 500 }
    )
  }
}
