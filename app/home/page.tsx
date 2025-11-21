'use client'

import { useAuth } from '@/lib/contexts/auth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import HomeHeader from '@/components/common/HomeHeader'
import HomeFooter from '@/components/common/HomeFooter'
import { useUserData } from '@/lib/contexts/user-data'
import Loading from '@/components/common/Loading'
import { getUserDisplayName, getPlanDisplayName, getUserAvatarUrl } from '@/lib/utils/user-helpers'
import QuickPlanModal from '@/components/modals/QuickPlanModal'
import CreateTripDialog from '@/components/common/CreateTripDialog'
import { toDateOrNull } from '@/lib/firebase/timestamp-utils'
import { HomeRightColumn } from '@/components/home/HomeRightColumn'
import { useRecentTrips } from '@/hooks/useRecentTrips'
import { HomeWelcomeRow } from '@/components/home/HomeWelcomeRow'

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
  const recentTrips = useRecentTrips()

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
        <HomeWelcomeRow
          onOpenCreateTrip={() => setIsCreateTripDialogOpen(true)}
          onOpenQuickPlan={() => setIsQuickPlanModalOpen(true)}
          onOpenCreateGuide={() => setIsCreateGuideDialogOpen(true)}
        />

        {/* コンテンツエリア（今後 /home-v2 の実装を移行予定） */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
          <div className="lg:col-span-7">
            <div className="bg-white rounded-sm shadow-sm border border-gray-200 p-6">
              <p className="text-gray-500">コンテンツエリア（実装予定）</p>
            </div>
          </div>
          <HomeRightColumn
            trips={trips}
            today={today}
            referenceDateForUpcoming={tomorrow}
            recentTrips={recentTrips}
            onOpenCreateTrip={() => setIsCreateTripDialogOpen(true)}
          />
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
