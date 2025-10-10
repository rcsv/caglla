'use client'

import React, { useState } from 'react'
import { useSubscription } from '@/lib/contexts/subscription'
import SubscriptionModal from '@/components/modals/SubscriptionModal'

interface PremiumFeatureProps {
  featureName: string
  children: React.ReactNode
  className?: string
}

export default function PremiumFeature({
  featureName,
  children,
  className = ''
}: PremiumFeatureProps) {
  const { subscriptionStatus, useRouteOptimization } = useSubscription()
  const [showModal, setShowModal] = useState(false)

  const canUseFeature = useRouteOptimization()

  if (canUseFeature) {
    return <div className={className}>{children}</div>
  }

  return (
    <>
      <div className={`relative ${className}`}>
        {/* プレミアム機能のオーバーレイ */}
        <div className="absolute inset-0 bg-white bg-opacity-90 backdrop-blur-sm z-10 rounded-lg">
          <div className="flex flex-col items-center justify-center h-full p-4">
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">🚀</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                プレミアム機能
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {featureName}はプレミアムプラン限定の機能です
              </p>
            </div>
            
            <button
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
            >
              プレミアムプランにアップグレード
            </button>
            
            <div className="mt-4 text-xs text-gray-500 text-center">
              <p>現在のプラン: {subscriptionStatus.plan?.name}</p>
              <p>30日間の無料トライアル付き</p>
            </div>
          </div>
        </div>
        
        {/* 元のコンテンツ（ぼかし効果付き） */}
        <div className="opacity-30 pointer-events-none">
          {children}
        </div>
      </div>

      <SubscriptionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        featureName={featureName}
        plans={[
          {
            id: 'premium',
            name: 'プレミアムプラン',
            price: 980,
            currency: 'JPY',
            features: [
              '無制限の旅行計画',
              'ルート最適化機能',
              'リアルタイム交通情報',
              '優先サポート'
            ],
            routeOptimizationLimit: -1,
            isActive: true
          },
          {
            id: 'pro',
            name: 'プロプラン',
            price: 1980,
            currency: 'JPY',
            features: [
              'プレミアム機能すべて',
              'チーム機能',
              'API アクセス',
              'カスタムブランディング'
            ],
            routeOptimizationLimit: -1,
            isActive: true
          }
        ]}
      />
    </>
  )
}
