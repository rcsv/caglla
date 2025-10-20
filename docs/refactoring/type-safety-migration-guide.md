# 型安全性改善 - 実装マイグレーションガイド

## 概要

このドキュメントは、`type-safety-issues.md`で特定された型安全性の問題を
実際にどのように修正するかの具体的な手順とコード例を示します。

---

## Phase 1: 基盤整備

### Task 1.1: Firestoreタイムスタンプ変換の統一

#### 対象ファイル

1. `components/trip/TripItineraryView.tsx`
2. `components/planner/NavigationMenu.tsx`
3. `components/stats/TripReservationDisplay.tsx`
4. `components/modals/ReservationInfoModal.tsx`

#### Before & After

##### ❌ Before: `components/trip/TripItineraryView.tsx`

```typescript
let dayDate: Date
if (typeof day.date === 'object' && 'toDate' in day.date) {
  dayDate = (day.date as any).toDate()
} else {
  dayDate = new Date(day.date as any)
}
```

##### ✅ After: 改善版

```typescript
import { toDate } from '@/lib/firebase/timestamp-utils'

const dayDate = toDate(day.date)
```

#### 実装手順

**Step 1**: インポート文の追加

```diff
+ import { toDate, toDateOrNull } from '@/lib/firebase/timestamp-utils'
```

**Step 2**: `as any`を使った日付変換を置き換え

```diff
- dayDate = (day.date as any).toDate()
+ dayDate = toDate(day.date)
```

```diff
- dayDate = new Date(day.date as any)
+ dayDate = toDate(day.date)
```

```diff
- const d = new Date((date as any).toDate?.() ?? (date as string))
+ const d = toDateOrNull(date)
+ if (!d) {
+   return '日付が設定されていません'
+ }
```

**Step 3**: 型エラーの確認と修正

```bash
npm run type-check
```

#### 完全な修正例

##### `components/stats/TripReservationDisplay.tsx`

```typescript
import { toDate, toDateOrNull } from '@/lib/firebase/timestamp-utils'
import type { FirestoreDate } from '@/lib/core/types'

// ✅ 型定義を追加
const formatDateTime = (date: FirestoreDate): string => {
  try {
    const d = toDate(date)
    return d.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    return '日付未設定'
  }
}

// ✅ nullableな日付の処理
const formatTimeWithRule = (
  startDate: FirestoreDate,
  endDate: FirestoreDate | null | undefined
): { start: string; end: string } => {
  const start = toDate(startDate)
  const end = endDate ? toDateOrNull(endDate) : null
  
  return {
    start: start.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
    end: end ? end.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : '--:--'
  }
}
```

---

### Task 1.2: Google Maps API 型定義の作成

#### 新規ファイル: `lib/core/types/google-maps.ts`

