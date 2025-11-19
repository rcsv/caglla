/**
 * 旅行・旅程関連の型定義
 */

import type { FirestoreDate, AccessLevel } from './common'
import type { PlaceData } from './place'
import type { ActivityTag } from './activity'
import type { User } from './user'
import type { TripSocialStats } from './social'

// 循環依存を避けるため、ReservationInfoは後でインポート
// import type { ReservationInfo } from './reservation'

// ============================================================================
// 旅行・旅程関連
// ============================================================================

/**
 * Itinerary（旅程）
 */
export interface Itinerary {
  id: string
  day_id: string
  sort_number: number
  title: string
  description?: string
  location?: string
  // Firestoreには place_id を保存し、実体は places_cache から解決する
  place_id?: string | null
  place_data?: PlaceData | null
  start_time?: string
  end_time?: string
  timezone?: string
  cost_amount?: number | null
  cost_currency?: string
  // アクティビティタグ（2段階分類）
  activity_tag?: ActivityTag | null
  // 予約情報（ReservationInfoは循環依存回避のためanyで型付け）
  reservation?: any | null  // ReservationInfo
  created_at: FirestoreDate
  updated_at: FirestoreDate
}

/**
 * Day（日程）
 */
export interface Day {
  id: string
  trip_id: string
  day_number: number
  date: FirestoreDate
  description?: string
  created_at: FirestoreDate
  updated_at: FirestoreDate
  itineraries?: Itinerary[]
}

/**
 * Trip（旅行）
 * 
 * @remarks
 * フィールドは以下の順序で整理されています：
 * 1. 必須フィールド（基本識別子）
 * 2. 基本情報（タイトル、説明、場所、日付）
 * 3. 設定・機能（テンプレート、通貨、iCal）
 * 4. v3.0.0 SNS機能（social_stats、公開日時など）
 * 5. v3.0.0 シェア機能（Shared Private Trip関連）
 * 6. v3.0.0 テンプレートプラン機能
 * 7. メタデータ（作成日時、更新日時）
 * 8. リレーション（days、creator）
 * 9. Deprecated/Legacy フィールド（末尾）
 */
export interface Trip {
  // ============================================================================
  // 必須フィールド（基本識別子）
  // ============================================================================
  id: string
  user_id: string
  title: string
  /** 
   * 旅行の進行状態（計算プロパティとして扱う）
   * - `'PLANNING'`: 計画中（デフォルト、日付未設定、または開始日前）
   * - `'ACTIVE'`: 旅行中（start_date <= 今日 <= end_date）
   * - `'COMPLETED'`: 完了（end_date < 今日）
   * - `'CANCELLED'`: キャンセル（is_cancelled === true）
   * 
   * @remarks
   * **重要**: このフィールドは後方互換性のため残されていますが、
   * 新規実装では `getTripStatus()` ヘルパー関数を使用して状態を取得してください。
   * 
   * 状態の判定ロジック:
   * 1. `is_cancelled === true` → `'CANCELLED'`
   * 2. 日付が未設定 → `'PLANNING'`
   * 3. `start_date <= 今日 <= end_date` → `'ACTIVE'`
   * 4. `end_date < 今日` → `'COMPLETED'`
   * 5. `start_date > 今日` → `'PLANNING'`
   * 
   * 注意: 公開状態（未公開/公開済み）は `published_at` の有無で判定すること。
   * - `published_at === undefined`: 未公開（計画中、非公開）
   * - `published_at !== undefined`: 公開済み
   */
  status: 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  access_level: AccessLevel | 'private' | 'public' // 後方互換性のため両方許可

  // ============================================================================
  // 基本情報（タイトル、説明、場所、日付）
  // ============================================================================
  slug?: string // URL-safe スラッグ
  description?: string
  // Firestoreには destination_place_id を保存し、実体は places_cache から解決する
  destination_place_id?: string
  destination_place?: PlaceData // UI向けに解決済みのデータ（読み取り時に付与）
  start_date?: FirestoreDate
  end_date?: FirestoreDate
  image_url?: string

  // ============================================================================
  // 設定・機能（テンプレート、通貨、iCal）
  // ============================================================================
  is_template?: boolean // テンプレートプランかどうか
  day_count?: number // 旅行日数（テンプレートプランで使用）
  default_currency?: string // デフォルト通貨コード（例: 'USD', 'JPY', 'EUR'）
  
