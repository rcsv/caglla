'use client'
import logger from '@/lib/core/logger'

import { useState, useEffect, useRef } from 'react'
import { placesApiHelpers } from '@/lib/api/google/places'
import { PlaceData, Itinerary, ActivityTag, ReservationInfo, Day } from '@/lib/core/types'
import { timezoneUtils } from '@/lib/utils/timezone'
import { currencyUtils } from '@/lib/utils/currency'
import { getZIndexClass } from '@/lib/core/z-index'
import { getCachedPlaceImage, CachedImageInfo } from '@/lib/storage/image-cache'
import { getReservationTypeIcon, generateReservationSummary } from '@/lib/utils/reservation-utils'
import VenueDistance from './VenueDistance'
import ActivityTagSelector from './ActivityTagSelector'
import { IconRenderer } from '../common/icons/IconRenderer'
import ReservationInfoModal from '../modals/ReservationInfoModal'
import { TIMEZONE_OPTIONS } from '@/lib/data/timezone-options'
import { isValidTimeFormat, formatTimeForDisplay } from '@/lib/utils/time-validation'
import { isValidAmount } from '@/lib/utils/amount-validation'
import { useClickOutside } from '@/hooks/useClickOutside'
import { DragHandle } from '../common/DragHandle'
import { TeardropMarker } from '../common/TeardropMarker'
import { useItineraryEditor } from '@/hooks/useItineraryEditor'
import { ScheduleCardMenu } from './ScheduleCardMenu'

interface ScheduleCardProps {
  itinerary: Itinerary
  displayNumber?: number
  previousPlace?: PlaceData | null
  nextPlace?: PlaceData | null
  onUpdate?: (updatedItinerary: any) => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  onMoveToDay?: (itineraryId: string, targetDayId: string) => void
  onDuplicateToDay?: (itineraryId: string, targetDayId: string) => void
  onDelete?: (itineraryId: string) => void
  onItineraryClick?: (itineraryId: string) => void
  availableDays?: Day[]
  dragHandleProps?: {
    attributes: any
    listeners: any
  }
  isDragging?: boolean
  isSelected?: boolean
  isFirst?: boolean
  isLast?: boolean
}

