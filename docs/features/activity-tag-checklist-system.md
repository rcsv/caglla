# アクティビティタグ＆チェックリスト自動生成システム仕様書

## 概要

旅程のItineraryに2段階のActivityタグを付与し、タグ情報を基にチェックリストを自動生成するシステムの実装仕様書。

---

## 1. 目的

### 1.1 ユーザーメリット
- **立ち寄り理由の明確化**: 各Venueでの行動内容を記録
- **準備の自動化**: アクティビティに応じた持ち物・手続きのチェックリストを自動生成
- **統計分析**: 旅行スタイルの可視化（文化系、アクティブ系など）

### 1.2 機能範囲
1. ✅ 2段階アクティビティタグシステム
2. ✅ チェックリストの動的生成
   - 行動系準備（両替、ESTA申請など）
   - パッキング系（下着、水着、洗剤など）
3. ✅ 統計・分析機能

---

## 2. データモデル設計

### 2.1 型定義（`lib/core/types.ts`に追加）

#### ActivityTag型
```typescript
// ============================================================================
// アクティビティタグ関連
// ============================================================================

/**
 * アクティビティタグ（2段階分類）
 */
export interface ActivityTag {
  primaryCategory: PrimaryCategoryType
  secondaryCategory: string // 1段階目に応じた詳細カテゴリー
}

/**
 * 1段階目カテゴリー（大分類）
 */
export type PrimaryCategoryType =
  | 'transportation'  // 乗り物に乗る
  | 'shopping'        // 買い物をする
  | 'dining'          // 食事をする
  | 'accommodation'   // 宿泊する
  | 'exploration'     // 探索する
  | 'adventure'       // 探検する
  | 'entertainment'   // 遊ぶ
  | 'culture'         // 文化に触れる
  | 'wellness'        // 健康志向
  | 'service'         // サービス提供

/**
 * 2段階目カテゴリーマスター（1段階目ごとの詳細分類）
 */
export interface SecondaryCategoryMaster {
  primaryCategory: PrimaryCategoryType
  label: string // 日本語表示
  secondaryCategories: Array<{
    id: string
    label: string
    icon?: string
    description?: string
  }>
}

/**
 * チェックリスト項目
 */
export interface ChecklistItem {
  id: string
  title: string
  description?: string
  category: 'preparation' | 'packing' // 行動系準備 or パッキング系
  done: boolean
  generatedFrom?: string // 生成元のsecondaryCategory ID
  isCustom?: boolean // ユーザーが手動追加した項目
  priority?: 'high' | 'medium' | 'low'
}

/**
 * チェックリスト生成ルール
 */
export interface ChecklistGenerationRule {
  id: string
  secondaryCategory: string // 対象の2段階目カテゴリーID
  items: Array<{
    title: string
    description?: string
    category: 'preparation' | 'packing'
    priority?: 'high' | 'medium' | 'low'
    condition?: ChecklistCondition // 生成条件
  }>
}

/**
 * チェックリスト生成条件
 */
export interface ChecklistCondition {
  type: 'count' | 'duration' | 'destination' | 'always'
  // count: 同じsecondaryCategoryの回数
  minCount?: number
  maxCount?: number
  // duration: 旅行期間
  minDays?: number
  maxDays?: number
  // destination: 目的地条件
  countries?: string[] // 対象国コード
  continents?: string[] // 対象大陸
}

/**
 * Trip Checklist（旅行全体のチェックリスト）
 */
export interface TripChecklist {
  id: string
  trip_id: string
  items: ChecklistItem[]
  last_generated_at: FirestoreDate
  created_at: FirestoreDate
  updated_at: FirestoreDate
}
```

