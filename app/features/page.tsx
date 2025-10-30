'use client'

import React from 'react'
import { StaticPageLayout } from '@/components/common/static/StaticPageLayout'
import { Section } from '@/components/common/static/Section'
import { SolidCard } from '@/components/common/static/SolidCard'

export default function FeaturesPage() {
  return (
    <StaticPageLayout>
      <section>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
          {/* Heading */}
          <div className="lg:col-span-9">
            <h1 className="leading-[0.8] tracking-tight bg-text-image text-transparent bg-clip-text font-extrabold uppercase text-[clamp(4rem,12vw,11rem)]">
              <span className="block">Features</span>
            </h1>
          </div>
          {/* Intro */}
          <div className="lg:col-span-3 flex items-end">
            <div className="relative z-10 bg-white/85 backdrop-blur-sm p-6 border border-gray-200">
              <p className="text-lg md:text-xl text-gray-800 leading-relaxed">
                Cagllaの強みを、シンプルに。
              </p>
            </div>
          </div>
        </div>
      </section>

      <Section title="1. 個人・家族旅行者向けの機能">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <SolidCard className="p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">地図で旅程管理</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>日別・時間別のスケジュールを直感的に編集</li>
              <li>地図上でルート確認、距離・所要時間の自動計算</li>
              <li>お気に入りスポットの保存とメモ</li>
            </ul>
          </SolidCard>
          <SolidCard className="p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">チェックリスト</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>季節・滞在日数に応じた持ち物の自動提案</li>
              <li>カテゴリ別に進捗管理（必需品/衣類/ガジェット など）</li>
            </ul>
          </SolidCard>
        </div>
      </Section>

      <Section title="2. 友達旅行向けの機能">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <SolidCard className="p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">スケジュール共有</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>iCal（.ics）購読でGoogle/Apple/Outlookに同期</li>
              <li>公開/非公開やリンク共有の権限コントロール</li>
            </ul>
          </SolidCard>
          <SolidCard className="p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">PDFエクスポート</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>旅程・地図リンク・予約情報を見やすいレイアウトで出力</li>
              <li>オフライン参照向け（A4/US Letter対応）</li>
            </ul>
          </SolidCard>
        </div>
      </Section>

      <Section title="3. ツアーコンダクター向けの機能">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <SolidCard className="p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">費用合計の算出</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>カテゴリ/日別の費用を自動集計、通貨換算にも対応</li>
              <li>旅程の変更に連動してリアルタイム更新</li>
            </ul>
          </SolidCard>
          <SolidCard className="p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">ルート最適化</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>複数地点の最適訪問順序を自動計算</li>
              <li>移動手段/回避設定（高速/有料/フェリー）を選択可能</li>
            </ul>
          </SolidCard>
        </div>
      </Section>
    </StaticPageLayout>
  )
}

