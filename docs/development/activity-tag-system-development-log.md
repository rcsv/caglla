# アクティビティタグ＆チェックリストシステム 開発ログ

**開発日**: 2025-10-15  
**目的**: Itineraryにアクティビティタグを付与し、チェックリストの動的生成と統計分析を可能にする

---

## 📋 実装完了項目

### 1. **仕様ドキュメント** ✅
- `docs/activity-tag-checklist-system.md` - 詳細な仕様書（70KB以上）
  - データモデル設計
  - UI/UX設計
  - マスターデータ定義
  - APIエンドポイント設計
  - チェックリスト生成アルゴリズム
  - セキュリティ考慮事項

- `docs/activity-tag-implementation-summary.md` - 実装サマリー
  - 完了した実装一覧
  - 未実装項目と次のステップ
  - ファイル構成
  - テストケース

### 2. **型定義** ✅
- `lib/core/types.ts` に以下を追加：
  - `ActivityTag` - 2段階アクティビティタグ
  - `PrimaryCategoryType` - 10種類の大分類
  - `ChecklistItem` - チェックリスト項目
  - `TripChecklist` - Trip全体のチェックリスト
  - `ActivityStats` - アクティビティ統計
  - `Itinerary` 型に `activity_tag` フィールド追加

### 3. **マスターデータ** ✅
- `lib/data/activity-categories.ts` - アクティビティカテゴリーマスター
  - 10種類のPrimaryCategory（乗り物、買い物、食事、宿泊、探索、探検、遊ぶ、文化、健康、サービス）
  - 各カテゴリーに5〜8種類のSecondaryカテゴリー
  - アイコン、ラベル、説明文を含む
  - 合計70以上のSecondaryカテゴリー

- `lib/data/checklist-rules.ts` - チェックリスト生成ルール
  - 各アクティビティに対応するチェックリスト項目（200項目以上）
  - 条件付き生成（回数、期間、目的地別）
  - 行動系準備とパッキング系の分類
  - 動的値置換機能（`{count}日分`など）

### 4. **チェックリスト生成エンジン** ✅
- `lib/checklist-generator.ts` - `ChecklistGenerator` クラス
  - アクティビティタグからチェックリストを自動生成
  - 条件評価（回数、期間、目的地）
  - 動的値置換（`{count}日分` → `5日分`）
  - 重複除去、優先度ソート
  - 大陸コード自動推定機能

### 5. **UIコンポーネント** ✅
- `components/trip/ActivityTagSelector.tsx` - アクティビティタグ選択UI
  - 2段階ドロップダウン（Primary → Secondary）
  - リアルタイムプレビュー
  - クリア機能
  - アイコン表示

- `components/stats/ActivityStatsDisplay.tsx` - アクティビティ統計表示
  - カテゴリー別分布（プログレスバー）
  - Top 5詳細アクティビティ
  - パーセンテージ表示
  - カラフルなビジュアル

---

## 🚀 次のステップ（未実装項目）

実装優先度順に以下の項目が残っています：

### **Phase 1: Itineraryカードへの統合** 🔴 High
1. **SortableItineraryCard に ActivityTagSelector を統合**
   - ファイル: `components/trip/SortableItineraryCard.tsx`
   - Venue情報の下部にActivityTagSelectorを配置
   - 選択時に自動保存（API経由）

2. **API /api/itineraries/[id] に activity_tag フィールド対応**
   - ファイル: `app/api/itineraries/[id]/route.ts`
   - PUT メソッドで `activity_tag` を保存
   - Firestoreへの永続化

### **Phase 2: チェックリスト機能** 🟡 Medium
1. **チェックリスト生成API実装**
   - エンドポイント: `POST /api/trips/[id]/checklist/generate`
   - `ChecklistGenerator` を使用してチェックリスト生成
   - Firestoreの `trip_checklists` コレクションに保存

2. **チェックリスト更新API実装**
   - エンドポイント: `PUT /api/trips/[id]/checklist`
   - 完了状態の更新
   - カスタム項目の追加

3. **TripChecklistView コンポーネントの拡張**
   - ファイル: `components/trip/TripChecklistView.tsx`
   - 自動生成ボタンの追加
   - カテゴリー別表示（行動系準備、パッキング系）
   - チェックボックスでの完了状態管理
   - カスタム項目追加機能

4. **Firestore trip_checklists コレクション作成**
   - セキュリティルール設定
   - インデックス作成

### **Phase 3: 統計機能** 🟢 Low
1. **TripSummaryView に統計セクション追加**
   - ファイル: `components/trip/TripSummaryView.tsx`
   - "Activity Analysis" セクションを追加
   - `ActivityStatsDisplay` コンポーネントを統合

