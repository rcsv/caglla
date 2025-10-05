'use client'

import React from 'react'
import TripCard from '@/components/common/TripCard'
import type { Trip } from '@/lib/types'

export interface UpcomingTripsSectionProps {
  trips: Trip[]
}

export const UpcomingTripsSection: React.FC<UpcomingTripsSectionProps> = ({ trips }) => {
  if (!trips || trips.length === 0) return null
  return (
    <section>
      <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium mr-3">次の旅行プラン</span>
        <span className="text-gray-500 text-sm">{trips.length}件</span>
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trips.map((trip) => (
          <TripCard key={trip.id} trip={trip} variant="imageFull" />
        ))}
      </div>
    </section>
  )
}

export default UpcomingTripsSection


