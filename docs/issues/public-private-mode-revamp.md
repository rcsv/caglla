---
title: Public / Private モード再定義と関連機能追加
status: Proposed
author: GPT-5 Codex (assistant)
createdAt: 2025-11-12
---

# Issue: Public / Private モード再定義と関連機能追加

## 概要

現行の `Public` / `Private` 区分を見直し、ユーザーの利用シナリオに沿った機能改善を行う。これに伴い、デフォルト設定や共有導線、`Public` 向けの展示機能を拡充し、`Trip Guide`（旧 `Travel Guide`）やおすすめプラン表示の内容も再構成する。

## 目的

- `Public` モードをツアーコンダクター向けの「旅行プラン公開」手段として再定義し、周囲への紹介を促進する。
- `Private` モードを個人用の旅行計画作成に特化させ、デフォルト設定を `Private` に変更することでユーザー体験を最適化する。
- `Private` モードでも友人招待が容易に行える共有導線を提供する。
- `Public` の旅行データを集約し、`Trip Guide` での閲覧やおすすめ表示の精度を高める。

## 機能要件

### 1. Public / Private の位置づけ変更

- `Create New Trip Dialog` にある公開範囲スイッチのデフォルトを `Public` → `Private` に変更する。
- 新しい定義
  - **Public**: ツアーコンダクター（プラン提供者）が周囲に旅行を紹介する目的。
  - **Private**: 自身の旅行計画作成と管理が目的。

#### 実現性メモ

- UI: トグルスイッチの初期値と説明文を更新する。ラベル文言・翻訳キーの変更が必要 (`lib/i18n` の対応あり)。
- データ: 既存トリップの `visibility` フラグは流用可能。デフォルト値設定箇所（作成 API / Firestore 初期値）の見直しが必要。
- QA: 既存の公開トリップに影響なし。新規作成時の挙動確認が中心。

### 2. Private 旅行への招待機能追加

- `Extra Controls` に `Share with buddies` メニューを新設し、メールアドレス入力フォームを配置する。
- 招待フロー
  1. メールアドレス送信 → `users` コレクション検索。
  2. 該当ユーザーが存在しない場合、新規レコードを作成（メールアドレスと `google_id` のプレースホルダー紐付け）。
  3. 入力されたメールアドレス宛に招待メールを送信。
  4. 新規ユーザーのみ、受諾時にアカウント紐付けを完了させる。

#### 実現性メモ

- UI: `Share with buddies` メニューとモーダル追加。メール入力 → 招待送信のバリデーションが必要。
- サーバー: Firestore `users` コレクション検索および招待レコード（新規テーブル検討）作成。Firebase Admin SDK 経由でメール送信機能を拡張する必要がある（既存メール送信インフラ要確認）。
- 認可: `Private` トリップ所有者のみ招待可能。共有状態管理（招待済み・承諾済み）を Firestore に保持する。
- セキュリティ: インジェクション対策としてメールフォーマット検証、送信レート制限を検討。
- 未決: メール送信手段（SendGrid 等）と承諾フロー UI（リンククリック後の画面構成）を要設計。

### 3. Public 旅行データ作成機能

- ツアーコンダクター自身の PR を目的とした `Public` 専用旅行データを作成する。
- `Private` との主な差分
  - 日付は入力せず、総日数のみ指定。
  - `Reservation` ボタンは非表示。
  - `Replica 作成` ボタンを表示し、ユーザー自身の旅行データへコピーできるようにする。
  - `いいね` ボタンでクリエイターへのフィードバックを可能にする。
  - Replica 時には旅程・メモ・チェックリスト（クリエイターノウハウ）まで複製対象とする。

#### 実現性メモ

- UI: 日付入力 UI の分岐（`Public` の場合は日数入力コンポーネント表示）と新ボタン追加。
- データ: `Trip` モデルに「テンプレートフラグ」「日数」など新プロパティを追加。`Replica` 実行時に `Private` トリップとして複製する API が必要。
- いいね実装: Firestore に `likes` コレクション（もしくは trip ドキュメント内サブコレクション）を追加し、ユーザーごとの重複いいね防止を行う。
- サブスク制御: `PlanLimitChecker` に `Public` データ作成上限を追加し、サブスク Lv2 (`backpacker`) 以上のみ許可する。
- 未決: PR情報（プロフィールやタグ）をどの程度表示するか、既存 `Trip` ビューとの UI 整合性。

