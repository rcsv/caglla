'use client'

import React from 'react'
import TripCard from '@/components/tripcard/TripCard'
import type { Trip } from '@/lib/types'

export interface MemoriesSectionProps {
  trips: Trip[]
}

export const MemoriesSection: React.FC<MemoriesSectionProps> = ({ trips }) => {
  if (!trips || trips.length === 0) return null
  return (
    <section id="memories">
      <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium mr-3">思い出</span>
        <span className="text-gray-500 text-sm">{trips.length}件</span>
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trips.map((trip) => (
          <TripCard key={trip.id} trip={trip} isPastTrip={true} variant="imageFull" />
        ))}
      </div>
    </section>
  )
}

export default MemoriesSection


