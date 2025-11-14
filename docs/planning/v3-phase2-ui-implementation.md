# v3.0.0 Phase 2: UI実装計画

**作成日**: 2025-11-14  
**最終更新**: 2025-11-14

---

## 📋 概要

Phase 1で実装したAPIとSocial Operationsを活用して、UIコンポーネントとページを実装します。

---

## 🎯 実装順序

### **Phase 2-1: フィードページ実装**（優先度: 最高）

**目標**: 公開フィード、トレンドフィード、フォロー中フィードを表示するページを実装

**実装タスク:**
1. `app/feed/page.tsx` の作成
   - タブ切り替え: Public / Trending / Following
   - Server Component でフィードデータ取得
   - 無限スクロール対応（カーソルベースページネーション）

2. `components/social/TripFeed.tsx` の作成
   - Client Component: フィード表示ロジック
   - 無限スクロール実装（IntersectionObserver）
   - 読み込み状態表示

3. `components/social/TripCard.tsx` の作成
   - Server Component: トリップカード表示
   - 公開情報のみ表示（creator情報含む）
   - リンク: `/[userSlug]/[tripSlug]`

**API使用:**
- `GET /api/feed/public`
- `GET /api/feed/trending`
- `GET /api/feed/following`

---

### **Phase 2-2: TripCard コンポーネント実装**

**目標**: フィードや検索結果で表示するトリップカードコンポーネントを実装

**実装タスク:**
1. `components/social/TripCard.tsx` の実装
   - Server Component: サーバーサイドでデータ取得
   - 画像、タイトル、作成者情報、統計情報表示
   - いいね・コメント数表示

2. `components/social/TripCardSkeleton.tsx` の作成
   - ローディング状態表示用

**表示項目:**
- トリップ画像（`image_url`）
- タイトル
- 作成者情報（`creator.name`, `creator.slug`, `creator.profile_image_url`）
- 統計情報（`social_stats.likes_count`, `social_stats.comments_count`）
- 公開日時（`published_at`）

---

### **Phase 2-3: Social Components実装**

**目標**: いいね・コメント・フォロー機能のUIコンポーネントを実装

**実装タスク:**

1. **いいねボタン**
   - `components/social/LikeButton.tsx`
   - Client Component
   - API: `GET /api/trip/[tripSlug]/likes`, `POST /api/trip/[tripSlug]/likes`, `DELETE /api/trip/[tripSlug]/likes`
   - 楽観的UI更新（Optimistic Update）

2. **コメント機能**
   - `components/social/CommentList.tsx` - コメント一覧表示
   - `components/social/CommentInput.tsx` - コメント入力
   - `components/social/CommentItem.tsx` - 個別コメント表示
   - API: `GET /api/trip/[tripSlug]/comments`, `POST /api/trip/[tripSlug]/comments`, `PUT /api/trip/[tripSlug]/comments/[commentId]`, `DELETE /api/trip/[tripSlug]/comments/[commentId]`

3. **フォローボタン**
   - `components/social/FollowButton.tsx`
   - Client Component
   - API: `GET /api/users/[userSlug]/follow`, `POST /api/users/[userSlug]/follow`, `DELETE /api/users/[userSlug]/follow`
   - 楽観的UI更新

**技術要件:**
- React Hook Form（コメント入力）
- 楽観的UI更新（Optimistic Update）
- エラーハンドリングとロールバック

---

### **Phase 2-4: Route Groups導入**

**目標**: 既存ページをRoute Groupsに整理して、レイアウトを最適化

**実装タスク:**

1. **Route Groups作成**
   - `app/(discover)/feed/` - フィードページ
   - `app/(discover)/explore/` - 探索ページ（将来的）
   - `app/(discover)/templates/` - テンプレート一覧
   - `app/(planner)/[userSlug]/[tripSlug]/` - 旅行計画ページ（既存）
   - `app/(profile)/[userSlug]/` - プロフィールページ（既存）

2. **レイアウトファイル作成**
   - `app/(discover)/layout.tsx` - SNS風レイアウト
   - `app/(planner)/layout.tsx` - エディターレイアウト
   - `app/(profile)/layout.tsx` - プロフィールレイアウト

3. **既存ページの移行**
   - `app/[userSlug]/[tripSlug]/page.tsx` → `app/(planner)/[userSlug]/[tripSlug]/page.tsx`
   - `app/[userSlug]/page.tsx` → `app/(profile)/[userSlug]/page.tsx`

---

### **Phase 2-5: Parallel Routes実装**

**目標**: 旅行詳細ページにParallel Routesを導入して、タイムライン、地図、SNS機能を並列表示

**実装タスク:**

