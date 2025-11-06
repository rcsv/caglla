# CodeRabbit提案の実装方針

**作成日**: 2025-01-XX  
**関連Issue**: #43 (Trip Imageアップロード時の認証エラーとi18n問題)  
**提案元**: CodeRabbit AI

---

## 📋 提案内容の概要

CodeRabbitの提案は、以下の3つの改善を推奨しています：

1. **エラーコードの標準化**: 文字列マッチングから標準化されたエラーコードへ
2. **認証トークンのリトライロジック**: `getAuthTokenWithRetry()`の実装
3. **エラーコードとi18nキーのマッピング**: 明確なマッピング関数の実装

---

## 🔍 現在の実装の問題点

### 1. エラー処理の問題
```typescript
// 現在: 文字列マッチング（脆弱）
if (error.message.includes('storage/unauthorized')) {
  throw new Error(t('imageUpload.error.auth', language))
}
```

**問題点**:
- エラーメッセージの文字列が変更されると動作しない
- エラーの種類を明確に識別できない
- 型安全性がない

### 2. 認証トークン取得の問題
```typescript
// 現在: リトライなし
const token = await currentUser.getIdToken(true) // forceRefresh: true
```

**問題点**:
- 一時的なネットワークエラーで失敗する可能性
- リトライロジックがない

### 3. エラーハンドリングの分散
- エラーコードとi18nキーの対応が散在している
- UI側でエラーコードを判別できない

---

## 💡 実装方針

### Phase 1: エラーコードの標準化

#### 1.1 ストレージエラーコードのenum定義

**ファイル**: `lib/storage/storage-error-codes.ts` (新規作成)

```typescript
/**
 * Firebase Storage エラーコード
 * CodeRabbit提案に基づく標準化されたエラーコード
 */
export enum StorageErrorCode {
  STORAGE_UNAUTHORIZED = 'STORAGE_UNAUTHORIZED',
  STORAGE_QUOTA_EXCEEDED = 'STORAGE_QUOTA_EXCEEDED',
  STORAGE_CANCELED = 'STORAGE_CANCELED',
  STORAGE_INVALID_FORMAT = 'STORAGE_INVALID_FORMAT',
  STORAGE_OBJECT_NOT_FOUND = 'STORAGE_OBJECT_NOT_FOUND',
  STORAGE_UPLOAD_FAILED = 'STORAGE_UPLOAD_FAILED',
  STORAGE_UNKNOWN = 'STORAGE_UNKNOWN',
  STORAGE_INVALID_ARGUMENT = 'STORAGE_INVALID_ARGUMENT',
  STORAGE_INVALID_CHECKSUM = 'STORAGE_INVALID_CHECKSUM',
  STORAGE_INVALID_NAME = 'STORAGE_INVALID_NAME',
  STORAGE_PROJECT_NOT_FOUND = 'STORAGE_PROJECT_NOT_FOUND',
  STORAGE_UNAUTHENTICATED = 'STORAGE_UNAUTHENTICATED',
}

/**
 * Firebase Storageエラーを標準化されたエラーコードに変換
 */
export function normalizeStorageError(error: Error): StorageErrorCode {
  const message = error.message.toLowerCase()
  
  if (message.includes('storage/unauthorized')) {
    return StorageErrorCode.STORAGE_UNAUTHORIZED
  }
  if (message.includes('storage/quota-exceeded')) {
    return StorageErrorCode.STORAGE_QUOTA_EXCEEDED
  }
  if (message.includes('storage/canceled')) {
    return StorageErrorCode.STORAGE_CANCELED
  }
  if (message.includes('storage/invalid-format')) {
    return StorageErrorCode.STORAGE_INVALID_FORMAT
  }
  if (message.includes('storage/object-not-found')) {
    return StorageErrorCode.STORAGE_OBJECT_NOT_FOUND
  }
  if (message.includes('storage/unauthenticated')) {
    return StorageErrorCode.STORAGE_UNAUTHENTICATED
  }
  // ... その他のエラーコード
  
  return StorageErrorCode.STORAGE_UNKNOWN
}
```

#### 1.2 エラーコードとi18nキーのマッピング

**ファイル**: `lib/storage/storage-error-codes.ts` (続き)

```typescript
import { TranslationKey } from '@/lib/i18n'
import { StorageErrorCode } from './storage-error-codes'

/**
 * ストレージエラーコードをi18nキーにマッピング
 */
export function getStorageErrorI18nKey(errorCode: StorageErrorCode): TranslationKey {
  const mapping: Record<StorageErrorCode, TranslationKey> = {
    [StorageErrorCode.STORAGE_UNAUTHORIZED]: 'imageUpload.error.auth',
    [StorageErrorCode.STORAGE_QUOTA_EXCEEDED]: 'imageUpload.error.quotaExceeded',
    [StorageErrorCode.STORAGE_CANCELED]: 'imageUpload.error.canceled',
    [StorageErrorCode.STORAGE_INVALID_FORMAT]: 'imageUpload.error.invalidFormat',
    [StorageErrorCode.STORAGE_OBJECT_NOT_FOUND]: 'imageUpload.error.objectNotFound',
    [StorageErrorCode.STORAGE_UPLOAD_FAILED]: 'imageUpload.error.uploadFailed',
    [StorageErrorCode.STORAGE_UNKNOWN]: 'imageUpload.error.unknown',
    [StorageErrorCode.STORAGE_INVALID_ARGUMENT]: 'imageUpload.error.invalidArgument',
    [StorageErrorCode.STORAGE_INVALID_CHECKSUM]: 'imageUpload.error.invalidChecksum',
    [StorageErrorCode.STORAGE_INVALID_NAME]: 'imageUpload.error.invalidName',
    [StorageErrorCode.STORAGE_PROJECT_NOT_FOUND]: 'imageUpload.error.projectNotFound',
    [StorageErrorCode.STORAGE_UNAUTHENTICATED]: 'imageUpload.error.unauthenticated',
  }
  
  return mapping[errorCode] || 'imageUpload.error.unknown'
}
```

