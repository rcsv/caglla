## /api/trips/my-shares API 計画

### 1. ゴール

- `/home` 左カラムの **My Shares タブ** で表示する「自分がシェアした旅行リスト」を、実データベース上の Trip から取得するための専用 API を定義する。
- 取得したデータは、すでに導入済みの `Trip.stats`（days / itineraries / photos / checklists）および `social_stats` を含み、My Shares カードの UI にそのままマッピングできる形にする。

---

### 2. エンドポイント仕様（v1）

#### 2.1 ベース

- **Method**: `GET`
- **Path**: `/api/trips/my-shares`
- **認証**: 必須（`Authorization: Bearer <idToken>` / 既存の `authApi` ミドルウェアを利用）

#### 2.2 クエリパラメータ（将来拡張を見据えた v1 仕様）

- `limit?: number`  
  - 1ページあたりの最大取得件数（デフォルト: 20、最大: 50 程度を想定）
- `cursor?: string`  
  - ページネーション用カーソル（`startAfter` に相当）
- `status?: 'active' | 'upcoming' | 'completed' | 'all'`（将来用、v1 では未使用 or 無視でもよい）
- `template?: 'include' | 'only' | 'exclude'`（テンプレートプランを含めるかどうかのフィルタ）

v1 実装段階では、まず `limit` / `cursor` のみをサポートし、他は予約済みパラメータとしておく。

---

### 3. データ抽出ルール

#### 3.1 ベースとなる Trip セットとクエリ

**条件:**

1. `trip.user_id === currentUserId`
2. `trip.access_level` が「公開系」のもの  
   - v1 時点では `access_level in ('public', 'shared')` を候補としつつ、既存データを確認して最終決定。
3. `trip.is_template` はフィルタオプション次第（`template` パラメータ）:
   - `template=exclude`（デフォルト）: `is_template !== true` のみ
   - `template=only`: `is_template === true` のみ
   - `template=include`: 両方

**アクセスレベルの前提:**

- `access_level = 'public'`:
  - 誰でも URL を知っていればアクセス可能な公開 Trip（検索やカタログ用）。
- `access_level = 'shared'`:
  - 「リンクを知っていれば見られる」共有状態（ログイン要否やフォロワー限定などは別軸で管理する前提）。
  - 将来の「followers 限定」「特定ユーザーへの共有」などは別フィールドで表現し、`access_level` 自体は「公開の度合い」を表す。

**ソース（クエリ方針）:**

**注意**: Firestore の `in` クエリと `orderBy` の組み合わせには複合インデックスが必要なため、
実装では**クエリ分割方式**を採用しています。

- v1 から **共通クエリヘルパー `getUserTripsWithBackwardCompatibility` を使用**:

```ts
// 実装方式（クエリ分割 + マージ）
// 1. auth_uid でクエリ実行
collection('trips')
  .where('user_id', '==', auth_uid)
  .limit(limit * 2)

// 2. google_id でクエリ実行（存在する場合）
collection('trips')
  .where('user_id', '==', google_id)
  .limit(limit * 2)

// 3. 結果をマージしてクライアント側でソート
// 4. access_level でフィルタ（'public' または 'unlisted'）
// 5. updated_at 降順でソート
// 6. limit に合わせて切り詰め
```

- **カーソル処理**:
  - カーソルはエンコード形式（`timestamp_docId` を base64 エンコード）
  - **注意**: 現在の実装では Firestore の `startAfter` は使用していない
  - カーソルは「最後に取得したドキュメントの位置情報」として保持するのみ
  - ページネーションの正確性は保証されない（実用的には許容誤差）

#### 3.2 ソート順

- デフォルトソート: **最近更新順**（`updated_at desc`）
- クライアント側でソート（Firestore の `orderBy` は使用していない）
- 共有日ベースのソート（`shared_month_label` など）は将来の要件で検討。

---

### 4. レスポンスフォーマット

#### 4.1 返却 JSON 形（`Trip` エイリアスを利用）

```ts
type MySharedTrip = Trip

type MySharesResponse = {
  trips: Array<MySharedTrip>
  nextCursor?: string
}
```

**ポイント:**

- `Trip` 型には既に `stats` / `social_stats` が含まれているため、**特別な DTO を新設せず** `Trip` をそのまま返す方が型の一貫性は高い。
- ただし将来的に `/plan` や `/profile` でも似たような「共有 Trip 一覧」API が増えた場合に備え、レスポンス型 `MySharedTrip` はエイリアスとして切っておくとリファクタが楽。

#### 4.2 返却例（イメージ）

```jsonc
{
  "trips": [
    {
      "id": "trip_abc",
      "user_id": "user_123",
      "title": "春の台湾・台北と九份",
      "slug": "taiwan-spring",
      "status": "COMPLETED",
      "access_level": "public",
      "is_template": false,
      "start_date": "2025-03-10T00:00:00.000Z",
      "end_date": "2025-03-13T00:00:00.000Z",
      "stats": {
        "days": 4,
        "itineraries": 12,
        "photos": 48,
        "checklists": 6
      },
      "social_stats": {
        "likes_count": 54,
        "comments_count": 12,
        "shares_count": 4
      },
      "created_at": "...",
      "updated_at": "2025-03-20T10:00:00.000Z"
    }
  ],
  "nextCursor": "..." // 2ページ目以降がある場合のみ
}
```

---

### 5. 実装方針（サーバー側）

#### 5.1 ルートファイルの追加とページネーション

- `app/api/trips/my-shares/route.ts` を新規作成。
- `authApi` ミドルウェアを利用して認証済みユーザーとして実行。

