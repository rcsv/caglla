# Trip Guide ページ仕様・実装計画

**作成日**: 2025-01-XX  
**状態**: 📋 計画中  
**優先度**: 高  
**関連ページ**: `/home`, `/trip-guide`

---

## 📋 概要

現在、`/home` ページには「自分が行く旅行」と「ガイド作成」の機能が混在しており、ユーザー体験が混乱している。これを分離し、ガイド作成者向けの専用ページ `/trip-guide` を新設する。

### 目的

- `/home` ページを「自分が行く旅行」に集中させる
- ガイド作成者向けの機能を `/trip-guide` に集約
- ガイド作成、管理、分析を一箇所で完結できる UX を提供

---

## 🎯 設計方針

### `/home` ページの役割

**自分が行く旅行に集中**

- ✅ 進行中の旅行（Ongoing Trips）
- ✅ これから先の旅行（Upcoming Trips）
- ✅ 過去の旅行（Memories）
- ✅ 最近チェックした旅行（Recently Checked）
- ✅ 共有された旅行（My Shares）
- ❌ ガイド作成機能（削除）
- ❌ 執筆中のガイド（削除）

### `/trip-guide` ページの役割

**ガイド作成者向けの専用ダッシュボード**

- ✅ ガイドの新規作成
- ✅ 執筆中のガイドの管理
- ✅ 公開済みガイドの一覧
- ✅ ガイドの人気・統計情報
- ✅ フィードバック・コメントの確認
- ✅ ガイドの編集・削除

---

## 📐 ページ構造

### `/trip-guide` ページレイアウト

```
┌─────────────────────────────────────────────────────────┐
│ Header (HomeHeader と同じ)                              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ ガイド作成者ダッシュボード                        │  │
│  │                                                  │  │
│  │  [新規ガイド作成] ボタン                         │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ タブ: [執筆中] [公開済み] [統計]                  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ メインコンテンツエリア                            │  │
│  │                                                  │  │
│  │  [選択されたタブの内容]                          │  │
│  │  - 執筆中: ドラフトガイド一覧                    │  │
│  │  - 公開済み: 公開ガイド一覧 + 統計               │  │
│  │  - 統計: 全体統計・人気ガイド・フィードバック    │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
│ Footer (HomeFooter と同じ)                              │
└─────────────────────────────────────────────────────────┘
```

---

## 🎨 UI/UX 詳細仕様

### 1. ヘッダーセクション

**新規ガイド作成ボタン**

- 位置: ページ上部、タイトルの下
- デザイン: プライマリボタン（`variant="primary"`）
- アイコン: `mdi:book-plus-outline`
- ラベル: "新規ガイドを作成"
- 動作: `CreateTripDialog` を `initialMode="template"` で開く

### 2. タブセクション

**3つのタブ**

1. **執筆中** (`draft`)
   - アイコン: `mdi:book-edit-outline`
   - 表示内容: `access_level: 'private'` かつ `is_template: true` のガイド
   - ソート: `updated_at` 降順（最近更新された順）

2. **公開済み** (`published`)
   - アイコン: `mdi:book-open-variant`
   - 表示内容: `access_level: 'public'` または `'unlisted'` かつ `is_template: true` のガイド
   - ソート: `updated_at` 降順、または人気順（将来的に）

3. **統計** (`analytics`)
   - アイコン: `mdi:chart-line`
   - 表示内容: ガイド全体の統計情報、人気ガイド、フィードバック

### 3. 執筆中タブ

**ガイドカード表示**

- レイアウト: グリッド（3列、モバイルは1列）
- カード内容:
  - タイトル
  - 目的地
  - 日数
  - 最終更新日時
  - ステータスバッジ（Draft）
  - アクション: [編集] [削除] [公開する]
- 空状態: "執筆中のガイドはありません。新規ガイドを作成しましょう。"

**アクション**

- **編集**: ガイドのプランナーページに遷移（`/${userSlug}/${tripSlug}`）
- **削除**: 確認ダイアログを表示して削除
- **公開する**: アクセスレベルを `public` に変更するモーダル

