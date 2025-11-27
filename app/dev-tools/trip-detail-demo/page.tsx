'use client'

import { useEffect, useMemo, useState } from 'react'
import { Icon } from '@iconify/react'
import Link from 'next/link'
import type { Trip, Day, Itinerary, User } from '@/lib/core/types'
import { toDateOrNull } from '@/lib/firebase/timestamp-utils'
import TripPageLayout from '@/components/trip/TripPageLayout'
import TripHeroSection from '@/components/trip/TripHeroSection'
import TripSummaryView from '@/components/trip/TripSummaryView'
import TripItineraryView from '@/components/trip/TripItineraryView'
import TripRightPane from '@/components/trip/TripRightPane'
import Image from 'next/image'

type DemoTripType = 'private' | 'shared' | 'template'

interface DemoTrip extends Trip {
  demoType: DemoTripType
  shared_members?: User[]
  shared_month_label?: string
}

const lodgingKeywords = ['ホテル', '宿泊', '民宿', '旅館', 'guesthouse', 'hotel', 'lodging', 'stay']

const isLodgingVenue = (itinerary: Itinerary) => {
  const targetText = `${itinerary.title ?? ''} ${itinerary.description ?? ''} ${itinerary.location ?? ''}`.toLowerCase()
  return lodgingKeywords.some((keyword) => targetText.includes(keyword.toLowerCase()))
}

// ベースとなるモックTripデータを生成
function createBaseTrip(): { baseTrip: Trip; days: Day[] } {
  const now = new Date()
  const start = new Date(now)
  start.setDate(start.getDate() + 10)
  const end = new Date(start)
  end.setDate(start.getDate() + 4)

  const baseTrip: Trip = {
    id: 'demo-trip-1',
    user_id: 'demo-user-1',
    title: '東京・京都 5日間トリップ',
    slug: 'tokyo-kyoto-5days-demo',
    description:
      '東京で最新スポットを巡ったあと、新幹線で京都へ移動して、寺社仏閣とカフェ巡りを楽しむ5日間のモデルコースです。',
    destination: 'Tokyo & Kyoto, Japan',
    start_date: start,
    end_date: end,
    status: 'PLANNING',
    access_level: 'public',
    image_url:
      'https://images.unsplash.com/photo-1545569341-9eb8b30979d8?auto=format&fit=crop&w=1400&q=80',
    created_at: now,
    updated_at: now,
    likes_count: 42,
    liked_by_me: false,
    creator: {
      id: 'demo-user-1',
      auth_uid: 'demo-user-1',
      name: 'Demo Traveler',
      email: 'demo@example.com',
      slug: 'demo-traveler',
      profile_image_url:
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
      created_at: now,
      updated_at: now,
    } as any,
  }

  const mkDay = (n: number, offset: number, title: string, description: string, its: Itinerary[]): Day => {
    const date = new Date(start)
    date.setDate(start.getDate() + offset)
    return {
      id: `demo-day-${n}`,
      trip_id: baseTrip.id,
      day_number: n,
      date,
      description,
      created_at: now,
      updated_at: now,
      itineraries: its,
    }
  }

  const mkIt = (
    id: string,
    dayId: string,
    sort: number,
    title: string,
    description: string,
    location?: string,
    start_time?: string,
    end_time?: string
  ): Itinerary => ({
    id,
    day_id: dayId,
    sort_number: sort,
    title,
    description,
    location,
    start_time,
    end_time,
    created_at: now,
    updated_at: now,
  })

  const day1Id = 'demo-day-1'
  const day2Id = 'demo-day-2'
  const day3Id = 'demo-day-3'

  const day1 = mkDay(
    1,
    0,
    '東京・到着＆新宿エリア散策',
    '羽田到着後、新宿エリアでゆったりと初日をスタート。',
    [
      mkIt('it-1-1', day1Id, 1, '羽田空港 到着', '到着後、モノレールで浜松町へ移動。', '羽田空港', '09:30', '10:30'),
      mkIt(
        'it-1-2',
        day1Id,
        2,
        'ホテルチェックイン',
        '新宿のホテルに荷物を預けて、身軽な状態で街へ。',
        '新宿駅周辺ホテル',
        '11:30',
        '12:00'
      ),
      mkIt(
        'it-1-3',
        day1Id,
        3,
        '新宿御苑 散策',
        '季節の景色を楽しみながらゆっくり散歩。',
        '新宿御苑',
        '13:00',
        '15:00'
      ),
      mkIt(
        'it-1-4',
        day1Id,
        4,
        '思い出横丁で夕食',
        '小さな居酒屋が並ぶ路地でローカル気分を味わう。',
        '思い出横丁',
        '18:30',
        '20:00'
      ),
    ]
  )

  const day2 = mkDay(
    2,
    1,
    '東京・浅草＆スカイツリー',
    '下町エリアで伝統と最新スポットを一度に体験。',
    [
      mkIt('it-2-1', day2Id, 1, '浅草寺＆仲見世通り', '定番の浅草観光。', '浅草寺', '10:00', '12:00'),
      mkIt(
        'it-2-2',
        day2Id,
        2,
        '隅田川クルーズ',
        '浅草からお台場方面へのクルーズで東京の景色を満喫。',
        '隅田川',
        '13:00',
        '14:30'
      ),
      mkIt(
        'it-2-3',
        day2Id,
        3,
        '東京スカイツリー 展望台',
        '夕方〜夜景タイムに合わせて入場。',
        '東京スカイツリー',
        '17:00',
        '19:00'
      ),
    ]
  )

  const day3 = mkDay(
    3,
    2,
    '京都へ移動・祇園散策',
    '午前中に東京を出発し、午後は京都の街を散歩。',
    [
      mkIt(
        'it-3-1',
        day3Id,
        1,
        '東京駅から京都へ移動',
        '新幹線のぞみ号で約2時間15分。',
        '東京駅 → 京都駅',
        '09:30',
        '11:45'
      ),
      mkIt(
        'it-3-2',
        day3Id,
        2,
        '京都駅周辺で昼食',
        '駅ビル内のレストランでランチ。',
        '京都駅',
        '12:00',
        '13:00'
      ),
      mkIt(
        'it-3-3',
        day3Id,
        3,
        '祇園エリア散策',
        '花見小路や鴨川沿いをゆっくり散歩。',
        '祇園',
        '15:00',
        '18:00'
      ),
    ]
  )

  return {
    baseTrip,
    days: [day1, day2, day3],
  }
}