```typescript
/**
 * Google Maps API の型定義
 * @types/google.maps を活用した型安全な実装
 */

/// <reference types="google.maps" />

// ============================================================================
// Google Maps API Core Types
// ============================================================================

/**
 * Google Maps API グローバルオブジェクト
 */
export interface GoogleMapsAPI {
  maps: typeof google.maps
  places: typeof google.maps.places
}

/**
 * マップコンポーネントの基本Props
 */
export interface MapComponentProps {
  google: GoogleMapsAPI
  map?: google.maps.Map
  initialCenter?: google.maps.LatLngLiteral
  initialZoom?: number
}

/**
 * マーカーコンポーネントのProps
 */
export interface MarkerComponentProps {
  map: google.maps.Map
  position: google.maps.LatLngLiteral
  title?: string
  icon?: google.maps.Icon | google.maps.Symbol | string
  onClick?: () => void
}

/**
 * ルート表示のProps
 */
export interface DirectionsRendererProps {
  map: google.maps.Map
  directions: google.maps.DirectionsResult
  options?: google.maps.DirectionsRendererOptions
}

// ============================================================================
// Custom Marker Types
// ============================================================================

/**
 * カスタムマーカーの設定
 */
export interface CustomMarkerOptions extends google.maps.MarkerOptions {
  placeId?: string
  category?: string
  color?: string
}

/**
 * マーカークラスタリングの設定
 */
export interface MarkerClusterOptions {
  markers: google.maps.Marker[]
  map: google.maps.Map
  algorithm?: 'grid' | 'supercluster'
  renderer?: 'default' | 'custom'
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Google Maps APIが読み込まれているかチェック
 */
export function isGoogleMapsLoaded(): boolean {
  return typeof google !== 'undefined' && typeof google.maps !== 'undefined'
}

/**
 * LatLng型かどうかをチェック
 */
export function isLatLng(obj: any): obj is google.maps.LatLng {
  return obj && typeof obj.lat === 'function' && typeof obj.lng === 'function'
}

/**
 * LatLngLiteral型かどうかをチェック
 */
export function isLatLngLiteral(obj: any): obj is google.maps.LatLngLiteral {
  return obj && typeof obj.lat === 'number' && typeof obj.lng === 'number'
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * LatLngまたはLatLngLiteralを統一的に扱う
 */
export type LatLngUnion = google.maps.LatLng | google.maps.LatLngLiteral

/**
 * LatLngUnionをLatLngLiteralに変換
 */
export function toLatLngLiteral(latLng: LatLngUnion): google.maps.LatLngLiteral {
  if (isLatLng(latLng)) {
    return {
      lat: latLng.lat(),
      lng: latLng.lng()
    }
  }
  return latLng
}
```

#### 既存ファイルの修正例

##### `components/tripcard/NextTripMap.tsx`

```diff
+ import type { GoogleMapsAPI, MapComponentProps } from '@/lib/core/types/google-maps'
+ import type { User } from '@/lib/core/types'
  
  interface NextTripMapProps {
-   google: any
+   google: GoogleMapsAPI
+   trip: Trip
+   user: User
  }
  
  export default function NextTripMap({ google, trip, user }: NextTripMapProps) {
-   await loadGoogleMapsAPI(getUserLanguage(user as any))
+   await loadGoogleMapsAPI(getUserLanguage(user))
    
    // マップの作成
-   const map = new google.maps.Map(mapRef.current, {
+   const map = new google.maps.Map(mapRef.current!, {
      center: { lat: 35.6762, lng: 139.6503 },
      zoom: 12,
    })
  }
```

##### `components/trip/TripMap.tsx`

```diff
+ import type { GoogleMapsAPI, CustomMarkerOptions, DirectionsRendererProps } from '@/lib/core/types/google-maps'
  
  interface TripMapProps {
-   google: any
+   google: GoogleMapsAPI
    trip: Trip
    selectedItinerary: Itinerary | null
    onItineraryClick: (itinerary: Itinerary) => void
  }
  
- const smoothMoveToLocation = (map: any, targetLat: number, targetLng: number, targetZoom: number) => {
+ const smoothMoveToLocation = (
+   map: google.maps.Map,
+   targetLat: number,
+   targetLng: number,
+   targetZoom: number
+ ): void => {
    // 実装
  }
```

---

### Task 1.3: 日付ユーティリティ関数の型改善

#### 対象ファイル: `lib/utils/date.ts`

##### Before & After

```diff
+ import type { FirestoreDate, Trip } from '@/lib/core/types'
  
  export const dateUtils = {
-   isValidDate: (date: any): boolean => {
+   isValidDate: (date: FirestoreDate | null | undefined): boolean => {
      return isValidTimestamp(date)
    },
    
-   formatDate: (date: any, options?: Intl.DateTimeFormatOptions): string => {
+   formatDate: (date: FirestoreDate, options?: Intl.DateTimeFormatOptions): string => {
      if (!dateUtils.isValidDate(date)) {
        return '日付が設定されていません'
      }
      // ...
    },
    
-   formatDateRange: (startDate: any, endDate: any): string => {
+   formatDateRange: (startDate: FirestoreDate, endDate: FirestoreDate): string => {
      // ...
    },
    
-   sortTripsByDate: (trips: any[]): { futureTrips: any[], pastTrips: any[] } => {
+   sortTripsByDate: <T extends Trip>(trips: T[]): { futureTrips: T[], pastTrips: T[] } => {
      const futureTrips: T[] = []
      const pastTrips: T[] = []
      
      for (const trip of trips) {
        if (trip.start_date && dateUtils.isFutureTrip(trip.start_date)) {
          futureTrips.push(trip)
        } else {
          pastTrips.push(trip)
        }
      }
      
      return { futureTrips, pastTrips }
    },
  }
```

