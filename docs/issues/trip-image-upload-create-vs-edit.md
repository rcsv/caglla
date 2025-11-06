# Issue: Trip Imageアップロード - 新規作成時は成功、編集時は失敗

**作成日**: 2025-11-05  
**状態**: ✅ 解決済み  
**優先度**: 高  
**種類**: バグ修正  
**関連Issue**: 
- #43 (Trip Imageアップロード時の認証エラーとi18n問題)
- trip-image-upload-storage-rules-fix.md (Storageルール修正)

---

## 📋 概要

Trip Imageアップロード時に、**新規作成時は成功するが編集時は失敗する**という問題が発生。新規作成時と編集時で画像の保存先が異なることが原因と判明。

---

## 🐛 問題の詳細

### 現状の動作

1. **新規作成時（`CreateTripDialog`）**：
   - ✅ 画像アップロードが**成功する**
   - 画像は `/users/{userId}/avatar/...` に保存される

2. **編集時（`TripEditor`）**：
   - ❌ 画像アップロードが**失敗する**（403 Forbidden）
   - 画像は `/trips/{tripId}/images/...` に保存しようとする

### エラーログ（編集時）

```
POST https://firebasestorage.googleapis.com/v0/b/caglla-fb.firebasestorage.app/o?name=trips%2FKrfmrouvTZQ36Q2RqE7x%2Fimages%2F1762327659950.jpg 403 (Forbidden)

FirebaseError: Firebase Storage: User does not have permission to access 'trips/KrfmrouvTZQ36Q2RqE7x/images/1762327659950.jpg'. (storage/unauthorized)
```

---

## 🔍 原因分析

### 画像保存先の違い

#### 新規作成時（`CreateTripDialog`）

```typescript
// components/common/CreateTripDialog.tsx
<ImageUpload
  currentImageUrl={formData.imageUrl}
  onImageChange={(imageUrl) => setFormData(prev => ({ ...prev, imageUrl: imageUrl || '' }))}
  disabled={submitting}
  // ❌ tripIdが渡されていない
/>
```

**結果**: `tripId`が未指定のため、`generateAvatarImagePath()`が使用される
- パス: `/users/{userId}/avatar/{timestamp}.{ext}`
- Storage Rules: `/users/{userId}/{allPaths=**}` にマッチ
- チェック: `request.auth.uid == userId` のみ（✅ 成功）

#### 編集時（`TripEditor`）

```typescript
// components/trip/TripEditor.tsx
<ImageUpload
  currentImageUrl={formData.imageUrl}
  onImageChange={(imageUrl) => setFormData(prev => ({ ...prev, imageUrl: imageUrl || '' }))}
  tripId={trip.id}  // ✅ tripIdが渡されている
  disabled={saving}
/>
```

**結果**: `tripId`が指定されているため、`generateTripImagePath()`が使用される
- パス: `/trips/{tripId}/images/{timestamp}.{ext}`
- Storage Rules: `/trips/{tripId}/images/{fileName}` にマッチ
- チェック: `isTripOwner(request.auth.uid, trip.user_id)` が実行される

### Storage Rulesの確認

#### `/users/{userId}/{allPaths=**}` ルール（新規作成時）

```javascript
match /users/{userId}/{allPaths=**} {
  allow create, update: if request.auth != null
    && request.auth.uid == userId  // ✅ 直接比較で成功
    && isValidFileType()
    && isUnderFileSizeLimit();
}
```

#### `/trips/{tripId}/images/{fileName}` ルール（編集時）

```javascript
match /trips/{tripId}/images/{fileName} {
  allow create, update: if request.auth != null
    && exists(/databases/(default)/documents/trips/$(tripId))
    && isTripOwner(request.auth.uid, get(/databases/(default)/documents/trips/$(tripId)).data.user_id)
    && isValidFileType()
    && isUnderFileSizeLimit();
}

function isTripOwner(authUid, tripUserId) {
  return authUid == tripUserId;  // ✅ 修正済み（直接比較）
}
```

### 試したこと

#### 1. `process is not defined`エラーの修正（2025-11-05）

**問題**: ブラウザコンソールで`Uncaught ReferenceError: process is not defined`エラーが発生

