'use client'

import { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import Link from 'next/link'
import { getRecentTrips, type RecentTripEntry } from '@/lib/utils/recent-trips'

export default function RecentlyCheckedSection() {
  const [recentTrips, setRecentTrips] = useState<RecentTripEntry[] | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setRecentTrips(getRecentTrips())

    const handleStorage = (e: StorageEvent) => {
      if (e.key && e.key !== 'recent_trips_v1') return
      setRecentTrips(getRecentTrips())
    }

    window.addEventListener('storage', handleStorage)
    return () => {
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  return (
    <section className="bg-white rounded-sm shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Icon icon="mdi:clock-time-four-outline" className="h-5 w-5 text-purple-500" />
          Recently You Checked
        </h2>
        {/* v1 では View All の遷移先未定のため、ボタンは非表示 */}
      </div>

      {recentTrips === null && (
        <div className="space-y-3">
          <div className="h-16 rounded-sm bg-gray-100 animate-pulse" />
          <div className="h-16 rounded-sm bg-gray-100 animate-pulse" />
        </div>
      )}

      {recentTrips && recentTrips.length === 0 && (
        <div className="border border-dashed border-gray-300 rounded-sm p-4 text-center text-xs text-gray-500">
          You haven’t viewed any trips recently.
        </div>
      )}

      {recentTrips && recentTrips.length > 0 && (
        <div className="space-y-3">
          {recentTrips.map((trip) => (
            <Link
              key={trip.tripId + trip.viewedAt}
              href={`/${trip.creatorSlug}/${trip.slug}`}
              className="flex items-center gap-3 rounded-sm border border-gray-200 px-3 py-2 hover:border-purple-300 hover:bg-purple-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {trip.title || 'Untitled Trip'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {trip.destination || 'No destination'}
                </p>
              </div>
              <div className="ml-2 text-[10px] text-gray-400 whitespace-nowrap">
                {trip.viewedAt.slice(0, 10)}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}


