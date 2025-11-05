import type { DraggableAttributes } from '@dnd-kit/core'
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities'
import { t } from '@/lib/i18n'

interface DragHandleProps {
  attributes?: DraggableAttributes
  listeners?: SyntheticListenerMap
  isDragging?: boolean
  className?: string
}

export function DragHandle({ attributes, listeners, isDragging = false, className = '' }: DragHandleProps) {
  return (
    <div 
      {...attributes}
      {...listeners}
      className={`p-1 cursor-grab active:cursor-grabbing hover:bg-gray-100 rounded transition-colors mt-4 ${isDragging ? 'opacity-50' : ''} ${className}`}
      title={t('common.dragHandle')}
    >
      <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
        <path d="M7 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM7 8a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM7 14a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM13 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM13 8a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM13 14a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" />
      </svg>
    </div>
  )
}

