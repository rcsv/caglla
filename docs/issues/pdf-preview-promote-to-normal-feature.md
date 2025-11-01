# Issue: PDF Preview機能をDevToolsから通常機能に昇格

**作成日**: 2025-11-01  
**状態**: 🔴 未解決  
**優先度**: 中  
**種類**: 機能改善  
**関連ファイル**: 
- `app/dev-tools/pdf-preview/[tripSlug]/page.tsx`（現在のPDF Previewページ）
- `app/[userSlug]/[tripSlug]/page.tsx`（旅行ページ、PDF Previewへのアクセス）
- `app/api/trips/[tripSlug]/preview/route.ts`（プレビューAPI）
- `docs/features/pdf-preview.md`（機能ドキュメント）

---

## 📋 概要

PDF Preview機能が現在DevTools（開発者ツール）に配置されているが、これは実際には一般的なユーザーにとって有用な機能であるため、通常の機能として昇格させたい。DevToolsに配置されていることで、ユーザーがこの機能にアクセスしにくくなっている。

---

## 🐛 現在の問題

### 現状の配置

1. **PDF Previewページの場所**
   - 現在: `/dev-tools/pdf-preview/[tripSlug]`
   - DevToolsディレクトリに配置されている
   - 開発者向けツールという位置づけ

2. **アクセス方法**
   - 旅行ページ（`/[userSlug]/[tripSlug]/page.tsx`）のメニューから「PDF Preview」を選択
   - `handlePdfPreview()`関数でDevToolsページに遷移（156行目）
   - 新規タブで`/dev-tools/pdf-preview/${tripSlug}`を開く

3. **ユーザー体験の問題**
   - DevToolsという名前から、開発者向け機能と誤解される可能性
   - 通常のユーザーがこの機能を見つけにくい
   - URLパスが`/dev-tools/...`となっているため、通常の機能とは認識されにくい
   - 機能としては十分に完成しており、通常機能として提供できる品質

### 機能の実装状況

- ✅ **APIエンドポイント**: `/api/trips/[tripSlug]/preview`が実装済み
- ✅ **プレビューページ**: HTMLプレビュー機能が実装済み
- ✅ **認証・認可**: トリップ所有者のみアクセス可能
- ✅ **デザイン**: 旅行雑誌風の美しいレイアウト
- ⚠️ **i18n対応**: 一部日本語ハードコード（要対応）
- ⚠️ **UI改善**: プレビューページのUI改善が必要

---

## 💡 解決方針

### Phase 1: ルートの移動とアクセス方法の変更

#### 1.1: PDF Previewページの移動

**現在の場所:**
```
app/dev-tools/pdf-preview/[tripSlug]/page.tsx
```

**新しい場所（オプション）:**
- **オプションA**: `/app/[userSlug]/[tripSlug]/preview/page.tsx`
  - 旅行ページのサブページとして配置
  - URL: `/[userSlug]/[tripSlug]/preview`
  - 旅行コンテキストを維持

- **オプションB**: `/app/preview/[tripSlug]/page.tsx`
  - 独立したページとして配置
  - URL: `/preview/[tripSlug]`
  - シンプルな構造

- **オプションC**: `/app/api/trips/[tripSlug]/preview/page.tsx`（APIルートとして維持）
  - 現在のAPIエンドポイントをそのまま使用
  - ページコンポーネントを別途実装

**推奨**: オプションA（旅行ページのサブページとして配置）

#### 1.2: アクセス方法の変更

**現在:**
```typescript
const handlePdfPreview = () => {
  if (!trip) return
  const previewUrl = `/dev-tools/pdf-preview/${trip.slug || trip.id}`
  window.open(previewUrl, '_blank')
}
```

**新しい実装:**
```typescript
const handlePdfPreview = () => {
  if (!trip) return
  const previewUrl = `/${userSlug}/${trip.slug || trip.id}/preview`
  router.push(previewUrl)
  // または新規タブで開く
  window.open(previewUrl, '_blank')
}
```

### Phase 2: UI改善とi18n化

#### 2.1: プレビューページのUI改善

- 現在のプレビューページは成功画面のみ表示
- プレビューを直接表示するUIに改善
- エラーハンドリングの改善

#### 2.2: i18n化

**現在の日本語ハードコード箇所:**
- 「プレビューが開かれました」
- 「新しいタブでPDFデザインのプレビューが表示されています」
- 「プレビューURL」
- 「プレビューを再表示」
- 「戻る」
- 「プレビューでは以下の機能が利用できます：」
- 「印刷プレビュー（PDF出力時の見た目確認）」
- 「リロード（最新データで更新）」
- 「閉じる（プレビューを閉じる）」
- 「ログインが必要です」
- 「プレビュー機能を使用するにはログインしてください」
- 「プレビューを読み込み中...」
- 「プレビューの読み込みに失敗しました」
- 「再試行」

