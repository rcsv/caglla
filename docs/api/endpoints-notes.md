# API エントリポイント補足説明

**Last Updated:** 2025-11-14

---

## ✅ 実装完了

### 1. **DELETE /api/trip/[tripSlug]/publish - トリップ公開停止**

✅ **実装完了**: `app/api/trip/[tripSlug]/publish/route.ts` に `DELETE` ハンドラを追加

**機能:**
- 公開中のトリップを非公開（`access_level: 'private'`）に戻す
- 所有者のみが実行可能
- 既に `private` の場合はエラーを返す（冪等性）

**使用方法:**
```typescript
await makeAuthenticatedRequest(`/api/trip/${tripSlug}/publish`, {
  method: 'DELETE'
})
```

### 2. **GET /api/users/[userSlug] - 他のユーザーの公開情報取得**

✅ **実装完了**: `app/api/users/[userSlug]/route.ts` に `GET` ハンドラを追加

**機能:**
- 認証不要で、指定された `userSlug` のユーザー情報を取得
- `email`, `google_id`, `preferences`, `planId` などのプライベート情報は除外
- 公開情報のみを返す: `id`, `name`, `slug`, `profile_image_url`, `bio`

**使用方法:**
```typescript
const response = await fetch(`/api/users/${userSlug}`)
const { user } = await response.json()
```

### 3. **PUT /api/users/[userSlug] - ユーザー情報更新**

✅ **実装完了**: `app/api/users/[userSlug]/route.ts` に `PUT` ハンドラを追加

**機能:**
- 認証済みユーザーが自分の情報を更新
- `userSlug` で対象ユーザーを指定するが、認証済みユーザー自身の情報のみ更新可能
- `name` が変更された場合は `slug` も自動的に更新（重複チェックあり）

**使用方法:**
```typescript
await makeAuthenticatedRequest(`/api/users/${userSlug}`, {
  method: 'PUT',
  body: JSON.stringify({
    name: 'New Name',
    bio: 'New Bio',
    profile_image_url: 'https://...',
    gender: 'male',
    preferences: { ... }
  })
})
```

### 4. **Legacy エンドポイント削除**

✅ **削除完了**: `app/api/trips/[tripSlug]/route.ts` (Legacy) を削除

**理由:**
- スラッグベースの新しいエンドポイント (`/api/trip/[tripSlug]`) が実装済み
- コードベース内で使用されていないことを確認

---

## 🔍 ユーザーからの質問と回答

### 1. **POST /api/trip/[tripSlug]/publish でトリップ公開停止（unpublish）はないのか？**

**現状:**
- ✅ `POST /api/trip/[tripSlug]/publish`: トリップ公開（`access_level: 'public'` に設定）
- ❌ **unpublish専用エンドポイントは存在しない**

**公開停止の方法:**
現在は `PUT /api/trip/[tripSlug]` で `access_level: 'private'` を設定することで公開停止が可能です。

```typescript
// 例: PUT /api/trip/[tripSlug]
{
  "access_level": "private"
}
```

**改善提案:**
- `DELETE /api/trip/[tripSlug]/publish` を追加して、公開停止を明示的にする
- または、`POST /api/trip/[tripSlug]/unpublish` を追加する

---

### 2. **POST /api/user/[userSlug] でユーザー情報の更新はないのか？**

✅ **解決済み**: `GET /api/users/[userSlug]` と `PUT /api/users/[userSlug]` を実装しました。

**実装内容:**
- `GET /api/users/[userSlug]`: 他のユーザーの公開情報を取得（認証不要）
- `PUT /api/users/[userSlug]`: 認証済みユーザー自身の情報を更新（`userSlug` での明示的指定）

**使用方法:**
```typescript
// GET: 他のユーザーの公開情報を取得
const response = await fetch(`/api/users/${userSlug}`)
const { user } = await response.json()

// PUT: 自分の情報を更新
await makeAuthenticatedRequest(`/api/users/${userSlug}`, {
  method: 'PUT',
  body: JSON.stringify({
    name: 'New Name',
    bio: 'New Bio'
  })
})
```

