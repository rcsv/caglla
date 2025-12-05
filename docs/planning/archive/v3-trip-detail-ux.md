## v3 Trip Detail UX 方針（/ [userSlug] / [tripSlug]）

このドキュメントは、v3.0.0 における「Trip 詳細画面」のユーザー体験を整理し、  
Route Group / Parallel Routes の設計と実装の指針を共有するためのものです。

---

### 1. コンテキストと役割

- **(planner) グループ**
  - パス: `/(planner)/[userSlug]/[tripSlug]`
  - **目的**: 自分の旅程を「作る・編集する・管理する」ための画面。
  - 主な機能: Hero（基本情報）、Summary、Itinerary、Checklist、PDF/Template 操作など。

- **(discover) グループ**
  - パス: `/(discover)/feed`, 将来的に `/(discover)/templates` など。
  - **目的**: 他人の公開トリップを「見つけて読む」「いいね・フォローする」ための画面。
  - Trip 詳細は、現時点では `(planner)` の画面を共有するが、将来的には  
    SNS 閲覧専用のビュー（編集 UI を排した軽量版）を導入する余地あり。

- **(profile) グループ**
  - パス: `/(profile)/[userSlug]`
  - **目的**: ユーザープロフィール＋公開トリップ一覧のハブ画面。
  - Trip 詳細との関係: プロフィール → TripCard → `(planner)` の Trip 詳細へ遷移。

---

### 2. Trip 詳細ページのレイアウト構造

- **現状（v2.x / v3 移行初期）**
  - `page.tsx` 内で以下をレンダリング:
    - Hero: `TripHeroSection`
    - Summary: `TripSummaryView`
    - Itinerary: `TripItineraryView`
    - Checklist: `TripChecklistView`
    - 右ペイン Map: `TripMap`（現在は Parallel Routes 側に移行済み）
  - これらを `TripPageLayout` が包む構造。

- **v3 での目標レイアウト（デスクトップ）**
  - 左: **メインコンテンツ**
    - 上部: Hero（タイトル / 日付 / 行き先 / Publish / Template 操作）
    - 中央: Summary（将来の旅概要 / 過去の旅レビュー）
    - 下部: タイムライン（Itinerary）
  - 右: **Map スロット（@map）**
    - フォーカス:
      - 全体表示（**all**）
      - 日別表示（**day**）
      - 特定予定フォーカス（**single**）
    - タイムラインとの同期（クエリパラメータ `sd`, `si`, `mf` で連携）。
  - 右端: **Social スロット（@social）**
    - Likes / Comments / Follow ボタン。
    - モバイルでは下部シートとして表示。

- **モバイル**
  - `TripPageLayout` のモバイルメニュー（タブ）を基本に、以下のビューを切り替え:
    - `view=summary` : Hero + Summary
    - `view=itinerary` : タイムライン
    - `view=checklist` : Checklist
  - Map は FAB → 全画面モーダルで表示（現実装を維持）。
  - Social はモバイル下部の固定シート（@social）で表示。

---

### 3. 権限・公開状態ごとの表示ポリシー

- **モード軸**
  - `access_level`:
    - `private` : 非公開
    - `public` : 公開
  - `is_template`:
    - `true` : テンプレートモード
    - `false` : 通常 Trip

- **ロール軸**
  - **Owner**: `canEditTrip(user, trip) === true`
  - **Viewer**: 上記以外（第三者 / 未ログイン閲覧者）

- **表示矩形（Owner / Viewer × private / public / template）**

- **Owner + private**
  - `(planner)`:
    - Hero / Summary / Itinerary / Checklist / Map すべて表示。
    - Publish ボタン表示（`trip.access_level !== 'public'`）。
    - Social:
      - Like/Comment は「非公開」のため無効（@social スロットでは案内文のみ）。
  - `(discover)` / `(profile)`:
    - private Trip はリストに出さない（SNS 側では扱わない）。

- **Owner + public**
  - `(planner)`:
    - 上記に加え、Social（Like/Comment）も有効。
    - Feed / Profile から遷移してきても同じ画面を使う。
  - `(discover)`:
    - 主に TripCard 経由で `(planner)` に遷移。

- **Owner + template (access_level: public, is_template: true)**
  - `(planner)`:
    - 日付は「テンプレート用」として扱う（`TripHeroSection` / `TripItineraryView` では「日付未設定」プレースホルダーを非表示にする）。
    - 「Use this template」はテンプレート詳細ページから押す（CreateTripDialog からは行わない）という既定方針を維持。
    - Publish は「テンプレート公開／非公開」の切り替えのみ。カレンダー公開ボタンは非表示。
  - `(discover)`:
    - 将来的に `templates` 一覧から「Use this template」導線を提供。

