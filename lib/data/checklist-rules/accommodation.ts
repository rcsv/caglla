/**
 * Accommodation（宿泊）関連のチェックリストルール
 */

import { ChecklistGenerationRule } from "./types";

export const ACCOMMODATION_RULES: ChecklistGenerationRule[] = [
	{
		id: "check_in_rule",
		secondaryCategory: "check_in",
		items: [
			{
				title: "ホテル予約確認書をプリントアウト",
				description: "チェックイン時に提示が必要な場合があります",
				category: "preparation",
				priority: "high",
				condition: { type: "always" },
			},
			{
				title: "パスポートのコピー",
				description: "ホテルによっては原本の代わりに使用可能",
				category: "preparation",
				priority: "medium",
				condition: { type: "always" },
			},
			{
				title: "現金（デポジット用）",
				description: "クレジットカードでも可",
				category: "packing",
				priority: "high",
				condition: { type: "always" },
			},
			{
				title: "下着 × {count}日分",
				description: "宿泊日数分の下着を準備",
				category: "packing",
				priority: "high",
				condition: { type: "count", minCount: 1 },
			},
			{
				title: "靴下 × {count}日分",
				description: "宿泊日数分の靴下を準備",
				category: "packing",
				priority: "high",
				condition: { type: "count", minCount: 1 },
			},
			{
				title: "シャンプー・ボディソープ",
				description: "ホテルのアメニティを確認",
				category: "packing",
				priority: "medium",
				condition: { type: "count", minCount: 1 },
			},
			{
				title: "歯ブラシ・歯磨き粉",
				description: "アメニティにない場合があります",
				category: "packing",
				priority: "high",
				condition: { type: "count", minCount: 1 },
			},
			{
				title: "洗濯用洗剤（携帯用）",
				description: "長期滞在の場合に便利",
				category: "packing",
				priority: "medium",
				condition: { type: "count", minCount: 5 },
			},
			{
				title: "洗濯バサミ・洗濯ロープ",
				description: "部屋干し用",
				category: "packing",
				priority: "low",
				condition: { type: "count", minCount: 5 },
			},
		],
	},
	{
		id: "check_out_rule",
		secondaryCategory: "check_out",
		items: [
			{
				title: "忘れ物チェック（引き出し・金庫・浴室）",
				description: "チェックアウト前に必ず確認",
				category: "preparation",
				priority: "high",
				condition: { type: "always" },
			},
			{
				title: "冷蔵庫の飲食確認",
				description: "ミニバーの飲食は追加料金が発生",
				category: "preparation",
				priority: "medium",
				condition: { type: "always" },
			},
		],
	},
	{
		id: "camping_rule",
		secondaryCategory: "camping",
		items: [
			{
				title: "テント",
				description: "キャンプ場に設備がない場合",
				category: "packing",
				priority: "high",
				condition: { type: "always" },
			},
			{
				title: "寝袋",
				description: "気温に応じた寝袋を選択",
				category: "packing",
				priority: "high",
				condition: { type: "always" },
			},
			{
				title: "マット・エアマット",
				description: "地面からの冷気対策",
				category: "packing",
				priority: "high",
				condition: { type: "always" },
			},
			{
				title: "懐中電灯・ヘッドライト",
				description: "夜間の照明",
				category: "packing",
				priority: "high",
				condition: { type: "always" },
			},
			{
				title: "バーベキューコンロ・ガスバーナー",
				description: "調理器具（キャンプ場規定確認）",
				category: "packing",
				priority: "medium",
				condition: { type: "always" },
			},
			{
				title: "食器・カトラリー",
				description: "使い捨てまたは洗えるもの",
				category: "packing",
				priority: "medium",
				condition: { type: "always" },
			},
			{
				title: "虫除けスプレー",
				description: "蚊・虫対策",
				category: "packing",
				priority: "high",
				condition: { type: "always" },
			},
			{
				title: "救急セット",
				description: "擦り傷・火傷用の応急処置",
				category: "packing",
				priority: "high",
				condition: { type: "always" },
			},
		],
	},
];
