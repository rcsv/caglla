# SNS フォロー・フォロワー UI 仕様

**作成日**: 2025年12月3日  
**状態**: 🟡 仕様検討中  
**優先度**: 中  
**タイプ**: 機能追加

---

## 📋 概要

SNS 特有のフォロー・フォロワー UI を実装する。現在、`FollowButton` コンポーネントは存在するが、プロフィールページにフォロワー数・フォロー中数の表示や、一覧を表示する UI が不足している。

---

## 🎯 現在の実装状況

### 既存コンポーネント
- ✅ `FollowButton` - フォローボタンコンポーネント（既存）
- ✅ `app/(profile)/[userSlug]/page.tsx` - プロフィールページ（既存）
- ❌ フォロワー数・フォロー中数の表示 - 未実装
- ❌ フォロワー・フォロー中一覧モーダル - 未実装

### 既存 API
- ✅ `GET /api/users/[userSlug]/follow` - フォロー状態取得
- ✅ `POST /api/users/[userSlug]/follow` - フォロー
- ✅ `DELETE /api/users/[userSlug]/follow` - フォロー解除
- ❌ `GET /api/users/[userSlug]/followers` - フォロワー数・一覧取得（未実装）
- ❌ `GET /api/users/[userSlug]/following` - フォロー中数・一覧取得（未実装）

### 既存のライブラリ関数
- ✅ `getFollowingList()` - フォロー中リストを取得（`lib/social/user-follows.ts`）
- ✅ `getFollowersList()` - フォロワーリストを取得（`lib/social/user-follows.ts`）

---

## 🎨 UI/UX 設計

### プロフィールページの拡張

**場所**: `app/(profile)/[userSlug]/page.tsx`

**現在の構成**:
- プロフィール画像
- ユーザー名
- Bio
- メールアドレス
- 居住地
- 公開旅行一覧
- 非公開旅行一覧（自分自身のみ）

**追加する要素**:
1. **フォロワー数・フォロー中数の表示**
   - プロフィール画像の下、ユーザー名の近くに表示
   - クリック可能なリンクとして表示
   - クリックするとモーダルが開く

2. **フォローボタン**
   - 自分以外のプロフィールの場合、フォローボタンを表示
   - 既にフォローしている場合は "Following" ボタン

### UI レイアウト

```
┌─────────────────────────────────────┐
│ [プロフィール画像]                   │
│                                     │
│ ユーザー名                           │
│ Bio                                 │
│                                     │
│ [フォロワー数] [フォロー中数]       │
│  クリック可能                        │
│                                     │
│ [Follow] または [Following] ボタン  │
│ (自分以外の場合のみ)                 │
│                                     │
│ メールアドレス                       │
│ 居住地                              │
└─────────────────────────────────────┘
```

### フォロワー・フォロー中一覧モーダル

```
┌─────────────────────────────────────┐
│ フォロワー (123)                [×] │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ [アバター] ユーザー名            │ │
│ │          @user-slug              │ │
│ │          Bio...                  │ │
│ │          [Follow] / [Following]   │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ [アバター] ユーザー名            │ │
│ │          @user-slug              │ │
│ │          Bio...                  │ │
│ │          [Follow] / [Following]   │ │
│ └─────────────────────────────────┘ │
│ ...                                 │
└─────────────────────────────────────┘
```

---

## 🔧 実装要件

### Phase 1: API エンドポイントの実装

**💡 設計方針: API を統合して1エンドポイントに**

実装コストとバグ発生箇所を減らすため、`followers` と `following` を統合した1エンドポイントを実装する。

