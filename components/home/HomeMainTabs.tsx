'use client'

import { useState } from 'react'
import { Icon } from '@iconify/react'
import { t } from '@/lib/i18n'
import type { Trip } from '@/lib/core/types'
import { toDateOrNull } from '@/lib/firebase/timestamp-utils'
import { resolveSocialStats } from '@/lib/social/trip-social-utils'
import { TripStatsRow } from '@/components/tripcard/TripStatsRow'
import { TripSocialStatsRow } from '@/components/tripcard/TripSocialStatsRow'
import TripShareSettingsModal from '@/components/modals/TripShareSettingsModal'
import { useFollowingFeed } from '@/hooks/useFollowingFeed'
import { useTemplates } from '@/hooks/useTemplates'
import FollowButton from '@/components/social/FollowButton'
import { useUserData } from '@/lib/contexts/user-data'
import Link from 'next/link'

type TabId = 'friends' | 'ideas' | 'shares'

const TAB_OPTIONS: Array<{ id: TabId; label: string; icon: string; description: string }> = [
  {
    id: 'friends',
    label: '友人の旅',
    icon: 'mdi:account-group',
    description: 'フォロー中のユーザーがシェアした旅やプランを時系列で追跡',
  },
  {
    id: 'ideas',
    label: '旅のアイデア',
    icon: 'mdi:lightbulb-on',
    description: '旅行プランナーのテンプレートをカタログ感覚で探索',
  },
  {
    id: 'shares',
    label: '自分のシェア',
    icon: 'mdi:tray-arrow-up',
    description: '公開範囲や期限を含めた自分のシェア旅を管理',
  },
]

const SEARCH_PLACEHOLDERS: Record<TabId, string> = {
  friends: 'フォロー中の旅やハッシュタグを検索',
  ideas: '都市名・テーマ・日数などで検索',
  shares: '公開済みの旅をタイトル・都市で検索',
}

const FILTER_CHIPS: Record<TabId, string[]> = {
  friends: ['すべて', '今旅行中', '最近公開', 'テンプレのみ'],
  ideas: ['エリア: 日本', '日数: 3-4日', '予算: ¥¥', 'テーマ: 食'],
  shares: ['公開中', '期限あり', 'フォロワー限定'],
}

/**
 * 相対時間をフォーマット（例: "45分前", "2時間前", "昨日"）
 */
function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) {
    return 'たった今'
  } else if (diffMins < 60) {
    return `${diffMins}分前`
  } else if (diffHours < 24) {
    return `${diffHours}時間前`
  } else if (diffDays === 1) {
    return '昨日'
  } else if (diffDays < 7) {
    return `${diffDays}日前`
  } else {
    return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
  }
}

/**
 * Tripが現在進行中かどうかを判定
 */
function isTripActive(trip: Trip): boolean {
  if (!trip.start_date || !trip.end_date) return false
  const start = toDateOrNull(trip.start_date)
  const end = toDateOrNull(trip.end_date)
  if (!start || !end) return false
  const now = new Date()
  return start <= now && now <= end
}

const MY_SHARED_TRIPS = [
  {
    id: 'share-taiwan',
    title: '春の台湾・台北と九份',
    location: '台北 / 九份',
    visibility: 'フォロワーまで',
    expires: '2025/05まで公開',
    updatedAt: '昨日更新',
    attributes: { days: 4, venues: 12, photos: 48, checklists: 6 },
    stats: { likes: 54, comments: 12, saves: 9, clones: 4 },
  },
  {
    id: 'share-venice',
    title: 'ヴェネツィア水上バースデー旅',
    location: 'イタリア・ヴェネツィア',
    visibility: '全体公開',
    expires: '期限なし',
    updatedAt: '3日前',
    attributes: { days: 3, venues: 9, photos: 32, checklists: 5 },
    stats: { likes: 102, comments: 18, saves: 15, clones: 6 },
  },
  {
    id: 'share-nagano',
    title: '軽井沢でワーケーション',
    location: '長野・軽井沢',
    visibility: 'リンク限定',
    expires: '2025/01で自動非公開',
    updatedAt: '10日前',
    attributes: { days: 2, venues: 7, photos: 20, checklists: 8 },
    stats: { likes: 23, comments: 4, saves: 3, clones: 2 },
  },
]

interface HomeMainTabsProps {
  mySharedTrips?: Trip[] | null
  mySharesLoading?: boolean
  onMySharesRefresh?: () => void
}

