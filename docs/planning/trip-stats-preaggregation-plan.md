## Trip.stats 事前集計（pre-aggregation）実装計画

### 1. ゴールとスコープ

**ゴール**

- `/home` の My Shares を含む各ビューで、以下の属性を **追加クエリ無し** で即座に表示できるようにする:
  - `trip.stats.days`（日数）
  - `trip.stats.itineraries`（旅程アイテム数）
  - `trip.stats.photos`（写真枚数）
  - `trip.stats.checklists`（チェックリスト項目数）
- 集計は **事前計算（pre-aggregation）** とし、Trip のライフサイクル中にインクリメンタルに更新する。

**スコープ（この計画でやるところ）**

- データモデルの拡張（`Trip` に `stats` フィールドを追加）。
- 既存フィールドから算出可能な属性の定義と算出ロジック:
  - `stats.days`
  - `stats.itineraries`
  - `stats.checklists`
- 写真数（`stats.photos`）は、アップロード機能の整備後に実装する前提で **フィールド定義のみ** 行う。

---

### 2. データモデル変更案

#### 2.1 Trip 型の拡張

`lib/core/types.ts` の `Trip` 型（または相当する型）に、次のようなサブオブジェクトを追加する:

```ts
type TripStats = {
  days?: number          // 日数（テンプレートは day_count、通常旅行は start/end から算出）
  itineraries?: number   // itinerary アイテム数
  photos?: number        // 写真枚数（将来拡張）
  checklists?: number    // チェックリスト項目数（全チェックリストの合計行数）
}

interface Trip {
  // 既存フィールド
  // id, title, start_date, end_date, is_template, day_count, ...
  stats?: TripStats
}
```

#### 2.2 Firestore ドキュメント構造

- `trips/{tripId}` ドキュメントに `stats` フィールドを追加:

```jsonc
{
  "title": "春の台湾・台北と九份",
  "start_date": "...",
  "end_date": "...",
  "is_template": false,
  "day_count": 4,
  "stats": {
    "days": 4,
    "itineraries": 12,
    "photos": 48,
    "checklists": 6
  }
}
```

- 当面は `stats` を Trip ドキュメントにインラインで持たせる（サブコレクションに分離しない）。
  - 理由: `/home` や `/plan` など、Trip 一覧で同時に表示したい情報であり、追加リード無しで取得したい。

---

### 3. 各属性の算出ルール

#### 3.1 `stats.days`

**テンプレート（date無し）**

- 判定条件:
  - `trip.is_template === true`（もしくは mode/flags でテンプレート判定）
- 算出ルール:
  - `stats.days = trip.day_count`（既存フィールドをそのまま利用）
  - `day_count` が存在しないテンプレートは、`days` を `undefined` にして UI で非表示にする。

**通常の旅行（期間あり）**

- 判定条件:
  - `is_template === false` かつ `start_date` / `end_date` が両方存在。
- 算出ルール:
  - `days = (end_date - start_date)` を日単位で丸めた値 + 1 日。
  - 例: 11/10〜11/12 → 3 days。
  - 不正な日付（`end_date < start_date` など）は `days` を設定せず、ログ出力のみ。

**実装ポイント**

- 既存の `dateUtils.formatFutureTripDate` / `formatPastTripDate` と整合をとる（days の定義を揃える）。

#### 3.2 `stats.itineraries`

**定義**

- 1 Trip に紐づく itinerary アイテム（`itineraries` コレクションなど）の総数。

**更新タイミング**

- itinerary を **追加** したとき: `stats.itineraries++`
- itinerary を **削除** したとき: `stats.itineraries--`（0 未満にならないようガード）
- バルク変更（コピー・日付移動など）:
  - 可能であれば差分数を算出して一括で加減（パフォーマンスを考慮）。
  - 難しいケースは「再計算 API」を別途用意して、バックグラウンドで修正する。

**実装箇所の候補**

- Itinerary 関連 API ルート:
  - `app/api/trip/[tripSlug]/day/route.ts`
  - `app/api/trip/[tripSlug]/...` 系の itinerary CRUD ハンドラ
- 変更方針:
  - 既存の「itinerary 作成／削除」処理の直後に `Trip.stats.itineraries` の `increment` / `decrement` を追加。

#### 3.3 `stats.photos`

**現状**

- 写真アップロード機能（Trip ごとのアルバムや添付画像）の仕様がまだ固まりきっていない。

**方針**

- 今回は **フィールド定義のみ** 行い、実数の更新ロジックは「写真アップロード仕様が決まり次第」別タスクで実装する。
- 想定されるソース:
  - Storage パスのカウント（`trips/{tripId}/photos/*` の数）を Admin サイドで定期集計。
  - 画像メタデータドキュメント数でカウント（推奨）。