---

### 3. **GET /api/itineraries を叩くと何が出てくるの？**

**現状:**
`GET /api/itineraries` は `day_id` クエリパラメータが**必須**で、その `day_id` に紐づく itineraries を取得します。

```typescript
// 例: GET /api/itineraries?day_id=day123
// 返却: day123 に紐づく itineraries の配列（sort_number でソート、昇順）
```

**動作:**
1. `day_id` クエリパラメータが必須
2. `day_id` → `trip_id` を解決
3. `trip.user_id` と認証済みユーザーの `userId` を比較して所有権確認
4. 所有権がある場合のみ、その `day_id` の itineraries を取得

**つまり:**
- ❌ 任意の旅行に対する itineraries を取得するわけではない
- ✅ 特定の `day_id` に紐づく itineraries を取得する
- ✅ 認証必須、所有権確認あり

**改善提案:**
- `GET /api/itineraries?day_id=xxx` のドキュメントを明確化
- または、`GET /api/trip/[tripSlug]/itineraries` のようなエンドポイントを追加して、旅行全体の itineraries を取得できるようにする

---

## 📝 その他の注意事項

### Trip 公開停止について

現在の実装では、`PUT /api/trip/[tripSlug]` で `access_level: 'private'` を設定することで公開停止が可能ですが、以下の点に注意が必要です：

1. **明示的なunpublish機能がない**: 公開→非公開への切り替えが暗黙的
2. **公開状態の履歴がない**: いつ公開したか、いつ非公開にしたかが記録されない
3. **v3.0.0のSNS機能との整合性**: 公開済みのトリップが突然非公開になると、既存のいいね・コメント・フィード表示に影響する可能性がある

### ユーザー情報更新について

現在の実装では、`POST /api/users` で認証済みユーザー自身の情報を更新できますが、以下の点に注意が必要です：

1. **他のユーザーの情報取得**: `/api/users/[userSlug]` のようなエンドポイントがないため、他のユーザーの公開情報を取得できない（v3.0.0のSNS機能で必要になる可能性がある）
2. **ユーザープロフィール編集**: `/api/users/[userSlug]` の `PUT` がないため、`userSlug` での明示的な指定ができない

### Itineraries 取得について

現在の実装では、`GET /api/itineraries?day_id=xxx` で特定の `day_id` の itineraries を取得できますが、以下の点に注意が必要です：

1. **クエリパラメータの必須性**: `day_id` が必須のため、旅行全体の itineraries を一度に取得できない
2. **認証・認可**: 認証必須で、所有権確認があるため、公開トリップでも所有者以外は取得できない（v3.0.0のSNS機能では、公開トリップの itineraries も取得できるべきか？）

---

## 🚀 改善提案の優先度

### 実装完了 ✅

1. ✅ **トリップ公開停止の明示的なエンドポイント追加**
   - `DELETE /api/trip/[tripSlug]/publish` を実装

2. ✅ **ユーザープロフィール取得エンドポイント追加**
   - `GET /api/users/[userSlug]`: 他のユーザーの公開情報を取得を実装

3. ✅ **ユーザー情報更新エンドポイントの整理**
   - `PUT /api/users/[userSlug]`: 認証済みユーザー自身の情報を更新を実装

### 中優先度

4. **Itineraries 取得の改善**
   - `GET /api/trip/[tripSlug]/itineraries`: 旅行全体の itineraries を取得
   - 公開トリップの場合は認証不要、private トリップの場合は所有者のみ

### 低優先度

5. **公開状態の履歴を記録する仕組み**
   - `published_at` や `unpublished_at` などのフィールドを追加

---

## 📚 関連ドキュメント

- **API エントリポイント一覧**: `docs/api/endpoints.md`
- **v3.0.0アーキテクチャ構想**: `docs/planning/v3-architecture-vision.md`
- **実装順序**: `docs/planning/v3-implementation-order.md`

