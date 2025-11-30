/**
 * Transportation（乗り物）関連のチェックリストルール
 */

import { ChecklistGenerationRule } from "./types";

export const TRANSPORTATION_RULES: ChecklistGenerationRule[] = [
	{
		id: "flight_international_rule",
		secondaryCategory: "flight",
		items: [
			{
				title: "パスポートの有効期限確認（6ヶ月以上残存）",
				description: "多くの国で入国時に6ヶ月以上の残存期間が必要",
				category: "preparation",
				priority: "high",
				condition: { type: "always" },
			},
			{
				title: "航空券の印刷またはモバイルチケット準備",
				description: "Eチケット控えまたはアプリでの搭乗券",
				category: "preparation",
				priority: "high",
				condition: { type: "always" },
			},
			{
				title: "オンラインチェックイン（24時間前）",
				description: "座席指定や搭乗時間の短縮に",
				category: "preparation",
				priority: "medium",
				condition: { type: "always" },
			},
			{
				title: "ESTA申請（アメリカ入国）",
				description: "渡航72時間前までに申請推奨、有効期限2年",
				category: "preparation",
				priority: "high",
				condition: { type: "destination", countries: ["US"] },
			},
			{
				title: "eTA申請（カナダ入国）",
				description: "カナダへの空路入国に必要",
				category: "preparation",
				priority: "high",
				condition: { type: "destination", countries: ["CA"] },
			},
			{
				title: "ETIAS申請（EU入国）",
				description: "2025年からEU圏入国に必要（予定）",
				category: "preparation",
				priority: "high",
				condition: { type: "destination", continents: ["EU"] },
			},
			{
				title: "海外旅行保険加入",
				description: "医療費が高額な国では必須",
				category: "preparation",
				priority: "high",
				condition: { type: "destination", continents: ["NA", "EU"] },
			},
			{
				title: "ネックピロー",
				description: "長時間フライトの快適性向上",
				category: "packing",
				priority: "low",
				condition: { type: "always" },
			},
			{
				title: "耳栓・アイマスク",
				description: "機内での睡眠サポート",
				category: "packing",
				priority: "low",
				condition: { type: "always" },
			},
		],
	},
	{
		id: "car_rental_rule",
		secondaryCategory: "car_rental",
		items: [
			{
				title: "国際運転免許証の取得",
				description: "海外でレンタカーを借りる場合に必要",
				category: "preparation",
				priority: "high",
				condition: { type: "always" },
			},
			{
				title: "レンタカー予約確認書の印刷",
				description: "貸出時に提示が必要",
				category: "preparation",
				priority: "high",
				condition: { type: "always" },
			},
			{
				title: "クレジットカード（デポジット用）",
				description: "レンタカーのデポジットに使用",
				category: "packing",
				priority: "high",
				condition: { type: "always" },
			},
			{
				title: "カーナビまたはスマホホルダー",
				description: "ナビゲーション用",
				category: "packing",
				priority: "medium",
				condition: { type: "always" },
			},
		],
	},
	{
		id: "personal_car_rule",
		secondaryCategory: "personal_car",
		items: [
			{
				title: "車検証・自賠責保険証の確認",
				description: "有効期限や携行の必要書類をチェック",
				category: "preparation",
				priority: "high",
				condition: { type: "always" },
			},
			{
				title: "ガソリン補給または充電",
				description: "長距離運転前に給油・充電を済ませる",
				category: "preparation",
				priority: "medium",
				condition: { type: "always" },
			},
			{
				title: "ETCカード・高速料金の準備",
				description: "高速道路利用時の支払い手段を用意",
				category: "packing",
				priority: "medium",
				condition: { type: "always" },
			},
		],
	},
	{
		id: "parking_rule",
		secondaryCategory: "parking",
		items: [
			{
				title: "駐車場の事前予約確認",
				description: "予約番号・入庫可能時間を確認",
				category: "preparation",
				priority: "high",
				condition: { type: "always" },
			},
			{
				title: "精算方法の準備（現金・アプリ）",
				description: "現地の支払い方法に合わせて準備",
				category: "preparation",
				priority: "medium",
				condition: { type: "always" },
			},
			{
				title: "駐車位置メモ用のノート／アプリ",
				description: "駐車フロアや番号を記録できるようにする",
				category: "packing",
				priority: "low",
				condition: { type: "always" },
			},
		],
	},
];
