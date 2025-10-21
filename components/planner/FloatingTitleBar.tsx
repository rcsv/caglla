'use client'

import React from 'react'
import PublicAccessBadge from '@/components/common/icons/PublicAccessBadge'
import { getZIndexClass } from '@/lib/core/z-index'

export interface FloatingTitleBarProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  accessLevel: 'public' | 'private'
  actions?: React.ReactNode
}

export default function FloatingTitleBar({ title, accessLevel, actions, className, ...rest }: FloatingTitleBarProps) {
  const hasCustomZIndex = typeof className === 'string' && (className.includes('zidx-') || className.includes('z-['))
  return (
    <div
      className={[
        'sticky top-0 h-[53px] bg-white/90 backdrop-blur-sm border-b border-gray-200 flex items-center px-4',
        hasCustomZIndex ? '' : 'zidx-main-content',
        className,
      ].filter(Boolean).join(' ')}
      {...rest}
    >
      <div className="flex items-center justify-between w-full">
        <div className="text-sm md:text-base font-semibold text-gray-900 truncate">{title}</div>
        <div className="flex items-center gap-2">
          {actions}
          <PublicAccessBadge accessLevel={accessLevel} />
        </div>
      </div>
    </div>
  )
}


