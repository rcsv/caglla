'use client'

import CommentList from '@/components/social/CommentList'
import LikeButton from '@/components/social/LikeButton'
import { useState, useEffect } from 'react'
import { makeAuthenticatedRequest } from '@/lib/api/helpers'
import { useAuth } from '@/lib/contexts/auth'
import type { Trip } from '@/lib/core/types'
import logger from '@/lib/core/logger'
import { useParams } from 'next/navigation'

/**
 * Social Default Slot
 * 
 * Phase 2-5: Parallel Routes実装（v3.0.0）
 * 
 * SNS機能のデフォルト表示（いいね・コメント）
 */
export default function SocialDefault() {
  const { user } = useAuth()
  const params = useParams<{ userSlug: string; tripSlug: string }>()
  const tripSlug = params?.tripSlug
  const [trip, setTrip] = useState<Trip | null>(null)
  const [likesCount, setLikesCount] = useState(0)
  const [likedByMe, setLikedByMe] = useState(false)
  const [loading, setLoading] = useState(true)

  // Trip取得 + いいね状態取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!tripSlug) {
          setLoading(false)
          return
        }
        // Trip詳細を取得
        const tripRes = await makeAuthenticatedRequest(`/api/trip/${tripSlug}`)
        if (tripRes.ok) {
          const tripData = await tripRes.json()
          setTrip(tripData as Trip)
        } else {
          setTrip(null)
        }

        // 認証済みならLike状態も取得
        if (user) {
          const likeRes = await makeAuthenticatedRequest(`/api/trip/${tripSlug}/likes`)
          if (likeRes.ok) {
            const data = await likeRes.json()
            setLikesCount(data.likesCount || 0)
            setLikedByMe(data.likedByMe || false)
          }
        }
      } catch (err) {
        logger.error('Error initializing social slot:', err)
      } finally {
        setLoading(false)
      }
    }
    void fetchData()
  }, [tripSlug, user])

  if (!trip || trip.access_level !== 'public') {
    return null // プライベートトリップはSNS機能を表示しない
  }

  const initialLikesCount = trip.social_stats?.likes_count ?? likesCount

  return (
    <div className="p-4 space-y-4">
      {/* いいねボタン */}
      <div className="flex items-center gap-4">
        <LikeButton
          tripSlug={tripSlug}
          initialLiked={likedByMe}
          initialCount={initialLikesCount}
          onToggle={(liked, count) => {
            setLikedByMe(liked)
            setLikesCount(count)
          }}
          size="md"
          showCount={true}
        />
      </div>

      {/* コメント一覧 */}
      <div className="border-t border-gray-200 pt-4">
        {tripSlug && (
          <CommentList
            tripSlug={tripSlug}
            onCommentAdded={() => {
              // コメント数更新はCommentList内で処理される
            }}
            onCommentDeleted={() => {
              // コメント数更新はCommentList内で処理される
            }}
          />
        )}
      </div>
    </div>
  )
}

