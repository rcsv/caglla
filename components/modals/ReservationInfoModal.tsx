'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ReservationInfo, ReservationType, ReservationSite } from '@/lib/core/types'
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

export default function ReservationInfoModal({
  isOpen,
  onClose,
  onSave,
  initialReservation,
  itineraryId
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
        setReservation({
          type: 'hotel',
          created_at: new Date(),
          updated_at: new Date()
        })
      }
      setErrors([])
    }
  }, [isOpen, initialReservation])

  // 予約タイプ変更時の処理
  const handleTypeChange = (type: ReservationType) => {
    setReservation(prev => ({
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
                  onChange={(e) => setReservation(prev => ({ ...prev, flight_number: e.target.value.toUpperCase() }))}
                  placeholder="例: ANA123, JAL456"
                  error={validateFlightNumberField(reservation.flight_number || '') || undefined}
                />
                <Input
                  label="航空会社"
                  value={reservation.airline || ''}
                  onChange={(e) => setReservation(prev => ({ ...prev, airline: e.target.value }))}
                  placeholder="例: ANA, JAL"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="出発空港 *"
                  value={reservation.departure_airport || ''}
                  onChange={(e) => setReservation(prev => ({ ...prev, departure_airport: e.target.value.toUpperCase() }))}
                  placeholder="例: NRT, HND"
                  error={validateAirportCodeField(reservation.departure_airport || '') || undefined}
                />
                <Input
                  label="到着空港 *"
                  value={reservation.arrival_airport || ''}
                  onChange={(e) => setReservation(prev => ({ ...prev, arrival_airport: e.target.value.toUpperCase() }))}
                  placeholder="例: ITM, KIX"
                  error={validateAirportCodeField(reservation.arrival_airport || '') || undefined}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="出発日時 *"
                  type="datetime-local"
                  value={
                    reservation.departure_at 
                    ? new Date((reservation.departure_at as any).toDate?.() 
                        ?? (reservation.departure_at as string)).toISOString().slice(0, 16) 
                    : ''}
                  onChange={(e) => setReservation(prev => ({ ...prev, departure_at: new Date(e.target.value) }))}
                />
                <Input
                  label="到着日時 *"
                  type="datetime-local"
                  value={
                    reservation.arrival_at 
                    ? new Date((reservation.arrival_at as any).toDate?.() 
                        ?? (reservation.arrival_at as string)).toISOString().slice(0, 16) 
                    : ''}
                  onChange={(e) => setReservation(prev => ({ ...prev, arrival_at: new Date(e.target.value) }))}
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
                value={
                  reservation.start_date 
                  ? new Date((reservation.start_date as any).toDate?.() 
                      ?? (reservation.start_date as string)).toISOString().slice(0, 16) 
                  : ''}
                onChange={(e) => setReservation(prev => ({ ...prev, start_date: new Date(e.target.value) }))}
              />
              <Input
                label="終了日時 *"
                type="datetime-local"
                value={
                  reservation.end_date 
                  ? new Date((reservation.end_date as any).toDate?.() 
                      ?? (reservation.end_date as string)).toISOString().slice(0, 16) 
                  : ''}
                onChange={(e) => setReservation(prev => ({ ...prev, end_date: new Date(e.target.value) }))}
              />
            </div>
          )}

          {/* 共通フィールド */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="予約確認番号"
              value={reservation.confirmation_number || ''}
              onChange={(e) => setReservation(prev => ({ ...prev, confirmation_number: e.target.value }))}
              placeholder="予約確認番号"
            />
            <Select
              label="予約サイト"
              value={reservation.reservation_site || ''}
              onChange={(e) => setReservation(prev => ({ ...prev, reservation_site: e.target.value as ReservationSite }))}
              options={[
                { value: '', label: '選択してください' },
                ...RESERVATION_SITES.map(site => ({ value: site.value, label: site.label }))
              ]}
            />
          </div>

          <Input
            label="予約サイトURL"
            value={reservation.reservation_url || ''}
            onChange={(e) => setReservation(prev => ({ ...prev, reservation_url: e.target.value }))}
            placeholder="https://example.com"
            type="url"
          />

          <Textarea
            label="メモ"
            value={reservation.notes || ''}
            onChange={(e) => setReservation(prev => ({ ...prev, notes: e.target.value }))}
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
