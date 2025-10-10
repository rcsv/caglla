'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import logger from '@/lib/core/logger'
import { dummyPaymentService, SubscriptionPlan as DummySubscriptionPlan, Subscription, PaymentMethod } from '@/lib/subscription/payment-service'
import { RestrictionProvider, RestrictionType, PlanId, PLAN_CONFIGS } from '@/lib/subscription/restriction'

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

// デモ用のサブスクリプションプラン（新しいプランシステムに合わせて更新）
const DEMO_PLANS: SubscriptionPlan[] = [
  {
    id: 'season_traveler',
    name: 'Season Traveler',
    price: 0,
    currency: 'JPY',
    interval: 'month',
    features: [
      '基本的な旅行計画',
      '最大5件の旅行',
      '最大3件のプライベート旅行',
      '最大3日間の旅行',
      '10MBのストレージ',
      '100MBのアカウントストレージ'
    ],
    limits: {
      travelCount: 5,
      travelDays: 3,
      storageGB: 0.01,
      photosPerTrip: 10
    }
  },
  {
    id: 'backpacker',
    name: 'Backpacker',
    price: 480,
    currency: 'JPY',
    interval: 'month',
    features: [
      '最大12件の旅行',
      '最大6件のプライベート旅行',
      '最大7日間の旅行',
      '50MBのストレージ',
      '500MBのアカウントストレージ',
      'AIサポート機能',
      'ルート最適化機能'
    ],
    limits: {
      travelCount: 12,
      travelDays: 7,
      storageGB: 0.05,
      photosPerTrip: 50
    }
  },
  {
    id: 'globetrotter',
    name: 'Globetrotter',
    price: 980,
    currency: 'JPY',
    interval: 'month',
    features: [
      '無制限の旅行',
      '無制限のプライベート旅行',
      '無制限の旅行日数',
      '100MBのストレージ',
      '1GBのアカウントストレージ',
      'AIサポート機能',
      'ルート最適化機能',
      'Outlook統合機能'
    ],
    limits: {
      travelCount: -1,
      travelDays: -1,
      storageGB: 0.1,
      photosPerTrip: -1
    }
  },
  {
    id: 'planner_pro',
    name: 'Planner Pro',
    price: 1980,
    currency: 'JPY',
    interval: 'month',
    features: [
      '無制限の旅行',
      '無制限のプライベート旅行',
      '無制限の旅行日数',
      '1GBのストレージ',
      '10GBのアカウントストレージ',
      'AIサポート機能',
      'ルート最適化機能',
      'Outlook統合機能',
      '優先サポート'
    ],
    limits: {
      travelCount: -1,
      travelDays: -1,
      storageGB: 1,
      photosPerTrip: -1
    }
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 0,
    currency: 'JPY',
    interval: 'month',
    features: [
      '無制限の旅行',
      '無制限のプライベート旅行',
      '無制限の旅行日数',
      '無制限のストレージ',
      '無制限のアカウントストレージ',
      'AIサポート機能',
      'ルート最適化機能',
      'Outlook統合機能',
      '専用サポート',
      'カスタム機能'
    ],
    limits: {
      travelCount: -1,
      travelDays: -1,
      storageGB: -1,
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
      logger.error('Error checking subscription:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const useRouteOptimization = (): boolean => {
    return hasFeature(RestrictionType.ROUTE_OPTIMIZATION)
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
      logger.error('Error subscribing to plan:', error)
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
      logger.error('Error cancelling subscription:', error)
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
    const planId = (subscriptionStatus.plan?.id as PlanId) || PlanId.SEASON_TRAVELER
    return RestrictionProvider.can(planId, type, currentValue)
  }

  const hasFeature = (type: RestrictionType): boolean => {
    const planId = (subscriptionStatus.plan?.id as PlanId) || PlanId.SEASON_TRAVELER
    return RestrictionProvider.hasFeature(planId, type)
  }

  const getRemaining = (type: RestrictionType, currentValue: number = 0): number => {
    const planId = (subscriptionStatus.plan?.id as PlanId) || PlanId.SEASON_TRAVELER
    return RestrictionProvider.getRemaining(planId, type, currentValue)
  }

  const getLimitExceededMessage = (type: RestrictionType, currentValue: number = 0): string => {
    const planId = (subscriptionStatus.plan?.id as PlanId) || PlanId.SEASON_TRAVELER
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
    return can(RestrictionType.MAX_STORAGE_GB, photosPerTrip) // ストレージ制限として扱う
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

// 