1. **`GET /api/users/[userSlug]/follow-list`**
   - フォロワー数・フォロー中数と一覧を取得（統合エンドポイント）
   - クエリパラメータ:
     - `type` (必須): `"followers"` または `"following"`
     - `page` (オプション): ページ番号（デフォルト: 1）
     - `limit` (オプション): 1ページあたりの件数（デフォルト: 20）
   - **パフォーマンス対策**:
     - **count は別クエリで取得**（キャッシュもしやすい）
     - 一覧取得とは分けて実装し、API レスポンスで統合
     - **`isFollowing` の N+1 対策**: 1回のクエリでまとめて取得
       ```sql
       SELECT followee_id 
       FROM follows 
       WHERE follower_id = :currentUser
       AND followee_id IN (:list_of_users_on_page)
       ```
   - レスポンス:
     ```json
     {
       "type": "followers",
       "count": 123,
       "page": 1,
       "limit": 20,
       "totalPages": 7,
       "users": [
         {
           "id": "user-id",
           "name": "User Name",
           "slug": "user-slug",
           "profile_image_url": "...",
           "bio": "...",
           "isFollowing": true/false
         }
       ]
     }
     ```
   - **メリット**:
     - 実装コストが減る（コード重複が少ない）
     - テストが1本で済む
     - ページネーションロジックを共通化できる
     - モーダル側の実装がシンプルになる
   - **注意**: RDB で `followers` テーブルが大きくなった際のパフォーマンスを考慮

2. **`GET /api/users/[userSlug]/follow-list-summary`** (軽量API)
   - フォロワー数・フォロー中数のみを取得（SWR/React Query用）
   - レスポンス:
     ```json
     {
       "followersCount": 123,
       "followingCount": 45
     }
     ```
   - **用途**: プロフィールページのフォロー数表示用（SWRでキャッシュ）
   - **キャッシュ更新タイミング**:
     - プロフィール画像変更時
     - フォロー/アンフォロー操作直後
     - `FollowButton` の内部で `mutate()` を呼び出して再フェッチ
     - 例: `await mutate(`/api/users/${userSlug}/follow-list-summary`);`
   - **メリット**:
     - フォロー操作と数値のズレを防ぐ
     - 軽量で高速
     - キャッシュしやすい
   - **注意**: ボタンは変わっても数だけ遅延して変わる「あの SNS でよくある違和感」を防ぐため、mutate のタイミングを確実に実装する

### Phase 2: UI コンポーネントの実装

1. **プロフィールページの拡張**
   - フォロワー数・フォロー中数の表示（**数字だけ太字**で表示）
   - クリック可能なリンク
   - **スマホ表示でのタップ領域**: Instagram の成功パターンを踏襲
     - 数字とラベル全体が "1 ボタン" として押せること
     - **最低 42px × 42px のヒットボックス**（細いリンク文字だけタップさせない）
   - フォローボタンの追加（自分以外の場合）
   - **SWR/React Query でフォロー数を取得**（`follow-list-summary` API使用）
   - **mutate 連動**: フォロー操作直後に `mutate()` を呼び出して数値のズレをゼロに

2. **フォロワー・フォロー中一覧モーダル（汎用化・fetcher DI方式）**
   - **新規コンポーネント: `UserListModal.tsx`**（汎用化）
   - `FollowListModal` ではなく、将来的な拡張（"Liked your posts", "Blocked users", "Mutual follows", "旅行に参加しているユーザー一覧" など）に対応できるよう抽象化
   - **fetcher DI 方式を採用**（拡張性を最大化）
   - Props:
     ```tsx
     interface PaginatedUsers {
       count: number;
       page: number;
       limit: number;
       totalPages: number;
       users: UserSummary[];
     }
     
     interface UserListModalProps {
       isOpen: boolean;
       onClose: () => void;
       title: string;
       description?: string; // オプション: 説明文
       fetcher: (page: number, limit: number) => Promise<PaginatedUsers>;
       showFollowButton?: boolean;
       disabled?: boolean; // モーダル全体の disabled 状態（連打対策）
     }
     ```
   - **メリット**:
     - 将来の機能追加時にコピペ地獄を避けられる
     - コードの再利用性が高い
     - **fetcher を DI することで永遠に拡張可能**
     - フォロワー、ブロック済みユーザー、いいねした人、旅行参加者など、すべてこのモーダルで対応可能

3. **フォロワー・フォロー中カード**
   - ユーザーアバター
   - ユーザー名・スラッグ
   - Bio
   - フォローボタン（**`isFollowing` は API 側で返す**）
   - **メリット**:
     - クライアント側の state が最小限
     - ページネーションしても正しい値
     - 実装が楽

---

