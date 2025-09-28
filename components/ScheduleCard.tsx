'use client'

import { useState, useEffect, useRef } from 'react'
import { placesApiHelpers } from '@/lib/places-api'
import { PlaceData } from '@/lib/firestore'

interface ScheduleCardProps {
  itinerary: {
    id: string
    day_id: string
    sort_number: number
    title: string
    description?: string
    location?: string
    place_data?: PlaceData
    start_time?: string
    end_time?: string
    created_at: string
    updated_at: string
  }
  onUpdate?: (updatedItinerary: any) => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  onMoveToDay?: (itineraryId: string, targetDayId: string) => void
  onDelete?: (itineraryId: string) => void
}

export default function ScheduleCard({ 
  itinerary, 
  onUpdate, 
  onMoveUp, 
  onMoveDown, 
  onMoveToDay, 
  onDelete 
}: ScheduleCardProps) {
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [description, setDescription] = useState(itinerary.description || '')
  const [startTime, setStartTime] = useState(itinerary.start_time || '')
  const [endTime, setEndTime] = useState(itinerary.end_time || '')
  const [isSaving, setIsSaving] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const descriptionRef = useRef<HTMLTextAreaElement>(null)

  // メニューの外側クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // 写真のURLを取得
  const getPhotoUrl = () => {
    if (itinerary.place_data?.photos && itinerary.place_data.photos.length > 0) {
      return placesApiHelpers.getPhotoUrl(itinerary.place_data.photos[0].photo_reference, 300)
    }
    return null
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

  // メニューアイテムのクリック処理
  const handleMenuAction = (action: string) => {
    setShowMenu(false)
    
    switch (action) {
      case 'moveUp':
        onMoveUp?.()
        break
      case 'moveDown':
        onMoveDown?.()
        break
      case 'moveToDay':
        // TODO: 日付選択モーダルを表示
        console.log('Move to different day')
        break
      case 'delete':
        if (confirm('このVenueを削除しますか？')) {
          onDelete?.(itinerary.id)
        }
        break
    }
  }

  const photoUrl = getPhotoUrl()

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden h-40">
      <div className="flex h-full">
        {/* 左側: ソート番号とコンテンツ */}
        <div className="flex-1 p-4 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            {/* ソート番号 */}
            <div className="flex-shrink-0 mr-4">
              <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                {itinerary.sort_number}
              </div>
            </div>

            {/* メインコンテンツ */}
            <div className="flex-1 min-w-0">
              {/* タイトルとStar Rating */}
              <div className="flex items-center space-x-2 mb-3">
                <h4 className="font-semibold text-gray-900 text-lg">
                  {itinerary.title}
                </h4>
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
                    className="cursor-pointer text-sm text-gray-700 hover:bg-gray-50 p-2 rounded border border-transparent hover:border-gray-200 min-h-[2.5rem] flex items-center"
                  >
                    {description || (
                      <span className="text-gray-400 italic">Memo: メモを追加してください</span>
                    )}
                  </div>
                )}
              </div>

              {/* アクションボタン */}
              <div className="flex space-x-2">
                {/* 時間ボタン */}
                <button
                  onClick={() => {
                    const newTime = prompt('滞在時間を入力してください (例: 16:00 - 16:30)', 
                      startTime && endTime ? `${startTime} - ${endTime}` : '')
                    if (newTime) {
                      const [start, end] = newTime.split(' - ')
                      if (start) handleTimeUpdate('start_time', start.trim())
                      if (end) handleTimeUpdate('end_time', end.trim())
                    }
                  }}
                  className="flex items-center space-x-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">時間</span>
                </button>

                {/* コストボタン */}
                <button className="flex items-center space-x-1 px-3 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">費用</span>
                </button>

                {/* 予約ボタン */}
                <button className="flex items-center space-x-1 px-3 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 114 0 2 2 0 01-4 0zm8 0a2 2 0 114 0 2 2 0 01-4 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">予約</span>
                </button>
              </div>
            </div>

            {/* ハンバーガーメニュー */}
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
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
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
                    <button
                      onClick={() => handleMenuAction('moveToDay')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                      </svg>
                      <span>別の日程に移動</span>
                    </button>
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

        {/* 右側: 写真 */}
        <div className="flex-shrink-0 w-32 h-full">
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
              <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
