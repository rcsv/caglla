'use client'
import logger from '@/lib/core/logger'

import React, { useState } from 'react'
import { Itinerary } from '@/lib/core/types'
import { optimizeWaypoints, estimateRouteCost } from '@/lib/travel/route-optimization'
import { applyOptimizedOrder } from '@/lib/travel/itinerary-reorder'
import RouteOptimizationDisplay from './RouteOptimizationDisplay'
import PremiumButton from '@/components/ui/PremiumButton'
import { t } from '@/lib/i18n'

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
      setError(t('trip.routeOptimization.needTwoOrMore'))
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
        setError(t('trip.routeOptimization.failed'))
      }
    } catch (err) {
      logger.error('Route optimization error:', err)
      setError(t('trip.routeOptimization.error'))
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
        setError(`${t('trip.routeOptimization.applyFailed')}: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
        {t('trip.routeOptimization.needTwoOrMore')}
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 最適化ボタン */}
      <div className="flex items-center gap-3">
        <PremiumButton
          featureName={t('trip.routeOptimization.title')}
          onClick={handleOptimize}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isOptimizing ? t('trip.routeOptimization.optimizing') : t('trip.routeOptimization.button')}
        </PremiumButton>
        
        <div className="text-sm text-gray-600">
          {t('trip.routeOptimization.calculatePlaces').replace('{count}', String(validItineraries.length))}
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
              {t('trip.routeOptimization.optimizedOrder')}
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
                      <span>{validItineraries[index].place_data?.name || t('routeOptimizer.unknownPlace')}</span>
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
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              {t('trip.routeOptimization.apply')}
            </button>
            <button
              onClick={handleCancelOptimization}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              {t('trip.routeOptimization.cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
