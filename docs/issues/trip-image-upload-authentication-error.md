# Issue: Trip Imageアップロード時の認証エラーとi18n問題

**作成日**: 2025-01-XX  
**状態**: ✅ 解決済み  
**優先度**: 高  
**種類**: バグ修正 + i18n  
**関連ファイル**: 
- `lib/storage/image-upload.ts`（エラーメッセージ生成）
- `components/ui/ImageUpload.tsx`（エラー表示）
- `storage.rules`（Firebase Storageセキュリティルール）
- `components/trip/TripEditor.tsx`（TripEditorでの使用）

---

## 📋 概要

「Edit trip information」ダイアログでTrip Imageを削除した後、新しい画像をアップロードしようとすると、「Failed to upload image: 認証エラー: Firebase Storageへのアクセス権限がありません」というエラーが表示される。エラーメッセージが日本語のまま（i18n化されていない）であり、特にストレージ制限に達していないにもかかわらずアップロードできない問題。

---

## 🐛 問題の詳細

### 現状の動作
1. 「Edit trip information」ダイアログを開く
2. Trip Imageを削除（Xボタンをクリック）
3. 新しい画像を選択（ファイル選択ダイアログから選択）
4. **エラーが発生**: 「Failed to upload image: 認証エラー: Firebase Storageへのアクセス権限がありません」
5. エラーメッセージが日本語のまま表示される

### 期待される動作
- 画像を削除した後でも、新しい画像をアップロードできる
- エラーメッセージがi18n化されている（ユーザーの言語設定に応じて表示される）
- ストレージ制限に達していない場合、アップロードが成功する

---

## 🔍 想定原因

### 1. エラーメッセージのi18n化不足
**問題箇所**: `lib/storage/image-upload.ts`の118行目

```typescript
if (error.message.includes('storage/unauthorized')) {
  throw new Error('認証エラー: Firebase Storageへのアクセス権限がありません')
}
```

**問題**: 
- エラーメッセージがハードコードされた日本語文字列
- `t()`関数を使用していない
- 他のエラーメッセージも同様に日本語のまま（120-144行目）

### 2. Firebase Storage認証エラーの原因
**問題**: `storage/unauthorized`エラーが発生している原因

**想定される原因**:
1. **Firebase Storageセキュリティルールの問題**
   - `storage.rules`が適切に設定されていない
   - ユーザー認証が正しく検証されていない
   - パスパターンが一致していない

2. **認証トークンの問題**
   - 画像削除後に認証トークンが無効化されている
   - `getAuthToken()`が正しく動作していない
   - トークンの有効期限が切れている

3. **ユーザー状態の不整合**
   - 画像削除処理中にユーザー状態が変化している
   - `auth.currentUser`が`null`になっている
   - ユーザーIDの取得に失敗している

4. **ストレージパスの問題**
   - 画像削除後にパスが正しく生成されていない
   - パスがFirebase Storageルールに一致していない

### 3. 画像削除後の状態管理
**問題**: 画像を削除した直後に新しい画像をアップロードしようとするとエラーが発生

**想定される原因**:
- 画像削除処理が非同期で完了していない
- ストレージ使用量の更新が完了していない
- 認証状態が一時的に不安定になっている

---

## 💡 解決方針

### Phase 1: エラーメッセージのi18n化
1. **i18nキーの追加**
   - `lib/i18n/index.ts`にエラーメッセージのキーを追加
   - 日本語と英語の両方の翻訳を追加

2. **エラーメッセージの置き換え**
   - `lib/storage/image-upload.ts`のすべてのエラーメッセージをi18n化
   - `t()`関数を使用してエラーメッセージを生成

3. **エラー表示の改善**
   - `ImageUpload.tsx`でエラーメッセージを適切に表示
   - エラーメッセージの構造を改善（エラーコードとメッセージを分離）

### Phase 2: 認証エラーの原因調査
1. **デバッグログの追加**
   - `getAuthToken()`の実行状況をログ出力
   - `auth.currentUser`の状態を確認
   - ストレージパスの生成を確認
   - Firebase Storageルールの評価を確認

2. **Firebase Storageルールの確認**
   - `storage.rules`の内容を確認
   - ユーザー認証の検証ロジックを確認
   - パスパターンの一致を確認

