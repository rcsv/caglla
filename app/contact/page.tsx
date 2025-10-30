'use client'

import React, { useState } from 'react'
import { StaticPageLayout } from '@/components/common/static/StaticPageLayout'
import { Section } from '@/components/common/static/Section'
import { SolidCard } from '@/components/common/static/SolidCard'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // ここで実際の送信処理を実装
    // 現在はモックとして成功状態を表示
    setTimeout(() => {
      setIsSubmitting(false)
      setSubmitStatus('success')
    }, 1000)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <StaticPageLayout>
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900">Contact</h1>
      </div>

      <Section title="お問い合わせ">
        <div className="grid md:grid-cols-2 gap-8">
            {/* お問い合わせフォーム */}
            <div>
              <SolidCard className="p-6">
                {submitStatus === 'success' && (
                  <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700">
                    お問い合わせありがとうございます。内容を確認の上、回答いたします。
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      お名前 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      メールアドレス <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                      件名 <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    >
                      <option value="">選択してください</option>
                      <option value="bug">バグ報告</option>
                      <option value="feature">機能要望</option>
                      <option value="account">アカウント関連</option>
                      <option value="billing">課金・プラン関連</option>
                      <option value="other">その他</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                      メッセージ <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      placeholder="お問い合わせ内容を詳しくお書きください"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-emerald-600 text-white py-3 px-4 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? '送信中...' : '送信する'}
                  </button>
                </form>
              </SolidCard>
            </div>

            {/* 連絡先情報 */}
            <div>
              <SolidCard className="p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">連絡先情報</h2>
                <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">一般的なお問い合わせ</h3>
                  <p className="text-gray-600">
                    サービスに関するご質問、バグ報告、機能要望などは、上記フォームからお送りください。
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">緊急時のお問い合わせ</h3>
                  <p className="text-gray-600">
                    セキュリティに関する重要な問題については、できるだけ早急に対応いたします。
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">回答時間</h3>
                  <p className="text-gray-600">
                    通常のお問い合わせには2-3営業日以内に回答いたします。
                    複雑な問題については、回答までにお時間をいただく場合があります。
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">よくある質問</h3>
                  <p className="text-gray-600">
                      よくある質問については、<a href="/faq" className="text-emerald-600 hover:text-emerald-700 underline">FAQページ</a>をご確認ください。
                  </p>
                </div>
                </div>
              </SolidCard>
            </div>
        </div>
      </Section>
    </StaticPageLayout>
  )
}