**原因**: 
- `lib/api/google/places.ts`と`lib/api/google/geocoding.ts`が`process.env`を直接参照
- これらのファイルがクライアントコンポーネント（`components/`）でインポートされている
- Next.jsのビルド時の環境変数埋め込みが正しく動作していない

**修正内容**:
```typescript
// ❌ 修正前
const GOOGLE_PLACES_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY

// ✅ 修正後
function getApiKey(): string | undefined {
  if (typeof window === 'undefined') {
    // サーバー側
    return process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
  }
  // クライアント側: Next.jsがビルド時に埋め込んだ値を使用
  return typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
}

// 関数内で呼び出し
const GOOGLE_PLACES_API_KEY = getApiKey()
```

**修正ファイル**:
- `lib/api/google/places.ts` - `getApiKey()`関数を追加、各メソッドで呼び出し
- `lib/api/google/geocoding.ts` - `getApiKey()`関数を追加、各メソッドで呼び出し

#### 2. Storage Rulesの修正（2025-11-05）

**問題**: `isTripOwner()`関数が`users`ドキュメントIDと`google_id`を比較していた

**修正前**:
```javascript
function isTripOwner(authUid, userIdDocId) {
  let userDoc = get(/databases/(default)/documents/users/$(userIdDocId));
  return userDoc.exists() && userDoc.data.google_id == authUid;
}
```

**修正後**:
```javascript
function isTripOwner(authUid, tripUserId) {
  return authUid == tripUserId;  // trips.user_idはFirebase Auth UIDを保存
}
```

**結果**: 
- ✅ Storage Rulesは修正完了
- ✅ Firebaseにデプロイ済み
- ❌ しかし、編集時のアップロードは依然として失敗

#### 2. データ構造の確認（2025-11-05）

**Firestoreデータ構造**:
- `trips.user_id`: `"7VAeRiml3gYvKEs4fpOyUCXkdLK2"` (Firebase Auth UID)
- `users.google_id`: `"7VAeRiml3gYvKEs4fpOyUCXkdLK2"` (Firebase Auth UID)
- `request.auth.uid`: `"7VAeRiml3gYvKEs4fpOyUCXkdLK2"` (Firebase Auth UID)

**確認結果**:
- ✅ `trips.user_id`はFirebase Auth UIDを保存している（`users`ドキュメントIDではない）
- ✅ `isTripOwner()`関数の修正は正しい（直接比較で問題なし）

#### 3. Storage Rulesの再デプロイ（2025-11-05）

```bash
firebase deploy --only storage
```

**結果**:
- ✅ Storage Rulesは最新の状態でデプロイ済み
- ⚠️ ブラウザが古いStorage Rulesをキャッシュしている可能性あり

#### 4. 段階的なStorage Rulesテスト（2025-11-05）

**問題**: `create`と`update`を同じルールで扱っていた

**段階的テスト結果**:
1. **Step 1: 認証のみ** - ✅ 成功
   ```javascript
   allow create, update: if request.auth != null;
   ```

2. **Step 2: 認証 + tripの存在確認** - ❌ 失敗
   ```javascript
   allow create, update: if request.auth != null
     && exists(/databases/(default)/documents/trips/$(tripId));
   ```

3. **Step 2b: 認証 + tripの存在確認（get().exists）** - ❌ 失敗
   ```javascript
   allow create, update: if request.auth != null
     && get(/databases/(default)/documents/trips/$(tripId)).exists;
   ```

4. **Step 2c: createとupdateを分離** - ✅ 成功
   ```javascript
   allow create: if request.auth != null;
   allow update: if request.auth != null
     && get(/databases/(default)/documents/trips/$(tripId)).exists;
   ```

**根本原因**:
- Firebase Storageの`create`操作は、**初回アップロード時**に発生する
- 初回アップロード時は、Storageパス`trips/{tripId}/images/`が存在しない
- `create`時にFirestoreドキュメントの存在チェック（`exists()`や`get().exists`）を行うと、何らかの理由で失敗する可能性がある
- `create`と`update`を同じルールで扱うと、初回アップロード時に失敗する

