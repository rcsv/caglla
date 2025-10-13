'use client'
import logger from '@/lib/core/logger'

import { useState, useEffect, useRef } from 'react'
import { placesApiHelpers } from '@/lib/api/google/places'
import { getCachedPlace, placesCacheManager } from '@/lib/travel/places-cache'
import { Button } from '@/components/common/Button'
import { getCachedPlaceImage, CachedImageInfo } from '@/lib/storage/image-cache'

interface POIDialogProps {
  poiData: {
    placeId: string
    name: string
    location: {
      lat: number
      lng: number
    }
    placeData?: any // Itinerariesに保存されているplace_data
    orderNumber?: number // マップピン番号
  } | null
  onClose: () => void
  onAddToItinerary?: (placeId: string, dayId: string) => void
  availableDays?: Array<{ id: string; date: string; title?: string }>
  className?: string
}

// 営業時間を解析する関数
function parseOpeningHours(weekdayText: string[] | undefined) {
  if (!weekdayText || weekdayText.length === 0) {
    return null
  }

  const now = new Date()
  const today = now.getDay() // 0=日曜日, 1=月曜日, ..., 6=土曜日
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  
  // 曜日のマッピング（Google APIは月曜始まり）
  const dayIndexMap = [6, 0, 1, 2, 3, 4, 5] // [日, 月, 火, 水, 木, 金, 土]
  const todayText = weekdayText[dayIndexMap[today]]
  
  // 営業日を判定
  const openDays = weekdayText.map(text => {
    return !text.includes('定休日') && !text.includes('休業日') && !text.includes('closed')
  })
  
  // 今日の営業時間を解析
  let isOpen = false
  let currentHours = ''
  
  if (todayText) {
    // 24時間営業のチェック
    if (todayText.includes('24 時間営業') || todayText.includes('24時間営業')) {
      isOpen = true
      currentHours = '24時間営業'
    } else if (todayText.includes('定休日') || todayText.includes('休業日') || todayText.includes('closed')) {
      isOpen = false
      currentHours = '定休日'
    } else {
      // 日本語表記を数値表記に変換する関数
      const convertJapaneseTime = (timeStr: string): string => {
        return timeStr
          .replace(/(\d+)時(\d+)分/g, (match, hour, minute) => {
            return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`
          })
          .replace(/(\d+)時/g, (match, hour) => {
            return `${hour.padStart(2, '0')}:00`
          })
      }
      
      // 営業時間文字列を正規化
      const normalizedText = convertJapaneseTime(todayText)
      
      // 複数の営業時間を分割（カンマ区切り）
      const timeRanges = normalizedText.split(',').map(range => range.trim())
      
      // 各時間範囲を解析
      const parsedRanges = timeRanges.map(range => {
        // コロン区切りの時間形式を解析
        const timeMatch = range.match(/(\d{1,2}):(\d{2}).*?(\d{1,2}):(\d{2})/)
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
  const [placeDetails, setPlaceDetails] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDaySelector, setShowDaySelector] = useState(false)
  const [showAllHours, setShowAllHours] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [cachedImages, setCachedImages] = useState<CachedImageInfo[]>([])
  const [imageLoading, setImageLoading] = useState(false)
  const [popupPosition, setPopupPosition] = useState<'bottom' | 'top'>('bottom')
  const hoursRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)

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
        
        // キャッシュにない場合はAPIを呼び出し
        const details = await placesApiHelpers.getPlaceDetails(poiData.placeId)
        setPlaceDetails(details)
        
        logger.debug('💾 Saving to PlacesCache...')
        
        // APIで取得したデータをキャッシュに保存
        await placesCacheManager.fetchAndCachePlace(poiData.placeId)
        
        logger.debug('✅ Data saved to PlacesCache')

        // 画像をキャッシュ（detailsを直接参照）
        if (details?.photos && details.photos.length > 0) {
          await cacheImages(details.photos)
        }
      } catch (err) {
        logger.error('POI詳細情報の取得に失敗しました:', err)
        setError('POI情報の取得に失敗しました')
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
        logger.error('POIDialog: 画像キャッシュに失敗しました:', error)
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

  // 営業時間の解析
  const openingHoursInfo = parseOpeningHours(placeDetails?.opening_hours?.weekday_text)
  
  // 曜日ラベル
  const dayLabels = ['日', '月', '火', '水', '木', '金', '土']
  
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
                  aria-label="旅程に追加"
                  title="旅程に追加"
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
                        追加する日を選択
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
              aria-label="閉じる"
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
              <span className="ml-2 text-sm text-gray-600">POI情報を読み込み中...</span>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <div className="text-red-500 text-sm">POI情報を取得中にエラーが発生しました</div>
            </div>
          )}

          {placeDetails && (
            <div className="flex gap-3">
              {/* メインコンテンツ（8割） */}
              <div className="flex-1 space-y-3 text-sm">
                {/* 価格帯と評価 */}
                <div className="flex items-center flex-wrap gap-3">
                  {placeDetails.price_level !== undefined && placeDetails.price_level >= 0 && placeDetails.price_level <= 4 && (
                    <span className="text-gray-700 font-medium">
                      {'¥'.repeat(placeDetails.price_level)}
                    </span>
                  )}
                  {placeDetails.rating && (
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
                        {openingHoursInfo.isOpen ? '営業中' : '営業時間外'}
                      </span>
                      {openingHoursInfo.currentHours && (
                        <span className="text-gray-600">{openingHoursInfo.currentHours}</span>
                      )}
                      <span className="text-gray-400">|</span>
                      <div className="flex space-x-1">
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
                      {placeDetails.business_status === 'CLOSED_TEMPORARILY' && '一時休業中'}
                      {placeDetails.business_status === 'CLOSED_PERMANENTLY' && '閉業'}
                    </span>
                  </div>
                )}

                {/* レビュー */}
                {placeDetails.reviews && placeDetails.reviews.length > 0 && (
                  <div className="space-y-2">
                    {placeDetails.reviews.slice(0, 2).map((review: any, index: number) => (
                      <div key={index} className="text-xs border-l-2 border-gray-200 pl-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-900">{review.author_name}</span>
                          <div className="flex items-center space-x-0.5">
                            <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="text-gray-600">{review.rating}</span>
                          </div>
                        </div>
                        <p className="text-gray-700 line-clamp-2 leading-relaxed">{review.text}</p>
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
                      leftIcon={<span>📞</span>}
                      onClick={() => window.open(`tel:${placeDetails.formatted_phone_number}`, '_self')}
                    >
                      {placeDetails.formatted_phone_number}
                    </Button>
                  )}
                  {placeDetails.website && (
                    <Button
                      variant="outline"
                      size="md"
                      leftIcon={<span>🌐</span>}
                      onClick={() => window.open(placeDetails.website, '_blank', 'noopener,noreferrer')}
                    >
                      ウェブサイト
                    </Button>
                  )}
                  {placeDetails.url && (
                    <Button
                      variant="outline"
                      size="md"
                      leftIcon={<span>🗺️</span>}
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
                  <div className="relative aspect-square bg-gray-200 rounded overflow-hidden cursor-pointer group">
                    {cachedImages[currentPhotoIndex] ? (
                      <img
                        src={cachedImages[currentPhotoIndex].url}
                        alt={`${poiData.name}の写真`}
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
                          <div className="text-gray-500 text-xs">読み込み中...</div>
                        ) : (
                          <img
                            src={placesApiHelpers.getPhotoUrl(placeDetails.photos[currentPhotoIndex].photo_reference, 300)}
                            alt={`${poiData.name}の写真`}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    )}
                    {placeDetails.photos.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        +{placeDetails.photos.length - 1}枚
                      </div>
                    )}
                    {/* キャッシュ状態インジケーター */}
                    {cachedImages[currentPhotoIndex]?.cached && (
                      <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                        キャッシュ
                      </div>
                    )}
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