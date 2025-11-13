'use client'

import { useAuth } from '@/lib/contexts/auth'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '@iconify/react'
import Loading from '@/components/common/Loading'
import logger from '@/lib/core/logger'
import { t } from '@/lib/i18n'

interface TripLikeButtonProps {
  tripSlug: string
  initialLikesCount?: number
  initialLikedByMe?: boolean
  onStateChange?: (state: { likesCount: number; likedByMe: boolean }) => void
  className?: string
  disabled?: boolean
}

export function TripLikeButton({
  tripSlug,
  initialLikesCount = 0,
  initialLikedByMe = false,
  onStateChange,
  className = '',
  disabled = false
}: TripLikeButtonProps) {
  const { user } = useAuth()
  const [likesCount, setLikesCount] = useState(Math.max(0, initialLikesCount))
  const [likedByMe, setLikedByMe] = useState(initialLikedByMe)
  const [pending, setPending] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const updateExternalState = useCallback(
    (state: { likesCount: number; likedByMe: boolean }) => {
      onStateChange?.(state)
    },
    [onStateChange]
  )

  const fetchLikeStatus = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const headers: Record<string, string> = {}
      if (user) {
        const token = await user.getIdToken()
        headers.Authorization = `Bearer ${token}`
      }

      const response = await fetch(`/api/trip/${tripSlug}/likes`, {
        method: 'GET',
        headers,
        signal: controller.signal
      })

      if (!response.ok) {
        logger.warn('Failed to fetch trip like status', { status: response.status })
        return
      }

      const data = await response.json().catch(() => ({}))
      const serverCount =
        typeof data.likesCount === 'number' && Number.isFinite(data.likesCount)
          ? Math.max(0, Math.floor(data.likesCount))
          : 0
      const serverLiked = Boolean(data.likedByMe)

      setLikesCount(serverCount)
      setLikedByMe(serverLiked)
      updateExternalState({ likesCount: serverCount, likedByMe: serverLiked })
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        logger.warn('Unable to load like status', error)
      }
    } finally {
      setInitialized(true)
    }
  }, [tripSlug, updateExternalState, user])

  useEffect(() => {
    void fetchLikeStatus()
    return () => {
      abortRef.current?.abort()
    }
  }, [fetchLikeStatus])

  useEffect(() => {
    setLikesCount(Math.max(0, initialLikesCount))
  }, [initialLikesCount])

  useEffect(() => {
    setLikedByMe(initialLikedByMe)
  }, [initialLikedByMe])

  const handleToggle = useCallback(async () => {
    if (disabled) return

    if (!user) {
      alert(t('trip.likes.loginRequired'))
      return
    }

    if (pending) return

    const previousLiked = likedByMe
    const previousCount = likesCount
    const nextLiked = !likedByMe
    const optimisticCount = Math.max(0, previousCount + (nextLiked ? 1 : -1))

    setLikedByMe(nextLiked)
    setLikesCount(optimisticCount)
    updateExternalState({ likesCount: optimisticCount, likedByMe: nextLiked })

    setPending(true)
    try {
      const token = await user.getIdToken()
      const response = await fetch(`/api/trip/${tripSlug}/likes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action: nextLiked ? 'like' : 'unlike' })
      })

      if (!response.ok) {
        throw new Error(`Failed to toggle like: ${response.status}`)
      }

      const data = await response.json().catch(() => ({}))
      const serverLiked =
        typeof data.likedByMe === 'boolean' ? data.likedByMe : nextLiked
      const serverCount =
        typeof data.likesCount === 'number' && Number.isFinite(data.likesCount)
          ? Math.max(0, Math.floor(data.likesCount))
          : optimisticCount

      setLikedByMe(serverLiked)
      setLikesCount(serverCount)
      updateExternalState({ likesCount: serverCount, likedByMe: serverLiked })
    } catch (error) {
      logger.error('Failed to toggle like', error)
      setLikedByMe(previousLiked)
      setLikesCount(previousCount)
      updateExternalState({ likesCount: previousCount, likedByMe: previousLiked })
      alert(t('trip.likes.error'))
    } finally {
      setPending(false)
    }
  }, [disabled, likedByMe, likesCount, pending, tripSlug, updateExternalState, user])

  const buttonLabel = useMemo(() => {
    if (!initialized && !disabled) {
      return t('trip.likes.loading')
    }
    return likedByMe ? t('trip.likes.button.liked') : t('trip.likes.button.like')
  }, [disabled, initialized, likedByMe])

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={disabled || pending}
      aria-pressed={likedByMe}
      className={`inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/85 px-4 py-2 text-sm font-semibold text-rose-700 backdrop-blur-sm transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 ${likedByMe ? 'text-rose-600' : ''} ${className}`}
      title={buttonLabel}
    >
      {pending ? (
        <Loading inline size="xs" color="rose" />
      ) : (
        <Icon
          icon={likedByMe ? 'mdi:heart' : 'mdi:heart-outline'}
          className={`h-5 w-5 ${likedByMe ? 'text-rose-600' : 'text-rose-500'}`}
          aria-hidden="true"
        />
      )}
      <span className="min-w-[1.5rem] text-base tabular-nums">{likesCount}</span>
    </button>
  )
}

export default TripLikeButton

