'use client'
import logger from '@/lib/core/logger'
import { t } from '@/lib/i18n'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { placesApiHelpers } from '@/lib/api/google/places'
import { PlaceData, Itinerary, ActivityTag, ReservationInfo, Day, Trip } from '@/lib/core/types'
import { timezoneUtils } from '@/lib/utils/timezone'
import { currencyUtils } from '@/lib/utils/currency'
import { getUserLanguage } from '@/lib/utils/language'
import { useAuth } from '@/lib/contexts/auth'
import { getCachedPlaceImage, CachedImageInfo } from '@/lib/storage/image-cache'
import ActivityTagSelector from './ActivityTagSelector'
import ReservationInfoModal from '../modals/ReservationInfoModal'
import { useClickOutside } from '@/hooks/useClickOutside'
import { DragHandle } from '../common/DragHandle'
import type { DraggableAttributes } from '@dnd-kit/core'
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities'
import { TeardropMarker } from '../common/TeardropMarker'
import { IconRenderer } from '@/components/common/icons/IconRenderer'
import { useItineraryEditor } from '@/hooks/useItineraryEditor'
import { ScheduleCardMenu } from './ScheduleCardMenu'
import { InlineTimeEditor } from '../common/InlineTimeEditor'
import { InlineCostEditor } from '../common/InlineCostEditor'
import { ScheduleInfoDisplay } from './ScheduleInfoDisplay'
import { ScheduleCardImage } from './ScheduleCardImage'
import { getSecondaryCategoryIconName } from '@/lib/data/activity-categories'

interface ScheduleCardProps {
  itinerary: Itinerary
  canEdit?: boolean
  displayNumber?: number
  previousPlace?: PlaceData | null
  nextPlace?: PlaceData | null
  trip?: Trip | null
  onUpdate?: (updatedItinerary: Itinerary) => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  onMoveToDay?: (itineraryId: string, targetDayId: string) => void
  onDuplicateToDay?: (itineraryId: string, targetDayId: string) => void
  onDelete?: (itineraryId: string) => void
  onItineraryClick?: (itineraryId: string) => void
  availableDays?: Day[]
  dragHandleProps?: {
    attributes: DraggableAttributes
    listeners: SyntheticListenerMap
  }
  isDragging?: boolean
  isSelected?: boolean
  isFirst?: boolean
  isLast?: boolean
}