#### Itinerary型の拡張
```typescript
export interface Itinerary {
  id: string
  day_id: string
  sort_number: number
  title: string
  description?: string
  location?: string
  place_id?: string | null
  place_data?: PlaceData | null
  start_time?: string
  end_time?: string
  timezone?: string
  cost_amount?: number | null
  cost_currency?: string
  
  // ✅ 追加: アクティビティタグ
  activity_tag?: ActivityTag | null
  
  created_at: FirestoreDate
  updated_at: FirestoreDate
}
```

### 2.2 Firestoreコレクション設計

#### 既存コレクションの拡張

**`itineraries` コレクション**
```
/itineraries/{itineraryId}
  - activity_tag?: {
      primaryCategory: string
      secondaryCategory: string
    }
```

#### 新規コレクション

**`trip_checklists` コレクション**
```
/trip_checklists/{checklistId}
  - id: string
  - trip_id: string (trips コレクションへの参照)
  - items: ChecklistItem[]
  - last_generated_at: Timestamp
  - created_at: Timestamp
  - updated_at: Timestamp
```

**`activity_category_masters` コレクション（マスターデータ）**
```
/activity_category_masters/{categoryId}
  - primaryCategory: string
  - label: string
  - secondaryCategories: Array<{
      id: string
      label: string
      icon?: string
      description?: string
    }>
```

**`checklist_generation_rules` コレクション（ルールマスター）**
```
/checklist_generation_rules/{ruleId}
  - id: string
  - secondaryCategory: string
  - items: Array<{
      title: string
      description?: string
      category: 'preparation' | 'packing'
      priority?: 'high' | 'medium' | 'low'
      condition?: ChecklistCondition
    }>
```

---

## 3. UI/UX設計

### 3.1 アクティビティタグ選択UI

#### 配置場所
- `SortableItineraryCard` コンポーネント内に追加
- Venue情報の下部、コスト入力欄の近くに配置

#### UI構成
```
┌─────────────────────────────────────┐
│ 🏨 Hotel Name                       │
│ 123 Main St, Tokyo                  │
│                                     │
│ ⏰ 15:00 - 10:00 (翌日)            │
│ 💴 ¥15,000                          │
│                                     │
│ 📋 アクティビティ                   │
│ ┌─────────────┐ ┌─────────────┐    │
│ │ 🏨 宿泊する   │→│ チェックイン  │    │
│ └─────────────┘ └─────────────┘    │
└─────────────────────────────────────┘
```

#### インタラクション
1. **1段階目選択**: プルダウンメニューから大分類を選択
2. **2段階目選択**: 1段階目に応じた詳細分類が隣に表示される
3. **自動保存**: 選択後、即座にFirestoreに保存
4. **クリアボタン**: 選択をリセット

### 3.2 チェックリスト表示UI

#### 配置場所
- `TripChecklistView` コンポーネント（既存）を拡張
- 右ペインまたはメインビューとして表示

#### UI構成
```
┌─────────────────────────────────────┐
│ 📋 Travel Checklist                 │
│                                     │
│ 🔄 チェックリストを再生成            │
│                                     │
│ ✈️ 行動系準備 (3/5)                 │
│ ├─ ☑️ パスポートの有効期限確認       │
│ ├─ ☐ 海外旅行保険の加入             │
│ ├─ ☐ 両替（約¥50,000）              │
│ ├─ ☑️ ESTA申請（アメリカ入国）      │
│ └─ ☐ モバイルWi-Fiレンタル          │
│                                     │
│ 🎒 パッキング系 (2/8)                │
│ ├─ ☑️ パスポート                    │
│ ├─ ☑️ 航空券（印刷版）              │
│ ├─ ☐ 下着 × 5日分                  │
│ ├─ ☐ 水着（ビーチアクティビティ用）  │
│ ├─ ☐ 常備薬                         │
│ ├─ ☐ スマートフォン充電器            │
│ ├─ ☐ 折りたたみ傘                   │
│ └─ ☐ 洗濯用洗剤（長期滞在用）        │
│                                     │
│ ➕ カスタム項目を追加                │
└─────────────────────────────────────┘
```

