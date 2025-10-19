'use client'
import { useState, useRef, useMemo, useCallback } from 'react'
import { Day, ReservationType } from '@/lib/core/types'
import { getZIndexClass } from '@/lib/core/z-index'
import { getReservationTypeIcon } from '@/lib/utils/reservation-utils'
import { useClickOutside } from '@/hooks/useClickOutside'
import logger from '@/lib/core/logger'

interface ScheduleCardMenuProps {
  isFirst: boolean
  isLast: boolean
  availableDays: Day[]
  currentDayId: string
  itineraryId: string
  hasReservation: boolean
  reservationType?: ReservationType
  onMoveUp: () => void
  onMoveDown: () => void
  onMoveToDay: (dayId: string) => void
  onDuplicateToDay: (dayId: string) => void
  onReservation: () => void
  onDelete: () => void
}

export function ScheduleCardMenu({
  isFirst,
  isLast,
  availableDays,
  currentDayId,
  itineraryId,
  hasReservation,
  reservationType,
  onMoveUp,
  onMoveDown,
  onMoveToDay,
  onDuplicateToDay,
  onReservation,
  onDelete
}: ScheduleCardMenuProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [showDaySelector, setShowDaySelector] = useState(false)
  const [showDuplicateSelector, setShowDuplicateSelector] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // メニュー外クリックで閉じる
  useClickOutside(menuRef, () => {
    if (showMenu) {
      setShowMenu(false)
      setShowDaySelector(false)
      setShowDuplicateSelector(false)
    }
  })

  // 利用可能な日程をフィルタリング
  const filteredDaysForMove = useMemo(
    () => availableDays.filter(day => day.id !== currentDayId),
    [availableDays, currentDayId]
  )

  const handleMenuAction = useCallback((action: string) => {
    switch (action) {
      case 'moveUp':
        setShowMenu(false)
        onMoveUp()
        break
      case 'moveDown':
        setShowMenu(false)
        onMoveDown()
        break
      case 'moveToDay':
        setShowDaySelector(true)
        break
      case 'duplicateToDay':
        setShowDuplicateSelector(true)
        break
      case 'reservation':
        setShowMenu(false)
        onReservation()
        break
      case 'delete':
        setShowMenu(false)
        if (confirm('このVenueを削除しますか？')) {
          onDelete()
        }
        break
    }
  }, [onMoveUp, onMoveDown, onReservation, onDelete])

  const handleDaySelect = useCallback(async (targetDayId: string) => {
    setShowDaySelector(false)
    setShowMenu(false)

    if (targetDayId === currentDayId) return

    try {
      const response = await fetch('/api/itineraries/move-to-day', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itinerary_id: itineraryId, target_day_id: targetDayId })
      })
      if (response.ok) {
        onMoveToDay(targetDayId)
      } else {
        logger.error('Failed to move itinerary')
        alert('日程の移動に失敗しました')
      }
    } catch (error) {
      logger.error('Error moving itinerary:', error)
      alert('日程の移動に失敗しました')
    }
  }, [itineraryId, currentDayId, onMoveToDay])

  const handleDuplicateSelect = useCallback(async (targetDayId: string) => {
    setShowDuplicateSelector(false)
    setShowMenu(false)

    try {
      const response = await fetch('/api/itineraries/duplicate-to-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itinerary_id: itineraryId, target_day_id: targetDayId })
      })
      if (response.ok) {
        onDuplicateToDay(targetDayId)
      } else {
        logger.error('Failed to duplicate itinerary')
        alert('日程の複製に失敗しました')
      }
    } catch (error) {
      logger.error('Error duplicating itinerary:', error)
      alert('日程の複製に失敗しました')
    }
  }, [itineraryId, onDuplicateToDay])

  return (
    <div className="flex-shrink-0 p-4">
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          aria-label="メニューを開く"
          aria-expanded={showMenu}
          aria-haspopup="menu"
        >
          <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>

        {/* ドロップダウンメニュー */}
        {showMenu && (
          <div 
            className={`fixed bg-white rounded-md shadow-lg border border-gray-200 ${getZIndexClass('POPUP_MENU')}`} 
            role="menu"
            aria-orientation="vertical"
            style={{
              top: menuRef.current ? menuRef.current.getBoundingClientRect().bottom + 4 : 0,
              left: menuRef.current ? menuRef.current.getBoundingClientRect().left : 0,
              width: '192px'
            }}
          >
            <div className="py-1">
              <button
                onClick={() => handleMenuAction('moveUp')}
                disabled={isFirst}
                role="menuitem"
                className={`w-full text-left px-4 py-2 text-sm flex items-center space-x-2 ${
                  isFirst 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                <span>上に移動</span>
              </button>
              <button
                onClick={() => handleMenuAction('moveDown')}
                disabled={isLast}
                role="menuitem"
                className={`w-full text-left px-4 py-2 text-sm flex items-center space-x-2 ${
                  isLast 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span>下に移動</span>
              </button>
              <div className="relative">
                <button
                  onClick={() => handleMenuAction('moveToDay')}
                  role="menuitem"
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
                            role="menuitem"
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
                  role="menuitem"
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
                      {availableDays.length > 0 ? (
                        availableDays.map((day) => (
                          <button
                            key={day.id}
                            onClick={() => handleDuplicateSelect(day.id)}
                            role="menuitem"
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
                onClick={() => handleMenuAction('reservation')}
                role="menuitem"
                className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 114 0 2 2 0 01-4 0zm8 0a2 2 0 114 0 2 2 0 01-4 0z" clipRule="evenodd" />
                </svg>
                <span>予約情報</span>
                {hasReservation && reservationType && (
                  <span className="ml-auto text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {getReservationTypeIcon(reservationType)}
                  </span>
                )}
              </button>
              <button
                onClick={() => handleMenuAction('delete')}
                role="menuitem"
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
  )
}

