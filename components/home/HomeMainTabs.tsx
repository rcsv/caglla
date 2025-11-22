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

const FRIEND_ACTIVITIES = [
  {
    id: 'activity-okinawa',
    type: 'shared' as const,
    status: 'live' as const,
    userName: '佐藤 美奈',
    userHandle: '@mina_travel',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mina',
    action: '沖縄女子旅をシェアしました',
    timestamp: '45分前',
    title: '梅雨明けの沖縄3泊4日',
    location: '沖縄・那覇 / 恩納村',
    summary: '透明度の高い海とニューオープンのカフェを中心に巡る大人女子旅アルバム。',
    cover:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    tags: ['#女子旅', '#3泊4日', '#ビーチ'],
    metrics: { likes: 128, comments: 24, shares: 12 },
  },
  {
    id: 'activity-template',
    type: 'template' as const,
    status: 'normal' as const,
    userName: 'NAO PLANNER',
    userHandle: '@nao_planner',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nao',
    action: '京都グルメプランを公開',
    timestamp: '2時間前',
    title: '京町家に住むように滞在する48時間',
    location: '京都・五条 / 祇園',
    summary: '町家ステイと夜の茶会体験を組み合わせた2泊3日プラン。予約リンク付き。',
    cover:
      'https://images.unsplash.com/photo-1545569341-9eb8b30979d6?auto=format&fit=crop&w=1200&q=80',
    tags: ['#グルメ', '#町家ステイ', '#2泊3日'],
    metrics: { likes: 96, comments: 11, shares: 7 },
  },
  {
    id: 'activity-hokkaido',
    type: 'shared' as const,
    status: 'normal' as const,
    userName: 'Ken Yamamoto',
    userHandle: '@ken_outdoor',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ken',
    action: '家族旅行をアルバム公開',
    timestamp: '昨日',
    title: '子連れで巡る北海道ドライブ',
    location: '札幌 / 富良野 / 美瑛',
    summary:
      '未就学児2人との北海道ドライブ。動物園やファーム富田を効率的に巡る実例。',
    cover:
      'https://images.unsplash.com/photo-1473625247510-8ceb1760943f?auto=format&fit=crop&w=1200&q=80',
    tags: ['#家族旅', '#ドライブ', '#夏休み'],
    metrics: { likes: 201, comments: 32, shares: 18 },
  },
]

