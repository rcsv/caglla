'use client'

import { Trip, ActivityStats, PrimaryCategoryType } from '@/lib/core/types'
import { getPrimaryCategoryShortLabel, getSecondaryCategoryLabel } from '@/lib/data/activity-categories'
import { ChartIcon } from '@/components/common/icons/ChartIcon'

interface ActivityStatsDisplayProps {
  trip: Trip
}

/**
 * アクティビティ統計を計算
 */
function calculateActivityStats(trip: Trip): ActivityStats {
  const primaryCounts = new Map<PrimaryCategoryType, number>()
  const secondaryCounts = new Map<string, { primary: PrimaryCategoryType; count: number }>()
  let totalActivities = 0
  
  // 全Itineraryを収集
  trip.days?.forEach(day => {
    day.itineraries?.forEach(itinerary => {
      if (itinerary.activity_tag) {
        totalActivities++
        
        // Primary Categoryのカウント
        const primary = itinerary.activity_tag.primaryCategory
        primaryCounts.set(primary, (primaryCounts.get(primary) || 0) + 1)
        
        // Secondary Categoryのカウント
        const secondary = itinerary.activity_tag.secondaryCategory
        const key = `${primary}:${secondary}`
        if (!secondaryCounts.has(key)) {
          secondaryCounts.set(key, { primary, count: 0 })
        }
        secondaryCounts.set(key, { 
          primary, 
          count: secondaryCounts.get(key)!.count + 1 
        })
      }
    })
  })
  
  // パーセンテージ計算
  const primaryCategories: ActivityStats['primaryCategories'] = {}
  primaryCounts.forEach((count, category) => {
    primaryCategories[category] = {
      count,
      percentage: totalActivities > 0 ? Math.round((count / totalActivities) * 100) : 0
    }
  })
  
  // Secondary Categoryのマップ作成
  const secondaryCategories: { [key: string]: number } = {}
  secondaryCounts.forEach((value, key) => {
    secondaryCategories[key] = value.count
  })
  
  return {
    primaryCategories,
    secondaryCategories,
    totalActivities
  }
}

/**
 * プログレスバーの色を取得
 */
function getProgressColor(index: number): string {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-orange-500',
    'bg-cyan-500',
  ]
  return colors[index % colors.length]
}

export default function ActivityStatsDisplay({ trip }: ActivityStatsDisplayProps) {
  const stats = calculateActivityStats(trip)
  
  if (stats.totalActivities === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-700 mb-4 flex items-center gap-2">
          <ChartIcon className="w-5 h-5" color="#6b7280" />
          Activity Analysis
        </h3>
        <p className="text-gray-500 text-center py-8">
          アクティビティタグが設定されていません。<br />
          旅程にアクティビティタグを追加すると、ここに統計が表示されます。
        </p>
      </div>
    )
  }
  
  // Primary Categoryを割合順にソート
  const sortedPrimaryCategories = Object.entries(stats.primaryCategories)
    .sort((a, b) => b[1].count - a[1].count)
  
  // Secondary Categoryを回数順にソート（上位5件のみ）
  const sortedSecondaryCategories = Object.entries(stats.secondaryCategories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-700 mb-4 flex items-center gap-2">
        <ChartIcon className="w-5 h-5" color="#6b7280" />
        Activity Analysis
      </h3>
      
      {/* 全体サマリー */}
      <div className="mb-6 text-center">
        <p className="text-2xl font-bold text-gray-800">{stats.totalActivities}</p>
        <p className="text-sm text-gray-500">アクティビティ総数</p>
      </div>
      
      {/* Primary Category別の統計 */}
      <div className="space-y-3 mb-6">
        <h4 className="text-sm font-medium text-gray-600">カテゴリー別分布</h4>
        {sortedPrimaryCategories.map(([category, data], index) => (
          <div key={category} className="space-y-1">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-700">
                {getPrimaryCategoryShortLabel(category as PrimaryCategoryType)}
              </span>
              <span className="text-gray-600 font-medium">
                {data.percentage}% ({data.count}回)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${getProgressColor(index)}`}
                style={{ width: `${data.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      
      {/* Secondary Category別の詳細（上位5件） */}
      <div className="space-y-2 border-t border-gray-200 pt-4">
        <h4 className="text-sm font-medium text-gray-600 mb-3">詳細アクティビティ Top 5</h4>
        {sortedSecondaryCategories.map(([key, count]) => {
          const [primary, secondary] = key.split(':')
          return (
            <div key={key} className="flex justify-between items-center text-sm">
              <span className="text-gray-600">
                {getSecondaryCategoryLabel(primary as PrimaryCategoryType, secondary)}
              </span>
              <span className="text-gray-800 font-medium">{count}回</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

