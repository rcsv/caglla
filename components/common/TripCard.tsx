'use client'

import React from 'react'
import Link from 'next/link'
import { Card } from '@/components/common/Card'
import { dateUtils } from '@/lib/date-utils'
import type { Trip } from '@/lib/types'

export interface TripCardProps {
  trip: Trip
  isPastTrip?: boolean
}

export const TripCard: React.FC<TripCardProps> = ({ trip, isPastTrip = false }) => {
  return (
    <Link href={`/trip/${trip.id}`} className="block group">
      <Card interactive padding="md" className="h-full">
        {trip.image_url && (
          <div className="mb-4">
            <div className={`relative w-full h-32 rounded-lg overflow-hidden ${isPastTrip ? 'shadow-inner-burned' : ''}`}>
              <img
                src={trip.image_url}
                alt={trip.title}
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
          <div
            className={`flex items-center px-2 py-1 text-xs rounded-full ${
              trip.access_level === 'public' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}
          >
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {trip.access_level === 'public' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              )}
            </svg>
            <span>{trip.access_level === 'public' ? '公開' : '非公開'}</span>
          </div>
        </div>

        {trip.description && <p className="text-gray-600 text-sm mb-3 line-clamp-2">{trip.description}</p>}

        {trip.destination && <p className="text-gray-500 text-sm mb-3">📍 {trip.destination}</p>}

        {trip.start_date && trip.end_date && (
          <p className="text-gray-500 text-sm">
            📅 {(() => {
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


