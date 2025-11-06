// 旅行費用集計ユーティリティ

import { currencyUtils } from '@/lib/utils/currency'
import { toDateOrNull } from '@/lib/firebase/timestamp-utils'
import type { CostSummary, TripCostSummary, Itinerary, Day } from '@/lib/core/types'

// Re-export types for backward compatibility
export type { CostSummary, TripCostSummary }

/**
 * Individual cost item with itinerary details
 */
export interface CostItem {
  itineraryId: string
  itineraryTitle: string
  amount: number
  dayNumber?: number
  dayDate?: Date
  placeName?: string
  activityTag?: string
}

/**
 * Extended cost summary with detailed items
 */
export interface CostSummaryWithDetails extends CostSummary {
  items?: CostItem[]
}

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

/**
 * Aggregate costs by currency with detailed itinerary information
 * @param itineraries - List of itineraries with cost information
 * @param days - Optional list of days for date information
 * @returns Trip cost summary with detailed items
 */
export function aggregateCostsWithDetails(
  itineraries: Itinerary[],
  days?: Day[]
): TripCostSummary {
  const costMap = new Map<
    string,
    {
      total: number
      count: number
      items: CostItem[]
    }
  >()

  // Create a map of days for efficient lookup
  const daysMap = new Map<string, Day>()
  if (days) {
    days.forEach((day) => {
      if (day.id) {
        daysMap.set(day.id, day)
      }
    })
  }

  // Process each itinerary
  itineraries.forEach((itinerary) => {
    if (itinerary.cost_amount && itinerary.cost_amount > 0) {
      const currency = itinerary.cost_currency || 'JPY'
      const amount = itinerary.cost_amount

      // Get day information if available
      const day = itinerary.day_id ? daysMap.get(itinerary.day_id) : undefined

      // Create cost item with details
      const item: CostItem = {
        itineraryId: itinerary.id,
        itineraryTitle: itinerary.title || 'Untitled',
        amount,
        dayNumber: day?.day_number,
        dayDate: day?.date ? toDateOrNull(day.date) ?? undefined : undefined,
        placeName: itinerary.place_data?.name,
        activityTag: itinerary.activity_tag?.primary_category,
      }

      // Add to cost map
      if (costMap.has(currency)) {
        const existing = costMap.get(currency)!
        existing.total += amount
        existing.count += 1
        existing.items.push(item)
      } else {
        costMap.set(currency, {
          total: amount,
          count: 1,
          items: [item],
        })
      }
    }
  })

  // Convert to array and sort items by date
  const totalCosts: CostSummaryWithDetails[] = Array.from(costMap.entries())
    .map(([currency, data]) => ({
      currency,
      total: data.total,
      count: data.count,
      currencyInfo: currencyUtils.getCurrencyInfo(currency),
      items: data.items.sort((a, b) => {
        // Sort by date if available
        if (a.dayDate && b.dayDate) {
          return a.dayDate.getTime() - b.dayDate.getTime()
        }
        // If one has date and other doesn't, prioritize the one with date
        if (a.dayDate) return -1
        if (b.dayDate) return 1
        // If neither has date, maintain original order
        return 0
      }),
    }))
    .sort((a, b) => {
      // JPYを最初に、その後はアルファベット順
      if (a.currency === 'JPY') return -1
      if (b.currency === 'JPY') return 1
      return a.currency.localeCompare(b.currency)
    })

  return {
    totalCosts,
    hasCosts: totalCosts.length > 0,
  }
}
