/**
 * プラン制限システム
 * 課金コンテンツの制限を一元管理する
 */

// ============================================================================
// プランID定義
// ============================================================================

export enum PlanId {
  SEASON_TRAVELER = 'season_traveler',
  BACKPACKER = 'backpacker', 
  GLOBETROTTER = 'globetrotter',
  PLANNER_PRO = 'planner_pro',
  ENTERPRISE = 'enterprise'
}

// ============================================================================
// 制限タイプ定義
// ============================================================================

export enum RestrictionType {
  // 旅行関連
  MAX_TRIPS = 'max_trips',
  MAX_PRIVATE_TRIPS = 'max_private_trips',
  MAX_TRAVEL_DAYS = 'max_travel_days',
  
  // ストレージ関連
  MAX_STORAGE_GB = 'max_storage_gb',
  MAX_ACCOUNT_STORAGE_GB = 'max_account_storage_gb',
  
  // 機能関連
  AI_SUPPORT = 'ai_support',
  OUTLOOK_INTEGRATION = 'outlook_integration',
  
  // ルート最適化
  ROUTE_OPTIMIZATION = 'route_optimization'
}

// ============================================================================
// プラン設定定義
// ============================================================================

export interface PlanConfig {
  id: PlanId
  name: string
  price: number
  currency: string
  interval: 'month' | 'year'
  features: string[]
  limits: {
    [RestrictionType.MAX_TRIPS]: number
    [RestrictionType.MAX_PRIVATE_TRIPS]: number
    [RestrictionType.MAX_TRAVEL_DAYS]: number
    [RestrictionType.MAX_STORAGE_GB]: number
    [RestrictionType.MAX_ACCOUNT_STORAGE_GB]: number
  }
  features_enabled: {
    [RestrictionType.AI_SUPPORT]: boolean
    [RestrictionType.OUTLOOK_INTEGRATION]: boolean
    [RestrictionType.ROUTE_OPTIMIZATION]: boolean
  }
}

// ============================================================================
// プラン設定データ
// ============================================================================

export const PLAN_CONFIGS: Record<PlanId, PlanConfig> = {
  [PlanId.SEASON_TRAVELER]: {
    id: PlanId.SEASON_TRAVELER,
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
      [RestrictionType.MAX_TRIPS]: 5,
      [RestrictionType.MAX_PRIVATE_TRIPS]: 3,
      [RestrictionType.MAX_TRAVEL_DAYS]: 3,
      [RestrictionType.MAX_STORAGE_GB]: 0.01, // 10MB
      [RestrictionType.MAX_ACCOUNT_STORAGE_GB]: 0.1 // 100MB
    },
    features_enabled: {
      [RestrictionType.AI_SUPPORT]: false,
      [RestrictionType.OUTLOOK_INTEGRATION]: false,
      [RestrictionType.ROUTE_OPTIMIZATION]: false
    }
  },
  
  [PlanId.BACKPACKER]: {
    id: PlanId.BACKPACKER,
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
      [RestrictionType.MAX_TRIPS]: 12,
      [RestrictionType.MAX_PRIVATE_TRIPS]: 6,
      [RestrictionType.MAX_TRAVEL_DAYS]: 7,
      [RestrictionType.MAX_STORAGE_GB]: 0.05, // 50MB
      [RestrictionType.MAX_ACCOUNT_STORAGE_GB]: 0.5 // 500MB
    },
    features_enabled: {
      [RestrictionType.AI_SUPPORT]: true,
      [RestrictionType.OUTLOOK_INTEGRATION]: false,
      [RestrictionType.ROUTE_OPTIMIZATION]: true
    }
  },
  
  [PlanId.GLOBETROTTER]: {
    id: PlanId.GLOBETROTTER,
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
      [RestrictionType.MAX_TRIPS]: -1, // 無制限
      [RestrictionType.MAX_PRIVATE_TRIPS]: -1, // 無制限
      [RestrictionType.MAX_TRAVEL_DAYS]: -1, // 無制限
      [RestrictionType.MAX_STORAGE_GB]: 0.1, // 100MB
      [RestrictionType.MAX_ACCOUNT_STORAGE_GB]: 1 // 1GB
    },
    features_enabled: {
      [RestrictionType.AI_SUPPORT]: true,
      [RestrictionType.OUTLOOK_INTEGRATION]: true,
      [RestrictionType.ROUTE_OPTIMIZATION]: true
    }
  },
  
  [PlanId.PLANNER_PRO]: {
    id: PlanId.PLANNER_PRO,
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
      [RestrictionType.MAX_TRIPS]: -1, // 無制限
      [RestrictionType.MAX_PRIVATE_TRIPS]: -1, // 無制限
      [RestrictionType.MAX_TRAVEL_DAYS]: -1, // 無制限
      [RestrictionType.MAX_STORAGE_GB]: 1, // 1GB
      [RestrictionType.MAX_ACCOUNT_STORAGE_GB]: 10 // 10GB
    },
    features_enabled: {
      [RestrictionType.AI_SUPPORT]: true,
      [RestrictionType.OUTLOOK_INTEGRATION]: true,
      [RestrictionType.ROUTE_OPTIMIZATION]: true
    }
  },
  
  [PlanId.ENTERPRISE]: {
    id: PlanId.ENTERPRISE,
    name: 'Enterprise',
    price: 0, // カスタム価格
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
      [RestrictionType.MAX_TRIPS]: -1, // 無制限
      [RestrictionType.MAX_PRIVATE_TRIPS]: -1, // 無制限
      [RestrictionType.MAX_TRAVEL_DAYS]: -1, // 無制限
      [RestrictionType.MAX_STORAGE_GB]: -1, // 無制限
      [RestrictionType.MAX_ACCOUNT_STORAGE_GB]: -1 // 無制限
    },
    features_enabled: {
      [RestrictionType.AI_SUPPORT]: true,
      [RestrictionType.OUTLOOK_INTEGRATION]: true,
      [RestrictionType.ROUTE_OPTIMIZATION]: true
    }
  }
}