#### 機能
1. **自動生成**: アクティビティタグに基づき自動生成
2. **手動追加**: ユーザーがカスタム項目を追加可能
3. **進捗表示**: カテゴリごとの完了率を表示
4. **優先度**: 重要度に応じた並び替え
5. **印刷対応**: チェックリストをPDF/印刷可能に

### 3.3 統計・分析UI

#### 配置場所
- `TripSummaryView` に新規セクションとして追加
- "Activity Analysis" セクション

#### UI構成
```
┌─────────────────────────────────────┐
│ 📊 Activity Analysis                │
│                                     │
│ 🏨 宿泊     ████████░░  80% (4回)   │
│ 🍽️ 食事     ██████░░░░  60% (3回)   │
│ 🏛️ 文化     ████░░░░░░  40% (2回)   │
│ 🛍️ 買い物   ██░░░░░░░░  20% (1回)   │
│                                     │
│ 詳細:                               │
│ - チェックイン作業: 2回             │
│ - チェックアウト作業: 2回           │
│ - レストラン: 2回                   │
│ - 博物館: 1回                       │
└─────────────────────────────────────┘
```

---

## 4. 実装ステップ

### Phase 1: データモデル＆マスターデータ整備
**優先度: 🔴 High**

1. ✅ `lib/core/types.ts` に型定義を追加
2. ✅ マスターデータの準備（JSON形式）
   - `lib/data/activity-categories.ts`: カテゴリーマスター
   - `lib/data/checklist-rules.ts`: チェックリスト生成ルール
3. ✅ Firestoreマイグレーション用スクリプト作成
   - マスターデータをFirestoreに投入

### Phase 2: UIコンポーネント実装
**優先度: 🔴 High**

1. ✅ `ActivityTagSelector` コンポーネント作成
   - 2段階ドロップダウンUI
   - `components/trip/ActivityTagSelector.tsx`
2. ✅ `SortableItineraryCard` に ActivityTagSelector を統合
3. ✅ APIエンドポイント実装
   - `PUT /api/itineraries/[id]` に activity_tag フィールド追加

### Phase 3: チェックリスト自動生成
**優先度: 🟡 Medium**

1. ✅ チェックリスト生成ロジック実装
   - `lib/checklist-generator.ts`: 生成エンジン
   - アクティビティタグ → チェックリスト項目マッピング
2. ✅ `TripChecklistView` 拡張
   - 自動生成ボタン追加
   - カスタム項目追加機能
   - 完了状態の永続化
3. ✅ APIエンドポイント実装
   - `POST /api/trips/[id]/checklist/generate`: チェックリスト生成
   - `PUT /api/trips/[id]/checklist`: チェックリスト更新

### Phase 4: 統計・分析機能
**優先度: 🟢 Low**

1. ✅ `ActivityStatsDisplay` コンポーネント作成
   - アクティビティ分布の可視化
   - `components/stats/ActivityStatsDisplay.tsx`
2. ✅ `TripSummaryView` に統計セクション追加
3. ✅ 集計ロジック実装
   - `lib/activity-analytics.ts`: 統計計算

### Phase 5: マスターデータ充実化
**優先度: 🟢 Low**

1. ✅ チェックリスト生成ルールの拡充
   - 目的地別条件（国、大陸）
   - 期間別条件（短期、長期）
2. ✅ UI改善
   - アイコン追加
   - ツールチップ説明追加

---

## 5. マスターデータ定義

### 5.1 アクティビティカテゴリーマスター

