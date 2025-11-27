## /home 「My Shares」カードを実データに載せる際の論点整理

### 1. 属性（days / venues / photos / checklists）をどこから取るか問題

**現状（モック）**

- `components/home/HomeMainTabs.tsx` 内の `MY_SHARED_TRIPS` は、`attributes: { days, venues, photos, checklists }` を手書きで持っているだけ。
- 実データでは、これらの値は `Trip` 単体からは直に取れない（別コレクションやサブドキュメントに分散している）。

**想定される実データのソース**

- `days`（日数）
  - テンプレート（date無し）: `day_count` フィールド、もしくは `days` コレクションの件数。
  - 通常の旅行: `start_date` と `end_date` からの差分日数。
- `venues`（スポット数）
  - `itineraries` コレクション内で `place_id` を持つアイテム数。
- `photos`（写真枚数）
  - アップロード済み画像のメタ情報（現時点では仕組みが未整備／未集約）。
- `checklists`（チェックリスト項目数）
  - `checklist` ドキュメントの item_count、
  - もしくは checklist 内の行数。

**課題**

- 上記を `/home` クライアントで「その場で集計」すると、1ユーザーあたりの Trips × Days × Itineraries × Checklist への N+1 クエリ／走査になり、パフォーマンス・課金コストの両面で重くなる。
- ページ表示のたびに Firestore から多数のドキュメントを読み込む設計になりがちで、モバイル回線での UX が悪化する。

### 2. パフォーマンスと集約戦略（リアルタイム集計 vs 事前計算）

**リアルタイム集計案（ボツ候補）**

- `/home` ロード時に、必要なサブドキュメント（days, itineraries, checklists, photos）をすべて読み込み、その場で集計する。
- 長所: 実装が直感的でわかりやすい。
- 短所:
  - 読み込み量が多く、Firestore 読み取りコストが高い。
  - ページ表示までの待ち時間が伸びる。
  - キャッシュ・再利用の仕組みを自前で整えないとスケールしない。

**事前集計（pre-aggregation）案**

- `Trip` ドキュメント自体、もしくは専用の `trip_stats` サブドキュメントに **集計済みの数値を保存** しておく。
- 集計は:
  - Trip の作成／更新時、
  - day / itinerary / checklist / photo の追加・削除時、
  にインクリメンタルに更新する。
- `/home` では `Trip`（＋`trip_stats`）を読むだけで、属性行に必要な数字が即座に取れる。

**結論（方針）**

- My Shares を含む `/home` のダッシュボード用途では、**事前集計（pre-aggregation）を基本方針とする**。
- リアルタイム集計は、デバッグ用途や一部のスモールビュー（例: 詳細ページでの補助情報）に限定する。

### 3. 「自分のシェア」の定義と取得 API

**必要になる条件**

- 「自分のシェア」は、少なくとも以下を満たす Trip 群:
  - `trip.creator.uid === currentUser.uid`（もしくは `creator_id` での一致）
  - `trip.access_level === 'public'` もしくは「リンク限定」「フォロワー限定」など何らかのシェア設定を持つ。

**取得戦略候補**

- クライアントサイドフィルタ:
  - `/api/trips` 等で「自分の Trip 全件」を取得し、クライアント側でシェア条件に合致するものだけを抽出。
  - 簡便だが、Trip 数が増えると無駄が多い。
- 専用 API:
  - `/api/trips/my-shares` のようなエンドポイントで、サーバー側が「自分の Trip のうち、共有状態のものだけ」をクエリ＋フィルタして返却。
  - `/home` ではこの API を叩くだけで My Shares カード用データが揃う。

**検討ポイント**

- 将来的にフォロワーなどのソーシャルグラフが増える前提だと、**専用 API でのフィルタリング**を前提に設計した方が筋が良い。

### 4. SNS系メトリクス（likes / comments / shares / clones）のソース統一

**現状**

- `TripCard` では、`trip.social_stats` や `likes_count` を使うロジックが既に存在。
- My Shares モックでは、`stats: { likes, comments, saves, clones }` を独自に持っている。

**課題**

- 同じ「Trip の SNS メトリクス」を、画面ごとに別のプロパティ構造で扱っていると:
  - 表示の整合性が取れない。
  - 将来、メトリクスが増えたり仕様が変わったときに修正漏れが発生しやすい。

**方向性**