### 4. Trip Guide 表示内容リニューアル

- メニュー名称を `Travel Guide` → `Trip Guide` に変更。
- 表示対象を上記で作成された `Public` 旅行データへ切り替える。
- 表示カードにはクリエイターのアバター画像・名前・プロフィールページへのリンクを必須表示する（プロフィールページには BIO / SNS リンクが掲載可能）。

#### 実現性メモ

- UI: サイドメニュー・ヘッダーなど名称を `Trip Guide` に統一（`lib/i18n` 更新必須）。
- データ取得: `Public` 旅行データの一覧 API / Firestore クエリを用意、ページング・フィルタを検討。
- SEO: `Public` データをリッチに表示するため、OGP タグ出力や SSR レンダリングへの影響を確認。

### 5. Recommended Trip Plan 表示の地域連動

- `/home/page.tsx` で `Next Trip Plan` または `Upcoming Trips` に旅行データがある場合、該当旅行と同じ地域の `Public` データを `Recommended Trip Plan` に表示する。

#### 実現性メモ

- ロジック: 旅行データの地域情報を取得し、地域ベースの `Public` データ検索クエリを実装。
- データ整備: 旅行データに地域属性が存在しない場合、`City/Region` 情報の付与・マッピングが必要（`lib/core/locations.ts` 利用）。
- パフォーマンス: 同じ地域のクエリが増えるため、キャッシングやインデックス設計を検討。

### 6. Public データの「いいね数」表示

- Public の旅行データに対して、合計「いいね数」を表示する。
- 表示対象: `TripCard`（一覧/おすすめ/Trip Guide）、トリップ詳細ページのヘッダ。
- 仕様:
  - ログインユーザーのみ「いいね」可能（匿名は不可）。
  - 1ユーザー=1いいね（トグル式で取り消し可）。
  - 合計値は `trips` ドキュメントに `likes_count` を冗長保持（読み取り最適化）。

#### 実現性メモ

- Firestore設計:
  - サブコレクション案: `trips/{tripId}/likes/{userId}` に `{ created_at }` を保存。
  - 冗長カウンタ: `trips/{tripId}.likes_count` を `FieldValue.increment(±1)` で更新。
  - 競合: 通常トラフィック想定で `increment` で十分（高負荷時は分散カウンタ設計へ拡張余地あり）。
- API:
  - `POST /api/trips/[tripSlug]/likes` トグル/明示的 set/unset を提供（認証必須）。
  - `GET /api/trips/[tripSlug]/likes` で `likes_count` と「自分がいいね済みか」を返却。
  - 所有権/認可: Public のみ誰でも参照可能、更新はログイン必須。Private は表示/操作ともに不可。
- UI:
  - `TripCard` に「ハートアイコン + 数値」を表示（access_level === 'public' のみ）。
  - トリップ詳細上部に同様の UI を設置し、トグルで即時反映（楽観更新）。
- i18n:
  - 例: `trip.likes.count`, `trip.likes.like`, `trip.likes.liked` を追加。
- ルール/セキュリティ:
  - `firestore.rules` に `trips/{tripId}/likes/{userId}` の作成/削除を本人のみ許可。
  - `trips/{tripId}.likes_count` はサーバー（API）経由でのみ更新（クライアント直更新を拒否）。
- テスト:
  - API の認証・二重いいね禁止・取り消し・カウンタ整合性のユニット/E2E。

## 追加検討事項

- 翻訳: `Public` / `Private` の説明文変更、`Trip Guide`、`Share with buddies`、`Replica` 等の新規文言を i18n リソースに追加。
- メールテンプレート: 招待メール用テンプレート（多言語対応含む）の整備。
- 権限管理: 招待されたユーザーに対する権限スコープ（閲覧のみ / 編集可）の仕様定義。
- 分析指標: `Public` プランの `いいね` や `Replica` 実行数など、追跡すべきメトリクスを要整理。

## 決定事項（2025-11-12 更新）

- Replica は旅程・メモ・チェックリストまで複製対象とする（クリエイターのノウハウ共有が目的）。
- Trip Guide のカードには「アバター画像・名前・プロフィールページへのリンク」を標準表示とし、プロフィールページ側で BIO / SNS リンクを確認可能とする。
- サブスク Lv2（`backpacker`）以上のみ Public テンプレートの作成を許可し、公開数上限は設けない（作成可否のみ制御）。