#### Transportation（乗り物に乗る）
```typescript
{
  primaryCategory: 'transportation',
  label: '🚆 移動・交通',
  secondaryCategories: [
    { id: 'flight', label: '飛行機', icon: '✈️' },
    { id: 'train', label: '電車', icon: '🚆' },
    { id: 'bus', label: 'バス', icon: '🚌' },
    { id: 'taxi', label: 'タクシー', icon: '🚕' },
    { id: 'car_rental', label: 'レンタカー', icon: '🚗' },
    { id: 'personal_car', label: 'マイカー', icon: '🚙' },
    { id: 'parking', label: '駐車場', icon: '🅿️' },
    { id: 'ferry', label: 'フェリー', icon: '⛴️' },
    { id: 'bike', label: '自転車', icon: '🚲' },
  ]
}
```

#### Shopping（買い物をする）
```typescript
{
  primaryCategory: 'shopping',
  label: '🛍️ 買い物をする',
  secondaryCategories: [
    { id: 'souvenir', label: 'お土産購入', icon: '🎁' },
    { id: 'grocery', label: '食料品購入', icon: '🛒' },
    { id: 'fashion', label: 'ファッション', icon: '👔' },
    { id: 'electronics', label: '電化製品', icon: '📱' },
    { id: 'local_market', label: 'ローカル市場', icon: '🏪' },
  ]
}
```

#### Dining（食事をする）
```typescript
{
  primaryCategory: 'dining',
  label: '🍽️ 食事をする',
  secondaryCategories: [
    { id: 'breakfast', label: '朝食', icon: '🌅' },
    { id: 'lunch', label: '昼食', icon: '☀️' },
    { id: 'dinner', label: '夕食', icon: '🌙' },
    { id: 'cafe', label: 'カフェ', icon: '☕' },
    { id: 'bar', label: 'バー', icon: '🍺' },
    { id: 'food_tour', label: 'フードツアー', icon: '🍜' },
  ]
}
```

#### Accommodation（宿泊する）
```typescript
{
  primaryCategory: 'accommodation',
  label: '🏨 宿泊する',
  secondaryCategories: [
    { id: 'check_in', label: 'チェックイン作業', icon: '🔑' },
    { id: 'check_out', label: 'チェックアウト作業', icon: '🚪' },
    { id: 'car_camping', label: '車中泊', icon: '🚐' },
    { id: 'camping', label: 'キャンプ', icon: '⛺' },
    { id: 'hostel_stay', label: 'ホステル泊', icon: '🏠' },
  ]
}
```

#### Exploration（探索する）
```typescript
{
  primaryCategory: 'exploration',
  label: '🔍 探索する',
  secondaryCategories: [
    { id: 'city_walk', label: '街歩き', icon: '🚶' },
    { id: 'nature_walk', label: '自然散策', icon: '🌳' },
    { id: 'photography', label: '写真撮影', icon: '📷' },
    { id: 'observation', label: '展望・眺望', icon: '🏔️' },
  ]
}
```

#### Adventure（探検する）
```typescript
{
  primaryCategory: 'adventure',
  label: '🏔️ 探検する',
  secondaryCategories: [
    { id: 'hiking', label: 'ハイキング', icon: '🥾' },
    { id: 'trekking', label: 'トレッキング', icon: '⛰️' },
    { id: 'diving', label: 'ダイビング', icon: '🤿' },
    { id: 'snorkeling', label: 'シュノーケリング', icon: '🏊' },
    { id: 'rock_climbing', label: 'ロッククライミング', icon: '🧗' },
  ]
}
```

#### Entertainment（遊ぶ）
```typescript
{
  primaryCategory: 'entertainment',
  label: '🎮 遊ぶ',
  secondaryCategories: [
    { id: 'theme_park', label: 'テーマパーク', icon: '🎢' },
    { id: 'beach', label: 'ビーチ', icon: '🏖️' },
    { id: 'water_sports', label: 'ウォータースポーツ', icon: '🏄' },
    { id: 'casino', label: 'カジノ', icon: '🎰' },
    { id: 'nightlife', label: 'ナイトライフ', icon: '🌃' },
  ]
}
```

