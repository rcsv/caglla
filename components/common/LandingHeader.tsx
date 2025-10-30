'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/common/Button'

export interface LandingHeaderProps {
  onLogin?: () => void
  showLoginButton?: boolean
}

export const LandingHeader: React.FC<LandingHeaderProps> = ({
  onLogin,
  showLoginButton = true
}) => {
  const { t } = require('@/lib/i18n')
  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 zidx-top-menu">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900">Caglla</span>
          </Link>

          <div className="flex items-center gap-6">
            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/#features" className="text-gray-600 hover:text-gray-900 transition-colors">
                {t('features')}
              </Link>
              <Link href="/#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">
                {t('pricing')}
              </Link>
              <Link href="/contact" className="text-gray-600 hover:text-gray-900 transition-colors">
                {t('contact')}
              </Link>
            </nav>

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

