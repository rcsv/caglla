'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import TripCard from '@/components/tripcard/TripCard'
import CreateTripDialog from '@/components/common/CreateTripDialog'
import { Button } from '@/components/common/Button'
import NextTripMap from './NextTripMap'
import { useSubscription } from '@/lib/subscription-context'
import { RestrictionType } from '@/lib/restriction-system'
import { makeAuthenticatedRequest } from '@/lib/api-helpers'
import type { Trip } from '@/lib/types'

interface NextTripCardProps {
  nextTrip?: Trip
  onTripCreated: () => void
}

export default function NextTripCard({ nextTrip, onTripCreated }: NextTripCardProps) {
  const router = useRouter()
  const { can, getRemaining, getLimitExceededMessage } = useSubscription()
  const [isCreateTripDialogOpen, setIsCreateTripDialogOpen] = useState(false)
  const [currentTripCount, setCurrentTripCount] = useState(0)
  const [isLoadingLimits, setIsLoadingLimits] = useState(true)

  // 現在の旅行数を取得
  useEffect(() => {
    const fetchTripCount = async () => {
      setIsLoadingLimits(true)
      try {
        const response = await makeAuthenticatedRequest('/api/trips', {
          method: 'GET'
        })
        
        if (response.ok) {
          const trips = await response.json()
          const tripsArray = Array.isArray(trips) ? trips : trips.trips || []
          setCurrentTripCount(tripsArray.length)
        } else {
          setCurrentTripCount(0)
        }
      } catch (error) {
        console.error('Error fetching trip count:', error)
        setCurrentTripCount(0)
      } finally {
        setIsLoadingLimits(false)
      }
    }

    fetchTripCount()
  }, [])

  // 旅行作成が可能かチェック
  const canCreateTrip = can(RestrictionType.MAX_TRIPS, currentTripCount + 1)
  const remainingTrips = getRemaining(RestrictionType.MAX_TRIPS, currentTripCount)
  const limitExceededMessage = getLimitExceededMessage(RestrictionType.MAX_TRIPS, currentTripCount + 1)

  const handleTripCreated = () => {
    onTripCreated()
    setIsCreateTripDialogOpen(false)
    // 旅行作成後に旅行数を更新
    setCurrentTripCount(prev => prev + 1)
  }

  const handleCreateTripClick = () => {
    if (!canCreateTrip) {
      alert(limitExceededMessage)
      return
    }
    setIsCreateTripDialogOpen(true)
  }

  return (
    <>
      {/* メインコンテンツエリア */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {nextTrip ? '次の旅行プラン' : '新しい旅行を作成'}
            </h2>
            <p className="text-gray-600">
              {nextTrip 
                ? 'あなたの次の冒険を確認しましょう' 
                : '素晴らしい冒険の計画を始めましょう'
              }
            </p>
          </div>
          <Button
            variant="primary"
            onClick={handleCreateTripClick}
            disabled={!canCreateTrip || isLoadingLimits}
          >
            {isLoadingLimits 
              ? '読み込み中...' 
              : nextTrip ? '新しい旅行を作成' : '旅行を作成'
            }
          </Button>
        </div>

        {/* コンテンツエリア - 6:4の比率に変更 */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* 旅行カードまたは作成案内 - 6/10の幅 */}
          <div className="md:col-span-3 min-h-[300px]">
            {nextTrip ? (
              <TripCard trip={nextTrip} variant="imageFull" />
            ) : (
              <div className="h-full bg-gray-50 rounded-lg flex flex-col items-center justify-center p-8">
                <div className="text-6xl mb-4">✈️</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">まだ旅行がありません</h3>
                <p className="text-gray-600 text-center mb-6">
                  最初の旅行を作成して、<br />
                  素晴らしい冒険を始めましょう！
                </p>
                <Button
                  variant="primary"
                  onClick={handleCreateTripClick}
                  disabled={!canCreateTrip || isLoadingLimits}
                >
                  {isLoadingLimits ? '読み込み中...' : '旅行を作成'}
                </Button>
              </div>
            )}
          </div>

          {/* マップエリア - 4/10の幅 */}
          <div className="md:col-span-2 min-h-[300px]">
            {nextTrip ? (
              <NextTripMap trip={nextTrip} />
            ) : (
              <div className="bg-gray-100 rounded-lg flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-4xl mb-4">🗺️</div>
                  <p className="text-gray-500 font-medium">旅行マップ</p>
                  <p className="text-sm text-gray-400 mt-2">旅行を作成すると地図が表示されます</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* プラン制限情報 */}
        {!isLoadingLimits && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                旅行数: {currentTripCount}件
                {remainingTrips !== -1 && (
                  <span className="ml-2 text-gray-500">
                    (残り{remainingTrips}件まで作成可能)
                  </span>
                )}
                {remainingTrips === -1 && (
                  <span className="ml-2 text-green-600 font-medium">
                    (無制限)
                  </span>
                )}
              </div>
              {!canCreateTrip && (
                <div className="text-sm text-red-600 font-medium">
                  制限に達しています
                </div>
              )}
            </div>
          </div>
        )}

        {/* 追加アクション */}
        {nextTrip && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                出発予定: {nextTrip.start_date ? new Date(nextTrip.start_date).toLocaleDateString('ja-JP') : '未設定'}
              </div>
              <Button
                variant="secondary"
                onClick={() => router.push(`/trip/${nextTrip.id}`)}
              >
                詳細を見る
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 旅行作成ダイアログ */}
      <CreateTripDialog
        isOpen={isCreateTripDialogOpen}
        onClose={() => setIsCreateTripDialogOpen(false)}
        onSuccess={handleTripCreated}
      />
    </>
  )
}
