'use client'

import { useAuth } from '@/lib/contexts/auth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import HomeHeader from '@/components/common/HomeHeader'
import HomeFooter from '@/components/common/HomeFooter'
import { useUserData } from '@/lib/contexts/user-data'
import Loading from '@/components/common/Loading'
import { getUserDisplayName, getPlanDisplayName, getUserAvatarUrl } from '@/lib/utils/user-helpers'
import CreateTripDialog from '@/components/common/CreateTripDialog'
import { GuideCreatorHeader } from '@/components/trip-guide/GuideCreatorHeader'
import { GuideTabs } from '@/components/trip-guide/GuideTabs'
import { DraftGuidesSection } from '@/components/trip-guide/DraftGuidesSection'
import { PublishedGuidesSection } from '@/components/trip-guide/PublishedGuidesSection'
import { GuideAnalyticsSection } from '@/components/trip-guide/GuideAnalyticsSection'
import { useMyGuides } from '@/hooks/useMyGuides'

/**
 * Trip Guide ページ - ガイド作成者向け専用ダッシュボード
 * 
 * このページでは、ガイドの新規作成、執筆中のガイドの管理、
 * 公開済みガイドの人気やフィードバックの確認ができます。
 * 
 * @remarks
 * 将来のコレクション分離を考慮し、テンプレート関連のロジックを
 * このページに集約しています。分離時はこのページとコンポーネントを
 * そのまま templates コレクション用に移行できます。
 */
export default function TripGuidePage() {
  const { user, loading, logout } = useAuth()
  const { planConfig, userData, userDataLoading } = useUserData()
  const router = useRouter()
  const [isCreateGuideDialogOpen, setIsCreateGuideDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'draft' | 'published' | 'analytics'>('draft')

  // 執筆中ガイドと公開済みガイドのデータ取得
  const { trips: draftGuides, loading: draftLoading, refresh: refreshDraft } = useMyGuides('draft')
  const { trips: publishedGuides, loading: publishedLoading, refresh: refreshPublished } = useMyGuides('published')
  const { trips: allGuides, loading: allGuidesLoading, refresh: refreshAllGuides } = useMyGuides('all')

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

  const handleGuideCreated = async () => {
    // Guide作成成功後、最新のデータを取得
    await refreshDraft()
    await refreshAllGuides()
  }

  const handleGuideUpdated = async () => {
    // Guide更新後、最新のデータを取得
    await refreshDraft()
    await refreshPublished()
    await refreshAllGuides()
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
        {/* ガイド作成者ヘッダー */}
        <GuideCreatorHeader
          onOpenCreateGuide={() => setIsCreateGuideDialogOpen(true)}
        />

        {/* タブセクション */}
        <GuideTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* メインコンテンツエリア */}
        <div className="mt-6">
          {activeTab === 'draft' && (
            <DraftGuidesSection
              trips={draftGuides}
              loading={draftLoading}
              onRefresh={refreshDraft}
              onGuideUpdated={handleGuideUpdated}
            />
          )}

          {activeTab === 'published' && (
            <PublishedGuidesSection
              trips={publishedGuides}
              loading={publishedLoading}
              onRefresh={refreshPublished}
              onGuideUpdated={handleGuideUpdated}
            />
          )}

          {activeTab === 'analytics' && (
            <GuideAnalyticsSection
              trips={allGuides}
              loading={allGuidesLoading}
              onRefresh={refreshAllGuides}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <HomeFooter />

      {/* Create Guide Dialog */}
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

