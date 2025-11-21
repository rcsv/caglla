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

### 7. UX・バグ抑制のための追加指針（v1 localStorage 版）

ローカル検証用とはいえ、v1 時点で押さえておくと「地味に効く」ポイントを整理しておく。
ここでは、実装時に **必須で反映しておきたいもの（P1）** と、**余裕があれば取り込みたいもの（P2）** を分けて記載する。

#### 7.1 `/home` 初期レンダー時のちらつき防止（P1）

現状案だと:

- 初期レンダー: `recentTrips = []`
- `useEffect` で `localStorage` を読み込む
- 再レンダーで Recently ブロックが「急に現れる」

という流れになり、UX がややチープになる。

**v1 の対案:**

- `recentTrips` の型を `RecentTripEntry[] | null` にする。
- `null` を「読み込み中」、`[]` を「履歴なし」として扱い、UI を出し分ける。

実装イメージ:

```ts
const [recentTrips, setRecentTrips] = useState<RecentTripEntry[] | null>(null)

useEffect(() => {
  setRecentTrips(getRecentTrips())
}, [])
```

- `recentTrips === null` の場合は Skeleton / ローディング文言を表示。
- `recentTrips?.length === 0` の場合は「まだ履歴がありません」のコピーを表示。

#### 7.2 localStorage 破損時の安全なリセット（P1）

`getRecentTrips()` では JSON パースエラーが発生しうる（特に Safari / シークレットモード）。
単に `try/catch` で空配列を返すだけでなく、**壊れた値を削除しておく** と、以後の挙動が安定する。

**v1 の対案:**

- `getRecentTrips()` 内で `JSON.parse` を `try/catch` で囲み、失敗したら `localStorage.removeItem(RECENT_TRIPS_KEY)` を実行してから `[]` を返す。

```ts
export function getRecentTrips(): RecentTripEntry[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(RECENT_TRIPS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as RecentTripEntry[]
  } catch {
    // 破損している場合は一度クリアしてから空配列に戻す
    try {
      window.localStorage.removeItem(RECENT_TRIPS_KEY)
    } catch {
      // noop
    }
    return []
  }
}
```

#### 7.3 `addRecentTrip` で slug を常に最新値に揃える（P1）

`tripId` をキーにユニーク化する戦略自体は良いが、slug が変更された場合、
localStorage 上には古い URL が残り続けてしまう。

**v1 の対案:**

- `addRecentTrip` 実装時に、同一 `tripId` が存在していた場合は、**そのエントリの slug を最新値で上書きする**。

```ts
export function addRecentTrip(entry: RecentTripEntry): void {
  if (typeof window === 'undefined') return

  const list = getRecentTrips()
  const filtered = list.filter(item => item.tripId !== entry.tripId)

  // 既存エントリがあれば slug などを更新してから使い回すこともできるが、
  // v1 ではシンプルに「新規 entry を先頭に置く」戦略にする。
  const next = [entry, ...filtered].slice(0, 5)

  // NOTE: 必要に応じて requestIdleCallback を利用（7.7 参照）
  window.localStorage.setItem(RECENT_TRIPS_KEY, JSON.stringify(next))
}
```

- より厳密にやる場合は、`filtered` 生成前に既存エントリを探し、`slug` / `title` などを更新してから `entry` を組み立てても良いが、v1 では上記のシンプル版で十分。

#### 7.4 planner 側の `useEffect` 依存を `tripSlug` ベースにする（P1）

元案では `useEffect` の依存配列が `trip?.id` になっているが、Next.js App Router ではルートキャッシュや再利用の挙動により、
**同じコンポーネントインスタンスのまま `tripSlug` が変化する** ケースがありうる。

この場合、`trip.id` が変わらない限り `useEffect` が再発火しないため、「別の Trip に遷移したのに履歴が残らない」という不整合が起こりうる。

**v1 の対案:**

- `app/(planner)/[userSlug]/[tripSlug]/page.tsx` 内では、`useParams` から取得した `tripSlug` を依存に使う。
- `trip` 自体がまだ `null` のタイミングもあるため、`!trip` ガードは維持する。

```ts
const { userSlug, tripSlug } = useParams<{ userSlug: string; tripSlug: string }>()

useEffect(() => {
  if (!trip || !trip.id) return
  if (typeof window === 'undefined') return

  addRecentTrip({
    tripId: trip.id,
    slug: trip.slug ?? tripSlug,
    creatorSlug: trip.creator?.slug ?? userSlug,
    title: trip.title ?? trip.destination ?? 'Untitled Trip',
    destination: trip.destination_place?.name ?? trip.destination,
    destinationPlaceId: trip.destination_place_id,
    viewedAt: new Date().toISOString(),
  })
}, [tripSlug])
```

