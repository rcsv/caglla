'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Icon } from '@iconify/react'
import { makeAuthenticatedRequest } from '@/lib/api/helpers'
import { useAuth } from '@/lib/contexts/auth'
import type { TripComment } from '@/lib/core/types/social'
import logger from '@/lib/core/logger'
import CommentInput from './CommentInput'
import CommentLikeButton from './CommentLikeButton'
// Simple relative time formatter
const formatRelativeTime = (date: Date): string => {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w ago`
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`
  return `${Math.floor(diffInSeconds / 31536000)}y ago`
}

interface CommentItemProps {
  comment: TripComment
  tripSlug: string
  onDeleted?: (commentId: string) => void
  onReplyAdded?: () => void
  replies?: TripComment[]
  allComments?: TripComment[] // 全コメント（再帰的に返信を取得するため）
}

/**
 * Comment Item Component
 * 
 * Phase 2-3: Social Components実装（v3.0.0）
 * 
 * 個別コメント表示コンポーネント
 * - 編集・削除ボタン（所有者のみ）
 * - ネストされたコメント表示（将来的）
 */
export default function CommentItem({
  comment,
  tripSlug,
  onDeleted,
  onReplyAdded,
  replies = [],
  allComments = [],
}: CommentItemProps) {
  const { user } = useAuth()
  const [isReplying, setIsReplying] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showReplies, setShowReplies] = useState(true)

  const isOwner = user?.uid === comment.user_id
  const createdAt = comment.created_at instanceof Date 
    ? comment.created_at 
    : typeof comment.created_at === 'string' 
      ? new Date(comment.created_at) 
      : new Date()

  const handleDelete = async () => {
    if (!isOwner) return
    if (!confirm('Are you sure you want to delete this comment?')) return

    setIsDeleting(true)
    try {
      const response = await makeAuthenticatedRequest(`/api/trip/${tripSlug}/comments/${comment.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete comment')
      }

      onDeleted?.(comment.id)
    } catch (err) {
      logger.error('Error deleting comment:', err)
      alert(err instanceof Error ? err.message : 'Failed to delete comment')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleReplyAdded = async (newReply: TripComment) => {
    setIsReplying(false)
    // 親コンポーネントでコメントを再取得する
    onReplyAdded?.()
  }

  // 削除されたコメントの表示
  if (comment.deleted) {
    return (
      <div className="py-2 text-sm text-gray-400 italic">
        This comment has been deleted.
      </div>
    )
  }

  return (
    <div className="border-b border-gray-200 pb-4 last:border-b-0">
      <div className="flex gap-3">
        {/* アバター */}
        <Link
          href={`/${comment.user_name}`} // TODO: userSlugを使用
          className="flex-shrink-0"
        >
          {comment.user_avatar ? (
            <Image
              src={comment.user_avatar}
              alt={comment.user_name}
              width={40}
              height={40}
              className="rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
              <Icon icon="mdi:account" className="h-6 w-6 text-gray-600" />
            </div>
          )}
        </Link>

        {/* コメント内容 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={`/${comment.user_name}`} // TODO: userSlugを使用
              className="font-semibold text-gray-900 hover:text-indigo-600"
            >
              {comment.user_name}
            </Link>
            <span className="text-xs text-gray-500">
              {formatRelativeTime(createdAt)}
            </span>
          </div>

          <p className="text-gray-800 whitespace-pre-wrap break-words">{comment.content}</p>

          {/* アクションボタン */}
          <div className="flex items-center gap-4 mt-2">
            {user && !isReplying && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsReplying(true)
                }}
                className="text-sm text-gray-600 hover:text-indigo-600 flex items-center gap-1"
              >
                <Icon icon="mdi:reply" className="h-4 w-4" />
                Reply
              </button>
            )}

            {tripSlug && comment.id && !isOwner && (
              <div
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
              >
                <CommentLikeButton
                  tripSlug={tripSlug}
                  commentId={comment.id}
                  initialLiked={false}
                  initialCount={comment.likes_count || 0}
                  size="sm"
                  showCount={true}
                />
              </div>
            )}

            {replies.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setShowReplies(!showReplies)
                }}
                className="text-sm text-gray-600 hover:text-indigo-600 flex items-center gap-1"
              >
                <Icon
                  icon={showReplies ? 'mdi:chevron-up' : 'mdi:chevron-down'}
                  className="h-4 w-4"
                />
                {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
              </button>
            )}

            {isOwner && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleDelete()
                }}
                disabled={isDeleting}
                className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1 disabled:opacity-50"
              >
                <Icon icon="mdi:delete" className="h-4 w-4" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            )}
          </div>

          {/* 返信入力 */}
          {isReplying && user && (
            <div className="mt-3 ml-4 border-l-2 border-gray-200 pl-4">
              <CommentInput
                tripSlug={tripSlug}
                parentCommentId={comment.id}
                onCommentAdded={handleReplyAdded}
                onCancel={() => setIsReplying(false)}
                placeholder="Write a reply..."
              />
            </div>
          )}

          {/* 返信表示 */}
          {showReplies && replies.length > 0 && (
            <div className="mt-4 ml-4 space-y-3 border-l-2 border-gray-200 pl-4">
              {replies.map((reply) => {
                // この返信に対する返信を取得（再帰的）
                const replyReplies = allComments.filter((c) => c.parent_comment_id === reply.id)
                return (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    tripSlug={tripSlug}
                    onDeleted={onDeleted}
                    onReplyAdded={onReplyAdded}
                    replies={replyReplies}
                    allComments={allComments}
                  />
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

