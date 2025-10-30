'use client'

import React from 'react'
import { StaticPageLayout } from '@/components/common/static/StaticPageLayout'
import { Section } from '@/components/common/static/Section'
import { SolidCard } from '@/components/common/static/SolidCard'
import { SearchIcon } from '@/components/common/icons/SearchIcon'
import { CalendarIcon } from '@/components/common/icons/CalendarIcon'
import { PlannerIcon } from '@/components/common/icons/PlannerIcon'
import { LocationIcon } from '@/components/common/icons/LocationIcon'
import { RocketIcon } from '@/components/common/icons/RocketIcon'
import { CloudIcon } from '@/components/common/icons/CloudIcon'
import { WarningIcon } from '@/components/common/icons/WarningIcon'
import { PieChartIcon } from '@/components/common/icons/PieChartIcon'

export default function DocsPage() {
  const [query, setQuery] = React.useState('')

  const guides = [
    {
      id: 'getting-started',
      title: 'はじめに',
      description: 'アカウント作成、初期設定、最初の旅の作成まで',
      icon: <RocketIcon className="h-6 w-6 text-indigo-600" />,
      links: [
        { label: 'About', href: '/about' },
        { label: '新規トリップ作成', href: '/trip/new' },
        { label: 'サポート', href: '/support' },
      ],
    },
    {
      id: 'planning',
      title: '旅の計画（Trip/Day/Itinerary）',
      description: '旅・日程・予定の作成、編集、共有',
      icon: <PlannerIcon className="h-6 w-6 text-indigo-600" />,
      links: [
        { label: '機能一覧', href: '/features' },
        { label: 'FAQ: 旅・日程・予定', href: '/faq#trips' },
      ],
    },
    {
      id: 'places-maps',
      title: '場所・地図・多言語',
      description: 'Places/Maps、vicinity、i18n、タイムゾーン',
      icon: <LocationIcon className="h-6 w-6 text-indigo-600" />,
      links: [
        { label: 'FAQ: 場所・地図', href: '/faq#places' },
        { label: 'サポート', href: '/support' },
      ],
    },
    {
      id: 'route-optimization',
      title: 'ルート最適化',
      description: 'Waypoint最適化、移動モード、回避設定、コスト見積り',
      icon: <PieChartIcon className="h-6 w-6 text-indigo-600" />,
      links: [
        { label: '価格/プラン', href: '/pricing' },
        { label: 'FAQ', href: '/faq#trips' },
      ],
    },
    {
      id: 'environment',
      title: '環境変数・設定',
      description: '環境変数検証、Google APIキー、Firebase設定',
      icon: <CloudIcon className="h-6 w-6 text-indigo-600" />,
      links: [
        { label: 'プライバシー', href: '/privacy' },
        { label: '利用規約', href: '/terms' },
      ],
    },
    {
      id: 'security',
      title: 'セキュリティ',
      description: '認証/認可、公開設定、データ保護',
      icon: <WarningIcon className="h-6 w-6 text-indigo-600" />,
      links: [
        { label: 'リリースノート', href: '/releases' },
        { label: 'FAQ: セキュリティ', href: '/faq#privacy' },
      ],
    },
    {
      id: 'releases',
      title: 'リリースノート',
      description: 'バージョン履歴と変更点',
      icon: <CalendarIcon className="h-6 w-6 text-indigo-600" />,
      links: [
        { label: 'リリース一覧', href: '/releases' },
      ],
    },
  ]

  const filteredGuides = guides.filter((g) => {
    if (!query.trim()) return true
    const qLower = query.toLowerCase()
    return (
      g.title.toLowerCase().includes(qLower) ||
      g.description.toLowerCase().includes(qLower)
    )
  })

  return (
    <StaticPageLayout>
      {/* Hero */}
      <section>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
          <div className="lg:col-span-9">
            <h1 className="leading-[0.8] tracking-tight bg-text-image text-transparent bg-clip-text font-extrabold uppercase text-[clamp(3.5rem,10vw,9rem)]">
              <span className="block">Documentation</span>
              <span className="block">Guides & Specs</span>
            </h1>
          </div>
          <div className="lg:col-span-3 flex items-end">
            <div className="relative z-10 bg-white/85 backdrop-blur-sm p-6 border border-gray-200">
              <p className="text-lg md:text-xl text-gray-800 leading-relaxed">
                Caglla の使い方・仕様・ベストプラクティスをここから辿れます。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Search */}
      <Section title="Search">
        <SolidCard className="p-6 md:p-8">
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-400">
              <SearchIcon className="h-5 w-5" />
            </span>
            <input
              type="text"
              className="w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="ガイドを検索（例：Itinerary、Maps、環境変数）"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </SolidCard>
      </Section>

      {/* Guides */}
      <Section title="Guides">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredGuides.map((g) => (
            <SolidCard key={g.id} className="p-6 hover:shadow-sm transition">
              <div className="flex items-start gap-3">
                {g.icon}
                <div>
                  <div className="font-semibold text-gray-900">{g.title}</div>
                  <div className="text-sm text-gray-600">{g.description}</div>
                  <ul className="mt-2 space-y-1 text-sm text-indigo-600">
                    {g.links.map((l) => (
                      <li key={l.href} className="truncate">
                        <a href={l.href} className="underline decoration-dotted">→ {l.label}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </SolidCard>
          ))}
          {filteredGuides.length === 0 && (
            <div className="text-sm text-gray-600">該当するガイドが見つかりませんでした。</div>
          )}
        </div>
      </Section>

      {/* Shortcuts */}
      <Section title="Shortcuts">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <SolidCard className="p-6 hover:shadow-sm transition">
            <a href="/support" className="flex items-center gap-3">
              <SearchIcon className="h-5 w-5 text-indigo-600" />
              <div>
                <div className="font-medium">サポート</div>
                <div className="text-sm text-gray-600">ヘルプセンターへ</div>
              </div>
            </a>
          </SolidCard>
          <SolidCard className="p-6 hover:shadow-sm transition">
            <a href="/faq" className="flex items-center gap-3">
              <SearchIcon className="h-5 w-5 text-indigo-600" />
              <div>
                <div className="font-medium">FAQ</div>
                <div className="text-sm text-gray-600">よくある質問</div>
              </div>
            </a>
          </SolidCard>
          <SolidCard className="p-6 hover:shadow-sm transition">
            <a href="/releases" className="flex items-center gap-3">
              <CalendarIcon className="h-5 w-5 text-indigo-600" />
              <div>
                <div className="font-medium">リリースノート</div>
                <div className="text-sm text-gray-600">バージョン履歴</div>
              </div>
            </a>
          </SolidCard>
        </div>
      </Section>

      {/* CTA */}
      <section className="text-center">
        <div className="bg-emerald-600 p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">ガイドで見つからない場合</h2>
          <p className="text-xl mb-8 opacity-90">サポートまたはFAQをご確認ください。必要ならお問い合わせください。</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/support"
              className="px-8 py-3 bg-white text-emerald-600 font-semibold hover:bg-gray-100 transition-colors border border-emerald-200"
            >
              サポートへ
            </a>
            <a
              href="/faq"
              className="px-8 py-3 bg-emerald-700 text-white font-semibold hover:bg-emerald-800 transition-colors"
            >
              FAQを見る
            </a>
          </div>
        </div>
      </section>
    </StaticPageLayout>
  )
}

