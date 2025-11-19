'use client'

import { useAuth } from '@/lib/contexts/auth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { makeAuthenticatedRequest } from '@/lib/api/helpers'
import { dateUtils } from '@/lib/utils/date'
import HomeHeader from '@/components/common/HomeHeader'
import HomeFooter from '@/components/common/HomeFooter'
import { useUserData } from '@/lib/contexts/user-data'
import type { Trip } from '@/lib/core/types'
import Loading from '@/components/common/Loading'
import { Icon } from '@iconify/react'
import Link from 'next/link'
import { TripCard } from '@/components/tripcard/TripCard'
import TripFeed from '@/components/social/TripFeed'
import { toDateOrNull } from '@/lib/firebase/timestamp-utils'

/**
 * v3.0.0 Home Page - 必要最低限のUX
 * 
 * - 進行中のTrip（直近3件、updated_atでソート）
 * - 近日の予定（出発日が近いTrip、start_dateでソート）
 * - 友人の近況サマリ（フォロー中の最新3件のTrip）
 */
export default function HomePage() {
  const { user, loading, logout } = useAuth()
  const { trips, tripsLoading, refreshTrips, planConfig, userData, userDataLoading } = useUserData()
  const router = useRouter()
  const activeTab: 'following' = 'following'

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])


  if (loading || tripsLoading || userDataLoading) {
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

  // 進行中のTrip（期間内のものを優先、最大2件）
  const tripsSortedByRecent = sortTripsByUpdatedAt(trips)
  const ongoingTrips = filterOngoingTrips(tripsSortedByRecent)
  const activeTrips = (ongoingTrips.length > 0 ? ongoingTrips : tripsSortedByRecent).slice(0, 2)

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

  const mockUpcomingCards = [
    {
      id: 'mock-upcoming-1',
      title: '沖縄ビーチホッピング',
      destination: '沖縄・本島',
      dateLabel: '5月12日 - 5月15日',
      daysLabel: '12日後',
      imageUrl: `https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=70`,
    },
    {
      id: 'mock-upcoming-2',
      title: '台北グルメツアー',
      destination: '台湾・台北',
      dateLabel: '6月2日 - 6月5日',
      daysLabel: '33日後',
      imageUrl: `https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=800&q=70`,
    },
    {
      id: 'mock-upcoming-3',
      title: '北欧オーロラ追跡',
      destination: 'アイスランド',
      dateLabel: '9月10日 - 9月15日',
      daysLabel: '133日後',
      imageUrl: `https://images.unsplash.com/photo-1483683804023-6ccdb62f86ef?auto=format&fit=crop&w=800&q=70`,
    },
  ]

  const mockRecentlyChecked = [
    {
      id: 'recent-1',
      title: 'ソウル週末SPA旅',
      destination: '韓国・ソウル',
      imageUrl: 'https://images.unsplash.com/photo-1528909514045-2fa4ac7a08ba?auto=format&fit=crop&w=800&q=70',
      lastViewed: '2時間前',
    },
    {
      id: 'recent-2',
      title: 'サンフランシスコ食べ歩き',
      destination: 'アメリカ・SF',
      imageUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=70',
      lastViewed: '昨日',
    },
    {
      id: 'recent-3',
      title: 'ウィーン音楽と文化散歩',
      destination: 'オーストリア・ウィーン',
      imageUrl: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=800&q=70',
      lastViewed: '2日前',
    },
    {
      id: 'recent-4',
      title: 'ケープタウン絶景ロードトリップ',
      destination: '南アフリカ・ケープタウン',
      imageUrl: 'https://images.unsplash.com/photo-1500534315680-97dcfb52269a?auto=format&fit=crop&w=800&q=70',
      lastViewed: '4日前',
    },
    {
      id: 'recent-5',
      title: 'メキシコ　古代遺跡と街歩き',
      destination: 'メキシコ・メリダ',
      imageUrl: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=800&q=70',
      lastViewed: '1週間前',
    },
  ]

  // 近日の予定（start_dateでソート、未来のTripのみ）
  const upcomingTrips = sortTripsByStartDate(filterUpcomingTrips(trips)).slice(0, 3)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <HomeHeader
        userName={userData?.name || user?.email || 'User'}
        planName={planConfig?.name || 'Season Traveler'}
        avatarUrl={userData?.profile_image_url || user?.photoURL}
        onLogout={handleLogout}
        onChangePlan={handleChangePlan}
        userSlug={userData?.slug}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome</h1>
            <p className="text-gray-600">Discover and manage your travels</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-600 text-white text-sm font-semibold shadow-sm hover:bg-indigo-700 transition-colors"
            >
              <Icon icon="mdi:plus-circle" className="h-5 w-5" />
              Create Trip
            </button>
            <button
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-200 text-indigo-600 text-sm font-semibold hover:border-indigo-300 transition-colors"
            >
              <Icon icon="mdi:calendar-edit" className="h-5 w-5" />
              Quick Plan
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
          {/* 左カラム: Feed（メイン） */}
          <div className="lg:col-span-7 space-y-6">
            {/* Feed 検索（ダミー） */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <label className="text-sm font-medium text-gray-700 mb-2 block" htmlFor="home-feed-search">
                旅のキーワード検索
              </label>
              <div className="relative">
                <Icon
                  icon="mdi:magnify"
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
                />
                <input
                  id="home-feed-search"
                  type="text"
                  placeholder="例: バリ島 サーフィン、冬のヨーロッパ など"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-colors"
                />
              </div>
              <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                <Icon icon="mdi:information-outline" className="h-4 w-4" />
                現在は見た目のみで、検索はまだ動作しません。
              </p>
            </div>

            {/* Feed ヘッダー */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-indigo-600">
                <Icon icon="mdi:account-group" className="h-5 w-5" />
                フォロー中の最新アップデート
              </div>
              <Link
                href="/feed"
                className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-indigo-600 transition-colors"
              >
                Discover Public / Trending
                <Icon icon="mdi:arrow-top-right" className="h-4 w-4" />
              </Link>
            </div>

            {/* Feed コンテンツ */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <TripFeed feedType={activeTab} layout="grid" />
            </div>
          </div>

          {/* 右カラム: 自分の旅行情報（サブ） */}
          <div className="lg:col-span-3 space-y-6">
            {/* 進行中のTrip */}
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Icon icon="mdi:map-marker-path" className="h-5 w-5 text-indigo-600" />
                  進行中
                </h2>
                <div className="flex items-center gap-2">
                  <Link 
                    href="#" 
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full hover:bg-indigo-100"
                  >
                    <Icon icon="mdi:plus" className="h-3 w-3" />
                    新しい旅を作成
                  </Link>
                  <Link 
                    href="/plan" 
                    className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    すべて
                    <Icon icon="mdi:chevron-right" className="h-3 w-3" />
                  </Link>
                </div>
              </div>
              
              {activeTrips.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <Icon icon="mdi:map-outline" className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-xs mb-2">進行中のTripはありません</p>
                  <Link 
                    href="/plan" 
                    className="inline-block text-indigo-600 hover:text-indigo-800 text-xs"
                  >
                    新規作成
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeTrips.map((trip, index) => {
                    const startDate = toDateOrNull(trip.start_date)
                    const endDate = toDateOrNull(trip.end_date)
                    const totalDays =
                      startDate && endDate ? Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / DAY_MS) + 1) : null
                    const elapsedDays =
                      startDate && totalDays
                        ? Math.min(totalDays, Math.max(0, Math.ceil((today.getTime() - startDate.getTime()) / DAY_MS) + 1))
                        : null
                    const remainingDays = endDate ? Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / DAY_MS)) : null
                    const progress = totalDays && elapsedDays ? Math.round((elapsedDays / totalDays) * 100) : null
                    const coverImage = getCoverImage(trip, index, activeCoverPool)

                    return (
                      <Link
                        key={trip.id}
                        href={trip.creator?.slug && trip.slug ? `/${trip.creator.slug}/${trip.slug}` : '/home'}
                        className="block"
                      >
                        <article className="border border-gray-200 rounded-2xl overflow-hidden hover:border-indigo-300 hover:shadow-sm transition-all bg-white">
                          <div className="md:flex">
                            <div className="md:w-1/3 h-48 md:h-full bg-gray-100">
                              <img src={coverImage} alt={trip.title || 'Trip cover'} className="w-full h-full object-cover" />
                            </div>
                            <div className="md:w-2/3 p-4 flex flex-col gap-3">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <h3 className="text-base font-semibold text-gray-900 line-clamp-2">
                                    {trip.title || 'Untitled Trip'}
                                  </h3>
                                  <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                    <Icon icon="mdi:map-marker" className="h-4 w-4 text-indigo-500" />
                                    {trip.destination || 'No destination'}
                                  </p>
                                </div>
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                                  <Icon icon="mdi:progress-clock" className="h-4 w-4" />
                                  進行中
                                </span>
                              </div>

                              {trip.description && (
                                <p className="text-sm text-gray-600 line-clamp-2">{trip.description}</p>
                              )}

                              <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
                                <div>
                                  <p className="text-xs text-gray-500">期間</p>
                                  {trip.start_date && trip.end_date ? (
                                    <p className="font-medium">{dateUtils.formatDateRange(trip.start_date, trip.end_date)}</p>
                                  ) : (
                                    <p className="font-medium text-gray-400">未設定</p>
                                  )}
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">残り日数</p>
                                  {remainingDays !== null ? (
                                    <p className="font-medium">{remainingDays === 0 ? '今日まで' : `${remainingDays}日`}</p>
                                  ) : (
                                    <p className="font-medium text-gray-400">未設定</p>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100">
                                  <Icon icon="mdi:account-circle" className="h-4 w-4 text-gray-500" />
                                  {trip.creator?.name || 'You'}
                                </span>
                                {trip.status && (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100">
                                    <Icon icon="mdi:clipboard-text" className="h-4 w-4 text-gray-500" />
                                    {trip.status}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {progress !== null && (
                            <div
                              className="h-1.5 bg-gray-100"
                              style={{
                                background: `linear-gradient(to right, #6366f1 ${progress}%, #e5e7eb ${progress}%)`,
                              }}
                            >
                              <span className="sr-only">進捗 {progress}%</span>
                            </div>
                          )}
                        </article>
                      </Link>
                    )
                  })}
                </div>
              )}
            </section>

            {/* 近日の予定 */}
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Icon icon="mdi:calendar-clock" className="h-5 w-5 text-emerald-600" />
                  近日
                </h2>
                <Link 
                  href="/plan" 
                  className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  すべて
                  <Icon icon="mdi:chevron-right" className="h-3 w-3" />
                </Link>
              </div>
              
              {upcomingTrips.length === 0 ? (
                <div className="space-y-2">
                  {mockUpcomingCards.map((mock) => (
                    <div key={mock.id} className="border border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                      <div className="flex gap-3">
                        <div className="w-20 h-20 flex-shrink-0 bg-gray-100">
                          <img src={mock.imageUrl} alt={mock.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="py-2 pr-3 flex-1">
                          <h3 className="font-medium text-sm text-gray-900 mb-1 line-clamp-1">{mock.title}</h3>
                          <p className="text-xs text-gray-600 mb-1 line-clamp-1">{mock.destination}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-gray-500">{mock.dateLabel}</p>
                            <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600">{mock.daysLabel}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {upcomingTrips.map((trip, index) => {
                    const imageUrl = getCoverImage(trip, index, upcomingCoverPool)
                    const startDate = toDateOrNull(trip.start_date)
                    const daysUntil = startDate 
                      ? Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                      : null

                    return (
                      <Link
                        key={trip.id}
                        href={trip.creator?.slug && trip.slug ? `/${trip.creator.slug}/${trip.slug}` : '/home'}
                        className="block"
                      >
                        <div className="border border-gray-200 rounded-lg overflow-hidden hover:border-emerald-300 hover:shadow-sm transition-all">
                          <div className="flex gap-3">
                            <div className="w-20 h-20 flex-shrink-0 bg-gray-100">
                              <img src={imageUrl} alt={trip.title || 'Upcoming trip cover'} className="w-full h-full object-cover" />
                            </div>
                            <div className="py-2 pr-3 flex-1">
                              <h3 className="font-medium text-sm text-gray-900 mb-1 line-clamp-1">{trip.title || 'Untitled Trip'}</h3>
                              <p className="text-xs text-gray-600 mb-1 line-clamp-1">{trip.destination || 'No destination'}</p>
                              {startDate && (
                                <div className="flex items-center gap-2">
                                  <p className="text-xs text-gray-500">
                                    {dateUtils.formatDateRange(trip.start_date!, trip.end_date!)}
                                  </p>
                                  {daysUntil !== null && daysUntil >= 0 && (
                                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                                      daysUntil <= 7 
                                        ? 'bg-red-100 text-red-700' 
                                        : daysUntil <= 30 
                                        ? 'bg-yellow-100 text-yellow-700' 
                                        : 'bg-gray-100 text-gray-700'
                                    }`}>
                                      {daysUntil === 0 ? '今日' : `${daysUntil}日後`}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </section>

            {/* Recently Checked（モック） */}
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Icon icon="mdi:clock-time-four-outline" className="h-5 w-5 text-purple-500" />
                  Recently You Checked
                </h2>
                <button className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1">
                  すべて
                  <Icon icon="mdi:chevron-right" className="h-3 w-3" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {mockRecentlyChecked.map((item) => (
                  <div
                    key={item.id}
                    className="border border-gray-200 rounded-xl overflow-hidden hover:border-purple-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex gap-3">
                      <div className="w-16 h-16 flex-shrink-0 bg-gray-100">
                        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="py-2 pr-3 flex-1">
                        <p className="text-xs text-gray-500 mb-0.5">{item.lastViewed}</p>
                        <h3 className="font-medium text-sm text-gray-900 mb-1 line-clamp-1">{item.title}</h3>
                        <p className="text-xs text-gray-600 line-clamp-1">{item.destination}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>

      <HomeFooter />
    </div>
  )
}
