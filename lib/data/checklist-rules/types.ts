/**
 * チェックリスト生成ルール型定義
 */

import type { ChecklistItemLink } from "@/lib/core/types/activity";

export interface ChecklistCondition {
	type: "count" | "duration" | "destination" | "always";
	// count: 同じsecondaryCategoryの回数
	minCount?: number;
	maxCount?: number;
	// duration: 旅行期間（日数）
	minDays?: number;
	maxDays?: number;
	// destination: 目的地条件
	countries?: string[]; // ISO 3166-1 alpha-2 国コード
	continents?: string[]; // 大陸コード (AS=Asia, EU=Europe, NA=North America, SA=South America, AF=Africa, OC=Oceania, AN=Antarctica)
}

export interface ChecklistRuleItem {
	itemKey: string; // i18nキー用の一意なキー（例: "passport_validity"）
	title: string; // i18nキー（例: "checklist.items.flight_international_rule.passport_validity.title"）または直接テキスト（後方互換性のため）
	description?: string; // i18nキーまたは直接テキスト
	longDescription?: string; // i18nキーまたは直接テキスト（Markdown対応）
	category: "preparation" | "packing";
	priority?: "high" | "medium" | "low";
	links?: ChecklistItemLink[]; // 関連リンク（Amazon、公式サイトなど）
	condition?: ChecklistCondition;
}

export interface ChecklistGenerationRule {
	id: string;
	secondaryCategory: string; // 対象の2段階目カテゴリーID
	items: ChecklistRuleItem[];
}
