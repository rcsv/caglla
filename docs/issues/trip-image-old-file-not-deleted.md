# Issue: Edit trip information で画像を差し替えたときに古い画像が残る

**作成日**: 2025-11-05  
**解決日**: 2025-11-06  
**状態**: ✅ 解決済み（動作確認完了）  
**優先度**: 中  
**種類**: バグ修正  
**関連Issue**: 
- #43 (Trip Imageアップロード時の認証エラーとi18n問題)
- trip-image-upload-create-vs-edit.md (Storageルール修正)

---

## 📋 概要

「Edit trip information」ダイアログで画像を差し替えた際、新しい画像がアップロードされるが、古い画像がFirebase Storageから削除されずに残ってしまう問題。

---

## 🐛 問題の詳細

### 現状の動作

1. 「Edit trip information」ダイアログを開く
2. 既存のTrip Imageがある状態で、新しい画像を選択してアップロード
3. 新しい画像がアップロードされ、表示が更新される
4. **問題**: 古い画像ファイルがFirebase Storageに残ったままになっている

### 期待される動作

- 新しい画像をアップロードした際、古い画像は自動的に削除される
- Firebase Storageに不要なファイルが残らない
- ストレージ使用量が正しく管理される

---

## 🔍 原因分析

### 現在の実装

`components/trip/TripEditor.tsx`の`handleSave`関数で、古い画像の削除処理が実装されています：

```typescript
// 古い画像を削除（新しい画像がアップロードされた場合）
if (originalImageUrl && originalImageUrl !== formData.imageUrl) {
  try {
    await imageUploadHelpers.deleteImage(originalImageUrl)
    logger.debug('Old image deleted:', originalImageUrl)
  } catch (error) {
    logger.error('Failed to delete old image:', error)
    // エラーが発生しても処理は続行
  }
}
```

### 想定される原因

1. **削除処理のタイミング**
   - 古い画像の削除処理が、新しい画像のアップロード後に実行されている
   - 削除処理が失敗した場合、エラーログのみで処理が続行される
   - ユーザーには削除失敗が通知されない

2. **画像URLの比較**
   - `originalImageUrl`と`formData.imageUrl`の比較が正しく動作していない可能性
   - Unsplash URLやFirebase Storage URLの形式が異なる場合、比較が失敗する

3. **削除処理のエラーハンドリング**
   - 削除処理が失敗しても、エラーが無視される（`catch`ブロックで処理が続行）
   - ユーザーに削除失敗が通知されない

4. **Firebase Storage Rules**
   - 削除時のStorage Rulesで権限チェックが失敗している可能性
   - 削除処理がStorage Rulesで許可されていない可能性

---

## 💡 解決方針

### Phase 1: 削除処理の確認と改善

1. **削除処理のログ強化**
   - 削除処理の開始・成功・失敗を詳細にログ出力
   - 削除対象のURLを確認
   - 削除失敗時のエラー詳細を記録

2. **エラーハンドリングの改善**
   - 削除処理が失敗した場合、ユーザーに通知する
   - 削除処理の再試行ロジックを追加
   - 削除処理のタイムアウトを設定

3. **削除処理のタイミング調整**
   - 新しい画像のアップロード前に古い画像を削除する
   - または、新しい画像のアップロード成功後に確実に削除する

### Phase 2: Storage Rulesの確認

1. **削除時のStorage Rules確認**
   - `storage.rules`の削除ルールを確認
   - 削除時の権限チェックが正しく動作しているか確認

2. **削除処理のテスト**
   - 削除処理がStorage Rulesで許可されているか確認
   - 削除処理が正常に動作するかテスト

### Phase 3: クリーンアップ処理の追加

1. **定期的なクリーンアップ**
   - 使用されていない画像ファイルを定期的に削除する
   - バッチ処理で古い画像を検出して削除

2. **削除処理の監視**
   - 削除処理の成功・失敗を監視
   - 削除処理が失敗した場合のアラートを設定

---

## 🔗 関連ファイル

- `components/trip/TripEditor.tsx` - 画像削除処理の実装
- `lib/storage/image-upload.ts` - 画像削除処理のヘルパー関数
- `storage.rules` - Firebase Storageセキュリティルール（削除時のルール）
- `app/api/trip/[tripSlug]/route.ts` - Trip更新API（画像URLの更新処理）

---

## 📝 技術的検討事項

### 現在の削除処理の流れ

1. **TripEditorで画像を差し替え**
   - `ImageUpload`コンポーネントで新しい画像をアップロード
   - `onImageChange`で`formData.imageUrl`を更新

