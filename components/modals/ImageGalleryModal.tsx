'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { placesApiHelpers } from '@/lib/api/google/places'
import { getCachedPlaceImage } from '@/lib/storage/image-cache'
import type { CachedImageInfo } from '@/lib/storage/image-cache'

interface ImageGalleryModalProps {
  isOpen: boolean
  onClose: () => void
  images: Array<{
    photo_reference: string
    width?: number
    height?: number
  }>
  placeName: string
  initialIndex?: number
}

export default function ImageGalleryModal({
  isOpen,
  onClose,
  images,
  placeName,
  initialIndex = 0
}: ImageGalleryModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [cachedImages, setCachedImages] = useState<CachedImageInfo[]>([])
  const [imageLoading, setImageLoading] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const [mainImageFallbacks, setMainImageFallbacks] = useState<Record<number, boolean>>({})
  const [thumbnailFallbacks, setThumbnailFallbacks] = useState<Record<number, boolean>>({})

  const cacheAllImages = useCallback(async () => {
    if (!images || images.length === 0) return

    setImageLoading(true)
    try {
      const imagePromises = images.map(async (photo) => {
        const maxWidth = Math.min(photo.width ?? 1600, 1600)
        const googlePhotoUrl = placesApiHelpers.getPhotoUrl(photo.photo_reference, maxWidth)
        return await getCachedPlaceImage(photo.photo_reference, googlePhotoUrl, {
          width: maxWidth,
          height: Math.round(maxWidth * ((photo.height ?? maxWidth) / (photo.width ?? maxWidth))),
          quality: 85
        })
      })

      const cachedImageResults = await Promise.all(imagePromises)
      setCachedImages(cachedImageResults)
    } catch (error) {
      console.error('画像キャッシュに失敗しました:', error)
    } finally {
      setImageLoading(false)
    }
  }, [images])

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
  }, [images.length])

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
  }, [images.length])

  // モーダルが開かれたときにキャッシュされた画像を取得
  useEffect(() => {
    if (isOpen && images.length > 0) {
      void cacheAllImages()
    }
  }, [isOpen, images, cacheAllImages])

  // 初期インデックスが変更されたときに更新
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex)
    }
  }, [isOpen, initialIndex])

  // キーボードイベントの処理
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowLeft':
          e.preventDefault()
          goToPrevious()
          break
        case 'ArrowRight':
          e.preventDefault()
          goToNext()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, goToPrevious, goToNext, onClose])

  const handleImageClick = (e: React.MouseEvent) => {
    // 画像をクリックした場合の処理（拡大表示など）
    e.stopPropagation()
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    // 背景部分をクリックした場合のみ閉じる
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleContentClick = (e: React.MouseEvent) => {
    // コンテンツ部分をクリックした場合は閉じない
    e.stopPropagation()
  }

  useEffect(() => {
    if (isOpen) {
      setMainImageFallbacks({})
      setThumbnailFallbacks({})
    }
  }, [isOpen, images])

  if (!isOpen || images.length === 0) return null

  const currentImage = images[currentIndex]
  const cachedImage = cachedImages[currentIndex]
  const mainImageSrc =
    cachedImage && !mainImageFallbacks[currentIndex]
      ? cachedImage.url
      : placesApiHelpers.getPhotoUrl(currentImage.photo_reference, Math.min(currentImage.width ?? 1600, 1600))

  return (
    <div 
      className="fixed inset-0 zidx-dialog-overlay bg-black bg-opacity-75 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className="relative w-full h-full max-w-7xl max-h-screen p-4 flex flex-col"
        onClick={handleContentClick}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-lg font-semibold">
            {require('@/lib/i18n').t('gallery.photosOf').replace('{name}', placeName)}
          </h2>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            className="text-white hover:text-gray-300 transition-colors p-2"
            aria-label={require('@/lib/i18n').t('common.close')}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* メイン画像表示エリア */}
        <div className="flex-1 flex items-center justify-center relative">
          {currentImage && (
            <>
              {/* 前へボタン */}
              {images.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    goToPrevious()
                  }}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-3 rounded-full transition-all z-10"
                  aria-label={require('@/lib/i18n').t('gallery.previousImage')}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}

              {/* 画像 */}
              <div className="max-w-full max-h-full flex items-center justify-center w-full h-full">
                {imageLoading && !cachedImage ? (
                  <div className="text-white text-lg">{require('@/lib/i18n').t('loading.message')}</div>
                ) : (
                  <div
                    className="relative w-full h-full max-w-full max-h-full cursor-zoom-in"
                    onClick={handleImageClick}
                  >
                    <Image
                      src={mainImageSrc}
                        alt={`${placeName}の写真 ${currentIndex + 1}`}
                      fill
                      sizes="(max-width: 1024px) 100vw, 80vw"
                      className="object-contain rounded-lg shadow-2xl"
                      onError={() => {
                        setMainImageFallbacks((prev) => ({
                          ...prev,
                          [currentIndex]: true
                        }))
                      }}
                      priority
                    />
                  </div>
                )}
              </div>

              {/* 次へボタン */}
              {images.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    goToNext()
                  }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-3 rounded-full transition-all z-10"
                  aria-label={require('@/lib/i18n').t('gallery.nextImage')}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </>
          )}
        </div>

        {/* サムネイルと画像情報 */}
        {images.length > 1 && (
          <div className="mt-4">
            {/* 画像カウンター */}
            <div className="text-center text-white mb-3">
              {currentIndex + 1} / {images.length}
            </div>

            {/* サムネイル一覧 */}
            <div className="flex justify-center space-x-2 overflow-x-auto pb-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation()
                    setCurrentIndex(index)
                  }}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    index === currentIndex 
                      ? 'border-white' 
                      : 'border-transparent hover:border-gray-400'
                  }`}
                >
                  <div className="relative w-full h-full">
                    <Image
                      src={
                        cachedImages[index] && !thumbnailFallbacks[index]
                          ? cachedImages[index].url
                          : placesApiHelpers.getPhotoUrl(images[index].photo_reference, 200)
                      }
                      alt={`${placeName}の写真 ${index + 1} サムネイル`}
                      fill
                      className="object-cover"
                      sizes="64px"
                      onError={() => {
                        setThumbnailFallbacks((prev) => ({
                          ...prev,
                          [index]: true
                        }))
                      }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* キャッシュ状態インジケーター */}
        {cachedImage?.cached && (
          <div className="absolute top-16 left-4 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
            {require('@/lib/i18n').t('gallery.cached')}
          </div>
        )}
      </div>
    </div>
  )
}
