/**
 * チェックリスト生成ルールマスターデータ
 * 
 * アクティビティタグに基づき、チェックリスト項目を自動生成するためのルール定義
 */

// 型定義のエクスポート
export type { ChecklistCondition, ChecklistRuleItem, ChecklistGenerationRule } from './types'
import type { ChecklistGenerationRule } from './types'

// 各カテゴリのルールをエクスポート
export { TRANSPORTATION_RULES } from './transportation'
export { SHOPPING_RULES } from './shopping'
export { ACCOMMODATION_RULES } from './accommodation'
export { ADVENTURE_RULES } from './adventure'
export { ENTERTAINMENT_RULES } from './entertainment'
export { CULTURE_RULES } from './culture'
export { WELLNESS_RULES } from './wellness'
export { SERVICE_RULES } from './service'
export { DINING_RULES } from './dining'
export { EXPLORATION_RULES } from './exploration'

// すべてのルールを統合（後方互換性のため）
import { TRANSPORTATION_RULES } from './transportation'
import { SHOPPING_RULES } from './shopping'
import { ACCOMMODATION_RULES } from './accommodation'
import { ADVENTURE_RULES } from './adventure'
import { ENTERTAINMENT_RULES } from './entertainment'
import { CULTURE_RULES } from './culture'
import { WELLNESS_RULES } from './wellness'
import { SERVICE_RULES } from './service'
import { DINING_RULES } from './dining'
import { EXPLORATION_RULES } from './exploration'

export const CHECKLIST_RULES = [
  ...TRANSPORTATION_RULES,
  ...SHOPPING_RULES,
  ...ACCOMMODATION_RULES,
  ...ADVENTURE_RULES,
  ...ENTERTAINMENT_RULES,
  ...CULTURE_RULES,
  ...WELLNESS_RULES,
  ...SERVICE_RULES,
  ...DINING_RULES,
  ...EXPLORATION_RULES,
]

/**
 * カテゴリ別にルールを取得
 */
export function getRulesByCategory(category: string): ChecklistGenerationRule[] {
  switch (category.toLowerCase()) {
    case 'transportation': return TRANSPORTATION_RULES
    case 'shopping': return SHOPPING_RULES
    case 'accommodation': return ACCOMMODATION_RULES
    case 'adventure': return ADVENTURE_RULES
    case 'entertainment': return ENTERTAINMENT_RULES
    case 'culture': return CULTURE_RULES
    case 'wellness': return WELLNESS_RULES
    case 'service': return SERVICE_RULES
    case 'dining': return DINING_RULES
    case 'exploration': return EXPLORATION_RULES
    default: return []
  }
}

/**
 * SecondaryCategoryIDからチェックリスト生成ルールを取得（後方互換性）
 */
export function getChecklistRules(secondaryCategoryId: string): ChecklistGenerationRule[] {
  return CHECKLIST_RULES.filter(rule => rule.secondaryCategory === secondaryCategoryId)
}

/**
 * 全てのルールを取得（後方互換性）
 */
export function getAllChecklistRules(): ChecklistGenerationRule[] {
  return CHECKLIST_RULES
}
