'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import TripCard from '@/components/common/TripCard'
import CreateTripDialog from '@/components/common/CreateTripDialog'
import type { Trip } from '@/lib/types'

interface MainContentProps {
  nextTrip?: Trip
  onTripCreated: () => void
}

export default function MainContent({ nextTrip, onTripCreated }: MainContentProps) {
  const router = useRouter()
  const [isCreateTripDialogOpen, setIsCreateTripDialogOpen] = useState(false)

  const handleTripCreated = () => {
    onTripCreated()
    setIsCreateTripDialogOpen(false)
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
          <button
            onClick={() => setIsCreateTripDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
          >
            {nextTrip ? '新しい旅行を作成' : '旅行を作成'}
          </button>
        </div>

        {/* コンテンツエリア */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 旅行カードまたは作成案内 */}
          <div className="min-h-[300px]">
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
                <button
                  onClick={() => setIsCreateTripDialogOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
                >
                  旅行を作成
                </button>
              </div>
            )}
          </div>

          {/* マップまたは追加情報 */}
          <div className="bg-gray-100 rounded-lg flex items-center justify-center min-h-[300px]">
            <div className="text-center">
              <div className="text-4xl mb-4">🗺️</div>
              <p className="text-gray-500 font-medium">旅行マップ</p>
              <p className="text-sm text-gray-400 mt-2">（実装予定）</p>
            </div>
          </div>
        </div>

        {/* 追加アクション */}
        {nextTrip && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                出発予定: {nextTrip.start_date ? new Date(nextTrip.start_date).toLocaleDateString('ja-JP') : '未設定'}
              </div>
              <button
                onClick={() => router.push(`/trip/${nextTrip.id}`)}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                詳細を見る →
              </button>
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