---

## Phase 2: ドメインモデル強化

### Task 2.1: PlacesCache型の完全な型安全化

#### 型定義の拡張

##### `lib/core/types/place.ts`

```diff
  export interface PlacesCache {
    // ...既存の定義
  }
  
+ /**
+  * Firestore保存用（Date型）
+  */
+ export interface PlacesCacheInput extends Omit<PlacesCache, 'cached_at' | 'last_accessed'> {
+   cached_at: Date
+   last_accessed: Date
+ }
+ 
+ /**
+  * Firestore取得用（FirestoreDate型）
+  */
+ export interface PlacesCacheDocument extends Omit<PlacesCache, 'cached_at' | 'last_accessed'> {
+   cached_at: FirestoreDate
+   last_accessed: FirestoreDate
+ }
```

#### 実装の修正

##### `app/api/itineraries/route.ts`

```diff
+ import type { PlacesCacheInput, PlacesCache } from '@/lib/core/types'
  
- const cachePayload: any = {
+ const cachePayload: PlacesCacheInput = {
    format_version: '2.0.0',
    place_id: result.place_id,
    language: 'ja',
    name: result.name,
    formatted_address: result.formatted_address,
    geometry: result.geometry,
    vicinity: result.vicinity,
-   opening_hours: result.opening_hours as any,
+   opening_hours: result.opening_hours,
    cached_at: new Date(),
    last_accessed: new Date(),
    access_count: 1,
  }
```

##### `lib/api/places-cache.ts`

```diff
+ import type { PlacesCacheInput, PlacesCacheDocument } from '@/lib/core/types'
+ import { toDate } from '@/lib/firebase/timestamp-utils'
  
- cached_at: new Date() as any,
- last_accessed: new Date() as any,
+ cached_at: new Date(),
+ last_accessed: new Date(),
  
  // 取得時
- ? new Date(cached.cached_at as any).getTime()
+ ? toDate(cached.cached_at).getTime()
```

---

### Task 2.2: Trip/Day/Itinerary型の強化

#### 型定義の拡張

##### `lib/core/types/trip.ts`

```diff
+ import type { PlacesCache } from './place'
  
  export interface Trip {
    // ...既存の定義
  }
  
+ /**
+  * destination_placeが解決済みのTrip
+  * API応答やUI表示で使用
+  */
+ export interface TripWithDestination extends Trip {
+   destination_place: PlacesCache
+ }
+ 
+ /**
+  * 日程を含むTrip
+  */
+ export interface TripWithDays extends Trip {
+   days: Day[]
+ }
+ 
+ /**
+  * すべてを含むTrip（フル解決済み）
+  */
+ export interface TripFullyResolved extends TripWithDestination, TripWithDays {
+   destination_place: PlacesCache
+   days: DayWithItineraries[]
+ }
+ 
+ /**
+  * 旅程を含むDay
+  */
+ export interface DayWithItineraries extends Day {
+   itineraries: Itinerary[]
+ }
```

#### 実装の修正

##### `app/api/trips/accessible/route.ts`

```diff
+ import type { Trip, TripWithDestination } from '@/lib/core/types'
  
- const anyTrip: any = trip as any
- let destinationPlace = (trip as any).destination_place
+ // 型ガードで安全にチェック
+ const isTripWithDestination = (t: Trip): t is TripWithDestination => {
+   return 'destination_place' in t && t.destination_place !== undefined
+ }
+ 
+ let destinationPlace: PlacesCache | undefined
+ if (isTripWithDestination(trip)) {
+   destinationPlace = trip.destination_place
+ }
```

