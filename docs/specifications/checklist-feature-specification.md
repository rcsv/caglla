# チェックリスト機能 仕様書

## 概要

旅行計画に対して、準備とパッキングのチェックリストを自動生成・管理する機能。

---

## 1. 画面構成

### 1.1 メニュー選択時の動作

**ナビゲーションメニュー > Checklist をクリック**
- 地図（右ペイン）は非表示
- メインコンテンツエリアが画面全体に広がる（右ペインを上書き）
- チェックリスト専用ビューを表示

### 1.2 レイアウト構成

```
┌─────────────────────────────────────────────────────────┐
│ 左ナビゲーション │ メインコンテンツ（全幅表示）         │
│                 │                                      │
│ - Summary       │ ┌─────────────────────────────────┐ │
│ - Itinerary     │ │  Travel Checklist               │ │
│ - Checklist     │ │  [チェックリスト生成ボタン]      │ │
│   - Preparing   │ └─────────────────────────────────┘ │
│   - Packing     │                                      │
│                 │ ┌──────────────┬──────────────────┐ │
│                 │ │ Preparing    │ Packing          │ │
│                 │ │ (行動系)     │ (持ち物系)       │ │
│                 │ │              │                  │ │
│                 │ │ □ パスポート │ □ 下着 × 3日分   │ │
│                 │ │ □ 航空券確認 │ □ シャンプー     │ │
│                 │ │ ...          │ ...              │ │
│                 │ │              │                  │ │
│                 │ │ [+項目追加]  │ [+項目追加]      │ │
│                 │ └──────────────┴──────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 2. 機能仕様

### 2.1 チェックリスト自動生成

**トリガー**: 「チェックリストを再生成」ボタンをクリック

**生成ロジック**:
1. 旅行の`itineraries`からアクティビティタグ（`secondaryCategory`）を抽出
2. `lib/data/checklist-rules.ts`の`CHECKLIST_RULES`を参照
3. 各ルールの`condition`を評価:
   - `type: 'always'`: 常に適用
   - `type: 'count'`: 同じsecondaryCategoryの出現回数でフィルタ
   - `type: 'duration'`: 旅行期間（日数）でフィルタ
   - `type: 'destination'`: 目的地（国コード・大陸コード）でフィルタ
4. 条件に合致した`ChecklistRuleItem`を抽出
5. `category`に基づいて`preparation`（Preparing）と`packing`（Packing）に振り分け
6. Firestoreの`trip_checklists/{tripId}`に保存

**API**: `POST /api/trips/{tripId}/checklist/generate`

**生成例**:
- 旅程に`flight`のアクティビティが含まれる → 「パスポートの有効期限確認」が追加
- 旅程に`check_in`が3回含まれる → 「下着 × 3日分」が追加
- 目的地が米国（`US`）の場合 → 「ESTA申請」が追加

---

### 2.2 チェックリスト手動追加

**機能**:
- ユーザーが任意のアイテムを追加可能
- カテゴリー（Preparing / Packing）を選択
- テキスト入力欄にタイトルを入力して「追加」ボタン

**UI**:
```
┌──────────────────────────────────────┐
│ Packing                              │
│ ┌──────────────────────────────────┐ │
│ │ □ 下着 × 3日分                   │ │
│ │ □ シャンプー                     │ │
│ └──────────────────────────────────┘ │
│                                      │
│ [カスタム項目を追加...]   [追加]    │
└──────────────────────────────────────┘
```

**実装**:
- `ChecklistItem`に`isCustom: true`フラグを付与
- カスタムアイテムは削除可能（自動生成アイテムは削除不可）

---

### 2.3 チェックリストの永続化

**データモデル** (`lib/core/types.ts`):

```typescript
export interface ChecklistItem {
  id: string                          // 一意なID
  title: string                       // アイテムのタイトル
  description?: string                // 詳細説明（optional）
  category: 'preparation' | 'packing' // カテゴリー
  priority?: 'high' | 'medium' | 'low' // 優先度（表示順序用）
  done: boolean                       // 完了フラグ
  isCustom?: boolean                  // カスタム項目フラグ
}

