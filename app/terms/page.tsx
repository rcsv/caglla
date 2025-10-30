'use client'

import React from 'react'
import { StaticPageLayout } from '@/components/common/static/StaticPageLayout'
import { Section } from '@/components/common/static/Section'
import { SolidCard } from '@/components/common/static/SolidCard'

export default function TermsPage() {
  return (
    <StaticPageLayout showRail={true}>
        <div className="space-y-16">
          {/* Header */}

          <section>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
              {/* Heading */}
              <div className="lg:col-span-9">
                <h1 className="leading-[0.8] tracking-tight bg-text-image text-transparent bg-clip-text font-extrabold uppercase text-[clamp(4rem,12vw,11rem)]">
                  <span className="block">
                    Terms of Service
                  </span>
                </h1>
              </div>
              {/* Intro copy */}
              <div className="lg:col-span-3 flex items-end">
                <div className="relative z-10 bg-white/85 backdrop-blur-sm p-6 border border-gray-200">
                  <p className="text-lg md:text-xl text-gray-800 leading-relaxed">
                    Last updated: {new Date().toLocaleDateString('ja-JP')}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 1 */}
          <Section title="1. はじめに">
            <SolidCard className="p-6 md:p-8">
              <p className="text-gray-700 leading-relaxed">
                本利用規約（以下「本規約」）は、Caglla Travel Manager（以下「当サービス」）の利用条件を定めるものです。
                ユーザーは本規約に同意の上、当サービスをご利用ください。
              </p>
            </SolidCard>
          </Section>

          {/* Section 2 */}
          <Section title="2. サービスの内容">
            <SolidCard className="p-6 md:p-8">
              <p className="text-gray-700 leading-relaxed mb-4">当サービスは以下の機能を提供します：</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>旅行計画の作成・管理</li>
                <li>旅程のスケジュール管理</li>
                <li>観光地・宿泊先の検索・登録</li>
                <li>地図表示・ルート最適化</li>
                <li>予約情報の管理</li>
              </ul>
            </SolidCard>
          </Section>

          {/* Section 3 */}
          <Section title="3. 利用条件">
            <SolidCard className="p-6 md:p-8">
              <p className="text-gray-700 leading-relaxed mb-4">ユーザーは以下の条件を満たす必要があります：</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Googleアカウントによる認証</li>
                <li>本規約への同意</li>
                <li>適切な利用目的での使用</li>
                <li>法令・公序良俗に反しない利用</li>
              </ul>
            </SolidCard>
          </Section>

          {/* Section 4 */}
          <Section title="4. 禁止事項">
            <SolidCard className="p-6 md:p-8">
              <p className="text-gray-700 leading-relaxed mb-4">以下の行為を禁止します：</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>違法・有害なコンテンツの投稿</li>
                <li>他ユーザーの権利を侵害する行為</li>
                <li>サービスの正常な運営を妨げる行為</li>
                <li>不正アクセス・ハッキング行為</li>
                <li>その他、当サービスが不適切と判断する行為</li>
              </ul>
            </SolidCard>
          </Section>

          {/* Section 5 */}
          <Section title="5. 免責事項">
            <SolidCard className="p-6 md:p-8">
              <p className="text-gray-700 leading-relaxed">
                当サービスは、ユーザーが当サービスを利用して生じた損害について、故意または重過失がある場合を除き、一切の責任を負いません。
                また、サービスの中断・停止・終了により生じた損害についても同様とします。
              </p>
            </SolidCard>
          </Section>

          {/* Section 6 */}
          <Section title="6. 規約の変更">
            <SolidCard className="p-6 md:p-8">
              <p className="text-gray-700 leading-relaxed">
                当サービスは、必要に応じて本規約を変更することがあります。
                変更後の規約は、当サービス上での掲示をもって効力を生じるものとします。
              </p>
            </SolidCard>
          </Section>

          {/* Section 7 */}
          <Section title="7. お問い合わせ">
            <SolidCard className="p-6 md:p-8">
              <p className="text-gray-700 leading-relaxed">
                本規約に関するご質問は、<a href="/contact" className="text-emerald-600 hover:text-emerald-700 underline font-medium">お問い合わせページ</a>からご連絡ください。
              </p>
            </SolidCard>
          </Section>
        </div>
    </StaticPageLayout>
  )
}