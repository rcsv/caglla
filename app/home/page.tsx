'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { makeAuthenticatedRequest } from '@/lib/api-helpers'
import { dateUtils } from '@/lib/date-utils'
import UserSettingsModal from '@/components/UserSettingsModal'
import TripCard from '@/components/common/TripCard'
import HomeHeader from '@/components/common/HomeHeader'
import HomeFooter from '@/components/common/HomeFooter'
import UpcomingTripsSection from '@/components/common/UpcomingTripsSection'
import MemoriesSection from '@/components/common/MemoriesSection'
import PlanInfoDisplay from '@/components/PlanInfoDisplay'
import CountryStatsSimple from '@/components/stats/CountryStatsSimple'
import RecommendedTrips from '@/components/stats/RecommendedTrips'
import CreateTripDialog from '@/components/common/CreateTripDialog'
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
  const [isCreateTripDialogOpen, setIsCreateTripDialogOpen] = useState(false)

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
      const response = await makeAuthenticatedRequest('/api/trips/accessible?includeShared=true')
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

  const handleTripCreated = () => {
    // 旅行作成後に旅行一覧を再取得
    fetchTrips()
  }

  if (loading) {
    return <Loading fullScreen size="lg" />
  }

  if (!user) {
    return null
  }

  const { futureTrips, pastTrips } = dateUtils.sortTripsByDate(trips)
  const nextTrip = futureTrips[0] // 次の旅行プラン（1件のみ）

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
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
          {/* 7側のコンテンツ */}
          <div className="lg:col-span-7 space-y-8">
            {/* 新しい旅行を作成 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">新しい旅行を作成</h2>
                  <p className="text-gray-600">素晴らしい冒険の計画を始めましょう</p>
                </div>
                <button
                  onClick={() => setIsCreateTripDialogOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
                >
                  旅行を作成
                </button>
              </div>
            </div>

            {/* 旅行一覧（次の旅行プラン1件 + マップ） */}
            {nextTrip && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">次の旅行プラン</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <TripCard trip={nextTrip} variant="imageFull" />
                  <div className="bg-gray-100 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">旅行マップ（実装予定）</p>
                  </div>
                </div>
              </div>
            )}

            {/* 最近チェックした旅行 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">最近チェックした旅行</h3>
              <div className="text-center py-8 text-gray-500">
                <p>最近チェックした旅行はありません</p>
                <p className="text-sm mt-2">（実装予定）</p>
              </div>
            </div>

            {/* 今後の旅行計画 */}
            {futureTrips.length > 0 && (
              <UpcomingTripsSection trips={futureTrips} />
            )}

            {/* 思い出 */}
            {pastTrips.length > 0 && (
              <MemoriesSection trips={pastTrips} />
            )}
          </div>

          {/* 3側のコンテンツ */}
          <div className="lg:col-span-3 space-y-6">
            {/* 国別統計（地図なし） */}
            <CountryStatsSimple userId={user.uid} />

            {/* プラン情報 */}
            <PlanInfoDisplay />

            {/* おすすめ旅行計画 */}
            <RecommendedTrips limit={3} />
          </div>
        </div>
      </main>

      {/* User Settings Modal */}
      <UserSettingsModal 
        isOpen={isSettingsModalOpen} 
        onClose={() => setIsSettingsModalOpen(false)} 
      />

      {/* Create Trip Dialog */}
      <CreateTripDialog
        isOpen={isCreateTripDialogOpen}
        onClose={() => setIsCreateTripDialogOpen(false)}
        onSuccess={handleTripCreated}
      />

      <HomeFooter />
    </div>
  )
}
