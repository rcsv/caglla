import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/core/logger'

const GOOGLE_PLACES_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
const GOOGLE_PLACES_API_URL_OLD = 'https://maps.googleapis.com/maps/api/place'
const GOOGLE_PLACES_API_URL_NEW = 'https://places.googleapis.com/v1'

export async function GET(request: NextRequest) {
  try {
    if (!GOOGLE_PLACES_API_KEY) {
      return NextResponse.json(
        { error: 'Google Places API key is not configured' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const photoReference = searchParams.get('photoreference')
    const maxWidth = searchParams.get('maxwidth') || '800' // デフォルトを800pxに向上
    const maxHeight = searchParams.get('maxheight')

    if (!photoReference) {
      return NextResponse.json(
        { error: 'Photo reference is required' },
        { status: 400 }
      )
    }

    logger.debug('Fetching photo from Places API', {
      photoReference: photoReference.substring(0, 20) + '...',
      maxWidth,
      maxHeight
    })

    let apiUrl: string
    let headers: HeadersInit

    // 新Places API (v1) の photo name 形式（"places/ChIJ.../photos/..."）か判定
    if (photoReference.startsWith('places/')) {
      // 新Places API (v1) を使用
      apiUrl = `${GOOGLE_PLACES_API_URL_NEW}/${photoReference}/media?maxHeightPx=${maxHeight || maxWidth}&maxWidthPx=${maxWidth}&skipHttpRedirect=false`
      headers = {
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY
      }
    } else {
      // 旧Places API（後方互換性）
      apiUrl = `${GOOGLE_PLACES_API_URL_OLD}/photo?maxwidth=${maxWidth}${maxHeight ? `&maxheight=${maxHeight}` : ''}&photo_reference=${photoReference}&key=${GOOGLE_PLACES_API_KEY}`
      headers = {}
    }

    const response = await fetch(apiUrl, { headers })

    if (!response.ok) {
      logger.error('Failed to fetch photo from Places API', {
        status: response.status,
        statusText: response.statusText,
        isNewAPI: photoReference.startsWith('places/')
      })
      return NextResponse.json(
        { error: 'Failed to fetch photo from Places API' },
        { status: response.status }
      )
    }

    // レスポンスヘッダーをコピーして画像を返す
    const responseHeaders = new Headers()
    responseHeaders.set('Content-Type', response.headers.get('Content-Type') || 'image/jpeg')
    responseHeaders.set('Cache-Control', 'public, max-age=3600') // 1時間のキャッシュ

    return new NextResponse(response.body, {
      status: response.status,
      headers: responseHeaders
    })

  } catch (error) {
    logger.error('Error in places photo proxy', error)
    return NextResponse.json(
      { error: 'Failed to fetch photo' },
      { status: 500 }
    )
  }
}


