import logger from '@/lib/core/logger'
import { t } from '@/lib/i18n'
import React, { useState, useEffect } from 'react'
import { optimizeWaypoints, compareRouteOptions, RouteOptimizationRequest } from '@/lib/travel/route-optimization'

interface RouteOptimizationResult {
  optimizedWaypoints: Array<string | { lat: number; lng: number }>
  optimizedOrder: number[]
  totalDistance: { meters: number; text: string }
  totalDuration: { seconds: number; text: string }
  costEstimate: { apiCalls: number; estimatedCost: number; currency: string }
}

interface RouteOptimizationDisplayProps {
  waypoints: Array<string | { lat: number; lng: number }>
  origin: string | { lat: number; lng: number }
  destination: string | { lat: number; lng: number }
  travelMode?: 'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT'
  avoidHighways?: boolean
  avoidTolls?: boolean
  avoidFerries?: boolean
  showComparison?: boolean
  className?: string
  onOptimizationComplete?: (result: RouteOptimizationResult) => void
}

export default function RouteOptimizationDisplay({
  waypoints,
  origin,
  destination,
  travelMode = 'DRIVING',
  avoidHighways = false,
  avoidTolls = false,
  avoidFerries = false,
  showComparison = false,
  className = '',
  onOptimizationComplete
}: RouteOptimizationDisplayProps) {
  const [optimizationResult, setOptimizationResult] = useState<RouteOptimizationResult | null>(null)
  const [comparisonResult, setComparisonResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const performOptimization = async () => {
      if (waypoints.length < 2) {
        setOptimizationResult(null)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        // 基本の最適化
        const result = await optimizeWaypoints(waypoints, origin, destination, {
          travelMode,
          avoidHighways,
          avoidTolls,
          avoidFerries
        })

        if (result) {
          setOptimizationResult(result)
          onOptimizationComplete?.(result)
        }

        // 比較機能が有効な場合
        if (showComparison) {
          const comparison = await compareRouteOptions(waypoints, origin, destination)
          if (comparison) {
            setComparisonResult(comparison)
          }
        }
      } catch (err) {
        logger.error('Route optimization error:', err)
        setError(t('routeOptimization.failed'))
      } finally {
        setIsLoading(false)
      }
    }

    performOptimization()
  }, [waypoints, origin, destination, travelMode, avoidHighways, avoidTolls, avoidFerries, showComparison, onOptimizationComplete])

  if (waypoints.length < 2) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        ルート最適化には2つ以上の地点が必要です
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        ルート最適化を実行中...
      </div>
    )
  }

  if (error) {
    return (
      <div className={`text-sm text-red-500 ${className}`}>
        {error}
      </div>
    )
  }

  if (!optimizationResult) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        ルート最適化の結果がありません
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 最適化結果 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-800 mb-3">{t('routeOptimization.optimizedRoute')}</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <div className="text-xs text-gray-600">総距離</div>
            <div className="text-sm font-semibold text-blue-700">
              {optimizationResult.totalDistance.text}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-600">総時間</div>
            <div className="text-sm font-semibold text-blue-700">
              {optimizationResult.totalDuration.text}
            </div>
          </div>
        </div>

        <div className="text-xs text-gray-600 mb-2">
          最適化された順序: {optimizationResult.optimizedOrder.join(' → ')}
        </div>

        <div className="text-xs text-gray-500">
          APIコスト: ${optimizationResult.costEstimate.estimatedCost.toFixed(3)} {optimizationResult.costEstimate.currency}
        </div>
      </div>

      {/* ルート比較結果 */}
      {showComparison && comparisonResult && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-green-800 mb-3">ルート比較結果</h3>
          
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="text-center">
              <div className="text-xs text-gray-600">最速ルート</div>
              <div className="text-sm font-semibold text-green-700">
                {comparisonResult.fastestRoute.totalDuration.text}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600">最短ルート</div>
              <div className="text-sm font-semibold text-green-700">
                {comparisonResult.shortestRoute.totalDistance.text}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600">最安ルート</div>
              <div className="text-sm font-semibold text-green-700">
                ${comparisonResult.cheapestRoute.costEstimate.estimatedCost.toFixed(3)}
              </div>
            </div>
          </div>

          {comparisonResult.recommendations.length > 0 && (
            <div className="mt-3">
              <div className="text-xs font-medium text-green-700 mb-1">推奨事項:</div>
              <ul className="text-xs text-green-600 space-y-1">
                {comparisonResult.recommendations.map((recommendation: string, index: number) => (
                  <li key={index} className="flex items-start gap-1">
                    <span className="text-green-500 mt-0.5">•</span>
                    <span>{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