**i18nキーの追加:**
- `pdfPreview.title`
- `pdfPreview.opened`
- `pdfPreview.description`
- `pdfPreview.url`
- `pdfPreview.reopen`
- `pdfPreview.back`
- `pdfPreview.features.title`
- `pdfPreview.features.print`
- `pdfPreview.features.reload`
- `pdfPreview.features.close`
- `pdfPreview.loginRequired`
- `pdfPreview.loginRequired.description`
- `pdfPreview.loading`
- `pdfPreview.error`
- `pdfPreview.retry`

### Phase 3: メニュー項目の改善

#### 3.1: メニュー項目のラベルとアイコン

**現在の実装:**
```typescript
{
  id: 'pdf-preview',
  label: 'PDF Preview',  // ハードコード
  icon: 'mdi:eye',
  onClick: handlePdfPreview,
}
```

**改善案:**
- ラベルをi18n化
- アイコンの検討（現在の`mdi:eye`で良いか、`mdi:file-pdf-box`などに変更するか）
- ツールチップの追加（機能説明）

### Phase 4: ドキュメントの更新

#### 4.1: 機能ドキュメントの更新

- `docs/features/pdf-preview.md`のアクセス方法を更新
- DevToolsからの移動を反映

---

## 🔗 関連ファイル

- `app/dev-tools/pdf-preview/[tripSlug]/page.tsx` - 現在のPDF Previewページ
- `app/[userSlug]/[tripSlug]/page.tsx` - 旅行ページ（メニュー項目とアクセス処理）
- `app/api/trips/[tripSlug]/preview/route.ts` - プレビューAPIエンドポイント
- `lib/utils/magazine-pdf-template.ts` - PDFテンプレート生成
- `docs/features/pdf-preview.md` - 機能ドキュメント

---

## ✅ 完了条件

- [ ] PDF PreviewページをDevToolsから通常のルートに移動
- [ ] 旅行ページからのアクセス処理を更新
- [ ] プレビューページのUIを改善（直接プレビューを表示）
- [ ] プレビューページの日本語ハードコードをi18n化
- [ ] メニュー項目のラベルをi18n化
- [ ] エラーハンドリングの改善
- [ ] ローディング状態の改善
- [ ] ドキュメントの更新
- [ ] DevToolsディレクトリからPDF Preview関連ファイルを削除（移動後）
- [ ] ビルドエラーがない
- [ ] ブラウザで動作確認済み（複数のトリップでテスト）

---

## 📝 実装時の注意事項

1. **後方互換性**
   - 既存のDevToolsのURL（`/dev-tools/pdf-preview/[tripSlug]`）にリダイレクトを設定するか検討
   - または、DevToolsページから新しいURLへのリンクを提供

2. **認証・認可の維持**
   - 現在の認証・認可ロジックを維持
   - トリップ所有者のみアクセス可能にする

3. **プラン制限**
   - 現在プレビューは無料で利用可能（PDFエクスポートはBackpacker以上が必要）
   - この制限を維持するか、変更するか検討

4. **UI/UXの改善**
   - プレビューを直接表示するUIにする
   - 現在の「プレビューが開かれました」画面は簡素化または削除
   - プレビュー内でリロード機能を提供

5. **i18n対応**
   - すべての日本語文字列をi18n化
   - 英語と日本語の翻訳を追加

6. **パフォーマンス**
   - プレビュー生成のパフォーマンスを確認
   - 必要に応じてキャッシュを検討

---

## 🔍 参考

- `docs/features/pdf-preview.md` - PDF Preview機能の詳細仕様
- `docs/features/pdf-export-feature.md` - PDFエクスポート機能の仕様（関連機能）

---

## 💡 拡張アイデア（将来）

1. **プレビュー内での編集**
   - プレビューを見ながらトリップデータを編集
   - リアルタイムでプレビューが更新される

2. **プレビュー履歴**
   - 過去のプレビューを保存・比較
   - デザイン変更の差分表示

3. **カスタムテンプレート**
   - ユーザーが独自のPDFテンプレートを選択できる
   - 複数のデザインテンプレートを提供

4. **プレビュー共有**
   - プレビューURLを他のユーザーと共有
   - 期限付きの共有リンク

5. **プレビューのPDF化（クライアントサイド）**
   - ブラウザの印刷機能を使用してPDF化
   - サーバーサイドのPDF生成コストを削減

