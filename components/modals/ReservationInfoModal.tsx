'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ReservationInfo, ReservationType, ReservationSite, Itinerary, Day, ActivityTag, PrimaryCategoryType } from '@/lib/core/types'
import { 
  validateReservationInfo, 
  getReservationTypeLabel, 
  getReservationSiteLabel,
  getReservationTypeIcon,
  validateAirportCode,
  validateFlightNumber
} from '@/lib/utils/reservation-utils'
import logger from '@/lib/core/logger'
import Button from '@/components/common/Button'
import Input from '@/components/common/Input'
import Select from '@/components/common/Select'
import Textarea from '@/components/common/Textarea'

interface ReservationInfoModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (reservation: ReservationInfo) => Promise<void>
  initialReservation?: ReservationInfo | null
  itineraryId: string
  itinerary?: Itinerary | null
  day?: Day | null
}

const RESERVATION_TYPES: { value: ReservationType; label: string; icon: string }[] = [
  { value: 'flight', label: '飛行機', icon: '✈️' },
  { value: 'rental_car', label: 'レンタカー', icon: '🚗' },
  { value: 'hotel', label: 'ホテル', icon: '🏨' },
  { value: 'dining', label: '食事', icon: '🍽️' },
  { value: 'other', label: 'その他', icon: '📋' }
]

const RESERVATION_SITES: { value: ReservationSite; label: string }[] = [
  { value: 'expedia', label: 'Expedia' },
  { value: 'booking_com', label: 'Booking.com' },
  { value: 'agoda', label: 'Agoda' },
  { value: 'trivago', label: 'Trivago' },
  { value: 'airbnb', label: 'Airbnb' },
  { value: 'kayak', label: 'Kayak' },
  { value: 'skyscanner', label: 'Skyscanner' },
  { value: 'tripadvisor', label: 'TripAdvisor' },
  { value: 'opentable', label: 'OpenTable' },
  { value: 'tabelog', label: '食べログ' },
  { value: 'hot_pepper', label: 'ホットペッパー' },
  { value: 'ana', label: 'ANA' },
  { value: 'jal', label: 'JAL' },
  { value: 'rakuten_travel', label: '楽天トラベル' },
  { value: 'jalan', label: 'じゃらん' },
  { value: 'other', label: 'その他' }
]

// アクティビティタグから予約タイプへのマッピング
const getReservationTypeFromActivityTag = (activityTag: ActivityTag | null | undefined): ReservationType | null => {
  if (!activityTag) return null
  
  const { primaryCategory, secondaryCategory } = activityTag
  // まずセカンダリIDで厳密に判定（マスタはIDで管理されているため）
  if (secondaryCategory === 'flight') return 'flight'
  if (secondaryCategory === 'car_rental') return 'rental_car'

  // セカンダリで判定できない場合は一次カテゴリで大まかに判定
  if (primaryCategory === 'accommodation') return 'hotel'
  if (primaryCategory === 'dining') return 'dining'
  if (primaryCategory === 'transportation') return null
  
  return null
}

// Dayの日付から開始日時のデフォルト値を生成
const getDefaultStartDateTime = (day: Day | null | undefined): Date | null => {
  if (!day?.date) return null
  
  try {
    const dayDate = new Date((day.date as any).toDate?.() ?? (day.date as string))
    // 日付の9:00をデフォルトの開始時刻とする
    dayDate.setHours(9, 0, 0, 0)
    return dayDate
  } catch (error) {
    logger.error('Error parsing day date:', error)
    return null
  }
}

// Day の日付と "HH:mm" 形式の時刻文字列を合成して Date を生成
const combineDayAndTime = (day: Day | null | undefined, time: string | null | undefined): Date | null => {
  if (!day?.date || !time) return null
  try {
    const [hh, mm] = time.split(':').map((v) => parseInt(v, 10))
    if (Number.isNaN(hh) || Number.isNaN(mm)) return null
    const date = new Date((day.date as any).toDate?.() ?? (day.date as string))
    date.setHours(hh, mm, 0, 0)
    return date
  } catch (e) {
    logger.error('Failed to combine day and time:', e)
    return null
  }
}

// datetime-local 入力用にローカルタイムの文字列 (YYYY-MM-DDTHH:mm) を生成
const formatForDatetimeLocal = (value: any): string => {
  if (!value) return ''
  try {
    const d: Date = new Date((value as any).toDate?.() ?? (value as string))
    if (isNaN(d.getTime())) return ''
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    return `${y}-${m}-${day}T${hh}:${mm}`
  } catch {
    return ''
  }
}