##### `components/trip/TripItineraryView.tsx`

```diff
+ import type { TripWithDays, Itinerary, Day } from '@/lib/core/types'
  
  interface TripItineraryViewProps {
-   trip: any
+   trip: TripWithDays
-   onScheduleAdded: (newItinerary: any) => void
+   onScheduleAdded: (newItinerary: Itinerary) => Promise<void>
-   onScheduleUpdated: (updatedItinerary: any) => void
+   onScheduleUpdated: (updatedItinerary: Itinerary) => Promise<void>
  }
```

---

### Task 2.3: イベントハンドラ型の明示

#### 対象ファイル: `components/modals/ReservationInfoModal.tsx`

##### Before & After

```diff
+ import type { ReservationInfo, FirestoreDate } from '@/lib/core/types'
  
- const [reservation, setReservation] = useState<any>(null)
+ const [reservation, setReservation] = useState<ReservationInfo | null>(null)
  
- const formatForDatetimeLocal = (value: any): string => {
+ const formatForDatetimeLocal = (value: FirestoreDate | undefined): string => {
+   if (!value) return ''
    const d = toDateOrNull(value)
-   if (!d) return ''
+   if (!d) {
+     return ''
+   }
    return d.toISOString().slice(0, 16)
  }
  
- setReservation((prev: any) => ({
-   ...prev,
-   flight_number: e.target.value.toUpperCase()
- }))
+ const handleFlightNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
+   setReservation(prev => {
+     if (!prev) return null
+     return {
+       ...prev,
+       flight_number: e.target.value.toUpperCase()
+     }
+   })
+ }
```

---

## Phase 3: 細部の仕上げ

### Task 3.1: Error型の統一

#### Before & After

```diff
  try {
    // 処理
- } catch (error: any) {
+ } catch (error) {
+   if (error instanceof Error) {
      console.error('Error:', error.message)
+   } else {
+     console.error('Unknown error:', String(error))
+   }
  }
```

#### エラーハンドリングユーティリティの作成

##### 新規ファイル: `lib/utils/error-utils.ts`

```typescript
/**
 * エラーメッセージを安全に取得
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return '不明なエラーが発生しました'
}

/**
 * エラーを標準的なErrorオブジェクトに変換
 */
export function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error
  }
  return new Error(getErrorMessage(error))
}
```

---

### Task 3.2: チェックリストルール型定義

##### `lib/data/checklist-rules/index.ts`

```diff
+ export interface ChecklistRule {
+   id: string
+   categoryId: string
+   secondaryCategoryId: string
+   name: string
+   description?: string
+   // ...
+ }
  
- export function getRulesByCategory(category: string): any[] {
+ export function getRulesByCategory(category: string): ChecklistRule[] {
    return checklistRules.filter(rule => rule.categoryId === category)
  }
  
- export function getChecklistRules(secondaryCategoryId: string): any[] {
+ export function getChecklistRules(secondaryCategoryId: string): ChecklistRule[] {
    return checklistRules.filter(rule => rule.secondaryCategoryId === secondaryCategoryId)
  }
  
- export function getAllChecklistRules(): any[] {
+ export function getAllChecklistRules(): ChecklistRule[] {
    return checklistRules
  }
```

---

### Task 3.3: DnD型定義

##### `components/common/DragHandle.tsx`

```diff
+ import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core'
  
  interface DragHandleProps {
-   attributes?: any
+   attributes?: DraggableAttributes
-   listeners?: any
+   listeners?: DraggableSyntheticListeners
  }
```

---

## 実装チェックリスト

### Phase 1: 基盤整備

- [ ] Task 1.1: Firestoreタイムスタンプ変換
  - [ ] `components/trip/TripItineraryView.tsx` (4箇所)
  - [ ] `components/planner/NavigationMenu.tsx` (4箇所)
  - [ ] `components/stats/TripReservationDisplay.tsx` (4箇所)
  - [ ] `components/modals/ReservationInfoModal.tsx` (3箇所)
  - [ ] その他のファイル (約15箇所)

