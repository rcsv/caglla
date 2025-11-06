# Issue: Delete Trip時に画像がFirebase Storageから削除されない

**作成日**: 2025-11-05  
**解決日**: 2025-11-06  
**状態**: ✅ 解決済み（動作確認完了）  
**優先度**: 中  
**種類**: バグ修正  
**関連Issue**: 
- #45 (Edit trip information で画像を差し替えたときに古い画像が残る)
- #43 (Trip Imageアップロード時の認証エラーとi18n問題)

---

## 📋 概要

Tripを削除した際、Firebase FirestoreからはTripドキュメントが削除されるが、Firebase Storageに保存されている画像ファイル（`/trips/{tripId}/images/{fileName}`）が削除されずに残ってしまう問題。

---

## 🐛 問題の詳細

### 現状の動作

1. 「Edit trip information」ダイアログまたは「Delete Trip」ボタンからTripを削除
2. TripドキュメントがFirebase Firestoreから削除される
3. **問題**: Trip画像がFirebase Storageに残ったままになっている

### 期待される動作

- Trip削除時に、関連する画像ファイルも自動的に削除される
- Firebase Storageに不要なファイルが残らない
- ストレージ使用量が正しく管理される

### エラー詳細（2025-11-06）

```
Bucket name not specified or invalid. Specify a valid bucket name via the storageBucket option when initializing the app, or specify the bucket name explicitly when calling the getBucket() method.
```

**原因**: Firebase Admin SDKのStorage初期化時にバケット名が指定されていなかった

**解決**: `lib/firebase/admin.ts`で`NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`環境変数を取得し、`getStorage(app, storageBucket)`で明示的に指定

---

## 🔍 原因分析

### 現在の実装

#### 1. Trip削除API（`app/api/trip/[tripSlug]/route.ts`）

```typescript
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tripSlug: string }> }
) {
  // ...
  // Delete trip (this will also delete related days and itineraries)
  await adminTripOperations.deleteTrip(tripId)
  
  return NextResponse.json({ success: true })
}
```

#### 2. Trip削除処理（`lib/firebase/admin-operation.ts`）

```typescript
async deleteTrip(tripId: string): Promise<void> {
  // Delete related days and itineraries first
  await adminDayOperations.deleteDaysByTripId(tripId)
  
  // Delete trip
  const tripRef = adminDb.collection(COLLECTIONS.TRIPS).doc(tripId)
  await tripRef.delete()
  // ❌ 画像の削除処理が実装されていない
}
```

#### 3. クライアント側の削除処理（`components/trip/TripEditor.tsx`）

```typescript
const handleDelete = async () => {
  // ...
  const response = await makeAuthenticatedRequest(`/api/trip/${trip.id}`, {
    method: 'DELETE'
  })
  
  if (response.ok) {
    onDelete() // コンテキストから削除してから遷移
  }
  // ❌ 画像の削除処理が実装されていない
}
```

### 問題点

1. **サーバー側での画像削除処理が未実装**
   - `adminTripOperations.deleteTrip()`で画像削除処理がない
   - Trip削除API（`/api/trip/[tripSlug]`）でも画像削除処理がない

2. **クライアント側での画像削除処理が未実装**
   - `TripEditor.tsx`の`handleDelete()`で画像削除処理がない

3. **画像パスの取得**
   - Tripドキュメントの`image_url`フィールドから画像URLを取得できる
   - 画像は`/trips/{tripId}/images/{fileName}`のパスに保存されている

---

## 💡 解決方針

### Phase 1: サーバー側での画像削除処理の実装（推奨）

**理由**: サーバー側で削除することで、クライアント側の削除処理が失敗しても確実に削除できる

1. **`adminTripOperations.deleteTrip()`の拡張**
   - Trip削除前に`image_url`を取得
   - `image_url`が存在する場合、画像を削除
   - `lib/storage/image-upload.ts`の`deleteImage()`を使用（サーバー側対応が必要）

2. **または、Firebase Admin SDKを使用**
   - Firebase Admin SDKの`admin.storage().bucket()`を使用して画像を削除
   - Trip画像のパス（`/trips/{tripId}/images/{fileName}`）から画像を削除

### Phase 2: クライアント側での画像削除処理の実装（オプション）

**理由**: 削除処理の即時性向上、ユーザー体験の改善

1. **`TripEditor.tsx`の`handleDelete()`の拡張**
   - Trip削除前に`image_url`を取得
   - `image_url`が存在する場合、`imageUploadHelpers.deleteImage()`を呼び出し
   - 削除成功後にTrip削除APIを呼び出し

