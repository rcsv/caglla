'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Card from '@/components/common/Card'
import TripCard from '@/components/tripcard/TripCard'
import type { Trip } from '@/lib/core/types'
import Button from './Button'
import { t } from '@/lib/i18n'

export interface UpcomingTripsSectionProps {
  trips: Trip[]
}

export const UpcomingTripsSection: React.FC<UpcomingTripsSectionProps> = ({ trips }) => {
  const router = useRouter()
  
  if (!trips || trips.length === 0) return null
  const limited = trips.slice(0, 3)
  return (
    <section>
      <Card
        title={
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('home.dashboard.upcomingTrips.title')}</h2>
              <span className="px-4 text-gray-500 text-sm">{t('home.dashboard.upcomingTrips.count').replace('{count}', String(trips.length))}</span>
            </div>
            <Button
              variant="outline"
              size="lg"
              onClick={() => router.push('/plan')}>{t('home.dashboard.upcomingTrips.viewAll')}</Button>

            {/* <Link href="/plan" className="text-sm text-blue-600 hover:underline">すべて見る</Link> */}
          </div>
        }
        padding="lg"
        className="rounded-none shadow-none"
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