export interface TripChecklist {
  id: string                          // tripIdと同じ
  trip_id: string                     // 紐づくtrip ID
  items: ChecklistItem[]              // チェックリストアイテム
  updated_at: FirestoreDate           // 最終更新日時
}
```

**Firestoreコレクション**: `trip_checklists`

**保存タイミング**:
- アイテムの追加・削除
- チェックボックスのトグル（完了/未完了）
- チェックリスト再生成

**API**:
- `GET /api/trips/{tripId}/checklist` - チェックリスト取得
- `PUT /api/trips/{tripId}/checklist` - チェックリスト更新
- `POST /api/trips/{tripId}/checklist/generate` - チェックリスト再生成

---

## 3. ユーザープリセット機能

### 3.1 概要

ユーザーが独自のチェックリストテンプレートを作成し、他のユーザーとシェア・利用できる機能。

### 3.2 データモデル

```typescript
export interface ChecklistPreset {
  id: string                          // プリセットID
  user_id: string                     // 作成者のユーザーID
  title: string                       // プリセットのタイトル（例: "冬の北海道旅行"）
  description?: string                // プリセットの説明
  tags?: string[]                     // タグ（例: ["winter", "hokkaido", "skiing"]）
  items: ChecklistPresetItem[]        // プリセットアイテム
  is_public: boolean                  // 公開/非公開フラグ
  created_at: FirestoreDate
  updated_at: FirestoreDate
  usage_count?: number                // 使用回数（人気度の指標）
}

export interface ChecklistPresetItem {
  title: string                       // アイテムタイトル
  description?: string                // 詳細説明
  category: 'preparation' | 'packing' // カテゴリー
  priority?: 'high' | 'medium' | 'low'
}
```

### 3.3 Firestoreコレクション

```
checklist_presets/
  {presetId}/
    - id: string
    - user_id: string
    - title: string
    - description: string
    - tags: string[]
    - items: ChecklistPresetItem[]
    - is_public: boolean
    - created_at: timestamp
    - updated_at: timestamp
    - usage_count: number