- `Trip` モデルの `social_stats` を **唯一の正（single source of truth）** とし、  
  レガシーフィールド（`likes_count` など）は「古いデータのフォールバック」に限定して使う。
- My Shares カード・`TripCard`・`TripFeed` など、Trip ベースの UI はすべて:
  - likes: `trip.social_stats?.likes_count ?? trip.likes_count ?? 0`
  - comments: `trip.social_stats?.comments_count ?? 0`
  - shares/saves: `trip.social_stats?.shares_count ?? 0`
  - clones/replicas: `trip.social_stats?.replicas_count ?? 0`
  を共通ルールとして参照する。
- フロント側では、これらを `TripSocialStatsRow`（仮）などの共通コンポーネントに寄せ、  
  My Shares も `TripCard` も **同じ UI コンポーネントから SNS 行を描画**する。

**バックエンド側の前提**

- `lib/core/types/social.ts` の `TripSocialStats` は、すでに:
  - `likes_count`
  - `comments_count`
  - `shares_count`
  - `views_count`
  - `replicas_count`
  を持つ「事前集計済みカウンタ」として定義されている。
- `lib/social/trip-likes.ts` / `lib/social/trip-comments.ts` では:
  - いいね／コメントの追加・削除時に `FieldValue.increment()` で `social_stats.*` を更新しており、
  - クライアントから見ると `Trip.social_stats` を読むだけで最新値が取得できる。
- シェア数・複製数（`shares_count` / `replicas_count`）は、  
  今後導入予定のシェア／テンプレート複製フローの中で同様に `increment()` する想定。

### 5. 共通コンポーネント化の必要性（二重実装のリスク）

**現在の構造**

- `/home` right カラム: `OngoingTripCard` / `UpcomingTripCard`
- `/home` left カラム: `FriendsTimeline` / `PlanCatalog` / `MyShareManager`
- `/plan`: `TripCard`（標準・imageFull・horizontal）

**問題点**

- タイトル・行き先・日付・SNSメトリクスなど、同種の情報を複数コンポーネントが別々のレイアウトで表示している。
- CSS クラスやアイコン構成が似通っているが、完全一致していないため「デザインがじわじわズレる」リスクが高い。

**対応方針（My Shares を最新版プロトタイプとして採用する）**

- `/home` の My Shares で作成した UI を **「最新版のデザインプロトタイプ」** とし、  
  以降は他コンポーネントをこの構造に「従属させる／寄せていく」方針で進める。

**将来切り出す共通要素（My Shares を起点に定義）**

- 少なくとも以下の要素は、My Shares 実装をベースに共通サブコンポーネント化する:
  - **行き先行**: ピンアイコン＋都市名（`destination_place.name` / `destination`）  
    → 例: `TripDestinationLine`
  - **日付レンジ行**: `formatFutureTripDate` / `formatPastTripDate` をラップした統一表示  
    → 例: `TripDateRangeLine`
  - **属性行**: days / venues / photos / checklists をアイコン＋数値で表示する行  
    → 例: `TripStatsRow`
  - **SNSメトリクス行**: likes / comments / shares / replicas を `resolveSocialStats(trip)` ベースで表示する行  
    → 例: `TripSocialStatsRow`

**進め方（段階的な従属化プラン）**

1. **My Shares 実装の安定化（現状ステップ）**
   - /home の My Shares カードを、Trip + `Trip.stats` + `social_stats` ベースの「完成形 UI プロトタイプ」として固定。
   - 属性行・SNS行のクラス構成とアイコンセットをここで先に決めておく。

2. **共通 Row コンポーネントの抽出**
   - My Shares から「属性行」と「SNS行」の JSX をそのまま切り出し、  
     `components/tripcard/TripStatsRow.tsx` / `TripSocialStatsRow.tsx`（仮）として実装。
   - Props は極力 `Trip` or `ResolvedTripStats` / `ResolvedTripSocialStats` を受け取り、  
     UI 側でのプロパティ名変換を不要にする。

3. **TripCard 側を My Shares ベースに寄せる**
   - `/plan` の `TripCard` から、既存の属性表示／SNS 表示を削減し、  
     代わりに `TripStatsRow` / `TripSocialStatsRow` を呼ぶ形にリファクタ。
   - これにより、/home My Shares と /plan 一覧の「見た目と情報密度」が揃う。