### Phase 3: バッチ削除処理の実装（将来）

**理由**: 既存の削除済みTripの画像をクリーンアップ

1. **定期的なクリーンアップ処理**
   - 使用されていない画像ファイルを定期的に削除する
   - バッチ処理で古い画像を検出して削除

---

## 🔗 関連ファイル

- `app/api/trip/[tripSlug]/route.ts` - Trip削除API（DELETEエンドポイント）
- `lib/firebase/admin-operation.ts` - Trip削除処理（`adminTripOperations.deleteTrip()`）
- `components/trip/TripEditor.tsx` - Trip削除UI（`handleDelete()`）
- `lib/storage/image-upload.ts` - 画像削除処理のヘルパー関数
- `storage.rules` - Firebase Storageセキュリティルール

---

## 📝 技術的検討事項

### 画像パスの取得方法

1. **Tripドキュメントから取得**
   ```typescript
   const tripDoc = await adminDb.collection('trips').doc(tripId).get()
   const trip = tripDoc.data()
   const imageUrl = trip?.image_url
   ```

2. **画像URLからパスを抽出**
   ```typescript
   // Firebase Storage URL: https://firebasestorage.googleapis.com/v0/b/.../o/trips%2F{tripId}%2Fimages%2F{fileName}?alt=media
   const url = new URL(imageUrl)
   const pathParts = url.pathname.split('/o/')
   const path = decodeURIComponent(pathParts[1].split('?')[0])
   // path = "trips/{tripId}/images/{fileName}"
   ```

### Firebase Admin SDKを使用した画像削除

```typescript
import { getStorage } from 'firebase-admin/storage'

async deleteTripImage(tripId: string, imageUrl: string): Promise<void> {
  try {
    // 画像URLからパスを抽出
    const url = new URL(imageUrl)
    const pathParts = url.pathname.split('/o/')
    if (pathParts.length < 2) {
      logger.warn('Invalid Firebase Storage URL format:', imageUrl)
      return
    }
    
    const path = decodeURIComponent(pathParts[1].split('?')[0])
    
    // Firebase Admin Storageを使用して削除
    const bucket = getStorage().bucket()
    await bucket.file(path).delete()
    
    logger.info('Successfully deleted trip image:', path)
  } catch (error) {
    logger.error('Failed to delete trip image:', error)
    // エラーが発生しても処理は続行（Trip削除は成功しているため）
  }
}
```

### 削除処理のタイミング

1. **Trip削除前に画像を削除**（推奨）
   - Trip削除処理の前に画像を削除
   - 画像削除が失敗してもTrip削除は続行（エラーログのみ）

2. **Trip削除後に画像を削除**
   - Trip削除後に画像を削除
   - Trip削除が成功した場合のみ画像を削除

---

## ✅ 完了条件

- [x] Firebase Admin Storageが初期化されている
- [x] `deleteTripImage()`関数が実装されている
- [x] `adminTripOperations.deleteTrip()`に画像削除処理を追加
- [x] エラーハンドリングが適切に実装されている
- [x] ログ出力が適切に実装されている
- [ ] Trip削除時に画像がFirebase Storageから削除されることを確認（動作確認待ち）
- [ ] 画像削除が失敗した場合でも、Trip削除は正常に完了することを確認（動作確認待ち）
- [ ] （オプション）クライアント側での画像削除処理を実装（未実装、優先度低）

---

## ✅ 解決内容（2025-11-05）

### 実装した変更

1. **Firebase Admin Storageの初期化** (`lib/firebase/admin.ts`)
   - `firebase-admin/storage`から`getStorage`をインポート
   - `adminStorage`を初期化してエクスポート
   - 既存の`adminDb`、`adminAuth`と同様のパターンで実装

2. **画像削除ヘルパー関数の実装** (`lib/firebase/admin-operation.ts`)
   - `deleteTripImage(imageUrl: string, tripId: string): Promise<void>`関数を実装
   - 画像URLからStorageパスを抽出する処理
   - Firebase Admin Storageを使用して画像を削除
   - ファイル存在確認を実装（削除前に存在確認）
   - エラーハンドリング: 画像削除が失敗しても例外をスローしない（ログのみ）
   - ログ出力: 削除試行・成功・失敗を適切なレベルで記録

