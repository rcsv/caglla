# チェックリストルール拡張計画

## 概要

現在、`lib/data/checklist-rules.ts`には15個のルールしか定義されていませんが、`lib/data/activity-categories.ts`には80個以上のアクティビティカテゴリーが定義されています。

このドキュメントは、不足しているルールを段階的に追加するための計画です。

## 現在の状況

### 既に定義されているルール（15個）
- ✅ flight (飛行機)
- ✅ car_rental (レンタカー)
- ✅ souvenir (お土産)
- ✅ check_in / check_out (チェックイン/アウト)
- ✅ camping (キャンプ)
- ✅ hiking (ハイキング)
- ✅ water_sports (ウォータースポーツ)
- ✅ diving (ダイビング)
- ✅ beach (ビーチ)
- ✅ aquarium (水族館)
- ✅ temple_shrine (寺社仏閣)
- ✅ spa (スパ)
- ✅ currency_exchange (両替)
- ✅ sim_purchase (SIM購入)

### 不足しているカテゴリー（優先度順）

#### 🔴 優先度：高（すぐに追加すべき）

**Transportation（乗り物）**
- ❌ train (電車)
- ❌ bus (バス)
- ❌ taxi (タクシー)
- ❌ ferry (フェリー)

**Dining（食事）**
- ❌ breakfast (朝食)
- ❌ lunch (昼食)
- ❌ dinner (夕食)
- ❌ cafe (カフェ)
- ❌ bar (バー)
- ❌ food_tour (フードツアー)
- ❌ street_food (屋台)
- ❌ fine_dining (ファインダイニング)

**Shopping（買い物）**
- ❌ grocery (食料品購入)
- ❌ local_market (ローカル市場)
- ❌ duty_free (免税店)

**Exploration（探索）**
- ❌ city_walk (街歩き)
- ❌ nature_walk (自然散策)
- ❌ photography (写真撮影)

**Culture（文化）**
- ❌ museum (博物館)
- ❌ art_gallery (美術館)
- ❌ historical_site (歴史的建造物)

#### 🟡 優先度：中（段階的に追加）

**Adventure（探検）**
- ❌ trekking (トレッキング)
- ❌ snorkeling (シュノーケリング)
- ❌ rock_climbing (ロッククライミング)
- ❌ safari (サファリ)

**Entertainment（遊び）**
- ❌ theme_park (テーマパーク)
- ❌ nightlife (ナイトライフ)
- ❌ casino (カジノ)
- ❌ karaoke (カラオケ)

**Wellness（健康）**
- ❌ massage (マッサージ)
- ❌ yoga (ヨガ)
- ❌ hot_spring (温泉)

**Service（サービス）**
- ❌ laundry (洗濯)
- ❌ hospital (病院)
- ❌ visa_application (ビザ申請)
- ❌ atm (ATM)

#### 🟢 優先度：低（必要に応じて追加）

**その他**
- bike, scooter, fashion, electronics, bookstore
- caving, jungle_trek, game_center, movie
- meditation, detox, gym
- post_office, baggage_storage
- car_camping, hostel_stay, airbnb, luxury_hotel
- observation, architecture, park
- local_festival, theater, traditional_experience, workshop

## 追加方法

### 1. ファイル構造
すべてのルールは `/home/thomas/Code/caglla/lib/data/checklist-rules.ts` に定義されています。

### 2. ルールの構造

```typescript
{
  id: 'unique_rule_id', // ユニークなルールID
  secondaryCategory: 'category_id', // アクティビティカテゴリーID
  items: [
    {
      title: 'チェックリスト項目のタイトル',
      description: '詳細説明（オプション）',
      category: 'preparation' | 'packing', // 行動系準備 or パッキング系
      priority: 'high' | 'medium' | 'low', // 優先度
      condition: {
        type: 'always' | 'count' | 'duration' | 'destination',
        // type='count': 同じカテゴリーが何回出現するか
        minCount?: 1,
        maxCount?: 999,
        // type='duration': 旅行期間（日数）
        minDays?: 3,
        maxDays?: 999,
        // type='destination': 目的地条件
        countries?: ['US', 'CA'], // ISO 3166-1 alpha-2
        continents?: ['AS', 'EU', 'NA', 'SA', 'AF', 'OC']
      }
    }
  ]
}
```

### 3. 動的な値の置換

タイトルに `{count}` や `{duration}` を含めることで、動的に値を置換できます。

例：
```typescript
title: '下着 × {count}日分' // → "下着 × 5日分"
```

### 4. 重複排除

同じタイトル + カテゴリーの組み合わせは自動的に重複排除されます。優先度が高い方が採用されます。

## 実装例

### 例1: 電車（train）のルール

```typescript
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
}
```

### 例2: 博物館（museum）のルール

```typescript
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
      title: 'カメラ（撮影禁止の場所もあるため確認）',
      description: '館内ルールを事前確認',
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
}
```

### 例3: 朝食（breakfast）のルール

```typescript
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
}
```

## 次のステップ

1. **優先度の高いカテゴリーから追加**
   - まず Transportation（train, bus, taxi, ferry）を追加
   - 次に Dining（breakfast, lunch, dinner）を追加
   - その後 Shopping, Exploration, Culture を追加

2. **テストと検証**
   - 実際の旅程でチェックリスト生成をテスト
   - 生成されたチェックリストの妥当性を確認
   - ユーザーフィードバックを収集

3. **継続的な改善**
   - 利用頻度の高いカテゴリーのルールを優先的に充実
   - ユーザーからの要望に応じてルールを追加・修正

## 参考リンク

- チェックリストルール定義: `/home/thomas/Code/caglla/lib/data/checklist-rules.ts`
- アクティビティカテゴリー定義: `/home/thomas/Code/caglla/lib/data/activity-categories.ts`
- チェックリスト生成エンジン: `/home/thomas/Code/caglla/lib/checklist-generator.ts`
- 実装ガイド: `/home/thomas/Code/caglla/docs/development/checklist-implementation-guide.md`

