'use client'

import React from 'react'
import { StaticPageLayout } from '@/components/common/static/StaticPageLayout'
import { Section } from '@/components/common/static/Section'
import { SolidCard } from '@/components/common/static/SolidCard'
import { SearchIcon } from '@/components/common/icons/SearchIcon'
import { CalendarIcon } from '@/components/common/icons/CalendarIcon'
import { UserIcon } from '@/components/common/icons/UserIcon'
import { getAllBlogPosts } from '@/lib/content/blog'
import { t } from '@/lib/i18n'

export default function BlogPage() {
  const [query, setQuery] = React.useState('')

  const posts = getAllBlogPosts()

  const filtered = posts.filter((p) => {
    if (!query.trim()) return true
    const qLower = query.toLowerCase()
    return (
      p.title.toLowerCase().includes(qLower) ||
      p.excerpt.toLowerCase().includes(qLower) ||
      p.tags.some((t) => t.toLowerCase().includes(qLower))
    )
  })

  return (
    <StaticPageLayout>
      {/* Hero */}
      <section>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
          <div className="lg:col-span-9">
            <h1 className="leading-[0.8] tracking-tight bg-text-image text-transparent bg-clip-text font-extrabold uppercase text-[clamp(3.5rem,10vw,9rem)] font-rajdhani">
              <span className="block">{t('blog.title1')}</span>
              <span className="block">{t('blog.title2')}</span>
            </h1>
          </div>
          <div className="lg:col-span-3 flex items-end">
            <div className="relative z-10 bg-white/85 backdrop-blur-sm p-6 border border-gray-200">
              <p className="text-lg md:text-xl text-gray-800 leading-relaxed">{t('blog.intro')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Search */}
      <Section title={t('blog.search.title')}>
        <SolidCard className="p-6 md:p-8">
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-400">
              <SearchIcon className="h-5 w-5" />
            </span>
            <input
              type="text"
              className="w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder={t('blog.search.placeholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </SolidCard>
      </Section>

      {/* Posts */}
      <Section title={t('blog.latest')}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filtered.map((p) => (
            <SolidCard key={p.slug} className="p-6 hover:shadow-sm transition">
              <a href={`/blog/${p.slug}`} className="block">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">{p.title}</h2>
                <p className="text-gray-600 mb-4">{p.excerpt}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="inline-flex items-center gap-1"><CalendarIcon className="h-4 w-4" />{p.date}</span>
                  <span className="inline-flex items-center gap-1"><UserIcon className="h-4 w-4" />{p.author}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                  {p.tags.map((t) => (
                    <span key={t} className="rounded bg-gray-100 px-2 py-0.5">{t}</span>
                  ))}
                </div>
              </a>
            </SolidCard>
          ))}
          {filtered.length === 0 && (
            <div className="text-sm text-gray-600">{t('blog.empty')}</div>
          )}
        </div>
      </Section>

      {/* CTA */}
      <section className="text-center">
        <div className="bg-emerald-600 p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">{t('blog.cta.title')}</h2>
          <p className="text-xl mb-8 opacity-90">{t('blog.cta.subtitle')}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/support"
              className="px-8 py-3 bg-white text-emerald-600 font-semibold hover:bg-gray-100 transition-colors border border-emerald-200"
            >
              {t('blog.cta.support')}
            </a>
            <a
              href="/docs"
              className="px-8 py-3 bg-emerald-700 text-white font-semibold hover:bg-emerald-800 transition-colors"
            >
              {t('blog.cta.docs')}
            </a>
          </div>
        </div>
      </section>
    </StaticPageLayout>
  )
}