// デモ用のTripをタイプ別に生成
function createMockTrip(type: DemoTripType): DemoTrip {
  const { baseTrip, days } = createBaseTrip()
  const mockMembers: User[] = [
    {
      id: 'member-1',
      auth_uid: 'member-1',
      name: 'Alice Traveler',
      email: 'alice@example.com',
      slug: 'alice-traveler',
      profile_image_url:
        'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=200&q=80',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 'member-2',
      auth_uid: 'member-2',
      name: 'Bob Explorer',
      email: 'bob@example.com',
      slug: 'bob-explorer',
      profile_image_url:
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 'member-3',
      auth_uid: 'member-3',
      name: 'Carol Adventurer',
      email: 'carol@example.com',
      slug: 'carol-adventurer',
      profile_image_url:
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=200&q=80',
      created_at: new Date(),
      updated_at: new Date(),
    },
  ]

  if (type === 'private') {
    return {
      ...baseTrip,
      access_level: 'private',
      is_template: false,
      demoType: 'private',
      days: days.map((day) => ({
        ...day,
        itineraries: day.itineraries?.map((itinerary) => ({ ...itinerary })),
      })),
      shared_members: mockMembers,
    }
  }

  if (type === 'shared') {
    const now = new Date()
    const startDate = toDateOrNull(baseTrip.start_date) || now
    const sharedMonthLabel = `${startDate.getFullYear()}年${startDate.getMonth() + 1}月`

    // プライベート旅行を参考用にシェアした想定
    return {
      ...baseTrip,
      id: 'demo-trip-shared',
      title: '東京・京都 5日間トリップ（参考用シェア）',
      access_level: 'public',
      is_template: false,
      // 実際のstart/endは保持しつつ、表示はぼかす想定なのでHeroでは非表示にする
      start_date: undefined,
      end_date: undefined,
      demoType: 'shared',
      shared_month_label: sharedMonthLabel,
      days: days.map((day) => ({
        ...day,
        date: undefined as any,
        itineraries: day.itineraries
          ?.filter((itinerary) => !isLodgingVenue(itinerary))
          .map((itinerary) => ({
            ...itinerary,
            location: itinerary.location?.includes('ホテル')
              ? '滞在ホテル（非公開）'
              : itinerary.location,
            description: itinerary.description?.includes('ホテル')
              ? '宿泊先の詳細はプライバシー保護のため省略'
              : itinerary.description,
          })),
      })),
    } as DemoTrip
  }

  // テンプレート用（旅行プランのシェア）
  return {
    ...baseTrip,
    id: 'demo-trip-template',
    title: '東京・京都 5日間モデルプラン',
    description:
      '日付を決める前に、「何泊でどんな順序で回るか」を検討するためのモデルプランです。',
    access_level: 'public',
    is_template: true,
    start_date: undefined,
    end_date: undefined,
    day_count: 5,
    demoType: 'template',
    // 日付なしのDay（Day1, Day2...だけを使う）
    days: days.map((d) => ({
      ...d,
      date: undefined as any,
      itineraries: d.itineraries?.map((itinerary) => ({ ...itinerary })),
    })),
  } as DemoTrip
}

