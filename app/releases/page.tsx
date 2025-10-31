'use client'

import React from 'react'
import { StaticPageLayout } from '@/components/common/static/StaticPageLayout'
import { Section } from '@/components/common/static/Section'
import { SolidCard } from '@/components/common/static/SolidCard'

export default function ReleasesPage() {
  const updated = new Date().toLocaleDateString('en-US')
  return (
    <StaticPageLayout>
      <section>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
          <div className="lg:col-span-9">
            <h1 className="leading-[0.8] tracking-tight bg-text-image text-transparent bg-clip-text font-extrabold uppercase text-[clamp(4rem,12vw,11rem)] font-rajdhani">
              <span className="block">Release Notes</span>
            </h1>
          </div>
          <div className="lg:col-span-3 flex items-end">
            <div className="relative z-10 bg-white/85 backdrop-blur-sm p-6 border border-gray-200">
              <p className="text-lg md:text-xl text-gray-800 leading-relaxed">Last updated: {updated}</p>
            </div>
          </div>
        </div>
      </section>

      <Section title="v1.9.1 (Unreleased)">
        <SolidCard className="p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Changes since v1.9.0</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">🚀 Features</h4>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>About Usページの新デザインを追加</li>
                <li>Jest + React Testing Library導入、Playwright E2E基盤追加</li>
                <li>Google Cloud Secret Manager統合とFirebase App Hosting対応</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">🐛 Fixes</h4>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Firebase App Hostingの環境変数/ビルドエラーの修正</li>
                <li>TripMapの無限ループとslugハンドリングの修正</li>
                <li>Timezone/テスト関連のビルド修正</li>
              </ul>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">📝 Docs/Chore</h4>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>コマンドをpnpmへ統一</li>
                <li>ロックファイル/設定の同期更新</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">✅ Tests</h4>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>ユニットテストとE2Eシナリオの拡充</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">🔀 Merges</h4>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>support/v1.9 の修正をmainへマージ</li>
              </ul>
            </div>
          </div>
        </SolidCard>
      </Section>
    </StaticPageLayout>
  )
}