// 旅行費用集計ユーティリティ

import { currencyUtils } from '@/lib/utils/currency'
import type { CostSummary, TripCostSummary, Itinerary } from '@/lib/core/types'

// Re-export types for backward compatibility
export type { CostSummary, TripCostSummary }

/**
 * Itinerariesの配列から通貨単位毎の費用を集計する
 */
export function aggregateCostsByCurrency(itineraries: Itinerary[]): TripCostSummary {
  const costMap = new Map<string, { total: number; count: number }>()
  
  // 各Itineraryの費用を集計
  itineraries.forEach(itinerary => {
    if (itinerary.cost_amount && itinerary.cost_amount > 0) {
      const currency = itinerary.cost_currency || 'JPY'
      const amount = itinerary.cost_amount
      
      if (costMap.has(currency)) {
        const existing = costMap.get(currency)!
        costMap.set(currency, {
          total: existing.total + amount,
          count: existing.count + 1
        })
      } else {
        costMap.set(currency, {
          total: amount,
          count: 1
        })
      }
    }
  })
  
  // 結果を配列に変換してソート
  const totalCosts: CostSummary[] = Array.from(costMap.entries()).map(([currency, data]) => ({
    currency,
    total: data.total,
    count: data.count,
    currencyInfo: currencyUtils.getCurrencyInfo(currency)
  })).sort((a, b) => {
    // JPYを最初に、その後はアルファベット順
    if (a.currency === 'JPY') return -1
    if (b.currency === 'JPY') return 1
    return a.currency.localeCompare(b.currency)
  })
  
  return {
    totalCosts,
    hasCosts: totalCosts.length > 0
  }
}

/**
 * 費用サマリーをフォーマットして表示用の文字列を生成
 */
export function formatCostSummary(costSummary: CostSummary): string {
  const formattedAmount = currencyUtils.formatAmount(costSummary.total, costSummary.currency)
  return `${formattedAmount} (${costSummary.count}件)`
}

/**
 * 複数の費用サマリーを結合して表示用の文字列を生成
 */
export function formatMultipleCostSummaries(costSummaries: CostSummary[]): string {
  if (costSummaries.length === 0) return '費用未設定'
  if (costSummaries.length === 1) return formatCostSummary(costSummaries[0])
  
  return costSummaries.map(formatCostSummary).join(' + ')
}
