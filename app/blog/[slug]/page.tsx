'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import { StaticPageLayout } from '@/components/common/static/StaticPageLayout'
import { Section } from '@/components/common/static/Section'
import { SolidCard } from '@/components/common/static/SolidCard'
import { CalendarIcon } from '@/components/common/icons/CalendarIcon'
import { UserIcon } from '@/components/common/icons/UserIcon'
import { getBlogPostBySlug } from '@/lib/content/blog'

export default function BlogPostPage() {
  const params = useParams()
  const slug = params?.slug as string
  const { t } = require('@/lib/i18n')
  const post = getBlogPostBySlug(slug)

  if (!post) {
    return (
      <StaticPageLayout>
        <section className="text-center">
          <div className="bg-white border border-gray-200 p-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('blog.post.notfound.title')}</h1>
            <p className="text-gray-600">{t('blog.post.notfound.desc')}</p>
          </div>
        </section>
      </StaticPageLayout>
    )
  }

  return (
    <StaticPageLayout>
      {/* Hero */}
      <section>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
          <div className="lg:col-span-9">
            <h1 className="leading-[0.9] tracking-tight bg-text-image text-transparent bg-clip-text font-extrabold text-[clamp(2.2rem,6vw,4rem)] font-rajdhani">
              {post.title}
            </h1>
          </div>
        </div>
      </section>

      <Section title={`${post.date}`}>
        <SolidCard className="p-6 md:p-8">
          <article className="prose max-w-none prose-p:leading-relaxed">
            {/* 右寄せで Author を表示 */}
            <p className="text-gray-500 text-right pb-4">by {post.author}</p>
            <p className="text-gray-800">{post.content}</p>
          </article>
          <div className="mt-6 flex flex-wrap gap-2 text-xs text-gray-500">
            {post.tags.map((t) => (
              <span key={t} className="rounded bg-gray-100 px-2 py-0.5">{t}</span>
            ))}
          </div>
          <div className="mt-8">
            <a href="/blog" className="text-indigo-600 underline decoration-dotted">{t('blog.post.back')}</a>
          </div>
        </SolidCard>
      </Section>
    </StaticPageLayout>
  )
}