export default function ReservationInfoModal({
  isOpen,
  onClose,
  onSave,
  initialReservation,
  itineraryId,
  itinerary,
  day
}: ReservationInfoModalProps) {
  const [reservation, setReservation] = useState<Partial<ReservationInfo>>({
    type: 'hotel',
    created_at: new Date(),
    updated_at: new Date()
  })
  const [errors, setErrors] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // 初期データの設定
  useEffect(() => {
    if (isOpen) {
      if (initialReservation) {
        setReservation(initialReservation)
      } else {
        // 新しい予約の場合、ItineraryとDayの情報からデフォルト値を設定
        const defaultReservationType = getReservationTypeFromActivityTag(itinerary?.activity_tag) || 'hotel'
        // 時刻継承: Itineraryに時刻があればDayと合成。なければDayのデフォルト(09:00)
        const inheritedStart = combineDayAndTime(day, itinerary?.start_time)
        const inheritedEnd = combineDayAndTime(day, itinerary?.end_time)
        const defaultStartDateTime = inheritedStart || getDefaultStartDateTime(day)
        
        const newReservation: Partial<ReservationInfo> = {
          type: defaultReservationType,
          created_at: new Date(),
          updated_at: new Date()
        }
        
        // 開始日時を設定（Itineraryの時刻優先、なければDay基準）
        if (defaultStartDateTime) {
          if (defaultReservationType === 'flight') {
            // 飛行機の場合は出発日時として設定
            newReservation.departure_at = defaultStartDateTime
            // 到着日時は Itineraryのend_time があれば優先、なければ +2時間
            if (inheritedEnd) {
              newReservation.arrival_at = inheritedEnd
            } else {
              const arrivalTime = new Date(defaultStartDateTime.getTime() + 2 * 60 * 60 * 1000)
              newReservation.arrival_at = arrivalTime
            }
          } else {
            // その他の場合は開始日時として設定
            newReservation.start_date = defaultStartDateTime
            // 終了日時は Itineraryのend_time があれば同日で合成、なければ +1日
            if (inheritedEnd) {
              newReservation.end_date = inheritedEnd
            } else {
              const endTime = new Date(defaultStartDateTime.getTime() + 24 * 60 * 60 * 1000)
              newReservation.end_date = endTime
            }
          }
        }
        
        setReservation(newReservation)
      }
      setErrors([])
    }
  }, [isOpen, initialReservation, itinerary, day])

  // 予約タイプ変更時の処理
  const handleTypeChange = (type: ReservationType) => {
    setReservation((prev: any) => ({
      ...prev,
      type,
      // タイプ変更時に関連フィールドをクリア
      flight_number: undefined,
      departure_airport: undefined,
      arrival_airport: undefined,
      departure_at: undefined,
      arrival_at: undefined,
      airline: undefined,
      start_date: undefined,
      end_date: undefined
    }))
    setErrors([])
  }

  // 保存処理
  const handleSave = async () => {
    try {
      setIsSaving(true)
      setErrors([])

      // バリデーション
      const validation = validateReservationInfo(reservation)
      if (!validation.isValid) {
        setErrors(validation.errors)
        return
      }

      // 保存実行
      await onSave(reservation as ReservationInfo)
      onClose()
    } catch (error) {
      logger.error('予約情報の保存に失敗しました:', error)
      setErrors(['予約情報の保存に失敗しました'])
    } finally {
      setIsSaving(false)
    }
  }

  // 空港コードのバリデーション
  const validateAirportCodeField = (code: string) => {
    if (code && !validateAirportCode(code)) {
      return '空港コードは3文字の英大文字で入力してください（例: NRT, HND）'
    }
    return null
  }

  // 便名のバリデーション
  const validateFlightNumberField = (flightNumber: string) => {
    if (flightNumber && !validateFlightNumber(flightNumber)) {
      return '便名は航空会社コード+数字の形式で入力してください（例: ANA123, JAL456）'
    }
    return null
  }

  if (!isOpen) return null

  const modal = (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center zidx-dialog-overlay">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">
            {initialReservation ? '予約情報を編集' : '予約情報を追加'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* エラー表示 */}
        {errors.length > 0 && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            <ul className="list-disc list-inside">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-6">
          {/* 予約タイプ選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              予約タイプ *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {RESERVATION_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => handleTypeChange(type.value)}
                  className={`p-3 border rounded-lg text-left transition-colors ${
                    reservation.type === type.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="text-lg mr-2">{type.icon}</span>
                    <span className="font-medium">{type.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 飛行機の場合のフィールド */}
          {reservation.type === 'flight' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="便名 *"
                  value={reservation.flight_number || ''}
                  onChange={(e) => setReservation((prev: any) => ({ ...prev, flight_number: e.target.value.toUpperCase() }))}
                  placeholder="例: ANA123, JAL456"
                  error={validateFlightNumberField(reservation.flight_number || '') || undefined}
                />
                <Input
                  label="航空会社"
                  value={reservation.airline || ''}
                  onChange={(e) => setReservation((prev: any) => ({ ...prev, airline: e.target.value }))}
                  placeholder="例: ANA, JAL"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="出発空港 *"
                  value={reservation.departure_airport || ''}
                  onChange={(e) => setReservation((prev: any) => ({ ...prev, departure_airport: e.target.value.toUpperCase() }))}
                  placeholder="例: NRT, HND"
                  error={validateAirportCodeField(reservation.departure_airport || '') || undefined}
                />
                <Input
                  label="到着空港 *"
                  value={reservation.arrival_airport || ''}
                  onChange={(e) => setReservation((prev: any) => ({ ...prev, arrival_airport: e.target.value.toUpperCase() }))}
                  placeholder="例: ITM, KIX"
                  error={validateAirportCodeField(reservation.arrival_airport || '') || undefined}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="出発日時 *"
                  type="datetime-local"
                  value={formatForDatetimeLocal(reservation.departure_at)}
                  onChange={(e) => {
                    const departureTime = new Date(e.target.value)
                    setReservation((prev: any) => {
                      const newReservation = { ...prev, departure_at: departureTime }
                      // 到着日時が空の場合は出発日時+2時間を自動設定
                      if (!prev.arrival_at) {
                        const arrivalTime = new Date(departureTime.getTime() + 2 * 60 * 60 * 1000) // +2時間
                        newReservation.arrival_at = arrivalTime
                      }
                      return newReservation
                    })
                  }}
                />
                <Input
                  label="到着日時 *"
                  type="datetime-local"
                  value={formatForDatetimeLocal(reservation.arrival_at)}
                  onChange={(e) => setReservation((prev: any) => ({ ...prev, arrival_at: new Date(e.target.value) }))}
                  min={
                    reservation.departure_at 
                    ? formatForDatetimeLocal(reservation.departure_at)
                    : undefined
                  }
                />
              </div>
            </>
          )}

          {/* 飛行機以外の場合のフィールド */}
          {reservation.type && reservation.type !== 'flight' && (
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="開始日時 *"
                type="datetime-local"
                value={formatForDatetimeLocal(reservation.start_date)}
                onChange={(e) => {
                  const startTime = new Date(e.target.value)
                  setReservation((prev: any) => {
                    const newReservation = { ...prev, start_date: startTime }
                    // 終了日時が空の場合は開始日時+1日を自動設定
                    if (!prev.end_date) {
                      const endTime = new Date(startTime.getTime() + 24 * 60 * 60 * 1000) // +1日
                      newReservation.end_date = endTime
                    }
                    return newReservation
                  })
                }}
              />
              <Input
                label="終了日時 *"
                type="datetime-local"
                value={formatForDatetimeLocal(reservation.end_date)}
                onChange={(e) => setReservation((prev: any) => ({ ...prev, end_date: new Date(e.target.value) }))}
                min={
                  reservation.start_date 
                  ? formatForDatetimeLocal(reservation.start_date)
                  : undefined
                }
              />
            </div>
          )}

          {/* 共通フィールド */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="予約確認番号"
              value={reservation.confirmation_number || ''}
              onChange={(e) => setReservation((prev: any) => ({ ...prev, confirmation_number: e.target.value }))}
              placeholder="予約確認番号"
            />
            <Select
              label="予約サイト"
              value={reservation.reservation_site || ''}
              onChange={(e) => setReservation((prev: any) => ({ ...prev, reservation_site: e.target.value as ReservationSite }))}
              options={[
                { value: '', label: '選択してください' },
                ...RESERVATION_SITES.map(site => ({ value: site.value, label: site.label }))
              ]}
            />
          </div>

          <Input
            label="予約サイトURL"
            value={reservation.reservation_url || ''}
            onChange={(e) => setReservation((prev: any) => ({ ...prev, reservation_url: e.target.value }))}
            placeholder="https://example.com"
            type="url"
          />

          <Textarea
            label="メモ"
            value={reservation.notes || ''}
            onChange={(e) => setReservation((prev: any) => ({ ...prev, notes: e.target.value }))}
            placeholder="追加のメモや情報"
            rows={3}
          />
        </div>

        {/* ボタン */}
        <div className="flex justify-end space-x-3 mt-6">
          <Button
            onClick={onClose}
            variant="secondary"
            disabled={isSaving}
          >
            キャンセル
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || isLoading}
          >
            {isSaving ? '保存中...' : '保存'}
          </Button>
        </div>
      </div>
    </div>
  )

  if (!mounted) return null
  return createPortal(modal, document.body)
}
