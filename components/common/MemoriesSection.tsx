'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import Card from '@/components/common/Card'
import Button from '@/components/common/Button'
import TripCard from '@/components/tripcard/TripCard'
import type { Trip } from '@/lib/types'

export interface MemoriesSectionProps {
  trips: Trip[]
}

export const MemoriesSection: React.FC<MemoriesSectionProps> = ({ trips }) => {
  const router = useRouter()
  
  if (!trips || trips.length === 0) return null
  const limited = trips.slice(0, 3)
  return (
    <section id="memories">
      <Card
        title={
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">思い出</h2>
              <span className="px-4 text-gray-500 text-sm">{trips.length}件</span>
            </div>
            <Button
              variant="outline"
              size="lg"
              onClick={() => router.push('/memories')}
            >すべての思い出</Button>
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


