/**
 * チェックリスト生成ルールマスターデータ
 * 
 * アクティビティタグに基づき、チェックリスト項目を自動生成するためのルール定義
 */

export interface ChecklistCondition {
  type: 'count' | 'duration' | 'destination' | 'always'
  // count: 同じsecondaryCategoryの回数
  minCount?: number
  maxCount?: number
  // duration: 旅行期間（日数）
  minDays?: number
  maxDays?: number
  // destination: 目的地条件
  countries?: string[] // ISO 3166-1 alpha-2 国コード
  continents?: string[] // 大陸コード (AS=Asia, EU=Europe, NA=North America, SA=South America, AF=Africa, OC=Oceania, AN=Antarctica)
}

export interface ChecklistRuleItem {
  title: string
  description?: string
  category: 'preparation' | 'packing'
  priority?: 'high' | 'medium' | 'low'
  condition?: ChecklistCondition
}

export interface ChecklistGenerationRule {
  id: string
  secondaryCategory: string // 対象の2段階目カテゴリーID
  items: ChecklistRuleItem[]
}

/**
 * チェックリスト生成ルール一覧
 */
export const CHECKLIST_RULES: ChecklistGenerationRule[] = [
  // ============================================================================
  // Transportation（乗り物）関連
  // ============================================================================
  {
    id: 'flight_international_rule',
    secondaryCategory: 'flight',
    items: [
      {
        title: 'パスポートの有効期限確認（6ヶ月以上残存）',
        description: '多くの国で入国時に6ヶ月以上の残存期間が必要',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '航空券の印刷またはモバイルチケット準備',
        description: 'Eチケット控えまたはアプリでの搭乗券',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'オンラインチェックイン（24時間前）',
        description: '座席指定や搭乗時間の短縮に',
        category: 'preparation',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: 'ESTA申請（アメリカ入国）',
        description: '渡航72時間前までに申請推奨、有効期限2年',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'destination', countries: ['US'] }
      },
      {
        title: 'eTA申請（カナダ入国）',
        description: 'カナダへの空路入国に必要',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'destination', countries: ['CA'] }
      },
      {
        title: 'ETIAS申請（EU入国）',
        description: '2025年からEU圏入国に必要（予定）',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'destination', continents: ['EU'] }
      },
      {
        title: '海外旅行保険加入',
        description: '医療費が高額な国では必須',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'destination', continents: ['NA', 'EU'] }
      },
      {
        title: 'ネックピロー',
        description: '長時間フライトの快適性向上',
        category: 'packing',
        priority: 'low',
        condition: { type: 'always' }
      },
      {
        title: '耳栓・アイマスク',
        description: '機内での睡眠サポート',
        category: 'packing',
        priority: 'low',
        condition: { type: 'always' }
      },
    ]
  },
  {
    id: 'car_rental_rule',
    secondaryCategory: 'car_rental',
    items: [
      {
        title: '国際運転免許証の取得',
        description: '海外でレンタカーを借りる場合に必要',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'レンタカー予約確認書の印刷',
        description: '貸出時に提示が必要',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'クレジットカード（デポジット用）',
        description: 'レンタカーのデポジットに使用',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'カーナビまたはスマホホルダー',
        description: 'ナビゲーション用',
        category: 'packing',
        priority: 'medium',
        condition: { type: 'always' }
      },
    ]
  },

  // ============================================================================
  // Shopping（買い物）関連
  // ============================================================================
  {
    id: 'shopping_rule',
    secondaryCategory: 'souvenir',
    items: [
      {
        title: 'エコバッグ・折りたたみバッグ',
        description: 'お土産を入れるのに便利',
        category: 'packing',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: '現金（お土産予算）',
        description: '市場や小規模店舗ではカード不可の場合あり',
        category: 'packing',
        priority: 'medium',
        condition: { type: 'always' }
      },
    ]
  },

  // ============================================================================
  // Accommodation（宿泊）関連
  // ============================================================================
  {
    id: 'check_in_rule',
    secondaryCategory: 'check_in',
    items: [
      {
        title: 'ホテル予約確認書をプリントアウト',
        description: 'チェックイン時に提示が必要な場合があります',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'パスポートのコピー',
        description: 'ホテルによっては原本の代わりに使用可能',
        category: 'preparation',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: '現金（デポジット用）',
        description: 'クレジットカードでも可',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '下着 × {count}日分',
        description: '宿泊日数分の下着を準備',
        category: 'packing',
        priority: 'high',
        condition: { type: 'count', minCount: 1 }
      },
      {
        title: '靴下 × {count}日分',
        description: '宿泊日数分の靴下を準備',
        category: 'packing',
        priority: 'high',
        condition: { type: 'count', minCount: 1 }
      },
      {
        title: 'シャンプー・ボディソープ',
        description: 'ホテルのアメニティを確認',
        category: 'packing',
        priority: 'medium',
        condition: { type: 'count', minCount: 1 }
      },
      {
        title: '歯ブラシ・歯磨き粉',
        description: 'アメニティにない場合があります',
        category: 'packing',
        priority: 'high',
        condition: { type: 'count', minCount: 1 }
      },
      {
        title: '洗濯用洗剤（携帯用）',
        description: '長期滞在の場合に便利',
        category: 'packing',
        priority: 'medium',
        condition: { type: 'count', minCount: 5 }
      },
      {
        title: '洗濯バサミ・洗濯ロープ',
        description: '部屋干し用',
        category: 'packing',
        priority: 'low',
        condition: { type: 'count', minCount: 5 }
      },
    ]
  },
  {
    id: 'check_out_rule',
    secondaryCategory: 'check_out',
    items: [
      {
        title: '忘れ物チェック（引き出し・金庫・浴室）',
        description: 'チェックアウト前に必ず確認',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '冷蔵庫の飲食確認',
        description: 'ミニバーの飲食は追加料金が発生',
        category: 'preparation',
        priority: 'medium',
        condition: { type: 'always' }
      },
    ]
  },
  {
    id: 'camping_rule',
    secondaryCategory: 'camping',
    items: [
      {
        title: 'テント',
        description: 'キャンプ場に設備がない場合',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '寝袋',
        description: '気温に応じた寝袋を選択',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'マット・エアマット',
        description: '地面からの冷気対策',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '懐中電灯・ヘッドライト',
        description: '夜間の照明',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'バーベキューコンロ・ガスバーナー',
        description: '調理器具（キャンプ場規定確認）',
        category: 'packing',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: '食器・カトラリー',
        description: '使い捨てまたは洗えるもの',
        category: 'packing',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: '虫除けスプレー',
        description: '蚊・虫対策',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '救急セット',
        description: '擦り傷・火傷用の応急処置',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
    ]
  },

  // ============================================================================
  // Adventure（探検）関連
  // ============================================================================
  {
    id: 'hiking_rule',
    secondaryCategory: 'hiking',
    items: [
      {
        title: 'トレッキングシューズ',
        description: '登山道に適した靴',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'レインウェア',
        description: '山の天気は変わりやすい',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '帽子・サングラス',
        description: '日差し対策',
        category: 'packing',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: '水筒・ハイドレーション',
        description: '十分な水分補給',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '行動食・エネルギーバー',
        description: 'トレイル中のエネルギー補給',
        category: 'packing',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: 'ファーストエイドキット',
        description: '応急処置用',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
    ]
  },
  {
    id: 'water_sports_rule',
    secondaryCategory: 'water_sports',
    items: [
      {
        title: '水着',
        description: 'ビーチやマリンスポーツ用',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'ラッシュガード',
        description: '日焼け・擦り傷防止',
        category: 'packing',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: 'ビーチタオル',
        description: 'プールやビーチで使用',
        category: 'packing',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: '日焼け止め（SPF50+）',
        description: '強い紫外線から肌を守る',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '防水スマホケース',
        description: '水辺での撮影に便利',
        category: 'packing',
        priority: 'low',
        condition: { type: 'always' }
      },
      {
        title: 'ゴーグル・シュノーケルセット',
        description: 'レンタルがない場合に持参',
        category: 'packing',
        priority: 'medium',
        condition: { type: 'always' }
      },
    ]
  },
  {
    id: 'diving_rule',
    secondaryCategory: 'diving',
    items: [
      {
        title: 'ダイビングライセンスカード',
        description: 'Cカードの携帯必須',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'ログブック',
        description: 'ダイビング履歴の記録',
        category: 'packing',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: '水中カメラ・GoPro',
        description: '水中撮影用',
        category: 'packing',
        priority: 'low',
        condition: { type: 'always' }
      },
    ]
  },

  // ============================================================================
  // Entertainment（遊び）関連
  // ============================================================================
  {
    id: 'beach_rule',
    secondaryCategory: 'beach',
    items: [
      {
        title: '水着',
        description: 'ビーチで泳ぐ場合',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'サンダル・ビーチサンダル',
        description: 'ビーチ用の履物',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '日焼け止め',
        description: 'SPF50+推奨',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'サングラス',
        description: '紫外線から目を守る',
        category: 'packing',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: 'ビーチバッグ',
        description: '荷物を砂から守る',
        category: 'packing',
        priority: 'low',
        condition: { type: 'always' }
      },
    ]
  },

  // ============================================================================
  // Culture（文化）関連
  // ============================================================================
  {
    id: 'temple_shrine_rule',
    secondaryCategory: 'temple_shrine',
    items: [
      {
        title: '長ズボンまたはロングスカート',
        description: '寺院・モスクでは肌の露出を控える',
        category: 'packing',
        priority: 'high',
        condition: { type: 'destination', continents: ['AS', 'AF'] }
      },
      {
        title: 'ストール・スカーフ',
        description: '頭を覆う必要がある場合に',
        category: 'packing',
        priority: 'medium',
        condition: { type: 'destination', continents: ['AS', 'AF'] }
      },
    ]
  },

  // ============================================================================
  // Wellness（健康）関連
  // ============================================================================
  {
    id: 'spa_rule',
    secondaryCategory: 'spa',
    items: [
      {
        title: '水着（スパによっては必要）',
        description: 'スパの規定を確認',
        category: 'packing',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: 'サンダル',
        description: 'スパ内での移動用',
        category: 'packing',
        priority: 'low',
        condition: { type: 'always' }
      },
    ]
  },

  // ============================================================================
  // Service（サービス）関連
  // ============================================================================
  {
    id: 'currency_exchange_rule',
    secondaryCategory: 'currency_exchange',
    items: [
      {
        title: '両替する現金の準備',
        description: '目的地の通貨レートを確認',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'パスポート（両替時に提示が必要な場合あり）',
        description: '大金の両替では本人確認が必要',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
    ]
  },
  {
    id: 'sim_purchase_rule',
    secondaryCategory: 'sim_purchase',
    items: [
      {
        title: 'SIMフリースマートフォン',
        description: 'SIMロックがかかっていないか確認',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'パスポート（購入時に提示が必要）',
        description: 'SIM購入には本人確認が必要',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
    ]
  },

  // ============================================================================
  // 共通（長期滞在）
  // ============================================================================
  {
    id: 'long_stay_rule',
    secondaryCategory: 'check_in',
    items: [
      {
        title: '常備薬（風邪薬、胃腸薬、頭痛薬）',
        description: '海外で薬を購入するのは困難',
        category: 'packing',
        priority: 'high',
        condition: { type: 'duration', minDays: 7 }
      },
      {
        title: 'マルチビタミン',
        description: '食生活の変化で栄養バランスが崩れがち',
        category: 'packing',
        priority: 'medium',
        condition: { type: 'duration', minDays: 14 }
      },
      {
        title: '折りたたみ傘',
        description: '急な天候変化に対応',
        category: 'packing',
        priority: 'medium',
        condition: { type: 'duration', minDays: 7 }
      },
      {
        title: '充電器・モバイルバッテリー',
        description: '長期滞在では必須',
        category: 'packing',
        priority: 'high',
        condition: { type: 'duration', minDays: 3 }
      },
      {
        title: '変換プラグ',
        description: '目的地のコンセント形状を確認',
        category: 'packing',
        priority: 'high',
        condition: { type: 'duration', minDays: 3 }
      },
    ]
  },
]

/**
 * SecondaryCategoryIDからチェックリスト生成ルールを取得
 */
export function getChecklistRules(secondaryCategoryId: string): ChecklistGenerationRule[] {
  return CHECKLIST_RULES.filter(rule => rule.secondaryCategory === secondaryCategoryId)
}

/**
 * 全てのルールを取得
 */
export function getAllChecklistRules(): ChecklistGenerationRule[] {
  return CHECKLIST_RULES
}

