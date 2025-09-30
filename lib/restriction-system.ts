/**
 * 制限管理システム
 * プラン制限を一元管理するビジネスロジック
 */

// 制限タイプの定義
export enum RestrictionType {
  MAX_TRIPS = 'MAX_TRIPS',
  MAX_TRAVEL_DAYS = 'MAX_TRAVEL_DAYS',
  MAX_STORAGE_GB = 'MAX_STORAGE_GB',
  MAX_PHOTOS_PER_TRIP = 'MAX_PHOTOS_PER_TRIP',
  ROUTE_OPTIMIZATION = 'ROUTE_OPTIMIZATION',
  ADVANCED_ROUTE_OPTIMIZATION = 'ADVANCED_ROUTE_OPTIMIZATION',
  CUSTOM_CHECKLIST = 'CUSTOM_CHECKLIST',
  PDF_EXPORT = 'PDF_EXPORT',
  HIGH_RESOLUTION_PDF = 'HIGH_RESOLUTION_PDF',
  BRANDED_PDF = 'BRANDED_PDF',
  COMPANION_SHARING = 'COMPANION_SHARING',
  COMPANION_COLLABORATION = 'COMPANION_COLLABORATION',
  AI_ITINERARY_SUGGESTION = 'AI_ITINERARY_SUGGESTION',
  PRIORITY_SUPPORT = 'PRIORITY_SUPPORT',
  GROUP_MANAGEMENT = 'GROUP_MANAGEMENT',
  API_ACCESS = 'API_ACCESS',
  WHITE_LABEL = 'WHITE_LABEL'
}

// プランIDの定義
export enum PlanId {
  SEASON_TRAVELER = 'season_traveler',
  BACKPACKER = 'backpacker',
  GLOBETROTTER = 'globetrotter',
  PLANNER_PRO = 'planner_pro',
  ENTERPRISE = 'enterprise'
}

// 制限値の型定義
export type RestrictionValue = number | boolean;

