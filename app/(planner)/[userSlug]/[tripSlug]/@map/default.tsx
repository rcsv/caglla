 'use client'

import TripMap from '@/components/trip/TripMap'
import type { Trip, Itinerary } from '@/lib/core/types'
import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { makeAuthenticatedRequest } from '@/lib/api/helpers'
import Loading from '@/components/common/Loading'
import logger from '@/lib/core/logger'

/**
 * Map Default Slot (Read-only)
 * 
 * Phase 2-5: Parallel Routes実装（v3.0.0）
 * 
 * - URLパラメータからtripSlugを取得し、自前でTripをフェッチ
 * - 読み取り専用として地図を描画（追加・移動などの操作は抑止）
 */
export default function MapDefault() {
  const params = useParams<{ userSlug: string; tripSlug: string }>()
  const tripSlug = params?.tripSlug
  const router = useRouter()
  const searchParams = useSearchParams()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [selectedItineraryId, setSelectedItineraryId] = useState<string | null>(null)
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

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
        } else {
          setTrip(null)
        }
      } catch (e) {
        logger.error('Failed to load trip for map slot', e)
      } finally {
        setLoading(false)
      }
    }
    void init()
  }, [tripSlug])

  // URLクエリ（sd, si, mf）から選択状態を反映
  useEffect(() => {
    const sd = searchParams?.get('sd') || null
    const si = searchParams?.get('si') || null
    setSelectedDayId(sd)
    setSelectedItineraryId(si)
  }, [searchParams])

  const itineraries: Itinerary[] = useMemo(() => {
    if (!trip?.days) return []
    if (selectedDayId) {
      const day = trip.days.find(d => d.id === selectedDayId)
      return day?.itineraries || []
    }
    return trip.days.flatMap(d => d.itineraries || [])
  }, [trip, selectedDayId])

  if (loading) {
    return <Loading className="py-6" />
  }
  if (!trip) {
    return null
  }

  return (
    <div className="h-full bg-white">
      <TripMap
        itineraries={itineraries}
        trip={trip}
        selectedItineraryId={selectedItineraryId}
        selectedDayId={selectedDayId}
        onItineraryClick={(id) => {
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
        }}
        onPoiDataUpdate={() => {}}
        // 読み取り専用のため追加操作は無効化
        onAddFromPOI={undefined}
        className="h-full w-full"
        focusMode={selectedItineraryId ? 'single' : selectedDayId ? 'day' : 'all'}
        onMapInteractionStart={() => {}}
        scrollSyncEnabled={false}
        onRequestEnableScrollSync={() => {}}
        initialCenter={trip.destination_place?.geometry?.location || undefined}
      />
    </div>
  )
}

