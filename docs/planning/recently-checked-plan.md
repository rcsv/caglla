## Recently You Checked - v1 実装計画（localStorage ベース）

### 1. 全体方針

- v1 として **localStorage ベース** で「Recently You Checked」を実装する（サーバースキーマ変更なし）。
- 「どの Trip をいつ見たか」を **planner 側で記録**し、`/home` で読み出して表示する。
- 安定したら、必要に応じて Firestore に永続化できるようなインターフェース設計にしておく。

---

### 2. 仕様整理

#### 2.1 何を「チェック」とみなすか

- **候補A: planner 画面の閲覧 (`/[userSlug]/[tripSlug]`)**
  - Trip の詳細ページを開いたときだけカウント。
  - 実装しやすく、ユーザーの「本当に見た」履歴に近い。
- **候補B: `/plan` のカードホバー／クリック**
  - 一覧上で軽く確認したものも含めたい場合。
- **v1 では候補Aのみ採用**（planner 詳細ページ閲覧時のみ記録）。

#### 2.2 保存するデータ

`RecentTripEntry`（仮）:

- `tripId: string`
- `slug: string`
- `creatorSlug: string`
- `title: string`
- `destination: string | undefined`（`destination_place.name` または `destination`）
- `destinationPlaceId: string | undefined`
- `viewedAt: string`（ISO 8601）

#### 2.3 表示ルール（/home）

- 1 ユーザーあたり **最大 5 件** 表示。
- `viewedAt` 降順（新しいものが上）。
- 同じ `tripId` は最新 1 件のみ（古いものは上書き）。
- v1 では Ongoing / Upcoming と重複して表示されても OK（シンプルさ優先）。

---

### 3. localStorage ヘルパーの実装

新規ファイル例: `lib/utils/recent-trips.ts`

- 定数:
  - `const RECENT_TRIPS_KEY = 'recent_trips_v1'`
- 型:
  - `export interface RecentTripEntry { ... }`
- 関数:
  - `getRecentTrips(): RecentTripEntry[]`
    - `localStorage.getItem(RECENT_TRIPS_KEY)` をパース。
    - 失敗時は空配列を返す。
    - SSR ガード: `if (typeof window === 'undefined') return []`
  - `addRecentTrip(entry: RecentTripEntry): void`
    - `getRecentTrips()` で既存配列を取得。
    - 同一 `tripId` を削除。
    - 新しい `entry` を先頭に `unshift`。
    - `slice(0, 5)` で最大 5 件に制限。
    - `localStorage.setItem(RECENT_TRIPS_KEY, JSON.stringify(list))`。
- 注意:
  - ヘルパー内では **ブラウザ環境チェック** を必ず行う（SSR 対応）。

---

### 4. planner 側での記録フック

対象: `app/(planner)/[userSlug]/[tripSlug]/page.tsx` もしくはレイアウトコンポーネント。

1. Trip データ取得後のコンポーネント内で `useEffect` を追加:

```ts
useEffect(() => {
  if (!trip || !trip.id) return
  if (typeof window === 'undefined') return

  addRecentTrip({
    tripId: trip.id,
    slug: trip.slug ?? '',
    creatorSlug: trip.creator?.slug ?? '',
    title: trip.title ?? trip.destination ?? 'Untitled Trip',
    destination: trip.destination_place?.name ?? trip.destination,
    destinationPlaceId: trip.destination_place_id,
    viewedAt: new Date().toISOString(),
  })
}, [trip?.id])
```

2. 依存配列を `trip?.id` 程度に絞り、同ページ内の再レンダーで多重記録されないようにする。

---

### 5. `/home` での読み出しと表示

1. `HomePage`（`app/home/page.tsx`）で:
   - クライアントコンポーネントなので `useEffect` か `useState` をそのまま利用可能。
2. 実装イメージ:

```ts
const [recentTrips, setRecentTrips] = useState<RecentTripEntry[]>([])

useEffect(() => {
  setRecentTrips(getRecentTrips())
}, [])
```

3. 既存の「Recently You Checked」枠の中身を、`recentTrips` による `map` に差し替える:
   - `/home-v2` のモックレイアウトを踏襲しつつ、`recentTrips` から `title` / `destination` / `viewedAt` を表示。
4. 0 件のとき:
   - 現在のプレースホルダー文言を少し調整し、例:
     - `"You haven’t viewed any trips recently."`

---

### 6. 型・UX の微調整ポイント

- `RecentTripEntry` の定義場所:
  - 当面は `lib/utils/recent-trips.ts` 内で完結させる。
  - 将来サーバー永続化する場合は `lib/core/types` などに移動しても良い。
- フォールバック:
  - `title` / `destination` が欠けるケースに備え、UI側でも `|| 'Untitled Trip'` / `|| 'No destination'` を維持。
- 並び順:
  - `addRecentTrip` の段階で配列先頭＝最新にしているので、`/home` 側では単純な `map` で OK。

---

### 7. 将来の拡張（Firestore 永続化）への布石

v1 実装時点で、以下をコメントや設計メモとして残しておく:

- `recent-trips.ts` 内:
  - TODO: Firestore バックエンド実装 (`/api/recent-trips`) に差し替える場合、`getRecentTrips` / `addRecentTrip` を API 呼び出しラッパに変更する。
- planner の `useEffect` 内:
  - TODO: localStorage ではなく API に `POST /api/recent-trips` してサーバー保存する形に切り替える。

この構成にしておくことで、まずは **localStorage で挙動とUXを検証し、問題なければバックエンド対応にスムーズに移行**できる。


