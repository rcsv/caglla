'use client'

import React from 'react'
import { StaticPageLayout } from '@/components/common/static/StaticPageLayout'
import { Section } from '@/components/common/static/Section'
import { SolidCard } from '@/components/common/static/SolidCard'
import { CalendarIcon } from '@/components/common/icons/CalendarIcon'
import { UserIcon } from '@/components/common/icons/UserIcon'
import { getBlogPostBySlug } from '@/lib/content/blog'

type PageProps = {
  params: { slug: string }
}

export default function BlogPostPage({ params }: PageProps) {
  const post = getBlogPostBySlug(params.slug)

  if (!post) {
    return (
      <StaticPageLayout>
        <section className="text-center">
          <div className="bg-white border border-gray-200 p-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">記事が見つかりませんでした</h1>
            <p className="text-gray-600">URLをご確認いただくか、<a href="/blog" className="underline">ブログ一覧</a>に戻ってください。</p>
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
            <h1 className="leading-[0.9] tracking-tight bg-text-image text-transparent bg-clip-text font-extrabold text-[clamp(2.2rem,6vw,4rem)]">
              {post.title}
            </h1>
            <div className="mt-3 flex items-center gap-4 text-sm text-gray-700">
              <span className="inline-flex items-center gap-1"><CalendarIcon className="h-4 w-4" />{post.date}</span>
              <span className="inline-flex items-center gap-1"><UserIcon className="h-4 w-4" />{post.author}</span>
            </div>
          </div>
          <div className="lg:col-span-3" />
        </div>
      </section>

      <Section title="">
        <SolidCard className="p-6 md:p-8">
          <article className="prose max-w-none prose-p:leading-relaxed">
            <p className="text-gray-800">{post.content}</p>
          </article>
          <div className="mt-6 flex flex-wrap gap-2 text-xs text-gray-500">
            {post.tags.map((t) => (
              <span key={t} className="rounded bg-gray-100 px-2 py-0.5">{t}</span>
            ))}
          </div>
          <div className="mt-8">
            <a href="/blog" className="text-indigo-600 underline decoration-dotted">← ブログ一覧に戻る</a>
          </div>
        </SolidCard>
      </Section>
    </StaticPageLayout>
  )
}


