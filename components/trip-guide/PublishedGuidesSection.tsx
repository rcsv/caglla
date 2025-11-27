'use client'

import { useState } from 'react'
import { Icon } from '@iconify/react'
import type { Trip } from '@/lib/core/types'
import { Card } from '@/components/common/Card'
import { GuideCard } from './GuideCard'
import { UnpublishGuideModal } from './modals/UnpublishGuideModal'
import { DeleteGuideModal } from './modals/DeleteGuideModal'
import { t } from '@/lib/i18n'
import logger from '@/lib/core/logger'

interface PublishedGuidesSectionProps {
  trips?: Trip[] | null
  loading: boolean
  onRefresh?: () => void
  onGuideUpdated?: () => void
}

/**
 * 公開済みガイドセクション
 * 
 * 公開済み（access_level: 'public' または 'unlisted' かつ is_template: true）のガイドを表示します。
 * 
 * @remarks
 * 将来のコレクション分離時は、このコンポーネントを templates コレクション用に
 * 移行するだけで対応できます。
 */
export function PublishedGuidesSection({
  trips,
  loading,
  onRefresh,
  onGuideUpdated,
}: PublishedGuidesSectionProps) {
  const [unpublishTarget, setUnpublishTarget] = useState<Trip | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Trip | null>(null)

  const hasTrips = trips && trips.length > 0

  const handleEdit = (trip: Trip) => {
    // プランナーページに遷移
    // trip.creator?.slug が存在する場合はそれを使用、存在しない場合は trip.user_id から取得を試みる
    if (trip.creator?.slug && trip.slug) {
      window.location.href = `/${trip.creator.slug}/${trip.slug}`
    } else if (trip.slug) {
      // creator 情報がない場合は、user_id を直接使用（将来的に改善可能）
      // 現時点では、API側でcreator情報を含めるように修正済みなので、通常はここに到達しない
      logger.warn('Trip creator information missing', { tripId: trip.id, userId: trip.user_id })
    }
  }

  const handleUnpublish = (trip: Trip) => {
    setUnpublishTarget(trip)
  }

  const handleDelete = (trip: Trip) => {
    setDeleteTarget(trip)
  }

  const handleViewAnalytics = (trip: Trip) => {
    // TODO: 統計タブに切り替えて、該当ガイドの詳細統計を表示
    // 現時点ではプランナーページに遷移
    if (trip.creator?.slug && trip.slug) {
      window.location.href = `/${trip.creator.slug}/${trip.slug}`
    }
  }

  const handleUnpublishSuccess = () => {
    setUnpublishTarget(null)
    onRefresh?.()
    onGuideUpdated?.()
  }

  const handleDeleteSuccess = () => {
    setDeleteTarget(null)
    onRefresh?.()
    onGuideUpdated?.()
  }

  return (
    <>
      <Card
        title={
          <div className="flex items-center gap-2">
            <Icon icon="mdi:book-open-variant" className="h-5 w-5 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {t('tripGuide.published.title', '公開済みガイド')}
            </h2>
          </div>
        }
        padding="lg"
      >
        {loading && !hasTrips && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-sm bg-gray-100 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && !hasTrips && (
          <div className="text-center py-12 text-gray-500">
            <Icon icon="mdi:book-outline" className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg mb-2">
              {t('tripGuide.published.empty', '公開済みのガイドはありません')}
            </p>
            <p className="text-sm text-gray-400">
              {t('tripGuide.published.emptySubtitle', '執筆中のガイドを公開すると、ここに表示されます')}
            </p>
          </div>
        )}

        {!loading && hasTrips && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <GuideCard
                key={trip.id}
                trip={trip}
                variant="published"
                onEdit={() => handleEdit(trip)}
                onDelete={() => handleDelete(trip)}
                onUnpublish={() => handleUnpublish(trip)}
                onViewAnalytics={() => handleViewAnalytics(trip)}
              />
            ))}
          </div>
        )}
      </Card>

      {/* 非公開モーダル */}
      {unpublishTarget && (
        <UnpublishGuideModal
          trip={unpublishTarget}
          isOpen={!!unpublishTarget}
          onClose={() => setUnpublishTarget(null)}
          onSuccess={handleUnpublishSuccess}
        />
      )}

      {/* 削除モーダル */}
      {deleteTarget && (
        <DeleteGuideModal
          trip={deleteTarget}
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </>
  )
}

