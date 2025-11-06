## CodeRabbit提案の実装完了

CodeRabbitの提案に基づいて、以下の改善を実装しました。

### ✅ 実装内容

#### 1. エラーコードの標準化

**新規ファイル**: `lib/storage/storage-error-codes.ts`
- `StorageErrorCode` enumを定義（12種類のエラーコード）
- `normalizeStorageError()`関数: Firebase Storageエラーを標準化されたエラーコードに変換
- `getStorageErrorI18nKey()`関数: エラーコードをi18nキーにマッピング

**改善点**:
- 文字列マッチング（`error.message.includes('storage/unauthorized')`）からenumベースの処理に移行
- 型安全性の向上
- 既存の`ApiErrorCode`パターンと一貫性を保持

#### 2. 認証トークンのリトライロジック

**実装**: `getAuthTokenWithRetry()`関数
- 500msバックオフ付きで1回のリトライ
- 最初の試行が失敗した場合、500ms待機後に強制リフレッシュで再試行
- すべての認証トークン取得処理に適用

**改善点**:
- 一時的なネットワークエラーに対する堅牢性向上
- 認証トークンの取得がより確実に

#### 3. エラーハンドリングのリファクタリング

**変更ファイル**:
- `lib/storage/image-upload.ts`: エラー処理を標準化されたエラーコードに変更
- `components/ui/ImageUpload.tsx`: エラーコードを識別してi18nキーにマッピング

**改善点**:
- エラーコードとi18nキーの対応が明確に
- UI側でエラーコードを識別可能
- 保守性の向上

### 📝 主な変更点

#### Before（文字列マッチング）
```typescript
if (error.message.includes('storage/unauthorized')) {
  throw new Error(t('imageUpload.error.auth', language))
}
```

#### After（標準化されたエラーコード）
```typescript
const errorCode = normalizeStorageError(error)
const i18nKey = getStorageErrorI18nKey(errorCode)
throw new Error(t(i18nKey, language))
```

#### Before（リトライなし）
```typescript
const token = await currentUser.getIdToken(true)
```

#### After（リトライ付き）
```typescript
const token = await getAuthTokenWithRetry(true)
```

### 🔗 関連コミット

- `65e639b`: refactor: CodeRabbit提案に基づくエラーコード標準化と認証リトライロジック

### ✅ 期待される効果

1. **型安全性の向上**: エラーコードがenumで定義されるため、型チェックが効く
2. **保守性の向上**: エラーコードとi18nキーの対応が明確
3. **堅牢性の向上**: 認証トークンの取得がリトライでより堅牢
4. **一貫性の向上**: 既存の`ApiErrorCode`パターンと一貫性がある

### 🧪 テスト推奨事項

- [ ] 認証エラー時の動作確認
- [ ] ストレージクォータ超過時の動作確認
- [ ] リトライロジックの動作確認（ネットワークエラー時のシミュレーション）
- [ ] エラーメッセージのi18n表示確認

