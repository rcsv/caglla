/**
 * PDFテンプレート関連の型定義
 */

import type { Trip, Day, Itinerary } from "@/lib/core/types";

/**
 * PDF生成設定
 */
export interface PdfConfig {
	theme?: "light" | "dark"; // 将来的なテーマ対応
	tripUrl?: string; // QRコード生成用のURL
}

/**
 * PDF生成のためのコンテキスト型（統一インターフェース）
 */
export interface PdfContext {
	trip: Trip;
	days: Day[];
	itinerariesByDay: Record<string, Itinerary[]>;
	config: PdfConfig;
	mapImages?: Record<string, string>; // base64 map images（将来的に使用）
}

/**
 * 後方互換性のための型（既存コードとの互換性を保つ）
 */
export interface TripPdfData {
	trip: Trip;
	days: Day[];
	itinerariesByDay: Record<string, Itinerary[]>;
	reservations?: any[]; // 予約情報（将来実装）
	checklist?: any[]; // チェックリスト（将来実装）
}

/**
 * TripPdfDataからPdfContextに変換するヘルパー関数
 */
export function createPdfContext(
	data: TripPdfData,
	config: PdfConfig = {},
): PdfContext {
	return {
		trip: data.trip,
		days: data.days,
		itinerariesByDay: data.itinerariesByDay,
		config,
	};
}

export interface PageTemplate {
	type:
		| "cover"
		| "toc"
		| "reservations"
		| "itinerary"
		| "emergency"
		| "checklist"
		| "memo"
		| "back-cover";
	title?: string;
	subtitle?: string;
	content: string;
	pageNumber?: number;
	isNewPage?: boolean;
}
