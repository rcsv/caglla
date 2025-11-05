'use client'

import React from 'react'
import { t } from '@/lib/i18n'
import { SubscriptionPlan } from '@/lib/subscription/payment-service'
import { UsageStats } from '@/lib/subscription/plan-limits'
import { PlanLimitChecker, LimitCheckResult, planLimitHelpers } from '@/lib/subscription/plan-limits'
import { IconRenderer } from '@/components/common/icons/IconRenderer'

interface PlanLimitsDisplayProps {
  plan: SubscriptionPlan
  usage: UsageStats
  className?: string
}

interface LimitBarProps {
  label: string
  checkResult: LimitCheckResult
  className?: string
}

function LimitBar({ label, checkResult, className = '' }: LimitBarProps) {
  const percentage = planLimitHelpers.calculateUsagePercentage(
    checkResult.currentUsage,
    checkResult.limit
  )
  const barColor = planLimitHelpers.getProgressBarColor(percentage)
  const textColor = planLimitHelpers.getUsageColor(percentage)

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className={`text-sm font-semibold ${textColor}`}>
          {checkResult.currentUsage}
          {checkResult.limit !== -1 && `/${checkResult.limit}`}
          {checkResult.limit === -1 && ' (無制限)'}
        </span>
      </div>
      
      {checkResult.limit !== -1 && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${barColor}`}
            style={{ width: `${Math.min(100, percentage)}%` }}
          />
        </div>
      )}
      
      <p className="text-xs text-gray-500">
        {checkResult.message}
      </p>
    </div>
  )
}

export default function PlanLimitsDisplay({ 
  plan, 
  usage, 
  className = '' 
}: PlanLimitsDisplayProps) {
  const checks = PlanLimitChecker.checkAllLimits(plan, usage)
  const hasAnyLimitExceeded = checks.hasAnyLimitExceeded
  const upgradeMessage = PlanLimitChecker.generateUpgradeMessage(plan, usage)

  return (
    <div className={`bg-white rounded-lg border p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          プラン制限状況
        </h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          hasAnyLimitExceeded 
            ? 'bg-red-100 text-red-800' 
            : 'bg-green-100 text-green-800'
        }`}>
          {hasAnyLimitExceeded ? '制限超過' : '正常'}
        </span>
      </div>

      <div className="space-y-4">
        <LimitBar
          label="旅行データ数"
          checkResult={checks.travelCount}
        />
        
        <LimitBar
          label="旅行日数"
          checkResult={checks.travelDays}
        />
        
        <LimitBar
          label="ストレージ容量"
          checkResult={checks.storage}
        />
        
        <LimitBar
          label="写真アップロード数"
          checkResult={checks.photos}
        />
      </div>

      {hasAnyLimitExceeded && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800 font-medium flex items-center gap-2">
            <IconRenderer iconName="warning" className="w-4 h-4" color="#dc2626" />
            制限を超過しています
          </p>
          <p className="text-xs text-red-600 mt-1">
            {PlanLimitChecker.generateLimitExceededMessage(plan, usage)}
          </p>
        </div>
      )}

      {upgradeMessage && !hasAnyLimitExceeded && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 font-medium">
            💡 アップグレード推奨
          </p>
          <p className="text-xs text-yellow-600 mt-1">
            {upgradeMessage}
          </p>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">{t('planLimits.currentPlan')}</span>
          <span className="text-sm font-semibold text-gray-900">
            {plan.name}
          </span>
        </div>
      </div>
    </div>
  )
}

/**
 * 制限チェック用のフック
 */
export function usePlanLimits(plan: SubscriptionPlan, usage: UsageStats) {
  const checks = PlanLimitChecker.checkAllLimits(plan, usage)
  const hasAnyLimitExceeded = checks.hasAnyLimitExceeded
  const upgradeMessage = PlanLimitChecker.generateUpgradeMessage(plan, usage)
  const limitExceededMessage = PlanLimitChecker.generateLimitExceededMessage(plan, usage)

  return {
    checks,
    hasAnyLimitExceeded,
    upgradeMessage,
    limitExceededMessage,
    canCreateTravel: checks.travelCount.isAllowed,
    canAddTravelDays: checks.travelDays.isAllowed,
    canUploadFiles: checks.storage.isAllowed,
    canUploadPhotos: checks.photos.isAllowed
  }
}
