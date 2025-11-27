/**
 * ユーザー関連の型定義
 */

import type { FirestoreDate, Gender, Theme } from './common'

// ============================================================================
// ユーザープリファレンス
// ============================================================================

/**
 * 単位系
 * - metric: メートル法（摂氏、km/m）
 * - imperial: ヤードポンド法（華氏、mi/ft）
 */
export type UnitSystem = 'metric' | 'imperial'

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
  unit_system?: UnitSystem // 単位系（メートル法/ヤードポンド法）
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
 * 
 * Phase 1-1.5: 認証プロバイダーマルチ対応化（v3.0.0）
 * - auth_uid: Firebase Auth UID（必須、マルチプロバイダー対応）
 * - google_id: Google認証プロバイダー用（後方互換性のためオプショナル）
 */
export interface User {
  id: string
  auth_uid: string // Firebase Auth UID（新規、必須）
  google_id?: string // Google ID（後方互換性のためオプショナル）
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

