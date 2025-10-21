# PDF Export Feature (SelectPdf API)

## 📄 概要

SelectPdf REST APIを使用して、トリップ旅程をPDF形式でエクスポートする機能です。
サーバーサイドでHTMLをPDFに変換し、高品質なPDF出力を実現します。

**実装日**: 2025-10-21
**プラン制限**: Backpacker以上

---

## 🎯 機能

### 基本機能
- ✅ **トリップ旅程のPDF出力**: 全日程・全旅程アイテムを含むPDFを生成
- ✅ **高品質なPDF**: SelectPdf APIによるプロフェッショナルな出力
- ✅ **美しいフォーマット**: 日付・時刻・場所情報を整理して表示
- ✅ **プラン制限**: Backpacker以上のプランでのみ利用可能
- ✅ **セキュア**: APIキーをクライアントに露出しない

### PDF内容
- **ヘッダー**: トリップ名、日付範囲、目的地
- **日程セクション**: 各日の旅程アイテム（時刻、名前、メモ、住所）
- **フッター**: 生成日時、アプリケーション名

---

## 🏗️ アーキテクチャ

### 1. API エンドポイント

#### `GET /api/trips/[tripId]/pdf`

**認証**: Bearer token required  
**認可**: Trip owner only  
**プラン制限**: Backpacker以上

**処理フロー**:
1. Bearer tokenの検証
2. ユーザーのプラン確認（Backpacker以上）
3. トリップの所有権確認
4. トリップデータ取得（days, itineraries）
5. HTMLテンプレート生成
6. SelectPdf APIへのリクエスト
7. PDF返却（Content-Disposition: attachment）

**レスポンス**:
- `200 OK`: PDF binary
- `401 Unauthorized`: 認証エラー
- `403 Forbidden`: 権限エラー / プラン制限
- `404 Not Found`: トリップが見つからない
- `503 Service Unavailable`: SelectPdf API未設定

---

### 2. SelectPdf API Integration

**エンドポイント**: `https://selectpdf.com/api2/convert/`

**リクエスト形式**:
```json
{
  "key": "SELECTPDF_API_KEY",
  "html": "<html>...</html>",
  "base_url": "https://your-domain.com"
}
```

**パラメータ**:
- `key`: SelectPdf APIキー（環境変数 `SELECTPDF_API_KEY`）
- `html`: 変換対象のHTML文字列
- `base_url`: 相対パスの解決用ベースURL

**エラーハンドリング**:
- `200`: PDF生成成功
- `400`: パラメータエラー
- `401`: ライセンスエラー（APIキー無効）
- `499`: 変換エラー（カスタム）

**制限事項**:
- 同時リクエスト数: プランに依存
- レート制限: SelectPdfプランに依存
- Usage API: `https://selectpdf.com/api2/usage/`で確認可能

---

### 3. HTMLテンプレート生成

**スタイリング**:
- フォント: Helvetica Neue, Hiragino Kaku Gothic ProN
- カラー: ブルー系（#2563eb, #1e40af）
- レイアウト: ボックスモデル、ボーダー、シャドウ
- ページブレーク: `page-break-inside: avoid`

**コンテンツ構造**:
```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>[Trip Name] - 旅程表</title>
  <style>...</style>
</head>
<body>
  <div class="header">...</div>
  <div class="day-section">...</div>
  ...
  <div class="footer">...</div>
</body>
</html>
```

---

### 4. クライアントサイド実装

**ヘルパー関数**: `lib/utils/export-helpers.ts`

#### `exportTripToPdf(tripId, token, onProgress)`
```typescript
export async function exportTripToPdf(
  tripId: string,
  token: string,
  onProgress?: (message: string) => void
): Promise<void>
```

**処理フロー**:
1. `/api/trips/${tripId}/pdf` にGETリクエスト
2. Bearer tokenを送信
3. レスポンスをBlobとして取得
4. Content-Dispositionからファイル名を抽出
5. Blob URLを生成してダウンロード

**エラーハンドリング**:
- `403`: プラン制限エラー → アップグレード促進
- `401`: 認証エラー → 再ログイン促進
- `404`: トリップが見つからない
- `503`: PDFサービス未設定

#### `canExportToPdf(userPlan)`
```typescript
export function canExportToPdf(userPlan: string): boolean
```

プラン制限チェック:
- `season_traveler`: ❌ 利用不可
- `backpacker`: ✅ 利用可能
- `globetrotter`: ✅ 利用可能

---

### 5. UI Integration

**PDF出力ボタン**: `app/[userSlug]/[tripSlug]/page.tsx`