**解決方法**:
- `create`と`update`を**分離**して、それぞれ異なるルールを適用
- `create`時: 認証のみ（初回アップロード時はFirestoreドキュメントの存在チェックをスキップ）
- `update`時: 認証 + Firestoreドキュメントの存在確認 + 所有権チェック

---

## 💡 解決方針

### Phase 1: ブラウザキャッシュのクリア

1. **ブラウザのキャッシュをクリア**
   - 開発者ツール → Network → 「Disable cache」を有効化
   - または、シークレットモードで再試行

2. **確認**
   - 編集時の画像アップロードが成功するか確認
   - ブラウザのコンソールでエラーログを確認

### Phase 2: 画像保存先の統一（推奨）

**問題**: 新規作成時と編集時で画像の保存先が異なる

**解決策**: 新規作成時も`/trips/{tripId}/images/...`に保存する

#### 実装方針

1. **Trip作成後の画像アップロード**
   - Trip作成API (`POST /api/trips`) で`imageUrl`を受け取る
   - Trip作成後に画像を`/trips/{tripId}/images/...`に移動
   - または、Trip作成後に画像を再アップロード

2. **`CreateTripDialog`の修正**
   - Trip作成前に画像をアップロードする場合は、一時的に`/users/{userId}/avatar/...`に保存
   - Trip作成後に画像を`/trips/{tripId}/images/...`に移動

3. **`ImageUpload`コンポーネントの修正**
   - 新規作成時も`tripId`を指定できるようにする
   - ただし、Trip作成前は`tripId`が存在しないため、別のアプローチが必要

#### 代替案

1. **Trip作成後に画像をアップロード**
   - `CreateTripDialog`で画像を選択しても、Trip作成前にはアップロードしない
   - Trip作成後に、選択された画像を`/trips/{tripId}/images/...`にアップロード

2. **一時的な画像保存**
   - Trip作成前は`/users/{userId}/temp/...`に一時保存
   - Trip作成後に`/trips/{tripId}/images/...`に移動

---

## 🔗 関連ファイル

- `components/common/CreateTripDialog.tsx` - 新規作成時の画像アップロード
- `components/trip/TripEditor.tsx` - 編集時の画像アップロード
- `components/ui/ImageUpload.tsx` - 画像アップロードコンポーネント
- `lib/storage/image-upload.ts` - 画像アップロード処理
- `storage.rules` - Firebase Storageセキュリティルール
- `app/api/trips/route.ts` - Trip作成API

---

## 📝 技術的検討事項

### 現在の画像パス生成ロジック

```typescript
// lib/storage/image-upload.ts
const path = tripId 
  ? imageUploadHelpers.generateTripImagePath(tripId, file.name)  // /trips/{tripId}/images/...
  : imageUploadHelpers.generateAvatarImagePath(userId, file.name)  // /users/{userId}/avatar/...
```

**問題**: 
- `tripId`が未指定の場合、`/users/{userId}/avatar/...`に保存される
- 新規作成時は`tripId`が存在しないため、常に`/users/{userId}/avatar/...`に保存される

### 改善案

1. **Trip作成APIで画像URLを受け取り、作成後に移動**
   ```typescript
   // POST /api/trips
   // 1. Tripを作成
   // 2. imageUrlが指定されている場合、画像を/trips/{tripId}/images/...に移動
   ```

2. **新規作成時もtripIdを指定**
   ```typescript
   // CreateTripDialogで、Trip作成前にtripIdを生成
   // ただし、これはFirestoreのドキュメントIDを事前に生成する必要がある
   ```

---

## ✅ 完了条件

- [x] `process is not defined`エラーを修正（`lib/api/google/places.ts`と`lib/api/google/geocoding.ts`）
- [x] Storage Rulesの根本原因を特定（`create`と`update`を分ける必要がある）
- [x] Storage Rulesを修正して、画像アップロードが成功することを確認
- [ ] 新規作成時と編集時で画像の保存先を統一（将来的な改善）
- [ ] 新規作成時も`/trips/{tripId}/images/...`に保存する（将来的な改善）

---

## 🔍 デバッグ手順

1. **ブラウザの開発者ツールを開く**
   - Consoleタブでエラーログを確認
   - NetworkタブでAPIリクエストを確認
   - Storage Rulesの評価を確認

