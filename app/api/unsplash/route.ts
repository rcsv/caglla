// Unsplash画像取得APIエンドポイント
import logger from '@/lib/core/logger'
// 旅行の目的地に関連する画像を取得する

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { unsplashApiHelpers } from '@/lib/api/unsplash'
import { notFound, handleApiError } from '@/lib/core/error-handler'
import { composeMiddleware } from '@/lib/core/middleware'
import { withQueryValidation, withBodyValidation, withUnsplashKey } from '@/lib/api/middleware'
import { UnsplashQuerySchema, UnsplashBodySchema } from '@/lib/schemas/unsplash'
import { withExternalApiErrorHandler } from '@/lib/api/external-api-helpers'

/**
 * GET /api/unsplash - Unsplash画像取得（クエリパラメータ）
 * 
 * zod スキーマバリデーション + Context ミドルウェアで移行済み
 */
export const GET = composeMiddleware(
  withUnsplashKey(),
  withQueryValidation(UnsplashQuerySchema)
)(async (request: NextRequest, ctx) => {
  try {
    // ctx.apiKeys, ctx.query が保証されている（型推論が効く）
    
    // zod スキーマでバリデーション済み & 型推論
    type QueryType = z.infer<typeof UnsplashQuerySchema>
    const query = ctx.query as QueryType
    const { destination, count = 1 } = query

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
        // カスタムヘッダーで"No photos found"エラーを判定（レスポンスボディを消費しない）
        if (photoUrl.headers.get('X-Error-Code') === 'NO_PHOTOS_FOUND') {
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
      // カスタムヘッダーで"No photos found"エラーを判定（レスポンスボディを消費しない）
      if (photoOptions.headers.get('X-Error-Code') === 'NO_PHOTOS_FOUND') {
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
})

/**
 * POST /api/unsplash - Unsplash画像取得（リクエストボディ）
 * 
 * zod スキーマバリデーション + Context ミドルウェアで移行済み
 */
export const POST = composeMiddleware(
  withUnsplashKey(),
  withBodyValidation(UnsplashBodySchema)
)(async (request: NextRequest, ctx) => {
  try {
    // ctx.apiKeys, ctx.body が保証されている（型推論が効く）
    
    // zod スキーマでバリデーション済み & 型推論
    type BodyType = z.infer<typeof UnsplashBodySchema>
    const body = ctx.body as BodyType
    const { destination, count = 1 } = body

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
        // カスタムヘッダーで"No photos found"エラーを判定（レスポンスボディを消費しない）
        if (photoUrl.headers.get('X-Error-Code') === 'NO_PHOTOS_FOUND') {
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
      // カスタムヘッダーで"No photos found"エラーを判定（レスポンスボディを消費しない）
      if (photoOptions.headers.get('X-Error-Code') === 'NO_PHOTOS_FOUND') {
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
})
