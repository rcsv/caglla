'use client'

import CommentList from '@/components/social/CommentList'
import LikeButton from '@/components/social/LikeButton'
import { useState, useEffect } from 'react'
import { makeAuthenticatedRequest } from '@/lib/api/helpers'
import { useAuth } from '@/lib/contexts/auth'
import type { Trip } from '@/lib/core/types'
import logger from '@/lib/core/logger'

/**
 * Social Default Slot
 * 
 * Phase 2-5: Parallel Routes実装（v3.0.0）
 * 
 * SNS機能のデフォルト表示（いいね・コメント）
 */
export default function SocialDefault({
  tripSlug,
  trip,
}: {
  tripSlug: string
  trip: Trip | null
}) {
  const { user } = useAuth()
  const [likesCount, setLikesCount] = useState(0)
  const [likedByMe, setLikedByMe] = useState(false)
  const [loading, setLoading] = useState(true)

  // いいね状態を取得
  useEffect(() => {
    if (!trip || !user) {
      setLoading(false)
      return
    }

    const fetchLikeState = async () => {
      try {
        const response = await makeAuthenticatedRequest(`/api/trip/${tripSlug}/likes`)
        if (response.ok) {
          const data = await response.json()
          setLikesCount(data.likesCount || 0)
          setLikedByMe(data.likedByMe || false)
        }
      } catch (err) {
        logger.error('Error fetching like state:', err)
      } finally {
        setLoading(false)
      }
    }

    void fetchLikeState()
  }, [tripSlug, trip, user])

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
        <CommentList
          tripSlug={tripSlug}
          onCommentAdded={() => {
            // コメント数更新はCommentList内で処理される
          }}
          onCommentDeleted={() => {
            // コメント数更新はCommentList内で処理される
          }}
        />
      </div>
    </div>
  )
}