---

### Phase 2: 認証トークンのリトライロジック

#### 2.1 `getAuthTokenWithRetry()`の実装

**ファイル**: `lib/storage/image-upload.ts`

```typescript
/**
 * 認証トークンを取得（リトライ付き）
 * CodeRabbit提案: 500msバックオフ付き1回のリトライ
 * 
 * @param forceRefresh - トークンを強制的にリフレッシュするか
 * @returns Firebase IDトークン
 * @throws Error 認証に失敗した場合
 */
async function getAuthTokenWithRetry(forceRefresh: boolean = true): Promise<string> {
  const { auth } = await import('@/lib/firebase/client')
  const user = auth.currentUser
  
  if (!user) {
    throw new Error('User not authenticated')
  }
  
  try {
    // 最初の試行
    return await user.getIdToken(forceRefresh)
  } catch (error) {
    logger.warn('First attempt to get auth token failed, retrying...', error)
    
    // 500ms待機してからリトライ
    await new Promise(resolve => setTimeout(resolve, 500))
    
    try {
      // リトライ（強制リフレッシュ）
      return await user.getIdToken(true)
    } catch (retryError) {
      logger.error('Failed to get auth token after retry:', retryError)
      throw new Error('Failed to get authentication token after retry')
    }
  }
}
```

---

### Phase 3: 既存コードのリファクタリング

#### 3.1 `lib/storage/image-upload.ts`の更新

**変更点**:
1. `getAuthToken()`を`getAuthTokenWithRetry()`に置き換え
2. エラー処理を標準化されたエラーコードに変更
3. `normalizeStorageError()`と`getStorageErrorI18nKey()`を使用

```typescript
// Before
async function getAuthToken(): Promise<string> {
  const { auth } = await import('@/lib/firebase/client')
  const user = auth.currentUser
  if (!user) throw new Error('User not authenticated')
  return await user.getIdToken()
}

// After
async function getAuthToken(): Promise<string> {
  return await getAuthTokenWithRetry(true)
}
```

```typescript
// Before
catch (error) {
  if (error.message.includes('storage/unauthorized')) {
    throw new Error(`${t('imageUpload.error.auth', language)}: ${t('imageUpload.error.auth.description', language)}`)
  }
  // ...
}

// After
catch (error) {
  const errorCode = normalizeStorageError(error instanceof Error ? error : new Error(String(error)))
  const i18nKey = getStorageErrorI18nKey(errorCode)
  const language = getUserLanguage()
  throw new Error(t(i18nKey, language))
}
```

#### 3.2 `components/ui/ImageUpload.tsx`の更新

**変更点**:
1. エラーコードを識別してi18nキーにマッピング
2. エラーメッセージの表示を改善

```typescript
// Before
catch (error) {
  const errorMsg = error instanceof Error ? error.message : t('imageUpload.unknownError')
  setError(t('imageUpload.uploadFailed').replace('{error}', errorMsg))
}

// After
catch (error) {
  if (error instanceof Error) {
    // エラーコードを抽出（エラーメッセージから）
    const errorCode = normalizeStorageError(error)
    const i18nKey = getStorageErrorI18nKey(errorCode)
    setError(t(i18nKey))
  } else {
    setError(t('imageUpload.error.unknown'))
  }
}
```

---

## 📝 実装手順

### Step 1: エラーコード定義ファイルの作成
- [ ] `lib/storage/storage-error-codes.ts`を作成
- [ ] `StorageErrorCode` enumを定義
- [ ] `normalizeStorageError()`関数を実装
- [ ] `getStorageErrorI18nKey()`関数を実装

### Step 2: 認証トークンリトライロジックの実装
- [ ] `getAuthTokenWithRetry()`関数を実装
- [ ] `lib/storage/image-upload.ts`の`getAuthToken()`を更新

### Step 3: エラーハンドリングのリファクタリング
- [ ] `lib/storage/image-upload.ts`のエラー処理を更新
- [ ] `checkStorageQuota()`のエラー処理を更新
- [ ] `updateStorageUsage()`のエラー処理を更新

### Step 4: UI側のエラーハンドリング更新
- [ ] `components/ui/ImageUpload.tsx`のエラー処理を更新
- [ ] エラーコードの識別とi18nキーのマッピングを実装

### Step 5: テストと検証
- [ ] エラーコードのマッピングが正しいか確認
- [ ] リトライロジックが正しく動作するか確認
- [ ] i18nメッセージが正しく表示されるか確認

---

## ✅ 期待される効果

1. **型安全性の向上**: エラーコードがenumで定義されるため、型チェックが効く
2. **保守性の向上**: エラーコードとi18nキーの対応が明確
3. **堅牢性の向上**: 認証トークンの取得がリトライでより堅牢
4. **一貫性の向上**: 既存の`ApiErrorCode`パターンと一貫性がある

---

## 🔄 既存実装との互換性

- 既存のi18nキーはそのまま使用可能
- エラーメッセージの表示は変更なし（ユーザー視点）
- 既存のAPIとの互換性を維持

---

## 📚 参考

- CodeRabbit提案の元のコメント
- `lib/core/error-handler.ts`の`ApiErrorCode`パターン
- 既存のi18nキー定義: `lib/i18n/index.ts`

