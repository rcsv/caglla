---
title: Phase 2 – Public テンプレート＆Replica＆いいね機能
status: In Progress
author: GPT-5 Codex (assistant)
createdAt: 2025-11-12
linkedPlan: public-private-mode-revamp.md#phase-2
---

# Phase 2 着手計画

## 🎯 目的
- Public 旅行データをテンプレートとして作成・公開できる仕組みを整備し、クリエイターが旅行プランを紹介しやすくする。
- テンプレートから自身の Private Trip へ複製できる Replica 機能を提供し、利用者側のプラン作りを効率化する。
- Public テンプレートに対する「いいね」トグルと集計表示を実装し、フィードバック指標として活用する。

## 🧩 影響範囲
- 型: `lib/core/types/trip.ts`, `lib/core/types/api.ts`, `lib/core/types/index.ts`, `lib/travel/plan-save.ts`（`createFromTemplate` の戻り値型）
- UI:
  - `components/common/CreateTripDialog.tsx`
  - `components/trip/TripEditor.tsx`
  - `components/tripcard/TripCard.tsx` ほか Public データを表示するカードビュー
  - `app/[userSlug]/[tripSlug]/page.tsx`（詳細ヘッダ表示）
- API:
  - `app/api/trips/route.ts`
  - `app/api/templates/route.ts`
  - `app/api/trips/[tripSlug]/route.ts`（詳細取得に新フィールドを含める）
  - `app/api/trips/recommended/route.ts`（レスポンスに `likes_count` などを同梱）
  - `app/api/trips/[tripSlug]/likes/route.ts`（新規）
  - `app/api/trips/likes/route.ts`（一覧・バッチ取得が必要なら追加）
- Firestore ルール: `firestore.rules`
- サブスク制御: `lib/subscription/plan-limits.ts`, `lib/subscription-context.tsx`
- テスト: `lib/core/types/__tests__`, 新規 API テスト、必要に応じて E2E

## ✅ 実装タスク

### 0. 型定義・バリデーションの準備 ✅
- [x] `Trip` に以下のフィールドを追加:
  - `is_template?: boolean`
  - `day_count?: number`
  - `likes_count?: number`
- [x] `TripFormData` / API 入力型にテンプレート用プロパティを追加し、型エクスポートを更新。
- [ ] 既存の `Trip` ドキュメントに対して `is_template=false, likes_count=0` をデフォルト付与するバックフィル処理（一次スクリプト or lazy migration）を検討。
- [x] サーバーサイドのバリデーションを更新し、`access_level === 'public' && is_template` の場合は `start_date` / `end_date` を任意、それ以外は必須とする。

### 1. Public テンプレート作成 UI ✅
- [x] `CreateTripDialog` にテンプレート作成モードを追加:
  - Public を選択した際、日付フィールドを隠し `day_count` 入力を表示。
  - `Reservation` 関連 UI をテンプレート時には非表示。
- [x] `TripEditor` でも `is_template` 時には同様の分岐を実装。
- [x] 日付→日数変換ロジックや UI の説明文（i18n）を整備。
- [x] `day_count` を保存・表示できるよう、テンプレート表示コンポーネントで使用する。
- [x] `Trip` レンダリング全般（`app/[userSlug]/[tripSlug]/page.tsx` など）で `is_template` の場合にテンプレート向け UI（予約ボタン非表示、Replica 動線表示）へ切り替える。

### 2. Replica 機能の拡充 ✅
- [x] Public テンプレート閲覧画面に「Replica」ボタンを追加。
- [x] 既存の `planSaveOperations.createFromTemplate` を呼び出しながら、以下を適用:
  - 作成先は `access_level='private'`, `is_template=false`.
  - Day / Itinerary / Place 情報に加え、メモ・チェックリストまで複製。
  - 失敗時のエラーハンドリングと成功トーストを整備。
- [x] 必要に応じて API 応答を拡張し、複製結果を UI に返す。
- [x] `planSaveOperations` で新フィールド (`day_count`, `is_template`) を扱えるよう更新。

### 3. いいね機能 ✅
#### Firestore
- [x] `trips/{tripId}/likes/{userId}` サブコレクションを作成し `{ created_at }` を保存。
- [x] `trips/{tripId}.likes_count` を `FieldValue.increment(±1)` で更新（冗長保持）。
- [x] `firestore.indexes.json` に `access_level` / `is_template` / `likes_count` を条件とする複合インデックスを追加。

#### API
- [x] `POST /api/trip/[tripSlug]/likes`（新規）:
  - [x] 認証必須。既にいいね済みの場合は削除（トグル）か、`action` パラメータで明示制御。
  - [x] `likes_count` と `likedByMe` を返す。
- [x] `GET /api/trip/[tripSlug]/likes`（新規）:
  - [x] 認証任意。`likes_count` と `likedByMe` を返す。
- [x] 推奨・テンプレート一覧などの Public 表示向けレスポンスで `likes_count` を扱えるよう型を更新。

#### UI
- [x] `TripCard`（Public テンプレート表示箇所）とトリップ詳細ヘッダにハートアイコン＋カウントを表示。
- [x] ログイン時はクリックでトグルし、Optimistic UI で即時反映。
- [x] 未ログインの場合はログイン導線（アラート）を表示。
- [x] 詳細ページの状態更新と `Trip` 型 (`liked_by_me`) を同期。

### 4. サブスク Lv2 制御 ✅
- [x] `PlanLimitChecker` / `useSubscription` に Public テンプレート作成上限を追加し、`backpacker` 以上のみ作成可能にする（既存 Public Trip には影響しないよう条件分岐）。
- [x] `CreateTripDialog` 内で該当プラン以外の場合はテンプレートスイッチを非活性＋アップグレード導線を表示。

### 5. Firestore ルール更新 ✅
- [x] `trips/{tripId}/likes/{userId}` は public trip のみ読み取り可、書き込みはサーバー経由のみに制限。
- [x] `trips/{tripId}.likes_count` をクライアントから更新できないようルールを調整。

### 6. i18n / UI テキスト ✅
- [x] Public テンプレート用の説明文 (`trip.template.*`) とアップグレード導線を追加。
- [x] いいね UI のテキスト (`trip.likes.*`) を追加（英日両対応）。
- [x] プラン制限 UI（`planLimits.publicTemplate`）を追加。
- [ ] ドキュメント: Public テンプレート作成手順を `docs/features/` 等へ追記（別タスク）。

### 7. テスト / QA 🚧
- ユニットテスト:
  - 新しい型・バリデーションロジック。
  - `planSaveOperations.createFromTemplate` の複製範囲（メモ・チェックリスト含む）。
  - いいね API のトグル動作。
- E2E（Playwright）は現状環境が稼働していないため **対象外**。
- 手動 QA:
  - サブスク Lv2 以外でテンプレート作成ボタンが押せないこと。
  - いいね数が複数ユーザーで正しくカウントされること（重複なし）。
  - 既存の Private/Public Trip が従来どおり作成・閲覧できること。

## 🔄 フォローアップ / 残課題
- Public テンプレートの一覧・検索 UI（Phase 3 以降の Trip Guide 再設計）に likes カウントを活用する。
- Replica 時のカスタマイズ（部分複製の選択など）は今後の拡張として別 Issue で検討。
- 既存 Public Trip をテンプレートへ昇格させる移行フロー（`is_template` の手動切替 UX）をどう扱うか検討。
- いいね計測を分析基盤（BigQuery など）へ送る必要があるか別途検討。

