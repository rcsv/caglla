'use client'

import React, { useState, useRef } from 'react'
import PublicAccessBadge from '@/components/common/icons/PublicAccessBadge'
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
}

export default function FloatingTitleBar({ title, accessLevel, actions, menuItems, className, ...rest }: FloatingTitleBarProps) {
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
      <div className="flex items-center justify-between w-full">
        <div className="text-sm md:text-base font-semibold text-gray-900 truncate">{title}</div>
        <div className="flex items-center gap-2">
          {actions}
          
          <PublicAccessBadge accessLevel={accessLevel} />
          
          {/* 「・・・」ボタンとメニュー */}
          {menuItems && menuItems.length > 0 && (
            <div className="relative" ref={menuRef}>
              <button
                ref={buttonRef}
                onClick={(e) => {
                  e.stopPropagation()
                  setShowMenu(!showMenu)
                }}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                aria-label={t('common.openMenu')}
                aria-expanded={showMenu}
                aria-haspopup="menu"
              >
                <Icon icon="mdi:dots-horizontal" className="w-5 h-5 text-gray-600" />
              </button>

              {/* ドロップダウンメニュー */}
              {showMenu && (
                <div
                  className="absolute right-0 mt-2 w-52 bg-white rounded-md shadow-lg border border-gray-200 zidx-popup-menu"
                  role="menu"
                  aria-orientation="vertical"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="py-1">
                    {menuItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          item.onClick()
                          setShowMenu(false)
                        }}
                        disabled={item.disabled}
                        role="menuitem"
                        aria-disabled={item.disabled}
                        className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                          item.disabled 
                            ? 'text-gray-400 cursor-not-allowed' 
                            : 'text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none'
                        }`}
                      >
                        {item.icon && <Icon icon={item.icon} className="w-4 h-4" />}
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


