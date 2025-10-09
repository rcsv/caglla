# Places Cache への移行設計と実装

## 目的
- Firestore の `trips.destination_place` と `itineraries.place_data` に保存している Google Places API の生データを、`places_cache` コレクションへ集約し、参照は `place_id` 経由に変更して API コストを削減する。

## 方針
- 書き込み時（作成/更新）: `place_id` のみを `trips.destination_place_id` と `itineraries.place_id` に保存。
- 読み取り時: `place_id` を用いて `places_cache` から実体を解決し、レスポンス/画面状態では従来通り `destination_place` / `place_data` を提供。
- キャッシュミス時: 一度だけ `places/details` プロキシを呼び、結果を `places_cache` に保存。

## 型の変更
- `lib/types.ts`
  - `Trip`: `destination_place_id?: string`, `destination_place?: PlaceData`
  - `Itinerary`: `place_id?: string | null`, `place_data?: PlaceData | null`
  - `ItineraryFormData`: `place_id?: string | null` を追加（後方互換で `place_data` も許容）

## API の変更
- `POST /api/trips`: `destinationPlaceId` を受け取り、`destination_place_id` を保存。返却時は `destination_place` を `places_cache` から解決。
- `PUT /api/trip/[id]`: `destinationPlaceId` を受け取り、`destination_place_id` を更新。
- `POST /api/itineraries` / `POST /api/itineraries/insert`:
  - 入力: `place_id`（推奨）または `place_data.place_id`（後方互換）
  - 保存: `place_id`
  - 返却: `place_data` を `places_cache` から解決（ミス時は一度だけ詳細取得→キャッシュ保存）
- `POST /api/itineraries/duplicate-to-day`: `place_id` をコピー（後方互換で `place_data.place_id` からも抽出）

## データ取得の変更
- `lib/slug-data-helpers.ts`:
  - `Trip` 取得時に `destination_place_id` を `places_cache` で解決
  - 各 `Itinerary` で `place_id` を `places_cache` で解決して `place_data` を付与

## フロントエンドの変更
- 検索部品 `PlaceSearchInput`: 詳細取得をやめ、選択時は `place_id` を含む最小データで親に返す
- スケジュール追加モーダル `AddScheduleModal`: API へ `place_id` のみ送信
- 旅行作成/編集 (`/app/trip/new`, `CreateTripDialog`, `TripEditor`): API に `destinationPlaceId` を送信

## 既存データの移行
- 目的: 既存の `trips.destination_place` と `itineraries.place_data` から `place_id` を抽出して `trips.destination_place_id` / `itineraries.place_id` に保存し、同時に `places_cache` にも保存。
- 実装: 管理者 API `POST /api/migrate/places-to-cache`（例）
  1. `trips` を走査し、`destination_place.place_id` があれば `destination_place_id` を設定、`places_cache` に upsert
  2. `itineraries` を走査し、`place_data.place_id` があれば `place_id` を設定、`places_cache` に upsert
  3. オプション: 検証後に `destination_place` / `place_data` の大きなフィールドを削除

### キャッシュ保存のルール
- `format_version: '1.0.0'`
- 動的情報 (`open_now`) は保存しない。`weekday_text` のみ。
- メタ: `cached_at`, `last_accessed`, `access_count`

## 検証
- 開発環境で:
  - 旅行作成→`trips` に `destination_place_id` が保存され、`places_cache` にドキュメントが作成されること
  - 日程追加→`itineraries` に `place_id` が保存され、返却の `place_data` が埋まること
  - スラッグベースページで `place_data` が正常に表示されること

## ロールアウト手順
1. サーバ/クライアントのコードをデプロイ
2. 管理者APIを実行し既存データを移行
3. メトリクス監視（Places API 呼び出しが減っていることを確認）
4. 問題なければ旧フィールド（`destination_place`, `place_data`）を段階的に削除

## 互換性
- 既存UIは `place_data` を引き続き参照。読み取り時の解決により非破壊に移行可能
- API入力は当面 `place_data` も許容し、将来 `place_id` のみに移行