#### Culture（文化に触れる）
```typescript
{
  primaryCategory: 'culture',
  label: '🏛️ 文化に触れる',
  secondaryCategories: [
    { id: 'museum', label: '博物館', icon: '🏛️' },
    { id: 'art_gallery', label: '美術館', icon: '🖼️' },
    { id: 'temple_shrine', label: '寺社仏閣', icon: '⛩️' },
    { id: 'historical_site', label: '歴史的建造物', icon: '🏰' },
    { id: 'local_festival', label: '地域祭り', icon: '🎭' },
    { id: 'theater', label: '劇場・コンサート', icon: '🎭' },
  ]
}
```

#### Wellness（健康志向）
```typescript
{
  primaryCategory: 'wellness',
  label: '💆 健康志向',
  secondaryCategories: [
    { id: 'spa', label: 'スパ', icon: '♨️' },
    { id: 'massage', label: 'マッサージ', icon: '💆' },
    { id: 'yoga', label: 'ヨガ', icon: '🧘' },
    { id: 'gym', label: 'ジム', icon: '🏋️' },
    { id: 'meditation', label: '瞑想', icon: '🕉️' },
  ]
}
```

#### Service（サービス提供）
```typescript
{
  primaryCategory: 'service',
  label: '🔧 サービス提供',
  secondaryCategories: [
    { id: 'laundry', label: '洗濯', icon: '👕' },
    { id: 'currency_exchange', label: '両替', icon: '💱' },
    { id: 'hospital', label: '病院', icon: '🏥' },
    { id: 'visa_application', label: 'ビザ申請', icon: '📋' },
    { id: 'sim_purchase', label: 'SIM購入', icon: '📱' },
  ]
}
```

### 5.2 チェックリスト生成ルール例

#### チェックイン作業（check_in）
```typescript
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
    }
  ]
}
```

#### 宿泊日数に応じたパッキング
```typescript
{
  id: 'accommodation_count_rule',
  secondaryCategory: 'check_in',
  items: [
    {
      title: '下着 × {count}日分',
      description: '宿泊日数分の下着を準備',
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
      title: '洗濯用洗剤',
      description: '長期滞在の場合に便利',
      category: 'packing',
      priority: 'medium',
      condition: { type: 'count', minCount: 5 }
    }
  ]
}
```

#### 水遊び系アクティビティ
```typescript
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
    }
  ]
}
```

#### 海外旅行（国別条件）
```typescript
{
  id: 'international_usa_rule',
  secondaryCategory: 'flight',
  items: [
    {
      title: 'ESTA申請（アメリカ入国）',
      description: '渡航72時間前までに申請推奨',
      category: 'preparation',
      priority: 'high',
      condition: { 
        type: 'destination', 
        countries: ['US'] 
      }
    },
    {
      title: 'パスポートの残存期間確認（6ヶ月以上）',
      description: '入国時に残存期間が6ヶ月以上必要',
      category: 'preparation',
      priority: 'high',
      condition: { 
        type: 'destination', 
        continents: ['NA', 'SA', 'EU', 'AS'] 
      }
    },
    {
      title: '海外旅行保険加入',
      description: '医療費が高額な国では必須',
      category: 'preparation',
      priority: 'high',
      condition: { 
        type: 'destination', 
        continents: ['NA', 'EU'] 
      }
    }
  ]
}
```

#### 長期滞在
```typescript
{
  id: 'long_stay_rule',
  secondaryCategory: 'check_in',
  items: [
    {
      title: '常備薬（風邪薬、胃腸薬）',
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
    }
  ]
}
```

---

## 6. APIエンドポイント設計

### 6.1 既存API拡張

#### `PUT /api/itineraries/[id]`
**リクエスト**
```json
{
  "title": "ホテルチェックイン",
  "activity_tag": {
    "primaryCategory": "accommodation",
    "secondaryCategory": "check_in"
  }
}
```