- [ ] Task 1.2: Google Maps API型定義
  - [ ] 新規: `lib/core/types/google-maps.ts`
  - [ ] `components/tripcard/NextTripMap.tsx`
  - [ ] `components/trip/TripMap.tsx`
  - [ ] `components/trip/CountryMap.tsx`
  - [ ] `components/trip/TripRightPane.tsx`

- [ ] Task 1.3: 日付ユーティリティ関数
  - [ ] `lib/utils/date.ts` (約15個の関数)

### Phase 2: ドメインモデル強化

- [ ] Task 2.1: PlacesCache型安全化
  - [ ] `lib/core/types/place.ts` (型定義拡張)
  - [ ] `lib/api/places-cache.ts` (3箇所)
  - [ ] `app/api/itineraries/insert/route.ts` (4箇所)
  - [ ] `app/api/itineraries/route.ts` (6箇所)
  - [ ] `app/api/trips/route.ts` (3箇所)
  - [ ] `lib/travel/slug-helpers.ts` (10箇所)

- [ ] Task 2.2: Trip/Day/Itinerary型強化
  - [ ] `lib/core/types/trip.ts` (型定義拡張)
  - [ ] `app/api/trips/accessible/route.ts` (2箇所)
  - [ ] `components/trip/TripItineraryView.tsx` (3箇所)
  - [ ] `lib/travel/slug-helpers.ts` (5箇所)
  - [ ] `components/modals/AddScheduleModal.tsx` (2箇所)

- [ ] Task 2.3: イベントハンドラ型明示
  - [ ] `components/modals/ReservationInfoModal.tsx` (9箇所)
  - [ ] `app/[userSlug]/page.tsx` (2箇所)
  - [ ] `app/test/route-optimization/page.tsx` (1箇所)

### Phase 3: 細部の仕上げ

- [ ] Task 3.1: Error型統一
  - [ ] 新規: `lib/utils/error-utils.ts`
  - [ ] 各種catchブロック (約5箇所)

- [ ] Task 3.2: チェックリストルール型
  - [ ] `lib/data/checklist-rules/index.ts` (3個の関数)

- [ ] Task 3.3: DnD型定義
  - [ ] `components/common/DragHandle.tsx`
  - [ ] `components/trip/ScheduleCard.tsx`

---

## テスト戦略

### 1. 型チェック

```bash
# 全体の型チェック
npm run type-check

# 特定ファイルの型チェック
npx tsc --noEmit components/trip/TripItineraryView.tsx
```

### 2. ビルドテスト

```bash
# 開発ビルド
npm run build

# 本番ビルド
npm run build:prod
```

### 3. 実行時テスト

- [ ] 日付表示が正しく動作するか
- [ ] Google Maps APIが正しく動作するか
- [ ] フォーム入力が正しく動作するか
- [ ] エラーハンドリングが正しく動作するか

---

## トラブルシューティング

### 問題1: 型エラーが大量に発生する

**原因**: 型定義の変更が連鎖的に影響

**解決策**:
1. 小さな単位でコミット
2. 一つのファイルずつ修正
3. 型エイリアスで一時的に互換性を保つ

```typescript
// 一時的な型エイリアス
type LegacyTrip = any
```

### 問題2: FirestoreDate変換でエラー

**原因**: 未定義・nullの可能性を考慮していない

**解決策**:
```typescript
// toDateOrNull()を使用
const date = toDateOrNull(firestoreDate)
if (!date) {
  // エラーハンドリング
}
```

### 問題3: Google Maps APIの型エラー

**原因**: `@types/google.maps`の型定義が不完全

**解決策**:
```typescript
// 型アサーションを最小限に使用
const map = new google.maps.Map(mapRef.current!, options)
```

---

## まとめ

このマイグレーションガイドに従うことで、
段階的かつ安全に型安全性を向上させることができます。

**重要なポイント**:
1. 小さな単位で変更
2. 各ステップでテスト
3. 後方互換性の維持
4. ドキュメントの更新

疑問点があれば、このドキュメントを参照してください。

