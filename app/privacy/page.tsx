'use client'

import React from 'react'
import { HomeHeader } from '@/components/common/HomeHeader'
import { HomeFooter } from '@/components/common/HomeFooter'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <HomeHeader />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">プライバシーポリシー</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              最終更新日: {new Date().toLocaleDateString('ja-JP')}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. はじめに</h2>
              <p className="text-gray-700 leading-relaxed">
                Caglla Travel Manager（以下「当サービス」）は、ユーザーの個人情報の保護を重要な責務と考え、以下のプライバシーポリシーを定めています。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. 収集する情報</h2>
              <div className="text-gray-700 leading-relaxed">
                <p className="mb-4">当サービスでは、以下の情報を収集する場合があります：</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Googleアカウント情報（名前、メールアドレス、プロフィール画像）</li>
                  <li>旅行計画データ（旅程、宿泊先、観光地情報）</li>
                  <li>位置情報（地図表示のため）</li>
                  <li>サービス利用状況（機能の使用頻度、エラーログ）</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. 情報の利用目的</h2>
              <div className="text-gray-700 leading-relaxed">
                <p className="mb-4">収集した情報は以下の目的で利用します：</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>サービスの提供・運営</li>
                  <li>ユーザー認証・アカウント管理</li>
                  <li>旅行計画の保存・管理</li>
                  <li>サービス改善・新機能開発</li>
                  <li>カスタマーサポート</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. 情報の共有</h2>
              <p className="text-gray-700 leading-relaxed">
                当サービスは、ユーザーの同意がある場合、または法的義務がある場合を除き、個人情報を第三者と共有することはありません。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. データの保護</h2>
              <p className="text-gray-700 leading-relaxed">
                当サービスは、Firebase（Google Cloud Platform）のセキュリティ機能を活用し、ユーザーデータを適切に保護します。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. お問い合わせ</h2>
              <p className="text-gray-700 leading-relaxed">
                プライバシーポリシーに関するご質問は、<a href="/contact" className="text-blue-600 hover:text-blue-800 underline">お問い合わせページ</a>からご連絡ください。
              </p>
            </section>
          </div>
        </div>
      </main>

      <HomeFooter />
    </div>
  )
}