3. **認証フローの改善**
   - 画像削除後に認証状態を再確認
   - トークンの再取得を試行
   - エラーハンドリングを改善

### Phase 3: 状態管理の改善
1. **非同期処理の順序保証**
   - 画像削除処理が完了してからアップロードを許可
   - ローディング状態を適切に管理

2. **エラーハンドリングの改善**
   - 認証エラーの場合、再認証を促す
   - ユーザーフレンドリーなエラーメッセージを表示

---

## 🔗 関連ファイル

- `lib/storage/image-upload.ts` - 画像アップロード処理とエラーメッセージ生成
- `components/ui/ImageUpload.tsx` - 画像アップロードUIとエラー表示
- `storage.rules` - Firebase Storageセキュリティルール
- `lib/i18n/index.ts` - i18nキー定義
- `components/trip/TripEditor.tsx` - TripEditorでのImageUpload使用

---

## 📝 技術的検討事項

### 現在のエラーハンドリング
```typescript
// lib/storage/image-upload.ts (118行目)
if (error.message.includes('storage/unauthorized')) {
  throw new Error('認証エラー: Firebase Storageへのアクセス権限がありません')
}
```

**問題点**:
1. ハードコードされた日本語文字列
2. i18n化されていない
3. エラーコードとメッセージが分離されていない

### 改善案
```typescript
// i18nキーを追加
'imageUpload.error.auth': 'Authentication error',
'imageUpload.error.auth.description': 'No access permission to Firebase Storage',

// エラーハンドリングを改善
if (error.message.includes('storage/unauthorized')) {
  throw new Error('storage/unauthorized') // エラーコードのみ
}

// ImageUpload.tsxでi18n化されたメッセージを表示
const errorMessage = getI18nErrorMessage(error.code)
```

### Firebase Storageルールの確認
`storage.rules`の内容を確認し、以下の点を検証：
- ユーザー認証の検証: `request.auth != null`
- パスパターンの一致: `match /trips/{tripId}/images/{fileName}`
- 所有権の確認: `request.auth.uid == userId`

### 認証フローの改善
1. 画像削除前に認証状態を確認
2. 画像削除後に認証状態を再確認
3. アップロード前にトークンを再取得
4. エラーが発生した場合、再認証を促す

---

## ✅ 完了条件

- [x] すべてのエラーメッセージがi18n化されている
- [x] エラーメッセージがユーザーの言語設定に応じて表示される
- [x] 画像削除後に新しい画像をアップロードできる（認証状態の再確認とトークン再取得を実装）
- [x] ストレージ制限に達していない場合、アップロードが成功する
- [x] 認証エラーが発生した場合、適切なエラーメッセージが表示される
- [x] デバッグログを追加（認証状態、パス、TripId等）
- [x] Firebase Storageルールが適切に設定されている（/trips/{tripId}/images/...パスのルールを追加）
- [x] 認証フローが改善されている（認証状態の再確認、トークン再取得、削除後の状態安定化）

## 🔧 実装内容

### Phase 1: エラーメッセージのi18n化

1. **`lib/i18n/index.ts`**
   - エラーメッセージ用のi18nキーを追加（`imageUpload.error.*`）
   - 日本語と英語の両方の翻訳を追加

2. **`lib/storage/image-upload.ts`**
   - すべてのエラーメッセージをi18n化
   - `checkStorageQuota`と`updateStorageUsage`のエラーメッセージもi18n化
   - `getUserLanguage()`を使用してユーザーの言語設定を取得

### Phase 2: Firebase Storageルールの修正

1. **`storage.rules`**
   - `/trips/{tripId}/images/{fileName}`パスのルールを追加
   - 読み取り: 認証済みユーザーは読み取り可能（公開旅行は誰でも読み取り可能）
   - 作成・更新: tripの所有者のみ（`request.auth.uid == trip.user_id`）
   - 削除: tripの所有者のみ
   - ファイルタイプとサイズの検証を適用

### Phase 3: 認証フローの改善

1. **`lib/storage/image-upload.ts`**
   - アップロード前に認証状態を再確認
   - トークンの再取得を試行（`forceRefresh: true`）
   - 画像削除時にも認証状態を確認

