/**
 * チェックリスト生成ルール型定義
 */

export interface ChecklistCondition {
  type: 'count' | 'duration' | 'destination' | 'always'
  // count: 同じsecondaryCategoryの回数
  minCount?: number
  maxCount?: number
  // duration: 旅行期間（日数）
  minDays?: number
  maxDays?: number
  // destination: 目的地条件
  countries?: string[] // ISO 3166-1 alpha-2 国コード
  continents?: string[] // 大陸コード (AS=Asia, EU=Europe, NA=North America, SA=South America, AF=Africa, OC=Oceania, AN=Antarctica)
}

export interface ChecklistRuleItem {
  title: string
  description?: string
  category: 'preparation' | 'packing'
  priority?: 'high' | 'medium' | 'low'
  condition?: ChecklistCondition
}

export interface ChecklistGenerationRule {
  id: string
  secondaryCategory: string // 対象の2段階目カテゴリーID
  items: ChecklistRuleItem[]
}

