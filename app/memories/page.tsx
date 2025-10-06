'use client'

import { useAuth } from '@/lib/auth-context'
import { useUserData } from '@/lib/user-data-context'
import { dateUtils } from '@/lib/date-utils'
import Loading from '@/components/common/Loading'
import TripCard from '@/components/tripcard/TripCard'
import Card from '@/components/common/Card'
import Link from 'next/link'

export default function MemoriesListPage() {
  const { user, loading } = useAuth()
  const { trips, tripsLoading } = useUserData()

  if (loading || tripsLoading) {
    return <Loading fullScreen size="lg" />
  }
  if (!user) return null

  const { pastTrips } = dateUtils.sortTripsByDate(trips)

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <Card
          title={<div className="flex items-center justify-between"><span className="text-lg font-medium text-gray-900">思い出</span><Link href="/home" className="text-sm text-blue-600 hover:underline">ホームへ戻る</Link></div>}
          padding="lg"
        >
          {pastTrips.length === 0 ? (
            <div className="text-center text-gray-500 py-12">思い出がまだありません</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastTrips.map(trip => (
                <TripCard key={trip.id} trip={trip} isPastTrip={true} variant="imageFull" />
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  )
}