## 🔄 ユーザーフロー

### フロー1: フォロワー数をクリック

1. ユーザーがプロフィールページでフォロワー数をクリック（42px × 42px のヒットボックス）
2. `UserListModal` が開く（fetcher DI方式）
3. `fetcher` 関数が `GET /api/users/[userSlug]/follow-list?type=followers&page=1` を呼び出し
4. フォロワー一覧が表示される（ページネーション対応）
5. 各フォロワーにフォローボタンが表示される（`isFollowing` は API 側で返す）
6. ページネーションボタンで次のページに移動可能

### フロー2: フォロー中数をクリック

1. ユーザーがプロフィールページでフォロー中数をクリック（42px × 42px のヒットボックス）
2. `UserListModal` が開く（fetcher DI方式）
3. `fetcher` 関数が `GET /api/users/[userSlug]/follow-list?type=following&page=1` を呼び出し
4. フォロー中一覧が表示される（ページネーション対応）
5. 各ユーザーに "Following" ボタンが表示される

### フロー3: フォローボタンをクリック

1. ユーザーがプロフィールページまたはモーダル内でフォローボタンをクリック
2. 楽観的UI更新: 即座にUIを更新（ボタンが "Following" に変わる）
3. `POST /api/users/[userSlug]/follow` を呼び出し
4. **mutate 連動**: `mutate(`/api/users/${userSlug}/follow-list-summary`)` を呼び出し
5. フォロワー数が更新される（数値のズレをゼロに）
6. API呼び出しが失敗した場合はロールバック

---

## 📐 コンポーネント設計

### `FollowStats.tsx` - フォロワー・フォロー中数の表示

```tsx
interface FollowStatsProps {
  userSlug: string;
  onFollowersClick: () => void;
  onFollowingClick: () => void;
}
```

**実装方針**:
- **SWR/React Query で `follow-list-summary` API を取得**
- フォロー操作と数値のズレを防ぐため、キャッシュを活用
- **UI**: 数字だけ太字で表示（Instagram風）
  ```
  120 フォロワー
  94 フォロー中
  ```

### `UserListModal.tsx` - ユーザー一覧モーダル（汎用化・fetcher DI方式）

```tsx
interface PaginatedUsers {
  count: number;
  page: number;
  limit: number;
  totalPages: number;
  users: UserSummary[];
}

interface UserListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string; // "フォロワー" または "フォロー中"
  description?: string; // オプション: 説明文
  fetcher: (page: number, limit: number) => Promise<PaginatedUsers>;
  showFollowButton?: boolean; // フォローボタンを表示するか
  disabled?: boolean; // モーダル全体の disabled 状態（連打対策）
}
```

**ページネーション**:
- ページネーションボタンを実装
- 1ページあたり20件を表示
- 前へ/次へボタンとページ番号を表示
- `fetcher` 関数を呼び出してデータを取得

**汎用化のメリット**:
- **fetcher DI 方式により永遠に拡張可能**
- 将来的に "Liked your posts", "Blocked users", "Mutual follows", "旅行に参加しているユーザー一覧" などの機能追加が容易
- コードの再利用性が高い
- メンテナンスコストが低い
- `type` ベースでも動くが、fetcher を噛ませると拡張性が最大化される

### `FollowUserCard.tsx` - フォロワー・フォロー中ユーザーカード

```tsx
interface FollowUserCardProps {
  user: {
    id: string;
    name: string;
    slug: string;
    profile_image_url?: string;
    bio?: string;
    isFollowing: boolean;
  };
  onFollowToggle?: (userSlug: string, nextState: boolean) => Promise<void>;
  disabled?: boolean; // フォローボタンの disabled 状態（連打対策）
}
```

**抽象度の向上**:
- `disabled` をモーダル側で一括制御できるようにする
- "連打 → API が 429 → 画面だけズレる" を防ぐ
- 安定性が向上

---

## 🔗 関連ファイル

### 既存ファイル
- `components/social/FollowButton.tsx` - フォローボタン
- `app/(profile)/[userSlug]/page.tsx` - プロフィールページ
- `lib/social/user-follows.ts` - フォロー操作関数
- `app/api/users/[userSlug]/follow/route.ts` - フォロー API

