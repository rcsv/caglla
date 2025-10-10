'use client'
import logger from '@/lib/logger'

import React, { useState } from 'react'
import { useSubscription } from '@/lib/subscription-context'
import { useRouter } from 'next/navigation'

interface PremiumButtonProps {
  featureName: string
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export default function PremiumButton({
  featureName,
  children,
  className = '',
  onClick
}: PremiumButtonProps) {
  const { subscriptionStatus, useRouteOptimization } = useSubscription()
  const router = useRouter()
  const [isHovered, setIsHovered] = useState(false)

  const canUseFeature = useRouteOptimization()

  // デバッグ用ログ
  logger.debug('PremiumButton Debug:', {
    featureName,
    canUseFeature,
    isSubscribed: subscriptionStatus.isSubscribed,
    planId: subscriptionStatus.plan?.id,
    planName: subscriptionStatus.plan?.name
  })

  const handleClick = () => {
    if (canUseFeature && onClick) {
      onClick()
    } else {
      // プラン変更ページに遷移（現在のページをreturnToパラメータとして渡す）
      const currentPath = window.location.pathname
      router.push(`/subscription?returnTo=${encodeURIComponent(currentPath)}`)
    }
  }

  if (canUseFeature) {
    return (
      <button
        onClick={onClick}
        className={className}
      >
        {children}
      </button>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`${className} relative overflow-hidden`}
      >
        {children}
        
        {/* Plusプラン記号 */}
        <span className="absolute -top-1 -right-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full shadow-lg">
          +
        </span>
      </button>

      {/* ホバー時のツールチップ */}
      {isHovered && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
          <div className="bg-gray-800 text-white text-sm px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
            {featureName}はBackpackerプラン以上で利用可能です
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
          </div>
        </div>
      )}
    </div>
  )
}
