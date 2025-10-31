'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/common/Button'
import { CagllaLogo } from '@/components/common/icons/CagllaLogo'

export interface LandingHeaderProps {
  onLogin?: () => void
  showLoginButton?: boolean
}

export const LandingHeader: React.FC<LandingHeaderProps> = ({
  onLogin,
  showLoginButton = true
}) => {
  const { t } = require('@/lib/i18n')
  const { LanguageSwitcher } = require('@/components/common/LanguageSwitcher')
  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 zidx-top-menu">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <CagllaLogo className="w-8 h-8" />
            <span className="text-xl font-bold text-gray-900 font-rajdhani">Caglla</span>
          </Link>

          <div className="flex items-center gap-6">
            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/features" className="text-gray-600 hover:text-gray-900 transition-colors">
                {t('features')}
              </Link>
              <Link href="/pricing" className="text-gray-600 hover:text-gray-900 transition-colors">
                {t('pricing')}
              </Link>
              <Link href="/contact" className="text-gray-600 hover:text-gray-900 transition-colors">
                {t('contact')}
              </Link>
            </nav>

            <LanguageSwitcher className="hidden md:inline-block" />
            {/* CTA Button */}
            {showLoginButton && onLogin && (
              <Button
                variant="primary"
                onClick={onLogin}
                className="px-6 py-2"
              >
                {t('login')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default LandingHeader

