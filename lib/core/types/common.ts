/**
 * 共通型定義
 * プロジェクト全体で使用される基本的な型
 * 
 * このファイルは他のtypesファイルから参照されるが、
 * 他のtypesファイルをインポートしない（循環依存回避）
 */

// ============================================================================
// Firestore型定義
// ============================================================================

/**
 * Firestore Timestamp型の型定義
 */
export interface FirestoreTimestamp {
  seconds: number
  nanoseconds: number
  toDate(): Date
  toMillis(): number
  isEqual(other: FirestoreTimestamp): boolean
  valueOf(): string
}

/**
 * Firestoreから取得される日付型（Timestamp、Date、stringのいずれか）
 */
export type FirestoreDate = FirestoreTimestamp | Date | string

// ============================================================================
// 基本型定義
// ============================================================================

/**
 * アクセスレベル
 */
export type AccessLevel = 'public' | 'private' | 'unlisted'

/**
 * 性別
 */
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say'

/**
 * テーマ
 */
export type Theme = 'light' | 'dark'

/**
 * 通貨コード
 */
export type Currency = 'JPY' | 'USD' | 'EUR' | 'GBP' | 'AUD' | 'CAD' | 'CHF' | 'CNY' | 'KRW'

/**
 * 結果型（Rustスタイル）
 */
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E }

