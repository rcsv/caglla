'use client'

import React from 'react'
import { useSubscription } from '@/lib/subscription-context'
import { paymentHelpers } from '@/lib/dummy-payment-service'
import Link from 'next/link'

interface PlanInfoDisplayProps {
  className?: string
}

export default function PlanInfoDisplay({ className = '' }: PlanInfoDisplayProps) {
  const { subscriptionStatus, isLoading } = useSubscription()

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg border p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (!subscriptionStatus.plan) {
    return null
  }

  const plan = subscriptionStatus.plan
  const isFreePlan = plan.id === 'season_traveler'
  const isPaidPlan = subscriptionStatus.isSubscribed

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
              {paymentHelpers.formatPrice(plan.price, plan.currency)}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {subscriptionStatus.expiresAt && (
            <div className="text-right">
              <p className="text-xs text-gray-500">
                {isPaidPlan ? '有効期限' : 'トライアル期限'}
              </p>
              <p className="text-sm font-medium text-gray-900">
                {subscriptionStatus.expiresAt.toLocaleDateString('ja-JP')}
              </p>
            </div>
          )}
          
          <Link
            href="/subscription"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1 rounded-md hover:bg-blue-50 transition-colors"
          >
            プラン変更
          </Link>
        </div>
      </div>

      {/* プラン機能の簡易表示 */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-4 text-xs text-gray-600">
          <div className="flex items-center space-x-1">
            <span className={`w-2 h-2 rounded-full ${
              plan.limits.travelCount === -1 ? 'bg-green-400' : 'bg-gray-300'
            }`}></span>
            <span>旅行: {plan.limits.travelCount === -1 ? '無制限' : `${plan.limits.travelCount}件`}</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <span className={`w-2 h-2 rounded-full ${
              plan.limits.travelDays === -1 ? 'bg-green-400' : 'bg-gray-300'
            }`}></span>
            <span>日数: {plan.limits.travelDays === -1 ? '無制限' : `${plan.limits.travelDays}日`}</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <span className={`w-2 h-2 rounded-full ${
              plan.id === 'backpacker' || plan.id === 'globetrotter' ? 'bg-green-400' : 'bg-gray-300'
            }`}></span>
            <span>ルート最適化: {plan.id === 'backpacker' || plan.id === 'globetrotter' ? '利用可能' : '制限'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
