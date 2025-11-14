# v3.0.0 アーキテクチャ構想: SNS機能統合とApp Router最適化

**Version:** 3.0.0  
**Status:** Planning Phase  
**Last Updated:** 2025-11-13  
**Target Release:** 2026 Q2-Q3

---

## 📋 目次

1. [背景と動機](#背景と動機)
2. [設計原則](#設計原則)
3. [アーキテクチャ概要](#アーキテクチャ概要)
4. [ディレクトリ構造](#ディレクトリ構造)
5. [データモデル](#データモデル)
6. [段階的移行パス](#段階的移行パス)
7. [パフォーマンス戦略](#パフォーマンス戦略)
8. [技術的課題と対策](#技術的課題と対策)
9. [開発ロードマップ](#開発ロードマップ)

---

## 背景と動機

### 現状の課題

v2.x系では、個人・友人間での旅行計画共有が中心でしたが、以下の要望が増えています：

1. **テンプレート共有の活性化**: 作成した旅程を広く共有したいユーザーが多い
2. **発見性の向上**: 他ユーザーの旅程を参考にしたい、インスピレーションを得たい
3. **コミュニティ形成**: 同じ目的地に興味がある人との繋がりを求める声
4. **エンゲージメント**: いいね・コメント・フォローなどのソーシャル機能の要望

### v3.0.0 のゴール

- **SNS的な発見と共有**: 公開旅程のフィード表示、いいね・コメント機能
- **テンプレート経済圏**: 優れたテンプレートが評価され、広く利用される仕組み
- **スケーラビリティ**: 大量の公開コンテンツを効率的に配信
- **後方互換性**: v2.x からの段階的移行を保証

---

## 設計原則

### 1. **Incremental Adoption First（App Router 内での段階移行）** 🔄

現行リポジトリはすでに **App Router ベース（`app/` のみ）** で運用されているため、
「Pages Router → App Router 移行」ではなく、
**既存の App Router 構成を Route Group / Parallel Routes へ段階的にリファクタ**する方針とする。

- **ルート単位での移行**: 既存の `app/` 配下ルートを `(discover)`, `(planner)`, `(profile)` へ徐々に再配置
- **互換レイヤーの維持**: 一時的に `app/(legacy)/...` を残し、主要導線は新 Route Group へ誘導
- **Feature Flag制御**: 新旧UIを切り替え可能なフラグを導入し、ロールバックを容易にする
- **安全なデプロイ**: Route Group 追加前に「現行ルート一覧」と「新構成案」の突き合わせを行い、
  競合や 404 のリスクをレビューで必須確認事項とする

### 2. **Server-First, Client When Needed** ⚡

React 18/Next.js App Routerの特性を最大限活用：

- **Server Components**: 初期表示、SEO重要なコンテンツ
- **Client Components**: インタラクション、リアルタイム更新
- **Streaming**: Suspenseで段階的なコンテンツ表示

### 3. **Data Fetching Strategy** 📊

| データ種別 | 戦略 | 理由 |
|-----------|------|------|
| Trip本体 | RSC + `revalidate: 3600` | SEO重要、頻繁な更新不要 |
| いいね数 | Client + Firestore Realtime | リアルタイム性が重要 |
| コメント | RSC (初期) + Client (追加) | 初期表示はSEO、追加読み込みはUX |
| フィード | RSC + ISR (`revalidate: 300`) + Client補正 | トレンド値は5分粒度で更新しつつ、クライアント側で最新いいね数などを補正 |

### 4. **Cost-Conscious Firebase Usage** 💰

Firestore/Storage のコスト最適化：

- **Composite Indexes**: クエリ最適化で読み込み回数削減
- **FieldValue.increment()**: 競合回避で無駄な書き込み削減
- **Pagination**: 無限スクロールで大量データの一括読み込み回避
- **CDN Caching**: Vercel Edge Cache で Firestore 読み込み削減

---

## アーキテクチャ概要

### Route Groups による機能分離

Next.js App Router の **Route Groups** を活用し、異なるユーザー体験を明確に分離します。

```
app/
├── (discover)/              # 発見・探索（SNS的体験）
│   ├── feed/
│   ├── explore/
│   ├── templates/
│   └── layout.tsx           # フィードレイアウト
│
├── (planner)/               # 旅行計画（エディター体験）
│   ├── [userSlug]/
│   │   └── [tripSlug]/
│   │       ├── @timeline/   # Parallel Route: タイムライン表示
│   │       ├── @map/        # Parallel Route: 地図表示
│   │       ├── @social/     # Parallel Route: いいね・コメント
│   │       ├── (..)comments/[commentId]/  # Intercepting Route
│   │       ├── layout.tsx   # 統合レイアウト
│   │       └── page.tsx     # デフォルトビュー
│   └── layout.tsx           # プランナーレイアウト
│
├── (profile)/               # プロフィール
│   ├── [userSlug]/
│   │   ├── profile/
│   │   └── settings/
│   └── layout.tsx           # プロフィールレイアウト
│
└── layout.tsx               # グローバルレイアウト
```

### Parallel Routes の活用 (RFC準拠)

**`app/(planner)/[userSlug]/[tripSlug]/layout.tsx`**

```typescript
export default function TripLayout({
  children,
  timeline,  // @timeline slot
  map,       // @map slot
  social,    // @social slot
}: {
  children: React.ReactNode
  timeline: React.ReactNode
  map: React.ReactNode
  social: React.ReactNode
}) {
  return (
    <div className="trip-layout">
      <div className="left-pane">{timeline}</div>
      <div className="center-pane">{children}</div>
      <div className="right-pane">
        {map}
        {social}
      </div>
    </div>
  )
}
```

**メリット:**
- 各スロットが独立してデータフェッチ可能
- Suspense境界を自然に分離 → 段階的な表示
- タブ切り替え時にmapの状態を維持可能
- コード分割が自動化 → 初回ロード高速化

### Intercepting Routes でモーダル体験 (RFC準拠)

**コメント詳細をモーダルとページの両方で表示:**

```
app/
├── (planner)/
│   └── [userSlug]/
│       └── [tripSlug]/
│           ├── (..)comments/[commentId]/  # Intercepting Route
│           │   └── page.tsx               # モーダル表示
│           └── page.tsx
└── comments/
    └── [commentId]/
        └── page.tsx                        # 直リンク用ページ
```

**実装例:**

```typescript
// app/(planner)/[userSlug]/[tripSlug]/(..)comments/[commentId]/page.tsx
export default function CommentModal({ params }: { params: { commentId: string } }) {
  return (
    <Modal>
      <CommentDetail commentId={params.commentId} />
    </Modal>
  )
}

// app/comments/[commentId]/page.tsx
export default function CommentPage({ params }: { params: { commentId: string } }) {
  return (
    <div className="comment-page">
      <CommentDetail commentId={params.commentId} />
    </div>
  )
}
```

**メリット:**
- URL共有可能 → SEO対応
- 戻るボタンで自然にモーダルが閉じる
- コンポーネント再利用

---

## ディレクトリ構造

### 完全なディレクトリ構造

```
app/
├── (discover)/                         # Route Group: 発見・探索
│   ├── feed/
│   │   ├── page.tsx                    # Server Component: フィード表示
│   │   ├── loading.tsx                 # Instant Loading State
│   │   └── error.tsx                   # Error Boundary
│   ├── explore/
│   │   ├── page.tsx                    # 国別・テーマ別探索
│   │   └── [category]/
│   │       └── page.tsx                # カテゴリー別フィード
│   ├── templates/
│   │   ├── page.tsx                    # 人気テンプレート一覧
│   │   └── [templateSlug]/             # スラッグ駆動 URL（`generateUniqueSlug` を利用）
│   │       └── page.tsx                # テンプレート詳細
│   └── layout.tsx                      # SNS風レイアウト
│
├── (planner)/                          # Route Group: 旅行計画
│   ├── [userSlug]/
│   │   └── [tripSlug]/
│   │       ├── @timeline/              # Parallel Route: タイムライン
│   │       │   ├── default.tsx
│   │       │   └── page.tsx
│   │       ├── @map/                   # Parallel Route: 地図
│   │       │   ├── default.tsx
│   │       │   └── page.tsx
│   │       ├── @social/                # Parallel Route: SNS機能
│   │       │   ├── default.tsx
│   │       │   └── page.tsx
│   │       ├── (..)comments/           # Intercepting Route
│   │       │   └── [commentId]/
│   │       │       └── page.tsx        # コメントモーダル
│   │       ├── layout.tsx              # Parallel Routes統合
│   │       ├── page.tsx                # メインコンテンツ
│   │       ├── loading.tsx
│   │       └── error.tsx
│   └── layout.tsx                      # エディターレイアウト
│
├── (profile)/                          # Route Group: プロフィール
│   ├── [userSlug]/
│   │   ├── profile/
│   │   │   └── page.tsx                # ユーザープロフィール
│   │   ├── trips/
│   │   │   └── page.tsx                # 旅程一覧
│   │   ├── followers/
│   │   │   └── page.tsx                # フォロワー一覧
│   │   └── following/
│   │       └── page.tsx                # フォロー中一覧
│   └── layout.tsx                      # プロフィールレイアウト
│
├── comments/                            # 直リンク用コメントページ
│   └── [commentId]/
│       └── page.tsx
│
├── api/                                 # API Routes
│   ├── social/
│   │   ├── like/route.ts               # いいね機能
│   │   ├── comment/route.ts            # コメント機能
│   │   └── share/route.ts              # シェア機能
│   ├── feed/
│   │   ├── public/route.ts             # 公開フィード
│   │   ├── following/route.ts          # フォロー中フィード
│   │   └── trending/route.ts           # トレンド
│   └── ...                              # 既存API
│
├── layout.tsx                           # グローバルレイアウト
└── global-error.tsx                     # グローバルエラー
```

### Components 構造

```
components/
├── social/                              # SNS機能コンポーネント
│   ├── TripFeed.tsx                    # Client Component: フィード表示
│   ├── TripCard.tsx                    # Server Component: カード
│   ├── TripCardSocial.tsx              # Client Component: いいね・コメント
│   ├── CommentList.tsx                 # RSC + Client Hybrid
│   ├── CommentInput.tsx                # Client Component
│   └── ShareButton.tsx                 # Client Component
│
├── trip/                                # 既存の旅程コンポーネント
│   ├── TripTimeline.tsx                # Parallel Route用
│   ├── TripMap.tsx                     # Parallel Route用
│   └── ...
│
└── ...
```

---

## データモデル

### Firestore スキーマ拡張

#### 1. **trips コレクション (拡張)**

```typescript
interface Trip {
  // 既存フィールド
  id: string
  user_id: string
  title: string
  slug: string
  access_level: 'private' | 'public'
  is_template: boolean
  
  // v3.0.0 新規フィールド
  published_at?: Timestamp              // 公開日時
  featured: boolean                     // 運営ピックアップ
  trending_score: number                // トレンドスコア (アルゴリズム算出)
  
  // SNS統計 (Subcollection参照用の集計値)
  social_stats: {
    likes_count: number                 // FieldValue.increment() 使用（未定義の場合は 0 とみなす）
    comments_count: number
    shares_count: number
    views_count: number
    replicas_count: number              // テンプレート使用回数
  }
}
```

**Composite Indexes:**
```
- Collection: trips
  - Fields: access_level (ASC), published_at (DESC)
  - Fields: access_level (ASC), trending_score (DESC)
  - Fields: access_level (ASC), social_stats.likes_count (DESC)
```

#### 2. **trip_likes コレクション (新規)**

```typescript
interface TripLike {
  id: string                            // {userId}_{tripId} でユニーク保証
  trip_id: string
  user_id: string
  created_at: Timestamp
}
```

**Composite Indexes:**
```
- Collection: trip_likes
  - Fields: trip_id (ASC), created_at (DESC)
  - Fields: user_id (ASC), created_at (DESC)
```

**いいね処理のトランザクション:**

```typescript
async function toggleLike(userId: string, tripId: string) {
  const likeId = `${userId}_${tripId}`
  const likeRef = db.collection('trip_likes').doc(likeId)
  const tripRef = db.collection('trips').doc(tripId)
  
  await db.runTransaction(async (transaction) => {
    const likeDoc = await transaction.get(likeRef)
    
    if (likeDoc.exists) {
      // Unlike
      transaction.delete(likeRef)
      transaction.update(tripRef, {
        'social_stats.likes_count': FieldValue.increment(-1)
      })
    } else {
      // Like
      transaction.set(likeRef, {
        trip_id: tripId,
        user_id: userId,
        created_at: FieldValue.serverTimestamp()
      })
      transaction.update(tripRef, {
        'social_stats.likes_count': FieldValue.increment(1)
      })
    }
  })
}
```

#### 3. **trip_comments コレクション (新規)**

```typescript
interface TripComment {
  id: string
  trip_id: string
  user_id: string
  user_name: string
  user_avatar?: string
  content: string
  parent_comment_id?: string            // ネストコメント対応
  created_at: Timestamp
  updated_at?: Timestamp
  deleted: boolean                      // 論理削除
}
```

**Composite Indexes:**
```
- Collection: trip_comments
  - Fields: trip_id (ASC), deleted (ASC), created_at (DESC)
  - Fields: parent_comment_id (ASC), created_at (ASC)
```

#### 4. **user_follows コレクション (新規)**

```typescript
interface UserFollow {
  id: string                            // {followerId}_{followingId}
  follower_id: string                   // フォローする人
  following_id: string                  // フォローされる人
  created_at: Timestamp
}
```

**Composite Indexes:**
```
- Collection: user_follows
  - Fields: follower_id (ASC), created_at (DESC)
  - Fields: following_id (ASC), created_at (DESC)
```

#### 5. **users コレクション (拡張)**

```typescript
interface User {
  // 既存フィールド
  id: string
  name: string
  slug: string
  email: string
  
  // v3.0.0 新規フィールド
  bio?: string                          // 自己紹介
  location?: string                     // 居住地
  website?: string                      // ウェブサイト
  
  // SNS統計
  social_stats: {
    followers_count: number
    following_count: number
    public_trips_count: number
    total_likes_received: number
  }
}
```

---

### テンプレート複製フローの維持

公開テンプレートから自分用の旅行計画を生成する既存フローは、新アーキテクチャでも以下の方針で継続する。

1. **公開テンプレート閲覧**  
   - `access_level: 'public'` かつ `is_template: true` の `Trip` を `app/(discover)/templates/[templateSlug]` で表示
   - SEO の観点でもスラッグ URL (`generateUniqueSlug`) を維持する

2. **レプリカ生成モーダル**  
   - `TemplateReplicaModal` を `@social` スロットに配置し、公開テンプレートページ内で起動
   - ユーザーが `startDate` を入力すると、テンプレートの `day_count` から `endDate` を自動算出

3. **複製 API の継続利用**  
   - `/api/trip/[tripSlug]/replica` を既存と同仕様で維持
   - レプリカ作成時は必ず `access_level: 'private'`, `is_template: false`
   - `slug` は `generateUniqueSlug` で新規生成し、`likes_count` 等の social 指標は 0 で初期化

4. **日付設定ロジック**  
   - `day_count > 0` のテンプレートはレプリカ時に `start_date`, `end_date` を設定
   - テンプレート自体は日付未設定のまま保持し、`TripEditor` からの日付編集は無効

5. **テストと検証**  
   - Phase 2 の UI リファクタで `TemplateReplicaModal` の E2E テストを追加
   - 複製後の Trip が private で生成されること、日付の自動算出が正しいことを自動テストで確認

---

### プライベート旅行データの継続

SNS 機能追加後も「個人利用」の主要ユースケースを維持するため、以下を明文化する。

- **作成時は常に private**  
  - `CreateTripDialog` から作成される Trip は `access_level: 'private'` 固定  
  - 公開は新設する Publish 操作 (`/api/trip/[tripSlug]/publish`) を経由して明示的に実行

- **フィード・SNSへの露出条件**  
  - `/api/feed/*` 系 API は `access_level: 'public'` の Trip のみを対象とする  
  - private Trip については social 指標を集計せず、いいね/コメント API も遮断する

- **social_stats の扱い**  
  - `social_stats` は `public` へ移行したタイミングで初期化し、private のままの Trip は常に 0 を維持  
  - UI でも private Trip にはいいね・コメント UI を表示しない

- **Firestore ルール**  
  - private Trip に紐づく `trip_likes`, `trip_comments` はクエリで取得不可  
  - 共有ユーザー（`sharedWith` 等）だけが閲覧できる従来機能を維持しつつ、SNS 公開機能とは分離

- **共有機能との整合性**  
  - 共有されたユーザーは従来通り編集・コメント可能（SNS 機能とは別レイヤー）  
  - 共有ビューは Route Group `/app/(planner)/` 内で Legacy コンポーネントを併存させ、段階的に再設計する

これらの方針を Phase 1 のレビュー項目に含め、実装・テスト・ルール設計で検証する。

---

## 段階的移行パス

### Phase 1: Foundation (v3.0.0-alpha) - 3ヶ月

**目標:** 新機能のAPI基盤とデータモデル構築、既存機能への影響なし

**作業内容:**

1. **Firestore スキーマ拡張**
   - `social_stats` サブドキュメント追加（既存 Trip には `{ likes_count: 0, comments_count: 0, shares_count: 0, views_count: 0, replicas_count: 0 }` をバックフィル）
   - 新規コレクション作成: `trip_likes`, `trip_comments`, `user_follows`
   - Composite Indexes 作成
   - 既存 Trip ドキュメントへのバックフィルスクリプト実装（Cloud Functions または一時的な Node.js スクリプト）
   - バックフィル完了を確認するための検証クエリ（`WHERE social_stats IS NULL`）の実行

2. **API Routes 実装** (app/api/)
   - `/api/social/like` - いいね機能
   - `/api/social/comment` - コメント機能
   - `/api/social/follow` - フォロー機能
   - `/api/feed/public` - 公開フィード取得
   - すべて認証・認可チェック付き

3. **型定義追加**
   - `lib/core/types.ts` に SNS 関連型（`TripSocialStats`, `TripLike`, `TripComment`, `UserFollow` 等）を追加
   - 既存の `Trip`, `User` 型を拡張

4. **権限管理システム**
   - `lib/auth/permissions.ts` 実装
   - `canView`, `canEdit`, `canComment` 等の関数

5. **Firestore セキュリティルール**
   - 新規コレクション向けルール追加: `trip_likes`, `trip_comments`, `user_follows`
     - 書き込みは認証済みユーザーのみ
     - `trip_likes`: `request.auth.uid == user_id` のみ作成/削除可能
     - `trip_comments`: `request.auth.uid == user_id` のみ作成/編集/論理削除可能
     - `user_follows`: `request.auth.uid == follower_id` のみ作成/削除可能
   - 既存 `trips` コレクションとの一貫性チェック（公開状態でのみフィード/コメント API から参照可能）
   - ルール変更の QA 手順を定義（エミュレータでのテストケース、ステージング環境での動作確認）

6. **テスト**
   - API Routes のユニットテスト
   - Firestore トランザクションのテスト
   - 権限チェックのテスト
   - Firestore セキュリティルールのテスト（エミュレータ + 自動テスト）

**リリース判定:**
- ✅ API が正常動作
- ✅ 既存機能に影響なし
- ✅ テストカバレッジ 80%以上

---

### Phase 2: UI Implementation (v3.0.0-beta) - 4ヶ月

**目標:** SNS UIの実装、Feature Flag で段階的公開

**作業内容:**

1. **Route Groups 導入**
   - `app/(discover)/` ディレクトリ作成
   - `app/(planner)/` に既存ページ移行
   - 各レイアウトファイル実装

2. **Parallel Routes 実装** (段階的)
   - `@timeline` slot: タイムライン表示
   - `@map` slot: 地図表示 (既存コンポーネント再利用)
   - `@social` slot: いいね・コメント

3. **Intercepting Routes 実装**
   - コメント詳細モーダル
   - ユーザープロフィールモーダル

4. **Feed ページ実装** (app/(discover)/feed/)
   - Server Component: 初期フィード取得
   - Client Component: 無限スクロール
   - Loading/Error State

5. **Social Components 実装**
   - `TripCard` with like/comment buttons
   - `CommentList` (RSC + Client Hybrid)
   - `ShareButton`

6. **Feature Flag 実装**
   - 環境変数 `ENABLE_SOCIAL_FEATURES=true/false`
   - 新旧UI切り替え機能

7. **パフォーマンス最適化**
   - 画像最適化 (Next.js Image + Blur Placeholder)
   - 仮想スクロール (`@tanstack/react-virtual`)
   - Firestore リアルタイム購読の最適化

**リリース判定:**
- ✅ SNS機能が完全動作
- ✅ パフォーマンステスト合格 (Lighthouse Score > 90)
- ✅ ベータユーザーテスト完了

---

### Phase 3: Refinement & GA (v3.0.0) - 2ヶ月

**目標:** 正式リリース、ドキュメント整備

**作業内容:**

1. **旧実装の削除**
   - Feature Flag 削除
   - 未使用コンポーネント削除
   - ルート構造のクリーンアップ

2. **ドキュメント整備**
   - API リファレンス更新
   - マイグレーションガイド作成
   - チュートリアル動画作成

3. **モニタリング強化**
   - Firestore コスト監視ダッシュボード
   - パフォーマンスモニタリング
   - エラートラッキング

4. **GA リリース**
   - リリースノート公開
   - ブログ記事公開
   - SNS告知

**リリース判定:**
- ✅ すべてのテスト合格
- ✅ ドキュメント完備
- ✅ 本番環境で1週間問題なし

---

## パフォーマンス戦略

### 1. Server Components 最適化

**データフェッチ戦略:**

```typescript
// app/(discover)/feed/page.tsx (Server Component)
export const revalidate = 300 // 5分キャッシュ（トレンド値は5分粒度で更新）

export default async function FeedPage() {
  // Server-side データフェッチ
  const trips = await getTrendingTrips({ limit: 20 })
  
  return (
    <div>
      <Suspense fallback={<FeedSkeleton />}>
        <TripFeedList initialTrips={trips} />
      </Suspense>
    </div>
  )
}
```

**メリット:**
- 初期表示が高速 (RSCはバンドルサイズに含まれない)
- SEO対応
- CDN キャッシュ活用

### 2. Client Components の最適化

**Optimistic UI:**

```typescript
'use client'

export function LikeButton({ tripId, initialLiked, initialCount }: Props) {
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  
  const handleLike = async () => {
    // Optimistic Update
    setLiked(!liked)
    setCount(count + (liked ? -1 : 1))
    
    try {
      await fetch('/api/social/like', {
        method: 'POST',
        body: JSON.stringify({ tripId })
      })
    } catch (error) {
      // Rollback on error
      setLiked(liked)
      setCount(count)
    }
  }
  
  return <button onClick={handleLike}>{count}</button>
}
```

### 3. 画像最適化

**Next.js Image + Blur Placeholder:**

```typescript
<Image
  src={trip.image_url}
  alt={trip.title}
  width={800}
  height={600}
  placeholder="blur"
  blurDataURL={trip.image_blur_hash}  // Firestore に保存
  sizes="(max-width: 768px) 100vw, 50vw"
  loading="lazy"
/>
```

**画像生成時に blur hash を保存:**

```typescript
import { encode } from 'blurhash'

async function uploadTripImage(file: File, tripId: string) {
  // 画像アップロード
  const imageUrl = await uploadToStorage(file)
  
  // Blur hash 生成
  const blurHash = await generateBlurHash(file)
  
  // Firestore 更新
  await db.collection('trips').doc(tripId).update({
    image_url: imageUrl,
    image_blur_hash: blurHash
  })
}
```

### 4. 無限スクロール最適化

**仮想スクロール実装:**

```typescript
import { useVirtualizer } from '@tanstack/react-virtual'

export function TripFeedList({ trips }: Props) {
  const parentRef = useRef<HTMLDivElement>(null)
  
  const virtualizer = useVirtualizer({
    count: trips.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 400, // TripCard の高さ
    overscan: 5,
  })
  
  return (
    <div ref={parentRef} className="feed-container">
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: virtualRow.size,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <TripCard trip={trips[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 5. Firestore クエリ最適化

**バッチ読み込み:**

```typescript
// ❌ Bad: N+1 クエリ
for (const trip of trips) {
  const user = await db.collection('users').doc(trip.user_id).get()
}

// ✅ Good: バッチ読み込み
const userIds = [...new Set(trips.map(t => t.user_id))]
const userDocs = await db.getAll(
  ...userIds.map(id => db.collection('users').doc(id))
)
const usersMap = new Map(userDocs.map(doc => [doc.id, doc.data()]))
```

---

## 技術的課題と対策

### 課題 1: Firestore コストの増加

**懸念:**
- リアルタイム購読の増加
- フィード表示での大量読み込み

**対策:**

1. **読み込み回数削減**
   - Vercel Edge Cache 活用 (`revalidate` 設定)
   - ページネーション (1ページ20件)
   - クライアント側キャッシュ (SWR)

2. **書き込み回数削減**
   - `FieldValue.increment()` で競合回避
   - Batch Write の活用

3. **監視とアラート**
   - Firebase Usage Dashboard（週次で確認）
   - コスト閾値アラート（Firestore 読み取り・書き込み・ストレージ）
   - 責任範囲の明確化: リポジトリオーナー（または運用担当）が月次で振り返りを実施

### 課題 2: リアルタイム性とパフォーマンスのトレードオフ

**対策:**

```typescript
// ハイブリッドアプローチ
export function TripCard({ trip }: Props) {
  // 初期値は RSC から受け取る
  const [likeCount, setLikeCount] = useState(trip.social_stats?.likes_count ?? 0)
  
  // リアルタイム購読は "いいね" ボタンクリック後のみ
  const [subscribed, setSubscribed] = useState(false)
  
  useEffect(() => {
    if (!subscribed) return
    
    const unsubscribe = onSnapshot(
      doc(db, 'trips', trip.id),
      (snapshot) => {
        const data = snapshot.data()
        setLikeCount(data?.social_stats.likes_count || 0)
      }
    )
    
    return () => unsubscribe()
  }, [subscribed, trip.id])
  
  return (
    <div>
      <LikeButton 
        count={likeCount}
        onInteraction={() => setSubscribed(true)}
      />
    </div>
  )
}
```

### 課題 3: SEO対応

**対策:**

1. **Server Components で初期レンダリング**
   - OGP タグ生成
   - 構造化データ (JSON-LD)

2. **動的メタデータ:**

```typescript
// app/(planner)/[userSlug]/[tripSlug]/page.tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const trip = await getTripBySlug(params.tripSlug)
  
  return {
    title: trip.title,
    description: trip.description,
    openGraph: {
      title: trip.title,
      description: trip.description,
      images: [trip.image_url],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: trip.title,
      description: trip.description,
      images: [trip.image_url],
    },
  }
}
```

---

## 開発ロードマップ

### タイムライン

```
2025 Q4: Phase 1 (Foundation)
  - Firestore スキーマ拡張
  - API Routes 実装
  - テスト整備

2026 Q1: Phase 2 (UI Implementation)
  - Route Groups/Parallel Routes 導入
  - Feed ページ実装
  - Beta リリース

2026 Q2: Phase 3 (Refinement)
  - パフォーマンス最適化
  - ドキュメント整備
  - GA リリース

2026 Q3: Post-GA
  - 追加機能 (通知、DM等)
  - モバイルアプリ連携検討
```

### 優先順位

**P0 (必須):**
- いいね・コメント機能
- 公開フィード
- Parallel Routes 導入

**P1 (重要):**
- フォロー機能
- 通知システム
- テンプレート評価

**P2 (Nice to have):**
- DM機能
- ハッシュタグ
- 高度な検索

---

## まとめ

v3.0.0 は、旅行計画アプリから **旅行計画SNS** への進化を目指します。Next.js App Router の先進的な機能 (Route Groups, Parallel Routes, Intercepting Routes) を活用し、スケーラブルで保守性の高いアーキテクチャを実現します。

**成功の鍵:**
- 段階的移行で既存ユーザーへの影響を最小化
- パフォーマンスとコストのバランス
- コミュニティの声を反映した機能開発

---

**次のステップ:**
1. ✅ このドキュメントのレビューと承認
2. ⏳ Phase 1 の詳細設計
3. ⏳ プロトタイプ開発 (Feed ページ)
