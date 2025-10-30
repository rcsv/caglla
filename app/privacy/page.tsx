'use client'

import React from 'react'
import { StaticPageLayout } from '@/components/common/static/StaticPageLayout'
import { Section } from '@/components/common/static/Section'
import { SolidCard } from '@/components/common/static/SolidCard'


export default function PrivacyPage() {
  return (
    <StaticPageLayout>
      {/* Hero Section */}
      <section>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
        {/* Heading */}
          <div className="lg:col-span-9">
            <h1 className="leading-[0.8] tracking-tight bg-text-image text-transparent bg-clip-text font-extrabold uppercase text-[clamp(4rem,12vw,11rem)]">
              <span className="block">
                Privacy Policy
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

      {/* Preface */}
      <Section title="Preface">
        <SolidCard className="p-6 md:p-8">
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p>
              Caglla Travel Manager（以下「当サービス」）は、ユーザーの個人情報の保護を重要な責務と考え、以下のプライバシーポリシーを定めています。
              ユーザーは、本プライバシーポリシーに従って当サービスを利用することにより、個人情報の保護についての同意を与えることになります。
            </p>
          </div>
        </SolidCard>
      </Section>

      {/* Collection of Information */}
      <Section title="Collection of Information">
        <SolidCard className="p-6 md:p-8">
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p className="text-gray-700 leading-relaxed mb-4">当サービスでは、以下の情報を収集する場合があります：</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Googleアカウント情報（名前、メールアドレス、プロフィール画像）</li>
              <li>旅行計画データ（旅程、宿泊先、観光地情報）</li>
              <li>位置情報（地図表示のため）</li>
              <li>サービス利用状況（機能の使用頻度、エラーログ）</li>
            </ul>
          </div>
        </SolidCard>
      </Section>

      {/* Purpose of Information Collection */}
      <Section title="Purpose of Information Collection">
        <SolidCard className="p-6 md:p-8">
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p className="text-gray-700 leading-relaxed mb-4">収集した情報は以下の目的で利用します：</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>サービスの提供・運営</li>
              <li>ユーザー認証・アカウント管理</li>
              <li>旅行計画の保存・管理</li>
              <li>サービス改善・新機能開発</li>
              <li>カスタマーサポート</li>
            </ul>
          </div>
        </SolidCard>
      </Section>

      {/* Sharing of Information */}
      <Section title="Sharing of Information">
        <SolidCard className="p-6 md:p-8">
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p className="text-gray-700 leading-relaxed">
              当サービスは、ユーザーの同意がある場合、または法的義務がある場合を除き、個人情報を第三者と共有することはありません。
            </p>
          </div>
        </SolidCard>
      </Section>

      {/* Protection of Data */}
      <Section title="Protection of Data">
        <SolidCard className="p-6 md:p-8">
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p className="text-gray-700 leading-relaxed">
              当サービスは、Firebase（Google Cloud Platform）のセキュリティ機能を活用し、ユーザーデータを適切に保護します。
            </p>
          </div>
        </SolidCard>
      </Section>


      {/* Contact */}
      <Section title="Contact">
        <SolidCard className="p-6 md:p-8">
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p className="text-gray-700 leading-relaxed">
              プライバシーポリシーに関するご質問は、<a href="/contact" className="text-emerald-600 hover:text-emerald-700 underline font-medium">お問い合わせページ</a>からご連絡ください。
            </p>
          </div>
        </SolidCard>
      </Section>
    </StaticPageLayout>
  )
}