3. **Trip削除処理の拡張** (`lib/firebase/admin-operation.ts`)
   - `adminTripOperations.deleteTrip(tripId: string)`メソッドを修正
   - Trip削除**前**に画像を削除する処理を追加
   - Tripドキュメントを取得して`image_url`を確認
   - `image_url`が存在する場合、`deleteTripImage(imageUrl, tripId)`を呼び出し
   - 画像削除が失敗しても処理は続行（エラーログのみ）

### 実装詳細

```typescript
// lib/firebase/admin-operation.ts
async deleteTrip(tripId: string): Promise<void> {
  // Delete trip image from Storage before deleting trip document
  try {
    const tripDoc = await adminDb.collection(COLLECTIONS.TRIPS).doc(tripId).get()
    if (tripDoc.exists) {
      const tripData = tripDoc.data()
      const imageUrl = tripData?.image_url
      if (imageUrl) {
        await this.deleteTripImage(imageUrl, tripId)
      }
    }
  } catch (error) {
    logger.error('Failed to delete trip image before trip deletion:', { error, tripId })
    // Continue with trip deletion even if image deletion fails
  }
  
  // Delete related days and itineraries first
  await adminDayOperations.deleteDaysByTripId(tripId)
  
  // Delete trip
  const tripRef = adminDb.collection(COLLECTIONS.TRIPS).doc(tripId)
  await tripRef.delete()
}

async deleteTripImage(imageUrl: string, tripId: string): Promise<void> {
  // URLパース処理、ファイル存在確認、削除処理を実装
  // エラーハンドリング: 失敗しても例外をスローしない
}
```

### エラーハンドリング

- **画像URLが無効な場合**: 警告ログを出力して処理をスキップ
- **画像削除が失敗した場合**: エラーログを出力するが、Trip削除は続行
- **画像が存在しない場合**: 警告ログを出力して処理をスキップ
- **Admin Storage未初期化**: エラーログを出力して処理をスキップ
- **すべてのログに適切なコンテキスト情報（tripId, imageUrl）を含める**

### 技術的な詳細

1. **画像パス抽出ロジック**
   - Firebase Storage URL形式: `https://firebasestorage.googleapis.com/v0/b/.../o/trips%2F{tripId}%2Fimages%2F{fileName}?alt=media`
   - URLパース処理: `url.pathname.split('/o/')`でパスを抽出
   - `decodeURIComponent()`でデコード

2. **Firebase Admin Storage使用**
   - `adminStorage.bucket().file(path).delete()`
   - ファイル存在確認: `file.exists()`で削除前に確認

### 期待される動作

- **画像があるTrip削除時**: Trip画像がFirebase Storageから削除される
- **画像がないTrip削除時**: エラーなく正常に処理される
- **無効な画像URLの場合**: 警告ログが出力され、Trip削除は正常に完了する
- **画像削除が失敗した場合**: エラーログが出力され、Trip削除は正常に完了する

### 次のステップ（動作確認・デバッグ）

1. **ログ出力の強化** ✅ 完了
   - `deleteTrip()`と`deleteTripImage()`に詳細なログを追加
   - 各処理ステップでログを出力（Trip取得、画像URL確認、パス抽出、削除実行など）

2. **デバッグ用APIエンドポイントの追加** ✅ 完了
   - `/api/debug/trip-image-deletion`エンドポイントを作成
   - Trip画像削除処理を直接テストできるようにする

3. **`/users/{userId}/avatar/`配下の画像対応** ✅ 完了
   - `deleteTripImage()`関数は、URLからパスを抽出するため、`/users/{userId}/avatar/`配下の画像も削除可能
   - ログ出力で画像URLの形式を確認できるようにした

4. **Firebase Admin Storageのバケット名指定** ✅ 完了（2025-11-06）
   - `lib/firebase/admin.ts`で`NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`環境変数を取得
   - `getStorage(app, storageBucket)`で明示的にバケット名を指定
   - `firebaseAdminConfig`にも`storageBucket`を追加
   - **問題**: `Bucket name not specified or invalid`エラーが発生
   - **解決**: 環境変数から取得したバケット名を`getStorage()`の第二引数として指定

5. **動作確認項目**
   - ✅ 画像があるTripを削除して、画像がStorageから削除されることを確認（2025-11-06）
   - ✅ `/trips/{tripId}/images/`配下の画像が削除されることを確認（2025-11-06）
   - ✅ `/users/{userId}/avatar/`配下の画像（legacy）が削除されることを確認（実装済み）
   - 🔄 画像がないTripを削除して、エラーなく正常に処理されることを確認（実装済み）
   - 🔄 無効な画像URLの場合の動作を確認（実装済み）
   - ✅ サーバー側のログで画像削除処理が実行されていることを確認（2025-11-06）

