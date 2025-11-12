'use client'

import React from 'react'
import Link from 'next/link'
import { StaticPageLayout } from '@/components/common/static/StaticPageLayout'
import { Section } from '@/components/common/static/Section'
import { SolidCard } from '@/components/common/static/SolidCard'
import { SearchIcon } from '@/components/common/icons/SearchIcon'
import { MailIcon } from '@/components/common/icons/MailIcon'
import { CalendarIcon } from '@/components/common/icons/CalendarIcon'
import { UserIcon } from '@/components/common/icons/UserIcon'
import { LocationIcon } from '@/components/common/icons/LocationIcon'
import { WarningIcon } from '@/components/common/icons/WarningIcon'

export default function FAQPage() {
  const [query, setQuery] = React.useState('')

  const sections: Array<{
    id: string
    title: string
    icon: React.ReactNode
    items: { id: string; q: string; a: string; tags?: string[] }[]
  }> = [
    {
      id: 'account',
      title: 'アカウント・プラン',
      icon: <UserIcon className="h-5 w-5 text-indigo-600" />,
      items: [
        { id: 'login', q: 'Googleでのログインは必須ですか？', a: 'はい。Firebase AuthenticationのGoogleログインを採用しています。パスワードのローカル管理は行いません。', tags: ['ログイン'] },
        { id: 'plans', q: 'プランの違いは？', a: '無料のseason_traveler、有料のbackpacker/globetrotterをご用意。詳細は/pricingをご覧ください。', tags: ['プラン'] },
        { id: 'limits', q: '上限/制限はありますか？', a: 'プラン別に機能やクォータの上限があります。アプリ内のPlanLimitCheckerで確認できます。', tags: ['制限'] },
      ],
    },
    {
      id: 'trips',
      title: '旅・日程・予定',
      icon: <CalendarIcon className="h-5 w-5 text-indigo-600" />,
      items: [
        { id: 'create-trip', q: '最初の旅はどう作りますか？', a: 'ヘッダーの「新規作成」または /trip/new から作成できます。' },
        { id: 'add-day', q: 'Dayを追加する方法は？', a: 'Trip詳細画面で日付を選択し追加します。Itinerary（予定）をその日に紐づけます。' },
        { id: 'edit-itinerary', q: 'Itineraryの並び替えはできますか？', a: 'はい。ドラッグで順序調整、編集・削除にも対応しています。' },
        { id: 'share', q: '旅の共有/公開は？', a: 'Tripの公開設定から切り替えられます。共有リンクのアクセス範囲も制御可能です。' },
      ],
    },
    {
      id: 'places',
      title: '場所・地図',
      icon: <LocationIcon className="h-5 w-5 text-indigo-600" />,
      items: [
        { id: 'places-api', q: 'どのAPIを使っていますか？', a: 'Google Places API/Maps JavaScript API などを利用します。環境変数の検証が必要です。' },
        { id: 'i18n', q: '多言語対応は？', a: 'i18n仕様に基づき、Placesの多言語・vicinity対応、UIの文字を最小化したアイコン優先設計を採用しています。' },
        { id: 'timezone', q: 'タイムゾーンはどう処理？', a: 'timezone-utilsとCITY_TIMEZONE_MAPで都市→TZを解決します。ハードコードは行いません。' },
      ],
    },
    {
      id: 'privacy',
      title: 'プライバシー・セキュリティ',
      icon: <WarningIcon className="h-5 w-5 text-indigo-600" />,
      items: [
        { id: 'policy', q: 'プライバシーポリシー', a: '詳細は /privacy を参照してください。' },
        { id: 'terms', q: '利用規約', a: '詳細は /terms を参照してください。' },
        { id: 'authz', q: '公開・認可は安全ですか？', a: 'Bearerトークン検証と所有権確認を実装済み（v1.8.2）。適切な401/403/404ハンドリングもあります。' },
      ],
    },
    {
      id: 'troubleshooting',
      title: 'トラブルシューティング',
      icon: <WarningIcon className="h-5 w-5 text-indigo-600" />,
      items: [
        { id: 'cannot-login', q: 'サインインできません', a: 'ブラウザのCookie/ポップアップ設定を確認。改善しない場合は /contact よりご連絡ください。' },
        { id: 'map-not-loading', q: '地図が表示されない', a: 'APIキーの設定、HTTPリファラー制限、ネットワーク状況を確認してください。' },
      ],
    },
  ]

  const filteredSections = sections.map((s) => ({
    ...s,
    items: s.items.filter((i) => {
      if (!query.trim()) return true
      const qLower = query.toLowerCase()
      return (
        i.q.toLowerCase().includes(qLower) ||
        i.a.toLowerCase().includes(qLower) ||
        (i.tags || []).some((t) => t.toLowerCase().includes(qLower))
      )
    }),
  }))

  const hasAny = filteredSections.some((s) => s.items.length > 0)

  return (
    <StaticPageLayout>
      {/* Hero */}
      <section>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
          <div className="lg:col-span-9">
            <h1 className="leading-[0.8] tracking-tight bg-text-image text-transparent bg-clip-text font-extrabold uppercase text-[clamp(3.5rem,10vw,9rem)] font-rajdhani">
              <span className="block">FAQ</span>
              <span className="block">Help Center</span>
            </h1>
          </div>
          <div className="lg:col-span-3 flex items-end">
            <div className="relative z-10 bg-white/85 backdrop-blur-sm p-6 border border-gray-200">
              <p className="text-lg md:text-xl text-gray-800 leading-relaxed">
                よくある質問をカテゴリ別にまとめました。検索で素早く答えに到達できます。
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
              placeholder="キーワードで検索（例：公開、地図、ログイン）"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </SolidCard>
      </Section>

      {/* FAQ Sections */}
      <Section title="Questions">
        <div className="space-y-8">
          {filteredSections.map((s) => (
            <div key={s.id} id={s.id}>
              <div className="flex items-center gap-2 mb-3">
                {s.icon}
                <h2 className="text-lg font-semibold text-gray-900">{s.title}</h2>
              </div>
              <SolidCard className="p-0">
                {s.items.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {s.items.map((i) => (
                      <li key={i.id} className="p-4">
                        <details className="group">
                          <summary className="flex cursor-pointer list-none items-center justify-between">
                            <span className="font-medium text-gray-900">{i.q}</span>
                            <span className="text-gray-400 group-open:rotate-180 transition">▾</span>
                          </summary>
                          <div className="mt-2 text-gray-700 text-sm leading-relaxed">{i.a}</div>
                        </details>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-6 text-sm text-gray-600">該当する質問が見つかりませんでした。</div>
                )}
              </SolidCard>
            </div>
          ))}
          {!hasAny && (
            <div className="text-sm text-gray-600">該当するFAQが見つかりませんでした。キーワードを変えてお試しください。</div>
          )}
        </div>
      </Section>

      {/* Links */}
      <Section title="Quick Links">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <SolidCard className="p-6 hover:shadow-sm transition">
            <Link href="/support" className="flex items-center gap-3">
              <SearchIcon className="h-5 w-5 text-indigo-600" />
              <div>
                <div className="font-medium">サポート</div>
                <div className="text-sm text-gray-600">ヘルプセンターのトップへ</div>
              </div>
            </Link>
          </SolidCard>
          <SolidCard className="p-6 hover:shadow-sm transition">
            <Link href="/docs" className="flex items-center gap-3">
              <CalendarIcon className="h-5 w-5 text-indigo-600" />
              <div>
                <div className="font-medium">ドキュメント</div>
                <div className="text-sm text-gray-600">仕様・ガイドラインを参照</div>
              </div>
            </Link>
          </SolidCard>
          <SolidCard className="p-6 hover:shadow-sm transition">
            <Link href="/contact" className="flex items-center gap-3">
              <MailIcon className="h-5 w-5 text-indigo-600" />
              <div>
                <div className="font-medium">お問い合わせ</div>
                <div className="text-sm text-gray-600">フォームでご連絡ください</div>
              </div>
            </Link>
          </SolidCard>
        </div>
      </Section>

      {/* CTA */}
      <section className="text-center">
        <div className="bg-emerald-600 p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">見つからない回答がありますか？</h2>
          <p className="text-xl mb-8 opacity-90">サポートチームがサポートします。お気軽にご連絡ください。</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="px-8 py-3 bg-white text-emerald-600 font-semibold hover:bg-gray-100 transition-colors border border-emerald-200"
            >
              お問い合わせ
            </Link>
            <Link
              href="/support"
              className="px-8 py-3 bg-emerald-700 text-white font-semibold hover:bg-emerald-800 transition-colors"
            >
              サポートトップへ
            </Link>
          </div>
        </div>
      </section>
    </StaticPageLayout>
  )
}

