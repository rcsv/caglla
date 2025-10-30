'use client'

import React from 'react'
import { StaticPageLayout } from '@/components/common/static/StaticPageLayout'
import { Section } from '@/components/common/static/Section'
import { SolidCard } from '@/components/common/static/SolidCard'
import { PieChartIcon } from '@/components/common/icons/PieChartIcon'
import { RocketIcon } from '@/components/common/icons/RocketIcon'
import { PlannerIcon } from '@/components/common/icons/PlannerIcon'

export default function PricingPage() {
  const { t } = require('@/lib/i18n')
  return (
    <StaticPageLayout>
      {/* Hero */}
      <section>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
          <div className="lg:col-span-9">
            <h1 className="leading-[0.8] tracking-tight bg-text-image text-transparent bg-clip-text font-extrabold uppercase text-[clamp(3.5rem,10vw,9rem)]">
              <span className="block">{t('pricing')}</span>
              <span className="block">Plans</span>
            </h1>
          </div>
          <div className="lg:col-span-3 flex items-end">
            <div className="relative z-10 bg-white/85 backdrop-blur-sm p-6 border border-gray-200">
              <p className="text-lg md:text-xl text-gray-800 leading-relaxed">
                {t('pricing.intro')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Plans */}
      <Section title={t('pricing.choosePlan')}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <SolidCard className="p-8">
            <div className="flex items-center gap-2 mb-3">
              <RocketIcon className="h-5 w-5 text-emerald-600" />
              <h3 className="text-lg font-semibold text-gray-900">season_traveler</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-2">¥0</p>
            <p className="text-sm text-gray-600 mb-4">{t('pricing.season.subtitle')}</p>
            <ul className="text-sm text-gray-700 space-y-2 list-disc pl-5">
              <li>{t('pricing.season.li1')}</li>
              <li>{t('pricing.season.li2')}</li>
              <li>{t('pricing.season.li3')}</li>
            </ul>
          </SolidCard>

          <SolidCard className="p-8 border-emerald-300">
            <div className="flex items-center gap-2 mb-3">
              <PlannerIcon className="h-5 w-5 text-emerald-600" />
              <h3 className="text-lg font-semibold text-gray-900">backpacker</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-2">¥480/月</p>
            <p className="text-sm text-gray-600 mb-4">{t('pricing.backpacker.subtitle')}</p>
            <ul className="text-sm text-gray-700 space-y-2 list-disc pl-5">
              <li>{t('pricing.backpacker.li1')}</li>
              <li>{t('pricing.backpacker.li2')}</li>
              <li>{t('pricing.backpacker.li3')}</li>
            </ul>
          </SolidCard>

          <SolidCard className="p-8">
            <div className="flex items-center gap-2 mb-3">
              <PieChartIcon className="h-5 w-5 text-emerald-600" />
              <h3 className="text-lg font-semibold text-gray-900">globetrotter</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-2">¥980/月</p>
            <p className="text-sm text-gray-600 mb-4">{t('pricing.globetrotter.subtitle')}</p>
            <ul className="text-sm text-gray-700 space-y-2 list-disc pl-5">
              <li>{t('pricing.globetrotter.li1')}</li>
              <li>{t('pricing.globetrotter.li2')}</li>
              <li>{t('pricing.globetrotter.li3')}</li>
            </ul>
          </SolidCard>
        </div>
      </Section>

      {/* CTA */}
      <section className="text-center">
        <div className="bg-emerald-600 p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">{t('pricing.cta.title')}</h2>
          <p className="text-xl mb-8 opacity-90">{t('pricing.cta.subtitle')}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/support" className="px-8 py-3 bg-white text-emerald-600 font-semibold hover:bg-gray-100 transition-colors border border-emerald-200">{t('pricing.cta.support')}</a>
            <a href="/docs" className="px-8 py-3 bg-emerald-700 text-white font-semibold hover:bg-emerald-800 transition-colors">{t('pricing.cta.docs')}</a>
          </div>
        </div>
      </section>
    </StaticPageLayout>
  )
}