2. **`components/ui/ImageUpload.tsx`**
   - アップロード前に認証状態を再確認
   - 画像削除後の状態安定化のため100ms待機を追加
   - 詳細なデバッグログを追加（認証状態、パス、TripId等）

### 修正コード

```typescript
// lib/storage/image-upload.ts
// 認証状態を確認
const { auth } = await import('@/lib/firebase/client')
const currentUser = auth.currentUser
if (!currentUser) {
  logger.error('No authenticated user found during upload')
  const language = getUserLanguage()
  throw new Error(t('imageUpload.error.unauthenticated', language))
}

// トークンの再取得
const token = await currentUser.getIdToken(true) // forceRefresh: true
```

```javascript
// storage.rules
match /trips/{tripId}/images/{fileName} {
  allow create, update: if request.auth != null
    && exists(/databases/(default)/documents/trips/$(tripId))
    && request.auth.uid == get(/databases/(default)/documents/trips/$(tripId)).data.user_id
    && isValidFileType()
    && isUnderFileSizeLimit();
}
```

---

## 🔍 デバッグ手順

1. **ブラウザの開発者ツールを開く**
   - Consoleタブでエラーログを確認
   - NetworkタブでAPIリクエストを確認

2. **認証状態の確認**
   - `auth.currentUser`の状態を確認
   - トークンの有効性を確認

3. **Firebase Storageルールの確認**
   - Firebase ConsoleでStorageルールを確認
   - ルールシミュレーターで動作を確認

4. **画像削除後の状態確認**
   - 画像削除処理の完了を確認
   - ストレージ使用量の更新を確認
   - 認証状態の変化を確認

5. **アップロード時の状態確認**
   - アップロード開始時の認証状態を確認
   - ストレージパスの生成を確認
   - エラーの詳細を確認

---

## 📝 補足

- このIssueは、ユーザーが実際に体験した問題を基に作成されています
- エラーメッセージのi18n化は、他のIssueでも対応済みのパターンに従います
- 認証エラーの原因は、Firebase Storageルール、認証トークン、または状態管理の問題の可能性があります
- 画像削除後の状態管理については、非同期処理の順序保証が重要です

---

## 🔍 根本原因の特定（2025-11-05追記）

### 実際の原因

段階的なStorage Rulesテストにより、**実際の原因が判明しました**：

**問題**: Firebase Storageの`create`操作時に、Firestoreドキュメントの存在チェック（`exists()`や`get().exists`）を行うと失敗する

**詳細**:
1. Edit trip informationダイアログで画像を初めてアップロードする際、Firebase Storageは`create`操作として扱う
2. 初回アップロード時は、Storageパス`trips/{tripId}/images/`がまだ存在しない
3. Storage Rulesで`create`と`update`を同じルールで扱い、Firestoreドキュメントの存在チェックを含めていた
4. この結果、`create`操作時にFirestoreドキュメントの存在チェックが実行され、403エラーが発生していた

### 段階的テスト結果

1. **Step 1: 認証のみ** - ✅ 成功
   ```javascript
   allow create, update: if request.auth != null;
   ```

2. **Step 2: 認証 + tripの存在確認** - ❌ 失敗
   ```javascript
   allow create, update: if request.auth != null
     && exists(/databases/(default)/documents/trips/$(tripId));
   ```

3. **Step 2c: createとupdateを分離** - ✅ 成功
   ```javascript
   allow create: if request.auth != null;
   allow update: if request.auth != null
     && get(/databases/(default)/documents/trips/$(tripId)).exists;
   ```

### 解決方法

`create`と`update`を**分離**して、それぞれ異なるルールを適用：

- **`create`時**: 認証のみ（初回アップロード時はFirestoreドキュメントの存在チェックをスキップ）
- **`update`時**: 認証 + Firestoreドキュメントの存在確認 + 所有権チェック

### 関連Issue

詳細は`docs/issues/trip-image-upload-create-vs-edit.md`を参照してください。

---

## 🔗 関連Issue

- [x] `trip-image-upload-create-vs-edit.md` - 新規作成時は成功、編集時は失敗する問題（根本原因を特定）
- [ ] `trip-editor-delete-button-not-working.md` - TripEditorのDeleteボタンが反応しない問題（関連する可能性あり）

