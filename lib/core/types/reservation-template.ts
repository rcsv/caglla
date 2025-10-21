/**
 * 予約テンプレート関連の型定義
 */

import type { FirestoreDate, ReservationType, ReservationSite } from './index'

/**
 * 予約テンプレート
 */
export interface ReservationTemplate {
  id: string
  user_id: string
  name: string                        // テンプレート名（例: "いつものANA便"）
  description?: string                // テンプレートの説明
  type: ReservationType               // 予約タイプ（必須）
  
  // デフォルト値
  reservation_site?: ReservationSite  // 予約サイト
  
  // 飛行機専用フィールド
  airline?: string                    // 航空会社名（例: "ANA", "JAL"）
  departure_airport?: string          // 出発空港コード（例: "HND", "NRT"）
  arrival_airport?: string            // 到着空港コード（例: "ITM", "KIX"）
  
  // その他のデフォルト値
  notes?: string                      // デフォルトのメモ
  
  // メタデータ
  use_count?: number                  // 使用回数（統計用）
  last_used_at?: FirestoreDate        // 最終使用日時
  created_at: FirestoreDate           // 作成日時
  updated_at: FirestoreDate           // 更新日時
}

/**
 * テンプレート作成用の入力型
 */
export interface ReservationTemplateInput {
  name: string
  description?: string
  type: ReservationType
  reservation_site?: ReservationSite
  airline?: string
  departure_airport?: string
  arrival_airport?: string
  notes?: string
}

