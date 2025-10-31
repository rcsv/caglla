'use client'

import { useAuth } from '@/lib/contexts/auth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { makeAuthenticatedRequest } from '@/lib/api/helpers'
import { dateUtils } from '@/lib/utils/date'
import UserSettingsModal from '@/components/modals/UserSettingsModal'
import TripCard from '@/components/tripcard/TripCard'
import HomeHeader from '@/components/common/HomeHeader'
import HomeFooter from '@/components/common/HomeFooter'
import UpcomingTripsSection from '@/components/common/UpcomingTripsSection'
import MemoriesSection from '@/components/common/MemoriesSection'
import PlanInfoDisplay from '@/components/ui/PlanInfoDisplay'
import CountryStatsSimple from '@/components/stats/CountryStatsSimple'
import RecommendedTrips from '@/components/stats/RecommendedTrips'
import NextTripCard from '@/components/tripcard/NextTripCard'
import { useUserData } from '@/lib/contexts/user-data'
import type { Trip } from '@/lib/core/types'
import Loading from '@/components/common/Loading'
import { t } from '@/lib/i18n'

export default function HomePage() {
  const { user, loading, logout } = useAuth()
  const { trips, tripsLoading, addTrip, refreshTrips, planConfig, planLoading, userData, userDataLoading } = useUserData()
  const router = useRouter()
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  const handleTripCreated = () => {
    // 旅行作成後に旅行一覧を再取得
    refreshTrips()
  }

  if (loading || tripsLoading || planLoading || userDataLoading) {
    return <Loading fullScreen size="lg" />
  }

  if (!user) {
    return null
  }

  const { futureTrips, pastTrips } = dateUtils.sortTripsByDate(trips)
  const nextTrip = futureTrips[0] // 次の旅行プラン（1件のみ）

  // デバッグ: nextTripのデータ構造を確認
  console.log('🔍 nextTrip debug:', {
    hasNextTrip: !!nextTrip,
    tripId: nextTrip?.id,
    title: nextTrip?.title,
    destination: nextTrip?.destination,
    destination_place_id: nextTrip?.destination_place_id,
    destination_place: nextTrip?.destination_place,
    destination_place_geometry: nextTrip?.destination_place?.geometry,
    destination_place_location: nextTrip?.destination_place?.geometry?.location
  })

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
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
          {/* 7側のコンテンツ */}
          <div className="lg:col-span-7 space-y-8">
            {/* メインコンテンツ（旅行作成 + 次の旅行プラン） */}
            <NextTripCard nextTrip={nextTrip} onTripCreated={handleTripCreated} />

            {/* 最近チェックした旅行 */}
            <div className="bg-white border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">{t('home.dashboard.recentlyChecked.title')}</h3>
              <div className="text-center py-8 text-gray-500">
                <p>{t('home.dashboard.recentlyChecked.empty')}</p>
                <p className="text-sm mt-2">{t('home.dashboard.recentlyChecked.planned')}</p>
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

      {/* 設定モーダルはプロフィールページに移行したため削除 */}

      <HomeFooter />
    </div>
  )
}
