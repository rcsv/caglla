'use client'

import CommentList from '@/components/social/CommentList'
import LikeButton from '@/components/social/LikeButton'
import { useState, useEffect } from 'react'
import { makeAuthenticatedRequest } from '@/lib/api/helpers'
import { useAuth } from '@/lib/contexts/auth'
import logger from '@/lib/core/logger'
import { useParams } from 'next/navigation'
import { useTrip } from '../TripProvider'

/**
 * Social Default Slot
 * 
 * Phase 1: データフェッチの共通化（v3.0.0）
 * 
 * TripProviderからTripデータを取得してSNS機能を表示します。
 */
export default function SocialDefault() {
  const { trip } = useTrip()
  const { user } = useAuth()
  const params = useParams<{ userSlug: string; tripSlug: string }>()
  const tripSlug = params?.tripSlug
  const [likesCount, setLikesCount] = useState(0)
  const [likedByMe, setLikedByMe] = useState(false)
  const [loading, setLoading] = useState(true)

  // いいね状態取得（TripはProviderから取得済み）
  useEffect(() => {
    const fetchLikeState = async () => {
      try {
        if (!tripSlug || !user) {
          setLoading(false)
          return
        }
        const likeRes = await makeAuthenticatedRequest(`/api/trip/${tripSlug}/likes`)
        if (likeRes.ok) {
          const data = await likeRes.json()
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