### 新規作成が必要なファイル
- `app/api/users/[userSlug]/follow-list/route.ts` - フォロワー・フォロー中統合 API
- `app/api/users/[userSlug]/follow-list-summary/route.ts` - フォロワー・フォロー中数取得 API（軽量）
- `components/social/FollowStats.tsx` - フォロワー・フォロー中数の表示（SWR使用）
- `components/modals/UserListModal.tsx` - ユーザー一覧モーダル（汎用化）
- `components/social/FollowUserCard.tsx` - フォロワー・フォロー中ユーザーカード

---

## 📝 注意事項

1. **パフォーマンス**
   - **count は別クエリで取得**（キャッシュもしやすい）
   - 一覧取得とは分けて実装し、API レスポンスで統合
   - 一覧はページネーションを実装する（1ページあたり20件）
   - **`isFollowing` の N+1 対策**: 1回のクエリでまとめて取得
     - 各行ごとに `SELECT ... WHERE (viewer → user)` をやると N+1 になる
     - 正しい方法: 1回だけまとめて取得する
     - この SQL の癖を押さえておくと後々の負債が1/10になる

2. **権限**
   - フォロワー一覧は誰でも閲覧可能
   - フォロー中一覧も誰でも閲覧可能（決定済み）

3. **相互フォロー状態（`isFollowing` の計算方法）**
   - **決定**: API 側で `isFollowing` を返す（A案）
   - フォロワー一覧では、各フォロワーに対して現在のユーザーがフォローしているかどうかを表示
   - フォロー中一覧では、すべて "Following" として表示
   - **メリット**:
     - クライアント側の state が最小限
     - ページネーションしても正しい値
     - 実装が楽
     - クライアントロジックを最小化

4. **楽観的UI更新とリバウンド対策**
   - フォローボタンをクリックした際、即座にUIを更新
   - API呼び出しが失敗した場合はロールバック
   - **連打対策**:
     - `FollowButton` 内で `disabled` を短時間入れる
     - 楽観更新したあと、API エラーなら通知してロールバック
     - SWR の `mutate` で最終結果を同期
     - **`FollowUserCard` の `disabled` をモーダル側で一括制御**（連打 → API が 429 → 画面だけズレる を防ぐ）
   - **summary API の mutate 連動**:
     - フォロー操作直後に `mutate(`/api/users/${userSlug}/follow-list-summary`)` を呼び出し
     - ボタンは変わっても数だけ遅延して変わる「あの SNS でよくある違和感」を防ぐ
   - **メリット**: 「たまにフォロー状態が間違う…」みたいな事故を防ぐ

5. **ページネーション**
   - ページネーションボタンを実装（無限スクロールは実装しない）
   - 前へ/次へボタンとページ番号を表示
   - 1ページあたり20件を表示

6. **リアルタイム更新**
   - リアルタイム更新は実装しない
   - ページリロード時に最新の状態を取得

---

## ❓ 検討事項（決定済み）

1. **フォロー中一覧の公開設定**
   - ✅ **決定**: 誰でも閲覧可能にする

2. **ページネーション**
   - ✅ **決定**: ページネーションボタンを実装する（無限スクロールは実装が難しいため）

3. **リアルタイム更新**
   - ✅ **決定**: ページリロード時に更新する（リアルタイム更新は不要）

**注意**: 実験ユーザーが少なすぎてピンと来ない状況のため、実装は基本的な機能に絞る。将来的にユーザーが増えた際に拡張を検討する。

---

## 🚀 実装の優先順位

### Phase 1（必須）: 基本機能
- [ ] `GET /api/users/[userSlug]/follow-list` - フォロワー・フォロー中統合 API（ページネーション対応）
- [ ] `GET /api/users/[userSlug]/follow-list-summary` - フォロワー・フォロー中数取得 API（軽量、SWR用）
- [ ] `FollowStats.tsx` - フォロワー・フォロー中数の表示（SWR使用、数字だけ太字）
- [ ] `UserListModal.tsx` - ユーザー一覧モーダル（汎用化、ページネーション対応）
- [ ] `FollowUserCard.tsx` - フォロワー・フォロー中ユーザーカード（`isFollowing` は API 側で返す）
- [ ] プロフィールページにフォロワー数・フォロー中数を表示
- [ ] フォローボタンの追加（自分以外のプロフィール、リバウンド対策付き）

