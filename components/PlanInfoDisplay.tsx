'use client'

import React from 'react'
import { useUserData } from '@/lib/user-data-context'
import { 
  RestrictionProvider, 
  RestrictionType, 
  PLAN_CONFIGS,
  formatLimit
} from '@/lib/restriction-system'
import Link from 'next/link'

interface PlanInfoDisplayProps {
  className?: string
}

export default function PlanInfoDisplay({ className = '' }: PlanInfoDisplayProps) {
  const { userPlanId, planLoading, planError } = useUserData()

  if (planLoading) {
    return (
      <div className={`bg-white rounded-lg border p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (planError) {
    return (
      <div className={`bg-white rounded-lg border p-4 ${className}`}>
        <div className="text-center text-red-600 text-sm">
          {planError}
        </div>
      </div>
    )
  }

  if (!userPlanId) {
    return (
      <div className={`bg-white rounded-lg border p-4 ${className}`}>
        <div className="text-center text-gray-500 text-sm">
          プラン情報が取得できませんでした
        </div>
      </div>
    )
  }

  const plan = PLAN_CONFIGS[userPlanId]
  const isFreePlan = userPlanId === 'season_traveler'
  const isPaidPlan = userPlanId !== 'season_traveler'

  return (
    <div className={`bg-white rounded-lg border p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            isFreePlan 
              ? 'bg-gray-100 text-gray-800' 
              : isPaidPlan
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
          }`}>
            {isFreePlan ? '無料プラン' : isPaidPlan ? '有料プラン' : 'プラン未設定'}
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {plan.name}
            </h3>
            <p className="text-sm text-gray-600">
              {plan.price === 0 ? '無料' : `¥${plan.price.toLocaleString()}/${plan.interval}`}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            href="/subscription"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1 rounded-md hover:bg-blue-50 transition-colors"
          >
            プラン変更
          </Link>
        </div>
      </div>

      {/* プラン機能の詳細表示 */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="space-y-2">
          {/* 制限値の表示 */}
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
            <div className="flex items-center space-x-1">
              <span className={`w-2 h-2 rounded-full ${
                plan.limits[RestrictionType.MAX_TRIPS] === -1 ? 'bg-green-400' : 'bg-gray-300'
              }`}></span>
              <span>旅行: {formatLimit(plan.limits[RestrictionType.MAX_TRIPS], RestrictionType.MAX_TRIPS)}</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <span className={`w-2 h-2 rounded-full ${
                plan.limits[RestrictionType.MAX_PRIVATE_TRIPS] === -1 ? 'bg-green-400' : 'bg-gray-300'
              }`}></span>
              <span>プライベート: {formatLimit(plan.limits[RestrictionType.MAX_PRIVATE_TRIPS], RestrictionType.MAX_PRIVATE_TRIPS)}</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <span className={`w-2 h-2 rounded-full ${
                plan.limits[RestrictionType.MAX_TRAVEL_DAYS] === -1 ? 'bg-green-400' : 'bg-gray-300'
              }`}></span>
              <span>日数: {formatLimit(plan.limits[RestrictionType.MAX_TRAVEL_DAYS], RestrictionType.MAX_TRAVEL_DAYS)}</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <span className={`w-2 h-2 rounded-full ${
                plan.limits[RestrictionType.MAX_STORAGE_GB] === -1 ? 'bg-green-400' : 'bg-gray-300'
              }`}></span>
              <span>ストレージ: {formatLimit(plan.limits[RestrictionType.MAX_STORAGE_GB], RestrictionType.MAX_STORAGE_GB)}</span>
            </div>
          </div>

          {/* 機能の表示 */}
          <div className="flex items-center space-x-4 text-xs text-gray-600">
            <div className="flex items-center space-x-1">
              <span className={`w-2 h-2 rounded-full ${
                RestrictionProvider.hasFeature(userPlanId, RestrictionType.AI_SUPPORT) ? 'bg-green-400' : 'bg-gray-300'
              }`}></span>
              <span>AIサポート: {RestrictionProvider.hasFeature(userPlanId, RestrictionType.AI_SUPPORT) ? '利用可能' : '制限'}</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <span className={`w-2 h-2 rounded-full ${
                RestrictionProvider.hasFeature(userPlanId, RestrictionType.ROUTE_OPTIMIZATION) ? 'bg-green-400' : 'bg-gray-300'
              }`}></span>
              <span>ルート最適化: {RestrictionProvider.hasFeature(userPlanId, RestrictionType.ROUTE_OPTIMIZATION) ? '利用可能' : '制限'}</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <span className={`w-2 h-2 rounded-full ${
                RestrictionProvider.hasFeature(userPlanId, RestrictionType.OUTLOOK_INTEGRATION) ? 'bg-green-400' : 'bg-gray-300'
              }`}></span>
              <span>Outlook統合: {RestrictionProvider.hasFeature(userPlanId, RestrictionType.OUTLOOK_INTEGRATION) ? '利用可能' : '制限'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