## オープン質問

1. **招待メール送信フローのドキュメント化**
   - Firebase Extensions `Trigger Email from Firestore` が既に稼働しているため、監視コレクション・テンプレ構造を確認し、Issue/README に使い方を整理する。

## 推奨タスク分割

- [ ] `Public` / `Private` 定義とデフォルト値更新（UI/サーバー）
- [ ] `Share with buddies` 招待機能の UI と API 実装（メール送信基盤の構築含む）
- [ ] `Public` 向け旅行データテンプレート機能＋`Replica`・`いいね` 実装
- [ ] `Public` いいね数の表示・トグルAPI・冗長カウンタ整合性実装
- [ ] `Trip Guide` 表示切替と命名アップデート
- [ ] `Recommended Trip Plan` の地域連動ロジック追加
- [ ] i18n・メールテンプレート・サブスク制御など横断対応

---

## 🔍 セルフレビュー結果

### ✅ 実現可能な項目

1. **Public / Private デフォルト値変更**
   - `components/common/CreateTripDialog.tsx` 第60行で `accessLevel: 'public'` 設定済み。
   - `lib/core/types/trip.ts` に `access_level: AccessLevel | 'private' | 'public'` 型定義あり。
   - UI のトグルスイッチ実装あり（`TripEditor.tsx`）。
   - **実現度**: ⭐⭐⭐⭐⭐ (修正は15分程度)

2. **Replica / テンプレート機能の基盤**
   - `app/api/templates/route.ts` に既に `createFromTemplate` 機能が存在。
   - テンプレートプランから新規プランを作成するロジック既装備。
   - **実現度**: ⭐⭐⭐⭐ (既存コード流用可能、UI層の追加のみ)

3. **いいね機能**
   - Firestore にサブコレクション `likes` を追加するだけで実装可能。
   - **実現度**: ⭐⭐⭐⭐ (標準的な実装)

4. **Trip Guide 表示切替**
   - 既存の `Travel Guide` 名称を `Trip Guide` に変更（翻訳ファイル更新）。
   - Public データを新規 API エンドポイント追加で取得可能。
   - **実現度**: ⭐⭐⭐⭐⭐ (UI/翻訳の更新のみ)

5. **Recommended Trip Plan の地域連動**
   - `app/api/trips/recommended/route.ts` に既に推奨プラン取得 API 存在。
   - 地域フィルタロジック追加可能（`lib/core/locations.ts` 活用）。
   - **実現度**: ⭐⭐⭐⭐ (API ロジック追加)

### ⚠️ 実現に時間がかかる項目 / 要検討

1. **Share with buddies 招待機能** ⚠️ **要注意**
   - **現状インフラ**: Firebase Extensions `Trigger Email from Firestore (firestore-send-email@0.2.4)` が SendGrid（`smtp://apikey@smtp.sendgrid.net:587`）連携済み。
     - Firestore default インスタンス（asia-northeast1）で稼働、`UsernamePassword` 認証タイプ。
   - **不足点**: 拡張機能が書き込みを監視する Firestore コレクションや、アプリ側での書き込み処理が未実装（ドキュメント未発見）。
   - **対応案**:
     - 既存拡張機能の送信コレクション（デフォルト: `mail`）へ招待メールドキュメントを生成する API を実装。
     - 既存仕様がなければ、拡張機能のカスタムテンプレートを用意し、`personalizations` 等を含むドキュメント構造に従う。
     - 併せて Google Cloud Functions / SendGrid SDK 直書き fallback（将来拡張用）も検討。
   - **予想工数**: 5-6時間（拡張機能既存のため短縮、テンプレート整備＋API＋テスト）

2. **Public 旅行データ専用テンプレートモデル**
   - 現在の `Trip` モデルに「テンプレートフラグ」プロパティを追加する必要。
   - 日数のみ入力 UI の分岐実装。
   - DateRange Start - End が Required Field になっている箇所は条件付き（テンプレート時のみ任意）にリファクタする。
   - **実現度**: ⭐⭐⭐⭐ (モデル拡張 + UI 分岐)

3. **サブスク制御の統合**
   - `lib/subscription/plan-limits.ts` に `PlanLimitChecker` クラス既存。
   - `checkAllLimits()` で `Public` データ作成制限を追加するだけ。
   - **実現度**: ⭐⭐⭐⭐⭐ (既存システム活用)