```

### 3.4 機能要件

#### 3.4.1 プリセット作成

**トリガー**: チェックリスト画面で「プリセットとして保存」ボタンをクリック

**UI**:
```
┌────────────────────────────────────────┐
│ チェックリストをプリセットとして保存   │
├────────────────────────────────────────┤
│ タイトル: [冬の北海道旅行            ] │
│ 説明:     [スキー・温泉旅行向けの    ] │
│           [チェックリスト            ] │
│ タグ:     [winter, hokkaido, skiing  ] │
│                                        │
│ □ 公開する（他のユーザーが利用可能） │
│                                        │
│     [キャンセル]     [保存]           │
└────────────────────────────────────────┘
```

**処理**:
1. 現在のチェックリストアイテムをコピー
2. `isCustom`フラグを削除（プリセットではカスタム/自動生成の区別なし）
3. Firestoreの`checklist_presets`に保存
4. `is_public: true`の場合、他のユーザーも検索・利用可能

#### 3.4.2 プリセット検索・適用

**トリガー**: チェックリスト画面で「プリセットを適用」ボタンをクリック

**UI**:
```
┌────────────────────────────────────────┐
│ チェックリストプリセットを選択         │
├────────────────────────────────────────┤
│ 検索: [キーワード、タグで検索...     ] │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │ 冬の北海道旅行                     │ │
│ │ by: user123                        │ │
│ │ スキー・温泉旅行向けのチェックリスト│ │
│ │ タグ: winter, hokkaido, skiing     │ │
│ │ 使用回数: 45回                     │ │
│ │                          [適用]    │ │
│ └────────────────────────────────────┘ │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │ 夏の沖縄ビーチ旅行                 │ │
│ │ by: user456                        │ │
│ │ ビーチリゾート向けのチェックリスト │ │
│ │ タグ: summer, okinawa, beach       │ │
│ │ 使用回数: 32回                     │ │
│ │                          [適用]    │ │
│ └────────────────────────────────────┘ │
│                                        │
│                          [閉じる]      │
└────────────────────────────────────────┘
```

**検索機能**:
- タイトル・説明・タグでの全文検索
- 人気順（usage_count降順）
- 新着順（created_at降順）

**適用処理**:
1. プリセットの`items`を取得
2. 現在のチェックリストに**追加**（既存項目は保持）
3. 重複チェック（同じタイトルのアイテムは追加しない）
4. プリセットの`usage_count`をインクリメント

#### 3.4.3 マイプリセット管理

**UI**: ユーザー設定画面またはチェックリスト画面に「マイプリセット」セクション

**機能**:
- 自分が作成したプリセットの一覧表示
- プリセットの編集（タイトル・説明・タグ・公開設定）
- プリセットの削除
- プリセットの複製

---

## 4. API設計

### 4.1 既存API（実装済み）

#### `GET /api/trips/{tripId}/checklist`
**説明**: 旅行のチェックリストを取得

**レスポンス**:
```json
{
  "id": "trip_123",
  "trip_id": "trip_123",
  "items": [
    {
      "id": "item_1",
      "title": "パスポートの有効期限確認",
      "description": "多くの国で入国時に6ヶ月以上の残存期間が必要",
      "category": "preparation",
      "priority": "high",
      "done": false,
      "isCustom": false
    }
  ],
  "updated_at": "2025-10-16T12:00:00Z"
}
```

#### `PUT /api/trips/{tripId}/checklist`
**説明**: チェックリストを更新（アイテムの追加・削除・完了状態変更）

**リクエスト**:
```json
{
  "items": [
    {
      "id": "item_1",
      "title": "パスポートの有効期限確認",
      "category": "preparation",
      "done": true
    }
  ]
}
```

#### `POST /api/trips/{tripId}/checklist/generate`
**説明**: チェックリストを自動生成

**処理フロー**:
1. 旅行データ（days, itineraries）を取得
2. `lib/checklist-generator.ts`の`generateChecklist()`を呼び出し
3. 生成されたアイテムをFirestoreに保存

---

### 4.2 新規API（プリセット機能）

#### `POST /api/checklists/presets`
**説明**: チェックリストプリセットを作成

**リクエスト**:
```json
{
  "title": "冬の北海道旅行",
  "description": "スキー・温泉旅行向けのチェックリスト",
  "tags": ["winter", "hokkaido", "skiing"],
  "items": [
    {
      "title": "スキーウェア",
      "category": "packing",
      "priority": "high"
    }
  ],
  "is_public": true
}
```

**レスポンス**:
```json
{
  "id": "preset_123",
  "user_id": "user_456",
  "title": "冬の北海道旅行",
  "created_at": "2025-10-16T12:00:00Z"
}
```

#### `GET /api/checklists/presets`
**説明**: プリセット一覧を取得（検索・フィルタ）

**クエリパラメータ**:
- `query`: 検索キーワード（タイトル・説明・タグを全文検索）
- `sort`: `popular`（人気順）、`recent`（新着順）
- `user_id`: 特定ユーザーのプリセットのみ取得

**レスポンス**:
```json
{
  "presets": [
    {
      "id": "preset_123",
      "user_id": "user_456",
      "title": "冬の北海道旅行",
      "description": "スキー・温泉旅行向けのチェックリスト",
      "tags": ["winter", "hokkaido", "skiing"],
      "usage_count": 45,
      "created_at": "2025-10-16T12:00:00Z"
    }
  ]
}
```

#### `GET /api/checklists/presets/{presetId}`
**説明**: プリセットの詳細を取得

**レスポンス**:
```json
{
  "id": "preset_123",
  "user_id": "user_456",
  "title": "冬の北海道旅行",
  "description": "スキー・温泉旅行向けのチェックリスト",
  "tags": ["winter", "hokkaido", "skiing"],
  "items": [
    {
      "title": "スキーウェア",
      "description": "防寒・防水性能のあるもの",
      "category": "packing",
      "priority": "high"
    }
  ],
  "is_public": true,
  "usage_count": 45,
  "created_at": "2025-10-16T12:00:00Z"
}
```

#### `PUT /api/checklists/presets/{presetId}`
**説明**: プリセットを更新（自分が作成したプリセットのみ）

**リクエスト**:
```json
{
  "title": "冬の北海道旅行（改訂版）",
  "description": "スキー・温泉旅行向け",
  "tags": ["winter", "hokkaido"],
  "is_public": false
}
```

#### `DELETE /api/checklists/presets/{presetId}`
**説明**: プリセットを削除（自分が作成したプリセットのみ）

#### `POST /api/trips/{tripId}/checklist/apply-preset`
**説明**: プリセットを現在のチェックリストに適用

**リクエスト**:
```json
{
  "preset_id": "preset_123"
}
```

**処理**:
1. プリセットのアイテムを取得
2. 既存のチェックリストに追加（重複チェック）
3. プリセットの`usage_count`をインクリメント

---

## 5. UI/UXデザイン

### 5.1 レスポンシブ対応

**デスクトップ（>= 1024px）**:
- 左ナビゲーション + メインコンテンツ（全幅）
- Preparing / Packing を横並び（2カラム）

**タブレット（768px - 1023px）**:
- 左ナビゲーション（折りたたみ可能） + メインコンテンツ
- Preparing / Packing を縦並び（1カラム）

**モバイル（< 768px）**:
- ハンバーガーメニュー + メインコンテンツ（全幅）
- Preparing / Packing を縦並び

### 5.2 インタラクション

**チェックボックス**:
- クリックで即座に完了/未完了を切り替え
- 完了アイテムは取り消し線 + グレーアウト
- 自動保存（Firestoreに即反映）

**ドラッグ&ドロップ**:
- アイテムをドラッグして並び替え可能（優先順位の調整）
- カテゴリー間の移動も可能（Preparing ↔ Packing）

**削除**:
- カスタムアイテムのみ削除可能
- 削除ボタンは右端に配置
- 確認ダイアログなし（即座に削除、Undo機能なし）

### 5.3 視覚的な優先度表示

**優先度別の色分け**:
- `high`: 赤色のアイコン（⚠️）
- `medium`: 黄色のアイコン（⚡）
- `low`: グレーのアイコン（ℹ️）

---

## 6. セキュリティ・権限

### 6.1 チェックリストの権限

- チェックリストは**旅行の所有者のみ**が編集可能
- APIリクエスト時にFirebase Authenticationトークンで認証
- `trip.user_id`とリクエスト者の`uid`が一致することを確認

### 6.2 プリセットの権限

**作成・編集・削除**:
- 自分が作成したプリセットのみ編集・削除可能

**閲覧**:
- `is_public: true`のプリセットは全ユーザーが閲覧・適用可能
- `is_public: false`のプリセットは作成者のみ閲覧可能

### 6.3 Firestore Security Rules

```javascript
// trip_checklists
match /trip_checklists/{tripId} {
  allow read: if request.auth != null && 
    get(/databases/$(database)/documents/trips/$(tripId)).data.user_id == request.auth.uid;
  allow write: if request.auth != null && 
    get(/databases/$(database)/documents/trips/$(tripId)).data.user_id == request.auth.uid;
}

