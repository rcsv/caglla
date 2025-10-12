import { NextRequest, NextResponse } from 'next/server'
import { getStorage, ref, getDownloadURL, uploadBytes, getMetadata, deleteObject } from 'firebase-admin/storage'
import { adminApp } from '@/lib/firebase/admin'
import { validateServerEnvironment } from '@/lib/env-validation'

const storage = getStorage(adminApp)

interface CacheImageRequest {
  photoReference: string
  googlePhotoUrl: string
  width?: number
  height?: number
  quality?: number
}

interface GetCachedImageRequest {
  photoReference: string
  width?: number
  height?: number
  quality?: number
}

/**
 * 画像をキャッシュする
 */
export async function POST(request: NextRequest) {
  try {
    validateServerEnvironment()

    const body: CacheImageRequest = await request.json()
    const { photoReference, googlePhotoUrl, width = 300, height = 300, quality = 80 } = body

    if (!photoReference || !googlePhotoUrl) {
      return NextResponse.json(
        { error: 'photoReference and googlePhotoUrl are required' },
        { status: 400 }
      )
    }

    const cacheKey = `places-photos/${photoReference}_${width}x${height}_q${quality}.jpg`

    // 既にキャッシュされているかチェック
    try {
      const imageRef = ref(storage, cacheKey)
      await getMetadata(imageRef)
      const url = await getDownloadURL(imageRef)
      
      return NextResponse.json({
        success: true,
        url,
        cached: true,
        cacheKey
      })
    } catch (error) {
      // キャッシュされていない場合は新しくキャッシュ
    }

    // Google Places APIから画像を取得
    const response = await fetch(googlePhotoUrl)
    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.statusText}` },
        { status: 500 }
      )
    }

    const imageBuffer = await response.arrayBuffer()
    const imageRef = ref(storage, cacheKey)

    // Firebase Storageにアップロード
    await uploadBytes(imageRef, imageBuffer, {
      contentType: 'image/jpeg',
      customMetadata: {
        photoReference,
        originalUrl: googlePhotoUrl,
        cachedAt: new Date().toISOString(),
        width: width.toString(),
        height: height.toString(),
        quality: quality.toString()
      }
    })

    const url = await getDownloadURL(imageRef)

    return NextResponse.json({
      success: true,
      url,
      cached: false,
      cacheKey
    })

  } catch (error) {
    console.error('Failed to cache image:', error)
    return NextResponse.json(
      { error: 'Failed to cache image' },
      { status: 500 }
    )
  }
}

/**
 * キャッシュされた画像のURLを取得
 */
export async function GET(request: NextRequest) {
  try {
    validateServerEnvironment()

    const { searchParams } = new URL(request.url)
    const photoReference = searchParams.get('photoReference')
    const width = parseInt(searchParams.get('width') || '300')
    const height = parseInt(searchParams.get('height') || '300')
    const quality = parseInt(searchParams.get('quality') || '80')

    if (!photoReference) {
      return NextResponse.json(
        { error: 'photoReference is required' },
        { status: 400 }
      )
    }

    const cacheKey = `places-photos/${photoReference}_${width}x${height}_q${quality}.jpg`

    try {
      const imageRef = ref(storage, cacheKey)
      await getMetadata(imageRef)
      const url = await getDownloadURL(imageRef)
      
      return NextResponse.json({
        success: true,
        url,
        cached: true,
        cacheKey
      })
    } catch (error) {
      return NextResponse.json(
        { error: 'Image not found in cache' },
        { status: 404 }
      )
    }

  } catch (error) {
    console.error('Failed to get cached image:', error)
    return NextResponse.json(
      { error: 'Failed to get cached image' },
      { status: 500 }
    )
  }
}

/**
 * キャッシュされた画像を削除
 */
export async function DELETE(request: NextRequest) {
  try {
    validateServerEnvironment()

    const { searchParams } = new URL(request.url)
    const photoReference = searchParams.get('photoReference')
    const width = parseInt(searchParams.get('width') || '300')
    const height = parseInt(searchParams.get('height') || '300')
    const quality = parseInt(searchParams.get('quality') || '80')

    if (!photoReference) {
      return NextResponse.json(
        { error: 'photoReference is required' },
        { status: 400 }
      )
    }

    const cacheKey = `places-photos/${photoReference}_${width}x${height}_q${quality}.jpg`

    try {
      const imageRef = ref(storage, cacheKey)
      await deleteObject(imageRef)
      
      return NextResponse.json({
        success: true,
        message: 'Image cache deleted successfully'
      })
    } catch (error) {
      return NextResponse.json(
        { error: 'Image not found in cache' },
        { status: 404 }
      )
    }

  } catch (error) {
    console.error('Failed to delete cached image:', error)
    return NextResponse.json(
      { error: 'Failed to delete cached image' },
      { status: 500 }
    )
  }
}
