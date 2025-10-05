'use client'

import React, { useEffect, useState } from 'react'
import { makeAuthenticatedRequest } from '@/lib/api-helpers'
import TripCard from '@/components/common/TripCard'
import Loading from '@/components/common/Loading'
import type { Trip } from '@/lib/types'

export interface RecommendedTripsProps {
  limit?: number
  className?: string
}

export const RecommendedTrips: React.FC<RecommendedTripsProps> = ({ limit = 6, className }) => {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const resp = await fetch(`/api/trips/recommendations?limit=${limit}`, { cache: 'no-store' })
        if (resp.ok) {
          const data = await resp.json()
          setTrips(data.trips || [])
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchRecommendations()
  }, [limit])

  if (loading) return <Loading className="py-8" message="おすすめ旅行を読み込み中..." />
  if (trips.length === 0) return null

  return (
    <section className={className}>
      <h3 className="text-xl font-semibold text-gray-900 mb-6">おすすめ旅行計画</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trips.map(trip => (
          <TripCard key={trip.id} trip={trip} variant="imageFull" />
        ))}
      </div>
    </section>
  )
}

export default RecommendedTrips


