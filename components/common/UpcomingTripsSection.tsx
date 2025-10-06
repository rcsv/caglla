'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Card from '@/components/common/Card'
import TripCard from '@/components/tripcard/TripCard'
import type { Trip } from '@/lib/types'
import Button from './Button'

export interface UpcomingTripsSectionProps {
  trips: Trip[]
}

export const UpcomingTripsSection: React.FC<UpcomingTripsSectionProps> = ({ trips }) => {
  if (!trips || trips.length === 0) return null
  const limited = trips.slice(0, 3)
  const router = useRouter()
  return (
    <section>
      <Card
        title={
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">計画中の旅行</h2>
              <span className="px-4 text-gray-500 text-sm">{trips.length}件</span>
            </div>
            <Button
              variant="outline"
              size="lg"
              onClick={() => router.push('/plan')}>すべての旅行プラン</Button>

            {/* <Link href="/plan" className="text-sm text-blue-600 hover:underline">すべて見る</Link> */}
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


