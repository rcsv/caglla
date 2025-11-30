/**
 * Dining（食事）関連のチェックリストルール
 */

import { ChecklistGenerationRule } from "./types";

export const DINING_RULES: ChecklistGenerationRule[] = [
	{
		id: "breakfast_rule",
		secondaryCategory: "breakfast",
		items: [
			{
				title: "ホテルの朝食プランの確認",
				description: "朝食込みプランか、別料金か確認",
				category: "preparation",
				priority: "medium",
				condition: { type: "always" },
			},
			{
				title: "周辺のカフェ・レストラン検索",
				description: "ホテル朝食がない場合の代替案",
				category: "preparation",
				priority: "low",
				condition: { type: "always" },
			},
		],
	},
	{
		id: "lunch_rule",
		secondaryCategory: "lunch",
		items: [
			{
				title: "レストラン予約（人気店の場合）",
				description: "混雑時間帯を避けるため",
				category: "preparation",
				priority: "medium",
				condition: { type: "always" },
			},
			{
				title: "アレルギー情報の翻訳メモ",
				description: "食物アレルギーがある場合",
				category: "preparation",
				priority: "high",
				condition: { type: "always" },
			},
		],
	},
	{
		id: "dinner_rule",
		secondaryCategory: "dinner",
		items: [
			{
				title: "レストラン予約（必須）",
				description: "人気レストランは1週間前までに予約",
				category: "preparation",
				priority: "high",
				condition: { type: "always" },
			},
			{
				title: "ドレスコード確認",
				description: "高級レストランの場合",
				category: "preparation",
				priority: "medium",
				condition: { type: "always" },
			},
			{
				title: "フォーマルな服装",
				description: "ドレスコードがある場合",
				category: "packing",
				priority: "medium",
				condition: { type: "always" },
			},
		],
	},
	{
		id: "cafe_rule",
		secondaryCategory: "cafe",
		items: [
			{
				title: "人気カフェの営業時間確認",
				description: "定休日や営業時間を事前確認",
				category: "preparation",
				priority: "low",
				condition: { type: "always" },
			},
			{
				title: "カメラ・スマホ（SNS投稿用）",
				description: "インスタ映えするカフェの場合",
				category: "packing",
				priority: "low",
				condition: { type: "always" },
			},
		],
	},
	{
		id: "bar_rule",
		secondaryCategory: "bar",
		items: [
			{
				title: "バーの予約（高級バーの場合）",
				description: "人気バーは予約推奨",
				category: "preparation",
				priority: "medium",
				condition: { type: "always" },
			},
			{
				title: "ドレスコード確認",
				description: "カジュアルすぎる服装はNG",
				category: "preparation",
				priority: "medium",
				condition: { type: "always" },
			},
			{
				title: "現金（チップ用）",
				description: "バーテンダーへのチップ",
				category: "packing",
				priority: "medium",
				condition: { type: "destination", continents: ["NA", "EU"] },
			},
		],
	},
	{
		id: "food_tour_rule",
		secondaryCategory: "food_tour",
		items: [
			{
				title: "フードツアーの予約",
				description: "人気ツアーは早めの予約が必要",
				category: "preparation",
				priority: "high",
				condition: { type: "always" },
			},
			{
				title: "空腹状態で参加",
				description: "多くの店舗を回るため",
				category: "preparation",
				priority: "medium",
				condition: { type: "always" },
			},
			{
				title: "歩きやすい靴",
				description: "長時間歩くことが多い",
				category: "packing",
				priority: "high",
				condition: { type: "always" },
			},
			{
				title: "エコバッグ",
				description: "お土産を入れるのに便利",
				category: "packing",
				priority: "low",
				condition: { type: "always" },
			},
		],
	},
	{
		id: "street_food_rule",
		secondaryCategory: "street_food",
		items: [
			{
				title: "衛生的な屋台の見分け方を調査",
				description: "食中毒リスクを減らす",
				category: "preparation",
				priority: "high",
				condition: { type: "always" },
			},
			{
				title: "現金（小銭）",
				description: "屋台はカード不可がほとんど",
				category: "packing",
				priority: "high",
				condition: { type: "always" },
			},
			{
				title: "ウェットティッシュ",
				description: "手を拭くため",
				category: "packing",
				priority: "high",
				condition: { type: "always" },
			},
			{
				title: "胃腸薬",
				description: "万が一に備えて",
				category: "packing",
				priority: "medium",
				condition: { type: "always" },
			},
		],
	},
	{
		id: "fine_dining_rule",
		secondaryCategory: "fine_dining",
		items: [
			{
				title: "レストラン予約（1ヶ月前）",
				description: "有名店は数ヶ月前から予約が埋まる",
				category: "preparation",
				priority: "high",
				condition: { type: "always" },
			},
			{
				title: "ドレスコード確認（必須）",
				description: "ジャケット、ネクタイが必要な場合も",
				category: "preparation",
				priority: "high",
				condition: { type: "always" },
			},
			{
				title: "メニューの事前確認",
				description: "コース内容・価格を確認",
				category: "preparation",
				priority: "medium",
				condition: { type: "always" },
			},
			{
				title: "フォーマルな服装（ジャケット・ネクタイ）",
				description: "ドレスコードに応じた服装",
				category: "packing",
				priority: "high",
				condition: { type: "always" },
			},
			{
				title: "革靴・ヒール",
				description: "スニーカーはNG",
				category: "packing",
				priority: "high",
				condition: { type: "always" },
			},
		],
	},

	// ============================================================================
	// Shopping（買い物）関連 - 追加
	// ============================================================================
	{
		id: "grocery_rule",
		secondaryCategory: "grocery",
		items: [
			{
				title: "スーパーの営業時間確認",
				description: "日曜日は休みの国もある",
				category: "preparation",
				priority: "medium",
				condition: { type: "always" },
			},
			{
				title: "エコバッグ",
				description: "レジ袋が有料の国が多い",
				category: "packing",
				priority: "high",
				condition: { type: "always" },
			},
			{
				title: "小銭入れ",
				description: "コイン支払いが必要な場合",
				category: "packing",
				priority: "medium",
				condition: { type: "always" },
			},
		],
	},
	{
		id: "local_market_rule",
		secondaryCategory: "local_market",
		items: [
			{
				title: "市場の営業日・時間確認",
				description: "特定の曜日のみ開催の市場もある",
				category: "preparation",
				priority: "high",
				condition: { type: "always" },
			},
			{
				title: "値段交渉の基本フレーズを学習",
				description: "現地の言葉で値引き交渉",
				category: "preparation",
				priority: "medium",
				condition: { type: "always" },
			},
			{
				title: "現金（小銭）",
				description: "市場はカード不可がほとんど",
				category: "packing",
				priority: "high",
				condition: { type: "always" },
			},
			{
				title: "エコバッグ・折りたたみバッグ",
				description: "購入品を入れるため",
				category: "packing",
				priority: "high",
				condition: { type: "always" },
			},
			{
				title: "歩きやすい靴",
				description: "市場内は長時間歩く",
				category: "packing",
				priority: "medium",
				condition: { type: "always" },
			},
		],
	},
	{
		id: "duty_free_rule",
		secondaryCategory: "duty_free",
		items: [
			{
				title: "パスポート（購入時に提示が必要）",
				description: "免税手続きに必須",
				category: "packing",
				priority: "high",
				condition: { type: "always" },
			},
			{
				title: "航空券予約確認書",
				description: "出国証明として必要な場合も",
				category: "packing",
				priority: "medium",
				condition: { type: "always" },
			},
			{
				title: "免税対象商品・金額の事前確認",
				description: "国によって免税条件が異なる",
				category: "preparation",
				priority: "medium",
				condition: { type: "always" },
			},
		],
	},
];