1. **Parallel Routes構造作成**
   ```
   app/(planner)/[userSlug]/[tripSlug]/
   ├── @timeline/          # タイムライン（既存のTripItineraryView）
   │   ├── default.tsx
   │   └── page.tsx
   ├── @map/               # 地図（既存のTripMap）
   │   ├── default.tsx
   │   └── page.tsx
   ├── @social/            # SNS機能（新規）
   │   ├── default.tsx
   │   └── page.tsx
   ├── layout.tsx          # Parallel Routes統合レイアウト
   └── page.tsx            # メインコンテンツ（TripHeroSection）
   ```

2. **Intercepting Routes実装**（オプション）
   - `app/(planner)/[userSlug]/[tripSlug]/(..)comments/[commentId]/page.tsx` - コメントモーダル

3. **レイアウト統合**
   - 3つのParallel Routeを適切に配置
   - レスポンシブ対応（モバイルでは1カラム）

---

## 📊 実装詳細

### **Phase 2-1: フィードページ**

#### ファイル構成
```
app/feed/
├── page.tsx                    # Server Component: フィードページ
├── loading.tsx                 # Instant Loading State
└── error.tsx                   # Error Boundary

components/social/
├── TripFeed.tsx                # Client Component: フィード表示ロジック
├── TripCard.tsx                # Server Component: トリップカード
└── TripCardSkeleton.tsx        # ローディング用スケルトン
```

#### `app/feed/page.tsx` の実装方針
- デフォルトでPublic Feedを表示
- URLパラメータで `?tab=trending` や `?tab=following` に対応
- Server Component で初期データ取得
- Client Component (`TripFeed`) にデータを渡して無限スクロール実装

#### `components/social/TripFeed.tsx` の実装方針
- 無限スクロール実装（IntersectionObserver使用）
- カーソルベースページネーション
- 楽観的UI更新
- エラーハンドリングとリトライ機能

---

### **Phase 2-3: Social Components**

#### いいねボタン (`components/social/LikeButton.tsx`)

```typescript
interface LikeButtonProps {
  tripSlug: string
  initialLiked: boolean
  initialCount: number
  onToggle?: (liked: boolean, count: number) => void
}
```

**機能:**
- いいね状態の表示・切り替え
- 楽観的UI更新
- エラーハンドリングとロールバック
- アニメーション（任意）

#### コメント機能

**`components/social/CommentList.tsx`:**
- コメント一覧表示
- ページネーション（必要に応じて）
- 削除されたコメントの非表示

**`components/social/CommentInput.tsx`:**
- コメント入力フォーム
- バリデーション
- 送信時のローディング状態

**`components/social/CommentItem.tsx`:**
- 個別コメント表示
- 編集・削除ボタン（所有者のみ）
- ネストされたコメント表示（将来的）

---

## 🔧 技術スタック

- **React**: 18+
- **Next.js**: App Router
- **TypeScript**: 型安全性確保
- **Tailwind CSS**: スタイリング
- **React Hook Form**: フォーム管理（コメント入力）
- **IntersectionObserver**: 無限スクロール
- **React Testing Library**: コンポーネントテスト

---

## ✅ チェックリスト

### Phase 2-1: フィードページ実装
- [ ] `app/feed/page.tsx` 作成
- [ ] `components/social/TripFeed.tsx` 作成
- [ ] `components/social/TripCard.tsx` 作成
- [ ] `components/social/TripCardSkeleton.tsx` 作成
- [ ] 無限スクロール実装
- [ ] エラーハンドリング
- [ ] ローディング状態表示

### Phase 2-2: TripCard コンポーネント実装
- [ ] `components/social/TripCard.tsx` 完成
- [ ] 画像最適化（Next.js Image）
- [ ] 統計情報表示
- [ ] レスポンシブ対応

### Phase 2-3: Social Components実装
- [ ] `components/social/LikeButton.tsx` 実装
- [ ] `components/social/CommentList.tsx` 実装
- [ ] `components/social/CommentInput.tsx` 実装
- [ ] `components/social/CommentItem.tsx` 実装
- [ ] `components/social/FollowButton.tsx` 実装
- [ ] 楽観的UI更新実装
- [ ] エラーハンドリング

### Phase 2-4: Route Groups導入
- [ ] Route Groupsディレクトリ作成
- [ ] レイアウトファイル作成
- [ ] 既存ページの移行
- [ ] URL互換性の維持（リダイレクト）

### Phase 2-5: Parallel Routes実装
- [ ] Parallel Routes構造作成
- [ ] `@timeline`, `@map`, `@social` の実装
- [ ] レイアウト統合
- [ ] レスポンシブ対応

---

## 🚀 次のステップ

1. **Phase 2-1を開始**: フィードページとTripCardコンポーネントの実装
2. **Phase 2-3を並行実装**: Social Componentsの実装（フィードページから独立）
3. **Phase 2-4・2-5を最後に実装**: Route GroupsとParallel Routesは既存ページに影響するため慎重に

---

**作成日**: 2025-11-14  
**最終更新**: 2025-11-14