### Phase 2（将来）: 拡張機能
- [ ] 検索機能（フォロワー・フォロー中一覧内で検索）
- [ ] ソート機能（名前順、フォロー日時順など）
- [ ] リアルタイム更新（ユーザーが増えた際に検討）

**注意**: Phase 1 の実装を優先し、基本的な機能を確実に動作させることを重視する。

---

---

## 💡 設計上の重要な決定事項（チャッピーからのフィードバック反映）

### 1. API 統合によるコスト削減
- `followers` と `following` を統合した1エンドポイント（`follow-list`）にすることで、実装コストとバグ発生箇所を削減
- コード重複が少なく、テストも1本で済む

### 2. モーダルの汎用化（fetcher DI 方式）
- `FollowListModal` ではなく `UserListModal` として汎用化
- **fetcher DI 方式を採用**することで永遠に拡張可能
- 将来的な機能追加（"Liked your posts", "Blocked users", "Mutual follows", "旅行に参加しているユーザー一覧" など）に対応可能

### 3. SWR/React Query による状態管理と mutate 連動
- プロフィールページのフォロー数は `follow-list-summary` API を SWR で取得
- フォロー操作直後に `mutate()` を呼び出して数値のズレをゼロに
- ボタンは変わっても数だけ遅延して変わる「あの SNS でよくある違和感」を防ぐ

### 4. `isFollowing` は API 側で返す（N+1 対策必須）
- クライアント側の state を最小限に
- ページネーションしても正しい値が保証される
- **N+1 対策**: 1回のクエリでまとめて取得（各行ごとに SELECT しない）

### 5. パフォーマンス対策
- **count は別クエリで取得**（キャッシュもしやすい）
- 一覧取得とは分けて実装し、API レスポンスで統合
- RDB で `followers` テーブルが大きくなった際のパフォーマンスを考慮

### 6. リバウンド対策
- フォロー操作の連打対策を `FollowButton` に実装
- `FollowUserCard` の `disabled` をモーダル側で一括制御
- 楽観更新とロールバックの仕組みを確実に動作させる
- "連打 → API が 429 → 画面だけズレる" を防ぐ

### 7. UI デザインと UX
- フォロワー数・フォロー中数は数字だけ太字で表示（Instagram風）
- **スマホ表示でのタップ領域**: 最低 42px × 42px のヒットボックス
- 数字とラベル全体が "1 ボタン" として押せること（細いリンク文字だけタップさせない）

---

---

## 🎯 精度アップのポイント（チャッピーからの追加フィードバック）

### 1. Modal は fetcher DI 方式にすると未来永劫つかえる
- `type` ベースでも動くが、fetcher を DI することで永遠に拡張可能
- フォロワー、ブロック済みユーザー、いいねした人、旅行参加者など、すべてこのモーダルで対応可能

### 2. summary API は mutate 連動で "ズレ" をゼロに
- フォロー操作直後に `mutate()` を呼び出して再フェッチ
- ボタンは変わっても数だけ遅延して変わる「あの SNS でよくある違和感」を防ぐ

### 3. follow-list は count と list のクエリを分ける
- RDB で `followers` テーブルが大きくなった際のパフォーマンスを考慮
- count は別クエリで取得（キャッシュもしやすい）

### 4. isFollowing の N+1 対策は絶対に入れる
- 各行ごとに `SELECT ... WHERE (viewer → user)` をやると N+1 になる
- 1回のクエリでまとめて取得する
- この SQL の癖を押さえておくと後々の負債が1/10になる

### 5. フォロー数のタップ領域は 42px 以上（スマホ前提）
- Instagram の成功パターンを踏襲
- 数字とラベル全体が "1 ボタン" として押せること
- 細いリンク文字だけタップさせると UX がガタ落ちする

---

**最終更新**: 2025年12月3日（チャッピーのフィードバック反映・精度アップ版）

