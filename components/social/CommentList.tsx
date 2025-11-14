'use client'

import { useEffect, useState } from 'react'
import { makeAuthenticatedRequest } from '@/lib/api/helpers'
import { useAuth } from '@/lib/contexts/auth'
import type { TripComment } from '@/lib/core/types/social'
import logger from '@/lib/core/logger'
import Loading from '@/components/common/Loading'
import CommentItem from './CommentItem'
import CommentInput from './CommentInput'

interface CommentListProps {
  tripSlug: string
  initialComments?: TripComment[]
  onCommentAdded?: () => void
  onCommentDeleted?: () => void
}

/**
 * Comment List Component
 * 
 * Phase 2-3: Social Components実装（v3.0.0）
 * 
 * コメント一覧表示コンポーネント
 * - コメント取得・表示
 * - コメント追加・削除
 * - ページネーション（必要に応じて）
 */
export default function CommentList({
  tripSlug,
  initialComments,
  onCommentAdded,
  onCommentDeleted,
}: CommentListProps) {
  const { user, loading: authLoading } = useAuth()
  const [comments, setComments] = useState<TripComment[]>(initialComments || [])
  const [loading, setLoading] = useState(!initialComments)
  const [error, setError] = useState<string | null>(null)

  // コメント取得
  const fetchComments = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/trip/${tripSlug}/comments`)
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Comments available only for public trips')
        }
        throw new Error(`Failed to fetch comments: ${response.status}`)
      }

      const data: TripComment[] = await response.json()
      setComments(data.filter((c) => !c.deleted)) // 削除されたコメントは除外
    } catch (err) {
      logger.error('Error fetching comments:', err)
      setError(err instanceof Error ? err.message : 'Failed to load comments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!initialComments) {
      void fetchComments()
    }
  }, [tripSlug]) // tripSlugが変わったら再取得

  // コメント追加
  const handleCommentAdded = async (newComment: TripComment) => {
    setComments((prev) => [...prev, newComment])
    onCommentAdded?.()
    // コメント数を更新するため、親コンポーネントに通知
    await fetchComments()
  }

  // コメント削除
  const handleCommentDeleted = async (commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId))
    onCommentDeleted?.()
    // コメント数を更新するため、再取得
    await fetchComments()
  }

  if (loading) {
    return <Loading className="py-4" />
  }

  if (error) {
    return (
      <div className="text-center py-4 text-red-600">
        <p>{error}</p>
        <button
          onClick={() => fetchComments()}
          className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 underline"
        >
          Try again
        </button>
      </div>
    )
  }

  // トップレベルのコメント（親コメントがないコメント）
  const topLevelComments = comments.filter((c) => !c.parent_comment_id)

  return (
    <div className="space-y-4">
      {/* コメント入力 */}
      {user && !authLoading && (
        <CommentInput tripSlug={tripSlug} onCommentAdded={handleCommentAdded} />
      )}

      {/* コメント一覧 */}
      {topLevelComments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No comments yet. Be the first to comment!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {topLevelComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              tripSlug={tripSlug}
              onDeleted={handleCommentDeleted}
              replies={comments.filter((c) => c.parent_comment_id === comment.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

