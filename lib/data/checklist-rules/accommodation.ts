/**
 * Accommodation（宿泊）関連のチェックリストルール
 */

import type { ChecklistGenerationRule } from "./types";

export const ACCOMMODATION_RULES: ChecklistGenerationRule[] = [
	{
		id: "check_in_rule",
		secondaryCategory: "check_in",
		items: [
			{
				title: "ホテル予約確認書をプリントアウト",
				description: "チェックイン時に提示が必要な場合があります",
				longDescription: `
**なぜ必要なのか？**  
一部のホテルでは、デジタル提示を認めていても「紙」の提出を求められるケースがあります。  
特に海外では、通信環境が悪くスマホ画面が開けない場面もあるため、紙で持っておくと安心です。
				`,
				category: "preparation",
				priority: "high",
				condition: { type: "always" },
			},
			{
				title: "パスポートのコピー",
				description: "ホテルによっては原本の代わりに使用可能",
				longDescription: `
パスポート原本の提示を求められることは多いですが、コピーでもチェックインが可能なホテルもあります。  
原本を持ち歩きたくない滞在中にも役立ちます。
				`,
				category: "preparation",
				priority: "medium",
				condition: { type: "always" },
			},
			{
				title: "現金（デポジット用）",
				description: "クレジットカードでも可",
				longDescription: `
海外のホテルでは「デポジット（保証金）」が必要な場合があります。  
クレジットカードで済むことがほとんどですが、**小規模ホテルでは現金しか受け付けない**ことも。
				`,
				category: "packing",
				priority: "high",
				condition: { type: "always" },
			},
			{
				title: "下着 × {count}日分",
				description: "宿泊日数分の下着を準備",
				longDescription: `
旅行の日数に合わせて枚数を調整します。  
荷物を減らしたい人は、途中で洗濯するという選択肢もアリ。
				`,
				category: "packing",
				priority: "high",
				condition: { type: "count", minCount: 1 },
			},
			{
				title: "靴下 × {count}日分",
				description: "宿泊日数分の靴下を準備",
				longDescription: `
観光で歩く機会が多い旅行では、**靴下は消耗品**として捉えましょう。  
予備も含めて多めに持っておくと安心。
				`,
				category: "packing",
				priority: "high",
				condition: { type: "count", minCount: 1 },
			},
			{
				title: "シャンプー・ボディソープ",
				description: "ホテルのアメニティを確認",
				longDescription: `
最近は備え付けのアメニティが増えていますが、  
**香りが合わない**・**肌に合わない**というケースもあります。  
気になる人は普段使いを携帯すると快適。
				`,
				category: "packing",
				priority: "medium",
				condition: { type: "count", minCount: 1 },
			},
			{
				title: "歯ブラシ・歯磨き粉",
				description: "アメニティにない場合があります",
				longDescription: `
特に欧米では、ホテルに歯ブラシが置いていないことが一般的です。  
普段使いを持参しておくと安心です。
				`,
				category: "packing",
				priority: "high",
				condition: { type: "count", minCount: 1 },
			},
			{
				title: "洗濯用洗剤（携帯用）",
				description: "長期滞在の場合に便利",
				longDescription: `
長期旅行や、身軽さを重視したい場合に便利。  
**手洗い用ジェルやシートタイプ**を選ぶと荷物が増えません。
				`,
				category: "packing",
				priority: "medium",
				condition: { type: "count", minCount: 5 },
			},
			{
				title: "洗濯バサミ・洗濯ロープ",
				description: "部屋干し用",
				longDescription: `
ホテルには干す場所が限られていることがあります。  
ロープタイプは軽量で、どんな部屋でも使いやすいのが利点。
				`,
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
				longDescription: `
チェックアウト時に忘れ物が発生しやすい場所トップ3。  
- **金庫**：パスポート・現金  
- **浴室**：洗面道具  
- **引き出し**：充電器・薬  
最後にもう一度ぐるっと見回すだけで安心度が大きく変わります。
				`,
				category: "preparation",
				priority: "high",
				condition: { type: "always" },
			},
			{
				title: "冷蔵庫の飲食確認",
				description: "ミニバーの飲食は追加料金が発生",
				longDescription: `
ミニバーは値段が高めで、飲んだ分だけチェックアウト時に精算されます。  
誤課金を防ぐためにも、中身を確認しておきましょう。
				`,
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
				longDescription: `
宿泊用の要となる装備。  
**設営しやすさ**と**耐候性**がポイントです。
				`,
				category: "packing",
				priority: "high",
				condition: { type: "always" },
			},
			{
				title: "寝袋",
				description: "気温に応じた寝袋を選択",
				longDescription: `
夜間の気温次第で快適性が大きく変わるアイテム。  
「快適温度」「限界温度」の表示を基準に選ぶと失敗しません。
				`,
				category: "packing",
				priority: "high",
				condition: { type: "always" },
			},
			{
				title: "マット・エアマット",
				description: "地面からの冷気対策",
				longDescription: `
地面に直接寝ると、体温が奪われて寝付きが悪くなります。  
マットは**断熱性能（R値）**を目安に選ぶと良いです。
				`,
				category: "packing",
				priority: "high",
				condition: { type: "always" },
			},
			{
				title: "懐中電灯・ヘッドライト",
				description: "夜間の照明",
				longDescription: `
夜間の移動や調理に必須。  
両手が空くヘッドライトは特に便利です。
				`,
				category: "packing",
				priority: "high",
				condition: { type: "always" },
			},
			{
				title: "バーベキューコンロ・ガスバーナー",
				description: "調理器具（キャンプ場規定確認）",
				longDescription: `
キャンプ場によっては火器の使用が制限される場合があります。  
事前にルールを確認しておきましょう。
				`,
				category: "packing",
				priority: "medium",
				condition: { type: "always" },
			},
			{
				title: "食器・カトラリー",
				description: "使い捨てまたは洗えるもの",
				longDescription: `
軽量のチタン製や樹脂製など、用途に応じて選択できます。  
洗う手間を省きたい、帰りの荷物を小さくしたいというときは、使い捨てもアリ。
				`,
				category: "packing",
				priority: "medium",
				condition: { type: "always" },
			},
			{
				title: "虫除けスプレー",
				description: "蚊・虫対策",
				longDescription: `
自然の中では虫との遭遇は避けられません。  
肌への刺激が少ないタイプを選ぶと安心して使えます。
				`,
				category: "packing",
				priority: "high",
				condition: { type: "always" },
			},
			{
				title: "救急セット",
				description: "擦り傷・火傷用の応急処置",
				longDescription: `
キャンプは自然相手なので、小さなケガは起こりがち。  
バンドエイド・消毒液・ガーゼなどをコンパクトにまとめておくと安心。
				`,
				category: "packing",
				priority: "high",
				condition: { type: "always" },
			},
		],
	},
];
