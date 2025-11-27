# ライブラリ化計画書

## 📋 概要

TSXコンポーネントに直接実装されているロジックを、再利用可能なライブラリ関数に移行する計画です。
これにより、コードの重複を削減し、保守性とテスタビリティを向上させます。

---

## 🎯 目標

1. **コードの重複削減**: 複数のコンポーネントで同じロジックが実装されている箇所を統一
2. **保守性向上**: ロジックの変更が1箇所で済むようにする
3. **テスタビリティ向上**: ロジックを独立してテストできるようにする
4. **型安全性向上**: TypeScriptの型システムを活用した安全な実装

---

## 📦 実装優先順位

### **Phase 1: 緊急度高（コンポーネント内で直接実装）**

#### 1.1 Trip フィルタリング・分類ロジック (`lib/travel/trip-filters.ts`)
- **現状**: `app/home/page.tsx`, `app/home-v2/page.tsx` で重複実装
- **影響範囲**: 高（複数のページで使用）
- **依存関係**: `lib/utils/date.ts`, `lib/utils/trip-status.ts`

**実装関数:**
```typescript
// 進行中のTripを取得
filterOngoingTrips(trips: Trip[], referenceDate?: Date): Trip[]

// 近日のTripを取得（未来のTripのみ）
filterUpcomingTrips(trips: Trip[], referenceDate?: Date): Trip[]

// 完了したTripを取得
filterCompletedTrips(trips: Trip[], referenceDate?: Date): Trip[]

// 計画中のTripを取得
filterPlanningTrips(trips: Trip[]): Trip[]

// 更新日時でソート（降順）
sortTripsByUpdatedAt(trips: Trip[]): Trip[]

// 作成日時でソート（降順）
sortTripsByCreatedAt(trips: Trip[]): Trip[]

// 開始日でソート（昇順）
sortTripsByStartDate(trips: Trip[]): Trip[]

// 年別にグループ化
groupTripsByYear(trips: Trip[]): Record<number, Trip[]>

// ステータス別にフィルタリング
filterTripsByStatus(trips: Trip[], status: TripStatus): Trip[]

// アクセスレベル別にフィルタリング
filterTripsByAccessLevel(trips: Trip[], accessLevel: AccessLevel): Trip[]

// 複合フィルタ（ステータス + アクセスレベル）
filterTrips(trips: Trip[], options: FilterOptions): Trip[]
```

**実装詳細:**
- `getTripStatus()` を活用してステータス判定
- `dateUtils.getToday()` を活用して日付比較
- `toDateOrNull()` でFirestoreDateの変換を統一

**移行対象ファイル:**
- `app/home/page.tsx` (67-74行目, 166-176行目)
- `app/home-v2/page.tsx` (236-347行目)
- `app/memories/page.tsx` (32-40行目)

---

#### 1.2 Trip 統計・集計 (`lib/travel/trip-stats.ts`)
- **現状**: `lib/contexts/user-data.tsx` で直接計算
- **影響範囲**: 中（コンテキスト内のみ）
- **依存関係**: なし

**実装関数:**
```typescript
// Trip統計を計算
calculateTripStats(trips: Trip[]): TripStats

interface TripStats {
  total: number
  private: number
  shared: number
  public: number
  templates: number
  planning: number
  active: number
  completed: number
  cancelled: number
}
```

**移行対象ファイル:**
- `lib/contexts/user-data.tsx` (168-169行目)

---

### **Phase 2: 緊急度中（APIを直接呼び出し）**

#### 2.1 Trip CRUD操作 (`lib/travel/trip-operations.ts`)
- **現状**: コンポーネントから直接 `makeAuthenticatedRequest('/api/trips')` を呼び出し
- **影響範囲**: 高（複数のコンポーネントで使用）
- **依存関係**: `lib/api/helpers.ts` (makeAuthenticatedRequest)

**実装関数:**
```typescript
// Tripを作成
createTrip(data: CreateTripInput): Promise<Trip>

// Tripを更新
updateTrip(tripId: string, data: UpdateTripInput): Promise<Trip>

// Tripを削除
deleteTrip(tripId: string): Promise<void>

// Tripを取得（スラッグまたはIDで）
getTrip(tripIdOrSlug: string): Promise<Trip | null>

interface CreateTripInput {
  title: string
  description?: string
  destination?: string
  destination_place_id?: string
  start_date?: Date | string
  end_date?: Date | string
  access_level?: 'private' | 'shared' | 'public'
  image_url?: string
  is_template?: boolean
  default_currency?: string
}

interface UpdateTripInput {
  title?: string
  description?: string
  destination?: string
  destination_place_id?: string
  start_date?: Date | string
  end_date?: Date | string
  access_level?: 'private' | 'shared' | 'public'
  image_url?: string
  is_template?: boolean
  default_currency?: string
  is_cancelled?: boolean
}
```

