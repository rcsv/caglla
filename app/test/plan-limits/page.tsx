'use client'
import logger from '@/lib/core/logger'

import React, { useState } from 'react'
import { SubscriptionProvider, useSubscription } from '@/lib/contexts/subscription'
import { UsageStats } from '@/lib/subscription/plan-limits'
import PlanLimitsDisplay from '@/components/ui/PlanLimitsDisplay'

function PlanLimitsTestContent() {
  const { subscriptionStatus, checkPlanLimits } = useSubscription()
  const [usage, setUsage] = useState<UsageStats>({
    travelCount: 2,
    totalTravelDays: 3,
    storageUsedGB: 0.03,
    photosPerTrip: 3
  })

  const handleUsageChange = (field: keyof UsageStats, value: number) => {
    setUsage(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const checks = checkPlanLimits(usage)

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            プラン制限テスト
          </h1>
          <p className="text-lg text-gray-600">
            プラン制限の動作確認とテスト
          </p>
        </div>

        {/* 現在のプラン情報 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            現在のプラン情報
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">プラン名</p>
              <p className="text-lg font-semibold text-gray-900">
                {subscriptionStatus.plan?.name || 'プラン未設定'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">価格</p>
              <p className="text-lg font-semibold text-gray-900">
                {subscriptionStatus.plan?.price === 0 ? '無料' : `¥${subscriptionStatus.plan?.price}/月`}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">ステータス</p>
              <p className="text-lg font-semibold text-gray-900">
                {subscriptionStatus.isSubscribed ? 'アクティブ' : '無料プラン'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">制限超過</p>
              <p className={`text-lg font-semibold ${
                checks.hasAnyLimitExceeded ? 'text-red-600' : 'text-green-600'
              }`}>
                {checks.hasAnyLimitExceeded ? 'あり' : 'なし'}
              </p>
            </div>
          </div>
        </div>

        {/* 使用量調整 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            使用量の調整（テスト用）
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                旅行データ数
              </label>
              <input
                type="number"
                min="0"
                max="20"
                value={usage.travelCount}
                onChange={(e) => handleUsageChange('travelCount', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                旅行日数
              </label>
              <input
                type="number"
                min="0"
                max="30"
                value={usage.totalTravelDays}
                onChange={(e) => handleUsageChange('totalTravelDays', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ストレージ使用量 (GB)
              </label>
              <input
                type="number"
                min="0"
                max="10"
                step="0.01"
                value={usage.storageUsedGB}
                onChange={(e) => handleUsageChange('storageUsedGB', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                写真アップロード数/旅行
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={usage.photosPerTrip}
                onChange={(e) => handleUsageChange('photosPerTrip', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 制限状況表示 */}
        <PlanLimitsDisplay
          plan={subscriptionStatus.plan!}
          usage={usage}
        />

        {/* 詳細な制限チェック結果 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            詳細な制限チェック結果
          </h2>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">旅行データ数</h3>
              <p className="text-sm text-gray-600">
                現在: {checks.travelCount.currentUsage}件 / 
                制限: {checks.travelCount.limit === -1 ? '無制限' : `${checks.travelCount.limit}件`}
              </p>
              <p className={`text-sm font-medium ${
                checks.travelCount.isAllowed ? 'text-green-600' : 'text-red-600'
              }`}>
                {checks.travelCount.isAllowed ? '✅ 利用可能' : '❌ 制限超過'}
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">旅行日数</h3>
              <p className="text-sm text-gray-600">
                現在: {checks.travelDays.currentUsage}日 / 
                制限: {checks.travelDays.limit === -1 ? '無制限' : `${checks.travelDays.limit}日`}
              </p>
              <p className={`text-sm font-medium ${
                checks.travelDays.isAllowed ? 'text-green-600' : 'text-red-600'
              }`}>
                {checks.travelDays.isAllowed ? '✅ 利用可能' : '❌ 制限超過'}
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">ストレージ容量</h3>
              <p className="text-sm text-gray-600">
                現在: {checks.storage.currentUsage.toFixed(2)}GB / 
                制限: {checks.storage.limit === -1 ? '無制限' : `${checks.storage.limit}GB`}
              </p>
              <p className={`text-sm font-medium ${
                checks.storage.isAllowed ? 'text-green-600' : 'text-red-600'
              }`}>
                {checks.storage.isAllowed ? '✅ 利用可能' : '❌ 制限超過'}
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">写真アップロード数</h3>
              <p className="text-sm text-gray-600">
                現在: {checks.photos.currentUsage}枚 / 
                制限: {checks.photos.limit === -1 ? '無制限' : `${checks.photos.limit}枚`}
              </p>
              <p className={`text-sm font-medium ${
                checks.photos.isAllowed ? 'text-green-600' : 'text-red-600'
              }`}>
                {checks.photos.isAllowed ? '✅ 利用可能' : '❌ 制限超過'}
              </p>
            </div>
          </div>
        </div>

        {/* プラン変更リンク */}
        <div className="text-center mt-8">
          <a
            href="/subscription"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            プランを変更する
          </a>
        </div>
      </div>
    </div>
  )
}

export default function PlanLimitsTestPage() {
  return (
    <SubscriptionProvider>
      <PlanLimitsTestContent />
    </SubscriptionProvider>
  )
}