### 📊 総合実現可能性評価

| 機能 | 実現度 | 優先度 | 工数見積 | 備考 |
|------|------|------|---------|------|
| Public / Private デフォルト | ⭐⭐⭐⭐⭐ | P0 | 0.5h | 即実装可能 |
| Replica / テンプレート | ⭐⭐⭐⭐ | P1 | 4h | 既存コード流用 |
| いいね機能 | ⭐⭐⭐⭐ | P1 | 2h | 標準実装 |
| いいね数の表示/カウント | ⭐⭐⭐⭐⭐ | P1 | 2h | 冗長カウンタで高速表示 |
| Trip Guide 切替 | ⭐⭐⭐⭐⭐ | P1 | 1h | 翻訳更新のみ |
| Recommended 地域連動 | ⭐⭐⭐⭐ | P2 | 3h | API ロジック追加 |
| **Share with buddies** | ⭐⭐⭐ | P1 | 8h | ⚠️ メール送信基盤要構築 |

**総合工数見積**: **20-22 時間** (メール基盤含む)

### 🚀 推奨実装順序

1. **Phase 1 (2h)**: Public / Private デフォルト値変更 + Trip Guide 名称更新
2. **Phase 2 (6h)**: Replica 機能 + いいね実装 + いいね数表示（冗長カウンタ）
3. **Phase 3 (3h)**: Recommended 地域連動ロジック
4. **Phase 4 (8h)**: Share with buddies + メール送信基盤（別途 Issue 化推奨）

## 🛠️ フェーズ別の実装手順（詳細）

前提: 影響範囲は UI（`components/`）、API（`app/api/`）、型（`lib/core/types/`）、i18n（`lib/i18n/index.ts`）、サブスク（`lib/subscription/`）、ルール（`firestore.rules`）を跨ぎます。必要に応じて E2E（`e2e/`）とユニットテストを追加します。

### Phase 1: デフォルト値変更＋名称更新（2h）

1) Create Trip のデフォルトを Private へ
- `components/common/CreateTripDialog.tsx` と `app/trip/new/page.tsx` の初期 state を `accessLevel: 'private'` に変更
- 生成 API 側のデフォルトも保険で Private に設定（`app/api/trips/route.ts` の POST 実装で `access_level ??= 'private'`）
- 既存データは変更不要（新規作成時のみ影響）

2) 表示文言（i18n）調整
- `lib/i18n/index.ts` にて `Public=紹介用、Private=自分用` の説明に更新
- `Travel Guide` → `Trip Guide` のキー・ラベル更新（参照箇所置換）

3) UI ラベルとヘルプテキスト
- `CreateTripDialog` と `TripEditor` のアクセスレベル説明テキストを更新
- QA: 新規作成ダイアログでデフォルトが Private になっていることを確認

4) テスト
- E2E: 新規作成で `access_level === 'private'` になる
- スナップショット: 文言更新の回 regressions を抑止

### Phase 2: Public テンプレート＋Replica＋いいね（表示/トグル）（6h）

0) 事前準備と型
- `lib/core/types/trip.ts` に Public テンプレート用フィールドを追加
  - `is_template?: boolean`（Public 向けテンプレート）
  - `day_count?: number`（総日数）
  - `likes_count?: number`（冗長保持、既定 0）
- `lib/core/types/api.ts` の `TripFormData` を更新（Public テンプレート時は `start_date`/`end_date` を任意）
- サーバーバリデーションを条件必須に変更
  - `access_level === 'public' && is_template === true` の場合のみ日付を任意
  - Private の場合は従来どおり日付必須

1) UI: Public テンプレート作成
- `CreateTripDialog` にテンプレート作成モード（Public 専用）を追加
  - 日付入力非表示、`day_count` 入力表示
  - テンプレートでは Trip 詳細で `Reservation` ボタンを隠す
- `TripEditor` も `is_template` 時は同様に分岐

2) Replica（テンプレート→自分の Private へ）
- テンプレート閲覧 UI に「Replica」ボタンを追加
- 既存 `app/api/templates/route.ts` の `createFromTemplate` を呼び出し
- 複製時は `is_template=false`, `access_level='private'` に強制
- 複製範囲は Day / Itinerary / Place リンクに加えて、メモとチェックリストまでコピー（クリエイターのノウハウを含める）