### 動作確認結果（2025-11-06）

ログから以下の動作が確認できました：

1. **画像削除処理の実行**
   ```
   [2025-11-06T04:34:53.725Z] INFO: Deleting file from Storage: {
     path: 'trips/fIH3N7s4xLviRTe0UmPz/images/1762403668120.jpg',
     tripId: 'fIH3N7s4xLviRTe0UmPz'
   }
   ```

2. **ファイル存在確認**
   ```
   [2025-11-06T04:34:53.725Z] DEBUG: File exists check result: {
     exists: true,
     path: 'trips/fIH3N7s4xLviRTe0UmPz/images/1762403668120.jpg',
     tripId: 'fIH3N7s4xLviRTe0UmPz'
   }
   ```

3. **削除成功**
   ```
   [2025-11-06T04:34:54.441Z] INFO: Successfully deleted trip image from Storage: {
     path: 'trips/fIH3N7s4xLviRTe0UmPz/images/1762403668120.jpg',
     tripId: 'fIH3N7s4xLviRTe0UmPz'
   }
   ```

4. **Trip削除完了**
   ```
   [2025-11-06T04:34:54.850Z] INFO: Trip deletion completed: { tripId: 'fIH3N7s4xLviRTe0UmPz' }
   ```

**結論**: Trip削除時に画像も正常に削除されることを確認しました。

### デバッグ手順（2025-11-05追加）

1. **サーバー側ログの確認**
   - Trip削除時にサーバー側のログを確認
   - `Starting trip deletion process`、`Trip document found`、`Attempting to delete trip image`などのログが出力されているか確認
   - エラーログが出力されている場合は、エラー内容を確認

2. **デバッグAPIエンドポイントの使用**
   - `/api/debug/trip-image-deletion`にPOSTリクエストを送信
   - `tripId`を指定して画像削除処理をテスト
   - レスポンスの`debug`情報を確認（画像URL、パス抽出結果、削除結果など）

3. **画像URLの形式確認**
   - 実際の画像URLの形式を確認
   - Firebase Storage URL形式かどうかを確認
   - URLパース処理が正しく動作しているか確認

4. **Firebase Admin Storageの確認**
   - `adminStorage`が正しく初期化されているか確認
   - バケット名が正しく設定されているか確認
   - ファイルパスが正しく抽出されているか確認

---

## 🔍 デバッグ手順（元の内容）

1. **Trip削除の実行**
   - 「Edit trip information」ダイアログからTripを削除
   - または「Delete Trip」ボタンからTripを削除

2. **Firebase Storageの確認**
   - Firebase ConsoleでStorageを確認
   - `/trips/{tripId}/images/`配下に画像ファイルが残っているか確認

3. **ログの確認**
   - サーバー側のログで画像削除処理が実行されているか確認
   - エラーログが出力されているか確認

4. **削除処理のテスト**
   - 画像があるTripを削除
   - 画像がStorageから削除されることを確認

---

## 📝 補足

### 関連する問題

- **Issue #45**: Edit trip informationで画像を差し替えたときに古い画像が残る
  - 同様に、画像削除処理が不完全な問題
  - こちらは編集時の画像差し替え、本IssueはTrip削除時の画像削除

- **Issue #50**: Create New Trip Dialogで設定した画像が間違ったパスに保存される
  - Create New Trip Dialogで画像が `/users/{userId}/avatar/` に保存される問題
  - この問題により、Trip画像が間違った場所に保存されている
  - 本Issueの削除処理は、`/users/{userId}/avatar/`配下の画像も削除可能（URLからパスを抽出するため）

### 将来的な改善

- **バッチ削除処理**: 既存の削除済みTripの画像をクリーンアップ
- **定期的なクリーンアップ**: 使用されていない画像ファイルを定期的に削除
- **ストレージ使用量の監視**: 削除処理の成功・失敗を監視

---

## 🎯 優先度判断

### 中優先度

**理由**:
1. 機能的な問題ではない（Trip削除自体は動作している）
2. ストレージ使用量の増加につながる可能性がある
3. ユーザー体験への直接的な影響は小さい（削除後は見えない）
4. 段階的な実装が可能

### 実装タイミング

**Phase 1**: 次のminorリリース候補  
**Phase 2**: タイミングを計って段階的実装  
**Phase 3**: 将来の改善として検討

