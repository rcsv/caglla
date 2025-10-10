'use client'
import logger from '@/lib/logger'

import { useDroppable } from '@dnd-kit/core'
import { useEffect } from 'react'

interface DayDropZoneProps {
  dayId: string
  dayNumber: number
  isOver?: boolean
  children: React.ReactNode
}

export default function DayDropZone({ dayId, dayNumber, isOver, children }: DayDropZoneProps) {
  const { setNodeRef, isOver: isDroppableOver } = useDroppable({
    id: `day-${dayId}`,
    data: {
      type: 'day',
      dayId,
      dayNumber
    }
  })

  const isCurrentlyOver = isOver || isDroppableOver

  // ドロップゾーンの状態をログ
  useEffect(() => {
    if (isDroppableOver) {
      logger.debug('DayDropZone is over:', dayId)
    }
  }, [isDroppableOver, dayId])

  return (
    <div 
      ref={setNodeRef}
      className={`bg-white rounded-lg shadow-sm p-6 transition-all duration-200 ${
        isCurrentlyOver 
          ? 'bg-blue-50 border-2 border-blue-400 border-dashed shadow-lg' 
          : 'border border-gray-200 hover:border-gray-300'
      }`}
    >
      {children}
    </div>
  )
}