export function HomeMainTabs({ 
  mySharedTrips, 
  mySharesLoading = false,
  onMySharesRefresh,
}: HomeMainTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('friends')

  const renderTabContent = () => {
    switch (activeTab) {
      case 'friends':
        return <FriendsTimeline />
      case 'ideas':
        return <PlanCatalog />
      case 'shares':
        return (
          <MyShareManager 
            trips={mySharedTrips} 
            loading={mySharesLoading}
            onRefresh={onMySharesRefresh}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* タブボタン（CodePen風のタブグループを意識したスタイル） */}
      <section className="rounded-sm border border-slate-200 bg-white/95 p-6 shadow-sm">
        <div className="inline-flex w-full max-w-full rounded-full bg-slate-100 p-1 shadow-inner">
          {TAB_OPTIONS.map((tab) => {
            const isActive = activeTab === tab.id
            const label =
              tab.id === 'shares' ? t('home.mainTabs.shares') || tab.label : tab.label
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex-1 min-w-[0] px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-md'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/70'
                }`}
              >
                <Icon
                  icon={tab.icon}
                  className={`h-4 w-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}
                />
                <span className="truncate">{label}</span>
              </button>
            )
          })}
        </div>

        {/* 検索＋フィルタ */}
        <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Icon
              icon="mdi:magnify"
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              placeholder={SEARCH_PLACEHOLDERS[activeTab]}
              className="w-full rounded-full border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTER_CHIPS[activeTab].map((chip) => (
              <button
                key={`${activeTab}-${chip}`}
                type="button"
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* タブコンテンツ */}
      {renderTabContent()}
    </div>
  )
}