**移行対象ファイル:**
- `components/common/CreateTripDialog.tsx` (301行目)
- `app/trip/new/page.tsx` (createTrip処理)
- `components/trip/TripEditor.tsx` (150, 196, 266行目)

---

#### 2.2 Day/Itinerary 操作 (`lib/travel/day-operations.ts`, `lib/travel/itinerary-operations.ts`)
- **現状**: APIルートは存在するが、クライアント側ライブラリ関数なし
- **影響範囲**: 中（Trip編集画面で使用）
- **依存関係**: `lib/api/helpers.ts`

**実装関数:**

**Day操作 (`lib/travel/day-operations.ts`):**
```typescript
// Dayを作成
createDay(tripId: string, dayData: CreateDayInput): Promise<Day>

// Dayを更新
updateDay(dayId: string, dayData: UpdateDayInput): Promise<Day>

// Dayを削除
deleteDay(dayId: string): Promise<void>

// Tripの日程範囲を更新（Daysを自動生成）
updateDaysForTrip(tripId: string, startDate: Date, endDate: Date): Promise<Day[]>

interface CreateDayInput {
  trip_id: string
  day_number: number
  date?: Date | string
  description?: string
}

interface UpdateDayInput {
  day_number?: number
  date?: Date | string
  description?: string
}
```

**Itinerary操作 (`lib/travel/itinerary-operations.ts`):**
```typescript
// Itineraryを作成
createItinerary(dayId: string, itineraryData: CreateItineraryInput): Promise<Itinerary>

// Itineraryを更新
updateItinerary(itineraryId: string, itineraryData: UpdateItineraryInput): Promise<Itinerary>

// Itineraryを削除
deleteItinerary(itineraryId: string): Promise<void>

// Itineraryを挿入（指定位置に挿入）
insertItinerary(dayId: string, itineraryData: CreateItineraryInput, insertAfterIndex?: number): Promise<Itinerary>

// Itineraryの順序を変更
reorderItineraries(dayId: string, itineraryIds: string[]): Promise<Itinerary[]>

interface CreateItineraryInput {
  day_id: string
  title: string
  description?: string
  location?: string
  place_id?: string
  place_data?: PlaceData
  start_time?: string
  end_time?: string
  timezone?: string
  cost_amount?: number
  cost_currency?: string
  activity_tag?: ActivityTag
  insert_after_index?: number
}

interface UpdateItineraryInput {
  title?: string
  description?: string
  location?: string
  place_id?: string
  place_data?: PlaceData
  start_time?: string
  end_time?: string
  timezone?: string
  cost_amount?: number
  cost_currency?: string
  activity_tag?: ActivityTag
  sort_number?: number
}
```

**移行対象ファイル:**
- `app/api/itineraries/route.ts` (POST処理)
- `app/api/itineraries/insert/route.ts` (POST処理)
- `app/api/trip/[tripSlug]/day/route.ts` (POST, PUT, DELETE)

---

#### 2.3 Trip 検索・推奨 (`lib/travel/trip-search.ts`)
- **現状**: コンポーネントから直接 API を呼び出し
- **影響範囲**: 中（推奨Trip表示コンポーネントで使用）
- **依存関係**: `lib/api/helpers.ts`

**実装関数:**
```typescript
// 推奨Tripを取得
getRecommendedTrips(limit?: number): Promise<{ trips: Trip[] }>

// Tripを検索（将来実装用）
searchTrips(query: string, options?: SearchOptions): Promise<{ trips: Trip[], nextCursor?: string }>

interface SearchOptions {
  limit?: number
  cursor?: string
  status?: TripStatus
  accessLevel?: AccessLevel
  destination?: string
}
```

**移行対象ファイル:**
- `components/stats/RecommendedTrips.tsx` (40行目)
- `components/stats/CountryStats.tsx` (52行目)

---

#### 2.4 Trip 公開/非公開 (`lib/travel/trip-publish.ts`)
- **現状**: APIルートは存在するが、クライアント側ライブラリ関数なし
- **影響範囲**: 低（公開設定UIで使用）
- **依存関係**: `lib/api/helpers.ts`

**実装関数:**
```typescript
// Tripを公開
publishTrip(tripId: string): Promise<Trip>

// Tripを非公開にする
unpublishTrip(tripId: string): Promise<Trip>
```