export default function TripDetailDemoPage() {
  const [isMounted, setIsMounted] = useState(false)
  const [activeType, setActiveType] = useState<DemoTripType>('private')
  const [trip, setTrip] = useState<DemoTrip>(() => createMockTrip('private'))
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set())
  const [selectedDayId, setSelectedDayId] = useState<string | null>(trip.days?.[0]?.id ?? null)
  const [selectedItineraryId, setSelectedItineraryId] = useState<string | null>(null)
  const [leftNavExpanded, setLeftNavExpanded] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mapFocusMode, setMapFocusMode] = useState<'all' | 'day' | 'single'>('all')

  // Hydrationエラーを防ぐため、クライアントサイドでのみレンダリング
  useEffect(() => {
    setIsMounted(true)
  }, [])
  const [poiData, setPoiData] = useState<{
    placeId: string
    name: string
    location: { lat: number; lng: number }
    placeData?: any
  } | null>(null)

  const allItineraries = useMemo<Itinerary[]>(
    () => trip.days?.flatMap((d) => d.itineraries || []) ?? [],
    [trip]
  )

  // タイプ変更時にモックTripを差し替え
  useEffect(() => {
    const nextTrip = createMockTrip(activeType)
    setTrip(nextTrip)
    setCollapsedDays(new Set())
    setSelectedDayId(nextTrip.days?.[0]?.id ?? null)
    setSelectedItineraryId(null)
    setMapFocusMode('all')
  }, [activeType])

  const handleToggleDayCollapse = (dayId: string) => {
    setCollapsedDays((prev) => {
      const next = new Set(prev)
      if (next.has(dayId)) {
        next.delete(dayId)
      } else {
        next.add(dayId)
      }
      return next
    })
  }

  const handleDayClick = (dayId: string) => {
    setSelectedDayId(dayId)
    setMapFocusMode('day')
  }

  const handleItineraryClick = (itineraryId: string) => {
    setSelectedItineraryId(itineraryId)
    setMapFocusMode('single')
  }

  const handleUpdateTrip = (updatedTrip: Trip) => {
    setTrip(updatedTrip as DemoTrip)
  }

  const handleExpandAllDays = () => {
    setCollapsedDays(new Set())
  }

  const handleCollapseAllDays = () => {
    const ids = trip.days?.map((d) => d.id) ?? []
    setCollapsedDays(new Set(ids))
  }

  const typeTabs: { id: DemoTripType; label: string; icon: string; description: string }[] = [
    {
      id: 'private',
      label: 'Private Trip',
      icon: 'mdi:lock',
      description: '招待されたメンバーだけが、日付つきの詳細な日程を確認できる通常モード。',
    },
    {
      id: 'shared',
      label: 'Shared Private Trip',
      icon: 'mdi:shield-account',
      description: 'プライベート旅行を参考用にシェア。日付や宿泊先はプライバシー保護のためぼかして表示。',
    },
    {
      id: 'template',
      label: 'Travel Plan Template',
      icon: 'mdi:lightbulb-on-outline',
      description: '日付なしで「何泊何日・Day1/Day2構成」だけを共有する旅行プラン（テンプレート）。',
    },
  ]

  const activeTabMeta = typeTabs.find((t) => t.id === activeType) ?? typeTabs[0]

  const renderPrivateSharingPanel = () => {
    if (trip.demoType !== 'private' || !trip.shared_members) {
      return null
    }

    return (
      <section className="mt-6 px-4">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 space-y-4">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Share</p>
              <h3 className="text-lg font-semibold text-gray-900 mt-1">誰と共有していますか？</h3>
              <p className="text-sm text-gray-600">プライベート旅行は、招待したメンバーだけが閲覧できます。</p>
            </div>
            <button className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800">
              <Icon icon="mdi:account-plus" className="h-4 w-4" />
              メンバーを招待
            </button>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {trip.shared_members.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 border border-gray-100 rounded-xl p-3 hover:border-indigo-200 transition-colors"
              >
                <Image
                  src={
                    member.profile_image_url ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`
                  }
                  alt={member.name}
                  className="h-12 w-12 rounded-full object-cover border border-white shadow"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{member.name}</p>
                  <p className="text-xs text-gray-500 truncate">{member.email}</p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                  <Icon icon="mdi:calendar-account" className="h-3.5 w-3.5" />
                  参加者
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  // Hydrationエラーを防ぐため、クライアントサイドでのみレンダリング
  if (!isMounted) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="h-screen">
      <TripPageLayout
        trip={trip}
        leftNavExpanded={leftNavExpanded}
        onToggleLeftNav={() => setLeftNavExpanded((prev) => !prev)}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
        onNavigateToSection={() => {
          // デモではスクロール連動は省略
        }}
        onDayClick={handleDayClick}
        rightPane={
          <TripRightPane
            trip={trip}
            currentView="itinerary"
            selectedItineraryId={selectedItineraryId}
            selectedDayId={selectedDayId}
            mapFocusMode={mapFocusMode}
            poiData={poiData}
            onItineraryClick={handleItineraryClick}
            onPoiDataUpdate={setPoiData}
            getFilteredItineraries={() => allItineraries}
            scrollSyncEnabled={false}
          />
        }
        mobileToolbar={
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            <span>Trip Detail Demo（ハリボテ）</span>
          </div>
        }
      >
        {/* タイプ切り替えタブ */}
        <div className="px-4 pt-6 pb-3 bg-gray-50 border-b border-gray-200">
          <div className="inline-flex rounded-full bg-white shadow-sm border border-gray-200 p-1">
            {typeTabs.map((tab) => {
              const isActive = tab.id === activeType
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveType(tab.id)}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon icon={tab.icon} className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
          <p className="mt-2 text-xs text-gray-600 flex items-center gap-1">
            <Icon icon="mdi:information-outline" className="h-3.5 w-3.5" />
            <span>{activeTabMeta.description}</span>
          </p>
        </div>

        <TripHeroSection
          trip={trip}
          canEdit={false}
          onUpdateTrip={handleUpdateTrip}
          onDeleteTrip={() => {}}
          canReplica={false}
          onReplica={undefined}
          canPublish={false}
          onPublish={undefined}
        />

        {/* タイプ別の補足ラベル */}
        <div className="px-4 mt-4">
          {trip.demoType === 'private' && (
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs text-indigo-700 border border-indigo-100">
              <Icon icon="mdi:lock" className="h-4 w-4" />
              <span>プライベート旅行：招待されたメンバーだけが、この詳細画面を開くことができます。</span>
            </div>
          )}
          {trip.demoType === 'shared' && (
            <div className="flex flex-wrap gap-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-800 border border-amber-100">
                <Icon icon="mdi:shield-lock-outline" className="h-4 w-4" />
                <span>プライバシー保護：日程や宿泊先は、参考用の粒度でのみ表示されています。</span>
              </div>
              {trip.shared_month_label && (
                <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs text-gray-700 border border-gray-200">
                  <Icon icon="mdi:calendar-month-outline" className="h-4 w-4 text-amber-600" />
                  <span>共有期間: {trip.shared_month_label} 頃</span>
                </div>
              )}
            </div>
          )}
          {trip.demoType === 'template' && (
            <div className="inline-flex items-center gap-2 rounded-full bg-purple-50 px-3 py-1 text-xs text-purple-800 border border-purple-100">
              <Icon icon="mdi:lightbulb-on-outline" className="h-4 w-4" />
              <span>旅行プラン（テンプレート）：日付は未設定で、Day1 / Day2 構成だけを共有します。</span>
            </div>
          )}
        </div>

        {/* プライベート旅行の場合: 共有メンバー表示（最初の画面） */}
        {renderPrivateSharingPanel()}

        {/* テンプレートの場合: クリエイタープロフィール表示 */}
        {trip.demoType === 'template' && trip.creator && (
          <section className="px-4 mt-6">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Icon icon="mdi:account-circle" className="h-6 w-6 text-purple-600" />
                クリエイター
              </h2>
              <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Icon icon="mdi:information" className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-purple-800">
                    <p className="font-medium mb-1">このプランを作成したクリエイターのプロフィールを表示します</p>
                    <p className="text-xs">ツアー呼び込みや業者プランの場合、信頼性を高めるためにクリエイター情報を明確に表示します。</p>
                  </div>
                </div>
              </div>

              {/* クリエイタープロフィールカード */}
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                {/* アバター */}
                <div className="flex-shrink-0">
                  {trip.creator.profile_image_url ? (
                    <Image
                      src={trip.creator.profile_image_url}
                      alt={trip.creator.name}
                      className="h-20 w-20 rounded-full border-2 border-white shadow-md object-cover"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full border-2 border-white shadow-md bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                      <Icon icon="mdi:account" className="h-10 w-10 text-white" />
                    </div>
                  )}
                </div>

                {/* プロフィール情報 */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-2xl font-bold text-gray-900">{trip.creator.name}</h3>
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                      <Icon icon="mdi:account" className="h-4 w-4" />
                      ユーザープラン
                    </span>
                  </div>
                  {trip.creator.email && (
                    <p className="text-gray-600 mb-3">{trip.creator.email}</p>
                  )}
                  <p className="text-sm text-gray-700 mb-4">
                    旅行プランナーとして、様々な旅行プランを作成しています。効率的な移動方法や地域の楽しみ方を提案します。
                  </p>

                  {/* 統計情報 */}
                  <div className="flex flex-wrap gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Icon icon="mdi:file-document-multiple" className="h-5 w-5 text-indigo-600" />
                      <div>
                        <div className="text-sm font-semibold text-gray-900">24</div>
                        <div className="text-xs text-gray-600">公開プラン</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Icon icon="mdi:heart" className="h-5 w-5 text-rose-600" />
                      <div>
                        <div className="text-sm font-semibold text-gray-900">156</div>
                        <div className="text-xs text-gray-600">総いいね数</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Icon icon="mdi:account-group" className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="text-sm font-semibold text-gray-900">89</div>
                        <div className="text-xs text-gray-600">フォロワー</div>
                      </div>
                    </div>
                  </div>

                  {/* アクションボタン */}
                  <div className="flex gap-3">
                    <button
                      disabled
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg opacity-50 cursor-not-allowed"
                    >
                      <Icon icon="mdi:account-plus" className="h-5 w-5" />
                      <span>フォロー</span>
                    </button>
                    <button
                      disabled
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg opacity-50 cursor-not-allowed"
                    >
                      <Icon icon="mdi:message" className="h-5 w-5" />
                      <span>メッセージ</span>
                    </button>
                    {trip.creator.slug && (
                      <Link
                        href={`/${trip.creator.slug}`}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Icon icon="mdi:account-circle" className="h-5 w-5" />
                        <span>プロフィールを見る</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {trip.demoType !== 'shared' && (
          <TripSummaryView
            trip={trip}
            summaryCollapsed={false}
            onToggleSummary={() => {
              // デモでは折りたたみは固定
            }}
            getAllItineraries={() => allItineraries}
          />
        )}

        {/* 公開モードのSNS活動コントロール */}
        {(trip.demoType === 'shared' || trip.demoType === 'template') && (
          <section className="px-4 mt-6">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">SNS活動</h3>
                <div className="flex items-center gap-3">
                  {/* いいね（既にHeroに表示されているが、ここにも表示） */}
                  <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 hover:border-rose-300 hover:bg-rose-50 transition-colors">
                    <Icon icon="mdi:heart-outline" className="h-5 w-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">
                      {trip.likes_count || 0}
                    </span>
                  </button>
                  {/* シェア */}
                  <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors">
                    <Icon icon="mdi:share-variant" className="h-5 w-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">シェア</span>
                  </button>
                  {/* コメント */}
                  <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                    <Icon icon="mdi:comment-outline" className="h-5 w-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">
                      {trip.social_stats?.comments_count || 0}
                    </span>
                  </button>
                </div>
              </div>

              {/* コメントセクション */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex items-start gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex-shrink-0" />
                  <div className="flex-1">
                    <textarea
                      placeholder="コメントを入力..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                      rows={3}
                      disabled
                    />
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-gray-500">（デモ：コメント投稿は未実装）</p>
                      <button
                        disabled
                        className="px-4 py-1.5 bg-indigo-500 text-white text-sm font-medium rounded-lg opacity-50 cursor-not-allowed"
                      >
                        投稿
                      </button>
                    </div>
                  </div>
                </div>

                {/* コメント一覧（モック） */}
                <div className="space-y-4 mt-6">
                  {[
                    { name: 'Alice Traveler', text: '素敵なプランですね！参考にさせていただきます。', time: '2時間前' },
                    { name: 'Bob Explorer', text: '京都のカフェ巡り、私も行ってみたいです！', time: '5時間前' },
                    { name: 'Carol Adventurer', text: '写真が美しいですね。実際に行った感想も聞きたいです。', time: '1日前' },
                  ].map((comment, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-gray-900">{comment.name}</span>
                          <span className="text-xs text-gray-500">{comment.time}</span>
                        </div>
                        <p className="text-sm text-gray-700">{comment.text}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <button className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
                            <Icon icon="mdi:heart-outline" className="h-3.5 w-3.5" />
                            <span>いいね</span>
                          </button>
                          <button className="text-xs text-gray-500 hover:text-gray-700">
                            返信
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {trip.demoType === 'shared' && (
          <section className="px-4 mt-6">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
              <header className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">
                    Photo Story
                  </p>
                  <h3 className="text-lg font-semibold text-gray-900 mt-1">
                    フォトと訪問先で旅の雰囲気をシェア
                  </h3>
                  <p className="text-sm text-gray-600">
                    日付や宿泊地は伏せつつ、どんな場所で何を楽しんだかを写真付きで共有します。
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                  <Icon icon="mdi:camera-enhance" className="h-4 w-4" />
                  Privacy Friendly
                </span>
              </header>

              <div className="grid gap-4 p-4 md:grid-cols-2">
                {allItineraries.slice(0, 6).map((itinerary, index) => {
                  const photoUrl = `https://images.unsplash.com/photo-${
                    [
                      '1469474968028-56623f02e42e',
                      '1500534314209-a25ddb2bd429',
                      '1507525428034-b723cf961d3e',
                      '1500048993953-d23a436266cf',
                      '1491557345352-5929e343eb89',
                      '1508672019048-805c876b67e2',
                    ][index % 6]
                  }?auto=format&fit=crop&w=800&q=80`

                  return (
                    <article
                      key={itinerary.id}
                      className="rounded-2xl overflow-hidden border border-gray-100 bg-gray-50"
                    >
                      <div className="relative h-48">
                        <Image
                          src={photoUrl}
                          alt={itinerary.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                        <div className="absolute bottom-3 left-3 right-3 text-white drop-shadow">
                          <p className="text-sm uppercase tracking-wide text-white/80">
                            {`Day ${trip.days?.find((d) => d.id === itinerary.day_id)?.day_number ?? '-'}`}
                          </p>
                          <h4 className="text-xl font-semibold">{itinerary.title}</h4>
                        </div>
                      </div>
                      <div className="p-4 space-y-2 bg-white">
                        {itinerary.location && (
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Icon icon="mdi:map-marker" className="h-4 w-4 text-amber-500" />
                            {itinerary.location}
                          </p>
                        )}
                        {itinerary.description && (
                          <p className="text-sm text-gray-700 line-clamp-2">
                            {itinerary.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 pt-2 text-xs text-gray-500">
                          <span className="inline-flex items-center gap-1">
                            <Icon icon="mdi:heart-outline" className="h-3.5 w-3.5" />
                            128
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Icon icon="mdi:comment-outline" className="h-3.5 w-3.5" />
                            12
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Icon icon="mdi:share-variant" className="h-3.5 w-3.5" />
                            シェア
                          </span>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        <TripItineraryView
          trip={trip}
          canEdit={false}
          collapsedDays={collapsedDays}
          selectedDayId={selectedDayId}
          selectedItineraryId={selectedItineraryId}
          loadingDayIds={new Set()}
          onToggleDayCollapse={handleToggleDayCollapse}
          onDayClick={handleDayClick}
          onAddSchedule={() => {}}
          onInsertSchedule={() => {}}
          onAddDay={() => {}}
          onScheduleUpdated={() => {}}
          onMoveUp={() => {}}
          onMoveDown={() => {}}
          onMoveToDay={() => {}}
          onDuplicateToDay={() => {}}
          onScheduleDelete={() => {}}
          onItineraryClick={handleItineraryClick}
          onDragEnd={() => {}}
          onUpdateTrip={handleUpdateTrip}
          onReorderItineraries={() => {}}
          expandAllDays={handleExpandAllDays}
          collapseAllDays={handleCollapseAllDays}
          scrollSyncEnabled={false}
          onScrollSyncEnabledChange={undefined}
          isProgrammaticScrollRef={undefined}
          scrollToItineraryRef={undefined}
        />
      </TripPageLayout>
    </div>
  )
}


