'use client'

import React, { useState } from 'react'
import DayEditor from '@/components/trip/DayEditor'
import { Day, Itinerary } from '@/lib/firestore'
import { SubscriptionProvider, useSubscription } from '@/lib/subscription-context'

function DailyRouteOptimizationContent() {
  const { subscriptionStatus } = useSubscription()
  const [days, setDays] = useState<Day[]>([
    {
      id: 'day-1',
      trip_id: 'trip-1',
      date: '2024-01-15',
      description: '東京観光1日目',
      order: 0,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 'day-2', 
      trip_id: 'trip-1',
      date: '2024-01-16',
      description: '東京観光2日目',
      order: 1,
      created_at: new Date(),
      updated_at: new Date()
    }
  ])

  const [itineraries, setItineraries] = useState<Itinerary[]>([
    {
      id: 'itinerary-1',
      trip_id: 'trip-1',
      day_id: 'day-1',
      place_id: 'place-1',
      place_data: {
        name: '東京駅',
        geometry: {
          location: { lat: 35.6812, lng: 139.7671 }
        }
      },
      start_time: '09:00',
      end_time: '10:00',
      order: 0,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 'itinerary-2',
      trip_id: 'trip-1',
      day_id: 'day-1',
      place_id: 'place-2',
      place_data: {
        name: '浅草寺',
        geometry: {
          location: { lat: 35.7148, lng: 139.7967 }
        }
      },
      start_time: '10:30',
      end_time: '12:00',
      order: 1,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 'itinerary-3',
      trip_id: 'trip-1',
      day_id: 'day-1',
      place_id: 'place-3',
      place_data: {
        name: '上野公園',
        geometry: {
          location: { lat: 35.7148, lng: 139.7756 }
        }
      },
      start_time: '13:00',
      end_time: '15:00',
      order: 2,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 'itinerary-4',
      trip_id: 'trip-1',
      day_id: 'day-1',
      place_id: 'place-4',
      place_data: {
        name: '東京スカイツリー',
        geometry: {
          location: { lat: 35.7101, lng: 139.8107 }
        }
      },
      start_time: '16:00',
      end_time: '18:00',
      order: 3,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 'itinerary-5',
      trip_id: 'trip-1',
      day_id: 'day-2',
      place_id: 'place-5',
      place_data: {
        name: '皇居',
        geometry: {
          location: { lat: 35.6852, lng: 139.7528 }
        }
      },
      start_time: '09:00',
      end_time: '11:00',
      order: 0,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 'itinerary-6',
      trip_id: 'trip-1',
      day_id: 'day-2',
      place_id: 'place-6',
      place_data: {
        name: '原宿',
        geometry: {
          location: { lat: 35.6702, lng: 139.7026 }
        }
      },
      start_time: '12:00',
      end_time: '14:00',
      order: 1,
      created_at: new Date(),
      updated_at: new Date()
    }
  ])

  const handleDayUpdate = (updatedDay: Day) => {
    setDays(prev => prev.map(day => 
      day.id === updatedDay.id ? updatedDay : day
    ))
  }

  const handleReorderItineraries = (dayId: string, reorderedItineraries: Itinerary[]) => {
    console.log('Reordering itineraries for day:', dayId, reorderedItineraries.map(it => ({ id: it.id, name: it.place_data?.name, order: it.order })))
    
    setItineraries(prev => {
      const otherItineraries = prev.filter(it => it.day_id !== dayId)
      const updatedReordered = reorderedItineraries.map((itinerary, index) => ({
        ...itinerary,
        order: index
      }))
      return [...otherItineraries, ...updatedReordered]
    })
  }

  const getDayItineraries = (dayId: string) => {
    return itineraries
      .filter(it => it.day_id === dayId)
      .sort((a, b) => a.order - b.order)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Day毎のルート最適化デモ
          </h1>
          <div className="text-right">
            <div className="text-sm text-gray-600">
              現在のプラン: <span className="font-semibold">{subscriptionStatus.plan?.name}</span>
            </div>
            {subscriptionStatus.isSubscribed && (
              <div className="text-xs text-green-600">
                ✓ Plus機能利用可能
              </div>
            )}
          </div>
        </div>
        
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-sm font-semibold text-yellow-800 mb-2">デバッグ情報</h3>
          <p className="text-sm text-yellow-700">
            ブラウザの開発者ツール（F12）のコンソールを開いて、詳細なログを確認してください。
            エラーが発生した場合は、コンソールに詳細な情報が表示されます。
          </p>
        </div>
        
        <div className="space-y-6">
          {days.map(day => {
            const dayItineraries = getDayItineraries(day.id)
            return (
              <div key={day.id} className="border border-gray-200 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-gray-700 mb-4">
                  {day.date} - {day.description}
                </h2>
                
                {/* 現在のitinerary順序 */}
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">
                    現在の訪問順序:
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {dayItineraries.map((itinerary, index) => (
                      <div key={itinerary.id} className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded text-sm">
                        <span className="bg-blue-200 text-blue-800 px-1 py-0.5 rounded text-xs font-semibold">
                          {index + 1}
                        </span>
                        <span>{itinerary.place_data?.name}</span>
                        <span className="text-xs text-gray-500">(order: {itinerary.order})</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* DayEditor with Route Optimization */}
                <DayEditor
                  day={day}
                  onUpdate={handleDayUpdate}
                  itineraries={dayItineraries}
                  onReorderItineraries={handleReorderItineraries}
                />
              </div>
            )
          })}
        </div>

        {/* 機能説明 */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-md font-semibold text-gray-700 mb-3">Day毎ルート最適化の機能</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• <strong>Day毎の最適化:</strong> 各日のitineraryを個別に最適化</li>
            <li>• <strong>自動順序変更:</strong> Googleの最適化アルゴリズムで訪問順序を自動調整</li>
            <li>• <strong>リアルタイム表示:</strong> 最適化結果を事前に確認可能</li>
            <li>• <strong>適用/キャンセル:</strong> 最適化結果を適用するかキャンセルするかを選択</li>
            <li>• <strong>コスト見積もり:</strong> API使用料金の事前見積もり</li>
            <li>• <strong>データベース同期:</strong> 最適化結果をデータベースに保存</li>
            <li>• <strong>Plus機能:</strong> Plusプラン契約者限定の高度な機能</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default function DailyRouteOptimizationDemo() {
  return (
    <SubscriptionProvider>
      <DailyRouteOptimizationContent />
    </SubscriptionProvider>
  )
}