### 4. 公開済みタブ

**ガイドカード表示**

- レイアウト: グリッド（3列、モバイルは1列）
- カード内容:
  - タイトル
  - 目的地
  - 日数
  - 公開日時
  - ステータスバッジ（Public / Shared link）
  - **統計情報**:
    - 閲覧数（views）
    - いいね数（likes）
    - コメント数（comments）
    - シェア数（shares）
    - 複製数（replicas）
  - アクション: [編集] [統計を見る] [非公開にする]

**アクション**

- **編集**: ガイドのプランナーページに遷移
- **統計を見る**: 統計タブに切り替え、該当ガイドの詳細統計を表示
- **非公開にする**: アクセスレベルを `private` に変更するモーダル

### 5. 統計タブ

**全体統計セクション**

- 総ガイド数
- 総閲覧数
- 総いいね数
- 総複製数
- 平均評価（将来的に）

**人気ガイドランキング**

- トップ5のガイドを表示
- ソート基準: 閲覧数、いいね数、複製数（切り替え可能）
- 各ガイドの統計情報を表示

**フィードバック・コメント**

- 最近のコメント一覧（将来的に実装）
- コメントへの返信機能（将来的に実装）

---

## 🔧 技術実装詳細

### ファイル構成

```
app/
  trip-guide/
    page.tsx                    # メインページ
    components/
      GuideCreatorHeader.tsx    # ヘッダーセクション（新規作成ボタン含む）
      GuideTabs.tsx              # タブコンポーネント
      DraftGuidesSection.tsx    # 執筆中ガイド一覧
      PublishedGuidesSection.tsx # 公開済みガイド一覧
      GuideAnalyticsSection.tsx  # 統計セクション
      GuideCard.tsx              # ガイドカード（再利用可能）
```

### データ取得

**既存の API を活用**

- `/api/trips/my-guides?status=draft` - 執筆中ガイド取得
- `/api/trips/my-guides?status=published` - 公開済みガイド取得
- `/api/trips/my-guides?status=all` - 全ガイド取得（統計用）

**新規 API（将来的に）**

- `/api/trips/[tripId]/analytics` - 個別ガイドの詳細統計
- `/api/trips/my-guides/analytics` - 全体統計

### 状態管理

**React Hooks を使用**

```typescript
// 既存のフックを活用
const { trips: draftGuides, loading: draftLoading, refresh: refreshDraft } = useMyGuides('draft')
const { trips: publishedGuides, loading: publishedLoading, refresh: refreshPublished } = useMyGuides('published')

// タブ状態
const [activeTab, setActiveTab] = useState<'draft' | 'published' | 'analytics'>('draft')
```

### コンポーネント設計

**GuideCard コンポーネント**

```typescript
interface GuideCardProps {
  trip: Trip
  variant: 'draft' | 'published'
  onEdit: (tripId: string) => void
  onDelete: (tripId: string) => void
  onPublish?: (tripId: string) => void
  onUnpublish?: (tripId: string) => void
  onViewAnalytics?: (tripId: string) => void
}
```

**アクションモーダル**

- `PublishGuideModal`: ガイドを公開する際の確認モーダル
- `UnpublishGuideModal`: ガイドを非公開にする際の確認モーダル
- `DeleteGuideModal`: ガイドを削除する際の確認モーダル

---

## 📝 実装フェーズ

### Phase 1: 基本構造の実装

1. **ページ作成**
   - `app/trip-guide/page.tsx` を作成
   - 基本的なレイアウト（Header, Footer, Main Content）

2. **ヘッダーセクション**
   - `GuideCreatorHeader` コンポーネント作成
   - 新規ガイド作成ボタンの実装

3. **タブセクション**
   - `GuideTabs` コンポーネント作成
   - タブ切り替え機能の実装

### Phase 2: 執筆中ガイドの実装

