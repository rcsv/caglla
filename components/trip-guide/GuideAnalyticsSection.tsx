'use client'

import { useMemo } from 'react'
import { Icon } from '@iconify/react'
import type { Trip } from '@/lib/core/types'
import { Card } from '@/components/common/Card'
import { resolveSocialStats } from '@/lib/social/trip-social-utils'
import { t } from '@/lib/i18n'

interface GuideAnalyticsSectionProps {
  trips?: Trip[] | null
  loading: boolean
  onRefresh?: () => void
}

/**
 * ガイド統計セクション
 * 
 * ガイド全体の統計情報、人気ガイドランキングを表示します。
 * 
 * @remarks
 * 将来のコレクション分離時は、このコンポーネントを templates コレクション用に
 * 移行するだけで対応できます。
 */
export function GuideAnalyticsSection({
  trips,
  loading,
  onRefresh,
}: GuideAnalyticsSectionProps) {
  // 統計情報を集計
  const analytics = useMemo(() => {
    if (!trips || trips.length === 0) {
      return {
        totalGuides: 0,
        totalViews: 0,
        totalLikes: 0,
        totalReplicas: 0,
        publishedGuides: 0,
        draftGuides: 0,
      }
    }

    let totalViews = 0
    let totalLikes = 0
    let totalReplicas = 0
    let publishedGuides = 0
    let draftGuides = 0

    trips.forEach((trip) => {
      const stats = resolveSocialStats(trip)
      totalViews += stats.views
      totalLikes += stats.likes
      totalReplicas += stats.replicas

      if (trip.access_level === 'public' || trip.access_level === 'unlisted') {
        publishedGuides++
      } else {
        draftGuides++
      }
    })

    return {
      totalGuides: trips.length,
      totalViews,
      totalLikes,
      totalReplicas,
      publishedGuides,
      draftGuides,
    }
  }, [trips])

  // 人気ガイドランキング（閲覧数順）
  const popularGuides = useMemo(() => {
    if (!trips || trips.length === 0) return []

    return [...trips]
      .filter((trip) => trip.access_level === 'public' || trip.access_level === 'unlisted')
      .map((trip) => ({
        trip,
        stats: resolveSocialStats(trip),
      }))
      .sort((a, b) => b.stats.views - a.stats.views)
      .slice(0, 5)
  }, [trips])

  return (
    <div className="space-y-6">
      {/* 全体統計 */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <Icon icon="mdi:chart-line" className="h-5 w-5 text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {t('tripGuide.analytics.overview', '全体統計')}
            </h2>
          </div>
        }
        padding="lg"
      >
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-20 rounded-sm bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 bg-indigo-50 rounded-sm border border-indigo-200">
              <p className="text-sm text-indigo-600 font-medium">
                {t('tripGuide.analytics.totalGuides', '総ガイド数')}
              </p>
              <p className="text-2xl font-bold text-indigo-900 mt-1">{analytics.totalGuides}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-sm border border-green-200">
              <p className="text-sm text-green-600 font-medium">
                {t('tripGuide.analytics.publishedGuides', '公開済み')}
              </p>
              <p className="text-2xl font-bold text-green-900 mt-1">{analytics.publishedGuides}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-sm border border-gray-200">
              <p className="text-sm text-gray-600 font-medium">
                {t('tripGuide.analytics.draftGuides', '執筆中')}
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{analytics.draftGuides}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-sm border border-blue-200">
              <p className="text-sm text-blue-600 font-medium">
                {t('tripGuide.analytics.totalViews', '総閲覧数')}
              </p>
              <p className="text-2xl font-bold text-blue-900 mt-1">{analytics.totalViews}</p>
            </div>
            <div className="p-4 bg-pink-50 rounded-sm border border-pink-200">
              <p className="text-sm text-pink-600 font-medium">
                {t('tripGuide.analytics.totalLikes', '総いいね数')}
              </p>
              <p className="text-2xl font-bold text-pink-900 mt-1">{analytics.totalLikes}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-sm border border-purple-200">
              <p className="text-sm text-purple-600 font-medium">
                {t('tripGuide.analytics.totalReplicas', '総複製数')}
              </p>
              <p className="text-2xl font-bold text-purple-900 mt-1">{analytics.totalReplicas}</p>
            </div>
          </div>
        )}
      </Card>

      {/* 人気ガイドランキング */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <Icon icon="mdi:trending-up" className="h-5 w-5 text-orange-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {t('tripGuide.analytics.popularGuides', '人気ガイドランキング')}
            </h2>
          </div>
        }
        padding="lg"
      >
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 rounded-sm bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : popularGuides.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Icon icon="mdi:chart-line-variant" className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-sm">
              {t('tripGuide.analytics.noPopularGuides', '公開済みのガイドがありません')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {popularGuides.map(({ trip, stats }, index) => (
              <div
                key={trip.id}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-sm hover:border-indigo-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                      {trip.title || trip.destination || t('tripGuide.analytics.untitled', 'Untitled Guide')}
                    </h3>
                    {trip.destination && (
                      <p className="text-xs text-gray-500 truncate">{trip.destination}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{t('tripGuide.analytics.views', '閲覧')}</p>
                    <p className="text-sm font-semibold text-gray-900">{stats.views}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{t('tripGuide.analytics.likes', 'いいね')}</p>
                    <p className="text-sm font-semibold text-gray-900">{stats.likes}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{t('tripGuide.analytics.replicas', '複製')}</p>
                    <p className="text-sm font-semibold text-gray-900">{stats.replicas}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

