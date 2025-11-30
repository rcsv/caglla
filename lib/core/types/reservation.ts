/**
 * 予約機能関連の型定義
 */

import type { FirestoreDate } from "./common";

// ============================================================================
// 予約機能関連
// ============================================================================

/**
 * 予約タイプ
 */
export type ReservationType =
	| "flight" // 飛行機
	| "rental_car" // レンタカー
	| "hotel" // ホテル
	| "dining" // 食事
	| "other"; // その他

/**
 * 予約サイト
 * 注: TypeScript の Record で扱いやすいようドット含みは除外
 */
export type ReservationSite =
	| "expedia"
	| "booking_com" // booking.com
	| "agoda"
	| "trivago"
	| "airbnb"
	| "kayak"
	| "skyscanner"
	| "tripadvisor"
	| "opentable"
	| "tabelog"
	| "hot_pepper" // hot-pepper
	| "ana"
	| "jal"
	| "rakuten_travel" // rakuten-travel
	| "jalan"
	| "other"; // その他（カスタムサイト）

/**
 * 予約情報
 */
export interface ReservationInfo {
	id?: string; // 予約ID（オプション）
	type: ReservationType; // 予約タイプ（必須）
	confirmation_number?: string; // 予約確認番号
	reservation_site?: ReservationSite; // 予約サイト
	reservation_url?: string; // 予約サイトURL（https のみ許可）

	// 予約期間（飛行機以外）- ISO 8601 timestamp
	start_date?: FirestoreDate; // 開始日時
	end_date?: FirestoreDate; // 終了日時

	// 飛行機専用フィールド - ISO 8601 timestamp に統一
	flight_number?: string; // 便名（例: ANA123, JAL456）
	departure_airport?: string; // 出発空港コード（3文字、例: NRT, HND）
	arrival_airport?: string; // 到着空港コード（3文字、例: ITM, KIX）
	departure_at?: FirestoreDate; // 出発日時（ISO 8601 timestamp）
	arrival_at?: FirestoreDate; // 到着日時（ISO 8601 timestamp）
	airline?: string; // 航空会社名

	// メタデータ
	notes?: string; // メモ
	created_at: FirestoreDate; // 初回作成日時（更新時も保持）
	updated_at: FirestoreDate; // 最終更新日時
}
