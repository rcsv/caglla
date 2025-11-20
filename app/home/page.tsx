'use client'

import { useAuth } from '@/lib/contexts/auth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import HomeHeader from '@/components/common/HomeHeader'
import HomeFooter from '@/components/common/HomeFooter'
import { useUserData } from '@/lib/contexts/user-data'
import Loading from '@/components/common/Loading'
import { Icon } from '@iconify/react'
import Link from 'next/link'
import { getUserDisplayName, getPlanDisplayName, getUserAvatarUrl } from '@/lib/utils/user-helpers'
import QuickPlanModal from '@/components/modals/QuickPlanModal'
import CreateTripDialog from '@/components/common/CreateTripDialog'
import { filterOngoingTrips, filterUpcomingTrips, sortTripsByUpdatedAt, sortTripsByStartDate } from '@/lib/travel/trip-filters'
import { toDateOrNull } from '@/lib/firebase/timestamp-utils'
import { t } from '@/lib/i18n'
import type { Trip } from '@/lib/core/types'
import OngoingTripCard from '@/components/tripcard/OngoingTripCard'
import UpcomingTripCard from '@/components/tripcard/UpcomingTripCard'

/**
 * v3.0.0 Home Page - シンプルなレイアウト構造
 * 
 * /home-v2 の実装を段階的に移行するための基盤として、
 * 基本的なレイアウト構造とローディングコンポーネントのみを実装
 */
