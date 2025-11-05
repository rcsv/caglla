import logger from '@/lib/core/logger'
import { t } from '@/lib/i18n'
import React, { useState, useEffect } from 'react'
import { estimateRouteCost, getCostOptimizationSuggestions } from '@/lib/travel/route-optimization'

interface RouteCostEstimatorProps {
  waypointCount: number
  className?: string
  showSuggestions?: boolean
}

export default function RouteCostEstimator({ 
  waypointCount, 
  className = '',
  showSuggestions = true 
}: RouteCostEstimatorProps) {
  const [costEstimate, setCostEstimate] = useState<{
    waypointCount: number
    requestsNeeded: number
    estimatedCost: number
    currency: string
    suggestions: string[]
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCostEstimate = async () => {
      if (waypointCount < 2) {
        setCostEstimate(null)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const estimate = await estimateRouteCost(waypointCount)
        setCostEstimate(estimate)
      } catch (err) {
        logger.error('Error fetching cost estimate:', err)
        setError(t('routeCost.failed'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchCostEstimate()
  }, [waypointCount])

  if (waypointCount < 2) {
    return null
  }

  if (isLoading) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        コスト見積もりを計算中...
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

  if (!costEstimate) {
    return null
  }

  return (
    <div className={`text-sm text-gray-600 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="font-medium">ルート最適化コスト:</span>
        <span className="text-blue-600 font-semibold">
          ${costEstimate.estimatedCost.toFixed(3)} {costEstimate.currency}
        </span>
      </div>
      
      <div className="text-xs text-gray-500 mb-2">
        {costEstimate.waypointCount}地点 → {costEstimate.requestsNeeded}回のAPI呼び出し
      </div>

      {showSuggestions && costEstimate.suggestions.length > 0 && (
        <div className="mt-2">
          <div className="text-xs font-medium text-gray-700 mb-1">{t('routeCost.suggestion')}</div>
          <ul className="text-xs text-gray-600 space-y-1">
            {costEstimate.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-1">
                <span className="text-yellow-500 mt-0.5">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
