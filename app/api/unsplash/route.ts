// Unsplash画像取得APIエンドポイント
// 旅行の目的地に関連する画像を取得する

import { NextRequest, NextResponse } from 'next/server'
import { unsplashApiHelpers } from '@/lib/unsplash-api'
import { validateServerEnvironment } from '@/lib/env-validation'

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
      return NextResponse.json(
        { error: 'Destination parameter is required' },
        { status: 400 }
      )
    }

    if (count > 10) {
      return NextResponse.json(
        { error: 'Count cannot exceed 10' },
        { status: 400 }
      )
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
    console.error('Unsplash API error:', error)
    
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

    const body = await request.json()
    const { destination, count = 1 } = body

    if (!destination) {
      return NextResponse.json(
        { error: 'Destination is required' },
        { status: 400 }
      )
    }

    if (count > 10) {
      return NextResponse.json(
        { error: 'Count cannot exceed 10' },
        { status: 400 }
      )
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
    console.error('Unsplash API error:', error)
    
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
