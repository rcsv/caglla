# Itinerary Card Attachments (Receipts & PDFs)

- **Priority**: P2（機能改善・要望）
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
- 添付ファイルは閲覧・ダウンロード可能で、不要になった場合削除できる。
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
- [ ] Firebase Storage（`receipts/{tripId}/{itineraryId}/{fileId}` など）にファイルが保存され、認可制御が適切に行われる。
- [ ] 添付一覧でサムネイル（画像）またはアイコン（PDF）が表示され、クリックで閲覧・ダウンロードできる。
- [ ] モバイル幅でも UI が崩れない（横スクロール避ける）。
- [ ] 10MB を超えるファイルはバリデーションで弾くなど、ストレージコストを制御する。

## 解決方針（案）

1. **データモデリング**
   - Firestore: `itineraries/{id}/attachments/{attachmentId}` サブコレクション、または `attachments: Attachment[]` を `Itinerary` に追加。
   - Attachment モデル: `fileName`, `fileSize`, `contentType`, `storagePath`, `uploadedBy`, `uploadedAt`.
2. **アップロード処理**
   - Firebase Storage へアップロードする `useFirebaseUpload` のような共通フックを作成。
   - 進捗表示＋エラーハンドリング（リトライ、キャンセル）対応。
3. **UI 実装**
   - 行程カードに「添付」アイコンボタンを追加し、クリックでモーダル／ドロップダウンからアップロード。
   - 添付一覧（リストorグリッド）をカード下部に表示。画像はプレビュー、PDF は `embed` またはダウンロードリンク。
4. **プラン制限（任意）**
   - Backpacker 以上のみ利用可能等、 SubscriptionContext と連携して機能制限を検討。
5. **セキュリティ**
   - Storage セキュリティルールで `trip.user_id === auth.uid` のみ CRUD を許可。共有時の閲覧要件があれば read 権限を調整。

## アクセシビリティ

- アップロードボタンは `<button>` で実装し、`aria-label="行程にファイルを添付"` を付与。
- ファイル一覧はリスト構造で表示し、キーボードでも操作可能にする。
- アップロード進行状況を `aria-live="polite"` で通知。

## メモ

- 後続で「請求書 PDF を一括ダウンロード」「Trip 全体の証憑 ZIP 出力」などの拡張が想定される。
- モバイル帯域節約のため、サムネイル生成を Cloud Functions で行う案も検討。
- 旅行共有リンクでの公開範囲を定義（公開旅行でも添付は非公開扱いとする等）。

