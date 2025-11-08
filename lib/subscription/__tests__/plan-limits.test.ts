import { PlanLimitChecker, planLimitHelpers, type UsageStats } from '../plan-limits'
import type { SubscriptionPlan } from '../payment-service'

const limitedPlan: SubscriptionPlan = {
  id: 'season_traveler',
  name: 'Season Traveler',
  price: 0,
  currency: 'JPY',
  interval: 'month',
  features: [],
  limits: {
    travelCount: 3,
    travelDays: 5,
    storageGB: 0.5,
    photosPerTrip: 5
  }
}

const unlimitedPlan: SubscriptionPlan = {
  id: 'globetrotter',
  name: 'Globetrotter',
  price: 980,
  currency: 'JPY',
  interval: 'month',
  features: [],
  limits: {
    travelCount: -1,
    travelDays: -1,
    storageGB: 5,
    photosPerTrip: -1
  }
}

describe('PlanLimitChecker', () => {
  it('旅行データ数の境界値を正しく判定できる', () => {
    const underLimit = PlanLimitChecker.checkTravelCountLimit(limitedPlan, 2)
    expect(underLimit.isAllowed).toBe(true)
    expect(underLimit.remaining).toBe(1)
    expect(underLimit.message).toBe('旅行データ: 2/3件 (残り1件)')

    const atLimit = PlanLimitChecker.checkTravelCountLimit(limitedPlan, 3)
    expect(atLimit.isAllowed).toBe(false)
    expect(atLimit.remaining).toBe(0)
    expect(atLimit.message).toBe('旅行データ: 3/3件 (残り0件)')
  })

  it('旅行日数の上限を超えると不許可になる', () => {
    const withinLimit = PlanLimitChecker.checkTravelDaysLimit(limitedPlan, 5)
    expect(withinLimit.isAllowed).toBe(true)

    const exceeded = PlanLimitChecker.checkTravelDaysLimit(limitedPlan, 6)
    expect(exceeded.isAllowed).toBe(false)
    expect(exceeded.remaining).toBe(0)
    expect(exceeded.message).toBe('旅行日数: 6/5日 (残り0日)')
  })

  it('ストレージと写真枚数の制限を判定できる', () => {
    const storage = PlanLimitChecker.checkStorageLimit(limitedPlan, 0.4)
    expect(storage.isAllowed).toBe(true)
    expect(storage.message).toBe('ストレージ: 0.40/0.5GB (残り0.10GB)')

    const photosExceeded = PlanLimitChecker.checkPhotosLimit(limitedPlan, 6)
    expect(photosExceeded.isAllowed).toBe(false)
    expect(photosExceeded.message).toBe('写真: 6/5枚/旅行 (残り0枚)')
  })

  it('無制限プランでは常に許可される', () => {
    const result = PlanLimitChecker.checkTravelCountLimit(unlimitedPlan, 999)
    expect(result.isAllowed).toBe(true)
    expect(result.remaining).toBe(-1)
    expect(result.message).toBe('旅行データ数は無制限です')
  })

  it('一括チェックで制限超過を検出できる', () => {
    const usage: UsageStats = {
      travelCount: 4,
      totalTravelDays: 3,
      storageUsedGB: 0.3,
      photosPerTrip: 6
    }

    const checks = PlanLimitChecker.checkAllLimits(limitedPlan, usage)
    expect(checks.travelCount.isAllowed).toBe(false)
    expect(checks.travelDays.isAllowed).toBe(true)
    expect(checks.photos.isAllowed).toBe(false)
    expect(checks.hasAnyLimitExceeded).toBe(true)
  })

  it('制限超過メッセージを生成できる', () => {
    const usage: UsageStats = {
      travelCount: 4,
      totalTravelDays: 6,
      storageUsedGB: 0.6,
      photosPerTrip: 7
    }

    const message = PlanLimitChecker.generateLimitExceededMessage(limitedPlan, usage)
    expect(message).toContain('旅行データ数が制限を超過しています (4/3件)')
    expect(message).toContain('旅行日数が制限を超過しています (6/5日)')
    expect(message).toContain('ストレージ容量が制限を超過しています (0.60/0.5GB)')
    expect(message).toContain('写真アップロード数が制限を超過しています (7/5枚)')
  })

  it('アップグレード推奨メッセージを閾値で制御できる', () => {
    const usage: UsageStats = {
      travelCount: 8,
      totalTravelDays: 3,
      storageUsedGB: 0.4,
      photosPerTrip: 5
    }

    const message = PlanLimitChecker.generateUpgradeMessage(
      {
        ...limitedPlan,
        limits: { ...limitedPlan.limits, travelCount: 10, photosPerTrip: 10 }
      },
      usage
    )

    expect(message).toContain('旅行データ数')
    expect(message).toContain('ストレージ容量')
    expect(message).not.toContain('旅行日数')
    expect(message).not.toContain('写真アップロード数')
  })
})

describe('planLimitHelpers', () => {
  it('制限値表示をフォーマットできる', () => {
    expect(planLimitHelpers.formatLimit(3, 'travelCount')).toBe('3件まで')
    expect(planLimitHelpers.formatLimit(-1, 'storageGB')).toBe('無制限')
  })

  it('使用率の計算と上限処理が正しい', () => {
    expect(planLimitHelpers.calculateUsagePercentage(4, 5)).toBe(80)
    expect(planLimitHelpers.calculateUsagePercentage(7, 5)).toBe(100)
    expect(planLimitHelpers.calculateUsagePercentage(1, -1)).toBe(0)
  })

  it('使用率に応じて色を返す', () => {
    expect(planLimitHelpers.getUsageColor(50)).toBe('text-green-600')
    expect(planLimitHelpers.getUsageColor(70)).toBe('text-orange-600')
    expect(planLimitHelpers.getUsageColor(85)).toBe('text-yellow-600')
    expect(planLimitHelpers.getUsageColor(100)).toBe('text-red-600')
  })

  it('進捗バーの色を閾値で切り替える', () => {
    expect(planLimitHelpers.getProgressBarColor(50)).toBe('bg-green-500')
    expect(planLimitHelpers.getProgressBarColor(70)).toBe('bg-orange-500')
    expect(planLimitHelpers.getProgressBarColor(85)).toBe('bg-yellow-500')
    expect(planLimitHelpers.getProgressBarColor(100)).toBe('bg-red-500')
  })
})


