'use client'

import { useAuth } from '@/lib/contexts/auth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/common/Button'
import Loading from '@/components/common/Loading'
import Link from 'next/link'
import { StaticPageLayout } from '@/components/common/static/StaticPageLayout'
import { Section } from '@/components/common/static/Section'
import { SolidCard } from '@/components/common/static/SolidCard'

export default function HomePage() {
  const { user, loading, signInWithGoogle } = useAuth()
  const router = useRouter()
  const [showCookieDialog, setShowCookieDialog] = useState(false)
  const { t } = require('@/lib/i18n')

  useEffect(() => {
    if (user && !loading) {
      router.push('/home')
    }
    // Check if user has already accepted cookies
    const cookieConsent = localStorage.getItem('cookieConsent')
    if (!cookieConsent) {
      setShowCookieDialog(true)
    }
  }, [user, loading, router])

  const handleAcceptCookies = () => {
    localStorage.setItem('cookieConsent', 'true')
    setShowCookieDialog(false)
  }

  const handleRejectCookies = () => {
    localStorage.setItem('cookieConsent', 'rejected')
    setShowCookieDialog(false)
  }

  if (loading) {
    return <Loading fullScreen size="lg" />
  }

  return (
    <StaticPageLayout showLoginButton>
      {/* Hero */}
      <section>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
          <div className="lg:col-span-9">
            <h1 className="leading-[0.8] tracking-tight bg-text-image text-transparent bg-clip-text font-extrabold uppercase text-[clamp(3.5rem,10vw,9rem)]">
              <span className="block">{t('home.hero.line1')}</span>
              <span className="block">{t('home.hero.line2')}</span>
              <span className="block">{t('home.hero.line3')}</span>
            </h1>
          </div>
          <div className="lg:col-span-3 flex items-end">
            <div className="relative z-10 bg-white/85 backdrop-blur-sm p-6 border border-gray-200">
              <p className="text-lg md:text-xl text-gray-800 leading-relaxed">{t('home.intro')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Primary CTA */}
      <Section title={t('home.cta.primary.title')}>
        <SolidCard className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <Button
              variant="primary"
              size="lg"
              onClick={signInWithGoogle}
              className="px-8 py-4 text-lg font-semibold !rounded-md"
            >
              {t('home.cta.primary.button')}
            </Button>
            <Link href="/features" className="text-indigo-600 underline decoration-dotted">{t('home.cta.primary.seeFeatures')}</Link>
          </div>
        </SolidCard>
      </Section>

      {/* Features */}
      <Section title={t('home.features.title')}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <SolidCard className="p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-3">{t('home.features.card1.title')}</h3>
            <p className="text-gray-600">{t('home.features.card1.text')}</p>
          </SolidCard>
          <SolidCard className="p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-3">{t('home.features.card2.title')}</h3>
            <p className="text-gray-600">{t('home.features.card2.text')}</p>
          </SolidCard>
          <SolidCard className="p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-3">{t('home.features.card3.title')}</h3>
            <p className="text-gray-600">{t('home.features.card3.text')}</p>
          </SolidCard>
        </div>
      </Section>

      {/* CTA */}
      <section className="text-center">
        <div className="bg-emerald-600 p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">{t('home.cta.bottom.title')}</h2>
          <p className="text-xl mb-8 opacity-90">{t('home.cta.bottom.subtitle')}</p>
          <Button
            variant="primary"
            size="lg"
            onClick={signInWithGoogle}
            className="px-8 py-3 font-semibold !rounded-md"
          >
            Get Started
          </Button>
        </div>
      </section>

      {/* Cookie Consent Dialog */}
      {showCookieDialog && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl zidx-dialog-popup p-6 md:px-8 md:py-6">
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">{t('home.cookie.title')}</h3>
                <p className="text-sm text-gray-600">
                  {t('home.cookie.text')}
                  <Link href="/privacy" className="text-emerald-600 hover:underline ml-1">
                    {t('home.cookie.more')}
                  </Link>
                </p>
              </div>
              <div className="flex gap-3 flex-shrink-0">
                <Button
                  variant="secondary"
                  onClick={handleRejectCookies}
                  className="px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  {t('home.cookie.reject')}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleAcceptCookies}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {t('home.cookie.accept')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </StaticPageLayout>
  )
}
