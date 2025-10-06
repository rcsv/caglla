'use client'

import React from 'react'
import Link from 'next/link'
import Card from '@/components/common/Card'
import TripCard from '@/components/tripcard/TripCard'
import type { Trip } from '@/lib/types'

export interface UpcomingTripsSectionProps {
  trips: Trip[]
}

export const UpcomingTripsSection: React.FC<UpcomingTripsSectionProps> = ({ trips }) => {
  if (!trips || trips.length === 0) return null
  const limited = trips.slice(0, 3)
  return (
    <section>
      <Card
        title={
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium mr-3">次の旅行プラン</span>
              <span className="text-gray-500 text-sm">{trips.length}件</span>
            </div>
            <Link href="/plan" className="text-sm text-blue-600 hover:underline">すべて見る</Link>
          </div>
        }
        padding="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {limited.map((trip) => (
            <TripCard key={trip.id} trip={trip} variant="imageFull" />
          ))}
        </div>
      </Card>
    </section>
  )
}

export default UpcomingTripsSection


