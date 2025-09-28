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

    // 複数の検索戦略を試行
    const searchStrategies = [
      // 1. 元のクエリで検索
      `${GOOGLE_PLACES_API_URL}/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_PLACES_API_KEY}&language=ja&region=jp`,
      // 2. 英語でも検索してみる
      `${GOOGLE_PLACES_API_URL}/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_PLACES_API_KEY}&language=en`,
      // 3. 地域制限なしで検索
      `${GOOGLE_PLACES_API_URL}/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_PLACES_API_KEY}&language=ja`
    ]

    let lastError: Error | null = null
    
    for (let i = 0; i < searchStrategies.length; i++) {
      const apiUrl = searchStrategies[i]
      console.log(`Trying search strategy ${i + 1}:`, apiUrl.replace(GOOGLE_PLACES_API_KEY, 'API_KEY_HIDDEN'))
      
      try {
        const response = await fetch(apiUrl)

        if (!response.ok) {
          throw new Error(`Google Places API error: ${response.status}`)
        }

        const data = await response.json()
        
        // ZERO_RESULTSは正常なレスポンス（検索結果なし）
        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
          throw new Error(`Google Places API error: ${data.status}`)
        }

        // 結果が見つかった場合、または最後の戦略の場合は返す
        if (data.status === 'OK' || i === searchStrategies.length - 1) {
          return NextResponse.json(data)
        }
        
        // ZERO_RESULTSの場合は次の戦略を試す
        lastError = new Error(`No results found with strategy ${i + 1}`)
        
      } catch (error) {
        console.log(`Search strategy ${i + 1} failed:`, error)
        lastError = error instanceof Error ? error : new Error('Unknown error')
        
        // 最後の戦略でない場合は次の戦略を試す
        if (i < searchStrategies.length - 1) {
          continue
        }
      }
    }

    // すべての戦略が失敗した場合
    throw lastError || new Error('All search strategies failed')
  } catch (error) {
    console.error('Error in places search proxy:', error)
    return NextResponse.json(
      { error: 'Failed to search places' },
      { status: 500 }
    )
  }
}
