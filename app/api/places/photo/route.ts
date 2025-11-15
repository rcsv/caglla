import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/core/logger'
import { badRequest, handleApiError } from '@/lib/core/error-handler'
import { requireGooglePlacesApiKey, withExternalApiErrorHandler } from '@/lib/api/external-api-helpers'

// 動的レンダリングを強制（request.urlを使用するため）
export const dynamic = 'force-dynamic'

const GOOGLE_PLACES_API_URL_OLD = 'https://maps.googleapis.com/maps/api/place'
const GOOGLE_PLACES_API_URL_NEW = 'https://places.googleapis.com/v1'

export async function GET(request: NextRequest) {
  try {
    // API Keyの取得と検証
    const apiKeyResult = requireGooglePlacesApiKey()
    if (apiKeyResult instanceof NextResponse) {
      return apiKeyResult
    }
    const GOOGLE_PLACES_API_KEY = apiKeyResult

    const { searchParams } = new URL(request.url)
    const photoReference = searchParams.get('photoreference')
    const maxWidth = searchParams.get('maxwidth') || '800' // デフォルトを800pxに向上
    const maxHeight = searchParams.get('maxheight')

    if (!photoReference) {
      return badRequest('Photo reference is required')
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

    // Places APIを呼び出し（エラーハンドリング付き）
    const response = await withExternalApiErrorHandler(
      async () => {
        const res = await fetch(apiUrl, { headers })

        if (!res.ok) {
          throw new Error(`Failed to fetch photo from Places API: ${res.status} ${res.statusText}`)
        }

        return res
      },
      'Google Places API (Photo)',
      '/api/places/photo'
    )

    if (response instanceof NextResponse) {
      return response
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
    return handleApiError(
      error instanceof Error ? error : new Error(String(error)),
      '/api/places/photo'
    )
  }
}


