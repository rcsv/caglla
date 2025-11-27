# My Guides API 設計書

## 概要

ユーザーが作成した「執筆中の Guide（テンプレート）」一覧を取得する API エンドポイント。

## エンドポイント

```
GET /api/trips/my-guides
```

## 仕様

### リクエスト

#### 認証
- 必須（`Authorization: Bearer <token>`）

#### クエリパラメータ
- `limit` (optional): 取得件数（デフォルト: 20、最大: 50）
- `cursor` (optional): ページネーション用カーソル（最後のドキュメント ID）
- `status` (optional): フィルタリング
  - `draft`: 未公開のみ（`access_level === 'private'`）
  - `published`: 公開済みのみ（`access_level === 'public' || 'unlisted'`）
  - `all`: すべて（デフォルト）

### レスポンス

```typescript
{
  trips: Trip[]
  nextCursor?: string
}
```

### クエリ条件（実装方式）

**注意**: Firestore の `in` クエリと `orderBy` の組み合わせには複合インデックスが必要なため、
実装では**クエリ分割方式**を採用しています。

```typescript
// 実装方式（クエリ分割 + マージ）
// 1. auth_uid でクエリ実行
collection('trips')
  .where('user_id', '==', auth_uid)
  .where('is_template', '==', true)
  .limit(limit * 2)

// 2. google_id でクエリ実行（存在する場合）
collection('trips')
  .where('user_id', '==', google_id)
  .where('is_template', '==', true)
  .limit(limit * 2)

// 3. 結果をマージしてクライアント側でソート
// 4. updated_at 降順でソート
// 5. limit に合わせて切り詰め
```

### フィルタリング

- `status === 'draft'`: バックエンドで `where('access_level', '==', 'private')` を適用
- `status === 'published'`: クライアント側で `access_level in ['public', 'unlisted']` をフィルタ
- `status === 'all'` または未指定: すべて

### ページネーション

**重要**: 現在の実装では、Firestore の `startAfter` は使用していません。

- **カーソル形式**: `timestamp_docId` を base64 エンコード（例: `1704067200_abc123` → base64）
- **制限事項**:
  - クライアント側ソートのため、データの追加・更新によりページ間で重複やズレが発生する可能性がある
  - 外部フィルタ（`status === 'published'` など）により、アイテム数が減ると次ページが飛ぶ可能性がある
  - 実用的には許容誤差として扱う（旅行アプリの用途では十分）
- **将来の改善**: Firestore の複合インデックスを作成し、`orderBy` + `startAfter` を使用することで正確なページネーションを実現可能

## 実装方針

### バックエンド

1. `/api/trips/my-guides/route.ts` を作成
2. `authApi` ミドルウェアを使用
3. **共通クエリヘルパー `getUserTripsWithBackwardCompatibility` を使用**
   - `user_id` の後方互換性対応（`auth_uid` と `google_id` の両方をクエリ分割してマージ）
   - Firestore の `in` クエリ制限を回避
   - クライアント側でソート（`updated_at` 降順）
4. `is_template === true` でフィルタ
5. `status` パラメータに応じて `access_level` でフィルタ
   - `draft`: バックエンドで `where('access_level', '==', 'private')` を適用
   - `published`: クライアント側でフィルタ（将来的に改善可能）
   - `all`: フィルタなし
6. **カーソル処理**:
   - カーソルはエンコード形式（`timestamp_docId` を base64 エンコード）
   - **注意**: 現在の実装では Firestore の `startAfter` は使用していない
   - カーソルは「最後に取得したドキュメントの位置情報」として保持するのみ
   - ページネーションの正確性は保証されない（実用的には許容誤差）
7. **`stats` のデフォルト値を API で埋める**（UI 壊れ防止）

### フロントエンド

1. `hooks/useMyGuides.ts` を作成（`useMyShares` と同様の構造）
2. `/home` の左側に「執筆中の Guide」セクションを追加
3. カード表示（タイトル、行き先、更新日時、公開状態など）

## 改善点（生成AIからのフィードバック反映）

### 1. クエリ分割方式の採用
- Firestore の `in` クエリと `orderBy` の組み合わせでインデックスが必要になる問題を回避
- `auth_uid` と `google_id` で個別にクエリを実行してマージ
- クライアント側でソート（`updated_at` 降順）

### 2. カーソルの扱い（制限事項を明確化）
- `DocumentSnapshot` の代わりに `timestamp_docId` を base64 エンコード
- **注意**: 現在の実装では Firestore の `startAfter` は使用していない
- カーソルは「最後に取得したドキュメントの位置情報」として保持するのみ
- ページネーションの正確性は保証されない（実用的には許容誤差）
- 将来的にインデックス作成後、Firestore の `orderBy` + `startAfter` を使用することで改善可能

### 3. バックエンドでのフィルタリング
- `status === 'draft'` の場合はバックエンドで `where('access_level', '==', 'private')` を適用
- クエリ無駄撃ちを削減
- `status === 'published'` の場合はクライアント側でフィルタ（将来的に改善可能）

### 4. `stats` のデフォルト値
- API レスポンスで `stats` のデフォルト値を埋めることで、UI 側での null チェックを不要に

## データモデル

### Trip フィールド（テンプレート）

- `is_template: true`
- `user_id`: 作成者の `auth_uid` または `google_id`
- `access_level`: `'private'` | `'public'` | `'unlisted'`
- `title`: タイトル
- `destination`: 行き先
- `updated_at`: 更新日時
- `stats`: 事前集計された統計情報（days, itineraries, photos, checklists）

## 注意事項

1. **後方互換性**: `user_id` が `google_id` の場合も対応（クエリ分割方式で実現）
2. **パフォーマンス**: クエリ分割方式により、複合インデックスの必要性を削減
3. **ページネーションの制限**:
   - **現在の実装では Firestore の `startAfter` を使用していない**
   - カーソルは「最後に取得したドキュメントの位置情報」として保持するのみ
   - クライアント側ソートのため、データの追加・更新によりページ間で重複やズレが発生する可能性がある
   - 外部フィルタ（`status === 'published'` など）により、アイテム数が減ると次ページが飛ぶ可能性がある
   - **実用的には許容誤差として扱う**（旅行アプリの用途では十分）
4. **インデックス要件**:
   - 将来的に正確なページネーションを実現する場合は、以下の複合インデックスが必要:
     - `user_id` (ascending) + `is_template` (ascending) + `updated_at` (descending)
     - `user_id` (ascending) + `access_level` (ascending) + `is_template` (ascending) + `updated_at` (descending)
   - インデックス作成後、Firestore の `orderBy` + `startAfter` を使用することで正確なページネーションを実現可能
   - 現時点ではクライアント側ソートにより、インデックス不要

## 将来の拡張

- 検索機能（タイトル、行き先で検索）
- ソート機能（更新日時、作成日時、タイトル順など）
- フィルタリング（日数、行き先エリアなど）