4. **その他ビュー（FriendsTimeline / PlanCatalog / dev-tools など）への伝播**
   - 友人フィードやテンプレートカタログでも、  
     可能な範囲で `TripStatsRow` / `TripSocialStatsRow` を利用し、  
     「SNS 行」や「属性行」が同じコンポーネント由来になるように整理。

5. **デザインチューニングの起点を My Shares に一本化**
   - SNS 行や属性行に関するデザイン調整は、**まず My Shares 上で行い、それを共通 Row に反映 → 他の画面はそれを自動的に継承**  
     というフローに統一する。
   - これにより、「Trip 関連カードの UI 変更は My Shares を直すだけで全体に波及する」状態を目指す。

6. **共通 Row コンポーネントの「中立性」と柔軟性を確保する**
   - Destination / Date の行コンポーネントは、**タイポグラフィや余白を持たない“素の行”** として実装する：
     - フォントサイズ・ウェイト・上下マージンは親カード側が制御し、Row はテキスト＋アイコンの並びだけを担当する。
   - `TripStatsRow` は、画面ごとに表示したい属性が変えられるようにする：
     - 例: `<TripStatsRow trip={trip} fields={['days', 'venues', 'photos', 'checklists']} />`
     - FriendsTimeline では `['photos']` だけ、テンプレートカタログでは `['days', 'photos']` だけ、のように調整可能にする。
   - `TripSocialStatsRow` は内部で更に小さな `SocialStatItem`（アイコン＋数値の Atom）を持つ 2 段構造にしておく：
     - 将来 `views_count` や新しい種類のシェアが増えても、`SocialStatItem` を追加するだけで UI 拡張が可能になる。

7. **TripCard 側の props を段階的に整理する**
   - 共通 Row を導入した後は、`TripCard` が直接持っている「行単位の表示用 props」を徐々に削減し、
     - タイトル／レイアウト／variant などカード固有の責務
     - Destination / Date / Stats / Social は Row コンポーネントに委譲
     に分離していく。
   - 最終的には、Trip に関する表示ロジックは Row コンポーネント群に集約し、`TripCard` は「どの Row をどの順序で並べるか」を決めるだけの薄いコンテナにする。

### 6. 0件・未設定ケースの表示ルール

**ケース例**

- 日程だけ決まっている（days は計算できるが、checklists は 0）。
- テンプレートで venues は未確定だが day_count はある。
- 写真アップロード機能未実装 or 利用していないユーザー。

**課題**

- 0 を「存在しない」とみなすか、「0件」と明示するかの UX ルールが必要。
- i18n を考えると、「0 days / 0 venues / 0 photos」を機械的に出すと、ややノイズになる可能性がある。

**暫定案**

- `null/undefined` → その属性自体を非表示。
- `0` → 将来の実装時点で、ユーザー調査または A/B テストにより「表示 / 非表示」を判断。

### 7. 属性ごとのテーマカラーとの整合性

**現在のカラー体系**

- ongoing（進行中）: インディゴ（`border-l-indigo-400` / ピンアイコンなど）
- upcoming（これから）: グリーン（`border-l-emerald-400`）
- template（プランテンプレート）: 薄オレンジ（`border-l-amber-300`）
- past（過去旅 / My Shares 的な過去共有）: グレー（`border-l-gray-300`）

**My Shares での扱い**

- 左側ボーダーをグレーにして「過去旅」感を出している。
- ただし、実データでは「今後の旅をシェア中」のケースもありうるため、単純に My Shares = グレーとは言い切れない。

**論点**

- Trip の状態（`isPastTrip` / `isUpcoming` / `isTemplate`）と、My Shares という「共有カテゴリ」の関係をどう整理するか。
- 共有中の旅が過去・未来・テンプレートいずれにもなりうる前提で、カラーは「状態」優先にするか「カテゴリ」優先にするか。

---

## まとめ

- `/home` の My Shares カードは、UI としては「旅の属性」と「SNS メトリクス」をコンパクトにまとめた理想形に近い。
- ただし、実データに載せるには:
  1. Trip 単体から取れない属性値（days / venues / photos / checklists）の **事前集計戦略**、
  2. 「自分のシェア」の定義と API 設計、
  3. `TripCard` を含む各ビュー間での **表示ロジックの共通化**、
  を同時に進める必要がある。

このファイルは、上記 UI を実 Trip データにマッピングする際の「課題カタログ」として扱う。実際の実装計画は別ファイルで詳細化する。