#### 3.4 `stats.checklists`

**定義**

- 1 Trip に紐づくチェックリストの「総アイテム数」。
  - シンプル案: checklist ごとの `items.length` の合計。
  - 高度案: 「完了済み」「未完了」なども区別する場合は別フィールドに分ける。

**更新タイミング**

- チェックリスト項目を **追加** したとき: `stats.checklists++`
- チェックリスト項目を **削除** したとき: `stats.checklists--`
- チェック状態のトグルは、`stats.checklists` には影響させない（別の完了数フィールドにしない限り）。

**実装箇所の候補**

- Checklist 関連 API ルート:
  - `app/api/trips/[tripSlug]/checklist/route.ts`
  - `app/api/trips/[tripSlug]/checklist/apply-preset/route.ts` など
- 変更方針:
  - 新規 item 追加／削除処理の直後に `Trip.stats.checklists` を `increment` / `decrement`。
  - プリセット適用など複数項目を一括追加する処理では、追加件数分まとめて `increment` する。

---

### 4. 更新フローと整合性保持

#### 4.1 書き込み順序とトランザクション

- `stats` の更新は、関連するドキュメント（itineraries / checklists）との整合性を保つ必要がある。
- 理想的には Firestore トランザクション or バッチを利用し、以下を **1 単位の書き込み** とする:
  - itinerary ドキュメントの追加／削除。
  - Trip ドキュメントの `stats.itineraries` 更新。

#### 4.2 再計算 API の用意

- 過去データや一時的な不整合に備え、以下のようなメンテナンス用 API / スクリプトを用意する:
  - `scripts/recalculate-trip-stats.ts`（管理者向けバッチ）
    - 全 Trip を走査し、days / itineraries / checklists をフルスキャンで再計算して `stats` を上書き。
  - もしくは `app/api/admin/trip-stats/recalculate` のような保守用エンドポイント（認証・認可必須）。

---

### 5. UI 側での利用方針

**/home My Shares**

- これまでモックで持っていた `attributes` を、実データの `trip.stats` に置き換える:

```ts
const days = trip.stats?.days
const venues = trip.stats?.itineraries
const photos = trip.stats?.photos
const checklists = trip.stats?.checklists
```

- 値が `undefined` の場合は、その属性バッジを非表示にする。

**/plan**

- 既に `TripCard` に `accent="upcoming"` を付与しているため、将来的に:
  - `stats.days` や `stats.itineraries` を `TripCard` で表示する際にも、`Trip.stats` をそのまま利用可能。

**その他ビュー（memories / profile など）**

- Trip 一覧を持つ他のページでも、`Trip.stats` を参照することで、共通の属性行コンポーネントを再利用できる。

---

### 6. 実装ステップ案

1. **型・スキーマ整備**
   - `lib/core/types.ts` の `Trip` に `stats` を追加。
   - Firestore への書き込み時に `stats` を許容するよう、必要であればバリデーション／スキーマも更新。

2. **既存データに対する backfill スクリプト作成**
   - `scripts/recalculate-trip-stats.ts` を作成。
   - 現行データから `stats.days` / `stats.itineraries` / `stats.checklists` を一括計算して埋める。
   - `stats.photos` は将来対応のため 0 もしくは undefined のままでよい。

3. **Itinerary / Checklist CRUD へのインクリメンタル更新ロジック追加**
   - 関連 API ルートに、`stats.itineraries` / `stats.checklists` の `increment` / `decrement` を追加。
   - テスト: 単一操作ごとに統計値が期待通り増減することを確認。

4. **/home My Shares の UI を Trip.stats に切り替え**
   - `MY_SHARED_TRIPS` のモック `attributes` を削除。
   - 実 Trip データ＋`stats` を前提にしたコンポーネントへ移行。

5. **将来: 写真アップロード仕様確定後、stats.photos 実装**
   - 写真メタ情報の保存先を確定。
   - アップロード／削除時に `stats.photos` を更新するロジックを追加。

---

### 7. 補足メモ

- 事前集計は「完全に正確であること」よりも「概算で十分な UI（例: My Shares の属性行）」に向いている。
- 正確な統計が必要な画面（例: 詳細な利用統計）では、必要に応じて別途フルスキャン or 専用集計を検討する。
- 本計画の実装に着手する前に、`Trip` 型と既存の Day / Itinerary / Checklist モデルを一度俯瞰し、フィールド名・責務がぶれないように整理しておくと後のリファクタが楽になる。


