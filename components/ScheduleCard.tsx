'use client'

import { useState, useEffect, useRef } from 'react'
import { placesApiHelpers } from '@/lib/places-api'
import { PlaceData, Itinerary } from '@/lib/firestore'
import { timezoneUtils } from '@/lib/timezone-utils'
import { currencyUtils } from '@/lib/currency-utils'
import VenueDistance from './VenueDistance'

interface ScheduleCardProps {
  itinerary: Itinerary
  previousPlace?: PlaceData | null
  nextPlace?: PlaceData | null
  onUpdate?: (updatedItinerary: any) => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  onMoveToDay?: (itineraryId: string, targetDayId: string) => void
  onDuplicateToDay?: (itineraryId: string, targetDayId: string) => void
  onDelete?: (itineraryId: string) => void
  availableDays?: Array<{
    id: string
    day_number: number
    date: string
  }>
  dragHandleProps?: {
    attributes: any
    listeners: any
  }
  isDragging?: boolean
}

export default function ScheduleCard({ 
  itinerary, 
  previousPlace,
  nextPlace,
  onUpdate, 
  onMoveUp, 
  onMoveDown, 
  onMoveToDay, 
  onDuplicateToDay,
  onDelete,
  availableDays = [],
  dragHandleProps,
  isDragging = false
}: ScheduleCardProps) {
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [description, setDescription] = useState(itinerary.description || '')
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [title, setTitle] = useState(itinerary.title || '')
  const [startTime, setStartTime] = useState(itinerary.start_time || '')
  const [endTime, setEndTime] = useState(itinerary.end_time || '')
  const [isSaving, setIsSaving] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showDaySelector, setShowDaySelector] = useState(false)
  const [showDuplicateSelector, setShowDuplicateSelector] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditingTime, setIsEditingTime] = useState(false)
  const [tempStartTime, setTempStartTime] = useState(itinerary.start_time || '')
  const [tempEndTime, setTempEndTime] = useState(itinerary.end_time || '')
  const [destinationTimezone, setDestinationTimezone] = useState('UTC')
  const [userTimezone, setUserTimezone] = useState('UTC')
  const [isEditingCost, setIsEditingCost] = useState(false)
  const [tempCostAmount, setTempCostAmount] = useState(itinerary.cost_amount?.toString() || '')
  const [tempCostCurrency, setTempCostCurrency] = useState(itinerary.cost_currency || 'JPY')
  const menuRef = useRef<HTMLDivElement>(null)
  const descriptionRef = useRef<HTMLTextAreaElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)

  // メニューの外側クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
        setShowDaySelector(false)
        setShowDuplicateSelector(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // itineraryの変更時にタイトルと時間を更新
  useEffect(() => {
    setTitle(itinerary.title || '')
    setStartTime(itinerary.start_time || '')
    setEndTime(itinerary.end_time || '')
    setTempStartTime(itinerary.start_time || '')
    setTempEndTime(itinerary.end_time || '')
    setDestinationTimezone('UTC')
  }, [itinerary.id, itinerary.title, itinerary.start_time, itinerary.end_time]) // itinerary.idを追加してオブジェクト参照の変更に対応

  // ブラウザのタイムゾーンを取得
  useEffect(() => {
    setUserTimezone(timezoneUtils.getBrowserTimezone())
  }, [])

  // 場所情報からタイムゾーンを自動取得
  useEffect(() => {
    if (itinerary.place_data) {
      const detectedTimezone = timezoneUtils.getTimezoneFromPlace(itinerary.place_data)
      if (detectedTimezone !== 'UTC') {
        setDestinationTimezone(detectedTimezone)
        // タイムゾーンの保存は手動で行う（自動保存を無効化）
        // handleTimezoneUpdate(detectedTimezone)
      }
    }
  }, [itinerary.place_data?.place_id]) // place_idを使用して無限ループを防ぐ

  // 場所情報から通貨を自動取得
  useEffect(() => {
    if (itinerary.place_data && !itinerary.cost_currency) {
      const detectedCurrency = currencyUtils.getCurrencyFromPlace(itinerary.place_data)
      if (detectedCurrency !== 'JPY') {
        setTempCostCurrency(detectedCurrency)
        // 通貨の保存は手動で行う（自動保存を無効化）
        // handleCurrencyUpdate(detectedCurrency)
      }
    }
  }, [itinerary.place_data?.place_id, itinerary.cost_currency]) // place_idを使用して無限ループを防ぐ

  // 写真のURLを取得
  const getPhotoUrl = () => {
    if (itinerary.place_data?.photos && itinerary.place_data.photos.length > 0) {
      return placesApiHelpers.getPhotoUrl(itinerary.place_data.photos[0].photo_reference, 300)
    }
    return null
  }

  // タイトルの編集を開始
  const handleTitleClick = () => {
    setIsEditingTitle(true)
  }

  // タイトルの編集を保存
  const handleTitleSave = async () => {
    if (title !== itinerary.title) {
      setIsSaving(true)
      try {
        const response = await fetch(`/api/itineraries/${itinerary.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title
          })
        })

        if (response.ok) {
          const updatedItinerary = await response.json()
          onUpdate?.(updatedItinerary)
        } else {
          console.error('Failed to update title')
        }
      } catch (error) {
        console.error('Error updating title:', error)
      } finally {
        setIsSaving(false)
      }
    }
    setIsEditingTitle(false)
  }

  // タイトルの編集をキャンセル
  const handleTitleCancel = () => {
    setTitle(itinerary.title || '')
    setIsEditingTitle(false)
  }

  // メモの編集を開始
  const handleDescriptionClick = () => {
    setIsEditingDescription(true)
  }

  // メモの編集を保存
  const handleDescriptionSave = async () => {
    if (description !== itinerary.description) {
      setIsSaving(true)
      try {
        const response = await fetch(`/api/itineraries/${itinerary.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            description
          })
        })

        if (response.ok) {
          const updatedItinerary = await response.json()
          onUpdate?.(updatedItinerary)
        } else {
          console.error('Failed to update description')
        }
      } catch (error) {
        console.error('Error updating description:', error)
      } finally {
        setIsSaving(false)
      }
    }
    setIsEditingDescription(false)
  }

  // メモの編集をキャンセル
  const handleDescriptionCancel = () => {
    setDescription(itinerary.description || '')
    setIsEditingDescription(false)
  }

  // 時間の更新
  const handleTimeUpdate = async (field: 'start_time' | 'end_time', value: string) => {
    try {
      const response = await fetch(`/api/itineraries/${itinerary.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [field]: value
        })
      })

      if (response.ok) {
        const updatedItinerary = await response.json()
        onUpdate?.(updatedItinerary)
      }
    } catch (error) {
      console.error('Error updating time:', error)
    }
  }

  // タイムゾーンの更新
  const handleTimezoneUpdate = async (timezone: string) => {
    try {
      const response = await fetch(`/api/itineraries/${itinerary.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timezone
        })
      })

      if (response.ok) {
        const updatedItinerary = await response.json()
        onUpdate?.(updatedItinerary)
      }
    } catch (error) {
      console.error('Error updating timezone:', error)
    }
  }

  // 通貨の更新
  const handleCurrencyUpdate = async (currency: string) => {
    try {
      const response = await fetch(`/api/itineraries/${itinerary.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cost_currency: currency
        })
      })

      if (response.ok) {
        const updatedItinerary = await response.json()
        onUpdate?.(updatedItinerary)
      }
    } catch (error) {
      console.error('Error updating currency:', error)
    }
  }

  // 時間編集を開始
  const handleTimeEditStart = () => {
    setTempStartTime(startTime)
    setTempEndTime(endTime)
    setIsEditingTime(true)
  }

  // 時間編集を保存
  const handleTimeSave = async () => {
    setIsSaving(true)
    try {
      // 開始時間と終了時間を同時に更新
      const response = await fetch(`/api/itineraries/${itinerary.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start_time: tempStartTime,
          end_time: tempEndTime,
          timezone: destinationTimezone
        })
      })

      if (response.ok) {
        const updatedItinerary = await response.json()
        setStartTime(tempStartTime)
        setEndTime(tempEndTime)
        onUpdate?.(updatedItinerary)
        setIsEditingTime(false)
      } else {
        console.error('Failed to update time')
        alert('時間の更新に失敗しました')
      }
    } catch (error) {
      console.error('Error updating time:', error)
      alert('時間の更新に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  // 時間編集をキャンセル
  const handleTimeCancel = () => {
    setTempStartTime(startTime)
    setTempEndTime(endTime)
    setIsEditingTime(false)
  }

  // 時間フォーマットのバリデーション
  const isValidTimeFormat = (time: string) => {
    if (!time) return true // 空の場合は有効
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    return timeRegex.test(time)
  }

  // 費用編集を開始
  const handleCostEditStart = () => {
    setTempCostAmount(itinerary.cost_amount?.toString() || '')
    setTempCostCurrency(itinerary.cost_currency || 'JPY')
    setIsEditingCost(true)
  }

  // 費用編集を保存
  const handleCostSave = async () => {
    setIsSaving(true)
    try {
      const costAmount = tempCostAmount ? parseFloat(tempCostAmount) : undefined
      
      const response = await fetch(`/api/itineraries/${itinerary.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cost_amount: costAmount,
          cost_currency: tempCostCurrency
        })
      })

      if (response.ok) {
        const updatedItinerary = await response.json()
        onUpdate?.(updatedItinerary)
        setIsEditingCost(false)
      } else {
        console.error('Failed to update cost')
        alert('費用の更新に失敗しました')
      }
    } catch (error) {
      console.error('Error updating cost:', error)
      alert('費用の更新に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  // 費用編集をキャンセル
  const handleCostCancel = () => {
    setTempCostAmount(itinerary.cost_amount?.toString() || '')
    setTempCostCurrency(itinerary.cost_currency || 'JPY')
    setIsEditingCost(false)
  }

  // 数値のバリデーション
  const isValidAmount = (amount: string) => {
    if (!amount) return true // 空の場合は有効
    const num = parseFloat(amount)
    return !isNaN(num) && num >= 0
  }

  // メニューアイテムのクリック処理
  const handleMenuAction = (action: string) => {
    switch (action) {
      case 'moveUp':
        setShowMenu(false)
        onMoveUp?.()
        break
      case 'moveDown':
        setShowMenu(false)
        onMoveDown?.()
        break
      case 'moveToDay':
        setShowDaySelector(true)
        break
      case 'duplicateToDay':
        setShowDuplicateSelector(true)
        break
      case 'delete':
        setShowMenu(false)
        if (confirm('このVenueを削除しますか？')) {
          onDelete?.(itinerary.id)
        }
        break
    }
  }

  // 日程選択の処理
  const handleDaySelect = async (targetDayId: string) => {
    setShowDaySelector(false)
    setShowMenu(false)
    
    if (targetDayId === itinerary.day_id) {
      return // 同じ日程の場合は何もしない
    }

    try {
      const response = await fetch('/api/itineraries/move-to-day', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itinerary_id: itinerary.id,
          target_day_id: targetDayId
        })
      })

      if (response.ok) {
        const updatedItinerary = await response.json()
        onMoveToDay?.(itinerary.id, targetDayId)
      } else {
        console.error('Failed to move itinerary')
        alert('日程の移動に失敗しました')
      }
    } catch (error) {
      console.error('Error moving itinerary:', error)
      alert('日程の移動に失敗しました')
    }
  }

  // 日程複製の処理
  const handleDuplicateSelect = async (targetDayId: string) => {
    setShowDuplicateSelector(false)
    setShowMenu(false)
    
    try {
      const response = await fetch('/api/itineraries/duplicate-to-day', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itinerary_id: itinerary.id,
          target_day_id: targetDayId
        })
      })

      if (response.ok) {
        const duplicatedItinerary = await response.json()
        onDuplicateToDay?.(itinerary.id, targetDayId)
      } else {
        console.error('Failed to duplicate itinerary')
        alert('日程の複製に失敗しました')
      }
    } catch (error) {
      console.error('Error duplicating itinerary:', error)
      alert('日程の複製に失敗しました')
    }
  }

  // 利用可能な日程をフィルタリング（移動時は自身の日程を除外、複製時は全て表示）
  const filteredDaysForMove = availableDays.filter(day => day.id !== itinerary.day_id)
  const filteredDaysForDuplicate = availableDays

  const photoUrl = getPhotoUrl()

  // 説明文の展開/折りたたみロジック
  const MAX_CHARS = 150
  const shouldTruncate = description.length > MAX_CHARS
  const displayText = shouldTruncate && !isExpanded 
    ? description.substring(0, MAX_CHARS) + '...'
    : description

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  // 時刻フォーマットを一般ユーザー向けに変更（08:00 → 8:00）
  const formatTimeForDisplay = (time: string): string => {
    if (!time) return '--:--'
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours, 10)
    return `${hour}:${minutes}`
  }

  return (
    <div className="relative overflow-visible">
      <div className="flex items-start space-x-3">
        {/* ドラッグハンドル（アイコンのみ） */}
        {dragHandleProps && (
          <div 
            {...dragHandleProps.attributes}
            {...dragHandleProps.listeners}
            className={`p-1 cursor-grab active:cursor-grabbing hover:bg-gray-100 rounded transition-colors mt-4 ${isDragging ? 'opacity-50' : ''}`}
            title="ドラッグして順序を変更"
          >
            <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM7 8a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM7 14a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM13 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM13 8a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM13 14a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" />
            </svg>
          </div>
        )}

        {/* ソート番号（ティアドロップ形状） */}
        <div className="relative mt-3">
          <svg width="30" height="40" viewBox="0 0 30 40" className="text-red-500">
            <path d="M15 0C6.72 0 0 6.72 0 15c0 8.28 15 25 15 25s15-16.72 15-25c0-8.28-6.72-15-15-15z" fill="currentColor"/>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translateY(-4px)' }}>
            <span className="text-white font-bold text-sm">{itinerary.sort_number}</span>
          </div>
        </div>

        {/* カード本体 */}
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex">
            {/* 左側: 画像（16:9アスペクト比） */}
            <div className="flex-shrink-0 w-32 h-18">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={itinerary.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
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
                    onBlur={handleTitleSave}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleTitleSave()
                      } else if (e.key === 'Escape') {
                        handleTitleCancel()
                      }
                    }}
                  />
                ) : (
                  <h4 
                    className="font-semibold text-gray-900 text-lg cursor-pointer hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                    onClick={handleTitleClick}
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
                    onBlur={handleDescriptionSave}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.ctrlKey) {
                        handleDescriptionSave()
                      } else if (e.key === 'Escape') {
                        handleDescriptionCancel()
                      }
                    }}
                  />
                ) : (
                  <div
                    onClick={handleDescriptionClick}
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
                      <span className="text-gray-400 italic">Memo: メモを追加してください</span>
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
                        onChange={(e) => setDestinationTimezone(e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="UTC">UTC</option>
                        <option value="Asia/Tokyo">Asia/Tokyo (日本)</option>
                        <option value="America/New_York">America/New_York (ニューヨーク)</option>
                        <option value="America/Los_Angeles">America/Los_Angeles (ロサンゼルス)</option>
                        <option value="Europe/London">Europe/London (ロンドン)</option>
                        <option value="Europe/Paris">Europe/Paris (パリ)</option>
                        <option value="Asia/Seoul">Asia/Seoul (ソウル)</option>
                        <option value="Asia/Shanghai">Asia/Shanghai (上海)</option>
                        <option value="Asia/Hong_Kong">Asia/Hong_Kong (香港)</option>
                        <option value="Asia/Singapore">Asia/Singapore (シンガポール)</option>
                        <option value="Asia/Bangkok">Asia/Bangkok (バンコク)</option>
                        <option value="Asia/Kolkata">Asia/Kolkata (インド)</option>
                        <option value="Australia/Sydney">Australia/Sydney (シドニー)</option>
                        <option value="Pacific/Honolulu">Pacific/Honolulu (ハワイ)</option>
                        <option value="Pacific/Guam">Pacific/Guam (グアム)</option>
                        <option value="Pacific/Saipan">Pacific/Saipan (サイパン)</option>
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
                    <p className="text-xs text-gray-400">
                      Enterで保存、Escapeでキャンセル
                    </p>
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
                    <p className="text-xs text-gray-400">
                      Enterで保存、Escapeでキャンセル
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center space-x-4">
                    {/* 時間要素 */}
                    <div className="flex items-center space-x-1">
                      <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
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
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                      </svg>
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
                      <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 114 0 2 2 0 01-4 0zm8 0a2 2 0 114 0 2 2 0 01-4 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-gray-500 cursor-pointer hover:text-purple-600 hover:bg-purple-50 px-2 py-1 rounded transition-colors">
                        予約
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 右側: ハンバーガーメニュー */}
            <div className="flex-shrink-0 p-4">
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </button>

              {/* ドロップダウンメニュー */}
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-[9999]">
                  <div className="py-1">
                    <button
                      onClick={() => handleMenuAction('moveUp')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                      </svg>
                      <span>上に移動</span>
                    </button>
                    <button
                      onClick={() => handleMenuAction('moveDown')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      <span>下に移動</span>
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => handleMenuAction('moveToDay')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                          </svg>
                          <span>別の日程に移動</span>
                        </div>
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      {/* 日程選択のカスケードメニュー */}
                      {showDaySelector && (
                        <div className="absolute left-full top-0 ml-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-[10000]">
                          <div className="py-1">
                            {filteredDaysForMove.length > 0 ? (
                              filteredDaysForMove.map((day) => (
                                <button
                                  key={day.id}
                                  onClick={() => handleDaySelect(day.id)}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                                >
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                  </svg>
                                  <span>日程 {day.day_number}</span>
                                </button>
                              ))
                            ) : (
                              <div className="px-4 py-2 text-sm text-gray-500">
                                移動可能な日程がありません
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => handleMenuAction('duplicateToDay')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                          </svg>
                          <span>別の日程に複製</span>
                        </div>
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      {/* 複製用のカスケードメニュー */}
                      {showDuplicateSelector && (
                        <div className="absolute left-full top-0 ml-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-[10000]">
                          <div className="py-1">
                            {filteredDaysForDuplicate.length > 0 ? (
                              filteredDaysForDuplicate.map((day) => (
                                <button
                                  key={day.id}
                                  onClick={() => handleDuplicateSelect(day.id)}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                                >
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                  </svg>
                                  <span>日程 {day.day_number}</span>
                                </button>
                              ))
                            ) : (
                              <div className="px-4 py-2 text-sm text-gray-500">
                                複製可能な日程がありません
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <hr className="my-1" />
                    <button
                      onClick={() => handleMenuAction('delete')}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span>Venue削除</span>
                    </button>
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* ティアドロップ形状の接続点（カードの下端） */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
        <svg width="8" height="12" viewBox="0 0 8 12" className="text-gray-300">
          <path d="M4 0C1.79 0 0 1.79 0 4c0 2.21 4 8 4 8s4-5.79 4-8c0-2.21-1.79-4-4-4z" fill="currentColor"/>
        </svg>
      </div>
    </div>
  )
}
