'use client'
import logger from '@/lib/logger'

import { useState, useEffect } from 'react'
import { getZIndexClass } from '@/lib/z-index-layers'
import { placesApiHelpers } from '@/lib/places-api'
import { getCachedPlace, placesCacheManager } from '@/lib/places-cache'

interface POIDialogProps {
  poiData: {
    placeId: string
    name: string
    location: {
      lat: number
      lng: number
    }
    placeData?: any // Itinerariesに保存されているplace_data
  } | null
  onClose: () => void
  className?: string
}

export default function POIDialog({ poiData, onClose, className = '' }: POIDialogProps) {
  const [placeDetails, setPlaceDetails] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!poiData) return

    // Itinerariesに保存されているplace_dataがある場合はそれを使用
    if (poiData.placeData) {
      setPlaceDetails(poiData.placeData)
      setLoading(false)
      setError(null)
      return
    }

    // place_dataがない場合はPlacesCacheを確認してからAPIを呼び出し
    const fetchPlaceDetails = async () => {
      setLoading(true)
      setError(null)
      
      try {
        logger.debug('🔍 Checking PlacesCache for place_id:', poiData.placeId)
        
        // まずPlacesCacheを確認
        const cachedData = await getCachedPlace(poiData.placeId)
        if (cachedData) {
          logger.debug('✅ Found cached data:', cachedData.name)
          
          // キャッシュデータにopen_nowがない場合、最新の営業状態を取得
          if (cachedData.opening_hours && cachedData.opening_hours.open_now === undefined) {
            logger.debug('🔄 Fetching current open_now status...')
            try {
              const currentDetails = await placesApiHelpers.getPlaceDetails(poiData.placeId)
              if (currentDetails.opening_hours?.open_now !== undefined) {
                // キャッシュデータに最新のopen_nowを追加
                cachedData.opening_hours.open_now = currentDetails.opening_hours.open_now
                logger.debug('✅ Updated open_now status:', currentDetails.opening_hours.open_now)
              }
            } catch (err) {
              logger.warn('⚠️ Failed to fetch current open_now status:', err)
            }
          }
          
          setPlaceDetails(cachedData)
          setLoading(false)
          return
        }
        
        logger.debug('❌ No cached data found, calling Google Places API...')
        
        // キャッシュにない場合はAPIを呼び出し
        const details = await placesApiHelpers.getPlaceDetails(poiData.placeId)
        setPlaceDetails(details)
        
        logger.debug('💾 Saving to PlacesCache...')
        
        // APIで取得したデータをキャッシュに保存
        await placesCacheManager.fetchAndCachePlace(poiData.placeId)
        
        logger.debug('✅ Data saved to PlacesCache')
      } catch (err) {
        logger.error('POI詳細情報の取得に失敗しました:', err)
        setError('POI情報の取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    fetchPlaceDetails()
  }, [poiData])

  if (!poiData) return null

  return (
    <div className={`absolute bottom-4 left-4 right-4 ${getZIndexClass('FLOAT_MODAL')} ${className}`}>
      <div className="bg-white border-t border-gray-200 shadow-lg rounded-t-lg w-full">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <h3 className="text-lg font-semibold text-gray-900">
              {poiData.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="閉じる"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-4 max-h-64 overflow-y-auto rounded-b-lg">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-sm text-gray-600">POI情報を読み込み中...</span>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <div className="text-red-500 text-sm">{error}</div>
            </div>
          )}

          {placeDetails && (
            <div className="space-y-4">
              {/* 基本情報 */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">基本情報</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  {placeDetails.formatted_address && (
                    <div>
                      <span className="font-medium">住所:</span> {placeDetails.formatted_address}
                    </div>
                  )}
                  {placeDetails.formatted_phone_number && (
                    <div>
                      <span className="font-medium">電話:</span> {placeDetails.formatted_phone_number}
                    </div>
                  )}
                  {placeDetails.website && (
                    <div>
                      <span className="font-medium">ウェブサイト:</span>{' '}
                      <a 
                        href={placeDetails.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        公式サイト
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* 営業時間 */}
              {placeDetails.opening_hours && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">営業時間</h4>
                  <div className="text-sm text-gray-600">
                    {placeDetails.opening_hours.open_now ? (
                      <span className="text-green-600 font-medium">現在営業中</span>
                    ) : (
                      <span className="text-red-600 font-medium">現在休業中</span>
                    )}
                    {placeDetails.opening_hours.weekday_text && (
                      <div className="mt-2 space-y-1">
                        {placeDetails.opening_hours.weekday_text.map((day: string, index: number) => (
                          <div key={index} className="text-xs">{day}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 評価・レビュー */}
              {placeDetails.rating && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">評価</h4>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(placeDetails.rating)
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      {placeDetails.rating} ({placeDetails.user_ratings_total}件のレビュー)
                    </span>
                  </div>
                </div>
              )}

              {/* カテゴリ */}
              {placeDetails.types && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">カテゴリ</h4>
                  <div className="flex flex-wrap gap-2">
                    {placeDetails.types.slice(0, 5).map((type: string, index: number) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                      >
                        {type.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 写真 */}
              {placeDetails.photos && placeDetails.photos.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">写真</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {placeDetails.photos.slice(0, 4).map((photo: any, index: number) => (
                      <div key={index} className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                        <img
                          src={`https://maps.googleapis.com/maps/api/place/photo?maxwidth=200&photoreference=${photo.photo_reference}&key=${process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY}`}
                          alt={`${poiData.name}の写真${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}