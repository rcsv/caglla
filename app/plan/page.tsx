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
import { t } from '@/lib/i18n'
import { getUserDisplayName, getPlanDisplayName, getUserAvatarUrl } from '@/lib/utils/user-helpers'
// 設定モーダルはプロフィールページへ移行

export default function PlanListPage() {
  const { user, loading, logout } = useAuth()
  const { trips, tripsLoading, planConfig, planLoading, userData, userDataLoading } = useUserData()
  const router = useRouter()
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)

  if (loading || tripsLoading || planLoading || userDataLoading) {
    return <Loading fullScreen size="lg" />
  }
  if (!user) return null

  const { futureTrips } = dateUtils.sortTripsByDate(trips)

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
        userName={getUserDisplayName(userData, user)}
        planName={getPlanDisplayName(planConfig)}
        avatarUrl={getUserAvatarUrl(userData, user)}
        onLogout={handleLogout}
        onChangePlan={handleChangePlan}
        userSlug={userData?.slug}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Card
          title={<div className="flex items-center justify-between"><span className="text-lg font-medium text-gray-900">{t('plan.page.title')}</span></div>}
          padding="lg"
        >
          {futureTrips.length === 0 ? (
            <div className="text-center text-gray-500 py-12">{t('plan.page.empty')}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {futureTrips.map(trip => (
                <TripCard key={trip.id} trip={trip} variant="imageFull" />
              ))}
            </div>
          )}
        </Card>
      </main>

      {/* 設定モーダルはプロフィールページに移行したため削除 */}

      <HomeFooter />
    </div>
  )
}


