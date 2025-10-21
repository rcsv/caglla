'use client'

import React from 'react'
import { HomeHeader } from '@/components/common/HomeHeader'
import { HomeFooter } from '@/components/common/HomeFooter'

/**
 * 利用規約ページコンポーネント
 * 
 * サービスの利用規約を表示するページです。
 * サービスの利用条件、禁止事項、免責事項などを記載しています。
 * 
 * @returns {JSX.Element} 利用規約ページのJSX要素
 */
export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <HomeHeader />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">利用規約</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              最終更新日: {new Date().toLocaleDateString('ja-JP')}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. はじめに</h2>
              <p className="text-gray-700 leading-relaxed">
                本利用規約（以下「本規約」）は、Caglla Travel Manager（以下「当サービス」）の利用条件を定めるものです。
                ユーザーは本規約に同意の上、当サービスをご利用ください。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. サービスの内容</h2>
              <div className="text-gray-700 leading-relaxed">
                <p className="mb-4">当サービスは以下の機能を提供します：</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>旅行計画の作成・管理</li>
                  <li>旅程のスケジュール管理</li>
                  <li>観光地・宿泊先の検索・登録</li>
                  <li>地図表示・ルート最適化</li>
                  <li>予約情報の管理</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. 利用条件</h2>
              <div className="text-gray-700 leading-relaxed">
                <p className="mb-4">ユーザーは以下の条件を満たす必要があります：</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Googleアカウントによる認証</li>
                  <li>本規約への同意</li>
                  <li>適切な利用目的での使用</li>
                  <li>法令・公序良俗に反しない利用</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. 禁止事項</h2>
              <div className="text-gray-700 leading-relaxed">
                <p className="mb-4">以下の行為を禁止します：</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>違法・有害なコンテンツの投稿</li>
                  <li>他ユーザーの権利を侵害する行為</li>
                  <li>サービスの正常な運営を妨げる行為</li>
                  <li>不正アクセス・ハッキング行為</li>
                  <li>その他、当サービスが不適切と判断する行為</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. 免責事項</h2>
              <p className="text-gray-700 leading-relaxed">
                当サービスは、ユーザーが当サービスを利用して生じた損害について、故意または重過失がある場合を除き、一切の責任を負いません。
                また、サービスの中断・停止・終了により生じた損害についても同様とします。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. 規約の変更</h2>
              <p className="text-gray-700 leading-relaxed">
                当サービスは、必要に応じて本規約を変更することがあります。
                変更後の規約は、当サービス上での掲示をもって効力を生じるものとします。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. お問い合わせ</h2>
              <p className="text-gray-700 leading-relaxed">
                本規約に関するご質問は、<a href="/contact" className="text-blue-600 hover:text-blue-800 underline">お問い合わせページ</a>からご連絡ください。
              </p>
            </section>
          </div>
        </div>
      </main>

      <HomeFooter />
    </div>
  )
}