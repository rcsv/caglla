'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { TripCard } from '@/components/tripcard/TripCard'
import { makeAuthenticatedRequest } from '@/lib/api/helpers'
import { useAuth } from '@/lib/contexts/auth'
import type { Trip } from '@/lib/core/types'
import Loading from '@/components/common/Loading'
import logger from '@/lib/core/logger'
import { Icon } from '@iconify/react'

type FeedType = 'public' | 'trending' | 'following'

interface TripFeedProps {
  feedType: FeedType
  initialCursor?: string
}

interface FeedResponse {
  trips: Trip[]
  nextCursor?: string
}

/**
 * Trip Feed Component
 * 
 * Phase 2-1: フィードページ実装（v3.0.0）
 * 
 * フィード表示と無限スクロールを実装
 * - 公開フィード、トレンドフィード、フォロー中フィードに対応
 * - IntersectionObserverを使用した無限スクロール
 * - 楽観的UI更新
 * - エラーハンドリングとリトライ機能
 */
export default function TripFeed({ feedType, initialCursor }: TripFeedProps) {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | undefined>(initialCursor)
  const [hasMore, setHasMore] = useState(true)

  const loadMoreRef = useRef<HTMLDivElement>(null)

  // フィードAPIエンドポイントの取得
  const getFeedEndpoint = useCallback((type: FeedType, cursor?: string) => {
    const params = new URLSearchParams()
    params.set('limit', '20')
    if (cursor) {
      params.set('cursor', cursor)
    }
    return `/api/feed/${type}?${params.toString()}`
  }, [])

  // フィードデータ取得
  const fetchFeed = useCallback(
    async (cursor?: string, append: boolean = false) => {
      try {
        if (append) {
          setLoadingMore(true)
        } else {
          setLoading(true)
        }
        setError(null)

        // フォロー中フィードは認証が必要
        if (feedType === 'following') {
          if (authLoading) {
            return // 認証待ち
          }
          if (!user) {
            setError('Please sign in to view following feed')
            setLoading(false)
            return
          }
          
          const response = await makeAuthenticatedRequest(getFeedEndpoint('following', cursor))
          if (!response.ok) {
            if (response.status === 401) {
              router.push('/')
              return
            }
            throw new Error(`Failed to fetch following feed: ${response.status}`)
          }
          const data: FeedResponse = await response.json()
          
          if (append) {
            setTrips((prev) => [...prev, ...data.trips])
          } else {
            setTrips(data.trips)
          }
          setNextCursor(data.nextCursor)
          setHasMore(!!data.nextCursor)
        } else {
          // 公開フィードとトレンドフィードは認証不要
          const response = await fetch(getFeedEndpoint(feedType, cursor))
          if (!response.ok) {
            throw new Error(`Failed to fetch ${feedType} feed: ${response.status}`)
          }
          const data: FeedResponse = await response.json()
          
          if (append) {
            setTrips((prev) => [...prev, ...data.trips])
          } else {
            setTrips(data.trips)
          }
          setNextCursor(data.nextCursor)
          setHasMore(!!data.nextCursor)
        }
      } catch (err) {
        logger.error(`Error fetching ${feedType} feed:`, err)
        setError(err instanceof Error ? err.message : 'Failed to load feed')
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [feedType, authLoading, user, router, getFeedEndpoint]
  )

  // 初回データ取得
  useEffect(() => {
    setTrips([])
    setNextCursor(initialCursor)
    setHasMore(true)
    void fetchFeed(initialCursor, false)
  }, [feedType]) // feedTypeが変わったら再取得

  // 無限スクロール実装
  useEffect(() => {
    if (!hasMore || loading || loadingMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && nextCursor) {
          void fetchFeed(nextCursor, true)
        }
      },
      { threshold: 0.1 }
    )

    const currentRef = loadMoreRef.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [hasMore, loading, loadingMore, nextCursor, fetchFeed])

  // 認証待ち中
  if (authLoading && feedType === 'following') {
    return <Loading className="py-8" />
  }

  // ローディング中
  if (loading) {
    return <Loading className="py-8" />
  }

  // エラー表示
  if (error) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center gap-2 text-red-600 mb-4">
          <Icon icon="mdi:alert-circle" className="h-5 w-5" />
          <span>{error}</span>
        </div>
        <button
          onClick={() => fetchFeed(undefined, false)}
          className="text-indigo-600 hover:text-indigo-800 underline"
        >
          Try again
        </button>
      </div>
    )
  }

  // 空の状態
  if (trips.length === 0) {
    return (
      <div className="text-center py-12">
        <Icon icon="mdi:earth-off" className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No trips found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {trips.map((trip) => (
        <TripCard key={trip.id} trip={trip} variant="standard" />
      ))}

      {/* 無限スクロール用のトリガー */}
      {hasMore && (
        <div ref={loadMoreRef} className="flex justify-center py-4">
          {loadingMore && <Loading className="py-4" />}
        </div>
      )}

      {/* 最後のページ表示 */}
      {!hasMore && trips.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No more trips to load</p>
        </div>
      )}
    </div>
  )
}