```tsx
<button
  onClick={handlePdfExport}
  disabled={pdfExporting || !canExportToPdf(userPlan)}
  className={...}
  title={
    canExportToPdf(userPlan)
      ? 'PDF出力'
      : 'PDF出力（Backpackerプラン以上）'
  }
>
  {pdfExporting ? (
    <>
      <Icon icon="mdi:loading" className="w-5 h-5 animate-spin" />
      <span className="hidden sm:inline">処理中...</span>
    </>
  ) : (
    <>
      <Icon icon="mdi:file-pdf-box" className="w-5 h-5" />
      <span className="hidden sm:inline">PDF</span>
    </>
  )}
</button>
```

**状態管理**:
- `pdfExporting`: PDF生成中フラグ
- `userPlan`: ユーザーのプラン（subscription context）

---

## 🔐 セキュリティ

### APIキー管理
- ❌ **クライアントに露出しない**: `SELECTPDF_API_KEY`はサーバーサイドのみ
- ✅ **環境変数**: `.env.local`で管理
- ✅ **検証**: `lib/core/env-validation.ts`でオプション環境変数として定義

### 認証・認可
- ✅ **Bearer token認証**: Firebase Auth IDトークン
- ✅ **所有権確認**: トリップのuserIdとリクエスト元ユーザーの一致確認
- ✅ **プラン制限**: Backpacker以上のプランのみ許可

---

## 📊 使用例

### 基本的な使用方法

1. **トリップページを開く**
   - `/[userSlug]/[tripSlug]`

2. **PDFボタンをクリック**
   - FloatingTitleBarの「PDF」ボタン
   - Backpacker以上のプランでのみ有効

3. **PDF生成**
   - サーバーサイドでHTML生成
   - SelectPdf APIでPDF変換
   - ブラウザでダウンロード

### プラン制限の動作

**Season Traveler（無料プラン）**:
- ボタンが無効化（グレーアウト）
- ツールチップ: "PDF出力（Backpackerプラン以上）"
- クリック時: アラート表示 → アップグレード促進

**Backpacker / Globetrotter**:
- ボタンが有効
- ツールチップ: "PDF出力"
- クリック時: PDF生成 → ダウンロード

---

## 🧪 テスト

### 手動テスト項目

1. ✅ **認証テスト**
   - 未ログイン → 401エラー
   - 他人のトリップ → 403エラー

2. ✅ **プラン制限テスト**
   - Season Traveler → 403エラー（Upgrade Required）
   - Backpacker → PDF生成成功
   - Globetrotter → PDF生成成功

3. ✅ **PDF内容テスト**
   - トリップ名が正しく表示
   - 日付範囲が正しく表示
   - 全日程が含まれている
   - 旅程アイテムの情報が正しい（時刻、名前、メモ、住所）

4. ✅ **エラーハンドリングテスト**
   - SelectPdf APIキー未設定 → 503エラー
   - SelectPdf API エラー → エラーメッセージ表示

---

## 📝 環境変数

### 必須環境変数

```bash
# SelectPdf API Key (Optional - PDF export feature)
SELECTPDF_API_KEY=your_selectpdf_api_key_here
```

**設定ファイル**:
- `env.example`: サンプル設定
- `.env.local`: 実際の設定（gitignore済み）

**検証**:
- `lib/core/types/env.ts`: `OptionalEnvVars`に定義
- API実行時にチェック（未設定 → 503エラー）

---

## 🚀 今後の改善案

### Phase 2（将来的な拡張）

1. **カスタマイズオプション**
   - ページサイズ選択（A4, Letter, etc.）
   - 余白設定
   - ヘッダー/フッターのカスタマイズ
   - 要素の表示/非表示切り替え

2. **高度な機能**
   - 地図のスナップショット埋め込み
   - 予約情報の統合（ReservationInfo）
   - 写真ギャラリー（trip.image_url, itinerary.photos）
   - QRコード生成（トリップURL）

3. **パフォーマンス最適化**
   - PDF生成キャッシュ（ETag対応）
   - ジョブキュー（同時実行制限対応）
   - S3アップロード → 署名付きURL配布

4. **UI/UX改善**
   - プレビュー機能
   - 進捗インジケーター（より詳細）
   - 生成履歴の保存

---

## 📚 参考リンク

- [SelectPdf HTML To PDF API](https://selectpdf.com/html-to-pdf-api/)
- [SelectPdf REST API Documentation](https://selectpdf.com/docs/HtmlToPdfRestApi.htm)
- [SelectPdf API Usage](https://selectpdf.com/api2/usage/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Firebase Authentication](https://firebase.google.com/docs/auth)

---

## ✅ 完了事項

- [x] SelectPdf API統合
- [x] PDF生成APIエンドポイント実装
- [x] HTMLテンプレート生成
- [x] クライアントサイドダウンロード処理
- [x] UI統合（PDFボタン）
- [x] プラン制限実装
- [x] 認証・認可実装
- [x] エラーハンドリング
- [x] 環境変数管理
- [x] ドキュメント作成

---

**Status**: ✅ 実装完了  
**Version**: v1.9.0 (予定)  
**License**: SelectPdf API（月額3,000円ライセンス保有）