1. **DraftGuidesSection コンポーネント**
   - 執筆中ガイド一覧の表示
   - `useMyGuides('draft')` を使用してデータ取得

2. **GuideCard コンポーネント（Draft バリアント）**
   - ガイド情報の表示
   - 編集・削除・公開ボタンの実装

3. **アクションモーダル**
   - `PublishGuideModal` の実装
   - `DeleteGuideModal` の実装

### Phase 3: 公開済みガイドの実装

1. **PublishedGuidesSection コンポーネント**
   - 公開済みガイド一覧の表示
   - `useMyGuides('published')` を使用してデータ取得

2. **GuideCard コンポーネント（Published バリアント）**
   - 統計情報の表示
   - 編集・統計・非公開ボタンの実装

3. **アクションモーダル**
   - `UnpublishGuideModal` の実装

### Phase 4: 統計機能の実装

1. **GuideAnalyticsSection コンポーネント**
   - 全体統計の表示
   - 人気ガイドランキングの表示

2. **統計データの集計**
   - 既存の `social_stats` を活用
   - 必要に応じて集計ロジックを実装

### Phase 5: `/home` ページからの分離

1. **`/home` ページの修正**
   - `MyGuidesSection` を削除
   - `HomeWelcomeRow` から「Create Guide」ボタンを削除
   - `/trip-guide` へのリンクを追加（オプション）

2. **ナビゲーションの追加**
   - `HomeHeader` に「ガイド」リンクを追加（オプション）

---

## 🔄 移行計画

### 段階的移行

1. **Phase 1-3 を実装**
   - `/trip-guide` ページを完成させる
   - 既存の機能を移行

2. **テスト・検証**
   - ガイド作成者が `/trip-guide` で作業できることを確認
   - UI/UX の改善点を洗い出す

3. **`/home` ページのクリーンアップ**
   - ガイド関連の機能を削除
   - `/trip-guide` への導線を追加

---

## 🎯 成功基準

### 機能要件

- ✅ ガイドの新規作成ができる
- ✅ 執筆中のガイドを一覧表示できる
- ✅ 執筆中のガイドを編集・削除・公開できる
- ✅ 公開済みガイドを一覧表示できる
- ✅ 公開済みガイドの統計情報を確認できる
- ✅ 公開済みガイドを非公開にできる

### UX 要件

- ✅ `/home` ページが「自分が行く旅行」に集中している
- ✅ ガイド作成者が `/trip-guide` で作業を完結できる
- ✅ ガイド作成と旅行計画の役割が明確に分離されている

---

## 📚 参考資料

### 既存コンポーネント

- `components/home/MyGuidesSection.tsx` - 執筆中ガイド表示（移行元）
- `components/home/HomeWelcomeRow.tsx` - 新規作成ボタン（参考）
- `components/tripcard/TripCard.tsx` - カード表示（参考）

### 既存 API

- `app/api/trips/my-guides/route.ts` - ガイド取得 API
- `hooks/useMyGuides.ts` - ガイド取得フック

### 既存モーダル

- `components/common/CreateTripDialog.tsx` - ガイド作成ダイアログ

---

## 🔮 将来の拡張

### 統計機能の強化

- 個別ガイドの詳細統計ページ（`/trip-guide/[tripSlug]/analytics`）
- 時系列での統計表示（グラフ）
- ユーザー属性分析（将来的に）

### フィードバック機能

- コメント機能の実装
- 評価・レビュー機能の実装
- ガイド作成者への通知機能

### ガイド管理機能の強化

- 一括操作（複数ガイドの公開・非公開）
- ガイドのカテゴリ・タグ管理
- ガイドの検索・フィルタリング

---

## 📝 メモ

- ガイド作成者は旅行者でもあるため、`/home` と `/trip-guide` の両方にアクセスできる
- ガイド作成機能は `/trip-guide` に集約するが、既存のガイド閲覧機能（`/${userSlug}/${tripSlug}`）は維持
- 将来的には、ガイド作成者向けの専用プランや機能を検討する余地がある

