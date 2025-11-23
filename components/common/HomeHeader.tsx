'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { IconRenderer } from '@/components/common/icons/IconRenderer'
import { useClickOutside } from '@/hooks/useClickOutside'
import { getUserLanguage, LANGUAGE_NAMES } from '@/lib/utils/language'
import type { SupportedLanguage } from '@/lib/core/types'
import { CagllaLogo } from '@/components/common/icons/CagllaLogo'

export interface HomeHeaderProps {
  appName?: string
  userName: string
  planName: string
  avatarUrl?: string | null
  onLogout: () => void
  onChangePlan?: () => void
  userSlug?: string
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({
  appName = 'Caglla',
  userName,
  planName,
  avatarUrl,
  onLogout,
  onChangePlan,
  userSlug,
}) => {
  const { t } = require('@/lib/i18n')
  const [open, setOpen] = useState(false)
  const [yourTripsOpen, setYourTripsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const yourTripsRef = useRef<HTMLDivElement | null>(null)

  useClickOutside(menuRef, () => setOpen(false))
  useClickOutside(yourTripsRef, () => setYourTripsOpen(false))

  const avatarBorderClass = (() => {
    const n = (planName || '').toLowerCase()
    if (n.includes('globetrotter')) return 'bg-purple-500'
    if (n.includes('backpacker')) return 'bg-blue-500'
    return 'bg-gray-200'
  })()

  const planBadgeClass = (() => {
    const n = (planName || '').toLowerCase()
    const base =
      'inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-[11px] sm:text-xs font-semibold tracking-tight'
    if (n.includes('globetrotter')) return `${base} border-purple-200 bg-purple-50 text-purple-600`
    if (n.includes('backpacker')) return `${base} border-blue-200 bg-blue-50 text-blue-600`
    return `${base} border-gray-200 bg-gray-50 text-gray-600`
  })()

  // 言語→国旗のマッピング
  const languageFlags: Record<SupportedLanguage, string> = {
    ja: '🇯🇵',
    en: '🇺🇸',
    zh: '🇨🇳',
    ko: '🇰🇷',
    es: '🇪🇸',
    fr: '🇫🇷',
    de: '🇩🇪',
    it: '🇮🇹',
    pt: '🇵🇹'
  }

  // 現在の言語を取得
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(() => getUserLanguage())
  
  // 言語が変更された時に更新（クライアントサイドでのみ）
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentLanguage(getUserLanguage())
    }
  }, [])

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center min-h-14">
          {/* Left: Logo and Nav */}
          <div className="flex items-center gap-6">
            <Link href="/home" className="flex items-center gap-2 text-gray-900">
              <CagllaLogo className="w-8 h-8" />
              <span className="text-lg sm:text-xl font-bold font-rajdhani whitespace-nowrap leading-none">
                {appName}
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-4 text-sm">
              <Link href="/home" className="text-gray-600 hover:text-gray-900">Home</Link>
              <Link href="/feed" className="text-gray-600 hover:text-gray-900">Feed</Link>
              
              {/* Your Trips Dropdown */}
              <div className="relative" ref={yourTripsRef}>
                <button
                  onClick={() => setYourTripsOpen(v => !v)}
                  className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
                >
                  Your Trips
                  <svg
                    className={`w-4 h-4 transition-transform ${yourTripsOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {yourTripsOpen && (
                  <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 zidx-popup-menu">
                    <Link
                      href="/plan"
                      onClick={() => setYourTripsOpen(false)}
                      className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Upcomings
                    </Link>
                    <Link
                      href="/memories"
                      onClick={() => setYourTripsOpen(false)}
                      className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Memories
                    </Link>
                  </div>
                )}
              </div>

              <Link href="/trip-guide" className="text-gray-600 hover:text-gray-900">Writes</Link>
              
              {typeof window !== 'undefined' &&
                typeof process !== 'undefined' &&
                process.env?.NODE_ENV === 'development' && (
                <Link href="/dev-tools" className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900">
                  {t('devTools')}
                  <span className="px-1.5 py-0.5 text-xs font-semibold bg-emerald-500 text-white rounded">
                    {t('debug.badge')}
                  </span>
                </Link>
              )}
            </nav>
          </div>

          {/* Right: User name + avatar with menu */}
          <div className="relative" ref={menuRef}>
            <button onClick={() => setOpen(v => !v)} className="flex items-center gap-3">
              <div className="text-right leading-tight">
                <div className="flex items-center gap-1.5 justify-end">
                  <div className="text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-[160px]">{userName}</div>
                  <span 
                    className="text-base leading-none" 
                    title={LANGUAGE_NAMES[currentLanguage]?.native || currentLanguage}
                    aria-label={`Current language: ${LANGUAGE_NAMES[currentLanguage]?.native || currentLanguage}`}
                  >
                    {languageFlags[currentLanguage] || '🌐'}
                  </span>
                </div>
                <div className="flex justify-end">
                  <span className={`${planBadgeClass} max-w-[140px] sm:max-w-[160px] truncate`}>
                    {planName}
                  </span>
                </div>
              </div>
              <span className={`inline-flex p-[2px] rounded-full ${avatarBorderClass}`}>
                <Image
                  src={avatarUrl || '/default-avatar.png'}
                  alt="avatar"
                  width={36}
                  height={36}
                  className="h-9 w-9 rounded-full object-cover bg-white ring-1 ring-white"
                />
              </span>
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 zidx-popup-menu">
                {userSlug && (
                  <Link href={`/${userSlug}`} onClick={() => setOpen(false)} className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">{t('header.profile')}</Link>
                )}
                <button onClick={() => { setOpen(false); onChangePlan && onChangePlan() }} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">{t('header.changePlan')}</button>
                <button onClick={() => { setOpen(false); onLogout() }} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-50">{t('header.logout')}</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default HomeHeader