export default function ScheduleCard({ 
  itinerary, 
  canEdit = true,
  displayNumber,
  previousPlace,
  nextPlace,
  trip,
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
  const { user } = useAuth()
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
  const [tempCostCurrency, setTempCostCurrency] = useState(itinerary.cost_currency || trip?.default_currency || 'JPY')
  const descriptionRef = useRef<HTMLTextAreaElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const [cachedImage, setCachedImage] = useState<CachedImageInfo | null>(null)
  const [imageLoading, setImageLoading] = useState(false)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [showReservationModal, setShowReservationModal] = useState(false)
  const [isFetchingPlaceData, setIsFetchingPlaceData] = useState(false)

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
    setTempCostCurrency(itinerary.cost_currency || trip?.default_currency || 'JPY')
  }, [itinerary.id, itinerary.title, itinerary.start_time, itinerary.end_time, itinerary.description, itinerary.place_data?.editorial_summary?.overview, itinerary.timezone, itinerary.cost_currency, trip?.default_currency])

  // place_dataが初めて設定されたときのみ自動的にタイムゾーンを設定
  // ユーザーが手動でタイムゾーンを変更した場合は、それを尊重する
  const previousPlaceDataRef = useRef<PlaceData | null | undefined>(itinerary.place_data)
  const previousItineraryIdRef = useRef<string>(itinerary.id)
  
  useEffect(() => {
    // itinerary.idが変更された場合は、refをリセット
    if (previousItineraryIdRef.current !== itinerary.id) {
      previousPlaceDataRef.current = null
      previousItineraryIdRef.current = itinerary.id
    }
    
    if (!itinerary.place_data) {
      previousPlaceDataRef.current = itinerary.place_data
      return
    }

    // 既にタイムゾーンが設定されている場合（UTC以外）は、ユーザーが手動で設定した可能性があるため、自動設定を完全にスキップ
    const hasManualTimezone = itinerary.timezone && itinerary.timezone !== 'UTC'
    if (hasManualTimezone) {
      previousPlaceDataRef.current = itinerary.place_data
      return
    }

    // place_dataが初めて設定された場合のみ自動設定
    const isPlaceDataNewlySet = !previousPlaceDataRef.current && itinerary.place_data
    if (!isPlaceDataNewlySet) {
      previousPlaceDataRef.current = itinerary.place_data
      return
    }

    const detectedTimezone = timezoneUtils.getTimezoneFromPlace(itinerary.place_data)
    if (
      !detectedTimezone ||
      detectedTimezone === 'UTC' ||
      detectedTimezone === itinerary.timezone
    ) {
      previousPlaceDataRef.current = itinerary.place_data
      return
    }

    setDestinationTimezone(detectedTimezone)
    void updateField('timezone', detectedTimezone)
    previousPlaceDataRef.current = itinerary.place_data
  }, [itinerary.id, itinerary.place_data, itinerary.timezone, updateField])

  // place_data が未設定だが place_id がある場合は、詳細を取得して保存する
  const itineraryPlaceId = (itinerary as any).place_id as string | undefined

  useEffect(() => {
    const ensurePlaceData = async () => {
      // 閲覧専用の場合は取得/保存を行わない
      if (!canEdit) return
      // 既に取得中、または place_data が存在する場合はスキップ
      if (isFetchingPlaceData || itinerary.place_data || !itineraryPlaceId) {
        return
      }

      setIsFetchingPlaceData(true)
      logger.debug('📦 ScheduleCard: Fetching place details for missing place_data', { placeId: itineraryPlaceId })
      
      try {
        const language = getUserLanguage(user || undefined)
        const result = await placesApiHelpers.getPlaceDetails(itineraryPlaceId, language)
        if (result?.place_id) {
          await updateField('place_data', result as any)
          logger.debug('📦 ScheduleCard: place_data resolved and saved')
        }
      } catch (e) {
        logger.error('📦 ScheduleCard: ensurePlaceData error', e)
      } finally {
        setIsFetchingPlaceData(false)
      }
    }
    ensurePlaceData()
  }, [canEdit, itineraryPlaceId, itinerary.place_data, isFetchingPlaceData, user, updateField])

  // 通貨推測ロジックは削除（Create Trip Dialogで目的地選択時に通貨を自動推定する方式に変更）

  useEffect(() => {
    const loadImage = async () => {
      if (itinerary.place_data?.photos && itinerary.place_data.photos.length > 0) {
        const photos = itinerary.place_data.photos
        
        // places_cacheの解像度情報から最高解像度を選択（最大1600px、API上限考慮）
        const maxAvailableWidth = Math.max(...photos.map(p => p.width || 0))
        const targetWidth = Math.min(maxAvailableWidth, 1600)
        
        // 目標解像度に最も近い写真を選択（目標以上で最小のもの、なければ最大のもの）
        const selectedPhoto = photos.find(p => p.width >= targetWidth) || 
                             photos.reduce((prev, curr) => (curr.width || 0) > (prev.width || 0) ? curr : prev)
        
        const photoReference = selectedPhoto.photo_reference
        const photoWidth = selectedPhoto.width || 800
        const photoHeight = selectedPhoto.height || Math.round(photoWidth * 0.75)
        
        // 選択された写真の解像度に基づいて画像URLを生成（API上限1600px）
        const maxWidth = Math.min(photoWidth, 1600)
        const googlePhotoUrl = placesApiHelpers.getPhotoUrl(photoReference, maxWidth)
        
        try {
          setImageLoading(true)
          const cachedImageResult = await getCachedPlaceImage(photoReference, googlePhotoUrl, {
            width: maxWidth,
            height: Math.round(maxWidth * (photoHeight / photoWidth)), // アスペクト比維持
            quality: 85
          })
          setCachedImage(cachedImageResult)
          setPhotoUrl(cachedImageResult.url)
          logger.debug('  Cached image result:', cachedImageResult, 'resolution:', maxWidth)
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
      logger.error(t('scheduleCard.reservationSaveFailed'))
      throw new Error(t('scheduleCard.reservationSaveFailed'))
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
      alert(t('schedule.time.updateFailed'))
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
      alert(t('schedule.cost.updateFailed'))
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
        className="flex items-start space-x-3 cursor-pointer hover:bg-gray-50 rounded-lg p-1 -m-3 transition-colors"
        onClick={() => onItineraryClick?.(itinerary.id)}
      >
        {/* ドラッグハンドル（アイコンのみ） */}
        {dragHandleProps && (
          <DragHandle {...dragHandleProps} isDragging={isDragging} />
        )}

        {/* 外側ティアドロップは削除し、横幅を広げる */}

        {/* カード本体 */}
        <div className={`flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${isSelected ? 'ring-2 ring-red-500 ring-opacity-50' : ''}`}>
          <div className="flex">
            {/* 左側: 画像（16:9アスペクト比） */}
            <ScheduleCardImage
              photoUrl={photoUrl}
              title={itinerary.title}
              cachedImage={cachedImage}
              imageLoading={imageLoading}
              photoReference={itinerary.place_data?.photos?.[0]?.photo_reference}
              activityIconName={itinerary.activity_tag ? getSecondaryCategoryIconName(itinerary.activity_tag.primaryCategory, itinerary.activity_tag.secondaryCategory) : undefined}
            >
              {/* 画像左上に数字入りティアドロップ（Google Maps対応の番号と一致） */}
              <div className="absolute top-1.5 left-1.5 pointer-events-none">
                <TeardropMarker 
                  number={displayNumber || itinerary.sort_number}
                  isSelected={isSelected}
                  className="mt-1.5 ml-1.5"
                />
              </div>
            </ScheduleCardImage>

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
                    className={canEdit ? "font-semibold text-gray-900 text-lg cursor-pointer hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors" : "font-semibold text-gray-900 text-lg px-2 py-1"}
                    onClick={canEdit ? () => setIsEditingTitle(true) : undefined}
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
                    onClick={canEdit ? () => setIsEditingDescription(true) : undefined}
                    className={canEdit ? "cursor-pointer text-sm text-gray-700 hover:bg-gray-50 p-2 rounded border border-transparent hover:border-gray-200 min-h-[2.5rem]" : "text-sm text-gray-700 p-2 min-h-[2.5rem]"}
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
                            {isExpanded ? t('scheduleCard.collapse') : t('scheduleCard.readMore')}
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">
                        {itinerary.place_data?.editorial_summary?.overview 
                          ? t('scheduleCard.memo.hasDescription')
                          : t('scheduleCard.memo.addMemo')
                        }
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* 時間・費用・予約を1行にインラインで配置 */}
              <div className="mb-4 p-2">
                {isEditingTime ? (
                  <InlineTimeEditor
                    startTime={tempStartTime}
                    endTime={tempEndTime}
                    timezone={destinationTimezone}
                    onStartTimeChange={setTempStartTime}
                    onEndTimeChange={setTempEndTime}
                    onTimezoneChange={(tz) => {
                      setDestinationTimezone(tz)
                      handleTimezoneUpdate(tz)
                    }}
                    onSave={handleTimeSave}
                    onCancel={handleTimeCancel}
                    isSaving={isSaving}
                  />
                ) : isEditingCost ? (
                  <InlineCostEditor
                    amount={tempCostAmount}
                    currency={tempCostCurrency}
                    onAmountChange={setTempCostAmount}
                    onCurrencyChange={setTempCostCurrency}
                    onSave={handleCostSave}
                    onCancel={handleCostCancel}
                    isSaving={isSaving}
                  />
                ) : (
                  <ScheduleInfoDisplay
                    startTime={startTime}
                    endTime={endTime}
                    costAmount={itinerary.cost_amount ?? undefined}
                    costCurrency={itinerary.cost_currency ?? undefined}
                    reservation={itinerary.reservation}
                    onTimeEdit={canEdit ? handleTimeEditStart : undefined}
                    onCostEdit={canEdit ? handleCostEditStart : undefined}
                    onReservationEdit={canEdit ? () => setShowReservationModal(true) : undefined}
                  />
                )}
              </div>

              {/* アクティビティタグセクション - 編集権限がある場合のみ */}
              {canEdit && (
                <div className="mb-4 px-2">
                  <ActivityTagSelector
                    currentTag={itinerary.activity_tag}
                    onTagChange={(tag) => updateField('activity_tag', tag)}
                  />
                </div>
              )}
            </div>

            {/* 右側: ハンバーガーメニュー - 編集権限がある場合のみ */}
            {canEdit && (
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
            )}
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
