'use client'

import React, { useState, useRef } from 'react'
// Access badge is shown on hero image (Summary). Not displayed in header.
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
        'sticky top-0 bg-white/90 backdrop-blur-sm border-b border-gray-200 px-4',
        hasCustomZIndex ? '' : 'zidx-main-content',
        className,
      ].filter(Boolean).join(' ')}
      {...rest}
    >
      <div className="flex items-center justify-between w-full gap-3 h-[53px]">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/home" aria-label="Go to home" className="inline-flex items-center justify-center flex-shrink-0">
            <CagllaLogo className="w-8 h-8" />
          </Link>
          <div className="text-sm md:text-base font-semibold text-gray-900 truncate">{title}</div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {actions}
          {/* dots menu removed from header; moved to NavigationMenu bottom area */}
        </div>
      </div>
      {mobileToolbar && (
        <div className="md:hidden pb-3 w-full">{mobileToolbar}</div>
      )}
    </div>
  )
}