**レスポンス**
```json
{
  "success": true,
  "itinerary": {
    "id": "itinerary123",
    "title": "ホテルチェックイン",
    "activity_tag": {
      "primaryCategory": "accommodation",
      "secondaryCategory": "check_in"
    }
  }
}
```

### 6.2 新規API

#### `POST /api/trips/[id]/checklist/generate`
**説明**: 旅行のアクティビティタグに基づきチェックリストを生成

**リクエスト**
```json
{
  "regenerate": true // 既存チェックリストを上書き
}
```

**レスポンス**
```json
{
  "success": true,
  "checklist": {
    "id": "checklist123",
    "trip_id": "trip123",
    "items": [
      {
        "id": "item1",
        "title": "パスポートの有効期限確認",
        "category": "preparation",
        "done": false,
        "generatedFrom": "flight",
        "priority": "high"
      },
      {
        "id": "item2",
        "title": "下着 × 5日分",
        "category": "packing",
        "done": false,
        "generatedFrom": "check_in",
        "priority": "high"
      }
    ],
    "last_generated_at": "2025-10-15T10:30:00Z"
  }
}
```

#### `PUT /api/trips/[id]/checklist`
**説明**: チェックリストの更新（項目追加、完了状態変更）

**リクエスト**
```json
{
  "items": [
    {
      "id": "item1",
      "done": true
    },
    {
      "id": "custom1",
      "title": "カスタム項目",
      "category": "packing",
      "done": false,
      "isCustom": true,
      "priority": "medium"
    }
  ]
}
```

#### `GET /api/trips/[id]/activity-stats`
**説明**: 旅行のアクティビティ統計を取得

**レスポンス**
```json
{
  "success": true,
  "stats": {
    "primaryCategories": {
      "accommodation": { "count": 4, "percentage": 40 },
      "dining": { "count": 3, "percentage": 30 },
      "culture": { "count": 2, "percentage": 20 },
      "shopping": { "count": 1, "percentage": 10 }
    },
    "secondaryCategories": {
      "check_in": 2,
      "check_out": 2,
      "restaurant": 3,
      "museum": 2,
      "souvenir": 1
    },
    "totalActivities": 10
  }
}
```

---

## 7. チェックリスト生成ロジック

### 7.1 生成アルゴリズム

```typescript
/**
 * チェックリスト生成エンジン
 */
export class ChecklistGenerator {
  
  /**
   * Trip全体のチェックリストを生成
   */
  async generateTripChecklist(trip: Trip): Promise<ChecklistItem[]> {
    const items: ChecklistItem[] = []
    const activityCounts = new Map<string, number>()
    
    // 1. 全Itineraryからアクティビティタグを収集
    const allItineraries = this.getAllItineraries(trip)
    allItineraries.forEach(itinerary => {
      if (itinerary.activity_tag) {
        const key = itinerary.activity_tag.secondaryCategory
        activityCounts.set(key, (activityCounts.get(key) || 0) + 1)
      }
    })
    
    // 2. 旅行期間を計算
    const tripDuration = this.calculateTripDuration(trip)
    
    // 3. 目的地情報を取得
    const destination = this.getDestinationInfo(trip)
    
    // 4. 各アクティビティに対応するチェックリスト項目を生成
    for (const [secondaryCategory, count] of activityCounts.entries()) {
      const rules = await this.getChecklistRules(secondaryCategory)
      
      rules.forEach(rule => {
        rule.items.forEach(ruleItem => {
          // 条件チェック
          if (this.checkCondition(ruleItem.condition, {
            count,
            duration: tripDuration,
            destination
          })) {
            // 動的な値置換（例: {count}日分 → 5日分）
            const title = this.replaceDynamicValues(ruleItem.title, {
              count,
              duration: tripDuration
            })
            
            items.push({
              id: this.generateId(),
              title,
              description: ruleItem.description,
              category: ruleItem.category,
              done: false,
              generatedFrom: secondaryCategory,
              priority: ruleItem.priority || 'medium'
            })
          }
        })
      })
    }
    
    // 5. 優先度順にソート
    return this.sortByPriority(items)
  }
  
  /**
   * 条件チェック
   */
  private checkCondition(
    condition: ChecklistCondition | undefined,
    context: {
      count: number
      duration: number
      destination: DestinationInfo
    }
  ): boolean {
    if (!condition) return true
    
    switch (condition.type) {
      case 'always':
        return true
        
      case 'count':
        if (condition.minCount && context.count < condition.minCount) return false
        if (condition.maxCount && context.count > condition.maxCount) return false
        return true
        
      case 'duration':
        if (condition.minDays && context.duration < condition.minDays) return false
        if (condition.maxDays && context.duration > condition.maxDays) return false
        return true
        
      case 'destination':
        if (condition.countries && !condition.countries.includes(context.destination.countryCode)) {
          return false
        }
        if (condition.continents && !condition.continents.includes(context.destination.continentCode)) {
          return false
        }
        return true
        
      default:
        return false
    }
  }
}
```

