'use client'

import React, { useState } from 'react'
import { SubscriptionPlan, updateSubscriptionStatus } from '@/lib/subscription-context'

interface SubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  featureName: string
  plans: SubscriptionPlan[]
}

export default function SubscriptionModal({
  isOpen,
  onClose,
  featureName,
  plans
}: SubscriptionModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)
  const [isSubscribing, setIsSubscribing] = useState(false)

  if (!isOpen) return null

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    setIsSubscribing(true)
    
    try {
      // デモ用のサブスクリプション処理
      // 実際の実装では、決済処理をここで行う
      await new Promise(resolve => setTimeout(resolve, 1000)) // デモ用の遅延
      
      // サブスクリプション状態を更新
      updateSubscriptionStatus(
        plan.id,
        true,
        plan.routeOptimizationLimit,
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30日後
      )
      
      onClose()
    } catch (error) {
      console.error('Subscription error:', error)
      alert('サブスクリプションの処理中にエラーが発生しました')
    } finally {
      setIsSubscribing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            🚀 プレミアム機能
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg mb-4">
            <h3 className="text-lg font-semibold mb-2">
              {featureName} を利用するには
            </h3>
            <p className="text-blue-100">
              プレミアムプランにアップグレードして、高度なルート最適化機能をお楽しみください
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans.filter(plan => plan.id !== 'free').map(plan => (
              <div
                key={plan.id}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedPlan?.id === plan.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedPlan(plan)}
              >
                <div className="flex justify-between items-start mb-3">
                  <h4 className="text-lg font-semibold text-gray-800">
                    {plan.name}
                  </h4>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-800">
                      ¥{plan.price.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">/月</div>
                  </div>
                </div>

                <ul className="space-y-2 mb-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-600">
                      <span className="text-green-500 mr-2">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={isSubscribing}
                  className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors ${
                    plan.id === 'premium'
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-600 text-white hover:bg-gray-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isSubscribing ? '処理中...' : '今すぐ始める'}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="text-center text-sm text-gray-500">
            <p>💳 デモ環境では実際の決済は行われません</p>
            <p>🔄 30日間の無料トライアル付き</p>
            <p>❌ いつでもキャンセル可能</p>
          </div>
        </div>
      </div>
    </div>
  )
}