export default function HomePage() {
  const { user, loading, logout } = useAuth()
  const { trips, planConfig, userData, userDataLoading, refreshTrips } = useUserData()
  const router = useRouter()
  const [isQuickPlanModalOpen, setIsQuickPlanModalOpen] = useState(false)
  const [isCreateTripDialogOpen, setIsCreateTripDialogOpen] = useState(false)
  const [isCreateGuideDialogOpen, setIsCreateGuideDialogOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  // ローディング状態の表示
  if (loading || userDataLoading) {
    return <Loading fullScreen size="lg" />
  }

  if (!user) {
    return null
  }

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  const handleChangePlan = () => {
    router.push('/subscription')
  }

  const handleTripCreated = async () => {
    // トリップ作成成功後、最新のデータを取得（遷移はCreateTripDialog側で行う）
    await refreshTrips()
  }

  const handleGuideCreated = async () => {
    // Guide作成成功後も同様にデータのみリフレッシュ（遷移はCreateTripDialog側で行う）
    await refreshTrips()
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // 進行中のTrip（期間内のものを優先、最大3件）
  const tripsSortedByRecent = sortTripsByUpdatedAt(trips)
  const ongoingTrips = filterOngoingTrips(tripsSortedByRecent)
  const activeTrips = (ongoingTrips.length > 0 ? ongoingTrips : tripsSortedByRecent).slice(0, 3)

  // 近日のTrip（「今日より先」のTripのみ、開始日順、最大3件）
  // start_date > today のものだけを対象にするため、referenceDate に「明日」を渡す
  const upcomingTrips = sortTripsByStartDate(filterUpcomingTrips(trips, tomorrow)).slice(0, 3)

  const activeCoverPool = [
    '1491557345352-5929e343eb89',
    '1500530855697-b586d89ba3ee',
    '1507525428034-b723cf961d3e',
    '1500048993953-d23a436266cf',
  ]

  const upcomingCoverPool = [
    '1508672019048-805c876b67e2',
    '1526772662000-3f88f10405ff',
    '1519817914152-22f90e1e37e8',
    '1500534314209-a25ddb2bd429',
  ]

  const getCoverImage = (trip: Trip, index: number, pool: string[]) => {
    if (trip.image_url) {
      return trip.image_url
    }
    const id = pool[index % pool.length]
    return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=70`
  }

  const DAY_MS = 1000 * 60 * 60 * 24

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <HomeHeader
        userName={getUserDisplayName(userData, user)}
        planName={getPlanDisplayName(planConfig)}
        avatarUrl={getUserAvatarUrl(userData, user)}
        onLogout={handleLogout}
        onChangePlan={handleChangePlan}
        userSlug={userData?.slug}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome</h1>
            <p className="text-gray-600">Discover and manage your travels</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCreateTripDialogOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-indigo-600 text-white text-sm font-semibold shadow-sm hover:bg-indigo-700 transition-colors"
            >
              <Icon icon="mdi:plus-circle" className="h-5 w-5" />
              Create Trip
            </button>
            <button
              onClick={() => setIsQuickPlanModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-sm border border-indigo-200 text-indigo-600 text-sm font-semibold hover:border-indigo-300 transition-colors"
            >
              <Icon icon="mdi:calendar-edit" className="h-5 w-5" />
              Quick Plan
            </button>
            <button
              onClick={() => setIsCreateGuideDialogOpen(true)}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-sm border border-indigo-200 text-indigo-600 text-sm font-semibold hover:border-indigo-300 transition-colors"
            >
              <Icon icon="mdi:book-open-variant" className="h-5 w-5" />
              Create a Guide
            </button>
          </div>
        </div>

        {/* コンテンツエリア（今後 /home-v2 の実装を移行予定） */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
          <div className="lg:col-span-7">
            <div className="bg-white rounded-sm shadow-sm border border-gray-200 p-6">
              <p className="text-gray-500">コンテンツエリア（実装予定）</p>
            </div>
          </div>
          <div className="lg:col-span-3 space-y-6">
            {/* 進行中のTrip */}
            <section className="bg-white rounded-sm shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Icon icon="mdi:map-marker-path" className="h-5 w-5 text-indigo-600" />
                  {t('home.dashboard.ongoingTrips.title')}
                </h2>
                <span className="text-xs text-gray-400">
                  {t('home.dashboard.ongoingTrips.subtitle')}
                </span>
              </div>
              
              {activeTrips.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <Icon icon="mdi:map-outline" className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-xs mb-2">{t('home.dashboard.ongoingTrips.empty')}</p>
                  <button
                    onClick={() => setIsCreateTripDialogOpen(true)}
                    className="inline-block text-indigo-600 hover:text-indigo-800 text-xs"
                  >
                    {t('home.dashboard.ongoingTrips.createNew')}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeTrips.map((trip, index) => {
                    const coverImage = getCoverImage(trip, index, activeCoverPool)

                    return (
                      <OngoingTripCard
                        key={trip.id}
                        trip={trip}
                        coverImage={coverImage}
                        today={today}
                      />
                    )
                  })}
                </div>
              )}
            </section>

            {/* 近日の予定 */}
            <section className="bg-white rounded-sm shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Icon icon="mdi:calendar-clock" className="h-5 w-5 text-emerald-600" />
                  {t('home.dashboard.upcomingTrips.title')}
                </h2>
                <Link 
                  href="/plan" 
                  className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  {t('home.dashboard.upcomingTrips.viewAll')}
                  <Icon icon="mdi:chevron-right" className="h-3 w-3" />
                </Link>
              </div>
              
              {upcomingTrips.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <Icon icon="mdi:calendar-outline" className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-xs mb-2">{t('home.dashboard.upcomingTrips.empty')}</p>
                  <button
                    onClick={() => setIsCreateTripDialogOpen(true)}
                    className="inline-block text-indigo-600 hover:text-indigo-800 text-xs"
                  >
                    {t('home.dashboard.ongoingTrips.createNew')}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {upcomingTrips.map((trip, index) => {
                    const imageUrl = getCoverImage(trip, index, upcomingCoverPool)

                    return (
                      <UpcomingTripCard
                        key={trip.id}
                        trip={trip}
                        imageUrl={imageUrl}
                        today={today}
                      />
                    )
                  })}
                </div>
              )}
            </section>

            {/* Recently Checked（モック枠のみ） */}
            <section className="bg-white rounded-sm shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Icon icon="mdi:clock-time-four-outline" className="h-5 w-5 text-purple-500" />
                  Recently You Checked
                </h2>
                <button className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1">
                  View All
                  <Icon icon="mdi:chevron-right" className="h-3 w-3" />
                </button>
              </div>

              <div className="border border-dashed border-gray-300 rounded-sm p-4 text-center text-xs text-gray-500">
                This section will show trips you recently viewed.
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <HomeFooter />

      {/* Quick Plan Modal */}
      <QuickPlanModal
        isOpen={isQuickPlanModalOpen}
        onClose={() => setIsQuickPlanModalOpen(false)}
      />

      {/* Create Trip Dialog (Private Trip専用) */}
      <CreateTripDialog
        isOpen={isCreateTripDialogOpen}
        onClose={() => setIsCreateTripDialogOpen(false)}
        onSuccess={handleTripCreated}
        initialMode="trip"
        hideModeSelector={true}
      />

      {/* Create Guide Dialog (Template作成専用) */}
      <CreateTripDialog
        isOpen={isCreateGuideDialogOpen}
        onClose={() => setIsCreateGuideDialogOpen(false)}
        onSuccess={handleGuideCreated}
        initialMode="template"
        hideModeSelector={true}
      />
    </div>
  )
}