2. **統計APIエンドポイント（オプション）**
   - エンドポイント: `GET /api/trips/[id]/activity-stats`
   - キャッシュ機能

---

## 📊 システムの仕組み

### 1. 2段階アクティビティタグシステム

#### 1段階目（Primary Category）
旅行中の行動を10種類の大分類で分類：

| カテゴリー | アイコン | 説明 |
|-----------|---------|------|
| transportation | 🚆 | 乗り物に乗る（飛行機、電車、バスなど） |
| shopping | 🛍️ | 買い物をする（お土産、食料品など） |
| dining | 🍽️ | 食事をする（朝食、昼食、夕食など） |
| accommodation | 🏨 | 宿泊する（チェックイン、チェックアウトなど） |
| exploration | 🔍 | 探索する（街歩き、自然散策など） |
| adventure | 🏔️ | 探検する（ハイキング、ダイビングなど） |
| entertainment | 🎮 | 遊ぶ（テーマパーク、ビーチなど） |
| culture | 🏛️ | 文化に触れる（博物館、寺社仏閣など） |
| wellness | 💆 | 健康志向（スパ、ヨガなど） |
| service | 🔧 | サービス提供（両替、SIM購入など） |

#### 2段階目（Secondary Category）
各Primary Categoryに5〜8種類の詳細分類を用意（合計70以上）

**例: accommodation（宿泊する）の詳細分類**
- チェックイン作業 🔑
- チェックアウト作業 🚪
- 車中泊 🚐
- キャンプ ⛺
- ホステル泊 🏠
- 民泊 🏡
- 高級ホテル 🏰

### 2. チェックリスト自動生成の仕組み

#### アクティビティタグの例
```
ホテル → 宿泊する → チェックイン作業
レストラン → 食事をする → 夕食
美術館 → 文化に触れる → 美術館
ビーチ → 遊ぶ → ビーチ
```

#### チェックリスト生成例

**ケース1: 「チェックイン作業」を2回選択した場合**
```
✅ 行動系準備
- ホテル予約確認書をプリントアウト
- パスポートのコピー

✅ パッキング系
- 下着 × 2日分
- 靴下 × 2日分
- シャンプー・ボディソープ
- 歯ブラシ・歯磨き粉
```

**ケース2: 「水遊び（water_sports）」を選択した場合**
```
✅ パッキング系
- 水着
- ラッシュガード
- ビーチタオル
- 日焼け止め（SPF50+）
- 防水スマホケース
- ゴーグル・シュノーケルセット
```

**ケース3: アメリカ（US）への「飛行機」が含まれる場合**
```
✅ 行動系準備
- パスポートの有効期限確認（6ヶ月以上残存）
- 航空券の印刷またはモバイルチケット準備
- ESTA申請（アメリカ入国）★目的地条件で自動追加
- 海外旅行保険加入

✅ パッキング系
- ネックピロー
- 耳栓・アイマスク
```

#### 条件付き生成の仕組み

チェックリスト項目は以下の条件で動的に生成されます：

| 条件タイプ | 説明 | 例 |
|-----------|------|-----|
| `always` | 常に生成 | パスポート、航空券 |
| `count` | アクティビティの回数 | 下着 × {count}日分 |
| `duration` | 旅行期間 | 7日以上で常備薬追加 |
| `destination` | 目的地（国・大陸） | US → ESTA申請 |

#### 動的値の置換

チェックリスト項目のタイトルに動的な値を埋め込み：

| プレースホルダー | 説明 | 変換例 |
|-----------------|------|--------|
| `{count}` | アクティビティの回数 | `下着 × {count}日分` → `下着 × 5日分` |
| `{duration}` | 旅行期間（日数） | `{duration}日分の常備薬` → `7日分の常備薬` |

### 3. アクティビティ統計分析

#### 統計表示項目
- **カテゴリー別分布**: Primary Categoryごとの割合とプログレスバー
- **詳細アクティビティTop 5**: 最も多いSecondary Categoryのランキング
- **総アクティビティ数**: タグ付けされたItineraryの合計

#### 統計の活用
- 旅行スタイルの可視化（文化系、アクティブ系など）
- 次回旅行の計画立案に活用
- 過去の旅行パターン分析

---

## 📁 作成ファイル一覧

### 新規作成ファイル（8ファイル）

#### ドキュメント
```
docs/
  ✅ activity-tag-checklist-system.md          # 詳細仕様書（1,013行）
  ✅ activity-tag-implementation-summary.md    # 実装サマリー
  ✅ activity-tag-system-development-log.md    # 開発ログ（本ファイル）
```

#### ライブラリ・ロジック
```
lib/
  data/
    ✅ activity-categories.ts                   # アクティビティカテゴリーマスター（220行）
    ✅ checklist-rules.ts                       # チェックリスト生成ルール（600行以上）
  ✅ checklist-generator.ts                     # チェックリスト生成エンジン（280行）
```

