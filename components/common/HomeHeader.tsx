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
  const menuRef = useRef<HTMLDivElement | null>(null)

  useClickOutside(menuRef, () => setOpen(false))

  const avatarBorderClass = (() => {
    const n = (planName || '').toLowerCase()
    if (n.includes('globetrotter')) return 'bg-purple-500'
    if (n.includes('backpacker')) return 'bg-blue-500'
    return 'bg-gray-200'
  })()

  const planNameClass = (() => {
    const n = (planName || '').toLowerCase()
    const base = 'text-xs truncate max-w-[160px]'
    if (n.includes('globetrotter')) return `${base} font-mono text-purple-600`
    if (n.includes('backpacker')) return `${base} text-blue-600`
    return `${base} text-gray-500`
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
              <span className="text-xl font-bold font-rajdhani whitespace-nowrap leading-none hidden sm:inline">{appName}</span>
            </Link>
            <nav className="hidden md:flex items-center gap-4 text-sm">
              <Link href="/home" className="text-gray-600 hover:text-gray-900">{t('travelGuide')}</Link>
              <Link href="/plan" className="text-gray-600 hover:text-gray-900">{t('nav.plan')}</Link>
              <Link href="/memories" className="text-gray-600 hover:text-gray-900">{t('memories')}</Link>
              {typeof window !== 'undefined' && process.env.NODE_ENV === 'development' && (
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
                  <div className="text-sm font-medium text-gray-900 truncate max-w-[160px]">{userName}</div>
                  <span 
                    className="text-base leading-none" 
                    title={LANGUAGE_NAMES[currentLanguage]?.native || currentLanguage}
                    aria-label={`Current language: ${LANGUAGE_NAMES[currentLanguage]?.native || currentLanguage}`}
                  >
                    {languageFlags[currentLanguage] || '🌐'}
                  </span>
                </div>
                <div className={`${planNameClass} hidden sm:block`}>{planName}</div>
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