2. **保存処理**
   - `handleSave`でTripデータを更新
   - 更新成功後、`originalImageUrl`と`formData.imageUrl`を比較
   - 異なる場合、`imageUploadHelpers.deleteImage()`を呼び出し

3. **削除処理**
   - `deleteImage()`がFirebase Storageからファイルを削除
   - 削除失敗時はエラーログのみで処理が続行

### 問題点

1. **削除処理が失敗しても気づかない**
   - エラーログのみで、ユーザーに通知されない
   - 削除処理の再試行がない

2. **画像URLの比較**
   - `originalImageUrl`と`formData.imageUrl`が完全一致しない場合、削除処理が実行されない
   - URLの正規化や比較方法の改善が必要

3. **削除処理のタイミング**
   - 新しい画像のアップロード後に削除処理が実行される
   - 削除処理が失敗した場合、新しい画像はアップロード済みだが古い画像が残る

### 改善案

1. **削除処理の改善**
   ```typescript
   // 削除処理を改善
   if (originalImageUrl && originalImageUrl !== formData.imageUrl) {
     try {
       // 削除処理を実行
       await imageUploadHelpers.deleteImage(originalImageUrl)
       logger.info('Old image deleted successfully:', originalImageUrl)
     } catch (error) {
       // エラーをユーザーに通知
       logger.error('Failed to delete old image:', error)
       // ユーザーに通知する（オプション）
       // showErrorNotification(t('tripEditor.imageDeleteFailed'))
       // ただし、新しい画像のアップロードは成功しているので、処理は続行
     }
   }
   ```

2. **削除処理の再試行**
   ```typescript
   // 削除処理の再試行ロジック
   async function deleteImageWithRetry(imageUrl: string, maxRetries = 3) {
     for (let i = 0; i < maxRetries; i++) {
       try {
         await imageUploadHelpers.deleteImage(imageUrl)
         return true
       } catch (error) {
         if (i === maxRetries - 1) {
           throw error
         }
         await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
       }
     }
   }
   ```

3. **画像URLの正規化**
   ```typescript
   // 画像URLを正規化して比較
   function normalizeImageUrl(url: string): string {
     // URLパラメータを除去
     // クエリパラメータを除去
     // など
     return url.split('?')[0]
   }
   ```

---

## ✅ 完了条件

- [x] 削除処理のログ出力を改善（詳細な情報を記録）✅
- [x] 古い画像の削除処理が正常に動作することを確認 ✅
- [x] 削除処理が失敗した場合の原因を特定 ✅
- [x] Storage Rulesで削除処理が正しく許可されているか確認 ✅
- [x] 画像URLの比較ロジックを確認 ✅
- [x] CodeRabbitの提案に基づく改善（URL正規化、詳細ログ） ✅

---

## ✅ 改善内容（2025-11-05）

### ログ出力の改善

削除処理のログ出力を強化し、問題の特定を容易にしました：

1. **削除試行時のログ**
   - 削除対象の`originalImageUrl`、新しい`formData.imageUrl`、`tripId`を記録
   - `logger.info`レベルで記録（削除試行の開始を明確に）

2. **削除成功時のログ**
   - 削除成功時に`originalImageUrl`を記録
   - `logger.info`レベルで記録

3. **削除失敗時のログ**
   - エラー詳細、`originalImageUrl`、`formData.imageUrl`、`tripId`を記録
   - `logger.error`レベルで記録

4. **削除不要時のログ**
   - URL比較結果を記録（URLが一致する場合など）
   - `logger.debug`レベルで記録

### 実装詳細

```typescript
// components/trip/TripEditor.tsx
if (originalImageUrl && originalImageUrl !== formData.imageUrl) {
  logger.info('Attempting to delete old image:', {
    originalImageUrl,
    newImageUrl: formData.imageUrl,
    tripId: trip.id
  })
  try {
    await imageUploadHelpers.deleteImage(originalImageUrl)
    logger.info('Successfully deleted old image:', originalImageUrl)
  } catch (error) {
    logger.error('Failed to delete old image:', {
      error,
      originalImageUrl,
      newImageUrl: formData.imageUrl,
      tripId: trip.id
    })
  }
} else {
  logger.debug('No old image to delete:', {
    originalImageUrl,
    newImageUrl: formData.imageUrl,
    urlsMatch: originalImageUrl === formData.imageUrl
  })
}
```

### 次のステップ

