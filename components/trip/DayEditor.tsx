'use client'
import logger from '@/lib/core/logger'

import { useState } from 'react'
import { Day, Itinerary } from '@/lib/core/types'
import { t } from '@/lib/i18n'
import DailyRouteOptimizer from './DailyRouteOptimizer'
import { useTrip } from '@/app/(planner)/[userSlug]/[tripSlug]/TripProvider'
import { makeAuthenticatedRequest } from '@/lib/api/helpers'

interface DayEditorProps {
  day: Day
  canEdit?: boolean
  onUpdate: (updatedDay: Day) => void
  onDelete?: (dayId: string) => void
  itinerarySummary?: string
  itineraries?: Itinerary[]
  onReorderItineraries?: (dayId: string, reorderedItineraries: Itinerary[]) => void
}

export default function DayEditor({ 
  day, 
  canEdit = true,
  onUpdate, 
  onDelete,
  itinerarySummary, 
  itineraries = [], 
  onReorderItineraries 
}: DayEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [description, setDescription] = useState(day.description || '')
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { trip } = useTrip()

  const handleSave = async () => {
    if (isLoading || !trip) return
    
    setIsLoading(true)
    try {
      // API経由でDayを更新（認証付き）
      const response = await makeAuthenticatedRequest(`/api/trip/${trip.slug}/day`, {
        method: 'PUT',
        body: JSON.stringify({
          dayId: day.id,
          updates: { description }
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update day')
      }
      
      const updatedDay = await response.json()
      onUpdate(updatedDay)
      setIsEditing(false)
    } catch (error) {
      logger.error('日程の更新に失敗しました:', error)
      alert(t('dayEditor.updateError'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleBlur = () => {
    // フォーカスアウト時に自動保存
    if (description !== (day.description || '')) {
      handleSave()
    } else {
      setIsEditing(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      // Escapeキーでキャンセル
      setDescription(day.description || '')
      setIsEditing(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete || isDeleting || !trip) return
    
    // 削除確認
    const hasItineraries = itineraries && itineraries.length > 0
    const confirmMessage = hasItineraries
      ? t('dayEditor.deleteConfirmWithItineraries')
      : t('dayEditor.deleteConfirm')
    
    if (!window.confirm(confirmMessage)) {
      return
    }
    
    setIsDeleting(true)
    
    // 楽観的UI更新: 削除ボタンを押したらすぐに親に通知
    onDelete(day.id)
    
    try {
      const response = await makeAuthenticatedRequest(`/api/trip/${trip.slug}/day?dayId=${day.id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete day')
      }
      
      // 成功したので何もしない（すでにUIから削除済み）
    } catch (error) {
      logger.error('日程の削除に失敗しました:', error)
      alert(t('dayEditor.deleteError'))
      // エラーの場合、親コンポーネントでrefreshTripが呼ばれて元に戻る
    } finally {
      setIsDeleting(false)
    }
  }

  if (isEditing) {
    return (
      <div className="space-y-2">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={itinerarySummary || t('dayEditor.placeholder')}
          className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
          autoFocus
        />
        {isLoading && (
          <p className="text-sm text-gray-500">{t('dayEditor.saving')}</p>
        )}
        <p className="text-xs text-gray-400">
          {t('dayEditor.editHint')}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 既存の編集機能 + 削除ボタン */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
        {day.description ? (
          <div 
            className={canEdit ? "group cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors" : "p-2"}
            onClick={canEdit ? () => setIsEditing(true) : undefined}
          >
            <p className="text-gray-600 whitespace-pre-wrap">{day.description}</p>
            {canEdit && (
              <p className="mt-1 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                {t('dayEditor.clickToEdit')}
              </p>
            )}
          </div>
        ) : canEdit ? (
          <div 
            className="cursor-pointer hover:bg-gray-50 p-3 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors"
            onClick={() => setIsEditing(true)}
          >
            <p className="text-gray-400 italic">{itinerarySummary || t('dayEditor.placeholder')}</p>
          </div>
        ) : (
          <div className="p-3">
            <p className="text-gray-400 italic">{itinerarySummary || t('dayEditor.noDescription')}</p>
          </div>
        )}
          </div>
          {canEdit && onDelete && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-shrink-0 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={t('dayEditor.deleteDay')}
            >
              {isDeleting ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ルート最適化機能 - 編集権限がある場合のみ表示 */}
      {canEdit && itineraries.length >= 2 && onReorderItineraries && (
        <div className="border-t pt-4">
          <DailyRouteOptimizer
            dayId={day.id}
            itineraries={itineraries}
            onReorderItineraries={onReorderItineraries}
          />
        </div>
      )}
    </div>
  )
}
