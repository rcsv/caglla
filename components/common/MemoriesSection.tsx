'use client'

import React from 'react'
import Link from 'next/link'
import Card from '@/components/common/Card'
import TripCard from '@/components/tripcard/TripCard'
import type { Trip } from '@/lib/types'

export interface MemoriesSectionProps {
  trips: Trip[]
}

export const MemoriesSection: React.FC<MemoriesSectionProps> = ({ trips }) => {
  if (!trips || trips.length === 0) return null
  const limited = trips.slice(0, 3)
  return (
    <section id="memories">
      <Card
        title={
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium mr-3">思い出</span>
              <span className="text-gray-500 text-sm">{trips.length}件</span>
            </div>
            <Link href="/memories" className="text-sm text-blue-600 hover:underline">すべて見る</Link>
          </div>
        }
        padding="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {limited.map((trip) => (
            <TripCard key={trip.id} trip={trip} isPastTrip={true} variant="imageFull" />
          ))}
        </div>
      </Card>
    </section>
  )
}

export default MemoriesSection


