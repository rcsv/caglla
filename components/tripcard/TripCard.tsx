'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card } from '@/components/common/Card'
import { IconRenderer } from '@/components/common/icons/IconRenderer'
import { dateUtils } from '@/lib/utils/date'
import { getCountryFlag } from '@/lib/utils/country-flags'
import type { Trip } from '@/lib/core/types'

type TripCardVariant = 'standard' | 'imageFull'

export interface TripCardProps {
  trip: Trip
  isPastTrip?: boolean
  variant?: TripCardVariant
}

export const TripCard: React.FC<TripCardProps> = ({ trip, isPastTrip = false, variant = 'standard' }) => {
        // スラッグベースのURLを生成
        const getTripUrl = () => {
          if (trip.creator?.slug && trip.slug) {
            return `/${trip.creator.slug}/${trip.slug}`
          }
          // フォールバック: スラッグが存在しない場合はIDベースのURL
          return `/trip/${trip.id}`
        }

  if (variant === 'imageFull') {
    return (
      <Link href={getTripUrl()} className="block group">
        <div className="relative overflow-hidden rounded-2xl shadow-sm hover:shadow-md transition bg-gray-900 h-[28rem]">
          {/* Image */}
          {trip.image_url && (
            <Image
              src={trip.image_url}
              alt={trip.title}
              fill
              className={`object-cover ${isPastTrip ? 'sepia' : ''}`}
              style={isPastTrip ? { filter: 'sepia(0.25) contrast(1.05) brightness(0.95)' } : {}}
            />
          )}
          {/* Top-right badge */}
          <div className="absolute top-3 right-3">
            <IconRenderer iconName="publicaccess" className="w-3 h-3" />
          </div>
          {/* Bottom gradient overlay */}
          <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
          {/* Text content */}
          <div className="absolute inset-x-0 bottom-0 p-6 text-white">
            <h3 className="text-2xl font-semibold drop-shadow-sm line-clamp-2">{trip.title}</h3>
            {trip.description && (
              <p className="mt-2 text-sm text-white/85 line-clamp-2">{trip.description}</p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/85">
              {trip.destination && (
                <span className="px-2 py-1 bg-white/10 rounded-full flex items-center gap-1">
                  <IconRenderer iconName="pin" className="w-3 h-3" color="white" />
                  {trip.destination}
                </span>
              )}
              {trip.destination_place?.address_components && (
                <span className="px-2 py-1 bg-white/10 rounded-full flex items-center gap-1">
                  <span className="text-sm">
                    {getCountryFlag(
                      trip.destination_place.address_components
                        .find((component: any) => component.types.includes('country'))
                        ?.short_name || 'unknown'
                    )}
                  </span>
                </span>
              )}
              {trip.start_date && trip.end_date && (
                <span className="px-2 py-1 bg-white/10 rounded-full">
                  {(() => {
                    const { futureTrips, pastTrips } = dateUtils.sortTripsByDate([trip])
                    if (futureTrips.length > 0) {
                      return dateUtils.formatFutureTripDate(trip.start_date, trip.end_date)
                    } else if (pastTrips.length > 0) {
                      return dateUtils.formatPastTripDate(trip.start_date, trip.end_date)
                    } else {
                      return dateUtils.formatDateRange(trip.start_date, trip.end_date)
                    }
                  })()}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    )
  }

  // standard
  return (
    <Link href={getTripUrl()} className="block group">
      <Card interactive padding="md" className="h-full">
        {trip.image_url && (
          <div className="mb-4">
            <div className={`relative w-full h-32 rounded-lg overflow-hidden ${isPastTrip ? 'shadow-inner-burned' : ''}`}>
              <Image
                src={trip.image_url}
                alt={trip.title}
                width={400}
                height={128}
                className={`w-full h-32 object-cover rounded-lg ${isPastTrip ? 'sepia filter-grayscale-20' : ''}`}
                style={isPastTrip ? { filter: 'sepia(0.3) contrast(1.1) brightness(0.9)' } : {}}
              />
              {isPastTrip && (
                <div
                  className="absolute inset-0 rounded-lg pointer-events-none"
                  style={{ boxShadow: 'inset 0 0 20px rgba(139, 69, 19, 0.3), inset 0 0 40px rgba(160, 82, 45, 0.2), inset 0 0 60px rgba(139, 69, 19, 0.1)' }}
                />
              )}
            </div>
          </div>
        )}

        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{trip.title}</h3>
          <IconRenderer iconName="publicaccess" className="w-3 h-3" />
        </div>

        {trip.description && <p className="text-gray-600 text-sm mb-3 line-clamp-2">{trip.description}</p>}

        {trip.destination && (
          <p className="text-gray-500 text-sm mb-3 flex items-center gap-1">
            <IconRenderer iconName="pin" className="w-4 h-4" color="#6b7280" />
            {trip.destination}
          </p>
        )}

        {trip.start_date && trip.end_date && (
          <p className="text-gray-500 text-sm flex items-center gap-1">
            <IconRenderer iconName="calendar" className="w-4 h-4" color="#6b7280" />
            {(() => {
              const { futureTrips, pastTrips } = dateUtils.sortTripsByDate([trip])
              if (futureTrips.length > 0) {
                return dateUtils.formatFutureTripDate(trip.start_date, trip.end_date)
              } else if (pastTrips.length > 0) {
                return dateUtils.formatPastTripDate(trip.start_date, trip.end_date)
              } else {
                return dateUtils.formatDateRange(trip.start_date, trip.end_date)
              }
            })()}
          </p>
        )}
      </Card>
    </Link>
  )
}

export default TripCard


