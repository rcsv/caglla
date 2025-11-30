/**
 * Adventure（探検）関連のチェックリストルール
 */

import { ChecklistGenerationRule } from "./types";

export const ADVENTURE_RULES: ChecklistGenerationRule[] = [
	{
		id: "hiking_rule",
		secondaryCategory: "hiking",
		items: [
			{
				title: "トレッキングシューズ",
				description: "登山道に適した靴",
				category: "packing",
				priority: "high",
				condition: { type: "always" },
			},
			{
				title: "レインウェア",
				description: "山の天気は変わりやすい",
				category: "packing",
				priority: "high",
				condition: { type: "always" },
			},
			{
				title: "帽子・サングラス",
				description: "日差し対策",
				category: "packing",
				priority: "medium",
				condition: { type: "always" },
			},
			{
				title: "水筒・ハイドレーション",
				description: "十分な水分補給",
				category: "packing",
				priority: "high",
				condition: { type: "always" },
			},
			{
				title: "行動食・エネルギーバー",
				description: "トレイル中のエネルギー補給",
				category: "packing",
				priority: "medium",
				condition: { type: "always" },
			},
			{
				title: "ファーストエイドキット",
				description: "応急処置用",
				category: "packing",
				priority: "high",
				condition: { type: "always" },
			},
		],
	},
	{
		id: "water_sports_rule",
		secondaryCategory: "water_sports",
		items: [
			{
				title: "水着",
				description: "ビーチやマリンスポーツ用",
				category: "packing",
				priority: "high",
				condition: { type: "always" },
			},
			{
				title: "ラッシュガード",
				description: "日焼け・擦り傷防止",
				category: "packing",
				priority: "medium",
				condition: { type: "always" },
			},
			{
				title: "ビーチタオル",
				description: "プールやビーチで使用",
				category: "packing",
				priority: "medium",
				condition: { type: "always" },
			},
			{
				title: "日焼け止め（SPF50+）",
				description: "強い紫外線から肌を守る",
				category: "packing",
				priority: "high",
				condition: { type: "always" },
			},
			{
				title: "防水スマホケース",
				description: "水辺での撮影に便利",
				category: "packing",
				priority: "low",
				condition: { type: "always" },
			},
			{
				title: "ゴーグル・シュノーケルセット",
				description: "レンタルがない場合に持参",
				category: "packing",
				priority: "medium",
				condition: { type: "always" },
			},
		],
	},
	{
		id: "diving_rule",
		secondaryCategory: "diving",
		items: [
			{
				title: "ダイビングライセンスカード",
				description: "Cカードの携帯必須",
				category: "packing",
				priority: "high",
				condition: { type: "always" },
			},
			{
				title: "ログブック",
				description: "ダイビング履歴の記録",
				category: "packing",
				priority: "medium",
				condition: { type: "always" },
			},
			{
				title: "水中カメラ・GoPro",
				description: "水中撮影用",
				category: "packing",
				priority: "low",
				condition: { type: "always" },
			},
		],
	},
];