- これにより、「URL（`/[userSlug]/[tripSlug]`）」さえ変われば履歴追加が必ず 1 回走るようになり、App Router のキャッシュ挙動に影響されにくくなる。

#### 7.5 `localStorage` 書き込み頻度とタイミングの調整（P2）

v1 ではそれほど問題にならないが、頻繁なページ遷移があるユーザーでは `localStorage.setItem` の同期 I/O が積み重なる可能性がある。

**v1 の対案（任意だが推奨）:**

- 簡易的に「直近 1 秒以内に同じ `tripId` への書き込みがあればスキップ」する、もしくは
- `requestIdleCallback` が利用可能な環境では、書き込みをアイドル時間に逃がす。

例:

```ts
function safeSetRecentTrips(list: RecentTripEntry[]) {
  const write = () => {
    try {
      window.localStorage.setItem(RECENT_TRIPS_KEY, JSON.stringify(list))
    } catch {
      // 容量オーバーなどは黙って無視（履歴が残らないだけなら致命的ではない）
    }
  }

  if (typeof (window as any).requestIdleCallback === 'function') {
    ;(window as any).requestIdleCallback(write)
  } else {
    write()
  }
}
```

`addRecentTrip` 内では `safeSetRecentTrips(next)` を呼ぶだけにしておくと、将来 Firestore や他ストレージに差し替えるときにも影響範囲を限定できる。

#### 7.6 「一瞬だけ開いたページ」まで履歴に残さない（P2）

Trip ページを誤タップしたり、すぐ戻った場合まで履歴に残ると、Recently リストがノイズで埋まりやすい。

**v1 の対案（任意）:**

- planner 側の `useEffect` で、**500〜800ms 程度の滞在時間を確認してから `addRecentTrip` を呼ぶ**。

```ts
useEffect(() => {
  if (!trip || !trip.id) return
  if (typeof window === 'undefined') return

  const timer = window.setTimeout(() => {
    addRecentTrip(/* ... */)
  }, 700)

  return () => window.clearTimeout(timer)
}, [tripSlug])
```

- これにより、「実質見ていないページ」が Recently に紛れ込みにくくなる。

#### 7.7 他タブでの更新をどこまで同期するか（P2）

v1 の要件としては必須ではないが、「複数タブで planner を開きっぱなし」のユーザーにとっては、他タブで閲覧した Trip が `/home` にすぐ反映されると体験が良い。

**v1 の対案（任意）:**

- `/home` 側コンポーネントで `storage` イベントを購読し、`RECENT_TRIPS_KEY` が変化したときだけ `getRecentTrips()` で再読み込みする。

```ts
useEffect(() => {
  const handler = (e: StorageEvent) => {
    if (e.key && e.key !== RECENT_TRIPS_KEY) return
    setRecentTrips(getRecentTrips())
  }
  window.addEventListener('storage', handler)
  return () => window.removeEventListener('storage', handler)
}, [])
```

- これにより「別タブで旅を開いた → ホームに戻ると反映済み」という挙動になる。

#### 7.8 slug 変更と URL 仕様についての方針（P3）

`tripSlug` が後から変更された場合、localStorage に保存された古い slug を使うと 404 になる懸念がある。
ただし、本プロジェクト全体の方針としては **slug ベースの URL を一貫して利用する** ことが既に決まっているため、
v1 の段階で ID ベースの URL に戻すことはしない。

**v1 の方針:**

- `RecentTripEntry` には引き続き `slug` を保存し、URL も `/${creatorSlug}/${slug}` 形式を使用する。
- slug 変更は「頻度としてはまれ」という前提とし、必要であれば将来:
  - slug 変更時にリダイレクト用のエイリアスを持つ、
  - もしくは Firestore 版の「最近見た履歴」実装時に ID ベースで解決する、
 などのサーバーサイド対応で吸収する。

---

### 8. 将来の拡張（Firestore 永続化）への布石

v1 実装時点で、以下をコメントや設計メモとして残しておく:

- `recent-trips.ts` 内:
  - TODO: Firestore バックエンド実装 (`/api/recent-trips`) に差し替える場合、`getRecentTrips` / `addRecentTrip` を API 呼び出しラッパに変更する。
- planner の `useEffect` 内:
  - TODO: localStorage ではなく API に `POST /api/recent-trips` してサーバー保存する形に切り替える。

この構成にしておくことで、まずは **localStorage で挙動とUXを検証し、問題なければバックエンド対応にスムーズに移行**できる。


