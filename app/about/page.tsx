'use client'

import React from 'react'
import { LandingHeader } from '@/components/common/LandingHeader'
import { LandingFooter } from '@/components/common/LandingFooter'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <LandingHeader showLoginButton={false} />
      
      <main className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="page-rail space-y-20">
          {/* Hero Section */}
          <section>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
              {/* Heading */}
              <div className="lg:col-span-9">
                <h1 className="leading-[0.8] tracking-tight bg-text-image text-transparent bg-clip-text font-extrabold uppercase text-[clamp(4rem,12vw,11rem)]">
                  <span className="block">
                    Travel
                  </span>
                  <span className="block">
                    Planning
                  </span>
                  <span className="block">
                    Simplified
                  </span>
                </h1>
              </div>
              {/* Intro copy */}
              <div className="lg:col-span-3 flex items-end">
                <div className="relative z-10 bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg">
                  <p className="text-lg md:text-xl text-gray-800 leading-relaxed">
                    Caglla は、旅行計画を美しく、簡単に管理できるプラットフォームです。複雑な旅程管理を誰でも使える直感的なツールに変えることで、旅行の楽しさを最大化します。
                  </p>
                </div>
              </div>
            </div>
          </section>

        {/* Our Story */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Left title */}
            <div className="md:col-span-4 headline-marker">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Our Story</h2>
            </div>
            {/* Right content */}
            <div className="md:col-span-8">
              <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10">
                <div className="space-y-4 text-gray-700 leading-relaxed">
                  <p>
                    2024年、私たちは旅行計画の煩雑さに直面していました。複数のアプリ、散らばったメモ、紙の地図...。本来楽しいはずの旅行準備が、ストレスの原因になっていたのです。
                  </p>
                  <p>
                    「もっと簡単に、もっと美しく、旅行を管理できるツールがあればいいのに」
                  </p>
                  <p>
                    そんな想いから、Cagllaは誕生しました。Google Mapsとシームレスに連携し、日別の詳細な旅程、宿泊先、レストラン、観光スポットまで、すべてを一箇所で管理。家族や友人とリアルタイムで共有しながら、みんなで一緒に最高の旅を作り上げる。それがCagllaのビジョンです。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission & Values */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-4 headline-marker">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Our Mission & Values</h2>
            </div>
            <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Value 1 */}
            <div className="bg-white rounded-xl shadow-md p-8 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Simplicity First</h3>
              <p className="text-gray-600">
                複雑な機能よりも、誰でも使える直感的なデザインを優先します。
                旅行計画は楽しくあるべきです。
              </p>
            </div>

            {/* Value 2 */}
            <div className="bg-white rounded-xl shadow-md p-8 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Collaboration</h3>
              <p className="text-gray-600">
                旅行は一人で行くものではありません。
                チームでの計画を簡単にするツールを提供します。
              </p>
            </div>

            {/* Value 3 */}
            <div className="bg-white rounded-xl shadow-md p-8 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Privacy & Security</h3>
              <p className="text-gray-600">
                あなたの旅行データは大切です。
                最高レベルのセキュリティで保護します。
              </p>
            </div>
            </div>
            </div>
        </section>

        {/* What We're Building */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-4 headline-marker">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">What We're Building</h2>
            </div>
            <div className="md:col-span-8 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-8 md:p-12">
              <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">詳細な旅程管理</h3>
                  <p className="text-gray-700">
                    日別のスケジュール、時間ごとの予定、宿泊先、レストラン、観光スポットまで、すべてを一箇所で管理。
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Google Maps連携</h3>
                  <p className="text-gray-700">
                    地図上で視覚的に確認しながら、最適なルートを計画。距離や所要時間も自動計算。
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">リアルタイム共有</h3>
                  <p className="text-gray-700">
                    家族や友人と旅行プランを共有。みんなで一緒に編集して、最高の旅を作り上げましょう。
                  </p>
                </div>
              </div>
              </div>
            </div>
            </div>
        </section>

        {/* Stats */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="bg-white rounded-xl shadow-md p-8">
              <div className="text-4xl font-bold text-emerald-600 mb-2">2024</div>
              <div className="text-gray-600">設立年</div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-8">
              <div className="text-4xl font-bold text-emerald-600 mb-2">∞</div>
              <div className="text-gray-600">旅行の可能性</div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-8">
              <div className="text-4xl font-bold text-emerald-600 mb-2">100%</div>
              <div className="text-gray-600">情熱を注いで開発中</div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <div className="bg-emerald-600 rounded-2xl p-12 text-white">
            <h2 className="text-3xl font-bold mb-4">Join Us on This Journey</h2>
            <p className="text-xl mb-8 opacity-90">
              一緒に、旅行計画の未来を作りましょう
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/contact"
                className="px-8 py-3 bg-white text-emerald-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                お問い合わせ
              </a>
              <a
                href="/"
                className="px-8 py-3 bg-emerald-700 text-white rounded-lg font-semibold hover:bg-emerald-800 transition-colors"
              >
                始めてみる
              </a>
            </div>
          </div>
        </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  )
}

