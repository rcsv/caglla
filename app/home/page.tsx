'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { makeAuthenticatedRequest } from '@/lib/api-helpers'
import { dateUtils } from '@/lib/date-utils'
import UserSettingsModal from '@/components/UserSettingsModal'
import CountryStats from '@/components/stats/CountryStats'
import TripCard from '@/components/common/TripCard'
import HomeHeader from '@/components/common/HomeHeader'
import HomeFooter from '@/components/common/HomeFooter'
import UpcomingTripsSection from '@/components/common/UpcomingTripsSection'
import MemoriesSection from '@/components/common/MemoriesSection'
import PlanInfoDisplay from '@/components/PlanInfoDisplay'
import { useSubscription } from '@/lib/subscription-context'
import { RestrictionType } from '@/lib/restriction-system'
import type { Trip } from '@/lib/types'
import Loading from '@/components/common/Loading'

export default function HomePage() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const [trips, setTrips] = useState<Trip[]>([])
  const [tripsLoading, setTripsLoading] = useState(true)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchTrips()
    }
  }, [user])

  const fetchTrips = async () => {
    try {
      const response = await makeAuthenticatedRequest('/api/trips')
      if (response.ok) {
        const data = await response.json()
        setTrips(data.trips || [])
      } else if (response.status === 401) {
        console.error('Authentication failed')
        router.push('/')
      } else {
        console.error('Failed to fetch trips:', response.status)
      }
    } catch (error) {
      console.error('Failed to fetch trips:', error)
    } finally {
      setTripsLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  if (loading) {
    return <Loading fullScreen size="lg" />
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <HomeHeader
        userName={user.displayName || user.email || 'User'}
        planName={useSubscription().subscriptionStatus.plan?.name || 'Season Traveler'}
        avatarUrl={user.photoURL}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* プラン情報表示 */}
        <PlanInfoDisplay className="mb-6" />
        
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">あなたの旅行</h2>
          <Link
            href="/trip/new"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
          >
            新しい旅行を作成
          </Link>
        </div>

        {tripsLoading ? (
          <Loading message="旅行を読み込み中..." className="py-12" />
        ) : trips.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">✈️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">まだ旅行がありません</h3>
            <p className="text-gray-600 mb-6">最初の旅行を作成して、素晴らしい冒険を始めましょう！</p>
            <Link
              href="/trip/new"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
            >
              旅行を作成
            </Link>
          </div>
        ) : (
          <div className="space-y-12">
            {/* 国別統計とおすすめ旅行計画 */}
            <CountryStats userId={user.uid} />
            
            {/* 旅行一覧 */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-6">旅行一覧</h3>
              {(() => {
                const { futureTrips, pastTrips } = dateUtils.sortTripsByDate(trips)
                
                // TripCardはcomponents/commonへ分離
                const TripCardInline = ({ trip, isPastTrip = false }: { trip: Trip, isPastTrip?: boolean }) => (
                  <TripCard key={trip.id} trip={trip} isPastTrip={isPastTrip} variant="imageFull" />
                )

                return (
                  <div className="space-y-8">
                    <UpcomingTripsSection trips={futureTrips} />
                    <MemoriesSection trips={pastTrips} />
                  </div>
                )
              })()}
            </div>
          </div>
        )}
      </main>

      {/* User Settings Modal */}
      <UserSettingsModal 
        isOpen={isSettingsModalOpen} 
        onClose={() => setIsSettingsModalOpen(false)} 
      />
      <HomeFooter />
    </div>
  )
}
