'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '@iconify/react'
import type { Trip } from '@/lib/core/types/trip'
import type { TripComment } from '@/lib/core/types/social'
import CommentList from '@/components/social/CommentList'
import { getZIndexClass } from '@/lib/core/z-index'
import { toDateOrNull } from '@/lib/firebase/timestamp-utils'
import { resolveSocialStats } from '@/lib/social/trip-social-utils'
import { makeAuthenticatedRequest } from '@/lib/api/helpers'

/**
 * 相対時間をフォーマット（例: "45分前", "2時間前", "昨日"）
 */
function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'たった今'
  if (diffMins < 60) return `${diffMins}分前`
  if (diffHours < 24) return `${diffHours}時間前`
  if (diffDays === 1) return '昨日'
  if (diffDays < 7) return `${diffDays}日前`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}週間前`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}ヶ月前`
  return `${Math.floor(diffDays / 365)}年前`
}

interface TripCommentModalProps {
  isOpen: boolean
  onClose: () => void
  trip: Trip
}

/**
 * Trip Comment Modal Component
 * 
 * コメントモーダルダイアログ
 * - 左側：旅行の画像と情報
 * - 右側：コメントスレッド
 * - コメント入力とリアクション機能
 */
export default function TripCommentModal({
  isOpen,
  onClose,
  trip: initialTrip,
}: TripCommentModalProps) {
  const [mounted, setMounted] = useState(false)
  const [trip, setTrip] = useState<Trip>(initialTrip)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (isOpen) {
      // モーダルが開いたらbodyのスクロールを無効化
      document.body.style.overflow = 'hidden'
    } else {
      // モーダルが閉じたらbodyのスクロールを有効化
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      const handleEscapeKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose()
        }
      }
      window.addEventListener('keydown', handleEscapeKey)
      return () => {
        window.removeEventListener('keydown', handleEscapeKey)
      }
    }
  }, [isOpen, onClose])

  // モーダルが開いたときにtripデータをリセット
  useEffect(() => {
    if (isOpen) {
      setTrip(initialTrip)
    }
  }, [isOpen, initialTrip])

  // コメント数を楽観的に更新する関数
  const updateCommentCount = (delta: number) => {
    setTrip((prevTrip) => {
      const currentCount = resolveSocialStats(prevTrip).comments
      const newCount = Math.max(0, currentCount + delta)
      return {
        ...prevTrip,
        social_stats: {
          ...prevTrip.social_stats,
          comments_count: newCount,
        },
      } as Trip
    })
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!mounted) {
    return null
  }

  const creator = trip.creator
  const userName = creator?.name || 'Unknown User'
  const userSlug = creator?.slug
  const avatar = creator?.profile_image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`
  const title = trip.title || trip.destination || 'Untitled Trip'
  const location = trip.destination_place?.name || trip.destination || ''
  const summary = trip.description || ''
  const cover = trip.image_url || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80'
  const createdAt = toDateOrNull(trip.created_at)
  const timestamp = createdAt ? formatRelativeTime(createdAt) : ''
  const socialStats = resolveSocialStats(trip)
  const tripSlug = trip.slug || trip.id || ''

  return createPortal(
    isOpen ? (
      <div
        className={`fixed inset-0 bg-black/50 ${getZIndexClass('DIALOG_OVERLAY')} flex items-center justify-center p-4`}
        onClick={handleBackdropClick}
      >
        <div
          className={`bg-white ${getZIndexClass('DIALOG_POPUP')} rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ヘッダー */}
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <h2 className="text-xl font-semibold text-slate-900">コメント</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="閉じる"
            >
              <Icon icon="mdi:close" className="h-6 w-6" />
            </button>
          </div>

          {/* コンテンツ */}
          <div className="flex-1 flex overflow-hidden">
            {/* 左側：旅行情報 */}
            <div className="w-full md:w-1/2 border-r border-slate-200 overflow-y-auto bg-slate-50">
              <div className="p-6 space-y-6">
                {/* カバー画像 */}
                <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-slate-100">
                  <img
                    src={cover}
                    alt={title}
                    className="h-full w-full object-cover"
                  />
                </div>

                {/* ユーザー情報 */}
                <div className="flex items-center gap-3">
                  <img
                    src={avatar}
                    alt={userName}
                    className="h-12 w-12 rounded-full border border-slate-200 object-cover"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{userName}</p>
                    {timestamp && (
                      <p className="text-xs text-slate-500">{timestamp}</p>
                    )}
                  </div>
                </div>

                {/* タイトルと場所 */}
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
                  {location && (
                    <p className="mt-1 text-sm text-slate-500">{location}</p>
                  )}
                </div>

                {/* 説明 */}
                {summary && (
                  <p className="text-sm leading-6 text-slate-600">{summary}</p>
                )}

                {/* ハッシュタグ */}
                {trip.hashtags && trip.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {trip.hashtags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* ソーシャル統計 */}
                <div className="flex items-center gap-4 pt-4 border-t border-slate-200">
                  <div className="flex items-center gap-1 text-slate-600">
                    <Icon icon="mdi:heart" className="h-4 w-4" />
                    <span className="text-sm">{socialStats.likes}</span>
                  </div>
                  <div className="flex items-center gap-1 text-blue-500">
                    <Icon icon="mdi:comment" className="h-4 w-4" />
                    <span className="text-sm">{socialStats.comments}</span>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-500">
                    <Icon icon="mdi:share" className="h-4 w-4" />
                    <span className="text-sm">{socialStats.shares}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 右側：コメントスレッド */}
            <div className="w-full md:w-1/2 overflow-y-auto bg-white">
              <div className="p-6">
              <CommentList
                tripSlug={tripSlug}
                onCommentAdded={async () => {
                  // コメント追加時にコメント数を楽観的に更新
                  updateCommentCount(1)
                }}
                onCommentDeleted={async () => {
                  // コメント削除時にコメント数を楽観的に更新
                  updateCommentCount(-1)
                }}
              />
              </div>
            </div>
          </div>
        </div>
      </div>
    ) : null,
    document.body
  )
}

