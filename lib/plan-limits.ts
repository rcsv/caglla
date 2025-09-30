/**
 * プラン制限チェック機能
 * subscription-idea.mdの制限事項に基づく実装
 */

import { SubscriptionPlan } from './dummy-payment-service'

export interface PlanLimits {
  travelCount: number
  travelDays: number
  storageGB: number
  photosPerTrip: number
}

export interface UsageStats {
  travelCount: number
  totalTravelDays: number
  storageUsedGB: number
  photosPerTrip: number
}

export interface LimitCheckResult {
  isAllowed: boolean
  currentUsage: number
  limit: number
  remaining: number
  message: string
}

export class PlanLimitChecker {
  /**
   * 旅行データ数の制限チェック
   */
  static checkTravelCountLimit(
    plan: SubscriptionPlan,
    currentTravelCount: number
  ): LimitCheckResult {
    const limit = plan.limits.travelCount
    const remaining = limit === -1 ? -1 : Math.max(0, limit - currentTravelCount)
    
    return {
      isAllowed: limit === -1 || currentTravelCount < limit,
      currentUsage: currentTravelCount,
      limit,
      remaining,
      message: limit === -1 
        ? '旅行データ数は無制限です'
        : `旅行データ: ${currentTravelCount}/${limit}件 (残り${remaining}件)`
    }
  }

  /**
   * 旅行日数の制限チェック
   */
  static checkTravelDaysLimit(
    plan: SubscriptionPlan,
    totalTravelDays: number
  ): LimitCheckResult {
    const limit = plan.limits.travelDays
    const remaining = limit === -1 ? -1 : Math.max(0, limit - totalTravelDays)
    
    return {
      isAllowed: limit === -1 || totalTravelDays <= limit,
      currentUsage: totalTravelDays,
      limit,
      remaining,
      message: limit === -1 
        ? '旅行日数は無制限です'
        : `旅行日数: ${totalTravelDays}/${limit}日 (残り${remaining}日)`
    }
  }

  /**
   * ストレージ容量の制限チェック
   */
  static checkStorageLimit(
    plan: SubscriptionPlan,
    storageUsedGB: number
  ): LimitCheckResult {
    const limit = plan.limits.storageGB
    const remaining = limit === -1 ? -1 : Math.max(0, limit - storageUsedGB)
    
    return {
      isAllowed: limit === -1 || storageUsedGB <= limit,
      currentUsage: storageUsedGB,
      limit,
      remaining,
      message: limit === -1 
        ? 'ストレージ容量は無制限です'
        : `ストレージ: ${storageUsedGB.toFixed(2)}/${limit}GB (残り${remaining.toFixed(2)}GB)`
    }
  }

  /**
   * 写真アップロード数の制限チェック
   */
  static checkPhotosLimit(
    plan: SubscriptionPlan,
    photosPerTrip: number
  ): LimitCheckResult {
    const limit = plan.limits.photosPerTrip
    const remaining = limit === -1 ? -1 : Math.max(0, limit - photosPerTrip)
    
    return {
      isAllowed: limit === -1 || photosPerTrip <= limit,
      currentUsage: photosPerTrip,
      limit,
      remaining,
      message: limit === -1 
        ? '写真アップロード数は無制限です'
        : `写真: ${photosPerTrip}/${limit}枚/旅行 (残り${remaining}枚)`
    }
  }

  /**
   * 複数の制限を一括チェック
   */
  static checkAllLimits(
    plan: SubscriptionPlan,
    usage: UsageStats
  ): {
    travelCount: LimitCheckResult
    travelDays: LimitCheckResult
    storage: LimitCheckResult
    photos: LimitCheckResult
    hasAnyLimitExceeded: boolean
  } {
    const travelCount = this.checkTravelCountLimit(plan, usage.travelCount)
    const travelDays = this.checkTravelDaysLimit(plan, usage.totalTravelDays)
    const storage = this.checkStorageLimit(plan, usage.storageUsedGB)
    const photos = this.checkPhotosLimit(plan, usage.photosPerTrip)

    return {
      travelCount,
      travelDays,
      storage,
      photos,
      hasAnyLimitExceeded: !travelCount.isAllowed || !travelDays.isAllowed || 
                           !storage.isAllowed || !photos.isAllowed
    }
  }