const PLAN_IDEAS = [
  {
    id: 'idea-helsinki',
    title: '北欧デザインを巡るヘルシンキ3日間',
    region: 'ヨーロッパ / フィンランド',
    days: '3日間',
    budget: '¥¥',
    theme: 'デザインとカフェ',
    tags: ['大人女子', 'アート', '路面電車'],
    summary: 'マリメッコ本社・デザインディストリクト・サウナ体験を詰め込んだ定番セット。',
    cover:
      'https://images.unsplash.com/photo-1500048993953-d23a436266cf?auto=format&fit=crop&w=1200&q=80',
    creator: {
      name: 'Lina Planner',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lina',
      role: 'Travel Creator',
    },
    stats: { likes: 86, clones: 14 },
  },
  {
    id: 'idea-fukuoka',
    title: '福岡と糸島で過ごす48時間ショートトリップ',
    region: '日本 / 福岡',
    days: '2泊3日',
    budget: '¥',
    theme: '食と自然',
    tags: ['ひとり旅', 'シーサイド', 'カフェ巡り'],
    summary:
      '屋台よりも糸島の静かなカフェとワーケーションスポットを重視した構成。',
    cover:
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80',
    creator: {
      name: 'Takuya Nomad',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Takuya',
      role: 'Nomad Planner',
    },
    stats: { likes: 54, clones: 21 },
  },
  {
    id: 'idea-bali',
    title: 'バリ島ワーク＆ウェルネス リトリート',
    region: 'アジア / インドネシア',
    days: '4泊5日',
    budget: '¥¥¥',
    theme: 'リモートワーク',
    tags: ['ウェルネス', 'ヨガ', 'サーフィン'],
    summary:
      '朝ヨガと夕方サーフで1日を区切るワークデイ設計。ビザ・SIM情報付き。',
    cover:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    creator: {
      name: 'Studio Paon',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Paon',
      role: 'Boutique Planner',
    },
    stats: { likes: 112, clones: 33 },
  },
  {
    id: 'idea-sydney',
    title: '親子で楽しむシドニー体験セット',
    region: 'オセアニア / オーストラリア',
    days: '5日間',
    budget: '¥¥',
    theme: '親子旅',
    tags: ['動物体験', '街歩き', '海沿い'],
    summary:
      'ライトレールとフェリーで巡る親子旅。タロンガ動物園とボンダイキッズプログラム込み。',
    cover:
      'https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=1200&q=80',
    creator: {
      name: 'Haruka & Co.',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Haruka',
      role: 'Family Travel Lab',
    },
    stats: { likes: 73, clones: 17 },
  },
]

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
  return (
    <section className="space-y-4">
      {FRIEND_ACTIVITIES.map((activity) => (
        <article
          key={activity.id}
          className="rounded-sm border border-slate-200 bg-white p-4 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3 mb-3">
            <img
              src={activity.avatar}
              alt={activity.userName}
              className="h-9 w-9 rounded-full border border-slate-200"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {activity.userName}
                </p>
                <span className="text-xs text-slate-400 truncate">{activity.userHandle}</span>
              </div>
              <p className="text-xs text-slate-500">{activity.action}</p>
            </div>
            <span className="text-xs text-slate-400">{activity.timestamp}</span>
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <div className="md:w-40 md:flex-shrink-0">
              <div className="relative h-28 w-full overflow-hidden rounded-sm">
                <img
                  src={activity.cover}
                  alt={activity.title}
                  className="h-full w-full object-cover"
                />
                {activity.status === 'live' && (
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-red-500/90 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                    LIVE
                  </span>
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <h3 className="text-sm font-semibold text-slate-900 truncate">{activity.title}</h3>
              <p className="text-xs text-slate-500 truncate">{activity.location}</p>
              <p className="text-xs text-slate-600 line-clamp-2">{activity.summary}</p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1">
                  {activity.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Icon icon="mdi:heart-outline" className="h-3 w-3" />
                    {activity.metrics.likes}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Icon icon="mdi:message-outline" className="h-3 w-3" />
                    {activity.metrics.comments}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Icon icon="mdi:share-outline" className="h-3 w-3" />
                    {activity.metrics.shares}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </article>
      ))}
    </section>
  )
}

function PlanCatalog() {
  return (
    <section className="grid gap-4 md:grid-cols-2">
      {PLAN_IDEAS.map((idea) => (
        <article
          key={idea.id}
          className="group flex flex-col overflow-hidden rounded-sm border border-slate-200 bg-white shadow-sm hover:border-indigo-200 hover:shadow-md transition-all"
        >
          <div className="relative h-40 w-full overflow-hidden">
            <img
              src={idea.cover}
              alt={idea.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/0" />
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-slate-100">{idea.region}</p>
                <p className="text-xs text-slate-200">
                  {idea.days} ・ {idea.budget} ・ {idea.theme}
                </p>
              </div>
              <div className="rounded-full bg-slate-900/60 px-2 py-1 text-[10px] text-slate-100">
                {idea.stats.likes} ♥︎
              </div>
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-3 p-4">
            <h3 className="text-sm font-semibold text-slate-900 line-clamp-2">{idea.title}</h3>
            <p className="text-xs text-slate-600 line-clamp-2">{idea.summary}</p>
            <div className="flex flex-wrap gap-1">
              {idea.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-auto flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <img
                  src={idea.creator.avatar}
                  alt={idea.creator.name}
                  className="h-7 w-7 rounded-full border border-slate-200"
                />
                <div>
                  <p className="text-xs font-semibold text-slate-800">{idea.creator.name}</p>
                  <p className="text-[11px] text-slate-500">{idea.creator.role}</p>
                </div>
              </div>
              <button className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-700 hover:border-indigo-200 hover:text-indigo-600">
                <Icon icon="mdi:content-copy" className="h-3 w-3" />
                プランを複製
              </button>
            </div>
          </div>
        </article>
      ))}
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


