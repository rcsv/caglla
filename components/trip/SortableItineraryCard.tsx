'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { getZIndexClass } from '@/lib/core/z-index'
import ScheduleCard from './ScheduleCard'
import { Itinerary, PlaceData, Day, Trip } from '@/lib/core/types'

interface SortableItineraryCardProps {
  itinerary: Itinerary
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
  isSelected?: boolean
  isFirst?: boolean
  isLast?: boolean
}

export default function SortableItineraryCard(props: SortableItineraryCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.itinerary.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${isDragging ? getZIndexClass('MAIN_CONTENT') : ''}`}
    >
      <ScheduleCard 
        {...props} 
        dragHandleProps={{ attributes, listeners }}
        isDragging={isDragging}
      />
    </div>
  )
}
