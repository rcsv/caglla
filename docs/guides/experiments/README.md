# 実験用HTMLファイル

このディレクトリには、開発時に使用した実験用のHTMLファイルが含まれています。

## 📋 ファイル一覧

### currency-test.html
- **用途**: 通貨推定機能の開発・テスト
- **実装箇所**: `lib/currency-utils.ts`
- **状態**: 実装完了（アーカイブ）

**機能**:
- Google Places APIから取得した場所データから通貨を推定
- 推定失敗時のログ収集とバッチ処理
- 都市名→国コード→通貨のマッピング検証

### timezone-test.html
- **用途**: タイムゾーン推定機能の開発・テスト
- **実装箇所**: `lib/timezone-utils.ts`
- **状態**: 実装完了（アーカイブ）

**機能**:
- Google Places APIから取得した場所データからタイムゾーンを推定
- 推定失敗時のログ収集とバッチ処理
- 都市名→タイムゾーンのマッピング検証

## 🎯 使用方法

これらのHTMLファイルは、ブラウザで直接開くことで動作します：

```bash
# ローカルサーバーで開く（推奨）
cd docs/guides/experiments
python3 -m http.server 8000

# ブラウザで開く
open http://localhost:8000/currency-test.html
open http://localhost:8000/timezone-test.html
```

## 📝 開発の経緯

これらの実験ツールは、以下の開発プロセスで使用されました：

1. **初期実装**: 基本的なマッピングロジックの検証
2. **ログ収集**: 本番環境での推定失敗ケースを収集
3. **バッチ処理**: 収集したログからマッピングを自動更新
4. **本番実装**: 検証済みのロジックを`lib/`配下に実装

## 🔗 関連ファイル

- [lib/currency-utils.ts](../../../lib/utils/currency-utils.ts) - 通貨推定の実装
- [lib/timezone-utils.ts](../../../lib/utils/timezone-utils.ts) - タイムゾーン推定の実装
- [console-migration-list.csv](../../development/console-migration-list.csv) - console.log移行管理リスト

## ⚠️ 注意事項

- これらのファイルはアーカイブ用です
- 本番環境では使用されません
- 機能追加・修正は`lib/`配下の実装ファイルで行ってください

