/**
 * アクティビティタグとチェックリスト関連の型定義
 */

import type { FirestoreDate } from "./common";

// ============================================================================
// アクティビティタグ関連
// ============================================================================

/**
 * 1段階目カテゴリー（大分類）
 */
export type PrimaryCategoryType =
	| "transportation" // 乗り物に乗る
	| "shopping" // 買い物をする
	| "dining" // 食事をする
	| "accommodation" // 宿泊する
	| "exploration" // 探索する
	| "adventure" // 探検する
	| "entertainment" // 遊ぶ
	| "culture" // 文化に触れる
	| "wellness" // 健康志向
	| "service"; // サービス提供

/**
 * アクティビティタグ（2段階分類）
 */
export interface ActivityTag {
	primaryCategory: PrimaryCategoryType;
	secondaryCategory: string; // 1段階目に応じた詳細カテゴリー
}

// ============================================================================
// チェックリスト関連
// ============================================================================

/**
 * チェックリストカテゴリー
 */
export type ChecklistCategory = "preparation" | "packing";

/**
 * 優先度
 */
export type ChecklistPriority = "high" | "medium" | "low";

/**
 * Checklist Item Link（チェックリスト項目のリンク）
 */
export interface ChecklistItemLink {
	type: "amazon" | "official" | "review" | "other";
	label: string;
	url: string;
	affiliateId?: string; // アフィリエイトID（オプション）
}

/**
 * チェックリスト項目
 */
export interface ChecklistItem {
	id: string;
	title: string; // i18nキーまたは直接テキスト（後方互換性のため）
	description?: string; // i18nキーまたは直接テキスト
	longDescription?: string; // i18nキーまたは直接テキスト（Markdown対応）
	category: ChecklistCategory;
	done: boolean;
	generatedFrom?: string; // 生成元のsecondaryCategory ID
	ruleId?: string; // 生成元のルールID（i18nキー解決用）
	isCustom?: boolean; // ユーザーが手動追加した項目
	priority?: ChecklistPriority;
	links?: ChecklistItemLink[]; // 関連リンク（Amazon、公式サイトなど）
	userMemo?: string; // ユーザーが追加できるメモ
	itemKey?: string; // i18nキー用の一意なキー（マスタデータから取得）
	variables?: Record<string, string | number>; // i18n変数置換用（例: {count: 3, duration: 5}）
}

/**
 * Trip Checklist（旅行全体のチェックリスト）
 */
export interface TripChecklist {
	id: string;
	trip_id: string;
	items: ChecklistItem[];
	last_generated_at: FirestoreDate;
	created_at: FirestoreDate;
	updated_at: FirestoreDate;
}

/**
 * Checklist Preset Item（プリセット内のアイテム）
 */
export interface ChecklistPresetItem {
	title: string;
	description?: string;
	category: ChecklistCategory;
	priority?: ChecklistPriority;
}

/**
 * Checklist Preset（ユーザー作成のチェックリストテンプレート）
 */
export interface ChecklistPreset {
	id: string;
	user_id: string;
	title: string;
	description?: string;
	tags?: string[]; // 検索用タグ（例: ["winter", "hokkaido", "skiing"]）
	items: ChecklistPresetItem[];
	is_public: boolean; // 公開/非公開フラグ
	created_at: FirestoreDate;
	updated_at: FirestoreDate;
	usage_count?: number; // 使用回数（人気度の指標）
}

/**
 * アクティビティ統計
 */
export interface ActivityStats {
	primaryCategories: {
		[key in PrimaryCategoryType]?: {
			count: number;
			percentage: number;
		};
	};
	secondaryCategories: {
		[key: string]: number;
	};
	totalActivities: number;
}
