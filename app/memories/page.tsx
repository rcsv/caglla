'use client'

import { useAuth } from '@/lib/contexts/auth'
import { useUserData } from '@/lib/contexts/user-data'
import { dateUtils } from '@/lib/utils/date'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Loading from '@/components/common/Loading'
import TripCard from '@/components/tripcard/TripCard'
import Card from '@/components/common/Card'
import HomeHeader from '@/components/common/HomeHeader'
import HomeFooter from '@/components/common/HomeFooter'
// 設定モーダルはプロフィールページへ移行
import type { Trip } from '@/lib/core/types'

export default function MemoriesListPage() {
  const { user, loading, logout } = useAuth()
  const { trips, tripsLoading, planConfig, planLoading, userData, userDataLoading } = useUserData()
  const router = useRouter()
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)

  if (loading || tripsLoading || planLoading || userDataLoading) {
    return <Loading fullScreen size="lg" />
  }
  if (!user) return null

  const { pastTrips } = dateUtils.sortTripsByDate(trips)

  // 過去の旅行を年別にグループ化
  const tripsByYear = pastTrips.reduce((acc, trip) => {
    const year = trip.start_date ? new Date(trip.start_date).getFullYear() : new Date().getFullYear()
    if (!acc[year]) {
      acc[year] = []
    }
    acc[year].push(trip)
    return acc
  }, {} as Record<number, Trip[]>)

  // 年を降順でソート（新しい年が上）
  const sortedYears = Object.keys(tripsByYear).map(Number).sort((a, b) => b - a)

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  const handleChangePlan = () => {
    router.push('/subscription')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <HomeHeader
        userName={userData?.name || user?.email || 'User'}
        planName={planConfig?.name || 'Season Traveler'}
        avatarUrl={userData?.profile_image_url || user?.photoURL}
        onLogout={handleLogout}
        onChangePlan={handleChangePlan}
        userSlug={userData?.slug}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">思い出</h1>
          <p className="text-gray-600 mt-2">過去の旅行を振り返りましょう</p>
        </div>

        {pastTrips.length === 0 ? (
          <Card padding="lg">
            <div className="text-center text-gray-500 py-12">思い出がまだありません</div>
          </Card>
        ) : (
          <div className="space-y-8">
            {sortedYears.map(year => (
              <Card
                key={year}
                title={<div className="text-xl font-semibold text-gray-900">{year}年</div>}
                padding="lg"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tripsByYear[year].map((trip: Trip) => (
                    <TripCard key={trip.id} trip={trip} isPastTrip={true} variant="imageFull" />
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* 設定モーダルはプロフィールページに移行したため削除 */}

      <HomeFooter />
    </div>
  )
}