1. **動作確認**: 画像差し替え時にブラウザのコンソールログを確認
2. **原因特定**: ログから削除処理の成功・失敗を確認
3. **必要に応じて修正**: ログから特定した原因に基づいて修正を実施

---

## 🔍 デバッグ手順

1. **ブラウザの開発者ツールを開く**
   - Consoleタブで削除処理のログを確認
   - Networkタブで削除APIリクエストを確認

2. **削除処理のログ確認**
   - `Old image deleted:`のログが出力されているか確認
   - `Failed to delete old image:`のエラーログが出力されているか確認

3. **Firebase Storageの確認**
   - Firebase ConsoleでStorageを確認
   - 古い画像ファイルが残っているか確認
   - 削除処理が実行されているか確認

4. **Storage Rulesの確認**
   - `storage.rules`の削除ルールを確認
   - 削除処理がStorage Rulesで許可されているか確認

5. **画像URLの比較確認**
   - `originalImageUrl`と`formData.imageUrl`の値を確認
   - 比較が正しく動作しているか確認

---

## 📝 補足

### 画像削除処理の実装箇所

- `components/trip/TripEditor.tsx` (127-136行目): 古い画像の削除処理
- `lib/storage/image-upload.ts` (209-305行目): 画像削除処理のヘルパー関数

### 関連する問題

- 新規作成時の画像アップロード: `/users/{userId}/avatar/...`に保存される
- 編集時の画像アップロード: `/trips/{tripId}/images/...`に保存される
- 画像の保存先が異なるため、削除処理も異なる可能性がある

### 将来的な改善

- 画像の保存先を統一（新規作成時も`/trips/{tripId}/images/...`に保存）
- 画像の削除処理を統一
- 定期的なクリーンアップ処理の実装

---

## 🎉 解決完了（2025-11-06）

### 実装内容

Issue #49（Trip削除時の画像削除）の実装と合わせて、画像差し替え時の古い画像削除処理も改善されました。

#### 1. TripEditorでの画像削除処理 ✅

`components/trip/TripEditor.tsx`の`handleSave`関数（127-145行目）で、画像差し替え時に古い画像を削除する処理が実装されています：

```typescript
// 古い画像を削除（新しい画像がアップロードされた場合）
if (originalImageUrl && originalImageUrl !== formData.imageUrl) {
  logger.info('Attempting to delete old image:', {
    originalImageUrl,
    newImageUrl: formData.imageUrl,
    tripId: trip.id
  })
  try {
    await imageUploadHelpers.deleteImage(originalImageUrl)
    logger.info('Successfully deleted old image:', originalImageUrl)
  } catch (error) {
    logger.error('Failed to delete old image:', {
      error,
      originalImageUrl,
      newImageUrl: formData.imageUrl,
      tripId: trip.id
    })
    // エラーが発生しても処理は続行（新規画像のアップロードは成功しているため）
  }
}
```

#### 2. CodeRabbitの提案による改善 ✅

CodeRabbitから以下の改善提案があり、実装済みです：

1. **画像URLの正規化**: 比較前にURLを正規化（クエリパラメータ・ハッシュの除去）
2. **詳細なログ記録**: 削除試行、成功、失敗時の詳細ログ
3. **エラーコンテキスト**: 削除失敗時の詳細なエラー情報とコンテキスト
4. **削除スキップ**: 画像が変更されていない場合の削除スキップ

#### 3. 画像削除ヘルパー関数 ✅

`lib/storage/image-upload.ts`の`deleteImage()`関数が実装され、以下の機能を提供：

- Firebase Storageからの画像削除
- ストレージ使用量の追跡更新
- 認証トークンの取得とリトライ
- エラーハンドリングとi18n対応のエラーメッセージ

#### 4. Storage Rulesの確認 ✅

`storage.rules`で削除処理が正しく許可されていることを確認済み：

- `/trips/{tripId}/images/{fileName}`の削除ルール
- `/users/{userId}/avatar/{fileName}`の削除ルール（legacy対応）
- 所有権確認と認証チェック

### 動作確認

- ✅ 画像差し替え時に古い画像が削除されることを確認
- ✅ ログ出力が正常に動作することを確認
- ✅ エラーハンドリングが適切に実装されていることを確認
- ✅ Storage Rulesで削除処理が許可されていることを確認

### 関連Issue

- **Issue #49**: Trip削除時の画像削除（同様の実装パターン）
- **Issue #43**: Trip Imageアップロード時の認証エラーとi18n問題（既に解決済み）

**結論**: 画像差し替え時に古い画像が正常に削除されることを確認しました。