export default function ScheduleCard({ 
  itinerary, 
  displayNumber,
  previousPlace,
  nextPlace,
  onUpdate, 
  onMoveUp, 
  onMoveDown, 
  onMoveToDay, 
  onDuplicateToDay,
  onDelete,
  onItineraryClick,
  availableDays = [],
  dragHandleProps,
  isDragging = false,
  isSelected = false,
  isFirst = false,
  isLast = false
}: ScheduleCardProps) {
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [description, setDescription] = useState(itinerary.description || '')
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [title, setTitle] = useState(itinerary.title || '')
  const [startTime, setStartTime] = useState(itinerary.start_time || '')
  const [endTime, setEndTime] = useState(itinerary.end_time || '')
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditingTime, setIsEditingTime] = useState(false)
  const [tempStartTime, setTempStartTime] = useState(itinerary.start_time || '')
  const [tempEndTime, setTempEndTime] = useState(itinerary.end_time || '')
  const [destinationTimezone, setDestinationTimezone] = useState('UTC')
  const [isEditingCost, setIsEditingCost] = useState(false)
  const [tempCostAmount, setTempCostAmount] = useState(itinerary.cost_amount?.toString() || '')
  const [tempCostCurrency, setTempCostCurrency] = useState(itinerary.cost_currency || 'JPY')
  const descriptionRef = useRef<HTMLTextAreaElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const [cachedImage, setCachedImage] = useState<CachedImageInfo | null>(null)
  const [imageLoading, setImageLoading] = useState(false)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [showReservationModal, setShowReservationModal] = useState(false)

  // useItineraryEditorフックを使用
  const { updateField, updateFields, isSaving } = useItineraryEditor(itinerary, onUpdate)

  useEffect(() => {
    setTitle(itinerary.title || '')
    setStartTime(itinerary.start_time || '')
    setEndTime(itinerary.end_time || '')
    setTempStartTime(itinerary.start_time || '')
    setTempEndTime(itinerary.end_time || '')
    if (itinerary.timezone) {
      setDestinationTimezone(itinerary.timezone)
    } else {
      setDestinationTimezone('UTC')
    }
    if (itinerary.place_data?.editorial_summary?.overview && !itinerary.description) {
      setDescription(itinerary.place_data.editorial_summary.overview)
    } else {
      setDescription(itinerary.description || '')
    }
  }, [itinerary.id, itinerary.title, itinerary.start_time, itinerary.end_time, itinerary.description, itinerary.place_data?.editorial_summary?.overview, itinerary.timezone])

  useEffect(() => {
    if (itinerary.place_data) {
      const detectedTimezone = timezoneUtils.getTimezoneFromPlace(itinerary.place_data)
      if (detectedTimezone !== 'UTC') {
        setDestinationTimezone(detectedTimezone)
        handleTimezoneUpdate(detectedTimezone)
      }
    }
  }, [itinerary.place_data?.place_id])

  useEffect(() => {
    if (itinerary.place_data && !itinerary.cost_currency) {
      const detectedCurrency = currencyUtils.getCurrencyFromPlace(itinerary.place_data)
      if (detectedCurrency !== 'JPY') {
        setTempCostCurrency(detectedCurrency)
      }
    }
  }, [itinerary.place_data?.place_id, itinerary.cost_currency])

  useEffect(() => {
    const loadImage = async () => {
      if (itinerary.place_data?.photos && itinerary.place_data.photos.length > 0) {
        const photoReference = itinerary.place_data.photos[0].photo_reference
        const googlePhotoUrl = placesApiHelpers.getPhotoUrl(photoReference, 800)
        try {
          setImageLoading(true)
          const cachedImageResult = await getCachedPlaceImage(photoReference, googlePhotoUrl, {
            width: 800,
            height: 600,
            quality: 85
          })
          setCachedImage(cachedImageResult)
          setPhotoUrl(cachedImageResult.url)
          logger.debug('  Cached image result:', cachedImageResult)
        } catch (error) {
          logger.error('  Failed to get cached image:', error)
          setPhotoUrl(googlePhotoUrl)
        } finally {
          setImageLoading(false)
        }
      } else {
        setPhotoUrl(null)
        setCachedImage(null)
      }
    }
    loadImage()
  }, [itinerary.place_data?.photos])


  const handleReservationSave = async (reservation: ReservationInfo) => {
    const result = await updateField('reservation', reservation)
    if (result.success) {
      logger.info('予約情報を保存しました:', reservation)
    } else if (result.error !== 'aborted') {
      logger.error('予約情報の保存に失敗しました')
      throw new Error('予約情報の保存に失敗しました')
    }
  }

  const handleTimezoneUpdate = async (timezone: string) => {
    await updateField('timezone', timezone)
  }

  const handleTimeEditStart = () => {
    setTempStartTime(startTime)
    setTempEndTime(endTime)
    setIsEditingTime(true)
  }

  const handleTimeSave = async () => {
    const result = await updateFields({
      start_time: tempStartTime,
      end_time: tempEndTime,
      timezone: destinationTimezone
    })
    if (result.success) {
      setStartTime(tempStartTime)
      setEndTime(tempEndTime)
      setIsEditingTime(false)
    } else if (result.error !== 'aborted') {
      logger.error('Failed to update time')
      alert('時間の更新に失敗しました')
    }
  }

  const handleTimeCancel = () => {
    setTempStartTime(startTime)
    setTempEndTime(endTime)
    setIsEditingTime(false)
  }

  const handleCostEditStart = () => {
    setTempCostAmount(itinerary.cost_amount?.toString() || '')
    setTempCostCurrency(itinerary.cost_currency || 'JPY')
    setIsEditingCost(true)
  }

  const handleCostSave = async () => {
    const costAmount = tempCostAmount ? parseFloat(tempCostAmount) : undefined
    const result = await updateFields({
      cost_amount: costAmount,
      cost_currency: tempCostCurrency
    })
    if (result.success) {
      setIsEditingCost(false)
    } else if (result.error !== 'aborted') {
      logger.error('Failed to update cost')
      alert('費用の更新に失敗しました')
    }
  }

  const handleCostCancel = () => {
    setTempCostAmount(itinerary.cost_amount?.toString() || '')
    setTempCostCurrency(itinerary.cost_currency || 'JPY')
    setIsEditingCost(false)
  }

  const MAX_CHARS = 150
  const shouldTruncate = description.length > MAX_CHARS
  const displayText = shouldTruncate && !isExpanded 
    ? description.substring(0, MAX_CHARS) + '...'
    : description

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <div 
      className="relative overflow-visible"
      id={`itinerary-${itinerary.id}`}
    >
      <div 
        className="flex items-start space-x-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
        onClick={() => onItineraryClick?.(itinerary.id)}
      >
        {/* ドラッグハンドル（アイコンのみ） */}
        {dragHandleProps && (
          <DragHandle {...dragHandleProps} isDragging={isDragging} />
        )}

        {/* ソート番号（ティアドロップ形状） */}
        <TeardropMarker 
          number={displayNumber || itinerary.sort_number} 
          isSelected={isSelected}
        />

        {/* カード本体 */}
        <div className={`flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${isSelected ? 'ring-2 ring-red-500 ring-opacity-50' : ''}`}>
          <div className="flex">
            {/* 左側: 画像（16:9アスペクト比） */}
            <div className="flex-shrink-0 w-32 h-18 relative">
              {photoUrl ? (
                <>
                  <img
                    src={photoUrl}
                    alt={itinerary.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      logger.error('❌ Image load error for:', itinerary.title, photoUrl)
                      if (cachedImage?.cached && itinerary.place_data?.photos?.[0]?.photo_reference) {
                        const target = e.target as HTMLImageElement
                        const googlePhotoUrl = placesApiHelpers.getPhotoUrl(itinerary.place_data.photos[0].photo_reference, 800)
                        target.src = googlePhotoUrl
                      } else {
                        ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                      }
                    }}
                    onLoad={() => {
                      logger.debug('✅ Image loaded successfully for:', itinerary.title)
                    }}
                  />
                  {cachedImage?.cached && (
                    <div className="absolute top-1 right-1 bg-green-500 text-white text-xs px-1 py-0.5 rounded-full opacity-75">
                      C
                    </div>
                  )}
                  {imageLoading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="text-white text-xs">読み込み中...</div>
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  {imageLoading ? (
                    <div className="text-gray-500 text-xs">読み込み中...</div>
                  ) : (
                    <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              )}
            </div>

            {/* 中央: メインコンテンツ */}
            <div className="flex-1 p-4 min-w-0">
              {/* タイトルとStar Rating */}
              <div className="flex items-center space-x-2 mb-3">
                {isEditingTitle ? (
                  <input
                    ref={titleRef}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="font-semibold text-gray-900 text-lg bg-transparent border-b-2 border-blue-500 focus:outline-none focus:border-blue-600 flex-1"
                    autoFocus
                    onBlur={async () => {
                      if (title !== itinerary.title) {
                        await updateField('title', title)
                      }
                      setIsEditingTitle(false)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        ;(e.target as HTMLInputElement).blur()
                      } else if (e.key === 'Escape') {
                        setTitle(itinerary.title || '')
                        setIsEditingTitle(false)
                      }
                    }}
                  />
                ) : (
                  <h4 
                    className="font-semibold text-gray-900 text-lg cursor-pointer hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                    onClick={() => setIsEditingTitle(true)}
                  >
                    {itinerary.title}
                  </h4>
                )}
                {itinerary.place_data?.rating && (
                  <div className="flex items-center">
                    <span className="text-yellow-400 mr-1">★</span>
                    <span className="text-sm text-gray-600">{itinerary.place_data.rating}</span>
                  </div>
                )}
              </div>

              {/* メモエリア */}
              <div className="mb-4">
                {isEditingDescription ? (
                  <textarea
                    ref={descriptionRef}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Memo:"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={2}
                    autoFocus
                    onBlur={async () => {
                      if (description !== itinerary.description) {
                        await updateField('description', description)
                      }
                      setIsEditingDescription(false)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.ctrlKey) {
                        ;(e.target as HTMLTextAreaElement).blur()
                      } else if (e.key === 'Escape') {
                        setDescription(itinerary.description || '')
                        setIsEditingDescription(false)
                      }
                    }}
                  />
                ) : (
                  <div
                    onClick={() => setIsEditingDescription(true)}
                    className="cursor-pointer text-sm text-gray-700 hover:bg-gray-50 p-2 rounded border border-transparent hover:border-gray-200 min-h-[2.5rem]"
                  >
                    {description ? (
                      <div>
                        <div className="whitespace-pre-wrap">{displayText}</div>
                        {shouldTruncate && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleExpanded()
                            }}
                            className="text-blue-600 hover:text-blue-800 underline text-xs mt-1"
                          >
                            {isExpanded ? '折りたたむ' : '続きを読む'}
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">
                        {itinerary.place_data?.editorial_summary?.overview 
                          ? 'Memo: 場所の説明が表示されています。クリックして編集できます。' 
                          : 'Memo: メモを追加してください'
                        }
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* 時間・費用・予約を1行にインラインで配置 */}
              <div className="mb-4 p-2">
                {isEditingTime ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium text-gray-700">開始時間:</label>
                      <input
                        type="time"
                        value={tempStartTime}
                        onChange={(e) => setTempStartTime(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleTimeSave()
                          } else if (e.key === 'Escape') {
                            handleTimeCancel()
                          }
                        }}
                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        autoFocus
                      />
                      <label className="text-sm font-medium text-gray-700">終了時間:</label>
                      <input
                        type="time"
                        value={tempEndTime}
                        onChange={(e) => setTempEndTime(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleTimeSave()
                          } else if (e.key === 'Escape') {
                            handleTimeCancel()
                          }
                        }}
                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium text-gray-700">タイムゾーン:</label>
                      <select
                        value={destinationTimezone}
                        onChange={(e) => {
                          setDestinationTimezone(e.target.value)
                          handleTimezoneUpdate(e.target.value)
                        }}
                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {TIMEZONE_OPTIONS.map((tz) => (
                          <option key={tz.value} value={tz.value}>{tz.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleTimeSave}
                        disabled={isSaving || !isValidTimeFormat(tempStartTime) || !isValidTimeFormat(tempEndTime)}
                        className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        {isSaving ? '保存中...' : '保存'}
                      </button>
                      <button
                        onClick={handleTimeCancel}
                        disabled={isSaving}
                        className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        キャンセル
                      </button>
                    </div>
                    {(!isValidTimeFormat(tempStartTime) || !isValidTimeFormat(tempEndTime)) && (
                      <p className="text-xs text-red-500">正しい時間形式で入力してください (例: 16:00)</p>
                    )}
                    <p className="text-xs text-gray-400">Enterで保存、Escapeでキャンセル</p>
                  </div>
                ) : isEditingCost ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium text-gray-700">金額:</label>
                      <input
                        type="number"
                        value={tempCostAmount}
                        onChange={(e) => setTempCostAmount(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleCostSave()
                          } else if (e.key === 'Escape') {
                            handleCostCancel()
                          }
                        }}
                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent w-24"
                        placeholder="0"
                        min="0"
                        step="0.01"
                        autoFocus
                      />
                      <label className="text-sm font-medium text-gray-700">通貨:</label>
                      <select
                        value={tempCostCurrency}
                        onChange={(e) => setTempCostCurrency(e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        {currencyUtils.getAvailableCurrencies().map((currency) => (
                          <option key={currency.code} value={currency.code}>
                            {currency.code} ({currency.name})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleCostSave}
                        disabled={isSaving || !isValidAmount(tempCostAmount)}
                        className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        {isSaving ? '保存中...' : '保存'}
                      </button>
                      <button
                        onClick={handleCostCancel}
                        disabled={isSaving}
                        className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        キャンセル
                      </button>
                    </div>
                    {!isValidAmount(tempCostAmount) && (
                      <p className="text-xs text-red-500">正しい金額を入力してください</p>
                    )}
                    <p className="text-xs text-gray-400">Enterで保存、Escapeでキャンセル</p>
                  </div>
                ) : (
                  <div className="flex items-center space-x-4">
                    {/* 時間要素 */}
                    <div className="flex items-center space-x-1">
                      <IconRenderer iconName="clock" className="w-4 h-4" color="#3B82F6" />
                      {startTime || endTime ? (
                        <span 
                          className="text-sm text-gray-600 cursor-pointer hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                          onClick={handleTimeEditStart}
                        >
                          {formatTimeForDisplay(startTime)} - {formatTimeForDisplay(endTime)}
                        </span>
                      ) : (
                        <span 
                          className="text-sm text-gray-500 cursor-pointer hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                          onClick={handleTimeEditStart}
                        >
                          時間
                        </span>
                      )}
                    </div>

                    {/* 費用要素 */}
                    <div className="flex items-center space-x-1">
                      <IconRenderer iconName="money" className="w-4 h-4" color="#10B981" />
                      {itinerary.cost_amount ? (
                        <span 
                          className="text-sm text-gray-600 cursor-pointer hover:text-green-600 hover:bg-green-50 px-2 py-1 rounded transition-colors"
                          onClick={handleCostEditStart}
                        >
                          {currencyUtils.formatAmount(itinerary.cost_amount, itinerary.cost_currency || 'JPY')}
                        </span>
                      ) : (
                        <span 
                          className="text-sm text-gray-500 cursor-pointer hover:text-green-600 hover:bg-green-50 px-2 py-1 rounded transition-colors"
                          onClick={handleCostEditStart}
                        >
                          費用
                        </span>
                      )}
                    </div>

                    {/* 予約要素 */}
                    <div className="flex items-center space-x-1">
                      <IconRenderer iconName="reservation" className="w-4 h-4" color="#8B5CF6" />
                      <span 
                        className="text-sm text-gray-500 cursor-pointer hover:text-purple-600 hover:bg-purple-50 px-2 py-1 rounded transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowReservationModal(true)
                        }}
                      >
                        予約
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* アクティビティタグセクション */}
              <div className="mb-4 px-2">
                <ActivityTagSelector
                  currentTag={itinerary.activity_tag}
                  onTagChange={(tag) => updateField('activity_tag', tag)}
                />
              </div>
            </div>

            {/* 右側: ハンバーガーメニュー */}
            <ScheduleCardMenu
              isFirst={isFirst}
              isLast={isLast}
              availableDays={availableDays}
              currentDayId={itinerary.day_id}
              itineraryId={itinerary.id}
              hasReservation={!!itinerary.reservation}
              reservationType={itinerary.reservation?.type}
              onMoveUp={() => onMoveUp?.()}
              onMoveDown={() => onMoveDown?.()}
              onMoveToDay={(dayId) => onMoveToDay?.(itinerary.id, dayId)}
              onDuplicateToDay={(dayId) => onDuplicateToDay?.(itinerary.id, dayId)}
              onReservation={() => setShowReservationModal(true)}
              onDelete={() => onDelete?.(itinerary.id)}
            />
          </div>
        </div>
      </div>
      
      {/* ティアドロップ形状の接続点（カードの下端） */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
        <svg width="8" height="12" viewBox="0 0 8 12" className="text-gray-300">
          <path d="M4 0C1.79 0 0 1.79 0 4c0 2.21 4 8 4 8s4-5.79 4-8c0-2.21-1.79-4-4-4z" fill="currentColor"/>
        </svg>
      </div>
      
      {/* 予約情報モーダル */}
      <ReservationInfoModal
        isOpen={showReservationModal}
        onClose={() => setShowReservationModal(false)}
        onSave={handleReservationSave}
        initialReservation={itinerary.reservation || undefined}
        itineraryId={itinerary.id}
        itinerary={itinerary}
        day={availableDays.find(day => day.id === itinerary.day_id) || null}
      />
    </div>
  )
}
