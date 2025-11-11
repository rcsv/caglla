'use client'

import React, { useState, useRef } from 'react'
import PublicAccessBadge from '@/components/common/icons/PublicAccessBadge'
import Link from 'next/link'
import { CagllaLogo } from '@/components/common/icons/CagllaLogo'
import { useClickOutside } from '@/hooks/useClickOutside'
import { Icon } from '@iconify/react'
import { t } from '@/lib/i18n'

export interface FloatingTitleBarProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  accessLevel: 'public' | 'private'
  actions?: React.ReactNode
  menuItems?: Array<{
    id: string
    label: string
    icon?: string
    onClick: () => void
    disabled?: boolean
  }>
  onToggleMobileMenu?: () => void
  mobileMenuOpen?: boolean
  mobileToolbar?: React.ReactNode
}

export default function FloatingTitleBar({
  title,
  accessLevel,
  actions,
  menuItems,
  className,
  onToggleMobileMenu,
  mobileMenuOpen = false,
  mobileToolbar,
  ...rest
}: FloatingTitleBarProps) {
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useClickOutside(menuRef, () => {
    if (showMenu) {
      setShowMenu(false)
    }
  }, showMenu)

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
      <div className="flex items-center justify-between w-full gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Link href="/home" aria-label="Go to home" className="md:hidden inline-flex items-center justify-center">
            <CagllaLogo className="w-7 h-7" />
          </Link>
          <div className="text-sm md:text-base font-semibold text-gray-900 truncate">{title}</div>
        </div>
        <div className="flex items-center gap-2">
          {actions}
          
          <PublicAccessBadge accessLevel={accessLevel} />
          {/* dots menu removed from header; moved to NavigationMenu bottom area */}
        </div>
      </div>
      {mobileToolbar && (
        <div className="md:hidden mt-3 w-full">{mobileToolbar}</div>
      )}
    </div>
  )
}


