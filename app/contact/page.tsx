'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { StaticPageLayout } from '@/components/common/static/StaticPageLayout'
import { Section } from '@/components/common/static/Section'
import { SolidCard } from '@/components/common/static/SolidCard'

export default function ContactPage() {
  const { t } = require('@/lib/i18n')
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
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900">{t('contact.title')}</h1>
      </div>

      <Section title={t('contact.sectionTitle')}>
        <div className="grid md:grid-cols-2 gap-8">
            {/* お問い合わせフォーム */}
            <div>
              <SolidCard className="p-6">
                {submitStatus === 'success' && (
                  <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700">
                    {t('contact.success')}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('contact.name')} <span className="text-red-500">*</span>
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
                      {t('contact.email')} <span className="text-red-500">*</span>
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
                      {t('contact.subject')} <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    >
                      <option value="">{t('contact.subject.placeholder')}</option>
                      <option value="bug">{t('contact.subject.bug')}</option>
                      <option value="feature">{t('contact.subject.feature')}</option>
                      <option value="account">{t('contact.subject.account')}</option>
                      <option value="billing">{t('contact.subject.billing')}</option>
                      <option value="other">{t('contact.subject.other')}</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('contact.message')} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      placeholder={t('contact.message.placeholder')}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-emerald-600 text-white py-3 px-4 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? t('contact.submitting') : t('contact.submit')}
                  </button>
                </form>
              </SolidCard>
            </div>

            {/* 連絡先情報 */}
            <div>
              <SolidCard className="p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">{t('contact.info.title')}</h2>
                <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">{t('contact.info.general')}</h3>
                  <p className="text-gray-600">
                    {t('contact.info.general')}
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">{t('contact.info.urgent')}</h3>
                  <p className="text-gray-600">
                    {t('contact.info.urgent')}
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">{t('contact.info.responseTime')}</h3>
                  <p className="text-gray-600">
                    {t('contact.info.responseTime')}
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">{t('contact.info.faq')}</h3>
                  <p className="text-gray-600">
                    {t('contact.info.faq')}{' '}
                    <Link href="/faq" className="text-emerald-600 hover:text-emerald-700 underline">
                      {t('footer.faq')}
                    </Link>
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