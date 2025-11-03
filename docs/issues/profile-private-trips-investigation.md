# Issue: プロフィールページでPrivate Tripsが表示されない（調査中）

**作成日**: 2025-11-01  
**解決日**: 2025-11-01  
**状態**: ✅ 解決済み  
**優先度**: 高  
**関連ファイル**: 
- `app/[userSlug]/page.tsx` - プロフィールページ
- `app/api/trips/route.ts` - 旅行データ取得API
- `lib/firebase/admin-operation.ts` - Firestore操作

---

## 📋 問題

データ上には確実に1件のPrivate Tripがあるはずなのに、ProfileページのPrivate Tripsセクションに表示されない。

---

## 🔍 調査内容

### 現在の実装

**Profileページ** (`app/[userSlug]/page.tsx`):
1. `/api/trips`エンドポイントを呼び出して全旅行を取得（101行目）
2. `access_level === 'public'`で公開旅行をフィルタリング（105行目）
3. 自分自身のプロフィールの場合、以下の条件で非公開旅行をフィルタリング（115-119行目）:
   ```typescript
   const level = t.access_level?.toLowerCase()
   return level === 'private' || !level || level === ''
   ```

**APIエンドポイント** (`app/api/trips/route.ts`):
- `getTripsByUserId(userId)`を呼び出し、`access_level`でフィルタリングせずに全旅行を返す（45行目）
- `getTripsByUserId`は`user_id`のみでフィルタリングし、`access_level`は考慮しない（`lib/firebase/admin-operation.ts` 157-171行目）

### 考えられる原因

1. **ID判定の問題**
   - `user?.uid`と`fetchedUser?.id`が一致していない可能性
   - タイミングの問題（`profileUser`が取得される前に判定している）

2. **`access_level`フィールドの値**
   - 期待値: `'private'`、`null`、`undefined`、`''`
   - 実際の値が異なる可能性（例: `'PRIVATE'`、`'Private'`など）

3. **フィルタリングロジックの問題**
   - `toLowerCase()`の結果が期待と異なる
   - 空文字列チェックが正しく機能していない

4. **APIレスポンスの問題**
   - `/api/trips`がPrivate Tripを返していない可能性

---

## 🛠️ 次のステップ

### 1. デバッグログの追加

Profileページの`fetchUserProfile`関数にデバッグログを追加して、以下を確認：

```typescript
console.log('🔍 Profile trips debug:', {
  currentUserId: user?.uid,
  viewedUserId: fetchedUser?.id,
  isOwnProfile: currentUserId && viewedUserId && currentUserId === viewedUserId,
  totalTrips: trips.length,
  publicTrips: publicTripsList.length,
  privateTripsFiltered: trips.filter(t => {
    const level = t.access_level?.toLowerCase()
    return level === 'private' || !level || level === ''
  }).length,
  allTrips: trips.map(t => ({ 
    id: t.id, 
    title: t.title, 
    access_level: t.access_level,
    access_level_type: typeof t.access_level,
    access_level_lower: t.access_level?.toLowerCase()
  }))
})
```

### 2. ブラウザコンソールでの確認

開発環境でブラウザコンソールを開き、以下を確認：
- `currentUserId`と`viewedUserId`が一致しているか
- `allTrips`で各旅行の`access_level`の実際の値
- `privateTripsFiltered`にいくつか見つかっているか

### 3. Networkタブでの確認

Networkタブで`/api/trips`のレスポンスを確認：
- Private Tripがレスポンスに含まれているか
- `access_level`の値がどうなっているか

---

## ✅ 解決内容

### 問題の原因

デバッグログから以下の問題が判明：

1. **ID判定の誤り**
   - `user?.uid`（Firebase Auth UID）: `'7VAeRiml3gYvKEs4fpOyUCXkdLK2'`
   - `fetchedUser?.id`（FirestoreドキュメントID）: `'faRoL34yjICfd6v21VMr'`
   - これらは異なるため、`isOwnProfile`が常に`false`になっていた

2. **正しい比較方法**
   - `user?.uid`（Firebase Auth UID）と`fetchedUser?.google_id`（Firestoreの`google_id`フィールド）を比較すべき
   - Firestoreのusersコレクションでは、ドキュメントIDはFirebase Auth UIDとは異なる場合がある

3. **process is not definedエラー**
   - クライアントサイドで`process.env.NODE_ENV`を直接使用していた
   - `typeof window !== 'undefined'`チェックを追加して修正

### 修正内容

**ファイル**: `app/[userSlug]/page.tsx`

1. **ID判定の修正**
   ```typescript
   // 修正前
   const viewedUserId = fetchedUser?.id
   const isOwnProfileCheck = currentUserId && viewedUserId && currentUserId === viewedUserId
   
   // 修正後
   const viewedUserGoogleId = fetchedUser?.google_id
   const isOwnProfileCheck = currentUserId && viewedUserGoogleId && currentUserId === viewedUserGoogleId
   ```

2. **`isOwnProfile`の修正**
   ```typescript
   // 修正前
   const isOwnProfile = user.uid === profileUser.id
   
   // 修正後
   const isOwnProfile = user.uid === profileUser.google_id
   ```

3. **process.env.NODE_ENVの安全な使用**
   ```typescript
   // 修正前
   if (process.env.NODE_ENV === 'development') {
   
   // 修正後
   const isDev = typeof window !== 'undefined' && process.env.NODE_ENV === 'development'
   if (isDev) {
   ```

### 効果

- ✅ Private Tripsが正しく表示されるようになった
- ✅ `process is not defined`エラーが解消された
- ✅ 自分自身のプロフィール判定が正しく機能するようになった

