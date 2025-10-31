# Issue: プロフィールページでPrivate Tripsが表示されない

**作成日**: 2025-10-31  
**状態**: 🔴 未解決  
**優先度**: 中  
**関連ファイル**: `app/[userSlug]/page.tsx`

---

## 📋 概要

自分自身のプロフィールページを閲覧しているにも関わらず、Private Tripsセクションに非公開の旅行が1件も表示されない。

---

## 🐛 問題の詳細

### 期待される動作
- 自分自身のプロフィールページ（`/[userSlug]/page.tsx`）を閲覧している場合
- Private Tripsセクションが表示される
- 非公開（`access_level === 'private'`）の旅行が一覧表示される

### 実際の動作
- 自分自身のプロフィールページを閲覧している
- Private Tripsセクションは表示される（条件は満たしている）
- しかし、非公開の旅行が1件も表示されない

---

## 🔍 調査状況

### 実装内容
`app/[userSlug]/page.tsx`で以下の実装を行っている：

```typescript
// 自分自身のプロフィールの場合、非公開の旅行も取得
const currentUserId = user?.uid
const viewedUserId = profileUser?.id
if (currentUserId && viewedUserId && currentUserId === viewedUserId) {
  const privateTripsList = trips.filter(t => {
    const level = t.access_level?.toLowerCase()
    // 'private'、未設定（null/undefined）、空文字列の場合は非公開とみなす
    return level === 'private' || !level || level === ''
  })
  setPrivateTrips(privateTripsList)
}
```

### 考えられる原因

1. **`access_level`フィールドの値が期待と異なる**
   - `'private'`ではなく`'PRIVATE'`（大文字）やその他の値
   - フィールドが未設定（null/undefined）
   - フィールド名が異なる（例：`accessLevel`）

2. **ID判定の問題**
   - `user.uid`と`profileUser.id`が一致していない
   - タイミングの問題（`profileUser`が取得される前に判定している）

3. **APIレスポンスの問題**
   - `/api/trips`が非公開旅行を返していない
   - フィルタリングが既にサーバー側で行われている

4. **表示条件の問題**
   - `isOwnProfile`の判定が正しく機能していない
   - 初回セットアップモードで表示されない

---

## 🛠️ デバッグコード追加済み

以下のデバッグコードを追加済み（`app/[userSlug]/page.tsx`）：

```typescript
// デバッグ: 旅行データを確認
console.log('🔍 Profile trips debug:', {
  currentUserId,
  viewedUserId,
  isOwnProfile: currentUserId && viewedUserId && currentUserId === viewedUserId,
  totalTrips: trips.length,
  publicTrips: publicTripsList.length,
  privateTrips: trips.filter(t => {
    const level = t.access_level?.toLowerCase()
    return level === 'private' || !level || level === ''
  }).length,
  allAccessLevels: trips.map(t => ({ 
    id: t.id, 
    title: t.title, 
    access_level: t.access_level,
    access_level_lower: t.access_level?.toLowerCase()
  }))
})

if (currentUserId && viewedUserId && currentUserId === viewedUserId) {
  const privateTripsList = trips.filter(t => {
    const level = t.access_level?.toLowerCase()
    return level === 'private' || !level || level === ''
  })
  console.log('🔒 Private trips found:', privateTripsList.length, privateTripsList.map(t => ({ id: t.id, title: t.title, access_level: t.access_level })))
  setPrivateTrips(privateTripsList)
}
```

開発環境では、Private Tripsセクションが空の場合にデバッグ情報も表示されます。

---

## 📝 次のステップ

### 1. ブラウザコンソールでの確認
以下の情報を確認：
- `currentUserId`と`viewedUserId`が一致しているか
- `allAccessLevels`で各旅行の`access_level`の実際の値
- `privateTrips`にいくつか見つかっているか（フィルタリング前）

### 2. APIレスポンスの確認
`/api/trips`エンドポイントの実装を確認：
- `app/api/trips/route.ts`の`GET`ハンドラー
- `adminTripOperations.getTripsByUserId()`の実装
- 非公開旅行が確実に含まれているか

### 3. Firestoreデータの確認
実際のFirestoreデータを確認：
- `trips`コレクションの`access_level`フィールドの値
- 非公開旅行のデータが正しく保存されているか

---

## 🔗 関連ファイル

- `app/[userSlug]/page.tsx` - プロフィールページの実装
- `app/api/trips/route.ts` - 旅行データ取得API
- `lib/firebase/admin-operation.ts` - Firestore操作
- `lib/core/types/trip.ts` - Trip型定義

---

## 💡 仮説と修正案

### 仮説1: `access_level`が未設定の場合
**対応**: フィルタリングロジックで未設定を非公開として扱うように修正済み

### 仮説2: ID判定のタイミング問題
**対応**: `profileUser`取得後に旅行データを取得するように実装済み

### 仮説3: APIが非公開旅行を返していない
**確認が必要**: `/api/trips`が全旅行（公開・非公開）を返しているか確認

---

## ✅ 解決後の確認事項

- [ ] 自分自身のプロフィールページでPrivate Tripsが表示される
- [ ] 非公開旅行が正しくフィルタリングされている
- [ ] デバッグコードを削除する
- [ ] 開発環境でのデバッグ表示を削除する