実装コード（概要）:

```ts
export const GET = authApi(async (request, ctx) => {
  const { userId } = ctx.auth!

  const { searchParams } = new URL(request.url)
  const limit = clamp(parseInt(searchParams.get('limit') ?? '20', 10), 1, 50)
  const cursor = searchParams.get('cursor') ?? null
  const templateFilter = searchParams.get('template') ?? 'exclude'

  // 共通クエリヘルパーを使用
  const { trips, lastDoc } = await getUserTripsWithBackwardCompatibility({
    userId,
    additionalFilters: {
      isTemplate: templateFilter === 'only' ? true : templateFilter === 'exclude' ? false : undefined,
    },
    limit: limit * 2, // access_level フィルタで減る可能性があるため、多めに取得
    orderBy: {
      field: 'updated_at',
      direction: 'desc',
    },
  })

  // access_level でフィルタ（Firestore の 'in' クエリ制限を回避）
  let filteredTrips = trips.filter(
    (trip) => trip.access_level === 'public' || trip.access_level === 'unlisted'
  )

  // テンプレートフィルタ（デフォルト: exclude）
  if (templateFilter === 'exclude') {
    filteredTrips = filteredTrips.filter((trip) => trip.is_template !== true)
  } else if (templateFilter === 'only') {
    filteredTrips = filteredTrips.filter((trip) => trip.is_template === true)
  }

  // limit に合わせて切り詰める（フィルタで減った分を考慮）
  filteredTrips = filteredTrips.slice(0, limit)

  // カーソルをエンコード（lastDoc がある場合のみ）
  const nextCursor = lastDoc ? encodeCursor(lastDoc) : undefined

  return NextResponse.json<MySharesResponse>({
    trips: filteredTrips,
    nextCursor,
  })
})
```

**注意事項**:
- 現在の実装では Firestore の `startAfter` は使用していない
- カーソルは「最後に取得したドキュメントの位置情報」として保持するのみ
- ページネーションの正確性は保証されない（実用的には許容誤差）
- 将来的にインデックス作成後、Firestore の `orderBy` + `startAfter` を使用することで改善可能

#### 5.2 例外・エラー処理

- 認証エラー: `authApi` が 401/403 を返す。
- アプリケーションエラー: `logger.error` で記録しつつ 500 を返却。
- `adminTripOperations.getTripsByUserId` 失敗時も同様。

---

### 6. UI への組み込み（/home My Shares タブ）

#### 6.1 フェッチ層

- `HomeMainTabs` 直下ではなく、より上位（例: `/home` ページ or `HomeMainTabs` の親コンポーネント）に **`useMyShares` フック**を作るのが望ましい。
- `useMyShares` は:
  - `/api/trips/my-shares` を叩いて `trips` を取得。
  - ローディング / エラー状態を管理。
  - ページネーション（あれば）も管理。

#### 6.2 MyShareManager での実データマッピング

- 現状の `MY_SHARED_TRIPS` モックを、`trips: Trip[]`（APIレスポンス）に差し替える。
- `Trip.stats` / `Trip.social_stats` から、既にデザイン済みの:
  - 属性行（days / venues[=stats.itineraries] / photos / checklists）
  - SNS メトリクス行（likes / comments / shares / clones）
 へマッピングする。
- 可能であれば、これらを `TripStatsRow` / `TripSocialStatsRow` のような共通コンポーネントに切り出して、`TripCard` との重複をなくす。

---

### 7. 今後の拡張余地

- フォロワー向けの「友人のシェア」フィード用に、`/api/trips/friends-shares` などの API を sibling として用意する。
- `status` / `template` / `country` / `tag` などのフィルタリングパラメータを追加し、My Shares を「自分用の公開旅ハブ」として強化する。
- `Trip.stats.photos` 実装後は、My Shares カードに写真枚数を正確に表示できるようになる。

---

### 8. 注意事項（実装と設計書の整合性）

#### 8.1 クエリ方式の違い

**設計書の当初の想定**:
- Firestore の `in` クエリ + `orderBy` + `startAfter` を使用

**実装での採用方式**:
- クエリ分割方式（`auth_uid` と `google_id` で個別にクエリ実行してマージ）
- クライアント側でソート（`updated_at` 降順）
- Firestore の `startAfter` は使用していない

**理由**:
- Firestore の `in` クエリと `orderBy` の組み合わせには複合インデックスが必要
- 後方互換性（`auth_uid` と `google_id` の両方に対応）を考慮した実用的な妥協策

#### 8.2 ページネーションの制限

**現在の実装の制限事項**:
- カーソルは「最後に取得したドキュメントの位置情報」として保持するのみ
- Firestore の `startAfter` を使用していないため、ページネーションの正確性は保証されない
- データの追加・更新によりページ間で重複やズレが発生する可能性がある
- 外部フィルタ（`access_level`、`template` など）により、アイテム数が減ると次ページが飛ぶ可能性がある

**実用的な扱い**:
- 旅行アプリの用途では許容誤差として扱う
- 将来的にインデックス作成後、Firestore の `orderBy` + `startAfter` を使用することで改善可能

#### 8.3 インデックス要件（将来の改善）

正確なページネーションを実現する場合は、以下の複合インデックスが必要:
- `user_id` (ascending) + `access_level` (ascending) + `updated_at` (descending)
- `user_id` (ascending) + `is_template` (ascending) + `access_level` (ascending) + `updated_at` (descending)

現時点ではクライアント側ソートにより、インデックス不要。


