import { Suspense } from 'react'
import Link from 'next/link'
import TripFeed from '@/components/social/TripFeed'
import { FeedTabs } from '@/components/social/FeedTabs'
import Loading from '@/components/common/Loading'
import { Icon } from '@iconify/react'

export const dynamic = 'force-dynamic'

type FeedPageProps = {
  searchParams: Promise<{ tab?: string; cursor?: string }>
}

/**
 * Feed Page - Server Component
 * 
 * Phase 2-1: フィードページ実装（v3.0.0）
 * 
 * 公開フィード、トレンドフィード、フォロー中フィードを表示するページ
 * - デフォルト: Public Feed
 * - URLパラメータ: ?tab=trending, ?tab=following
 * - 無限スクロール対応（カーソルベースページネーション）
 */
export default async function FeedPage({ searchParams }: FeedPageProps) {
  const params = await searchParams
  const activeTab = params.tab || 'public'
  const initialCursor = params.cursor || undefined

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Feed</h1>
          <p className="text-gray-600">Discover amazing travel plans from the community</p>
        </div>
        <Link
          href="/home"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <Icon icon="mdi:home" className="h-5 w-5" />
          <span>Home</span>
        </Link>
      </div>

      <FeedTabs activeTab={activeTab} />

      <Suspense fallback={<Loading className="py-8" />}>
        <TripFeed feedType={activeTab as 'public' | 'trending' | 'following'} initialCursor={initialCursor} />
      </Suspense>
    </div>
  )
}

