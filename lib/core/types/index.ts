/**
 * 型定義の統合エクスポート
 * 
 * このファイルはすべての型を再エクスポートし、後方互換性を維持します。
 * 既存のインポート文 `import { X } from '@/lib/core/types'` は変更不要です。
 */

// 共通型
export * from './common'

// ユーザー関連
export * from './user'

// 多言語対応
export * from './language'

// 場所・地理情報
export * from './place'

// アクティビティ・チェックリスト
export * from './activity'

// 旅行・旅程
export * from './trip'

// 予約
export * from './reservation'

// 予約テンプレート
export * from './reservation-template'

// API・フォーム
export * from './api'

// UI コンポーネント
export * from './ui'

// 認証
export * from './auth'

// 天気
export * from './weather'

// 地理情報・ジオコーディング
export * from './geo'

// 通貨・タイムゾーン
export * from './currency'

// 国・ブラウザ情報
export * from './country'

// Unsplash
export * from './unsplash'

// 環境変数
export * from './env'