// プランごとの制限テーブル
export const restrictionTable: Record<PlanId, Record<RestrictionType, RestrictionValue>> = {
  [PlanId.SEASON_TRAVELER]: {
    [RestrictionType.MAX_TRIPS]: 3,
    [RestrictionType.MAX_TRAVEL_DAYS]: 5, // 一回の旅行で最大5日まで
    [RestrictionType.MAX_STORAGE_GB]: 0.05,
    [RestrictionType.MAX_PHOTOS_PER_TRIP]: 5,
    [RestrictionType.ROUTE_OPTIMIZATION]: false,
    [RestrictionType.ADVANCED_ROUTE_OPTIMIZATION]: false,
    [RestrictionType.CUSTOM_CHECKLIST]: false,
    [RestrictionType.PDF_EXPORT]: true, // 透かし入り
    [RestrictionType.HIGH_RESOLUTION_PDF]: false,
    [RestrictionType.BRANDED_PDF]: false,
    [RestrictionType.COMPANION_SHARING]: false,
    [RestrictionType.COMPANION_COLLABORATION]: false,
    [RestrictionType.AI_ITINERARY_SUGGESTION]: false,
    [RestrictionType.PRIORITY_SUPPORT]: false,
    [RestrictionType.GROUP_MANAGEMENT]: false,
    [RestrictionType.API_ACCESS]: false,
    [RestrictionType.WHITE_LABEL]: false
  },
  [PlanId.BACKPACKER]: {
    [RestrictionType.MAX_TRIPS]: 10,
    [RestrictionType.MAX_TRAVEL_DAYS]: 30, // 一回の旅行で最大30日まで
    [RestrictionType.MAX_STORAGE_GB]: 0.5,
    [RestrictionType.MAX_PHOTOS_PER_TRIP]: 50,
    [RestrictionType.ROUTE_OPTIMIZATION]: true,
    [RestrictionType.ADVANCED_ROUTE_OPTIMIZATION]: false,
    [RestrictionType.CUSTOM_CHECKLIST]: true,
    [RestrictionType.PDF_EXPORT]: true, // 透かしなし
    [RestrictionType.HIGH_RESOLUTION_PDF]: false,
    [RestrictionType.BRANDED_PDF]: false,
    [RestrictionType.COMPANION_SHARING]: true, // 閲覧のみ
    [RestrictionType.COMPANION_COLLABORATION]: false,
    [RestrictionType.AI_ITINERARY_SUGGESTION]: false,
    [RestrictionType.PRIORITY_SUPPORT]: false,
    [RestrictionType.GROUP_MANAGEMENT]: false,
    [RestrictionType.API_ACCESS]: false,
    [RestrictionType.WHITE_LABEL]: false
  },
  [PlanId.GLOBETROTTER]: {
    [RestrictionType.MAX_TRIPS]: -1, // 無制限
    [RestrictionType.MAX_TRAVEL_DAYS]: -1, // 無制限
    [RestrictionType.MAX_STORAGE_GB]: 5,
    [RestrictionType.MAX_PHOTOS_PER_TRIP]: -1, // 無制限
    [RestrictionType.ROUTE_OPTIMIZATION]: true,
    [RestrictionType.ADVANCED_ROUTE_OPTIMIZATION]: true,
    [RestrictionType.CUSTOM_CHECKLIST]: true,
    [RestrictionType.PDF_EXPORT]: true,
    [RestrictionType.HIGH_RESOLUTION_PDF]: true,
    [RestrictionType.BRANDED_PDF]: true,
    [RestrictionType.COMPANION_SHARING]: true,
    [RestrictionType.COMPANION_COLLABORATION]: true,
    [RestrictionType.AI_ITINERARY_SUGGESTION]: true,
    [RestrictionType.PRIORITY_SUPPORT]: true,
    [RestrictionType.GROUP_MANAGEMENT]: false,
    [RestrictionType.API_ACCESS]: false,
    [RestrictionType.WHITE_LABEL]: false
  },
  [PlanId.PLANNER_PRO]: {
    [RestrictionType.MAX_TRIPS]: -1,
    [RestrictionType.MAX_TRAVEL_DAYS]: -1,
    [RestrictionType.MAX_STORAGE_GB]: 20,
    [RestrictionType.MAX_PHOTOS_PER_TRIP]: -1,
    [RestrictionType.ROUTE_OPTIMIZATION]: true,
    [RestrictionType.ADVANCED_ROUTE_OPTIMIZATION]: true,
    [RestrictionType.CUSTOM_CHECKLIST]: true,
    [RestrictionType.PDF_EXPORT]: true,
    [RestrictionType.HIGH_RESOLUTION_PDF]: true,
    [RestrictionType.BRANDED_PDF]: true,
    [RestrictionType.COMPANION_SHARING]: true,
    [RestrictionType.COMPANION_COLLABORATION]: true,
    [RestrictionType.AI_ITINERARY_SUGGESTION]: true,
    [RestrictionType.PRIORITY_SUPPORT]: true,
    [RestrictionType.GROUP_MANAGEMENT]: true, // 小規模対応
    [RestrictionType.API_ACCESS]: false,
    [RestrictionType.WHITE_LABEL]: true // ブランド対応
  },
  [PlanId.ENTERPRISE]: {
    [RestrictionType.MAX_TRIPS]: -1,
    [RestrictionType.MAX_TRAVEL_DAYS]: -1,
    [RestrictionType.MAX_STORAGE_GB]: -1, // 無制限
    [RestrictionType.MAX_PHOTOS_PER_TRIP]: -1,
    [RestrictionType.ROUTE_OPTIMIZATION]: true,
    [RestrictionType.ADVANCED_ROUTE_OPTIMIZATION]: true,
    [RestrictionType.CUSTOM_CHECKLIST]: true,
    [RestrictionType.PDF_EXPORT]: true,
    [RestrictionType.HIGH_RESOLUTION_PDF]: true,
    [RestrictionType.BRANDED_PDF]: true,
    [RestrictionType.COMPANION_SHARING]: true,
    [RestrictionType.COMPANION_COLLABORATION]: true,
    [RestrictionType.AI_ITINERARY_SUGGESTION]: true,
    [RestrictionType.PRIORITY_SUPPORT]: true,
    [RestrictionType.GROUP_MANAGEMENT]: true, // 大規模対応
    [RestrictionType.API_ACCESS]: true,
    [RestrictionType.WHITE_LABEL]: true // 完全ホワイトラベル
  }
};

/**
 * 制限プロバイダークラス
 * プラン制限のチェックと取得を行う
 */
export class RestrictionProvider {
  /**
   * 指定されたプランと制限タイプの制限値を取得
   */
  static getRestriction(planId: string, type: RestrictionType): RestrictionValue | null {
    const plan = planId as PlanId;
    if (!restrictionTable[plan]) {
      console.warn(`Unknown plan: ${planId}`);
      return null;
    }
    
    return restrictionTable[plan][type] ?? null;
  }

  /**
   * 指定されたプランの制限値をすべて取得
   */
  static getAllRestrictions(planId: string): Record<RestrictionType, RestrictionValue> | null {
    const plan = planId as PlanId;
    if (!restrictionTable[plan]) {
      console.warn(`Unknown plan: ${planId}`);
      return null;
    }
    
    return { ...restrictionTable[plan] };
  }

  /**
   * 制限チェック（数値制限）
   * @param planId プランID
   * @param type 制限タイプ
   * @param currentValue 現在の値
   * @returns 制限内かどうか
   */
  static can(planId: string, type: RestrictionType, currentValue: number = 1): boolean {
    const restriction = this.getRestriction(planId, type);
    
    if (restriction === null) {
      return false;
    }
    
    if (typeof restriction === 'boolean') {
      return restriction;
    }
    
    if (typeof restriction === 'number') {
      // -1は無制限を意味する
      if (restriction === -1) {
        return true;
      }
      return currentValue <= restriction;
    }
    
    return false;
  }

