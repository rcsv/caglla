# Trip PDF Generation Regression

- **Priority**: P1（有料機能の利用不能）
- **URL**: `/api/trips/[tripSlug]/pdf`
- **Component**: `app/api/trips/[tripSlug]/pdf/route.ts`, `lib/utils/magazine-pdf-template.ts`, Firebase Admin
- **Epic**: Export / Reporting

## ステータス

- ❌ 未解決（2025-11-11）
- ログ上は SelectPdf API 呼び出しで 503 または 401 が発生しており、PDFが返却されない。

## 現象

バックパッカープラン以上のユーザーが PDF エクスポートを実行しても、レスポンスがエラー（503/500）となりファイルが生成・ダウンロードできない。

## 再現手順

1. Backpacker 以上のプランを持つユーザーとして `/[userSlug]/[tripSlug]` を開く。
2. 右上メニュー（Extra Controls） > `Export PDF` を選択。
3. API `GET /api/trips/{tripSlug}/pdf` が 5xx または 4xx を返却し、ブラウザ側でもダウンロード処理が失敗する。
4. サーバーログには `SelectPdf API error`, `SELECTPDF_API_KEY is not configured` 等のメッセージが出力される。

## 期待結果

- 認証済みかつプラン条件を満たすユーザーが PDF を要求すると、SelectPdf API へ正常にリクエストされ、生成済みの PDF ファイルがダウンロードされる。
- エラー時もユーザーフィードバック（toast / ダイアログ）が明示される。

## 実際の結果

- `NextResponse.json({ error: 'PDF export is not available' }, { status: 503 })` が返却される、または SelectPdf 側の 401/403 がそのまま伝播して失敗。
- `SELECTPDF_API_KEY` が未定義 or 期限切れ。または SelectPdf API の仕様変更により既存パラメータが拒否されている。
- ローカル開発では Node v18 の fetch → SelectPdf への outbound call で CORS / TLS エラーが発生するケースもある。

## 原因仮説

- `.env` / Secret Manager に `SELECTPDF_API_KEY` が設定されていない。
- SelectPdf API のバージョン変更で `https://selectpdf.com/api2/convert/` が 410/403 を返している。
- サービスアカウントの権限不足により Firestore から trip 情報取得時にエラーが発生し、HTML が生成されない。
- `generateMagazinePdfHtml` で参照している画像 URL（Cloud Storage）の公開設定が不十分で、SelectPdf から参照できずエラーになっている。

## 受け入れ基準

- [ ] Secret Manager / .env に `SELECTPDF_API_KEY` が設定され、`pdf/route.ts` で参照できる。
- [ ] APIレスポンスが 200 のとき、ブラウザで PDF がダウンロードされる。
- [ ] SelectPdf API のレスポンスコードごとにユーザー向けエラーメッセージが整備される（401/403: 認証失敗、402: プラン上限など）。
- [ ] APIが 5xx を返す場合、ログに requestId・payload サマリが残り、観測しやすい。
- [ ] 料金プランガードが有効（Season Traveler プランでは 403 + ガイダンス）。

## 解決方針（案）

1. **環境変数の整備**：  
   - `lib/core/env-validation.ts` に `SELECTPDF_API_KEY` を追加し必須チェック。
   - App Hosting / Vercel / Secret Manager で値を設定。
2. **API ハンドリング強化**：  
   - `callSelectPdfApi` のレスポンスステータスごとにエラー分類。
   - セルフホステッド HTML 生成が重い場合はテンプレートを軽量化。
3. **代替サービスの検証**：  
   - SelectPdf のコスト/信頼性が低い場合、Puppeteer など別 PDF ソリューションを比較。
4. **UX 改善**：  
   - ダウンロード開始までの待機中にローディング表示＋キャンセル導線を設置。
   - エラー時は `alert()` ではなく toast/モーダルでメッセージ表示。

## アクセシビリティ

- エラー通知はスクリーンリーダーでも把握できるよう `aria-live` を使用。
- ダウンロードボタンは `disabled` 状態＋ローディングインジケーターを付与する。

## メモ

- 証跡目的で API 呼び出しログ（ユーザーID、tripId、レスポンスステータス）を Firestore か Cloud Logging に残すと調査が容易。  
- Serif フォント利用や多言語 PDF への拡張も要件として挙がっているため、テンプレート生成を関数化しておくと便利。

