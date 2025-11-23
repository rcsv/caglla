'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { Icon } from '@iconify/react'
import { Button } from '@/components/common/Button'
import { makeAuthenticatedRequest } from '@/lib/api/helpers'
import { useAuth } from '@/lib/contexts/auth'
import logger from '@/lib/core/logger'

interface FollowButtonProps {
  userSlug: string
  initialFollowing?: boolean
  onToggle?: (following: boolean) => void
  size?: 'sm' | 'md' | 'lg'
  variant?: 'button' | 'icon'
  disabled?: boolean
}

/**
 * Follow Button Component
 * 
 * Phase 2-3: Social Components実装（v3.0.0）
 * 
 * フォローボタンコンポーネント
 * - 楽観的UI更新（Optimistic Update）
 * - エラーハンドリングとロールバック
 */
export default function FollowButton({
  userSlug,
  initialFollowing,
  onToggle,
  size = 'md',
  variant = 'button',
  disabled = false,
}: FollowButtonProps) {
  const { user, loading: authLoading } = useAuth()
  const [following, setFollowing] = useState(initialFollowing ?? false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // フォロー状態を取得
  useEffect(() => {
    if (!user || authLoading || initialFollowing !== undefined) return

    const fetchFollowState = async () => {
      try {
        const response = await makeAuthenticatedRequest(`/api/users/${userSlug}/follow`)
        if (response.ok) {
          const data = await response.json()
          setFollowing(data.following)
        }
      } catch (err) {
        logger.error('Error fetching follow state:', err)
      }
    }

    void fetchFollowState()
  }, [user, authLoading, userSlug, initialFollowing])

  // 楽観的UI更新のための前の状態を保存
  const previousStateRef = useRef<boolean>(initialFollowing ?? false)

  const handleToggle = useCallback(async (e?: React.MouseEvent) => {
    // イベントの伝播を防ぐ
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    // 認証チェック
    if (authLoading) return
    if (!user) {
      logger.debug('User not authenticated, redirecting to login')
      return
    }

    if (loading || disabled) return

    // 楽観的UI更新：即座にUIを更新
    const wasFollowing = following
    previousStateRef.current = wasFollowing

    const nextFollowing = !wasFollowing

    setFollowing(nextFollowing)
    setLoading(true)
    setError(null)

    // コールバックを即座に呼び出し（楽観的UI更新）
    onToggle?.(nextFollowing)

    try {
      // API呼び出し
      const response = nextFollowing
        ? await makeAuthenticatedRequest(`/api/users/${userSlug}/follow`, {
            method: 'POST',
          })
        : await makeAuthenticatedRequest(`/api/users/${userSlug}/follow`, {
            method: 'DELETE',
          })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to ${nextFollowing ? 'follow' : 'unfollow'} user`)
      }

      // サーバーからの実際の値を反映
      const actualFollowing = nextFollowing
      setFollowing(actualFollowing)
      onToggle?.(actualFollowing)
    } catch (err) {
      logger.error('Error toggling follow:', err)

      // ロールバック：前の状態に戻す
      setFollowing(previousStateRef.current)
      onToggle?.(previousStateRef.current)

      setError(err instanceof Error ? err.message : 'Failed to toggle follow')
    } finally {
      setLoading(false)
    }
  }, [userSlug, following, loading, disabled, authLoading, user, onToggle, previousStateRef])

  // 未認証状態
  if (!user && !authLoading) {
    return null // フォローボタンは認証済みユーザーのみ表示
  }

  // アイコンバリアント
  if (variant === 'icon') {
    return (
      <button
        type="button"
        disabled={loading || disabled}
        onClick={handleToggle}
        className={`
          inline-flex items-center justify-center rounded-full
          transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          ${size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-12 h-12' : 'w-10 h-10'}
          ${
            following
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }
          ${loading ? 'opacity-70 cursor-wait' : ''}
        `}
        aria-label={following ? 'Unfollow' : 'Follow'}
        aria-pressed={following}
      >
        <Icon
          icon={following ? 'mdi:account-minus' : 'mdi:account-plus'}
          className={size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'}
        />
      </button>
    )
  }

  // ボタンバリアント
  const buttonClasses = `
    inline-flex items-center gap-2
    transition-all duration-200
    disabled:opacity-50 disabled:cursor-not-allowed
    ${size === 'sm' ? 'text-sm px-3 py-1.5' : size === 'lg' ? 'text-base px-6 py-3' : 'text-sm px-4 py-2'}
    ${
      following
        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        : 'bg-indigo-600 text-white hover:bg-indigo-700'
    }
    ${loading ? 'opacity-70 cursor-wait' : ''}
    ${error ? 'ring-2 ring-red-300' : ''}
  `.trim()

  return (
    <Button
      variant={following ? 'outline' : 'primary'}
      size={size}
      disabled={loading || disabled}
      onClick={handleToggle}
      leftIcon={
        <Icon
          icon={following ? 'mdi:account-minus' : 'mdi:account-plus'}
          className={size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'}
        />
      }
    >
      {loading ? (following ? 'Unfollowing...' : 'Following...') : following ? 'Following' : 'Follow'}
      {error && (
        <span className="ml-2 text-xs text-red-600" role="alert">
          {error}
        </span>
      )}
    </Button>
  )
}