**移行対象ファイル:**
- `app/api/trip/[tripSlug]/publish/route.ts` を呼び出すコンポーネント

---

#### 2.5 Trip 複製 (`lib/travel/trip-replica.ts`)
- **現状**: APIルートは存在するが、クライアント側ライブラリ関数なし
- **影響範囲**: 中（Clone Trip Plan機能で使用）
- **依存関係**: `lib/api/helpers.ts`

**実装関数:**
```typescript
// Tripを複製
replicateTrip(sourceTripId: string, options?: ReplicateOptions): Promise<Trip>

interface ReplicateOptions {
  title?: string
  start_date?: Date | string
  end_date?: Date | string
  access_level?: 'private' | 'shared' | 'public'
}
```

**移行対象ファイル:**
- `app/api/trip/[tripSlug]/replica/route.ts` を呼び出すコンポーネント
- `components/tripcard/TripCard.tsx` (Clone Trip Planボタン)
- `components/social/TripFeed.tsx` (Clone Trip Planボタン)

---

### **Phase 3: 緊急度低（使用頻度が低い）**

#### 3.1 Trip 画像処理 (`lib/travel/trip-image.ts`)
- **現状**: コンポーネント内で画像アップロード処理を実装
- **影響範囲**: 低（Trip作成・編集画面のみ）
- **依存関係**: `lib/storage/image-upload.ts`

**実装関数:**
```typescript
// Trip画像をアップロード
uploadTripImage(tripId: string, imageFile: File): Promise<string>

// Trip画像を削除
deleteTripImage(tripId: string, imageUrl: string): Promise<void>

// デスティネーションから画像を自動取得
fetchDestinationImage(destination: string): Promise<string | null>
```

**移行対象ファイル:**
- `app/trip/new/page.tsx` (画像アップロード処理)
- `components/common/CreateTripDialog.tsx` (画像アップロード処理)

---

#### 3.2 チェックリスト操作 (`lib/travel/trip-checklist.ts`)
- **現状**: コンポーネントから直接 API を呼び出し
- **影響範囲**: 低（チェックリスト機能のみ）
- **依存関係**: `lib/api/helpers.ts`

**実装関数:**
```typescript
// チェックリストを取得
getChecklist(tripId: string): Promise<ChecklistItem[]>

// チェックリストを更新
updateChecklist(tripId: string, items: ChecklistItem[]): Promise<ChecklistItem[]>

// チェックリストを自動生成
generateChecklist(tripId: string): Promise<ChecklistItem[]>

// プリセットを適用
applyPreset(tripId: string, presetId: string): Promise<ChecklistItem[]>
```

**移行対象ファイル:**
- `components/trip/TripChecklistView.tsx` (31, 50, 67行目)
- `components/modals/PresetLibraryModal.tsx` (57行目)

---

#### 3.3 予約情報取得 (`lib/travel/trip-reservations.ts`)
- **現状**: APIルートは存在するが、クライアント側ライブラリ関数なし
- **影響範囲**: 低（予約情報表示のみ）
- **依存関係**: `lib/api/helpers.ts`

**実装関数:**
```typescript
// 予約情報を取得
getReservations(tripId: string, options?: ReservationQueryOptions): Promise<{ 
  items: ReservationInfo[], 
  hasMore: boolean, 
  nextCursor?: string 
}>

interface ReservationQueryOptions {
  dayId?: string
  type?: ReservationType
  limit?: number
  cursor?: string
}
```

**移行対象ファイル:**
- `app/api/trips/[tripSlug]/reservations/route.ts` を呼び出すコンポーネント

---

## 📅 実装スケジュール

### **Week 1: Phase 1 (緊急度高)**
- [ ] **Day 1-2**: `lib/travel/trip-filters.ts` の実装とテスト
- [ ] **Day 3**: `lib/travel/trip-stats.ts` の実装とテスト
- [ ] **Day 4-5**: 既存コードへの移行と動作確認

### **Week 2: Phase 2 前半 (緊急度中 - CRUD)**
- [ ] **Day 1-2**: `lib/travel/trip-operations.ts` の実装とテスト
- [ ] **Day 3-4**: `lib/travel/day-operations.ts` の実装とテスト
- [ ] **Day 5**: `lib/travel/itinerary-operations.ts` の実装とテスト

### **Week 3: Phase 2 後半 (緊急度中 - その他)**
- [ ] **Day 1**: `lib/travel/trip-search.ts` の実装とテスト
- [ ] **Day 2**: `lib/travel/trip-publish.ts` の実装とテスト
- [ ] **Day 3-4**: `lib/travel/trip-replica.ts` の実装とテスト
- [ ] **Day 5**: 既存コードへの移行と動作確認

