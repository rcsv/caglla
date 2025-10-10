'use client'
import logger from '@/lib/logger'

import React, { useState } from 'react'
import { Itinerary } from '@/lib/firestore'
import { optimizeWaypoints, estimateRouteCost } from '@/lib/route-optimization'
import { applyOptimizedOrder } from '@/lib/itinerary-reorder'
import RouteOptimizationDisplay from './RouteOptimizationDisplay'
import PremiumButton from '@/components/ui/PremiumButton'

interface DailyRouteOptimizerProps {
  dayId: string
  itineraries: Itinerary[]
  onReorderItineraries: (dayId: string, reorderedItineraries: Itinerary[]) => void
  className?: string
}

export default function DailyRouteOptimizer({
  dayId,
  itineraries,
  onReorderItineraries,
  className = ''
}: DailyRouteOptimizerProps) {
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [optimizationResult, setOptimizationResult] = useState<any>(null)
  const [showOptimization, setShowOptimization] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 有効なitinerary（場所データがあるもの）をフィルタリング
  const validItineraries = itineraries.filter(
    itinerary => itinerary.place_data?.geometry?.location
  )

  const handleOptimize = async () => {
    if (validItineraries.length < 2) {
      setError('ルート最適化には2つ以上の場所が必要です')
      return
    }

    setIsOptimizing(true)
    setError(null)

    try {
      // 現在の順序でwaypointを作成
      const waypoints = validItineraries.map(itinerary => ({
        lat: itinerary.place_data!.geometry!.location.lat,
        lng: itinerary.place_data!.geometry!.location.lng,
      }))

      const origin = waypoints[0]
      const destination = waypoints[waypoints.length - 1]
      const middleWaypoints = waypoints.slice(1, -1)

      // ルート最適化を実行
      const result = await optimizeWaypoints(
        middleWaypoints,
        origin,
        destination,
        {
          travelMode: 'DRIVING'
        }
      )

      if (result) {
        setOptimizationResult(result)
        setShowOptimization(true)
      } else {
        setError('ルート最適化に失敗しました')
      }
    } catch (err) {
      logger.error('Route optimization error:', err)
      setError('ルート最適化中にエラーが発生しました')
    } finally {
      setIsOptimizing(false)
    }
  }

  const handleApplyOptimization = async () => {
    if (!optimizationResult) return

    try {
      logger.debug('Applying optimization:', {
        dayId,
        itineraries: itineraries.map(it => ({ id: it.id, name: it.place_data?.name })),
        optimizedOrder: optimizationResult.optimizedOrder
      })

      // サーバーに最適化された順序を適用
      await applyOptimizedOrder(dayId, itineraries, optimizationResult.optimizedOrder)
      
      // ローカルの状態も更新
      const reorderedItineraries = [...itineraries]
      const validIndices = validItineraries.map((_: Itinerary, index: number) => 
        itineraries.findIndex(it => it.id === validItineraries[index].id)
      )

      const newValidOrder = optimizationResult.optimizedOrder.map((index: number) => validItineraries[index])
      
      newValidOrder.forEach((itinerary: Itinerary, newIndex: number) => {
        const originalIndex = validIndices[optimizationResult.optimizedOrder[newIndex]]
        if (originalIndex !== -1) {
          reorderedItineraries[originalIndex] = itinerary
        }
      })

      onReorderItineraries(dayId, reorderedItineraries)
      setShowOptimization(false)
      setOptimizationResult(null)
    } catch (error) {
      logger.error('Error applying optimization:', error)
      // デモ環境では、サーバーエラーでもクライアントサイドの更新は実行
      if (error instanceof Error && (error.message.includes('server update skipped') || error.message.includes('Client-side reordering completed'))) {
        logger.debug('Server update skipped, applying client-side changes')
        // ローカルの状態を更新
        const reorderedItineraries = [...itineraries]
        const validIndices = validItineraries.map((_: Itinerary, index: number) => 
          itineraries.findIndex(it => it.id === validItineraries[index].id)
        )

        const newValidOrder = optimizationResult.optimizedOrder.map((index: number) => validItineraries[index])
        
        newValidOrder.forEach((itinerary: Itinerary, newIndex: number) => {
          const originalIndex = validIndices[optimizationResult.optimizedOrder[newIndex]]
          if (originalIndex !== -1) {
            reorderedItineraries[originalIndex] = itinerary
          }
        })

        onReorderItineraries(dayId, reorderedItineraries)
        setShowOptimization(false)
        setOptimizationResult(null)
      } else {
        setError(`最適化の適用に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }

  const handleCancelOptimization = () => {
    setShowOptimization(false)
    setOptimizationResult(null)
    setError(null)
  }

  if (validItineraries.length < 2) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        ルート最適化には2つ以上の場所が必要です
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 最適化ボタン */}
      <div className="flex items-center gap-3">
        <PremiumButton
          featureName="ルート最適化"
          onClick={handleOptimize}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isOptimizing ? '最適化中...' : 'ルート最適化'}
        </PremiumButton>
        
        <div className="text-sm text-gray-600">
          {validItineraries.length}箇所の最適ルートを計算
        </div>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg p-3">
          {error}
        </div>
      )}

      {/* 最適化結果 */}
      {showOptimization && optimizationResult && (
        <div className="space-y-4">
          <RouteOptimizationDisplay
            waypoints={validItineraries.map(itinerary => ({
              lat: itinerary.place_data!.geometry!.location.lat,
              lng: itinerary.place_data!.geometry!.location.lng,
            }))}
            origin={{
              lat: validItineraries[0].place_data!.geometry!.location.lat,
              lng: validItineraries[0].place_data!.geometry!.location.lng,
            }}
            destination={{
              lat: validItineraries[validItineraries.length - 1].place_data!.geometry!.location.lat,
              lng: validItineraries[validItineraries.length - 1].place_data!.geometry!.location.lng,
            }}
            travelMode="DRIVING"
            showComparison={false}
          />

          {/* 最適化された順序の表示 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-yellow-800 mb-2">
              最適化された訪問順序
            </h3>
            <div className="text-sm text-yellow-700">
              {optimizationResult.optimizedOrder.map((index: number, orderIndex: number) => {
                // インデックスが有効な範囲内かチェック
                if (index >= 0 && index < validItineraries.length) {
                  return (
                    <div key={index} className="flex items-center gap-2 mb-1">
                      <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-xs font-semibold">
                        {orderIndex + 1}
                      </span>
                      <span>{validItineraries[index].place_data?.name || '不明な場所'}</span>
                    </div>
                  )
                }
                return null
              })}
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex gap-3">
            <button
              onClick={handleApplyOptimization}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              この順序を適用
            </button>
            <button
              onClick={handleCancelOptimization}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
