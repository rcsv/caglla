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
    id: 'aquarium_rule',
    secondaryCategory: 'aquarium',
    items: [
      {
        title: 'カメラ・スマホ',
        description: '海洋生物の撮影用',
        category: 'packing',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: '双眼鏡',
        description: '遠くの生物観察に便利',
        category: 'packing',
        priority: 'low',
        condition: { type: 'always' }
      },
      {
        title: '防水ケース',
        description: '水槽近くでの撮影用',
        category: 'packing',
        priority: 'low',
        condition: { type: 'always' }
      },
    ]
  },
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

  // ============================================================================
  // Transportation（乗り物）関連 - 追加
  // ============================================================================
  {
    id: 'train_rule',
    secondaryCategory: 'train',
    items: [
      {
        title: '鉄道パスまたは乗車券の事前購入',
        description: '乗車日前に購入すると割引がある場合も',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '路線図・乗り換えアプリのダウンロード',
        description: 'Google Maps、乗換案内など',
        category: 'preparation',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: 'ICカード（Suica、Pasmoなど）',
        description: '日本国内での移動に便利',
        category: 'packing',
        priority: 'medium',
        condition: { type: 'destination', countries: ['JP'] }
      },
    ]
  },
  {
    id: 'bus_rule',
    secondaryCategory: 'bus',
    items: [
      {
        title: 'バスチケット予約確認',
        description: '高速バスは予約が必要な場合が多い',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '乗車場所・時刻の事前確認',
        description: 'バスターミナルの場所を事前に調べる',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'ネックピロー・ブランケット',
        description: '長距離バスの場合',
        category: 'packing',
        priority: 'low',
        condition: { type: 'always' }
      },
    ]
  },
  {
    id: 'taxi_rule',
    secondaryCategory: 'taxi',
    items: [
      {
        title: 'タクシー配車アプリのインストール',
        description: 'Uber、Grab、DiDiなど',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '目的地の住所をメモ',
        description: '言葉が通じない場合に備えて',
        category: 'preparation',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: '現金（小銭）',
        description: 'クレジットカードが使えないタクシーもある',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
    ]
  },
  {
    id: 'ferry_rule',
    secondaryCategory: 'ferry',
    items: [
      {
        title: 'フェリーチケット予約',
        description: '人気路線は早めの予約が必要',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '乗船時刻・乗り場の確認',
        description: '出港時刻の30分前には到着',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '酔い止め薬',
        description: '船酔いしやすい人は必須',
        category: 'packing',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: '防寒具・上着',
        description: '海上は寒いことが多い',
        category: 'packing',
        priority: 'medium',
        condition: { type: 'always' }
      },
    ]
  },

  // ============================================================================
  // Dining（食事）関連
  // ============================================================================
  {
    id: 'breakfast_rule',
    secondaryCategory: 'breakfast',
    items: [
      {
        title: 'ホテルの朝食プランの確認',
        description: '朝食込みプランか、別料金か確認',
        category: 'preparation',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: '周辺のカフェ・レストラン検索',
        description: 'ホテル朝食がない場合の代替案',
        category: 'preparation',
        priority: 'low',
        condition: { type: 'always' }
      },
    ]
  },
  {
    id: 'lunch_rule',
    secondaryCategory: 'lunch',
    items: [
      {
        title: 'レストラン予約（人気店の場合）',
        description: '混雑時間帯を避けるため',
        category: 'preparation',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: 'アレルギー情報の翻訳メモ',
        description: '食物アレルギーがある場合',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
    ]
  },
  {
    id: 'dinner_rule',
    secondaryCategory: 'dinner',
    items: [
      {
        title: 'レストラン予約（必須）',
        description: '人気レストランは1週間前までに予約',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'ドレスコード確認',
        description: '高級レストランの場合',
        category: 'preparation',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: 'フォーマルな服装',
        description: 'ドレスコードがある場合',
        category: 'packing',
        priority: 'medium',
        condition: { type: 'always' }
      },
    ]
  },
  {
    id: 'cafe_rule',
    secondaryCategory: 'cafe',
    items: [
      {
        title: '人気カフェの営業時間確認',
        description: '定休日や営業時間を事前確認',
        category: 'preparation',
        priority: 'low',
        condition: { type: 'always' }
      },
      {
        title: 'カメラ・スマホ（SNS投稿用）',
        description: 'インスタ映えするカフェの場合',
        category: 'packing',
        priority: 'low',
        condition: { type: 'always' }
      },
    ]
  },
  {
    id: 'bar_rule',
    secondaryCategory: 'bar',
    items: [
      {
        title: 'バーの予約（高級バーの場合）',
        description: '人気バーは予約推奨',
        category: 'preparation',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: 'ドレスコード確認',
        description: 'カジュアルすぎる服装はNG',
        category: 'preparation',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: '現金（チップ用）',
        description: 'バーテンダーへのチップ',
        category: 'packing',
        priority: 'medium',
        condition: { type: 'destination', continents: ['NA', 'EU'] }
      },
    ]
  },
  {
    id: 'food_tour_rule',
    secondaryCategory: 'food_tour',
    items: [
      {
        title: 'フードツアーの予約',
        description: '人気ツアーは早めの予約が必要',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '空腹状態で参加',
        description: '多くの店舗を回るため',
        category: 'preparation',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: '歩きやすい靴',
        description: '長時間歩くことが多い',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'エコバッグ',
        description: 'お土産を入れるのに便利',
        category: 'packing',
        priority: 'low',
        condition: { type: 'always' }
      },
    ]
  },
  {
    id: 'street_food_rule',
    secondaryCategory: 'street_food',
    items: [
      {
        title: '衛生的な屋台の見分け方を調査',
        description: '食中毒リスクを減らす',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '現金（小銭）',
        description: '屋台はカード不可がほとんど',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'ウェットティッシュ',
        description: '手を拭くため',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '胃腸薬',
        description: '万が一に備えて',
        category: 'packing',
        priority: 'medium',
        condition: { type: 'always' }
      },
    ]
  },
  {
    id: 'fine_dining_rule',
    secondaryCategory: 'fine_dining',
    items: [
      {
        title: 'レストラン予約（1ヶ月前）',
        description: '有名店は数ヶ月前から予約が埋まる',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'ドレスコード確認（必須）',
        description: 'ジャケット、ネクタイが必要な場合も',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'メニューの事前確認',
        description: 'コース内容・価格を確認',
        category: 'preparation',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: 'フォーマルな服装（ジャケット・ネクタイ）',
        description: 'ドレスコードに応じた服装',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '革靴・ヒール',
        description: 'スニーカーはNG',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
    ]
  },

  // ============================================================================
  // Shopping（買い物）関連 - 追加
  // ============================================================================
  {
    id: 'grocery_rule',
    secondaryCategory: 'grocery',
    items: [
      {
        title: 'スーパーの営業時間確認',
        description: '日曜日は休みの国もある',
        category: 'preparation',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: 'エコバッグ',
        description: 'レジ袋が有料の国が多い',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '小銭入れ',
        description: 'コイン支払いが必要な場合',
        category: 'packing',
        priority: 'medium',
        condition: { type: 'always' }
      },
    ]
  },
  {
    id: 'local_market_rule',
    secondaryCategory: 'local_market',
    items: [
      {
        title: '市場の営業日・時間確認',
        description: '特定の曜日のみ開催の市場もある',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '値段交渉の基本フレーズを学習',
        description: '現地の言葉で値引き交渉',
        category: 'preparation',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: '現金（小銭）',
        description: '市場はカード不可がほとんど',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'エコバッグ・折りたたみバッグ',
        description: '購入品を入れるため',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '歩きやすい靴',
        description: '市場内は長時間歩く',
        category: 'packing',
        priority: 'medium',
        condition: { type: 'always' }
      },
    ]
  },
  {
    id: 'duty_free_rule',
    secondaryCategory: 'duty_free',
    items: [
      {
        title: 'パスポート（購入時に提示が必要）',
        description: '免税手続きに必須',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '航空券予約確認書',
        description: '出国証明として必要な場合も',
        category: 'packing',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: '免税対象商品・金額の事前確認',
        description: '国によって免税条件が異なる',
        category: 'preparation',
        priority: 'medium',
        condition: { type: 'always' }
      },
    ]
  },

  // ============================================================================
  // Exploration（探索）関連
  // ============================================================================
  {
    id: 'city_walk_rule',
    secondaryCategory: 'city_walk',
    items: [
      {
        title: '街歩きルートの事前確認',
        description: '見どころを効率的に回るルートを計画',
        category: 'preparation',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: 'オフラインマップのダウンロード',
        description: 'Google Maps、Maps.meなど',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '歩きやすい靴',
        description: '長時間歩くため必須',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '水筒・ペットボトル',
        description: '水分補給用',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'モバイルバッテリー',
        description: 'スマホのバッテリー切れ対策',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
    ]
  },
  {
    id: 'photography_rule',
    secondaryCategory: 'photography',
    items: [
      {
        title: '撮影禁止エリアの事前確認',
        description: '寺院や美術館では撮影禁止の場合も',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'サンライズ・サンセット時刻の確認',
        description: 'ゴールデンアワーの撮影計画',
        category: 'preparation',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: 'カメラ・レンズ',
        description: '用途に応じたレンズを持参',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '予備バッテリー・充電器',
        description: '長時間撮影に備えて',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'SDカード（複数枚）',
        description: '容量不足に備えて',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '三脚・ミニ三脚',
        description: '夜景や長時間露光撮影用',
        category: 'packing',
        priority: 'medium',
        condition: { type: 'always' }
      },
    ]
  },
  {
    id: 'nature_walk_rule',
    secondaryCategory: 'nature_walk',
    items: [
      {
        title: '天気予報の確認',
        description: '雨天時の対策を検討',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'トレイルマップのダウンロード',
        description: 'オフラインで閲覧可能なマップ',
        category: 'preparation',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: 'トレッキングシューズ',
        description: '自然散策に適した靴',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'レインウェア',
        description: '急な天候変化に備えて',
        category: 'packing',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: '虫除けスプレー',
        description: '蚊・虫対策',
        category: 'packing',
        priority: 'medium',
        condition: { type: 'always' }
      },
    ]
  },

  // ============================================================================
  // Culture（文化）関連 - 追加
  // ============================================================================
  {
    id: 'museum_rule',
    secondaryCategory: 'museum',
    items: [
      {
        title: 'オンラインチケット事前購入',
        description: '人気の博物館は事前予約が必要な場合も',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '休館日・営業時間の確認',
        description: '月曜日休館が多い',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '特別展示の確認',
        description: '期間限定の展示をチェック',
        category: 'preparation',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: 'カメラ（撮影ルール確認）',
        description: '撮影禁止の場所もあるため確認',
        category: 'packing',
        priority: 'low',
        condition: { type: 'always' }
      },
      {
        title: 'メモ帳・ペン',
        description: '展示内容のメモ用',
        category: 'packing',
        priority: 'low',
        condition: { type: 'always' }
      },
    ]
  },
  {
    id: 'art_gallery_rule',
    secondaryCategory: 'art_gallery',
    items: [
      {
        title: 'ギャラリー予約（必要な場合）',
        description: '有名美術館は予約必須',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '特別展示・企画展の確認',
        description: '期間限定の展示をチェック',
        category: 'preparation',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: 'オーディオガイドの事前確認',
        description: '日本語対応の有無を確認',
        category: 'preparation',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: 'イヤホン',
        description: 'オーディオガイド用',
        category: 'packing',
        priority: 'low',
        condition: { type: 'always' }
      },
    ]
  },
  {
    id: 'historical_site_rule',
    secondaryCategory: 'historical_site',
    items: [
      {
        title: '入場チケット事前購入',
        description: '人気の史跡は事前予約が必要',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '歴史的背景の予習',
        description: '事前に歴史を学ぶと楽しめる',
        category: 'preparation',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: '服装規定の確認',
        description: '宗教施設は肌の露出に注意',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '歩きやすい靴',
        description: '広い敷地を歩くことが多い',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '帽子・日焼け止め',
        description: '屋外史跡の場合',
        category: 'packing',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: 'カメラ',
        description: '記念撮影用',
        category: 'packing',
        priority: 'medium',
        condition: { type: 'always' }
      },
    ]
  },

  // ============================================================================
  // Adventure（探検）関連 - 追加
  // ============================================================================
  {
    id: 'trekking_rule',
    secondaryCategory: 'trekking',
    items: [
      {
        title: 'トレッキング許可証の取得',
        description: '国立公園では許可証が必要な場合も',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'ガイドの予約',
        description: '危険なルートではガイド必須',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'トレッキングブーツ',
        description: '足首をサポートする登山靴',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'トレッキングポール',
        description: '膝への負担軽減',
        category: 'packing',
        priority: 'medium',
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
        title: '防寒着・フリース',
        description: '高地は寒い',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '高山病対策の薬',
        description: '高地トレッキングの場合',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
    ]
  },
  {
    id: 'snorkeling_rule',
    secondaryCategory: 'snorkeling',
    items: [
      {
        title: 'シュノーケリングツアーの予約',
        description: '人気スポットは早めの予約が必要',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'マスク・シュノーケル・フィン',
        description: 'レンタルがない場合は持参',
        category: 'packing',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: 'ラッシュガード',
        description: '日焼け・クラゲ対策',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '水中カメラ・GoPro',
        description: '海中撮影用',
        category: 'packing',
        priority: 'low',
        condition: { type: 'always' }
      },
      {
        title: '日焼け止め（海洋環境配慮型）',
        description: 'サンゴ礁に優しい日焼け止め',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
    ]
  },
  {
    id: 'rock_climbing_rule',
    secondaryCategory: 'rock_climbing',
    items: [
      {
        title: 'クライミングジムでの事前練習',
        description: '技術と体力の準備',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'ガイド・インストラクターの予約',
        description: '初心者は必須',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'クライミングシューズ',
        description: 'レンタルまたは持参',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'チョークバッグ',
        description: '手の滑り止め',
        category: 'packing',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: '動きやすい服装',
        description: 'ストレッチ素材の服',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
    ]
  },
  {
    id: 'caving_rule',
    secondaryCategory: 'caving',
    items: [
      {
        title: 'ケイビングツアーの予約',
        description: '個人での入洞は危険',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'ヘッドライト・予備電池',
        description: '洞窟内は真っ暗',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '汚れても良い服装',
        description: '泥だらけになる覚悟',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'グローブ',
        description: '手の保護',
        category: 'packing',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: '防水バッグ',
        description: '濡れた服を入れる',
        category: 'packing',
        priority: 'medium',
        condition: { type: 'always' }
      },
    ]
  },
  {
    id: 'safari_rule',
    secondaryCategory: 'safari',
    items: [
      {
        title: 'サファリツアーの予約',
        description: '人気シーズンは数ヶ月前から予約',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '予防接種（黄熱病など）',
        description: 'アフリカサファリでは必須',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'destination', continents: ['AF'] }
      },
      {
        title: 'マラリア予防薬',
        description: '医師に相談して処方してもらう',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'destination', continents: ['AF'] }
      },
      {
        title: '双眼鏡',
        description: '遠くの動物観察用',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '望遠レンズ付きカメラ',
        description: '動物撮影には必須',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'ベージュ・カーキ色の服',
        description: '明るい色は動物を刺激する',
        category: 'packing',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: '帽子・サングラス',
        description: '日差し対策',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '虫除けスプレー（強力なもの）',
        description: '蚊・ツェツェバエ対策',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
    ]
  },
  {
    id: 'jungle_trek_rule',
    secondaryCategory: 'jungle_trek',
    items: [
      {
        title: 'ガイド付きツアーの予約',
        description: 'ジャングルは個人で入るのは危険',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '予防接種の確認',
        description: '黄熱病、A型肝炎など',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '長袖・長ズボン',
        description: '虫刺され・ヒル対策',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'トレッキングシューズ（防水）',
        description: 'ぬかるんだ道を歩く',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '虫除けスプレー（DEET配合）',
        description: '強力な虫除けが必要',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'レインポンチョ',
        description: 'スコールに備えて',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
    ]
  },

  // ============================================================================
  // Entertainment（遊び）関連 - 追加
  // ============================================================================
  {
    id: 'theme_park_rule',
    secondaryCategory: 'theme_park',
    items: [
      {
        title: 'チケット事前購入',
        description: '当日券より安く、入場もスムーズ',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'ファストパス・優先入場券の確認',
        description: '人気アトラクションの待ち時間短縮',
        category: 'preparation',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: '開園時間・閉園時間の確認',
        description: '開園と同時に入場がおすすめ',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '歩きやすい靴',
        description: '1日中歩き回る',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'モバイルバッテリー',
        description: '写真撮影でバッテリー消費が激しい',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '帽子・日焼け止め',
        description: '屋外アトラクションの日差し対策',
        category: 'packing',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: 'レインポンチョ',
        description: '急な雨やウォーターライド用',
        category: 'packing',
        priority: 'low',
        condition: { type: 'always' }
      },
    ]
  },
  {
    id: 'casino_rule',
    secondaryCategory: 'casino',
    items: [
      {
        title: 'ドレスコード確認',
        description: '高級カジノはドレスコード厳格',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'ゲームルールの事前学習',
        description: 'ブラックジャック、ルーレットなど',
        category: 'preparation',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: 'パスポート（入場時に必要）',
        description: '年齢確認のため',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'フォーマルな服装',
        description: 'ジャケット・ドレス',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '予算管理（現金・クレジットカード）',
        description: '使いすぎに注意',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
    ]
  },
  {
    id: 'nightlife_rule',
    secondaryCategory: 'nightlife',
    items: [
      {
        title: 'クラブの年齢制限・ドレスコード確認',
        description: '入場できない場合もある',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '帰りの交通手段確認',
        description: '深夜の公共交通は運休の場合も',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'パスポート（年齢確認用）',
        description: 'IDチェックがある',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'おしゃれな服装',
        description: 'スニーカー・短パンはNG',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '現金（チップ用）',
        description: 'バーテンダーへのチップ',
        category: 'packing',
        priority: 'medium',
        condition: { type: 'always' }
      },
    ]
  },
  {
    id: 'game_center_rule',
    secondaryCategory: 'game_center',
    items: [
      {
        title: '営業時間・料金システムの確認',
        description: '時間制か、コイン制か',
        category: 'preparation',
        priority: 'low',
        condition: { type: 'always' }
      },
      {
        title: '小銭・両替用現金',
        description: 'コイン式ゲームの場合',
        category: 'packing',
        priority: 'medium',
        condition: { type: 'always' }
      },
    ]
  },
  {
    id: 'karaoke_rule',
    secondaryCategory: 'karaoke',
    items: [
      {
        title: 'カラオケ店の予約',
        description: '週末は混雑するため',
        category: 'preparation',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: '歌いたい曲のリスト作成',
        description: '曲選びがスムーズに',
        category: 'preparation',
        priority: 'low',
        condition: { type: 'always' }
      },
      {
        title: '喉の保湿用飲み物',
        description: 'ノンアルコール推奨',
        category: 'packing',
        priority: 'low',
        condition: { type: 'always' }
      },
    ]
  },
  {
    id: 'movie_rule',
    secondaryCategory: 'movie',
    items: [
      {
        title: 'チケット事前購入',
        description: 'オンライン予約で座席指定',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '上映時間・言語の確認',
        description: '字幕版か吹替版か',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '映画館への行き方確認',
        description: '初めての場所は余裕を持って',
        category: 'preparation',
        priority: 'medium',
        condition: { type: 'always' }
      },
    ]
  },

  // ============================================================================
  // Wellness（健康）関連 - 追加
  // ============================================================================
  {
    id: 'massage_rule',
    secondaryCategory: 'massage',
    items: [
      {
        title: 'マッサージ店の予約',
        description: '人気店は予約推奨',
        category: 'preparation',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: '料金システムの確認',
        description: 'チップが必要かどうか',
        category: 'preparation',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: '着替え（リラックスできる服装）',
        description: '店舗によっては必要',
        category: 'packing',
        priority: 'low',
        condition: { type: 'always' }
      },
      {
        title: '現金（チップ用）',
        description: 'セラピストへのチップ',
        category: 'packing',
        priority: 'medium',
        condition: { type: 'destination', continents: ['NA', 'AS'] }
      },
    ]
  },
  {
    id: 'yoga_rule',
    secondaryCategory: 'yoga',
    items: [
      {
        title: 'ヨガクラスの予約',
        description: '定員制の場合が多い',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'クラスレベルの確認',
        description: '初心者向けか上級者向けか',
        category: 'preparation',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: 'ヨガマット',
        description: 'レンタルがない場合は持参',
        category: 'packing',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: '動きやすい服装',
        description: 'ストレッチ素材の服',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '水筒',
        description: '水分補給用',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
    ]
  },
  {
    id: 'gym_rule',
    secondaryCategory: 'gym',
    items: [
      {
        title: 'ビジター利用の可否確認',
        description: '会員制のジムもある',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '運動着・シューズ',
        description: 'ジム用ウェア',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'タオル',
        description: '汗拭き用',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '水筒',
        description: '水分補給用',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
    ]
  },
  {
    id: 'meditation_rule',
    secondaryCategory: 'meditation',
    items: [
      {
        title: '瞑想センター・リトリートの予約',
        description: '人気施設は早めの予約が必要',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'プログラム内容の確認',
        description: '初心者向けかどうか',
        category: 'preparation',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: 'ゆったりした服装',
        description: '締め付けない服',
        category: 'packing',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: 'クッション・ヨガマット',
        description: '座禅用',
        category: 'packing',
        priority: 'low',
        condition: { type: 'always' }
      },
    ]
  },
  {
    id: 'hot_spring_rule',
    secondaryCategory: 'hot_spring',
    items: [
      {
        title: '温泉のルール・マナー確認',
        description: 'タトゥーNGの施設もある',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '営業時間・料金の確認',
        description: '日帰り入浴の時間帯を確認',
        category: 'preparation',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: 'タオル・バスタオル',
        description: '有料レンタルの場合は持参',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '着替え（浴衣など）',
        description: '温泉施設で過ごす場合',
        category: 'packing',
        priority: 'low',
        condition: { type: 'always' }
      },
      {
        title: '水分補給用の飲み物',
        description: '脱水症状予防',
        category: 'packing',
        priority: 'medium',
        condition: { type: 'always' }
      },
    ]
  },
  {
    id: 'detox_rule',
    secondaryCategory: 'detox',
    items: [
      {
        title: 'デトックスプログラムの予約',
        description: 'リトリート施設は早めの予約',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'プログラム内容の確認',
        description: 'ファスティングの有無など',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '動きやすい服装',
        description: 'ヨガや運動がある場合',
        category: 'packing',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: '水筒',
        description: 'デトックス中の水分補給',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
    ]
  },

  // ============================================================================
  // Service（サービス）関連 - 追加
  // ============================================================================
  {
    id: 'laundry_rule',
    secondaryCategory: 'laundry',
    items: [
      {
        title: 'コインランドリーの場所確認',
        description: 'ホテル周辺のコインランドリーを検索',
        category: 'preparation',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: '洗濯用洗剤（携帯用）',
        description: 'コインランドリーによっては必要',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '小銭',
        description: 'コインランドリー用',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'ランドリーバッグ',
        description: '洗濯物を入れる袋',
        category: 'packing',
        priority: 'low',
        condition: { type: 'always' }
      },
    ]
  },
  {
    id: 'hospital_rule',
    secondaryCategory: 'hospital',
    items: [
      {
        title: '海外旅行保険の加入',
        description: '医療費カバーのため必須',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '病院・クリニックの場所確認',
        description: '日本語対応の病院を事前にリストアップ',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '症状を説明できる外国語フレーズ',
        description: '翻訳アプリも準備',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'パスポート',
        description: '身分証明のため',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '保険証券のコピー',
        description: '保険請求に必要',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '常備薬のリスト（英語）',
        description: '服用している薬を医師に伝える',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
    ]
  },
  {
    id: 'visa_application_rule',
    secondaryCategory: 'visa_application',
    items: [
      {
        title: 'ビザ申請に必要な書類の確認',
        description: '大使館のウェブサイトで確認',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '大使館・ビザセンターの予約',
        description: '予約が必要な場合が多い',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '申請料金の準備',
        description: '現金のみの場合もある',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'パスポート原本',
        description: 'ビザ申請に必須',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '証明写真',
        description: 'サイズ・規格を確認',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '申請書類一式',
        description: '事前に記入して持参',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
    ]
  },
  {
    id: 'post_office_rule',
    secondaryCategory: 'post_office',
    items: [
      {
        title: '郵便局の営業時間確認',
        description: '土日は休みの場合が多い',
        category: 'preparation',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: '送り先の住所（正確に）',
        description: '郵便番号も確認',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '現金（郵送料金）',
        description: 'カード不可の場合もある',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '梱包材料',
        description: '郵便局で購入できない場合もある',
        category: 'packing',
        priority: 'low',
        condition: { type: 'always' }
      },
    ]
  },
  {
    id: 'atm_rule',
    secondaryCategory: 'atm',
    items: [
      {
        title: '国際キャッシュカードの利用可否確認',
        description: 'PlusやCirrusマークを確認',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'ATM手数料の確認',
        description: '海外ATM利用手数料がかかる',
        category: 'preparation',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: 'PINコードの確認',
        description: '4桁の暗証番号',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'クレジットカード・キャッシュカード',
        description: 'Visa、Mastercardが使える',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
    ]
  },
  {
    id: 'baggage_storage_rule',
    secondaryCategory: 'baggage_storage',
    items: [
      {
        title: 'コインロッカーの場所確認',
        description: '駅や空港にある',
        category: 'preparation',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: '荷物預かりサービスの予約',
        description: 'Radical Storage、ecbo cloakなど',
        category: 'preparation',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: '小銭（コインロッカー用）',
        description: '現金のみの場合が多い',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
    ]
  },

  // ============================================================================
  // Accommodation（宿泊）関連 - 追加
  // ============================================================================
  {
    id: 'car_camping_rule',
    secondaryCategory: 'car_camping',
    items: [
      {
        title: '車中泊可能な場所の確認',
        description: '道の駅、SAなど',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '寝袋・毛布',
        description: '夜は冷える',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'カーテン・サンシェード',
        description: '目隠し用',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'マット・エアマット',
        description: '寝心地改善',
        category: 'packing',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: '懐中電灯',
        description: '夜間の照明',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
    ]
  },
  {
    id: 'hostel_stay_rule',
    secondaryCategory: 'hostel_stay',
    items: [
      {
        title: 'チェックイン時間の確認',
        description: 'ホステルは時間厳守',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '南京錠',
        description: 'ロッカー用（持参が必要な場合あり）',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'ビーチサンダル',
        description: 'シャワールーム用',
        category: 'packing',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: 'アイマスク・耳栓',
        description: 'ドミトリーの場合',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'タオル',
        description: '有料レンタルの場合が多い',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
    ]
  },
  {
    id: 'airbnb_rule',
    secondaryCategory: 'airbnb',
    items: [
      {
        title: 'ホストとのコミュニケーション',
        description: 'チェックイン方法を事前確認',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'ハウスルールの確認',
        description: '禁煙・騒音など',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '住所・アクセス方法の確認',
        description: 'わかりにくい場所の場合もある',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'ホストへの連絡手段',
        description: '電話番号、メッセージアプリ',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
    ]
  },
  {
    id: 'luxury_hotel_rule',
    secondaryCategory: 'luxury_hotel',
    items: [
      {
        title: 'ホテルの予約確認',
        description: '予約番号を控える',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '特別リクエストの事前連絡',
        description: 'アレルギー、記念日など',
        category: 'preparation',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: 'ドレスコードの確認',
        description: 'ホテル内レストラン利用時',
        category: 'preparation',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: 'フォーマルな服装',
        description: 'ディナーやバー利用時',
        category: 'packing',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: 'クレジットカード（デポジット用）',
        description: 'チェックイン時に必要',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
    ]
  },

  // ============================================================================
  // Exploration（探索）関連 - 追加
  // ============================================================================
  {
    id: 'observation_rule',
    secondaryCategory: 'observation',
    items: [
      {
        title: '展望台の営業時間確認',
        description: '早朝・夜景の時間帯を確認',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '天気予報の確認',
        description: '晴天時の訪問が理想',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'チケット事前購入',
        description: '混雑時の待ち時間短縮',
        category: 'preparation',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: 'カメラ',
        description: '景色撮影用',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '防寒具',
        description: '高い場所は風が強く寒い',
        category: 'packing',
        priority: 'medium',
        condition: { type: 'always' }
      },
    ]
  },
  {
    id: 'architecture_rule',
    secondaryCategory: 'architecture',
    items: [
      {
        title: '建築物の開館時間確認',
        description: '内部見学の可否を確認',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'ガイドツアーの予約',
        description: '詳しい解説が聞ける',
        category: 'preparation',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: 'カメラ（撮影ルール確認）',
        description: '内部撮影禁止の場合もある',
        category: 'packing',
        priority: 'medium',
        condition: { type: 'always' }
      },
    ]
  },
  {
    id: 'park_rule',
    secondaryCategory: 'park',
    items: [
      {
        title: '公園の開園時間確認',
        description: '早朝・夜間は閉鎖の場合も',
        category: 'preparation',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: 'ピクニック用品',
        description: 'レジャーシート、お弁当',
        category: 'packing',
        priority: 'low',
        condition: { type: 'always' }
      },
      {
        title: '虫除けスプレー',
        description: '夏場の蚊対策',
        category: 'packing',
        priority: 'low',
        condition: { type: 'always' }
      },
    ]
  },

  // ============================================================================
  // Culture（文化）関連 - 追加
  // ============================================================================
  {
    id: 'local_festival_rule',
    secondaryCategory: 'local_festival',
    items: [
      {
        title: '祭りの日程・時間確認',
        description: '開催日時を事前に確認',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '混雑状況の確認',
        description: '早めの到着が推奨',
        category: 'preparation',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: '現金（屋台用）',
        description: '祭りではカード不可が多い',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'カメラ',
        description: '祭りの撮影用',
        category: 'packing',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: '歩きやすい靴',
        description: '長時間立ちっぱなし',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
    ]
  },
  {
    id: 'theater_rule',
    secondaryCategory: 'theater',
    items: [
      {
        title: 'チケット事前購入',
        description: '人気公演は早めに売り切れる',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'ドレスコードの確認',
        description: 'オペラ・バレエは正装が基本',
        category: 'preparation',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: '開演時間・場所の確認',
        description: '遅刻は入場できない場合も',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'フォーマルな服装',
        description: 'ドレス・スーツ',
        category: 'packing',
        priority: 'medium',
        condition: { type: 'always' }
      },
    ]
  },
  {
    id: 'traditional_experience_rule',
    secondaryCategory: 'traditional_experience',
    items: [
      {
        title: '体験プログラムの予約',
        description: '茶道、書道、着物体験など',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '所要時間の確認',
        description: 'スケジュール調整のため',
        category: 'preparation',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: '動きやすい服装',
        description: '正座など動作が多い',
        category: 'packing',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: 'カメラ',
        description: '体験の記録用',
        category: 'packing',
        priority: 'low',
        condition: { type: 'always' }
      },
    ]
  },
  {
    id: 'workshop_rule',
    secondaryCategory: 'workshop',
    items: [
      {
        title: 'ワークショップの予約',
        description: '定員制のため早めの予約',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '必要な持ち物の確認',
        description: '主催者から指定がある場合',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '汚れても良い服装',
        description: 'アート・工芸系の場合',
        category: 'packing',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: 'エプロン',
        description: '料理・陶芸ワークショップの場合',
        category: 'packing',
        priority: 'low',
        condition: { type: 'always' }
      },
    ]
  },

  // ============================================================================
  // Transportation（乗り物）関連 - 追加
  // ============================================================================
  {
    id: 'bike_rule',
    secondaryCategory: 'bike',
    items: [
      {
        title: 'レンタサイクルの予約',
        description: '台数に限りがある場合も',
        category: 'preparation',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: 'サイクリングルートの確認',
        description: '自転車専用道路を調べる',
        category: 'preparation',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: '動きやすい服装',
        description: 'スカートは避ける',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'ヘルメット',
        description: 'レンタルに含まれない場合',
        category: 'packing',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: '水筒',
        description: '水分補給用',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
    ]
  },
  {
    id: 'scooter_rule',
    secondaryCategory: 'scooter',
    items: [
      {
        title: 'スクーターレンタルの予約',
        description: '国際運転免許証の要否確認',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '交通ルールの確認',
        description: '現地の交通ルールを学習',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '国際運転免許証',
        description: 'レンタル時に必要',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: 'ヘルメット',
        description: 'レンタルに含まれない場合',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '長ズボン・運動靴',
        description: '安全運転のため',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
    ]
  },

  // ============================================================================
  // Shopping（買い物）関連 - 追加
  // ============================================================================
  {
    id: 'fashion_rule',
    secondaryCategory: 'fashion',
    items: [
      {
        title: 'ショッピングエリアの確認',
        description: 'ブランド街、アウトレットなど',
        category: 'preparation',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: 'サイズ表記の違い確認',
        description: '国によってサイズが異なる',
        category: 'preparation',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: 'エコバッグ',
        description: '購入品を入れる',
        category: 'packing',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: 'クレジットカード',
        description: '高額商品の購入用',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
    ]
  },
  {
    id: 'electronics_rule',
    secondaryCategory: 'electronics',
    items: [
      {
        title: '電圧・プラグ形状の確認',
        description: '日本と異なる場合がある',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '保証・返品ポリシーの確認',
        description: '海外製品の保証範囲',
        category: 'preparation',
        priority: 'high',
        condition: { type: 'always' }
      },
      {
        title: '現金・クレジットカード',
        description: '高額商品の購入用',
        category: 'packing',
        priority: 'high',
        condition: { type: 'always' }
      },
    ]
  },
  {
    id: 'bookstore_rule',
    secondaryCategory: 'bookstore',
    items: [
      {
        title: '書店の場所・営業時間確認',
        description: '大型書店は郊外にある場合も',
        category: 'preparation',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: 'エコバッグ',
        description: '本を入れる袋',
        category: 'packing',
        priority: 'medium',
        condition: { type: 'always' }
      },
      {
        title: '現金',
        description: '小規模書店はカード不可の場合も',
        category: 'packing',
        priority: 'medium',
        condition: { type: 'always' }
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

