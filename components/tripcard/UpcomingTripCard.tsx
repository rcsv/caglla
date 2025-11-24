'use client'

import React from 'react'
import Link from 'next/link'
import { Icon } from '@iconify/react'
import { toDateOrNull } from '@/lib/firebase/timestamp-utils'
import { t } from '@/lib/i18n'
import type { Trip } from '@/lib/core/types'
import Image from 'next/image'

interface UpcomingTripCardProps {
  trip: Trip
  imageUrl: string
  today: Date
}

const DAY_MS = 1000 * 60 * 60 * 24

export default function UpcomingTripCard({ trip, imageUrl, today }: UpcomingTripCardProps) {
  const startDate = toDateOrNull(trip.start_date)

  const daysUntil = startDate
    ? (() => {
        const start = new Date(startDate)
        start.setHours(0, 0, 0, 0)
        const diffMs = start.getTime() - today.getTime()
        return Math.floor(diffMs / DAY_MS)
      })()
    : null

  const getTripUrl = () => {
    if (trip.creator?.slug && trip.slug) {
      return `/${trip.creator.slug}/${trip.slug}`
    }
    return '/home'
  }

  return (
    <Link href={getTripUrl()} className="block">
      <div className="border border-gray-200 rounded overflow-hidden hover:border-emerald-300 hover:shadow-sm transition-all">
        <div className="flex gap-3">
          <div className="w-20 h-20 flex-shrink-0 bg-gray-100">
            <Image src={imageUrl} alt={trip.title || 'Upcoming trip cover'} className="w-full h-full object-cover" />
          </div>
          <div className="py-2 pr-3 flex-1">
            <h3 className="font-medium text-sm text-gray-900 mb-1 line-clamp-1">
              {trip.title || 'Untitled Trip'}
            </h3>
            <p className="text-xs text-gray-600 mb-1 line-clamp-1">
              {trip.destination_place?.name || trip.destination || 'No destination'}
            </p>
            {startDate && trip.end_date ? (
              <div className="flex items-center gap-2">
                <p className="text-xs text-gray-500">
                  {(() => {
                    const start = toDateOrNull(trip.start_date)
                    const end = toDateOrNull(trip.end_date)
                    if (!start || !end) return t('date.notSet')

                    const startMonth = start.getMonth() + 1
                    const startDay = start.getDate()
                    const endMonth = end.getMonth() + 1
                    const endDay = end.getDate()

                    return startMonth === endMonth
                      ? `${startMonth}/${startDay} - ${endDay}`
                      : `${startMonth}/${startDay} - ${endMonth}/${endDay}`
                  })()}
                </p>
                {daysUntil !== null && daysUntil >= 0 && (
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-sm ${
                      daysUntil <= 7
                        ? 'bg-red-100 text-red-700'
                        : daysUntil <= 30
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {daysUntil === 0
                      ? t('home.dashboard.upcomingTrips.today')
                      : `${daysUntil}${t('date.daysLater')}`}
                  </span>
                )}
              </div>
            ) : null}
          </div>
        </div>
        {daysUntil !== null && daysUntil >= 0 && daysUntil <= 7 && (
          <div
            className="h-1 bg-gray-100"
            style={{
              background: `linear-gradient(to left, #22c55e ${
                Math.min(100, (daysUntil / 7) * 100)
              }%, #e5e7eb ${Math.min(100, (daysUntil / 7) * 100)}%)`,
            }}
          >
            <span className="sr-only">
              {daysUntil === 0
                ? t('home.dashboard.upcomingTrips.today')
                : `${daysUntil}${t('date.daysLater')}`}
            </span>
          </div>
        )}
      </div>
    </Link>
  )
}