function FriendsTimeline() {
  const { trips, loading, error } = useFollowingFeed(20)
  const { userData } = useUserData() // 現在のユーザーデータを取得

  if (loading) {
    return (
      <section className="space-y-4">
        <div className="h-32 rounded-sm bg-gray-100 animate-pulse" />
        <div className="h-32 rounded-sm bg-gray-100 animate-pulse" />
        <div className="h-32 rounded-sm bg-gray-100 animate-pulse" />
      </section>
    )
  }

  if (error) {
    return (
      <section className="space-y-4">
        <p className="text-sm text-red-600">エラーが発生しました: {error.message}</p>
      </section>
    )
  }

  if (!trips || trips.length === 0) {
    return (
      <section className="space-y-4">
        <p className="text-sm text-slate-500">フォロー中のユーザーの旅行はまだありません。</p>
      </section>
    )
  }

  return (
    <section className="space-y-4">
      {trips.map((trip) => {
        const creator = trip.creator
        const userName = creator?.name || 'Unknown User'
        const userSlug = creator?.slug
        const avatar = creator?.profile_image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`
        const userHandle = userSlug ? `@${userSlug}` : ''
        const action = trip.is_template ? 'テンプレートプランを公開' : '旅行をシェアしました'
        const createdAt = toDateOrNull(trip.created_at)
        const timestamp = createdAt ? formatRelativeTime(createdAt) : ''
        const title = trip.title || trip.destination || 'Untitled Trip'
        const location = trip.destination_place?.name || trip.destination || ''
        const summary = trip.description || ''
        const cover = trip.image_url || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80'
        const isActive = isTripActive(trip)
        const socialStats = resolveSocialStats(trip)
        const tripUrl = userSlug && trip.slug ? `/${userSlug}/${trip.slug}` : `/trip/${trip.id}`

        return (
          <Link key={trip.id} href={tripUrl}>
            <article className="rounded-sm border border-slate-200 bg-white p-4 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={avatar}
                  alt={userName}
                  className="h-9 w-9 rounded-full border border-slate-200"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {userName}
                    </p>
                    {userHandle && (
                      <span className="text-xs text-slate-400 truncate">{userHandle}</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">{action}</p>
                </div>
                <div className="flex items-center gap-2">
                  {userSlug && creator?.id !== userData?.id && (
                    <div
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                    >
                      <FollowButton userSlug={userSlug} variant="icon" size="sm" />
                    </div>
                  )}
                  {timestamp && (
                    <span className="text-xs text-slate-400">{timestamp}</span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3 md:flex-row">
                <div className="md:w-40 md:flex-shrink-0">
                  <div className="relative h-28 w-full overflow-hidden rounded-sm">
                    <img
                      src={cover}
                      alt={title}
                      className="h-full w-full object-cover"
                    />
                    {isActive && (
                      <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-red-500/90 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                        LIVE
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <h3 className="text-sm font-semibold text-slate-900 truncate">{title}</h3>
                  {location && (
                    <p className="text-xs text-slate-500 truncate">{location}</p>
                  )}
                  {summary && (
                    <p className="text-xs text-slate-600 line-clamp-2">{summary}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Icon icon="mdi:heart-outline" className="h-3 w-3" />
                        {socialStats.likes}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Icon icon="mdi:message-outline" className="h-3 w-3" />
                        {socialStats.comments}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Icon icon="mdi:share-outline" className="h-3 w-3" />
                        {socialStats.shares}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </Link>
        )
      })}
    </section>
  )
}

function PlanCatalog() {
  const { trips, loading, error } = useTemplates(20, true) // excludeMyTrips = true
  const { userData } = useUserData() // 現在のユーザーデータを取得

  if (loading) {
    return (
      <section className="grid gap-4 md:grid-cols-2">
        <div className="h-64 rounded-sm bg-gray-100 animate-pulse" />
        <div className="h-64 rounded-sm bg-gray-100 animate-pulse" />
        <div className="h-64 rounded-sm bg-gray-100 animate-pulse" />
        <div className="h-64 rounded-sm bg-gray-100 animate-pulse" />
      </section>
    )
  }

  if (error) {
    return (
      <section className="space-y-4">
        <p className="text-sm text-red-600">エラーが発生しました: {error.message}</p>
      </section>
    )
  }

  if (!trips || trips.length === 0) {
    return (
      <section className="space-y-4">
        <p className="text-sm text-slate-500">公開されているテンプレートはまだありません。</p>
      </section>
    )
  }

  return (
    <section className="grid gap-4 md:grid-cols-2">
      {trips.map((trip) => {
        const creator = trip.creator
        const creatorName = creator?.name || 'Unknown Creator'
        const creatorAvatar = creator?.profile_image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${creatorName}`
        const title = trip.title || trip.destination || 'Untitled Template'
        const destination = trip.destination_place?.name || trip.destination || ''
        const region = destination || 'Unknown Region'
        const days = trip.stats?.days ? `${trip.stats.days}日間` : trip.day_count ? `${trip.day_count}日間` : ''
        const summary = trip.description || ''
        const cover = trip.image_url || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80'
        const socialStats = resolveSocialStats(trip)
        const tripUrl = creator?.slug && trip.slug ? `/${creator.slug}/${trip.slug}` : `/trip/${trip.id}`

        return (
          <Link key={trip.id} href={tripUrl}>
            <article className="group flex flex-col overflow-hidden rounded-sm border border-slate-200 bg-white shadow-sm hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer">
              <div className="relative h-40 w-full overflow-hidden">
                <img
                  src={cover}
                  alt={title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/0" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-medium text-slate-100">{region}</p>
                    {days && (
                      <p className="text-xs text-slate-200">{days}</p>
                    )}
                  </div>
                  <div className="rounded-full bg-slate-900/60 px-2 py-1 text-[10px] text-slate-100">
                    {socialStats.likes} ♥︎
                  </div>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-3 p-4">
                <h3 className="text-sm font-semibold text-slate-900 line-clamp-2">{title}</h3>
                {summary && (
                  <p className="text-xs text-slate-600 line-clamp-2">{summary}</p>
                )}
                <div className="mt-auto flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <img
                      src={creatorAvatar}
                      alt={creatorName}
                      className="h-7 w-7 rounded-full border border-slate-200"
                    />
                    <div>
                      <p className="text-xs font-semibold text-slate-800">{creatorName}</p>
                    </div>
                    {trip.creator?.slug && trip.creator.id !== userData?.id && (
                      <div
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                      >
                        <FollowButton userSlug={trip.creator.slug} variant="icon" size="sm" />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      // TODO: プラン複製機能を実装
                    }}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-700 hover:border-indigo-200 hover:text-indigo-600"
                  >
                    <Icon icon="mdi:content-copy" className="h-3 w-3" />
                    プランを複製
                  </button>
                </div>
              </div>
            </article>
          </Link>
        )
      })}
    </section>
  )
}

type MyShareView = {
  id: string
  title: string
  location: string
  visibility: string
  expires: string
  updatedAt: string
  attributes?: {
    days?: number
    venues?: number
    photos?: number
    checklists?: number
  }
  stats: {
    likes: number
    comments: number
    saves: number
    clones: number
  }
}

function mapTripToMyShareView(trip: Trip): MyShareView {
  const updatedAtDate = toDateOrNull(trip.updated_at as any)
  const updatedAt = updatedAtDate
    ? updatedAtDate.toLocaleDateString()
    : trip.updated_at
    ? String(trip.updated_at)
    : ''

  const accessLevel = trip.access_level
  let visibility = ''
  if (accessLevel === 'public') {
    visibility = 'Public'
  } else if (accessLevel === 'unlisted') {
    visibility = 'Shared link'
  } else {
    visibility = 'Private'
  }

  const resolvedStats = resolveSocialStats(trip)

  return {
    id: trip.id,
    title: trip.title || trip.destination || 'Untitled Trip',
    location:
      trip.destination_place?.name || trip.destination || trip.destination_place?.formatted_address || '',
    visibility,
    expires: '', // v1 では期限情報は未実装
    updatedAt,
    attributes: {
      days: trip.stats?.days,
      venues: trip.stats?.itineraries,
      photos: trip.stats?.photos,
      checklists: trip.stats?.checklists,
    },
    stats: {
      likes: resolvedStats.likes,
      comments: resolvedStats.comments,
      saves: resolvedStats.shares,
      clones: resolvedStats.replicas,
    },
  }
}

function MyShareManager({ 
  trips, 
  loading,
  onRefresh,
}: { 
  trips?: Trip[] | null
  loading: boolean
  onRefresh?: () => void
}) {
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const hasRealTrips = trips && trips.length > 0

  const viewTrips: MyShareView[] = hasRealTrips
    ? trips!.map(mapTripToMyShareView)
    : MY_SHARED_TRIPS.map((trip) => ({
        id: trip.id,
        title: trip.title,
        location: trip.location,
        visibility: trip.visibility,
        expires: trip.expires,
        updatedAt: trip.updatedAt,
        attributes: trip.attributes,
        stats: trip.stats,
      }))

  const handleOpenModal = (trip: Trip) => {
    setSelectedTrip(trip)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedTrip(null)
  }

  const handleSuccess = () => {
    onRefresh?.()
  }

  return (
    <>
      <section className="space-y-3">
        {loading && !hasRealTrips && (
          <div className="space-y-2">
            <div className="h-16 rounded-sm bg-gray-100 animate-pulse" />
            <div className="h-16 rounded-sm bg-gray-100 animate-pulse" />
          </div>
        )}

        {!loading && !hasRealTrips && (
          <p className="text-xs text-slate-500">You haven't shared any trips yet.</p>
        )}

        {viewTrips.map((viewTrip) => {
          // viewTrip から元の Trip オブジェクトを取得
          const originalTrip = hasRealTrips
            ? trips!.find((t) => t.id === viewTrip.id)
            : null

          return (
            <article
              key={viewTrip.id}
              className="flex items-start justify-between gap-3 rounded-sm border border-slate-200 border-l-4 border-l-gray-300 bg-white p-4 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all"
            >
              <div className="flex-1 min-w-0 space-y-1">
                <h3 className="text-sm font-semibold text-slate-900 truncate">{viewTrip.title}</h3>
                <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5 truncate">
                  <Icon icon="mdi:map-marker" className="h-3.5 w-3.5 text-indigo-500 flex-shrink-0" />
                  <span className="truncate">{viewTrip.location}</span>
                </p>
                <p className="text-[11px] text-slate-500">
                  {viewTrip.visibility} ・ {viewTrip.expires}
                </p>
                <p className="text-[11px] text-slate-400">{viewTrip.updatedAt}</p>
                {/* 旅行属性: 日数・スポット数・写真枚数・チェックリスト数 */}
                <TripStatsRow
                  days={viewTrip.attributes?.days}
                  venues={viewTrip.attributes?.venues}
                  photos={viewTrip.attributes?.photos}
                  checklists={viewTrip.attributes?.checklists}
                />
              </div>
              <div className="flex flex-col items-end gap-2">
                {/* SNS的なリアクション・複製数 */}
                <TripSocialStatsRow
                  stats={{
                    likes: viewTrip.stats.likes,
                    comments: viewTrip.stats.comments,
                    shares: viewTrip.stats.saves,
                    views: 0,
                    replicas: viewTrip.stats.clones,
                  }}
                />
                {originalTrip && (
                  <button
                    onClick={() => handleOpenModal(originalTrip)}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-700 hover:border-indigo-200 hover:text-indigo-600"
                  >
                    <Icon icon="mdi:tune" className="h-3 w-3" />
                    公開設定を編集
                  </button>
                )}
              </div>
            </article>
          )
        })}
      </section>

      <TripShareSettingsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        trip={selectedTrip}
        onSuccess={handleSuccess}
      />
    </>
  )
}


