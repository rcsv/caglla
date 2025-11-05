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
      // optimizeWaypointsから返されるfullOptimizedOrderの構造を理解:
      // - origin = waypoints[0] → fullOptimizedOrder[0] = 0
      // - middleWaypoints = waypoints.slice(1, -1) → fullOptimizedOrder[1..n-1] = waypoint_indices (1-based)
      // - destination = waypoints[waypoints.length - 1] → fullOptimizedOrder[n] = waypoints.length + 1
      
      // DailyRouteOptimizerでは:
      // - origin = validItineraries[0]
      // - middleWaypoints = validItineraries.slice(1, -1)
      // - destination = validItineraries[validItineraries.length - 1]
      
      const fullOptimizedOrder = optimizationResult.optimizedOrder
      
      logger.debug('Applying optimization:', {
        dayId,
        validItinerariesCount: validItineraries.length,
        fullOptimizedOrder,
        validItineraries: validItineraries.map((it, idx) => ({ 
          index: idx, 
          id: it.id, 
          name: it.place_data?.name 
        }))
      })

      // fullOptimizedOrderからmiddleWaypoints部分を抽出
      // fullOptimizedOrder = [0, ...middleWaypoint_indices, waypoints.length + 1]
      // middleWaypoint_indicesは1-based（origin=0, destination=waypoints.length+1を除く）
      const middleWaypointIndices = fullOptimizedOrder.filter(
        (index: number) => index > 0 && index <= validItineraries.length - 1
      )
      
      // middleWaypointIndicesをvalidItinerariesのインデックスに変換
      // fullOptimizedOrderのインデックスは1-basedなので、0-basedに変換
      const reorderedValidIndices = [
        0, // originは常に最初
        ...middleWaypointIndices.map((idx: number) => idx - 1), // 1-based → 0-based
        validItineraries.length - 1 // destinationは常に最後
      ]
      
      logger.debug('Reordered valid indices:', {
        middleWaypointIndices,
        reorderedValidIndices,
        reorderedValidItineraries: reorderedValidIndices.map(idx => ({
          index: idx,
          id: validItineraries[idx]?.id,
          name: validItineraries[idx]?.place_data?.name
        }))
      })
      
      // validItinerariesを最適化された順序で並び替え
      const reorderedValidItineraries = reorderedValidIndices.map(
        (idx: number) => validItineraries[idx]
      )
      
      // itineraryのIDの順序を取得
      const reorderedItineraryIds = reorderedValidItineraries.map(it => it.id)
      
      // サーバーに並び替えを送信
      const response = await fetch('/api/itineraries/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dayId,
          itineraryIds: reorderedItineraryIds
        }),
        signal: AbortSignal.timeout(10000)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Reorder API error: ${response.status}`)
      }

      const result = await response.json()
      logger.debug('Reorder result:', result)
      
      // ローカルの状態も更新
      // reorderedValidItinerariesの順序に基づいて、itineraries全体を並び替え
      // validItineraries以外の要素は元の位置を保持
      const finalReorderedItineraries: Itinerary[] = []
      const validItineraryIds = new Set(reorderedValidItineraries.map(it => it.id))
      
      // validItineraries以外の要素を元の順序で追加
      const nonValidItineraries = itineraries.filter(it => !validItineraryIds.has(it.id))
      
      // reorderedValidItinerariesの各要素を、元のvalidItinerariesの位置に配置
      let validIndex = 0
      for (let i = 0; i < itineraries.length; i++) {
        if (validItineraryIds.has(itineraries[i].id)) {
          // validItineraryの場合は、最適化された順序から取得
          finalReorderedItineraries.push(reorderedValidItineraries[validIndex])
          validIndex++
        } else {
          // validItinerary以外の場合は、元の位置を保持
          finalReorderedItineraries.push(itineraries[i])
        }
      }

      onReorderItineraries(dayId, finalReorderedItineraries)
      setShowOptimization(false)
      setOptimizationResult(null)
    } catch (error) {
      logger.error('Error applying optimization:', error)
      setError(`${t('trip.routeOptimization.applyFailed')}: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