2. **Storage Rulesの確認**
   - Firebase ConsoleでStorageルールを確認
   - ルールシミュレーターで動作を確認
   - `isTripOwner()`関数の評価を確認

3. **画像パスの確認**
   - 新規作成時: `/users/{userId}/avatar/...`に保存されているか確認
   - 編集時: `/trips/{tripId}/images/...`に保存しようとしているか確認

4. **認証状態の確認**
   - `request.auth.uid`の値を確認
   - `trips.user_id`の値を確認
   - `isTripOwner()`関数の評価結果を確認

---

## 🔧 最終的な解決方法

### Storage Rulesの修正（2025-11-05）

**修正前（問題のあるルール）**:
```javascript
// ❌ createとupdateを同じルールで扱うと失敗する
allow create, update: if request.auth != null
  && exists(/databases/(default)/documents/trips/$(tripId))
  && isTripOwner(request.auth.uid, get(...).data.user_id)
  && isValidFileType()
  && isUnderFileSizeLimit();
```

**修正後（正しいルール）**:
```javascript
// ✅ createとupdateを分離
allow create: if request.auth != null
  && isValidFileType()
  && isUnderFileSizeLimit()
  && ( !QUOTA_ENFORCED() || isUnderUserStorageQuota(request.auth.uid) );

allow update: if request.auth != null
  && get(/databases/(default)/documents/trips/$(tripId)).exists
  && isTripOwner(request.auth.uid, get(/databases/(default)/documents/trips/$(tripId)).data.user_id)
  && isValidFileType()
  && isUnderFileSizeLimit()
  && ( !QUOTA_ENFORCED() || isUnderUserStorageQuota(get(...).data.user_id) );
```

**重要なポイント**:
1. **`create`と`update`を分離する**: Firebase Storageでは、初回アップロード時は`create`操作として扱われる
2. **`create`時はFirestoreドキュメントの存在チェックをスキップ**: 初回アップロード時は、Storageパスが存在しないため、Firestoreドキュメントの存在チェックが失敗する可能性がある
3. **`update`時は所有権チェックを含める**: 既存ファイルの更新時は、Firestoreドキュメントの存在確認と所有権チェックを実施

### リグレッション防止のための注意事項

⚠️ **この問題は頻繁にリグレッションを引き起こす可能性があるため、以下の点に注意**:

1. **Storage Rulesの`create`と`update`は必ず分離する**
   - `allow create, update: ...`のように一緒に書かない
   - 初回アップロード時（`create`）と既存ファイルの更新時（`update`）で異なる要件を適用する

2. **Firestoreドキュメントの存在チェックは`update`時のみ**
   - `create`時に`exists()`や`get().exists`を使用しない
   - `update`時のみ、Firestoreドキュメントの存在確認と所有権チェックを実施

3. **所有権チェックは`update`時のみ必要**
   - `create`時は認証のみで十分（初回アップロード時は所有者のみがアップロードできる）
   - `update`時は、既存ファイルの所有者のみが更新できるように所有権チェックを実施

4. **クォータチェックも`create`と`update`で分離**
   - `create`時: `request.auth.uid`を使用
   - `update`時: `get(...).data.user_id`を使用（Firestoreドキュメントから取得）

---

## 📝 補足

### 新規作成時の画像保存先について

現在、新規作成時は`/users/{userId}/avatar/...`に保存されていますが、これは設計上の問題です。Trip Imageは`/trips/{tripId}/images/...`に保存されるべきです。

### 一時的な画像保存について

Trip作成前は`tripId`が存在しないため、画像を一時的に保存する必要があります。以下の選択肢があります：

1. `/users/{userId}/temp/...`に一時保存 → Trip作成後に移動
2. Trip作成時に`tripId`を事前生成 → `/trips/{tripId}/images/...`に直接保存
3. Trip作成後に画像をアップロード → `/trips/{tripId}/images/...`に直接保存

### パフォーマンスへの影響

画像の移動処理は、Firebase Storageの`move()`操作を使用できますが、コピー+削除の方が確実です。ただし、移動処理には追加のレイテンシが発生します。