  /**
   * 制限超過時のメッセージ生成
   */
  static generateLimitExceededMessage(
    plan: SubscriptionPlan,
    usage: UsageStats
  ): string {
    const checks = this.checkAllLimits(plan, usage)
    const exceededLimits: string[] = []

    if (!checks.travelCount.isAllowed) {
      exceededLimits.push(`旅行データ数が制限を超過しています (${checks.travelCount.currentUsage}/${checks.travelCount.limit}件)`)
    }
    if (!checks.travelDays.isAllowed) {
      exceededLimits.push(`旅行日数が制限を超過しています (${checks.travelDays.currentUsage}/${checks.travelDays.limit}日)`)
    }
    if (!checks.storage.isAllowed) {
      exceededLimits.push(`ストレージ容量が制限を超過しています (${checks.storage.currentUsage.toFixed(2)}/${checks.storage.limit}GB)`)
    }
    if (!checks.photos.isAllowed) {
      exceededLimits.push(`写真アップロード数が制限を超過しています (${checks.photos.currentUsage}/${checks.photos.limit}枚)`)
    }

    if (exceededLimits.length === 0) {
      return ''
    }

    return `制限超過: ${exceededLimits.join(', ')}`
  }

  /**
   * アップグレード推奨メッセージ生成
   */
  static generateUpgradeMessage(
    plan: SubscriptionPlan,
    usage: UsageStats
  ): string {
    const checks = this.checkAllLimits(plan, usage)
    const nearLimitItems: string[] = []

    // 80%以上使用している場合にアップグレードを推奨
    if (checks.travelCount.limit !== -1 && checks.travelCount.currentUsage / checks.travelCount.limit >= 0.8) {
      nearLimitItems.push('旅行データ数')
    }
    if (checks.travelDays.limit !== -1 && checks.travelDays.currentUsage / checks.travelDays.limit >= 0.8) {
      nearLimitItems.push('旅行日数')
    }
    if (checks.storage.limit !== -1 && checks.storage.currentUsage / checks.storage.limit >= 0.8) {
      nearLimitItems.push('ストレージ容量')
    }
    if (checks.photos.limit !== -1 && checks.photos.currentUsage / checks.photos.limit >= 0.8) {
      nearLimitItems.push('写真アップロード数')
    }

    if (nearLimitItems.length === 0) {
      return ''
    }

    return `制限に近づいています: ${nearLimitItems.join(', ')}。プランのアップグレードを検討してください。`
  }
}

/**
 * プラン制限の表示用ヘルパー
 */
export const planLimitHelpers = {
  /**
   * 制限値の表示用フォーマット
   */
  formatLimit(limit: number, type: string): string {
    if (limit === -1) return '無制限'
    
    switch (type) {
      case 'travelCount':
        return `${limit}件まで`
      case 'travelDays':
        return `${limit}日以内`
      case 'storageGB':
        return `${limit}GB`
      case 'photosPerTrip':
        return `${limit}枚/旅行`
      default:
        return limit.toString()
    }
  },

  /**
   * 使用率の計算
   */
  calculateUsagePercentage(current: number, limit: number): number {
    if (limit === -1) return 0
    return Math.min(100, Math.round((current / limit) * 100))
  },

  /**
   * 使用率に応じた色の決定
   */
  getUsageColor(percentage: number): string {
    if (percentage >= 100) return 'text-red-600'
    if (percentage >= 80) return 'text-yellow-600'
    if (percentage >= 60) return 'text-orange-600'
    return 'text-green-600'
  },

  /**
   * 使用率に応じたバーの色の決定
   */
  getProgressBarColor(percentage: number): string {
    if (percentage >= 100) return 'bg-red-500'
    if (percentage >= 80) return 'bg-yellow-500'
    if (percentage >= 60) return 'bg-orange-500'
    return 'bg-green-500'
  }
}
