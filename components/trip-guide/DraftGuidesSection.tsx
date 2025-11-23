'use client'

import { useState } from 'react'
import { Icon } from '@iconify/react'
import Link from 'next/link'
import type { Trip } from '@/lib/core/types'
import { Card } from '@/components/common/Card'
import { GuideCard } from './GuideCard'
import { PublishGuideModal } from './modals/PublishGuideModal'
import { DeleteGuideModal } from './modals/DeleteGuideModal'
import { t } from '@/lib/i18n'
import logger from '@/lib/core/logger'

interface DraftGuidesSectionProps {
  trips?: Trip[] | null
  loading: boolean
  onRefresh?: () => void
  onGuideUpdated?: () => void
}

/**
 * 執筆中ガイドセクション
 * 
 * 執筆中（access_level: 'private' かつ is_template: true）のガイドを表示します。
 * 
 * @remarks
 * 将来のコレクション分離時は、このコンポーネントを templates コレクション用に
 * 移行するだけで対応できます。
 */
export function DraftGuidesSection({
  trips,
  loading,
  onRefresh,
  onGuideUpdated,
}: DraftGuidesSectionProps) {
  const [publishTarget, setPublishTarget] = useState<Trip | null>(null)
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

  const handlePublish = (trip: Trip) => {
    setPublishTarget(trip)
  }

  const handleDelete = (trip: Trip) => {
    setDeleteTarget(trip)
  }

  const handlePublishSuccess = () => {
    setPublishTarget(null)
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
            <Icon icon="mdi:book-edit-outline" className="h-5 w-5 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {t('tripGuide.draft.title', '執筆中のガイド')}
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
              {t('tripGuide.draft.empty', '執筆中のガイドはありません')}
            </p>
            <p className="text-sm text-gray-400">
              {t('tripGuide.draft.emptySubtitle', '新規ガイドを作成しましょう')}
            </p>
          </div>
        )}

        {!loading && hasTrips && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <GuideCard
                key={trip.id}
                trip={trip}
                variant="draft"
                onEdit={() => handleEdit(trip)}
                onDelete={() => handleDelete(trip)}
                onPublish={() => handlePublish(trip)}
              />
            ))}
          </div>
        )}
      </Card>

      {/* 公開モーダル */}
      {publishTarget && (
        <PublishGuideModal
          trip={publishTarget}
          isOpen={!!publishTarget}
          onClose={() => setPublishTarget(null)}
          onSuccess={handlePublishSuccess}
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

