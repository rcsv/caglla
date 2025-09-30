'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { getZIndexClass } from '@/lib/z-index-layers'
import ScheduleCard from './ScheduleCard'
import { Itinerary, PlaceData } from '@/lib/types'

interface SortableItineraryCardProps {
  itinerary: Itinerary
  previousPlace?: PlaceData | null
  nextPlace?: PlaceData | null
  onUpdate?: (updatedItinerary: any) => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  onMoveToDay?: (itineraryId: string, targetDayId: string) => void
  onDuplicateToDay?: (itineraryId: string, targetDayId: string) => void
  onDelete?: (itineraryId: string) => void
  onItineraryClick?: (itineraryId: string) => void
  availableDays?: Array<{
    id: string
    day_number: number
    date: string
  }>
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
      className={`${isDragging ? getZIndexClass('MAIN_CONTENT', 1) : ''}`}
    >
      <ScheduleCard 
        {...props} 
        dragHandleProps={{ attributes, listeners }}
        isDragging={isDragging}
      />
    </div>
  )
}
