/**
 * ユーザー関連の型定義
 */

import type { FirestoreDate, Gender, Theme } from './common'

// ============================================================================
// ユーザープリファレンス
// ============================================================================

/**
 * ユーザープリファレンス
 */
export interface UserPreferences {
  currency?: string
  home_address?: string
  // place_cache への参照（ホームエリア）。選択された場所から国コードを導出するために使用
  home_place_id?: string
  timezone?: string
  language?: string
  theme?: Theme
  notifications?: boolean
  home_country_code?: string // ユーザーの居住国（ISO 3166-1 alpha-2）
}

// ============================================================================
// ユーザー
// ============================================================================

/**
 * サブスクリプションプランID
 */
export type PlanId = 'season_traveler' | 'backpacker' | 'globetrotter' | 'planner_pro' | 'enterprise'

/**
 * ユーザー
 */
export interface User {
  id: string
  google_id: string
  name: string
  email: string
  slug?: string // URL-safe スラッグ
  profile_image_url?: string
  bio?: string // 自己紹介文
  gender?: Gender
  preferences?: UserPreferences
  created_at: FirestoreDate
  updated_at: FirestoreDate
  planId?: PlanId
  storageUsage?: StorageUsage
}

// ============================================================================
// ストレージ使用量管理
// ============================================================================

/**
 * ストレージ使用量
 */
export interface StorageUsage {
  totalBytes: number
  fileCount: number
  lastUpdated: FirestoreDate
  files: StorageFile[]
}

/**
 * ストレージファイル
 */
export interface StorageFile {
  id: string
  fileName: string
  fileSize: number
  fileType: string
  storagePath: string
  downloadUrl: string
  uploadedAt: FirestoreDate
  tripId?: string
  isAvatar?: boolean
}

/**
 * ストレージクォータ
 */
export interface StorageQuota {
  planId: PlanId
  maxBytes: number
  maxFiles: number
  description: string
}