3) いいね（トグル＋表示）
- Firestore
  - `trips/{tripId}/likes/{userId}` に `{ created_at }`
  - `trips/{tripId}.likes_count` を `FieldValue.increment(±1)` で更新
  - ルール: `likes/{userId}` は本人のみ作成/削除、`likes_count` はサーバーのみ
- API
  - `POST /api/trips/[tripSlug]/likes`（toggle or set/unset）：認証必須
  - `GET /api/trips/[tripSlug]/likes`：`{ likes_count, likedByMe }`
  - 推奨一覧 API に `likes_count` を同梱（必要に応じて）
- UI
  - `TripCard` とトリップ詳細ヘッダにハート＋数値（Public かつ `is_template` 対象）
  - ログイン時はクリックでトグル（楽観更新）
- テスト
  - ユニット: 二重いいね防止、取り消し、カウント整合性
  - E2E: UI トグルと権限制御

4) サブスク Lv2 制限
- `lib/subscription/plan-limits.ts` に Public テンプレート作成の制限チェックを追加
- 制限は「Lv2 以上のみ作成可能」であり、公開数上限は設けない
- UI は `hasFeature('public_template')` で制御し、未達プランにはアップグレード導線を提示

### Phase 3: Recommended Trip Plan 地域連動（3h）

1) 地域解決
- `destination_place_id` / `destination_place` から地域を導出
- `lib/core/locations.ts` のマッピングを活用（不足あれば拡張）

2) API 拡張
- `app/api/trips/recommended/route.ts` に地域フィルタを追加
- 必要に応じて `orderBy('likes_count', 'desc')`（要インデックス）

3) UI
- `/home/page.tsx` で Next/Upcoming がある場合、同地域の Public テンプレートを表示

4) テスト
- ユニット: 地域マッピング、API フィルタ
- E2E: 地域一致でレコメンドが変化すること

### Phase 4: Share with buddies（招待メール基盤＋承諾フロー）（8h）

0) 既存拡張機能・Issue 調査（15-20min）
- リポジトリと `docs/issues/` を検索（`sendgrid`, `invite`, `share`）
- Firebase Console の `Trigger Email from Firestore` 拡張機能（default インスタンス / asia-northeast1）設定を確認
- 拡張機能が監視する Firestore コレクション（デフォルト: `mail`）とテンプレート構造を把握

1) メール送信フロー整備
- アプリ側で `mail` コレクションへドキュメントを書き込むユーティリティを作成（`lib/email/sendgrid-extension.ts` 等）
  - 必要フィールド: `to`, `template`, `personalizations`, `subject`, `text`, `html` など拡張機能ドキュメント仕様に従う
- 招待専用テンプレートを Firestore 拡張機能のテンプレートに登録し、i18n 対応の本文を `lib/content/email-templates.ts` で管理
- SendGrid 資格情報 (`smtp://apikey@…` / パスワード) が Firebase Extensions 側で有効になっているか定期確認。必要なら Secrets Manager で更新

2) Firestore モデル
- `invitations`（トップレベル）:
  - `{ email, invited_by_user_id, trip_id, status: 'pending'|'accepted'|'expired', created_at, expires_at, token }`
- 受諾後にユーザーと Trip をリンク（`trip_members` などは最小スコープで viewer 権限）

3) API
- `POST /api/trips/[tripSlug]/invite`：メール受理→`invitations` 生成→送信
- `GET /api/invitations/[token]`：トークン検証
- `POST /api/invitations/[token]/accept`：承諾処理（未ログインはログイン誘導）
- レート制限を導入（IP/ユーザー）

4) UI
- `Extra Controls` → `Share with buddies` モーダル
  - メールアドレスの追加/削除/送信、結果表示、再送
- 受諾画面（簡易）と成功導線（該当 Trip へ）

5) 権限・ルール
- Private Trip の所有者/編集者のみ招待可
- Firestore ルールで `invitations` と `trip_members` を保護

6) テスト
- ユニット: 招待作成、トークン検証、承諾（既存/新規ユーザー）
- E2E: モーダル→送信→受諾→参加まで

---

本 Issue は上記機能の包括的な実装計画の起点として利用し、詳細設計やタスク分割は別途サブ Issue / PR で進行する。


