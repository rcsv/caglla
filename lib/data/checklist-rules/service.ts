/**
 * Service（サービス）関連のチェックリストルール
 */

import { ChecklistGenerationRule } from './types'

export const SERVICE_RULES: ChecklistGenerationRule[] = [
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
]