  /**
   * 制限チェック（真偽値制限）
   * @param planId プランID
   * @param type 制限タイプ
   * @returns 機能が利用可能かどうか
   */
  static hasFeature(planId: string, type: RestrictionType): boolean {
    const restriction = this.getRestriction(planId, type);
    
    if (restriction === null) {
      return false;
    }
    
    if (typeof restriction === 'boolean') {
      return restriction;
    }
    
    // 数値の場合は0より大きければ利用可能
    if (typeof restriction === 'number') {
      return restriction > 0;
    }
    
    return false;
  }

  /**
   * 残り利用可能数を取得
   * @param planId プランID
   * @param type 制限タイプ
   * @param currentValue 現在の値
   * @returns 残り利用可能数（-1は無制限）
   */
  static getRemaining(planId: string, type: RestrictionType, currentValue: number = 0): number {
    const restriction = this.getRestriction(planId, type);
    
    if (restriction === null) {
      return 0;
    }
    
    if (typeof restriction === 'boolean') {
      return restriction ? 1 : 0;
    }
    
    if (typeof restriction === 'number') {
      if (restriction === -1) {
        return -1; // 無制限
      }
      return Math.max(0, restriction - currentValue);
    }
    
    return 0;
  }

  /**
   * 制限超過時のメッセージを生成
   * @param planId プランID
   * @param type 制限タイプ
   * @param currentValue 現在の値
   * @returns エラーメッセージ
   */
  static getLimitExceededMessage(planId: string, type: RestrictionType, currentValue: number = 0): string {
    const restriction = this.getRestriction(planId, type);
    
    if (restriction === null) {
      return '制限情報が見つかりません';
    }
    
    if (typeof restriction === 'boolean') {
      return restriction ? '' : 'この機能は利用できません';
    }
    
    if (typeof restriction === 'number') {
      if (restriction === -1) {
        return '';
      }
      
      const remaining = this.getRemaining(planId, type, currentValue);
      if (remaining <= 0) {
        return `制限を超過しています (${currentValue}/${restriction})`;
      }
      
      return `残り${remaining}件まで利用可能 (${currentValue}/${restriction})`;
    }
    
    return '制限情報が無効です';
  }

  /**
   * プラン名を取得
   * @param planId プランID
   * @returns プラン名
   */
  static getPlanName(planId: string): string {
    const planNames: Record<PlanId, string> = {
      [PlanId.SEASON_TRAVELER]: 'Season Traveler',
      [PlanId.BACKPACKER]: 'Backpacker',
      [PlanId.GLOBETROTTER]: 'Globetrotter',
      [PlanId.PLANNER_PRO]: 'Planner Pro',
      [PlanId.ENTERPRISE]: 'Enterprise'
    };
    
    return planNames[planId as PlanId] || 'Unknown Plan';
  }

  /**
   * 利用可能なプラン一覧を取得
   * @returns プランIDの配列
   */
  static getAvailablePlans(): PlanId[] {
    return Object.values(PlanId);
  }
}

/**
 * 便利なヘルパー関数
 */
export const restrictionHelpers = {
  /**
   * 制限値の表示用フォーマット
   */
  formatRestriction(restriction: RestrictionValue, type: RestrictionType): string {
    if (typeof restriction === 'boolean') {
      return restriction ? '利用可能' : '利用不可';
    }
    
    if (typeof restriction === 'number') {
      if (restriction === -1) {
        return '無制限';
      }
      
      switch (type) {
        case RestrictionType.MAX_TRIPS:
          return `${restriction}件まで`;
        case RestrictionType.MAX_TRAVEL_DAYS:
          return `一回の旅行で${restriction}日以内`;
        case RestrictionType.MAX_STORAGE_GB:
          return `${restriction}GB`;
        case RestrictionType.MAX_PHOTOS_PER_TRIP:
          return `${restriction}枚/旅行`;
        default:
          return restriction.toString();
      }
    }
    
    return '不明';
  },

  /**
   * 使用率の計算
   */
  calculateUsagePercentage(current: number, limit: number): number {
    if (limit === -1) return 0;
    if (limit === 0) return 100;
    return Math.min(100, Math.round((current / limit) * 100));
  },

  /**
   * 使用率に応じた色の決定
   */
  getUsageColor(percentage: number): string {
    if (percentage >= 100) return 'text-red-600';
    if (percentage >= 80) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-green-600';
  },

  /**
   * 使用率に応じたバーの色の決定
   */
  getProgressBarColor(percentage: number): string {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    if (percentage >= 60) return 'bg-orange-500';
    return 'bg-green-500';
  }
};