### **Week 4: Phase 3 (緊急度低)**
- [ ] **Day 1**: `lib/travel/trip-image.ts` の実装とテスト
- [ ] **Day 2**: `lib/travel/trip-checklist.ts` の実装とテスト
- [ ] **Day 3**: `lib/travel/trip-reservations.ts` の実装とテスト
- [ ] **Day 4-5**: 既存コードへの移行と動作確認、ドキュメント整備

---

## 🔧 実装方針

### **共通原則**
1. **既存のユーティリティを活用**
   - `dateUtils` (日付操作)
   - `getTripStatus()` (ステータス計算)
   - `toDateOrNull()` (FirestoreDate変換)
   - `makeAuthenticatedRequest()` (API呼び出し)

2. **型安全性を優先**
   - すべての関数にTypeScript型定義を付与
   - `as any` の使用を避ける
   - ジェネリクスを活用して再利用性を高める

3. **エラーハンドリング**
   - 統一されたエラーレスポンス型
   - 適切なログ出力（`logger`使用）

4. **テスト**
   - 各ライブラリ関数にユニットテストを実装
   - Firestoreエミュレータを使用した統合テスト

5. **後方互換性**
   - 既存コードとの互換性を保つ
   - 段階的な移行を可能にする

---

## 📁 ファイル構造

```
lib/travel/
├── trip-filters.ts          # Phase 1.1: フィルタリング・分類
├── trip-stats.ts            # Phase 1.2: 統計・集計
├── trip-operations.ts       # Phase 2.1: Trip CRUD
├── day-operations.ts        # Phase 2.2: Day CRUD
├── itinerary-operations.ts  # Phase 2.2: Itinerary CRUD
├── trip-search.ts           # Phase 2.3: 検索・推奨
├── trip-publish.ts          # Phase 2.4: 公開/非公開
├── trip-replica.ts          # Phase 2.5: 複製
├── trip-image.ts            # Phase 3.1: 画像処理
├── trip-checklist.ts        # Phase 3.2: チェックリスト
├── trip-reservations.ts     # Phase 3.3: 予約情報
├── feed.ts                  # ✅ 既存: フィード
├── trip-templates.ts        # ✅ 既存: テンプレート
├── accessible-trips.ts      # ✅ 既存: アクセス可能なTrip
└── __tests__/
    ├── trip-filters.test.ts
    ├── trip-stats.test.ts
    ├── trip-operations.test.ts
    ├── day-operations.test.ts
    ├── itinerary-operations.test.ts
    ├── trip-search.test.ts
    ├── trip-publish.test.ts
    ├── trip-replica.test.ts
    ├── trip-image.test.ts
    ├── trip-checklist.test.ts
    └── trip-reservations.test.ts
```

---

## 🔄 移行パターン

### **Before (TSXに直接実装)**
```typescript
// app/home/page.tsx
const ongoingTrips = tripsSortedByRecent.filter((trip) => {
  const startDate = toDateOrNull(trip.start_date)
  const endDate = toDateOrNull(trip.end_date)
  if (!startDate || !endDate) return false
  return startDate <= today && endDate >= today
})
```

### **After (ライブラリ関数を使用)**
```typescript
// app/home/page.tsx
import { filterOngoingTrips, sortTripsByUpdatedAt } from '@/lib/travel/trip-filters'

const ongoingTrips = filterOngoingTrips(sortTripsByUpdatedAt(trips)).slice(0, 2)
```

---

## ✅ 成功基準

1. **コードの重複削減**: 同じロジックが3箇所以上で実装されていない
2. **テストカバレッジ**: すべてのライブラリ関数にユニットテストが存在
3. **型安全性**: `as any` の使用が5箇所以下
4. **パフォーマンス**: 既存機能のパフォーマンスが劣化しない
5. **ドキュメント**: すべての公開関数にJSDocコメントが存在

---

## 📝 注意事項

1. **段階的な移行**: 一度にすべてを移行せず、Phaseごとに実施
2. **既存機能の動作確認**: 移行後は必ず既存機能が動作することを確認
3. **エラー処理**: APIエラー時の適切なハンドリングを実装
4. **ログ出力**: デバッグ用のログを適切に出力（本番環境では制限）

---

## 🔗 関連ドキュメント

- [型定義仕様書](../specifications/type-definitions.md)
- [API仕様書](../specifications/api-specifications.md)
- [テスト戦略](../development/testing-strategy.md)

---

**最終更新**: 2025-01-XX
**作成者**: AI Assistant
**承認者**: (未承認)

