# Firestore統合テスト実行ガイド

## 📋 概要

Firestoreエミュレータを使用した統合テストの実行方法とベストプラクティスを説明します。

## 🚀 実行方法

### 1. エミュレータの起動

```bash
# 別のターミナルで実行
pnpm emulators:start:firestore
```

エミュレータが起動すると、以下のメッセージが表示されます：

```
✔  All emulators ready! It is now safe to connect your app.
   View Emulator UI at http://127.0.0.1:4000/
   Firestore │ 127.0.0.1:8080
```

### 2. テストの実行

エミュレータが起動している状態で、別のターミナルで以下を実行：

```bash
# すべてのFirestoreテストを実行
pnpm test:firestore

# 特定のテストファイルのみ実行
pnpm test:firestore -- trip-likes

# ウォッチモードで実行（開発時におすすめ）
pnpm test:firestore -- --watch
```

## 📝 テスト対象

Firestore統合テストは以下のファイルを対象とします：

- `**/*firestore*.test.[jt]s?(x)` - Firestoreエミュレータを使用するテスト
- `**/*backfill-social-stats-integration*.test.[jt]s?(x)` - バックフィルスクリプトの統合テスト
- `firestore.rules.test.ts` - セキュリティルールのテスト

## 🔄 開発フローでの使い分け

### 通常の開発時

```bash
# 通常のテスト（Firestoreテストは除外される）
pnpm test

# 必要に応じてFirestoreテストを手動実行
pnpm test:firestore
```

### Firestore関連の変更時

以下の場合は必ず`pnpm test:firestore`を実行してください：

1. **API Routesの実装・変更**
   - Social Operations（いいね、コメント、フォロー）の実装
   - Firestore操作を含むAPI Routes

2. **セキュリティルールの変更**
   - `firestore.rules`の更新後
   - 新しいコレクションのルール追加

3. **Firestore操作関数の実装・変更**
   - `lib/social/*`の実装
   - `lib/firebase/admin-operation.ts`の変更

4. **バックフィルスクリプトの実装**
   - `scripts/backfill-*.ts`の実装
   - データ移行スクリプト

### コミット前

```bash
# すべてのテストを実行（Firestoreテストも含む）
pnpm test && pnpm test:firestore
```

## 🔍 テストの確認

### エミュレータUIでの確認

エミュレータ起動中、以下のURLでデータを確認できます：

- **エミュレータUI**: http://127.0.0.1:4000/
- **Firestore**: http://127.0.0.1:4000/firestore

### テスト結果の確認

```bash
# 詳細なログを表示
pnpm test:firestore -- --verbose

# カバレッジレポートを生成
pnpm test:firestore -- --coverage
```

## ⚠️ 注意事項

1. **エミュレータの起動が必要**
   - `pnpm test:firestore`を実行する前に、必ずエミュレータを起動してください
   - エミュレータが起動していない場合、テストは失敗します

2. **通常のテストとは分離**
   - `pnpm test`ではFirestoreテストは実行されません
   - Firestoreテストは`pnpm test:firestore`でのみ実行されます

3. **環境変数**
   - テスト実行時、`FIRESTORE_EMULATOR_HOST=localhost:8080`が自動的に設定されます
   - 本番環境のFirestoreには影響しません

## 🔧 CI/CDでの自動実行

CI/CDパイプラインでは、エミュレータを自動起動してテストを実行します：

```yaml
# .github/workflows/test.yml (例)
- name: Start Firestore Emulator
  run: pnpm emulators:start:firestore &
  
- name: Wait for Emulator
  run: sleep 10
  
- name: Run Firestore Tests
  run: pnpm test:firestore
```

## 📚 関連ドキュメント

- [Emulator Integration Testing Guide](./emulator-integration-testing.md)
- [v3.0.0 Implementation Order](../planning/v3-implementation-order.md)

