'use client'

import React from 'react'
import Link from 'next/link'
import { StaticPageLayout } from '@/components/common/static/StaticPageLayout'
import { Section } from '@/components/common/static/Section'
import { SolidCard } from '@/components/common/static/SolidCard'

export default function TermsPage() {
  const { t } = require('@/lib/i18n')
  return (
    <StaticPageLayout showRail={true}>
        <div className="space-y-16">
          {/* Header */}

          <section>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
              {/* Heading */}
              <div className="lg:col-span-9">
                <h1 className="leading-[0.8] tracking-tight bg-text-image text-transparent bg-clip-text font-extrabold uppercase text-[clamp(4rem,12vw,11rem)] font-rajdhani">
                  <span className="block">{t('terms.title')}</span>
                </h1>
              </div>
              {/* Intro copy */}
              <div className="lg:col-span-3 flex items-end">
                <div className="relative z-10 bg-white/85 backdrop-blur-sm p-6 border border-gray-200">
                  <p className="text-lg md:text-xl text-gray-800 leading-relaxed">{t('terms.updated')}: {new Date().toLocaleDateString('en-US')}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 1 */}
          <Section title={t('terms.s1.title')}>
            <SolidCard className="p-6 md:p-8">
              <p className="text-gray-700 leading-relaxed">{t('terms.s1.p1')}</p>
            </SolidCard>
          </Section>

          {/* Section 2 */}
          <Section title={t('terms.s2.title')}>
            <SolidCard className="p-6 md:p-8">
              <p className="text-gray-700 leading-relaxed mb-4">{t('terms.s2.intro')}</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>{t('terms.s2.li1')}</li>
                <li>{t('terms.s2.li2')}</li>
                <li>{t('terms.s2.li3')}</li>
                <li>{t('terms.s2.li4')}</li>
                <li>{t('terms.s2.li5')}</li>
              </ul>
            </SolidCard>
          </Section>

          {/* Section 3 */}
          <Section title={t('terms.s3.title')}>
            <SolidCard className="p-6 md:p-8">
              <p className="text-gray-700 leading-relaxed mb-4">{t('terms.s3.intro')}</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>{t('terms.s3.li1')}</li>
                <li>{t('terms.s3.li2')}</li>
                <li>{t('terms.s3.li3')}</li>
                <li>{t('terms.s3.li4')}</li>
              </ul>
            </SolidCard>
          </Section>

          {/* Section 4 */}
          <Section title={t('terms.s4.title')}>
            <SolidCard className="p-6 md:p-8">
              <p className="text-gray-700 leading-relaxed mb-4">{t('terms.s4.intro')}</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>{t('terms.s4.li1')}</li>
                <li>{t('terms.s4.li2')}</li>
                <li>{t('terms.s4.li3')}</li>
                <li>{t('terms.s4.li4')}</li>
                <li>{t('terms.s4.li5')}</li>
              </ul>
            </SolidCard>
          </Section>

          {/* Section 5 */}
          <Section title={t('terms.s5.title')}>
            <SolidCard className="p-6 md:p-8">
              <p className="text-gray-700 leading-relaxed">{t('terms.s5.p1')}</p>
            </SolidCard>
          </Section>

          {/* Section 6 */}
          <Section title={t('terms.s6.title')}>
            <SolidCard className="p-6 md:p-8">
              <p className="text-gray-700 leading-relaxed">{t('terms.s6.p1')}</p>
            </SolidCard>
          </Section>

          {/* Section 7 */}
          <Section title={t('terms.s7.title')}>
            <SolidCard className="p-6 md:p-8">
              <p className="text-gray-700 leading-relaxed">
                {t('terms.s7.p1')}{' '}
                <Link href="/contact" className="text-emerald-600 hover:text-emerald-700 underline font-medium">
                  {t('terms.s7.contact')}
                </Link>
              </p>
            </SolidCard>
          </Section>
        </div>
    </StaticPageLayout>
  )
}