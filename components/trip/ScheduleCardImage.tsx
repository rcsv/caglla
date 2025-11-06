import { placesApiHelpers } from '@/lib/api/google/places'
import { CachedImageInfo } from '@/lib/storage/image-cache'
import logger from '@/lib/core/logger'
import Image from 'next/image'

interface ScheduleCardImageProps {
  photoUrl: string | null
  title: string
  cachedImage: CachedImageInfo | null
  imageLoading: boolean
  photoReference?: string
  children?: React.ReactNode
}

export function ScheduleCardImage({
  photoUrl,
  title,
  cachedImage,
  imageLoading,
  photoReference,
  children
}: ScheduleCardImageProps) {
  return (
    <div className="flex-shrink-0 w-32 h-18 relative">
      {photoUrl ? (
        <>
          <Image
            src={photoUrl}
            alt={title}
            fill
            sizes="256px"
            className="object-cover"
            quality={90}
            onError={(e) => {
              logger.error('❌ Image load error for:', title, photoUrl)
              if (cachedImage?.cached && photoReference) {
                const target = e.target as HTMLImageElement
                const googlePhotoUrl = placesApiHelpers.getPhotoUrl(photoReference, 800)
                target.src = googlePhotoUrl
              } else {
                ;(e.currentTarget as HTMLImageElement).style.display = 'none'
              }
            }}
            onLoad={() => {
              logger.debug('✅ Image loaded successfully for:', title)
            }}
          />
          {cachedImage?.cached && (
            <div className="absolute top-1 right-1 bg-green-500 text-white text-xs px-1 py-0.5 rounded-full opacity-75">
              C
            </div>
          )}
          {imageLoading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="text-white text-xs">{require('@/lib/i18n').t('loading.message')}</div>
            </div>
          )}
          {/* overlay content */}
          {children && (
            <div className="absolute inset-0 pointer-events-none">
              {children}
            </div>
          )}
        </>
      ) : (
        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
          {imageLoading ? (
            <div className="text-gray-500 text-xs">{require('@/lib/i18n').t('loading.message')}</div>
          ) : (
            <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      )}
    </div>
  )
}

