 'use client'

import TripItineraryView from '@/components/trip/TripItineraryView'
import type { Trip } from '@/lib/core/types'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { makeAuthenticatedRequest } from '@/lib/api/helpers'
import Loading from '@/components/common/Loading'
import logger from '@/lib/core/logger'
import { useAuth } from '@/lib/contexts/auth'
import { canEditTrip } from '@/lib/core/permissions'

/**
 * Timeline Default Slot
 * 
 * Phase 2-5: Parallel Routes実装（v3.0.0）
 * 
 * タイムラインのデフォルト表示
 */
export default function TimelineDefault() {
  const params = useParams<{ userSlug: string; tripSlug: string }>()
  const tripSlug = params?.tripSlug
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set())
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null)
  const [selectedItineraryId, setSelectedItineraryId] = useState<string | null>(null)
  const [loadingDayIds] = useState<Set<string>>(new Set())
  const isProgrammaticScrollRef = useRef(false)
  const scrollToItineraryRef = useRef<((itineraryId: string) => void) | null>(null)

  useEffect(() => {
    const init = async () => {
      try {
        if (!tripSlug) {
          setLoading(false)
          return
        }
        const res = await makeAuthenticatedRequest(`/api/trip/${tripSlug}`)
        if (res.ok) {
          const data = await res.json()
          setTrip(data as Trip)
          setError(null)
        } else {
          // ステータスごとに簡易メッセージ
          if (res.status === 403) setError('forbidden')
          else if (res.status === 404) setError('not-found')
          else setError('unknown')
          setTrip(null)
        }
      } catch (e) {
        logger.error('Failed to load trip for timeline slot', e)
        setError('unknown')
      } finally {
        setLoading(false)
      }
    }
    void init()
  }, [tripSlug])

  const onToggleDayCollapse = (dayId: string) => {
    setCollapsedDays(prev => {
      const next = new Set(prev)
      if (next.has(dayId)) next.delete(dayId)
      else next.add(dayId)
      return next
    })
  }
  const onDayClick = (dayId: string) => {
    setSelectedDayId(prev => (prev === dayId ? null : dayId))
    setSelectedItineraryId(null)
    const params = new URLSearchParams(searchParams?.toString() || '')
    if (dayId && selectedDayId !== dayId) {
      params.set('sd', dayId)
      params.set('mf', 'day')
    } else {
      params.delete('sd')
      params.set('mf', 'all')
    }
    router.replace(`?${params.toString()}`)
  }
  const onItineraryClickSync = (id: string) => {
    setSelectedItineraryId(id)
    const params = new URLSearchParams(searchParams?.toString() || '')
    if (id) {
      params.set('si', id)
      params.set('mf', 'single')
    } else {
      params.delete('si')
      params.set('mf', 'all')
    }
    router.replace(`?${params.toString()}`)
  }

  if (loading) {
    return <Loading className="py-6" />
  }
  if (!trip) {
    if (error === 'forbidden') {
      return <div className="p-4 text-gray-500">This trip is private. You do not have permission to view the timeline.</div>
    }
    if (error === 'not-found') {
      return <div className="p-4 text-gray-500">Trip not found.</div>
    }
    return <div className="p-4 text-gray-500">Failed to load trip.</div>
  }

  // 公開でないかつ所有者でない場合は案内表示
  const isOwner = Boolean(user && canEditTrip(user, trip))
  if (trip.access_level !== 'public' && !isOwner) {
    return (
      <div className="p-4 text-gray-500">
        This trip is private. Timeline is not available.
      </div>
    )
  }

  return (
    <div className="p-0">
      <TripItineraryView
        trip={trip}
        canEdit={Boolean(user && canEditTrip(user, trip))}
        collapsedDays={collapsedDays}
        selectedDayId={selectedDayId}
        selectedItineraryId={selectedItineraryId}
        loadingDayIds={loadingDayIds}
        onToggleDayCollapse={onToggleDayCollapse}
        onDayClick={onDayClick}
        // 読み取り専用: 以下はno-op
        onAddSchedule={() => {}}
        onInsertSchedule={() => {}}
        onAddDay={() => {}}
        onScheduleUpdated={() => {}}
        onMoveUp={() => {}}
        onMoveDown={() => {}}
        onMoveToDay={() => {}}
        onDuplicateToDay={() => {}}
        onScheduleDelete={() => {}}
        onItineraryClick={onItineraryClickSync}
        onDragEnd={() => {}}
        onUpdateTrip={() => {}}
        onReorderItineraries={() => {}}
        expandAllDays={() => setCollapsedDays(new Set())}
        collapseAllDays={() => {
          if (!trip?.days) return
          setCollapsedDays(new Set(trip.days.map(d => d.id)))
        }}
        scrollSyncEnabled={false}
        onScrollSyncEnabledChange={() => {}}
        isProgrammaticScrollRef={isProgrammaticScrollRef}
        scrollToItineraryRef={scrollToItineraryRef}
      />
    </div>
  )
}

