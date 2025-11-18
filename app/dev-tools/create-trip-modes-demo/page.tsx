'use client'

import { useState } from 'react'
import { Icon } from '@iconify/react'
import type { Trip, User } from '@/lib/core/types'
import Link from 'next/link'

/**
 * Create Trip from Public Trip Demo
 * 
 * Public Tripをベースに新規Tripを作成する体験を模擬できるハリボテページ
 * 将来的には「Clone Trip Plan」のワンクリック体験に進化予定
 */
export default function CreateTripModesDemoPage() {
  const [selectedPublicTrip, setSelectedPublicTrip] = useState<Trip | null>(null)

  // モック：公開されているPublic Trip一覧
  const mockPublicTrips: Trip[] = [
    {
      id: 'public-trip-1',
      user_id: 'user-1',
      title: '東京・京都 5日間トリップ',
      slug: 'tokyo-kyoto-5days',
      destination: 'Tokyo & Kyoto, Japan',
      description: '東京で最新スポットを巡ったあと、新幹線で京都へ移動して、寺社仏閣とカフェ巡りを楽しむ5日間のモデルコースです。',
      access_level: 'public',
      status: 'PLANNING',
      image_url: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d8?auto=format&fit=crop&w=1400&q=80',
      likes_count: 42,
      created_at: new Date(),
      updated_at: new Date(),
      creator: {
        id: 'user-1',
        auth_uid: 'user-1',
        name: 'Demo Traveler',
        email: 'demo@example.com',
        slug: 'demo-traveler',
        profile_image_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
        created_at: new Date(),
        updated_at: new Date(),
      } as User,
      social_stats: {
        likes_count: 42,
        comments_count: 8,
        shares_count: 12,
        views_count: 350,
        replicas_count: 5,
      },
    },
    {
      id: 'public-trip-2',
      user_id: 'user-2',
      title: '沖縄3泊4日の楽しみ方',
      slug: 'okinawa-4days',
      destination: '沖縄県',
      description: '沖縄を効率的に楽しむための3泊4日のプランです。',
      access_level: 'public',
      status: 'PLANNING',
      is_template: true,
      day_count: 4,
      image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80',
      likes_count: 28,
      created_at: new Date(),
      updated_at: new Date(),
      creator: {
        id: 'user-2',
        auth_uid: 'user-2',
        name: 'Okinawa Expert',
        email: 'expert@example.com',
        slug: 'okinawa-expert',
        profile_image_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Okinawa',
        created_at: new Date(),
        updated_at: new Date(),
      } as User,
      social_stats: {
        likes_count: 28,
        comments_count: 5,
        shares_count: 8,
        views_count: 200,
        replicas_count: 3,
      },
    },
    {
      id: 'public-trip-3',
      user_id: 'user-3',
      title: '北海道冬の旅',
      slug: 'hokkaido-winter',
      destination: '北海道',
      description: '雪景色と温泉を楽しむ北海道の冬旅行プラン。',
      access_level: 'public',
      status: 'PLANNING',
      image_url: 'https://images.unsplash.com/photo-1500048993953-d23a436266cf?auto=format&fit=crop&w=1400&q=80',
      likes_count: 35,
      created_at: new Date(),
      updated_at: new Date(),
      creator: {
        id: 'user-3',
        auth_uid: 'user-3',
        name: 'Winter Lover',
        email: 'winter@example.com',
        slug: 'winter-lover',
        profile_image_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Winter',
        created_at: new Date(),
        updated_at: new Date(),
      } as User,
      social_stats: {
        likes_count: 35,
        comments_count: 6,
        shares_count: 10,
        views_count: 280,
        replicas_count: 4,
      },
    },
  ]


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Trip from Public Trip</h1>
              <p className="text-gray-600">Public Tripをベースに新しいTripを作成する体験を模擬できます</p>
              <p className="text-sm text-gray-500 mt-2">
                ※ 将来的には「Clone Trip Plan」のワンクリック体験に進化予定
              </p>
            </div>
            <Link
              href="/dev-tools"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Icon icon="mdi:arrow-left" className="h-5 w-5" />
              <span>Dev Toolsに戻る</span>
            </Link>
          </div>
        </div>

        {/* Public Tripをベースに新規作成 */}
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Icon icon="mdi:plus-circle-outline" className="h-6 w-6 text-indigo-600" />
                <span>ステップ1: Public Tripを選択</span>
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                ベースにしたい公開Tripを選んでください。選択したTripの日程や訪問先を参考に、新しいTripを作成します。
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockPublicTrips.map((trip) => {
                  const isSelected = selectedPublicTrip?.id === trip.id
                  return (
                    <button
                      key={trip.id}
                      type="button"
                      onClick={() => setSelectedPublicTrip(trip)}
                      className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                        isSelected
                          ? 'border-indigo-500 ring-2 ring-indigo-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {trip.image_url && (
                        <div className="relative h-32">
                          <img
                            src={trip.image_url}
                            alt={trip.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                          {isSelected && (
                            <div className="absolute top-2 right-2 bg-indigo-500 text-white rounded-full p-1.5">
                              <Icon icon="mdi:check" className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                      )}
                      <div className="p-4 bg-white">
                        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{trip.title}</h3>
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">{trip.description}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                          <span className="flex items-center gap-1">
                            <Icon icon="mdi:heart" className="h-3.5 w-3.5" />
                            {trip.social_stats?.likes_count || trip.likes_count || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Icon icon="mdi:account" className="h-3.5 w-3.5" />
                            {trip.creator?.name || 'Unknown'}
                          </span>
                        </div>
                        {/* Clone Trip Plan ボタン */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedPublicTrip(trip)
                          }}
                          className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 hover:border-indigo-300 transition-colors"
                        >
                          <Icon icon="mdi:content-copy" className="h-3.5 w-3.5" />
                          <span>Clone Trip Plan</span>
                        </button>
                      </div>
                    </button>
                  )
                })}
              </div>

              {selectedPublicTrip && (
                <div className="mt-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-indigo-900 mb-2">
                        選択中: {selectedPublicTrip.title}
                      </p>
                      <p className="text-xs text-indigo-700 mb-4">
                        このTripをベースに、新しいTripを作成します。日程や訪問先を参考にしながら、自分の旅行計画を立てることができます。
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          disabled
                          className="px-4 py-2 bg-indigo-500 text-white text-sm font-medium rounded-lg opacity-50 cursor-not-allowed"
                        >
                          次へ：Trip詳細を設定
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedPublicTrip(null)}
                          className="px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50"
                        >
                          選択を解除
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

        {/* 注意書き */}
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Icon icon="mdi:information-outline" className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-semibold mb-1">⚠️ ハリボテデモ</p>
              <p>このページは動作確認用のハリボテです。実際のTrip作成機能は未実装です。</p>
              <p className="mt-2">
                <strong>将来的な改善案：</strong> Public Tripカードに「Clone Trip Plan」ボタンを追加し、ワンクリックで複製できる体験を提供予定。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

