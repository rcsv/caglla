/**
 * アクティビティタグとチェックリスト関連の型定義
 */

import type { FirestoreDate } from './common'

// ============================================================================
// アクティビティタグ関連
// ============================================================================

/**
 * 1段階目カテゴリー（大分類）
 */
export type PrimaryCategoryType =
  | 'transportation'  // 乗り物に乗る
  | 'shopping'        // 買い物をする
  | 'dining'          // 食事をする
  | 'accommodation'   // 宿泊する
  | 'exploration'     // 探索する
  | 'adventure'       // 探検する
  | 'entertainment'   // 遊ぶ
  | 'culture'         // 文化に触れる
  | 'wellness'        // 健康志向
  | 'service'         // サービス提供

/**
 * アクティビティタグ（2段階分類）
 */
export interface ActivityTag {
  primaryCategory: PrimaryCategoryType
  secondaryCategory: string // 1段階目に応じた詳細カテゴリー
}

// ============================================================================
// チェックリスト関連
// ============================================================================

/**
 * チェックリストカテゴリー
 */
export type ChecklistCategory = 'preparation' | 'packing'

/**
 * 優先度
 */
export type ChecklistPriority = 'high' | 'medium' | 'low'

/**
 * チェックリスト項目
 */
export interface ChecklistItem {
  id: string
  title: string
  description?: string
  category: ChecklistCategory
  done: boolean
  generatedFrom?: string // 生成元のsecondaryCategory ID
  isCustom?: boolean // ユーザーが手動追加した項目
  priority?: ChecklistPriority
}

/**
 * Trip Checklist（旅行全体のチェックリスト）
 */
export interface TripChecklist {
  id: string
  trip_id: string
  items: ChecklistItem[]
  last_generated_at: FirestoreDate
  created_at: FirestoreDate
  updated_at: FirestoreDate
}

/**
 * Checklist Preset Item（プリセット内のアイテム）
 */
export interface ChecklistPresetItem {
  title: string
  description?: string
  category: ChecklistCategory
  priority?: ChecklistPriority
}

/**
 * Checklist Preset（ユーザー作成のチェックリストテンプレート）
 */
export interface ChecklistPreset {
  id: string
  user_id: string
  title: string
  description?: string
  tags?: string[] // 検索用タグ（例: ["winter", "hokkaido", "skiing"]）
  items: ChecklistPresetItem[]
  is_public: boolean // 公開/非公開フラグ
  created_at: FirestoreDate
  updated_at: FirestoreDate
  usage_count?: number // 使用回数（人気度の指標）
}

/**
 * アクティビティ統計
 */
export interface ActivityStats {
  primaryCategories: {
    [key in PrimaryCategoryType]?: {
      count: number
      percentage: number
    }
  }
  secondaryCategories: {
    [key: string]: number
  }
  totalActivities: number
}

