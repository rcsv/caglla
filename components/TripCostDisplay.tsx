'use client'

import { CostSummary, aggregateCostsByCurrency, formatMultipleCostSummaries } from '@/lib/cost-aggregation'
import { currencyUtils } from '@/lib/currency-utils'

interface TripCostDisplayProps {
  itineraries: any[]
  className?: string
}

export default function TripCostDisplay({ itineraries, className = '' }: TripCostDisplayProps) {
  const costSummary = aggregateCostsByCurrency(itineraries)
  
  if (!costSummary.hasCosts) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            旅行費用
          </h3>
        </div>
        <div className="text-center py-4">
          <div className="text-gray-500 mb-2">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-600 text-sm">
            費用情報が設定されたスケジュールがありません
          </p>
          <p className="text-gray-500 text-xs mt-2">
            各スケジュールに費用を設定すると、総費用が表示されます
          </p>
        </div>
      </div>
    )
  }
  
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
          旅行費用
        </h3>
      </div>
      
      <div className="space-y-2">
        {costSummary.totalCosts.map((cost) => (
          <div key={cost.currency} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-600 mr-2">
                {cost.currencyInfo.name}
              </span>
              <span className="text-xs text-gray-500">
                ({cost.count}件)
              </span>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-gray-900">
                {currencyUtils.formatAmount(cost.total, cost.currency)}
              </div>
            </div>
          </div>
        ))}
        
        {costSummary.totalCosts.length > 1 && (
          <div className="border-t border-gray-200 pt-3 mt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">合計</span>
              <span className="text-sm text-gray-500">
                {formatMultipleCostSummaries(costSummary.totalCosts)}
              </span>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          💡 各スケジュールの費用をクリックして編集できます
        </p>
      </div>
    </div>
  )
}
