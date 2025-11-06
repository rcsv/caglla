'use client'
import logger from '@/lib/core/logger'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import Image from 'next/image'
import { placesApiHelpers } from '@/lib/api/google/places'
import { getCachedPlace, placesCacheManager } from '@/lib/travel/places-cache'
import { Button } from '@/components/common/Button'
import { getCachedPlaceImage, CachedImageInfo } from '@/lib/storage/image-cache'
import type { AggregatedVenueData, UnifiedReview } from '@/lib/api/venue-aggregator'
import type { PlaceData } from '@/lib/core/types'
import { useAuth } from '@/lib/contexts/auth'
import { getUserLanguage } from '@/lib/utils/language'
import ImageGalleryModal from './ImageGalleryModal'
import { t } from '@/lib/i18n'

interface POIDialogProps {
  poiData: {
    placeId: string
    name: string
    location: {
      lat: number
      lng: number
    }
    placeData?: PlaceData // Itinerariesに保存されているplace_data
    orderNumber?: number // マップピン番号
  } | null
  onClose: () => void
  onAddToItinerary?: (placeId: string, dayId: string) => void
  availableDays?: Array<{ id: string; date: string; title?: string }>
  className?: string
}

// 営業時間を解析する関数
function parseOpeningHours(weekdayText: string[] | undefined, language: 'ja' | 'en' = 'ja') {
  if (!weekdayText || weekdayText.length === 0) {
    return null
  }

  const now = new Date()
  const today = now.getDay() // 0=日曜日, 1=月曜日, ..., 6=土曜日
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  
  // 曜日のマッピング（Google APIは月曜始まり）
  const dayIndexMap = [6, 0, 1, 2, 3, 4, 5] // [日, 月, 火, 水, 木, 金, 土]
  const todayText = weekdayText[dayIndexMap[today]]
  
  // 営業日を判定（多言語対応）
  const closedKeywords = language === 'ja' 
    ? ['定休日', '休業日']
    : ['closed', 'Closed']
  const openDays = weekdayText.map(text => {
    return !closedKeywords.some(keyword => text.includes(keyword))
  })
  
  // 今日の営業時間を解析
  let isOpen = false
  let currentHours = ''
  
  if (todayText) {
    // 24時間営業のチェック（多言語対応）
    const open24hKeywords = language === 'ja'
      ? ['24 時間営業', '24時間営業']
      : ['24 hours', 'Open 24 hours', 'Open 24h']
    if (open24hKeywords.some(keyword => todayText.includes(keyword))) {
      isOpen = true
      currentHours = t('poi.openingHours.open24h', language)
    } else if (closedKeywords.some(keyword => todayText.includes(keyword))) {
      isOpen = false
      currentHours = t('poi.openingHours.closedDay', language)
    } else {
      // 営業時間文字列を正規化する関数（多言語対応）
      const normalizeTimeText = (text: string): string => {
        // 曜日名を除去（例: "Monday: " → ""）
        let cleaned = text.replace(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday):\s*/i, '')
        
        if (language === 'ja') {
          // 日本語表記（例: "9時30分" → "09:30"）
          return cleaned
            .replace(/(\d+)時(\d+)分/g, (match, hour, minute) => {
              return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`
            })
            .replace(/(\d+)時/g, (match, hour) => {
              return `${hour.padStart(2, '0')}:00`
            })
        } else {
          // 英語表記: AM/PMを24時間形式に変換
          // 例: "7:00 AM" → "07:00", "8:00 PM" → "20:00"
          return cleaned
            .replace(/(\d{1,2}):(\d{2})\s*AM/gi, (match, hour, minute) => {
              const h = parseInt(hour, 10)
              const hour24 = h === 12 ? 0 : h // 12:00 AM = 00:00
              return `${hour24.toString().padStart(2, '0')}:${minute}`
            })
            .replace(/(\d{1,2}):(\d{2})\s*PM/gi, (match, hour, minute) => {
              const h = parseInt(hour, 10)
              const hour24 = h === 12 ? 12 : h + 12 // 12:00 PM = 12:00, 1:00 PM = 13:00
              return `${hour24.toString().padStart(2, '0')}:${minute}`
            })
        }
      }
      
      // 営業時間文字列を正規化
      const normalizedText = normalizeTimeText(todayText)
      
      // 複数の営業時間を分割（カンマ区切り）
      const timeRanges = normalizedText.split(',').map(range => range.trim())
      
      // 各時間範囲を解析
      const parsedRanges = timeRanges.map(range => {
        // コロン区切りの時間形式を解析（AM/PM変換後の24時間形式）
        // 例: "07:00 – 20:00" または "07:00-20:00"
        const timeMatch = range.match(/(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/)
        if (timeMatch) {
          return {
            open: `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`,
            close: `${timeMatch[3].padStart(2, '0')}:${timeMatch[4]}`
          }
        }
        return null
      }).filter((range): range is { open: string; close: string } => range !== null)
      
      // 現在時刻がどの営業時間内にあるかチェック
      isOpen = parsedRanges.some(range => 
        currentTime >= range.open && currentTime <= range.close
      )
      
      // 営業時間表示用文字列を生成
      if (parsedRanges.length > 0) {
        currentHours = parsedRanges.map(range => 
          `${range.open} - ${range.close}`
        ).join(', ')
      }
    }
  }
  
  return {
    isOpen,
    currentHours,
    openDays,
    weekdayText
  }
}

export default function POIDialog({ poiData, onClose, onAddToItinerary, availableDays, className = '' }: POIDialogProps) {
  const { user } = useAuth()
  const language = getUserLanguage(user)
  const [placeDetails, setPlaceDetails] = useState<any>(null)
  const [aggregatedData, setAggregatedData] = useState<AggregatedVenueData | null>(null)
  const [unifiedReviews, setUnifiedReviews] = useState<UnifiedReview[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDaySelector, setShowDaySelector] = useState(false)
  const [showAllHours, setShowAllHours] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [cachedImages, setCachedImages] = useState<CachedImageInfo[]>([])
  const [imageLoading, setImageLoading] = useState(false)
  const [popupPosition, setPopupPosition] = useState<'bottom' | 'top'>('bottom')
  const [showAllReviews, setShowAllReviews] = useState(false)
  const [showImageGallery, setShowImageGallery] = useState(false)
  const hoursRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)

  // 集約された価格レベルを計算（メモ化）
  const getAggregatedPriceLevel = useCallback((data: AggregatedVenueData | null): number | null => {
    if (!data) return null
    
    // Google Placesの価格レベル
    if (data.google?.price_level) {
      return data.google.price_level
    }
    
    // TripAdvisorの価格レベル（文字列 "$" - "$$$$"）
    if (data.tripAdvisor?.details?.price_level) {
      return data.tripAdvisor.details.price_level.length
    }
    
    // Foursquareの価格レベル（数値 1-4）
    if (data.foursquare?.details?.price) {
      return data.foursquare.details.price
    }
    
    return null
  }, [])

  // 価格レベルをメモ化
  const priceLevel = useMemo(() => getAggregatedPriceLevel(aggregatedData), [aggregatedData, getAggregatedPriceLevel])

  useEffect(() => {
    if (!poiData) return

    const fetchPlaceDetails = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // Itinerariesに保存されているplace_dataがある場合
        if (poiData.placeData) {
          // vicinityが存在する場合はそのまま使用
          if (poiData.placeData.vicinity) {
            logger.debug('✅ Using place_data with vicinity from Itinerary')
            setPlaceDetails(poiData.placeData)
            setLoading(false)
            return
          }
          
          // vicinityがない場合は古いデータなので、PlacesCacheから補完を試みる
          logger.debug('⚠️ place_data missing vicinity, checking PlacesCache...')
          const cachedData = await getCachedPlace(poiData.placeId)
          if (cachedData && cachedData.vicinity) {
            logger.debug('✅ Found vicinity in PlacesCache, merging data')
            setPlaceDetails({
              ...poiData.placeData,
              vicinity: cachedData.vicinity,
              business_status: cachedData.business_status,
              url: cachedData.url,
              icon: cachedData.icon
            })
            setLoading(false)
            return
          }
        }
        
        logger.debug('🔍 Checking PlacesCache for place_id:', poiData.placeId)
        
        // PlacesCacheを確認
        const cachedData = await getCachedPlace(poiData.placeId)
        if (cachedData) {
          logger.debug('✅ Found cached data:', cachedData.name)
          setPlaceDetails(cachedData)
          setLoading(false)
          return
        }
        
        logger.debug('❌ No cached data found, calling Google Places API...')
        
        // ユーザーの言語設定を取得してPlaces APIに渡す
        const language = getUserLanguage(user)
        
        // キャッシュにない場合はAPIを呼び出し
        const details = await placesApiHelpers.getPlaceDetails(poiData.placeId, language)
        setPlaceDetails(details)
        
        logger.debug('💾 Saving to PlacesCache...')
        
        // APIで取得したデータをキャッシュに保存（言語指定）
        await placesCacheManager.fetchAndCachePlace(poiData.placeId, language)
        
        logger.debug('✅ Data saved to PlacesCache')

        // 画像をキャッシュ（detailsを直接参照）
        if (details?.photos && details.photos.length > 0) {
          await cacheImages(details.photos)
        }

        // 外部API（TripAdvisor + Foursquare）からの追加情報を取得
        // サーバーサイドプロキシ経由で取得（CORS回避）
        logger.debug('🌐 Fetching external venue data via proxy...')
        try {
          const response = await fetch('/api/venue/aggregate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(details)
          })
          
          logger.debug('📡 Proxy response status:', response.status, response.statusText)
          
          if (response.ok) {
            const responseData = await response.json()
            logger.debug('📦 Received data from proxy:', {
              hasAggregatedData: !!responseData.aggregatedData,
              hasUnifiedReviews: !!responseData.unifiedReviews,
              tripAdvisorDetails: !!responseData.aggregatedData?.tripAdvisor?.details,
              foursquareDetails: !!responseData.aggregatedData?.foursquare?.details,
              reviewCount: responseData.unifiedReviews?.length || 0
            })
            
            const { aggregatedData: aggregated, unifiedReviews: reviews } = responseData
            setAggregatedData(aggregated)
            setUnifiedReviews(reviews)
            
            logger.debug('✅ External venue data loaded', {
              tripAdvisor: !!aggregated.tripAdvisor?.details,
              foursquare: !!aggregated.foursquare?.details,
              totalReviews: reviews.length,
              aggregatedRating: aggregated.aggregatedRating
            })
          } else {
            const errorText = await response.text()
            logger.warn('⚠️ Failed to fetch external venue data:', {
              status: response.status,
              statusText: response.statusText,
              error: errorText
            })
          }
        } catch (error) {
          logger.error('❌ Error fetching external venue data:', error)
        }
      } catch (err) {
        logger.error(t('poi.fetchDetailsError'), err)
        setError(t('poi.fetchError'))
        // エラーが発生した場合はダイアログを自動的に閉じる
        setTimeout(() => {
          onClose()
        }, 100)
      } finally {
        setLoading(false)
      }
    }

    const cacheImages = async (photos: any[]) => {
      if (!photos || photos.length === 0) return

      setImageLoading(true)
      try {
        const imagePromises = photos.map(async (photo) => {
          const googlePhotoUrl = placesApiHelpers.getPhotoUrl(photo.photo_reference, 300)
          return await getCachedPlaceImage(photo.photo_reference, googlePhotoUrl, {
            width: 300,
            height: 300,
            quality: 80
          })
        })

        const cachedImageResults = await Promise.all(imagePromises)
        setCachedImages(cachedImageResults)
        
        logger.debug('POIDialog: 画像キャッシュ完了', {
          total: cachedImageResults.length,
          cached: cachedImageResults.filter(img => img.cached).length,
          new: cachedImageResults.filter(img => !img.cached).length
        })
      } catch (error) {
        logger.error(t('poi.imageCacheError'), error)
      } finally {
        setImageLoading(false)
      }
    }

    fetchPlaceDetails()
  }, [poiData])

  if (!poiData) return null

  const handleAddToDay = (dayId: string) => {
    if (onAddToItinerary) {
      onAddToItinerary(poiData.placeId, dayId)
      setShowDaySelector(false)
    }
  }

  // ポップアップの表示位置を計算する関数
  const calculatePopupPosition = () => {
    if (!buttonRef.current) return 'bottom'

    const buttonRect = buttonRef.current.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const buttonBottom = buttonRect.bottom
    const estimatedPopupHeight = Math.min((availableDays?.length ?? 0) * 60 + 40, 300) // 最大300px

    // ボタンの下に十分なスペースがあるかチェック
    if (buttonBottom + estimatedPopupHeight < viewportHeight - 20) {
      return 'bottom'
    } else {
      return 'top'
    }
  }

  // ポップアップ表示時の位置調整
  const handleToggleDaySelector = () => {
    if (!showDaySelector) {
      const position = calculatePopupPosition()
      setPopupPosition(position)
    }
    setShowDaySelector(!showDaySelector)
  }

  // イメージギャラリーを開く
  const handleOpenImageGallery = () => {
    if (placeDetails?.photos && placeDetails.photos.length > 0) {
      setShowImageGallery(true)
    }
  }

  // イメージギャラリーを閉じる
  const handleCloseImageGallery = () => {
    setShowImageGallery(false)
  }

  // ユーザーの言語設定を取得
  const language = getUserLanguage(user)
  
  // 営業時間の解析（言語設定を渡す）
  const openingHoursInfo = parseOpeningHours(placeDetails?.opening_hours?.weekday_text, language)
  
  // 曜日ラベル（i18n対応、等幅フォント用の短縮形）
  const dayLabels = [
    t('poi.weekday.sundayShort', language),
    t('poi.weekday.mondayShort', language),
    t('poi.weekday.tuesdayShort', language),
    t('poi.weekday.wednesdayShort', language),
    t('poi.weekday.thursdayShort', language),
    t('poi.weekday.fridayShort', language),
    t('poi.weekday.saturdayShort', language)
  ]
  
  // ティアドロップマーカー（地図と同じスタイル）
  const TeardropMarker = ({ number }: { number?: number }) => (
    <div className="relative inline-block" style={{ width: '26px', height: '26px' }}>
      <div 
        className="absolute"
        style={{
          width: '26px',
          height: '26px',
          backgroundColor: '#006400',
          borderRadius: '50% 50% 50% 0',
          transform: 'rotate(-45deg)',
          boxShadow: '1px 1px 3px rgba(0, 0, 0, 0.4)'
        }}
      />
      {number !== undefined && (
        <div 
          className="absolute text-white font-bold text-xs"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          {number}
        </div>
      )}
    </div>
  )

  return (
    <div className={`absolute bottom-4 left-4 right-4 zidx-float-modal ${className}`}>
      <div className="bg-white border-t border-gray-200 shadow-lg rounded-t-lg w-full">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <div className="flex-shrink-0">
              <TeardropMarker number={poiData.orderNumber} />
            </div>
            <div className={`flex-1 min-w-0 ${!placeDetails?.vicinity ? 'flex items-center' : ''}`}>
              <div>
                <h3 className="text-xl font-bold text-gray-900 leading-tight">
                  {poiData.name}
                </h3>
                {placeDetails?.vicinity && (
                  <p className="text-sm text-gray-600 mt-0.5">
                    {placeDetails.vicinity}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-1 ml-2">
            {onAddToItinerary && availableDays && availableDays.length > 0 && (
              <div className="relative">
                <button
                  ref={buttonRef}
                  onClick={handleToggleDaySelector}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  aria-label={t('poi.addToItinerary')}
                  title={t('poi.addToItinerary')}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </button>
                {showDaySelector && (
                  <div 
                    ref={popupRef}
                    className={`absolute right-0 bg-white border border-gray-200 rounded-lg shadow-lg zidx-float-modal-content min-w-[200px] max-h-[300px] overflow-y-auto scrollbar-hide ${
                      popupPosition === 'bottom' 
                        ? 'top-full mt-1' 
                        : 'bottom-full mb-1'
                    }`}
                  >
                    <div className="p-2">
                      <div className="text-xs font-medium text-gray-500 px-2 py-1 sticky top-0 bg-white border-b border-gray-100">
                        {t('poi.daySelector.title')}
                      </div>
                      <div className="max-h-[240px] overflow-y-auto scrollbar-hide">
                        {availableDays.map((day) => (
                          <button
                            key={day.id}
                            onClick={() => handleAddToDay(day.id)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 rounded transition-colors"
                          >
                            <div className="font-medium text-gray-900">{day.date}</div>
                            {day.title && (
                              <div className="text-xs text-gray-600">{day.title}</div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label={t('common.close')}
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* コンテンツ */}
        <div className="p-3 max-h-80 overflow-y-auto scrollbar-hide rounded-b-lg">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-sm text-gray-600">{t('poi.loadingInfo')}</span>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <div className="text-red-500 text-sm">{t('poi.errorMessage')}</div>
            </div>
          )}

          {placeDetails && (
            <div className="flex gap-3">
              {/* メインコンテンツ（8割） */}
              <div className="flex-1 space-y-3 text-sm">
                {/* 価格帯と評価 */}
                <div className="flex items-center flex-wrap gap-3">
                  {/* 統合された評価情報 */}
                  {aggregatedData?.aggregatedRating ? (
                    <div className="flex items-center space-x-1.5">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < Math.floor(aggregatedData.aggregatedRating!.averageRating)
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
                      <span className="text-gray-700 font-medium">
                        {aggregatedData.aggregatedRating.averageRating.toFixed(1)}
                      </span>
                      <span className="text-gray-500 text-xs">
                        ({t('poi.reviewCount', language).replace('{count}', aggregatedData.aggregatedRating.totalReviews.toLocaleString())})
                      </span>
                      <div className="flex items-center gap-1 ml-1">
                        {aggregatedData.aggregatedRating.sources.map((source, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600"
                            title={`${source.source}: ${source.rating} ${t('poi.reviewCount', language).replace('{count}', source.reviewCount.toString())}`}
                          >
                            {source.source === 'google' && (
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M3.5 6.5l5.4-2.1 5.2 2.1 5.4-2.1v12.9l-5.4 2.1-5.2-2.1-5.4 2.1V6.5z" />
                                <path d="M8.9 4.4v12.9" />
                                <path d="M14.1 6.5v12.9" />
                              </svg>
                            )}
                            {source.source === 'tripadvisor' && '🦉'}
                            {source.source === 'foursquare' && (
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                                <circle cx="12" cy="9" r="2" fill="currentColor" />
                              </svg>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : placeDetails.rating && (
                    <div className="flex items-center space-x-1.5">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-3.5 h-3.5 ${
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
                      <span className="text-gray-700 font-medium">
                        {placeDetails.rating}
                      </span>
                      {placeDetails.user_ratings_total && (
                        <span className="text-gray-500 text-xs">
                          ({placeDetails.user_ratings_total.toLocaleString()})
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* 統合された価格情報 */}
                  {priceLevel && (
                    <span className="text-gray-700 font-medium">
                      {'¥'.repeat(priceLevel)}
                    </span>
                  )}
                </div>

                {/* 概要（Editorial Summary） */}
                {placeDetails.editorial_summary?.overview && (
                  <p className="text-gray-700 leading-relaxed">
                    {placeDetails.editorial_summary.overview}
                  </p>
                )}

                {/* 営業時間 */}
                {openingHoursInfo && (
                  <div className="relative">
                    <div 
                      className="flex items-center space-x-2 text-xs cursor-pointer"
                      onMouseEnter={() => setShowAllHours(true)}
                      onMouseLeave={() => setShowAllHours(false)}
                    >
                      <span className={openingHoursInfo.isOpen ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                        {openingHoursInfo.isOpen ? t('poi.openingHours.open', language) : t('poi.openingHours.closed', language)}
                      </span>
                      {openingHoursInfo.currentHours && (
                        <span className="text-gray-600">{openingHoursInfo.currentHours}</span>
                      )}
                      <span className="text-gray-400">|</span>
                      <div className="flex space-x-1 font-mono text-xs">
                        {dayLabels.map((day, index) => {
                          // Google APIは月曜始まりなので、インデックスを調整
                          const apiIndex = index === 0 ? 6 : index - 1
                          const isOpen = openingHoursInfo.openDays[apiIndex]
                          return (
                            <span
                              key={index}
                              className={`${isOpen ? 'text-gray-700' : 'text-gray-300'}`}
                            >
                              {day}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                    
                    {/* ホバー時に全営業時間を表示 */}
                    {showAllHours && (
                      <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg p-2 zidx-float-modal-content min-w-[200px] z-50">
                        <div className="space-y-0.5 text-xs text-gray-700">
                          {openingHoursInfo.weekdayText.map((day: string, index: number) => (
                            <div key={index}>{day}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 営業状況（business_status） */}
                {placeDetails.business_status && placeDetails.business_status !== 'OPERATIONAL' && (
                  <div className="flex items-center space-x-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                    <svg className="w-3.5 h-3.5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-yellow-800">
                      {placeDetails.business_status === 'CLOSED_TEMPORARILY' && t('poi.businessStatus.temporarilyClosed', language)}
                      {placeDetails.business_status === 'CLOSED_PERMANENTLY' && t('poi.businessStatus.permanentlyClosed', language)}
                    </span>
                  </div>
                )}

                {/* 統合レビュー（Google + TripAdvisor + Foursquare） */}
                {unifiedReviews.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-gray-700">{t('poi.reviewsAndTips')}</h4>
                      {unifiedReviews.length > 3 && (
                        <button
                          onClick={() => setShowAllReviews(!showAllReviews)}
                          className="text-xs text-blue-600 hover:text-blue-700"
                        >
                          {showAllReviews ? t('poi.showPartial') : t('poi.showAll').replace('{count}', unifiedReviews.length.toString())}
                        </button>
                      )}
                    </div>
                    {(showAllReviews ? unifiedReviews : unifiedReviews.slice(0, 3)).map((review) => (
                      <div key={review.id} className="text-xs border-l-2 border-gray-200 pl-2">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-gray-900">{review.author}</span>
                            <span className="text-xs text-gray-400">
                              {review.source === 'google' && (
                                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <path d="M3.5 6.5l5.4-2.1 5.2 2.1 5.4-2.1v12.9l-5.4 2.1-5.2-2.1-5.4 2.1V6.5z" />
                                  <path d="M8.9 4.4v12.9" />
                                  <path d="M14.1 6.5v12.9" />
                                </svg>
                              )}
                              {review.source === 'tripadvisor' && '🦉'}
                              {review.source === 'foursquare' && (
                                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                                  <circle cx="12" cy="9" r="2" fill="currentColor" />
                                </svg>
                              )}
                            </span>
                          </div>
                          {review.rating && (
                            <div className="flex items-center space-x-0.5">
                              <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <span className="text-gray-600">{review.rating}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-gray-700 line-clamp-2 leading-relaxed">{review.text}</p>
                        {review.helpful_votes && review.helpful_votes > 0 && (
                          <div className="mt-1 text-xs text-gray-500">
                            👍 {t('poi.helpfulVotes').replace('{count}', review.helpful_votes.toString())}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* カテゴリ */}
                {placeDetails.types && placeDetails.types.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {placeDetails.types
                      .filter((type: string) => type !== 'point_of_interest') // point_of_interestを除外
                      .slice(0, 5)
                      .map((type: string, index: number) => (
                      <span
                        key={index}
                        className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                      >
                        {type.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                )}

                {/* 連絡先 */}
                <div className="flex flex-wrap gap-3">
                  {placeDetails.formatted_phone_number && (
                    <Button
                      variant="outline"
                      size="md"
                      leftIcon={(
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.12.9.3 1.77.54 2.61a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.47-1.07a2 2 0 012.11-.45c.84.24 1.71.42 2.61.54A2 2 0 0122 16.92z" />
                        </svg>
                      )}
                      onClick={() => window.open(`tel:${placeDetails.formatted_phone_number}`, '_self')}
                    >
                      {placeDetails.formatted_phone_number}
                    </Button>
                  )}
                  {placeDetails.website && (
                    <Button
                      variant="outline"
                      size="md"
                      leftIcon={(
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M2 12h20" />
                          <path d="M12 2a15.3 15.3 0 010 20" />
                          <path d="M12 2a15.3 15.3 0 000 20" />
                        </svg>
                      )}
                      onClick={() => window.open(placeDetails.website, '_blank', 'noopener,noreferrer')}
                      >
                      {t('poi.website')}
                    </Button>
                  )}
                  {placeDetails.url && (
                    <Button
                      variant="outline"
                      size="md"
                      leftIcon={(
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M3.5 6.5l5.4-2.1 5.2 2.1 5.4-2.1v12.9l-5.4 2.1-5.2-2.1-5.4 2.1V6.5z" />
                          <path d="M8.9 4.4v12.9" />
                          <path d="M14.1 6.5v12.9" />
                        </svg>
                      )}
                      onClick={() => window.open(placeDetails.url, '_blank', 'noopener,noreferrer')}
                    >
                      Google Maps
                    </Button>
                  )}
                </div>
              </div>

              {/* 画像エリア（2割） */}
              {placeDetails.photos && placeDetails.photos.length > 0 && (
                <div className="w-32 flex-shrink-0">
                  <div 
                    className="relative aspect-square bg-gray-200 rounded overflow-hidden cursor-pointer group hover:opacity-90 transition-opacity"
                    onClick={handleOpenImageGallery}
                  >
                    {cachedImages[currentPhotoIndex] ? (
                      <Image
                        src={cachedImages[currentPhotoIndex].url}
                        alt={t('poi.photoOf').replace('{name}', poiData.name)}
                        width={128}
                        height={128}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // キャッシュされた画像が読み込めない場合は、元のGoogle Photo URLにフォールバック
                          const target = e.target as HTMLImageElement
                          target.src = placesApiHelpers.getPhotoUrl(placeDetails.photos[currentPhotoIndex].photo_reference, 300)
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {imageLoading ? (
                          <div className="text-gray-500 text-xs">{t('poi.loading')}</div>
                        ) : (
                          <Image
                            src={placesApiHelpers.getPhotoUrl(placeDetails.photos[currentPhotoIndex].photo_reference, 300)}
                            alt={t('poi.photoOf').replace('{name}', poiData.name)}
                            width={128}
                            height={128}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    )}
                    {placeDetails.photos.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        {t('gallery.photoCount', language).replace('{count}', (placeDetails.photos.length - 1).toString())}
                      </div>
                    )}
                    {/* キャッシュ状態インジケーター */}
                    {cachedImages[currentPhotoIndex]?.cached && (
                      <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                        {t('poi.cached')}
                      </div>
                    )}
                    {/* クリック可能インジケーター */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-6 h-6 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* イメージギャラリーモーダル */}
      {placeDetails?.photos && placeDetails.photos.length > 0 && (
        <ImageGalleryModal
          isOpen={showImageGallery}
          onClose={handleCloseImageGallery}
          images={placeDetails.photos}
          placeName={poiData.name}
          initialIndex={currentPhotoIndex}
        />
      )}
    </div>
  )
}