### 7.2 動的値の置換

チェックリスト項目のタイトルに動的な値を埋め込む：

| プレースホルダー | 説明 | 例 |
|-----------------|------|-----|
| `{count}` | アクティビティの回数 | `下着 × {count}日分` → `下着 × 5日分` |
| `{duration}` | 旅行期間（日数） | `{duration}日分の常備薬` → `7日分の常備薬` |
| `{destination}` | 目的地名 | `{destination}の地図` → `東京の地図` |

---

## 8. セキュリティ考慮事項

### 8.1 データアクセス制御
- ✅ チェックリストは`trip_id`で紐付け
- ✅ ユーザー認証済みかつTripの所有者のみアクセス可能
- ✅ Firestore Security Rulesで保護

### 8.2 入力検証
- ✅ アクティビティタグの値はマスターデータに存在するもののみ許可
- ✅ カスタムチェックリスト項目は文字数制限（最大500文字）

---

## 9. パフォーマンス最適化

### 9.1 マスターデータのキャッシュ
- ✅ `activity_category_masters` はクライアント側でキャッシュ
- ✅ 初回ロード時のみFirestoreから取得
- ✅ ローカルストレージに保存（24時間有効）

### 9.2 チェックリスト生成の最適化
- ✅ サーバーサイドで生成（Cloud FunctionsまたはNext.js API）
- ✅ 生成結果をFirestoreに保存し、再利用
- ✅ アクティビティタグ変更時のみ再生成

---

## 10. 今後の拡張性

### 10.1 機械学習による提案
- ✅ ユーザーの旅行履歴からおすすめアクティビティを提案
- ✅ チェックリスト項目の優先度を学習

### 10.2 コミュニティ機能
- ✅ ユーザー間でチェックリスト項目を共有
- ✅ 人気のチェックリスト項目をランキング表示

### 10.3 多言語対応
- ✅ チェックリスト項目の翻訳
- ✅ 目的地に応じた言語でチェックリスト生成

---

## 11. 実装スケジュール

| Phase | タスク | 期間 | 優先度 |
|-------|--------|------|--------|
| Phase 1 | データモデル＆マスターデータ整備 | 1週間 | 🔴 High |
| Phase 2 | UIコンポーネント実装 | 2週間 | 🔴 High |
| Phase 3 | チェックリスト自動生成 | 2週間 | 🟡 Medium |
| Phase 4 | 統計・分析機能 | 1週間 | 🟢 Low |
| Phase 5 | マスターデータ充実化 | 継続 | 🟢 Low |

**総開発期間: 約6週間**

---

## 12. 参考資料

- [Firestore Data Modeling Best Practices](https://firebase.google.com/docs/firestore/data-model)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [DnD Kit - Drag and Drop for React](https://dndkit.com/)

---

**作成日**: 2025-10-15  
**最終更新**: 2025-10-15  
**バージョン**: 1.0.0

