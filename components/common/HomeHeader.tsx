'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import PlannerIcon from '@/components/common/icons/PlannerIcon'
import { getZIndexClass } from '@/lib/z-index-layers'

export interface HomeHeaderProps {
  appName?: string
  userName: string
  planName: string
  avatarUrl?: string | null
  onOpenSettings: () => void
  onLogout: () => void
  onChangePlan?: () => void
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({
  appName = 'Caglla',
  userName,
  planName,
  avatarUrl,
  onOpenSettings,
  onLogout,
  onChangePlan,
}) => {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Left: Logo and Nav */}
          <div className="flex items-center gap-6">
            <Link href="/home" className="flex items-center gap-2 text-gray-900">
              <span className="inline-flex items-center justify-center rounded-lg bg-emerald-500 text-white font-bold h-8 w-8">
                <PlannerIcon className="h-5 w-5" />
              </span>
              <span className="text-xl font-bold">{appName}</span>
            </Link>
            <nav className="hidden md:flex items-center gap-4 text-sm">
              <Link href="/home" className="text-gray-600 hover:text-gray-900">Travel Guide</Link>
              <Link href="/home#memories" className="text-gray-600 hover:text-gray-900">Memories</Link>
            </nav>
          </div>

          {/* Right: User name + avatar with menu */}
          <div className="relative" ref={menuRef}>
            <button onClick={() => setOpen(v => !v)} className="flex items-center gap-3">
              <div className="text-right leading-tight">
                <div className="text-sm font-medium text-gray-900 truncate max-w-[160px]">{userName}</div>
                <div className="text-xs text-gray-500 truncate max-w-[160px]">{planName}</div>
              </div>
              <img
                src={avatarUrl || '/default-avatar.png'}
                alt="avatar"
                className="h-9 w-9 rounded-full object-cover border border-gray-200"
              />
            </button>

            {open && (
              <div className={`absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 ${getZIndexClass('POPUP_MENU')}`}>
                <button onClick={() => { setOpen(false); onChangePlan && onChangePlan() }} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">プランを変更</button>
                <button onClick={() => { setOpen(false); onOpenSettings() }} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">設定</button>
                <button onClick={() => { setOpen(false); onLogout() }} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-50">ログアウト</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default HomeHeader