- **Viewer + public (通常 Trip)**
  - `(planner)`:
    - Hero / Summary / Itinerary / Map / Social を **閲覧専用** で表示。
    - 編集ボタン群（Add Day / Add Schedule / Edit Trip / Checklist編集など）は非表示。
  - `(discover)` / `(profile)`:
    - 基本的には `(planner)` の閲覧専用ビューに遷移。

- **Viewer + public template**
  - `(planner)`:
    - タイムライン・マップ・Social は閲覧専用。
    - 「Use this template」ボタンは Template 詳細（将来の `/templates/[templateSlug]`）で提供する方向。
  - 現段階では、テンプレート閲覧と複製体験は v2 系と互換のまま維持し、v3 で段階移行。

- **Viewer + private**
  - `(planner)`:
    - Hero / Timeline / Map / Social すべて非表示。
    - 代わりに「This trip is private.」系の案内メッセージのみ表示（401/403 との整合をとる）。

---

### 4. Parallel Routes の役割と連携

- **スロット定義**
  - `@timeline` : タイムライン専用ビュー（現在は読み取り専用、将来編集も検討）
  - `@map` : 地図ビュー。`TripMap` を表示し、`sd` / `si` / `mf` クエリと同期。
  - `@social` : SNS（Like / Comment / Follow）ビュー。

- **v3.0.0 時点の方針**
  - メインの編集体験は引き続き `page.tsx` + `TripPageLayout` によって提供する。
  - `@map` / `@social` については **Parallel Routes で運用** しつつ、  
    右ペイン（Map）、右端パネル（Social）として統合する。
  - `@timeline` は以下のステップで段階移行:
    1. 読み取り専用で自己フェッチ版 `TripItineraryView` を提供（現状）。
    2. スクロール同期や URL クエリの同期（`sd`/`si`/`mf`）を安定化。
    3. 問題が無いことを確認した上で、`page.tsx` 内のタイムライン表示を徐々に `@timeline` に移譲。

- **クエリ連携仕様（案）**
  - `sd` (selectedDayId)
    - タイムライン: 日クリック時に設定/解除。
    - マップ: `sd` があれば、その日の itineraries のみ表示。
  - `si` (selectedItineraryId)
    - タイムライン: 予定クリック時に設定。
    - マップ: 該当マーカーを強調表示。
  - `mf` (mapFocus)
    - `'all' | 'day' | 'single'`
    - タイムラインとマップ双方で解釈し、表示モードを共有。

---

### 5. ローディング / エラー / 空状態 UX

- **共通方針**
  - 「何も写らない」状態を極力無くし、最低限以下のいずれかを表示する:
    - ローディング: `Loading` コンポーネント（メッセージ付き）。
    - エラー: 文言＋ `Go Home` / `Retry` ボタン。
    - 空状態: アイコン＋説明テキスト（例: 日程がまだない場合のプレースホルダー）。

- **Trip 詳細ページ**
  - API `/api/trip/[tripSlug]` への 404 / 403 / 500 に応じて:
    - 404: 「Trip not found」＋ Home への導線。
    - 403: 「This trip is private.」＋戻る／Home。
    - 500: 「Failed to load trip.」＋ Retry。
  - Parallel Routes 側でも同様のメッセージポリシーを採用し、  
    Layout 全体としての UX が破綻しないようにする（Map だけ真っ白等を避ける）。

---

### 6. 今後の実装ステップ（高レベル）

- **Step 1: 現状安定化**
  - `layout.tsx` は `children` をメイン表示に戻した上で、`@map` / `@social` を右側に統合（完了済み）。
  - `/api/users` まわりの HMR 時 500 を解消（開発時ミドルウェアのフォールバック導入）。

- **Step 2: `@map` / `@social` の振る舞い固定**
  - `sd` / `si` / `mf` クエリ連携の安定化。
  - 非公開 / テンプレート状態での Social の表示ルールを整理。

- **Step 3: `@timeline` の本採用検討**
  - 読み取り専用としてのUXが固まった段階で、  
    `TripPageLayout` の Itinerary 表示を `@timeline` に移譲する計画を策定。
  - 編集操作を Parallel Routes にどこまで持ち込むか（または Planner 専用に留めるか）を検討。

- **Step 4: (discover) 専用ビューの導入検討**
  - `(discover)` 側での Trip 閲覧専用画面（編集 UI を排した軽量版）を設計し、  
    将来的に `(planner)` と分離することで責務を明確化。


