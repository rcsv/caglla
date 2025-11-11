# Itinerary Card Attachments (Receipts & PDFs)

- **Priority**: P1（機能改善・証憑管理の強化）
- **URL**: `/[userSlug]/[tripSlug]`
- **Component**: `components/trip/SortableItineraryCard.tsx`, `components/trip/ScheduleCard.tsx`, `lib/firebase/*`
- **Epic**: Trip data enrichment / evidence management

## ステータス

- 🔄 未着手（2025-11-11 時点）

## 現象 / ユースケース

各行程カード（Itinerary）に宿泊レシートや食事の領収書・PDFを添付したい。現在はアップロード導線も保存先も存在しないため、証憑を旅行データと紐付けられず、経費精算や振り返りが煩雑。

## 再現手順

1. `/[userSlug]/[tripSlug]` にアクセスし `Itinerary` タブを開く。
2. 任意の行程カードを開き、添付ファイルやメモを確認する。
3. 画像やPDFをアップロードする導線が存在しないことを確認。

## 期待結果

- 旅程カード単位で画像（JPEG/PNG/WebP）やPDFをアップロードし、行程に紐付けられる。
- 1ファイルあたり 10MB 以内、1行程最大 10 件（Trip 全体で 200MB 以内）などの容量・件数上限を設ける。
- Backpacker 以上のプラン利用者のみ添付機能を解放する（Season Traveler はアップグレード誘導）。
- 添付一覧でサムネイル（画像）またはアイコン（PDF）が表示され、クリックで閲覧・ダウンロードできる。
- モバイルでも直感的に操作できる UI（アイコン＋プレビュー）が提供される。

## 実際の結果

- `SortableItineraryCard` / `ScheduleCard` 内にファイル添付 UI が存在しない。
- Firestore / Storage に行程ごとの添付データを保持するスキーマが未定義。

## 原因仮説

- 行程モデル `Itinerary` にファイルメタデータを格納するフィールドが定義されていない。
- Firebase Storage との連携がユーザープロフィール画像以外に拡張されていない。
- モバイル UX を優先した結果、行程カードに余分な操作を置かない方針だった可能性。

## 受け入れ基準

- [ ] `Itinerary` ドキュメントに添付ファイルのメタ情報（fileId, fileName, size, type, storagePath, uploadedAt, uploaderId）が保存される。
- [ ] `/[userSlug]/[tripSlug]` の行程カードから 1 行程につき複数ファイルを登録/削除できる。
- [ ] Firebase Storage（`receipts/{tripId}/{itineraryId}/{fileId}` など）にファイルが保存され、Storage/Firestore ルールで「トリップオーナーのみ read/write」「共有閲覧時は read に限定」などが enforce される。
- [ ] 添付一覧でサムネイル（画像）またはアイコン（PDF）が表示され、クリックで閲覧・ダウンロードできる。
- [ ] モバイル幅でも UI が崩れない（横スクロール避ける）。
- [ ] ファイルサイズ／残り容量が UI で明示される（ゲージ or テキスト）。
- [ ] 添付削除は二段階確認（モーダル or Undo）で誤操作を防ぐ。
- [ ] 10MB を超えるファイルはバリデーションで弾くなど、ストレージコストを制御する。

## 解決方針（案）

1. **データモデリング**
   - Firestore: `itineraries/{id}/attachments/{attachmentId}` サブコレクション、または `attachments: Attachment[]` を `Itinerary` に追加。
   - Attachment モデル: `fileName`, `fileSize`, `contentType`, `storagePath`, `uploadedBy`, `uploadedAt`.
2. **アップロード処理**
   - Firebase Storage へアップロードする `useFirebaseUpload` のような共通フックを作成。
   - 重複ファイルチェック（同じ `fileName` + `size` の場合は上書き確認）。
   - 進捗表示＋エラーハンドリング（リトライ、キャンセル）対応。
3. **UI 実装**
   - 行程カードに「添付」アイコンボタンを追加し、クリックでモーダル／ドロップダウンからアップロード。
   - 添付一覧（リストorグリッド）をカード下部に表示。画像はプレビュー、PDF は `embed` またはダウンロードリンク。
   - 添付数が制限を超える場合はプランアップグレード／削除のダイアログを表示。
4. **プラン制限（任意）**
   - Backpacker 以上のみ利用可能等、 SubscriptionContext と連携して機能制限を検討。
5. **セキュリティ**
   - Firebase Storage / Firestore ルールで `trip.user_id === auth.uid` のみ CRUD を許可。共有閲覧ユーザーの read 権限設計も併記する。
6. **アクセシビリティ**
   - アップロードボタンは `<button>` で実装し、`aria-label="行程にファイルを添付"` を付与。
   - ファイル一覧はリスト構造で表示し、キーボードでも操作可能にする。
   - アップロード進行状況を `aria-live="polite"` で通知。
   - UI側でアップロード中は行程カード全体を `aria-busy` にして状態を伝える。
7. **メモ**
   - あとで入れておく: Cloud Functions でサムネイル生成（画像）、PDF からテキスト抽出の可能性。
   - あとで入れておく: 長期的には添付ファイルの一括エクスポート（ZIP/PDF）へ拡張前提でメタデータ設計する。