// checklist_presets
match /checklist_presets/{presetId} {
  // 公開プリセットは全員が閲覧可能
  allow read: if resource.data.is_public == true || 
    (request.auth != null && resource.data.user_id == request.auth.uid);
  
  // 作成は認証済みユーザーのみ
  allow create: if request.auth != null && 
    request.resource.data.user_id == request.auth.uid;
  
  // 編集・削除は作成者のみ
  allow update, delete: if request.auth != null && 
    resource.data.user_id == request.auth.uid;
}
```

---

## 7. パフォーマンス最適化

### 7.1 キャッシング

- チェックリストデータをReact Stateでキャッシュ
- アイテムのトグル時は楽観的更新（Optimistic Update）
- Firestoreへの書き込みは非同期（ユーザーはレスポンス待ちなし）

### 7.2 Firestore Indexing

**`checklist_presets`コレクション**:
```json
{
  "collectionGroup": "checklist_presets",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "is_public", "order": "ASCENDING" },
    { "fieldPath": "usage_count", "order": "DESCENDING" }
  ]
}
```

```json
{
  "collectionGroup": "checklist_presets",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "is_public", "order": "ASCENDING" },
    { "fieldPath": "created_at", "order": "DESCENDING" }
  ]
}
```

---

## 8. 今後の拡張機能

### 8.1 スマートリマインダー

- 出発日の3日前に「パスポート確認」をプッシュ通知
- 出発日の前日に「荷物の最終確認」を通知

### 8.2 共有チェックリスト

- 同じ旅行に参加する複数ユーザーでチェックリストを共有
- 役割分担（Aさんがホテル予約、BさんがレンタカーHold）

### 8.3 AI提案

- 過去の旅行データからチェックリスト項目を提案
- 「この季節のこの地域では〇〇が必要です」

### 8.4 プリセットの評価・レビュー

- プリセットに対する★評価とコメント
- 人気プリセットランキング

---

## 9. 実装優先順位

### Phase 1（MVP）
- [x] チェックリスト自動生成機能（実装済み）
- [x] Preparing / Packing の2カテゴリー表示（実装済み）
- [ ] メインコンテンツでの全幅表示（地図非表示）
- [ ] 手動アイテム追加機能の改善（カテゴリー選択UI）

### Phase 2（プリセット基本機能）
- [ ] プリセット作成機能
- [ ] マイプリセット管理画面
- [ ] プリセット適用機能

### Phase 3（プリセット共有機能）
- [ ] 公開プリセット検索機能
- [ ] プリセット閲覧・適用（他ユーザーのプリセット）
- [ ] 人気プリセットランキング

### Phase 4（高度な機能）
- [ ] ドラッグ&ドロップでの並び替え
- [ ] スマートリマインダー
- [ ] 共有チェックリスト

---

## 10. 関連ファイル

### コンポーネント
- `components/trip/TripChecklistView.tsx` - チェックリストメインビュー
- `components/ui/Checklist.tsx` - 汎用チェックリストコンポーネント
- `components/modals/ChecklistPresetModal.tsx` - プリセット作成・選択モーダル（新規）

### API
- `app/api/trips/[id]/checklist/route.ts` - GET/PUT
- `app/api/trips/[id]/checklist/generate/route.ts` - POST（再生成）
- `app/api/checklists/presets/route.ts` - プリセット管理API（新規）
- `app/api/checklists/presets/[id]/route.ts` - プリセット詳細API（新規）
- `app/api/trips/[id]/checklist/apply-preset/route.ts` - プリセット適用API（新規）

### ロジック
- `lib/checklist-generator.ts` - チェックリスト生成ロジック
- `lib/data/checklist-rules.ts` - チェックリスト生成ルール

### 型定義
- `lib/core/types.ts` - `ChecklistItem`, `TripChecklist`, `ChecklistPreset`, `ChecklistPresetItem`

### Firestore Collections
- `trip_checklists/{tripId}` - 旅行ごとのチェックリスト
- `checklist_presets/{presetId}` - ユーザー作成のプリセット

---

## 11. まとめ

チェックリスト機能は、旅行準備の効率化を目的とした重要な機能です。

**主要な特徴**:
1. **自動生成**: アクティビティタグに基づいた賢いチェックリスト生成
2. **カテゴリー分類**: Preparing（行動系）とPacking（持ち物系）の2カテゴリー
3. **カスタマイズ**: ユーザーが自由にアイテムを追加
4. **プリセット**: ユーザー作成のテンプレートを共有・再利用
5. **シームレスな体験**: 地図非表示で集中できるUI

この仕様に基づいて、段階的に実装を進めることで、ユーザーにとって使いやすく、実用的なチェックリスト機能を提供できます。

