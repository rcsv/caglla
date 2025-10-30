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
              <span className="block">Travel</span>
              <span className="block">Planning</span>
              <span className="block">Simplified</span>
            </h1>
          </div>
          <div className="lg:col-span-3 flex items-end">
            <div className="relative z-10 bg-white/85 backdrop-blur-sm p-6 border border-gray-200">
              <p className="text-lg md:text-xl text-gray-800 leading-relaxed">
                詳細な旅程、宿泊先、観光スポットまで一括管理。Google Maps連携で美しくシンプルに。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Primary CTA */}
      <Section title="Get Started">
        <SolidCard className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <Button
              variant="secondary"
              size="lg"
              onClick={signInWithGoogle}
              className="px-8 py-4 text-lg font-semibold border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 bg-white"
            >
              Googleで始める
            </Button>
            <Link href="/#features" className="text-indigo-600 underline decoration-dotted">機能を見る</Link>
          </div>
        </SolidCard>
      </Section>

      {/* Features */}
      <Section title="Features">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <SolidCard className="p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-3">詳細な旅行計画</h3>
            <p className="text-gray-600">日別の旅程、宿泊、スポットを一括管理。</p>
          </SolidCard>
          <SolidCard className="p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-3">チーム共有</h3>
            <p className="text-gray-600">家族や友人と共同編集、リアルタイム共有。</p>
          </SolidCard>
          <SolidCard className="p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-3">どこでもアクセス</h3>
            <p className="text-gray-600">全デバイスで美しく表示。</p>
          </SolidCard>
        </div>
      </Section>

      {/* CTA */}
      <section className="text-center">
        <div className="bg-emerald-600 p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">今すぐ始めましょう</h2>
          <p className="text-xl mb-8 opacity-90">無料でお試し。必要に応じていつでもアップグレード。</p>
          <Button
            variant="secondary"
            size="lg"
            onClick={signInWithGoogle}
            className="px-8 py-3 bg-white text-emerald-600 font-semibold hover:bg-gray-100 border border-emerald-200"
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
                <h3 className="font-semibold text-gray-900 mb-2">クッキーについて</h3>
                <p className="text-sm text-gray-600">
                  このサイトでは、サービスの提供と分析のためにクッキーを使用しています。サイトを利用することで、クッキーの使用に同意したものとみなされます。
                  <Link href="/privacy" className="text-emerald-600 hover:underline ml-1">
                    詳細を見る
                  </Link>
                </p>
              </div>
              <div className="flex gap-3 flex-shrink-0">
                <Button
                  variant="secondary"
                  onClick={handleRejectCookies}
                  className="px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  拒否
                </Button>
                <Button
                  variant="primary"
                  onClick={handleAcceptCookies}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  同意する
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </StaticPageLayout>
  )
}
