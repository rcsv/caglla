import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/core/logger'

const GOOGLE_PLACES_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
const GOOGLE_PLACES_API_URL = 'https://maps.googleapis.com/maps/api/place'

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
      photoReference: photoReference.substring(0, 10) + '...',
      maxWidth,
      maxHeight
    })

    // Google Places APIから写真を取得
    const apiUrl = `${GOOGLE_PLACES_API_URL}/photo?maxwidth=${maxWidth}${maxHeight ? `&maxheight=${maxHeight}` : ''}&photo_reference=${photoReference}&key=${GOOGLE_PLACES_API_KEY}`

    const response = await fetch(apiUrl)

    if (!response.ok) {
      logger.error('Failed to fetch photo from Places API', {
        status: response.status,
        statusText: response.statusText
      })
      return NextResponse.json(
        { error: 'Failed to fetch photo from Places API' },
        { status: response.status }
      )
    }

    // レスポンスヘッダーをコピーして画像を返す
    const headers = new Headers()
    headers.set('Content-Type', response.headers.get('Content-Type') || 'image/jpeg')
    headers.set('Cache-Control', 'public, max-age=3600') // 1時間のキャッシュ

    return new NextResponse(response.body, {
      status: response.status,
      headers
    })

  } catch (error) {
    logger.error('Error in places photo proxy', error)
    return NextResponse.json(
      { error: 'Failed to fetch photo' },
      { status: 500 }
    )
  }
}


