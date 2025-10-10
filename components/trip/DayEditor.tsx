'use client'
import logger from '@/lib/core/logger'

import { useState } from 'react'
import { Day, Itinerary } from '@/lib/core/types'
import { updateDay } from '@/lib/firebase/firestore'
import DailyRouteOptimizer from './DailyRouteOptimizer'

interface DayEditorProps {
  day: Day
  onUpdate: (updatedDay: Day) => void
  itinerarySummary?: string
  itineraries?: Itinerary[]
  onReorderItineraries?: (dayId: string, reorderedItineraries: Itinerary[]) => void
}

export default function DayEditor({ 
  day, 
  onUpdate, 
  itinerarySummary, 
  itineraries = [], 
  onReorderItineraries 
}: DayEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [description, setDescription] = useState(day.description || '')
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    if (isLoading) return
    
    setIsLoading(true)
    try {
      const updatedDay = await updateDay(day.id, { description })
      onUpdate(updatedDay)
      setIsEditing(false)
    } catch (error) {
      logger.error('日程の更新に失敗しました:', error)
      alert('日程の更新に失敗しました')
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

  if (isEditing) {
    return (
      <div className="space-y-2">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={itinerarySummary || "この日は何をする日？"}
          className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
          autoFocus
        />
        {isLoading && (
          <p className="text-sm text-gray-500">保存中...</p>
        )}
        <p className="text-xs text-gray-400">
          Enterで改行、Escapeでキャンセル、他の場所をクリックで保存
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 既存の編集機能 */}
      <div className="space-y-2">
        {day.description ? (
          <div 
            className="group cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
            onClick={() => setIsEditing(true)}
          >
            <p className="text-gray-600 whitespace-pre-wrap">{day.description}</p>
            <p className="mt-1 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
              クリックして編集
            </p>
          </div>
        ) : (
          <div 
            className="cursor-pointer hover:bg-gray-50 p-3 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors"
            onClick={() => setIsEditing(true)}
          >
            <p className="text-gray-400 italic">{itinerarySummary || "この日は何をする日？"}</p>
          </div>
        )}
      </div>

      {/* ルート最適化機能 */}
      {itineraries.length >= 2 && onReorderItineraries && (
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
