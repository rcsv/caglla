# /home 検索機能の実装計画

## 現状分析

### 問題点
- `HomeMainTabs.tsx`に検索入力欄があるが、検索ロジックが実装されていない
- 各タブコンポーネント（`FriendsTimeline`, `IdeasCatalog`, `MyShareManager`）が検索クエリを受け取っていない
- フィルタチップもクリックイベントが実装されていない

### 対象タブ
1. **Friends Timeline** - フォロワーの旅行を表示
2. **Ideas Catalog** - テンプレートプランを表示
3. **My Shares** - 自分がシェアした旅行を表示

## 実装方針

### 1. 検索機能の実装

#### 1.1. `HomeMainTabs`での検索状態管理
- 検索クエリを`useState`で管理
- 検索入力欄に`onChange`ハンドラーを追加
- デバウンス処理（300ms）を実装
- 検索クエリを各タブコンポーネントにpropsで渡す

#### 1.2. 各タブでの検索ロジック

**FriendsTimeline**
- 検索対象: `title`, `destination`, `description`, `creator.name`
- 大文字小文字を区別しない部分一致検索

**IdeasCatalog**
- 検索対象: `title`, `destination`, `description`, `creator.name`
- 大文字小文字を区別しない部分一致検索

**MyShareManager**
- 検索対象: `title`, `location` (destination), `description`
- 大文字小文字を区別しない部分一致検索

### 2. フィルタ機能の実装

#### 2.1. フィルタ状態管理
- アクティブなフィルタを`useState`で管理
- フィルタチップにクリックイベントを追加
- 複数選択可能にするか、単一選択にするか検討

#### 2.2. 各タブでのフィルタロジック

**Friends Timeline**
- `all`: すべて表示
- `active`: アクティブな旅行のみ（`isTripActive`を使用）
- `recent`: 最近の旅行（作成日時でソート）
- `templates`: テンプレートのみ（`is_template === true`）

**Ideas Catalog**
- `area`: エリアでフィルタ（実装は将来対応）
- `duration`: 期間でフィルタ（実装は将来対応）
- `budget`: 予算でフィルタ（実装は将来対応）
- `theme`: テーマでフィルタ（実装は将来対応）

**My Shares**
- `public`: 全体公開のみ（`access_level === "public"`）
- `expires`: 期限ありのみ（実装は将来対応）
- `followers`: フォロワーまでのみ（`access_level === "private"`）

### 3. 実装の優先順位

#### Phase 1: 検索機能の基本実装（高優先度）
1. `HomeMainTabs`に検索状態管理を追加
2. 検索クエリを各タブに渡す
3. 各タブで基本的な検索ロジックを実装

#### Phase 2: フィルタ機能の実装（中優先度）
1. フィルタ状態管理を追加
2. 基本的なフィルタロジックを実装（Friends Timeline, My Shares）

#### Phase 3: 高度なフィルタ機能（低優先度）
1. Ideas Catalogの詳細フィルタ
2. My Sharesの期限フィルタ
3. 複合検索（検索 + フィルタ）

## 実装詳細

### 検索ユーティリティ関数

```typescript
// lib/utils/trip-search.ts
export function searchTrips(
  trips: Trip[],
  query: string,
  searchFields: Array<keyof Trip | 'creator.name' | 'destination_place.name'>
): Trip[] {
  if (!query || query.trim().length === 0) {
    return trips;
  }

  const normalizedQuery = query.toLowerCase().trim();

  return trips.filter((trip) => {
    return searchFields.some((field) => {
      let value: string | null | undefined;

      if (field === 'creator.name') {
        value = trip.creator?.name;
      } else if (field === 'destination_place.name') {
        value = trip.destination_place?.name;
      } else {
        value = trip[field] as string | null | undefined;
      }

      if (!value) return false;
      return value.toLowerCase().includes(normalizedQuery);
    });
  });
}
```

### フィルタユーティリティ関数

```typescript
// lib/utils/trip-filters.ts (既存ファイルに追加)
export function filterTripsByType(
  trips: Trip[],
  filterType: 'all' | 'active' | 'recent' | 'templates'
): Trip[] {
  switch (filterType) {
    case 'active':
      return trips.filter((trip) => isTripActive(trip));
    case 'recent':
      return [...trips].sort((a, b) => {
        const dateA = toDateOrNull(a.created_at);
        const dateB = toDateOrNull(b.created_at);
        if (!dateA || !dateB) return 0;
        return dateB.getTime() - dateA.getTime();
      });
    case 'templates':
      return trips.filter((trip) => trip.is_template === true);
    case 'all':
    default:
      return trips;
  }
}

export function filterTripsByAccessLevel(
  trips: Trip[],
  accessLevel: 'public' | 'private' | 'unlisted'
): Trip[] {
  return trips.filter((trip) => trip.access_level === accessLevel);
}
```

## 注意事項

1. **パフォーマンス**: 大量の旅行データがある場合、検索・フィルタ処理が重くなる可能性がある。必要に応じて仮想スクロールやページネーションを検討
2. **デバウンス**: 検索入力のデバウンス時間は300msを推奨（既存の`PlaceSearchInput`と同じ）
3. **空の検索結果**: 検索結果が0件の場合、適切なメッセージを表示
4. **URLパラメータ**: 将来的に検索クエリやフィルタをURLパラメータに保存することを検討

