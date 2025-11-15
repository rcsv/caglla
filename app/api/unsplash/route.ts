// Unsplash画像取得APIエンドポイント
import logger from '@/lib/core/logger'
// 旅行の目的地に関連する画像を取得する

import { NextRequest, NextResponse } from 'next/server'
import { unsplashApiHelpers } from '@/lib/api/unsplash'
import { badRequest, notFound, parseRequestBody, handleApiError } from '@/lib/core/error-handler'
import { requireUnsplashApiKey, withExternalApiErrorHandler } from '@/lib/api/external-api-helpers'

export async function GET(request: NextRequest) {
  try {
    // API Keyの取得と検証
    const apiKeyResult = requireUnsplashApiKey()
    if (apiKeyResult instanceof NextResponse) {
      return apiKeyResult
    }
    // const UNSPLASH_ACCESS_KEY = apiKeyResult; // GETでは直接使用しないが、存在チェックは必要

    const { searchParams } = new URL(request.url)
    const destination = searchParams.get('destination')
    const count = parseInt(searchParams.get('count') || '1')

    if (!destination) {
      return badRequest('Destination parameter is required')
    }

    if (count > 10) {
      return badRequest('Count cannot exceed 10')
    }

    // 単一画像の取得
    if (count === 1) {
      const photoUrl = await withExternalApiErrorHandler(
        async () => {
          const url = await unsplashApiHelpers.getTravelPhoto(destination)
          if (!url) {
            throw new Error('No photos found for the destination')
          }
          return url
        },
        'Unsplash API',
        '/api/unsplash'
      )

      if (photoUrl instanceof NextResponse) {
        if (photoUrl.status === 500 && (await photoUrl.json()).error.includes('No photos found')) {
          return notFound('No photos found for the destination')
        }
        return photoUrl
      }
      
      return NextResponse.json({
        success: true,
        photo: {
          url: photoUrl,
          destination: destination
        }
      })
    }

    // 複数画像の取得
    const photoOptions = await withExternalApiErrorHandler(
      async () => {
        const options = await unsplashApiHelpers.getTravelPhotoOptions(destination, count)
        if (options.length === 0) {
          throw new Error('No photos found for the destination')
        }
        return options
      },
      'Unsplash API',
      '/api/unsplash'
    )

    if (photoOptions instanceof NextResponse) {
      if (photoOptions.status === 500 && (await photoOptions.json()).error.includes('No photos found')) {
        return notFound('No photos found for the destination')
      }
      return photoOptions
    }
    
    return NextResponse.json({
      success: true,
      photos: photoOptions,
      destination: destination
    })

  } catch (error) {
    return handleApiError(
      error instanceof Error ? error : new Error(String(error)),
      '/api/unsplash'
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // API Keyの取得と検証
    const apiKeyResult = requireUnsplashApiKey()
    if (apiKeyResult instanceof NextResponse) {
      return apiKeyResult
    }
    // const UNSPLASH_ACCESS_KEY = apiKeyResult; // 直接使用しないが、存在チェックは必要

    const body = await parseRequestBody<{
      destination?: string
      count?: number
    }>(request)
    const { destination, count = 1 } = body

    if (!destination) {
      return badRequest('Destination is required')
    }

    if (count > 10) {
      return badRequest('Count cannot exceed 10')
    }

    // 単一画像の取得
    if (count === 1) {
      const photoUrl = await withExternalApiErrorHandler(
        async () => {
          const url = await unsplashApiHelpers.getTravelPhoto(destination)
          if (!url) {
            throw new Error('No photos found for the destination')
          }
          return url
        },
        'Unsplash API',
        '/api/unsplash'
      )

      if (photoUrl instanceof NextResponse) {
        if (photoUrl.status === 500 && (await photoUrl.json()).error.includes('No photos found')) {
          return notFound('No photos found for the destination')
        }
        return photoUrl
      }

      return NextResponse.json({
        success: true,
        photo: {
          url: photoUrl,
          destination: destination
        }
      })
    }

    // 複数画像の取得
    const photoOptions = await withExternalApiErrorHandler(
      async () => {
        const options = await unsplashApiHelpers.getTravelPhotoOptions(destination, count)
        if (options.length === 0) {
          throw new Error('No photos found for the destination')
        }
        return options
      },
      'Unsplash API',
      '/api/unsplash'
    )

    if (photoOptions instanceof NextResponse) {
      if (photoOptions.status === 500 && (await photoOptions.json()).error.includes('No photos found')) {
        return notFound('No photos found for the destination')
      }
      return photoOptions
    }

    return NextResponse.json({
      success: true,
      photos: photoOptions,
      destination: destination
    })

  } catch (error) {
    return handleApiError(
      error instanceof Error ? error : new Error(String(error)),
      '/api/unsplash'
    )
  }
}