  // ============================================================================
  // 旅行の進行状態管理
  // ============================================================================
  /** 
   * キャンセルフラグ
   * - `true`: 旅行がキャンセルされた（ユーザーが明示的に設定）
   * - `false` または `undefined`: キャンセルされていない（デフォルト）
   * 
   * @remarks
   * キャンセルされた旅行は、日付に関係なく `status` が `'CANCELLED'` になります。
   * キャンセルされていない場合は、`start_date` と `end_date` から自動判定されます。
   * 状態の取得には `getTripStatus()` ヘルパー関数を使用してください。
   */
  is_cancelled?: boolean
  
  // iCal公開機能
  ical_public_token?: string // iCal公開用トークン（UUID）
  ical_enabled?: boolean // iCal公開が有効かどうか
  ical_last_accessed_at?: FirestoreDate // iCal最終アクセス日時（統計用）

  // ============================================================================
  // v3.0.0 SNS機能関連フィールド
  // ============================================================================
  /** 
   * 公開日時
   * - `undefined`: 未公開（計画中、非公開）
   * - `FirestoreDate`: 公開済み（公開された日時）
   * 
   * @remarks
   * 公開状態の判定には `published_at !== undefined` を使用すること。
   * `status` フィールドは旅行の進行状態を表し、公開状態とは別概念です。
   */
  published_at?: FirestoreDate
  featured?: boolean // 運営ピックアップ
  trending_score?: number // トレンドスコア（アルゴリズム算出）
  social_stats?: TripSocialStats // SNS統計（Subcollection参照用の集計値）
  
  // ============================================================================
  // v3.0.0 プライベート旅行のシェア関連フィールド
  // ============================================================================
  is_shared?: boolean // Shared Private Tripかどうか（プライベート旅行を参考情報として公開）
  shared_from_trip_id?: string // 元のプライベート旅行のID
  shared_start_month?: number // シェア時の開始月（1-12、プライバシー保護のため月のみ）
  shared_start_year?: number // シェア時の開始年
  shared_end_month?: number // シェア時の終了月（1-12、プライバシー保護のため月のみ）
  shared_end_year?: number // シェア時の終了年
  shared_month_label?: string // 表示用の月ラベル（例: "2024年12月"、UI表示用）
  shared_members?: User[] // プライベート旅行の共有メンバー一覧（UI表示用、実際のデータはtrip_usersコレクションで管理）

  // ============================================================================
  // v3.0.0 テンプレートプラン関連フィールド
  // ============================================================================
  shared_plan_type?: 'user' | 'business' // プランタイプ（'business'の場合は業者のプラン）

  // ============================================================================
  // メタデータ（作成日時、更新日時）
  // ============================================================================
  created_at: FirestoreDate
  updated_at: FirestoreDate

  // ============================================================================
  // リレーション（読み取り時に解決される関連データ）
  // ============================================================================
  days?: Day[] // 日程データ（読み取り時に付与）
  creator?: User // 作成者情報（読み取り時に付与）

  // ============================================================================
  // Deprecated/Legacy フィールド（後方互換性のため残す、新規実装では使用しない）
  // ============================================================================
  /** @deprecated 後方互換性のため残す。新規実装では `destination_place` を使用すること */
  destination?: string
  
  /** @deprecated 後方互換性のため残す。新規実装では `social_stats.likes_count` を使用すること */
  likes_count?: number
  
  /** @deprecated 後方互換性のため残す。新規実装では API経由で現在のユーザーのいいね状態を取得すること */
  liked_by_me?: boolean
}

/**
 * TripStatus（旅行の進行状態）
 * 
 * - `'PLANNING'`: 計画中（デフォルト、日付未設定、または開始日前）
 * - `'ACTIVE'`: 旅行中（start_date <= 今日 <= end_date）
 * - `'COMPLETED'`: 完了（end_date < 今日）
 * - `'CANCELLED'`: キャンセル（is_cancelled === true）
 */
export type TripStatus = 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'

/**
 * TripUser（旅行参加者）
 */
export interface TripUser {
  id: string
  trip_id: string
  user_id: string
  created_at: FirestoreDate
}