#### コンポーネント
```
components/
  trip/
    ✅ ActivityTagSelector.tsx                 # アクティビティタグ選択UI（135行）
  stats/
    ✅ ActivityStatsDisplay.tsx                # アクティビティ統計表示（160行）
```

### 修正ファイル（1ファイル）

```
lib/
  core/
    ✅ types.ts                                # 型定義追加（60行追加）
      - ActivityTag型
      - PrimaryCategoryType型
      - ChecklistItem型
      - TripChecklist型
      - ActivityStats型
```

### 未実装ファイル（今後作成予定）

#### APIエンドポイント
```
app/api/
  itineraries/[id]/
    🚧 route.ts                               # activity_tag対応（修正予定）
  trips/[id]/
    checklist/
      🚧 generate/route.ts                    # チェックリスト生成API（新規）
      🚧 route.ts                             # チェックリスト更新API（新規）
    🚧 activity-stats/route.ts                # 統計API（新規・オプション）
```

#### コンポーネント
```
components/
  trip/
    🚧 SortableItineraryCard.tsx             # ActivityTagSelector統合（修正予定）
    🚧 TripChecklistView.tsx                 # 拡張（修正予定）
    🚧 TripSummaryView.tsx                   # 統計セクション追加（修正予定）
```

---

## 🔧 技術スタック

### フロントエンド
- **Next.js 14** (App Router)
- **React 18**
- **TypeScript**
- **Tailwind CSS**

### バックエンド
- **Firebase Firestore** (データベース)
- **Firebase Authentication** (認証)
- **Next.js API Routes** (RESTful API)

### ライブラリ
- **@dnd-kit** (ドラッグ&ドロップ)
- **date-fns** または **dayjs** (日付処理)

---

## 📈 開発スケジュール（予定）

| Phase | タスク | 期間 | 優先度 |
|-------|--------|------|--------|
| **Phase 1** | データモデル＆マスターデータ整備 | 1週間 | ✅ 完了 |
| **Phase 2** | UIコンポーネント実装 | 2週間 | 🔴 High |
| **Phase 3** | チェックリスト自動生成 | 2週間 | 🟡 Medium |
| **Phase 4** | 統計・分析機能 | 1週間 | 🟢 Low |
| **Phase 5** | マスターデータ充実化 | 継続 | 🟢 Low |

**総開発期間: 約6週間**

---

## 🎯 期待される効果

### ユーザーメリット
1. **旅行準備の効率化**
   - アクティビティに応じた持ち物を自動提案
   - 手続き（ESTA、保険など）の漏れ防止

2. **立ち寄り理由の明確化**
   - 各Venueでの行動内容を記録
   - 旅程の振り返りが容易

3. **旅行スタイルの可視化**
   - 文化系、アクティブ系などの傾向分析
   - 次回旅行の計画立案に活用

### 開発者メリット
1. **データ駆動の機能拡張**
   - アクティビティデータを活用した推薦機能
   - 機械学習による提案の高度化

2. **保守性の向上**
   - マスターデータとロジックの分離
   - 型安全なコード

---

## 🔐 セキュリティ考慮事項

### Firestore Security Rules
```javascript
// trip_checklists コレクション
match /trip_checklists/{checklistId} {
  allow read: if request.auth != null && 
    get(/databases/$(database)/documents/trips/$(checklistId)).data.user_id == request.auth.uid;
  allow write: if request.auth != null && 
    get(/databases/$(database)/documents/trips/$(checklistId)).data.user_id == request.auth.uid;
}
```

### データ検証
- アクティビティタグの値はマスターデータに存在するもののみ許可
- カスタムチェックリスト項目は文字数制限（最大500文字）

---

## 📚 参考資料

- [Firestore Data Modeling Best Practices](https://firebase.google.com/docs/firestore/data-model)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

---

## 📝 開発メモ

### 設計上の決定事項
1. **2段階分類の採用理由**
   - 粒度の調整が柔軟
   - UI上での選択が直感的
   - 拡張性が高い

2. **チェックリスト生成ルールの外部化**
   - `checklist-rules.ts` にルールを集約
   - マスターデータとして管理
   - 将来的にFirestoreやCMSに移行可能

3. **条件付き生成の採用**
   - 旅行期間や目的地に応じた柔軟な生成
   - ユーザー体験の向上

### 今後の拡張案
- 機械学習による提案の高度化
- コミュニティ機能（チェックリスト共有）
- 多言語対応
- PDF/印刷機能

---

**作成日**: 2025-10-15  
**最終更新**: 2025-10-15  
**ステータス**: Phase 1完了、Phase 2〜4は未実装  
**次のアクション**: SortableItineraryCardへのActivityTagSelector統合

