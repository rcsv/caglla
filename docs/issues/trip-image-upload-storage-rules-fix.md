# Issue: Trip Imageアップロード時のFirebase Storageルール問題

**作成日**: 2025-11-05  
**状態**: ✅ 解決済み  
**優先度**: 高  
**種類**: バグ修正  
**関連Issue**: #43 (Trip Imageアップロード時の認証エラーとi18n問題)

---

## 📋 概要

Trip Imageアップロード時に`storage/unauthorized`エラーが発生。認証は成功しているが、Firebase Storageルールで権限チェックが失敗している。

---

## 🐛 問題の詳細

### エラーログ
```
POST https://firebasestorage.googleapis.com/v0/b/caglla-fb.firebasestorage.app/o?name=trips%2FKrfmrouvTZQ36Q2RqE7x%2Fimages%2F1762327659950.jpg 403 (Forbidden)

FirebaseError: Firebase Storage: User does not have permission to access 'trips/KrfmrouvTZQ36Q2RqE7x/images/1762327659950.jpg'. (storage/unauthorized)
```

### 認証状態
- ✅ 認証は成功している（`Authenticated user: 7VAeRiml3gYvKEs4fpOyUCXkdLK2`）
- ✅ トークンも取得できている（`Auth token obtained (length): 1157`）
- ❌ しかし、Firebase Storageへのアップロードが403 Forbiddenで失敗

---

## 🔍 原因分析

### データ構造の問題

Firestoreのデータ構造：
- `trips.user_id`: **usersドキュメントID**を保存（例: `"abc123"`）
- `users.google_id`: **Firebase Auth UID**を保存（例: `"7VAeRiml3gYvKEs4fpOyUCXkdLK2"`）
- `request.auth.uid`: **Firebase Auth UID**（例: `"7VAeRiml3gYvKEs4fpOyUCXkdLK2"`）

### 問題のあるルール（修正前）

```javascript
// ❌ 問題: trips.user_idとrequest.auth.uidを直接比較
allow create, update: if request.auth != null
  && exists(/databases/(default)/documents/trips/$(tripId))
  && request.auth.uid == get(/databases/(default)/documents/trips/$(tripId)).data.user_id
```

**問題点**:
- `trips.user_id`はusersドキュメントID（例: `"abc123"`）
- `request.auth.uid`はFirebase Auth UID（例: `"7VAeRiml3gYvKEs4fpOyUCXkdLK2"`）
- 直接比較できないため、常に`false`になる

---

## 💡 解決方法

### 修正後のルール

```javascript
// Tripの所有権を確認
// trips.user_idはusersドキュメントIDを保存しているため、
// usersドキュメントのgoogle_idとrequest.auth.uidを比較
function isTripOwner(authUid, userIdDocId) {
  let userDoc = get(/databases/(default)/documents/users/$(userIdDocId));
  return userDoc.exists() && userDoc.data.google_id == authUid;
}

// 旅行画像のルール
match /trips/{tripId}/images/{fileName} {
  allow create, update: if request.auth != null
    && exists(/databases/(default)/documents/trips/$(tripId))
    && isTripOwner(request.auth.uid, get(/databases/(default)/documents/trips/$(tripId)).data.user_id)
    && isValidFileType()
    && isUnderFileSizeLimit();
}
```

### 修正内容

1. **`isTripOwner()`関数を追加**
   - `trips.user_id`（usersドキュメントID）からusersドキュメントを取得
   - `users.google_id`と`request.auth.uid`を比較

2. **ルールの更新**
   - `/trips/{tripId}/images/...`パスのルールで`isTripOwner()`を使用
   - 作成・更新・削除のすべての操作で使用

---

## ✅ 実装内容

### 変更ファイル

**`storage.rules`**:
- `isTripOwner()`関数を追加
- `/trips/{tripId}/images/{fileName}`パスのルールを更新

### コミット

- `[最新コミット]`: fix: Firebase Storageルールでtrip所有者の確認方法を修正

---

## 🔍 データ構造の確認

### Firestoreコレクション構造

```
users/{userId}
  - google_id: "7VAeRiml3gYvKEs4fpOyUCXkdLK2"  ← Firebase Auth UID
  - name: "ユーザー名"
  - ...

trips/{tripId}
  - user_id: "abc123"  ← usersドキュメントID（users/{userId}のID）
  - title: "旅行タイトル"
  - ...
```

### 比較の流れ

1. `request.auth.uid` = `"7VAeRiml3gYvKEs4fpOyUCXkdLK2"` (Firebase Auth UID)
2. `trips/{tripId}.user_id` = `"abc123"` (usersドキュメントID)
3. `users/abc123.google_id` = `"7VAeRiml3gYvKEs4fpOyUCXkdLK2"` (Firebase Auth UID)
4. `request.auth.uid == users/abc123.google_id` → `true` ✅

---

## 🧪 テスト

修正後、以下の動作を確認：
- [x] Trip Imageのアップロードが成功する
- [x] エラーメッセージがi18n化されている（既に実装済み）
- [x] 認証トークンのリトライロジックが動作する（既に実装済み）

---

## 📝 補足

### 既存のFirestoreルールとの一貫性

`firestore.rules`でも同様の問題がある可能性がありますが、Storageルールとは別の実装なので、今回はStorageルールのみを修正しました。

### パフォーマンスへの影響

`isTripOwner()`関数はFirestoreドキュメントを1回読み取るため、わずかなレイテンシが発生しますが、許容範囲内です。

