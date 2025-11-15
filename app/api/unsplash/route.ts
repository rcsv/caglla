// Unsplash画像取得APIエンドポイント
import logger from '@/lib/core/logger'
// 旅行の目的地に関連する画像を取得する

import { NextRequest, NextResponse } from 'next/server'
import { unsplashApiHelpers } from '@/lib/api/unsplash'
import { validateServerEnvironment } from '@/lib/core/env-validation'
import { badRequest, notFound, parseRequestBody, handleApiError } from '@/lib/core/error-handler'

export async function GET(request: NextRequest) {
  try {
    // 環境変数の検証
    const env = validateServerEnvironment()
    
    if (!env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY && !env.UNSPLASH_ACCESS_KEY) {
      return NextResponse.json(
        { error: 'Unsplash API key is not configured' },
        { status: 500 }
      )
    }

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
      const photoUrl = await unsplashApiHelpers.getTravelPhoto(destination)
      
      if (!photoUrl) {
        return NextResponse.json(
          { error: 'No photos found for the destination' },
          { status: 404 }
        )
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
    const photoOptions = await unsplashApiHelpers.getTravelPhotoOptions(destination, count)
    
    if (photoOptions.length === 0) {
      return NextResponse.json(
        { error: 'No photos found for the destination' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      photos: photoOptions,
      destination: destination
    })

  } catch (error) {
    logger.error('Unsplash API error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // 環境変数の検証
    const env = validateServerEnvironment()
    
    if (!env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY && !env.UNSPLASH_ACCESS_KEY) {
      return NextResponse.json(
        { error: 'Unsplash API key is not configured' },
        { status: 500 }
      )
    }

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
      const photoUrl = await unsplashApiHelpers.getTravelPhoto(destination)
      
      if (!photoUrl) {
        return NextResponse.json(
          { error: 'No photos found for the destination' },
          { status: 404 }
        )
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
    const photoOptions = await unsplashApiHelpers.getTravelPhotoOptions(destination, count)
    
    if (photoOptions.length === 0) {
      return NextResponse.json(
        { error: 'No photos found for the destination' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      photos: photoOptions,
      destination: destination
    })

  } catch (error) {
    logger.error('Unsplash API error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