// ============================================================================
// RestrictionProvider クラス
// ============================================================================

export class RestrictionProvider {
  /**
   * プランIDからプラン設定を取得
   */
  static getPlanConfig(planId: PlanId): PlanConfig {
    return PLAN_CONFIGS[planId]
  }

  /**
   * 制限チェック（数値制限）
   */
  static can(planId: PlanId, type: RestrictionType, currentValue: number): boolean {
    const config = this.getPlanConfig(planId)
    
    // 機能系の制限は別途チェック
    if (type === RestrictionType.AI_SUPPORT || 
        type === RestrictionType.OUTLOOK_INTEGRATION ||
        type === RestrictionType.ROUTE_OPTIMIZATION) {
      return this.hasFeature(planId, type)
    }
    
    // 数値制限のチェック
    const limit = config.limits[type as keyof typeof config.limits]
    if (limit === -1) return true // 無制限
    return currentValue < limit
  }

  /**
   * 機能の有無チェック
   */
  static hasFeature(planId: PlanId, type: RestrictionType): boolean {
    const config = this.getPlanConfig(planId)
    return config.features_enabled[type as keyof typeof config.features_enabled]
  }

  /**
   * 残り使用可能数を取得
   */
  static getRemaining(planId: PlanId, type: RestrictionType, currentValue: number): number {
    const config = this.getPlanConfig(planId)
    const limit = config.limits[type as keyof typeof config.limits]
    if (limit === -1) return -1 // 無制限
    return Math.max(0, limit - currentValue)
  }

  /**
   * 制限超過時のメッセージを生成
   */
  static getLimitExceededMessage(planId: PlanId, type: RestrictionType, currentValue: number): string {
    const config = this.getPlanConfig(planId)
    const limit = config.limits[type as keyof typeof config.limits]
    
    if (limit === -1) return ''
    
    const typeNames: Record<RestrictionType, string> = {
      [RestrictionType.MAX_TRIPS]: '旅行数',
      [RestrictionType.MAX_PRIVATE_TRIPS]: 'プライベート旅行数',
      [RestrictionType.MAX_TRAVEL_DAYS]: '旅行日数',
      [RestrictionType.MAX_STORAGE_GB]: 'ストレージ容量',
      [RestrictionType.MAX_ACCOUNT_STORAGE_GB]: 'アカウントストレージ容量',
      [RestrictionType.AI_SUPPORT]: 'AIサポート',
      [RestrictionType.OUTLOOK_INTEGRATION]: 'Outlook統合',
      [RestrictionType.ROUTE_OPTIMIZATION]: 'ルート最適化'
    }
    
    return `${typeNames[type]}の制限を超過しています (${currentValue}/${limit})`
  }

  /**
   * プラン一覧を取得
   */
  static getAllPlans(): PlanConfig[] {
    return Object.values(PLAN_CONFIGS)
  }

  /**
   * プラン比較情報を取得
   */
  static getPlanComparison(): {
    plans: PlanConfig[]
    features: RestrictionType[]
    limits: RestrictionType[]
  } {
    return {
      plans: this.getAllPlans(),
      features: [
        RestrictionType.AI_SUPPORT,
        RestrictionType.OUTLOOK_INTEGRATION,
        RestrictionType.ROUTE_OPTIMIZATION
      ],
      limits: [
        RestrictionType.MAX_TRIPS,
        RestrictionType.MAX_PRIVATE_TRIPS,
        RestrictionType.MAX_TRAVEL_DAYS,
        RestrictionType.MAX_STORAGE_GB,
        RestrictionType.MAX_ACCOUNT_STORAGE_GB
      ]
    }
  }
}

// ============================================================================
// ヘルパー関数
// ============================================================================

/**
 * プラン名を取得
 */
export function getPlanName(planId: PlanId): string {
  return PLAN_CONFIGS[planId].name
}

/**
 * プラン価格を取得
 */
export function getPlanPrice(planId: PlanId): { price: number; currency: string; interval: string } {
  const config = PLAN_CONFIGS[planId]
  return {
    price: config.price,
    currency: config.currency,
    interval: config.interval
  }
}

/**
 * 制限値の表示用フォーマット
 */
export function formatLimit(limit: number, type: RestrictionType): string {
  if (limit === -1) return '無制限'
  
  switch (type) {
    case RestrictionType.MAX_TRIPS:
    case RestrictionType.MAX_PRIVATE_TRIPS:
      return `${limit}件まで`
    case RestrictionType.MAX_TRAVEL_DAYS:
      return `${limit}日以内`
    case RestrictionType.MAX_STORAGE_GB:
    case RestrictionType.MAX_ACCOUNT_STORAGE_GB:
      return `${limit}GB`
    default:
      return limit.toString()
  }
}

/**
 * 使用率の計算
 */
export function calculateUsagePercentage(current: number, limit: number): number {
  if (limit === -1) return 0
  return Math.min(100, Math.round((current / limit) * 100))
}

/**
 * 使用率に応じた色の決定
 */
export function getUsageColor(percentage: number): string {
  if (percentage >= 100) return 'text-red-600'
  if (percentage >= 80) return 'text-yellow-600'
  if (percentage >= 60) return 'text-orange-600'
  return 'text-green-600'
}
