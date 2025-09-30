'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { dummyPaymentService, SubscriptionPlan as DummySubscriptionPlan, Subscription, PaymentMethod } from './dummy-payment-service'
import { RestrictionProvider, RestrictionType, PlanId } from './restriction-system'

// 統一されたSubscriptionPlan型
export type SubscriptionPlan = DummySubscriptionPlan

export interface SubscriptionStatus {
  isSubscribed: boolean
  plan: SubscriptionPlan | null
  subscription: Subscription | null
  remainingOptimizations: number
  expiresAt: Date | null
  paymentMethods: PaymentMethod[]
}

interface SubscriptionContextType {
  subscriptionStatus: SubscriptionStatus
  isLoading: boolean
  checkSubscription: () => Promise<void>
  useRouteOptimization: () => boolean
  refreshSubscription: () => Promise<void>
  subscribeToPlan: (planId: string, paymentMethodId?: string) => Promise<boolean>
  cancelSubscription: () => Promise<boolean>
  getPlans: () => Promise<SubscriptionPlan[]>
  getPaymentMethods: () => Promise<PaymentMethod[]>
  // 新しい制限システム
  can: (type: RestrictionType, currentValue?: number) => boolean
  hasFeature: (type: RestrictionType) => boolean
  getRemaining: (type: RestrictionType, currentValue?: number) => number
  getLimitExceededMessage: (type: RestrictionType, currentValue?: number) => string
  // 後方互換性のための関数
  canCreateTravel: (currentCount: number) => boolean
  canAddTravelDays: (totalDays: number) => boolean
  canUploadFiles: (storageUsedGB: number) => boolean
  canUploadPhotos: (photosPerTrip: number) => boolean
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

// デモ用のサブスクリプションプラン（簡素化版）
const DEMO_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: '無料プラン',
    price: 0,
    currency: 'JPY',
    interval: 'month',
    features: ['基本的な旅行計画', '最大3地点まで'],
    limits: {
      travelCount: 3,
      travelDays: 5,
      storageGB: 0.05,
      photosPerTrip: 5
    }
  },
  {
    id: 'plus',
    name: 'Plusプラン',
    price: 980,
    currency: 'JPY',
    interval: 'month',
    features: [
      '無制限の旅行計画',
      'ルート最適化機能',
      'リアルタイム交通情報',
      '優先サポート'
    ],
    limits: {
      travelCount: -1,
      travelDays: -1,
      storageGB: 5,
      photosPerTrip: -1
    }
  }
]

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({
    isSubscribed: false,
    plan: null,
    subscription: null,
    remainingOptimizations: 0,
    expiresAt: null,
    paymentMethods: []
  })
  const [isLoading, setIsLoading] = useState(true)

  const checkSubscription = async () => {
    try {
      setIsLoading(true)
      
      // ダミー課金システムからサブスクリプション状態を取得
      const plans = await dummyPaymentService.getPlans()
      const paymentMethods = await dummyPaymentService.getPaymentMethods('demo_user')
      
      // デモ用にローカルストレージからサブスクリプションIDを取得
      const storedSubscriptionId = localStorage.getItem('subscription_id')
      
      if (storedSubscriptionId) {
        const subscription = await dummyPaymentService.getSubscription(storedSubscriptionId)
        if (subscription) {
          const plan = plans.find(p => p.id === subscription.planId)
          setSubscriptionStatus({
            isSubscribed: subscription.status === 'active',
            plan: plan || null,
            subscription,
            remainingOptimizations: plan?.limits.travelCount === -1 ? -1 : 0,
            expiresAt: subscription.currentPeriodEnd,
            paymentMethods
          })
        } else {
          // サブスクリプションが見つからない場合は無料プラン
          const freePlan = plans.find(p => p.id === 'season_traveler')
          setSubscriptionStatus({
            isSubscribed: false,
            plan: freePlan || null,
            subscription: null,
            remainingOptimizations: 0,
            expiresAt: null,
            paymentMethods
          })
        }
      } else {
        // デフォルト状態（無料プラン）
        const freePlan = plans.find(p => p.id === 'season_traveler')
        setSubscriptionStatus({
          isSubscribed: false,
          plan: freePlan || null,
          subscription: null,
          remainingOptimizations: 0,
          expiresAt: null,
          paymentMethods
        })
      }
    } catch (error) {
      console.error('Error checking subscription:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const useRouteOptimization = (): boolean => {
    if (!subscriptionStatus.isSubscribed) {
      return false
    }

    // Backpackerプラン以上でルート最適化が利用可能
    const planId = subscriptionStatus.plan?.id
    if (planId === 'backpacker' || planId === 'globetrotter') {
      return true
    }

    return false
  }

  const refreshSubscription = async () => {
    await checkSubscription()
  }

  const subscribeToPlan = async (planId: string, paymentMethodId?: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      
      const subscription = await dummyPaymentService.createSubscription(
        'demo_user',
        planId,
        paymentMethodId,
        30 // 30日間のトライアル
      )
      
      // サブスクリプションIDをローカルストレージに保存
      localStorage.setItem('subscription_id', subscription.id)
      
      // 状態を更新
      await checkSubscription()
      
      return true
    } catch (error) {
      console.error('Error subscribing to plan:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const cancelSubscription = async (): Promise<boolean> => {
    try {
      if (!subscriptionStatus.subscription) {
        return false
      }
      
      setIsLoading(true)
      
      await dummyPaymentService.cancelSubscription(subscriptionStatus.subscription.id)
      
      // 状態を更新
      await checkSubscription()
      
      return true
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const getPlans = async (): Promise<SubscriptionPlan[]> => {
    return await dummyPaymentService.getPlans()
  }

  const getPaymentMethods = async (): Promise<PaymentMethod[]> => {
    return await dummyPaymentService.getPaymentMethods('demo_user')
  }

  // 新しい制限システムの実装
  const can = (type: RestrictionType, currentValue: number = 1): boolean => {
    const planId = subscriptionStatus.plan?.id || PlanId.SEASON_TRAVELER
    return RestrictionProvider.can(planId, type, currentValue)
  }

  const hasFeature = (type: RestrictionType): boolean => {
    const planId = subscriptionStatus.plan?.id || PlanId.SEASON_TRAVELER
    return RestrictionProvider.hasFeature(planId, type)
  }

  const getRemaining = (type: RestrictionType, currentValue: number = 0): number => {
    const planId = subscriptionStatus.plan?.id || PlanId.SEASON_TRAVELER
    return RestrictionProvider.getRemaining(planId, type, currentValue)
  }

  const getLimitExceededMessage = (type: RestrictionType, currentValue: number = 0): string => {
    const planId = subscriptionStatus.plan?.id || PlanId.SEASON_TRAVELER
    return RestrictionProvider.getLimitExceededMessage(planId, type, currentValue)
  }

  // 後方互換性のための関数
  const canCreateTravel = (currentCount: number): boolean => {
    return can(RestrictionType.MAX_TRIPS, currentCount + 1)
  }

  const canAddTravelDays = (totalDays: number): boolean => {
    return can(RestrictionType.MAX_TRAVEL_DAYS, totalDays)
  }

  const canUploadFiles = (storageUsedGB: number): boolean => {
    return can(RestrictionType.MAX_STORAGE_GB, storageUsedGB)
  }

  const canUploadPhotos = (photosPerTrip: number): boolean => {
    return can(RestrictionType.MAX_PHOTOS_PER_TRIP, photosPerTrip)
  }

  useEffect(() => {
    checkSubscription()
  }, [])

  const value: SubscriptionContextType = {
    subscriptionStatus,
    isLoading,
    checkSubscription,
    useRouteOptimization,
    refreshSubscription,
    subscribeToPlan,
    cancelSubscription,
    getPlans,
    getPaymentMethods,
    // 新しい制限システム
    can,
    hasFeature,
    getRemaining,
    getLimitExceededMessage,
    // 後方互換性
    canCreateTravel,
    canAddTravelDays,
    canUploadFiles,
    canUploadPhotos
  }

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  const context = useContext(SubscriptionContext)
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider')
  }
  return context
}

// デバッグ用：ダミーデータをリセット
export const resetDemoData = () => {
  dummyPaymentService.resetDemoData()
  localStorage.removeItem('subscription_id')
  window.location.reload()
}
