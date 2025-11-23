# Planner Parallel Routes 整理プラン

> **重要**: このプランは生成AIからのフィードバックを取り込み、Next.js App Routerの落とし穴を回避するように更新されています。  
> **最終レビュー**: 実装着手前に、layout.tsxのClient化方針、POIProviderの連携方式、TripProviderの責務について最終確認済み。

## 📊 現状分析

### 現在の構造

```
app/(planner)/[userSlug]/[tripSlug]/
├── page.tsx              # 1620行の巨大ファイル（すべてのロジック）
├── layout.tsx            # Parallel Routesのレイアウト
├── @timeline/
│   ├── default.tsx       # タイムライン実装（ただしhidden）
│   └── page.tsx
├── @map/
│   ├── default.tsx       # 地図実装（自前でTripフェッチ）
│   └── page.tsx
└── @social/
    ├── default.tsx       # ソーシャル機能（自前でTripフェッチ）
    └── page.tsx
```

### 問題点

1. **`page.tsx`がメインコンテンツとして表示されている**
   - `layout.tsx`で`{children}`が表示されている
   - `@timeline`は`hidden`になっている
   - 左ペインと右ペインの分離ができていない

2. **データフェッチの重複**
   - `@timeline/default.tsx`がTripをフェッチ
   - `@map/default.tsx`がTripをフェッチ
   - `@social/default.tsx`がTripをフェッチ
   - `page.tsx`もTripをフェッチ
   - → 4回のAPIリクエストが発生

3. **状態管理の分散**
   - `selectedDayId`, `selectedItineraryId`などが各Parallel Routeで個別管理
   - URLクエリパラメータ（`sd`, `si`, `mf`）の同期が複雑

4. **レイアウト構造の問題**
   - `layout.tsx`で`children`（page.tsx）を表示している
   - 左ペインと右ペインの明確な分離ができていない

## 🎯 構想（目標構造）

### 左ペインと右ペインの分離

```
┌─────────────────────────────────────────────────────────┐
│  Planner Layout                                         │
├──────────┬──────────────────────┬───────────────────────┤
│ 左メニュー │  左ペイン            │  右ペイン              │
│ (Nav)    │  (@timeline)        │  (@map)               │
│          │                     │                       │
│ - Summary│  - Summary View    │  - TripMap            │
│ - Itinerary│ - Itinerary View │  - 地図表示            │
│ - Checklist│ - Checklist View│  - マーカー表示        │
│ - Days   │  - 編集機能          │  - ルート表示         │
└──────────┴──────────────────────┴───────────────────────┘
│  @social (モバイル: 下部、デスクトップ: 右側)            │
└─────────────────────────────────────────────────────────┘
```

### 左メニュー（NavigationMenu）の役割

- **3つのビューへのナビゲーション**: Summary / Itinerary / Checklist
- **Summary内のセクションへのナビゲーション**: 天気予報、予約、予算など
- **日程（Day）へのナビゲーション**: 各日程への直接ジャンプ
- **折りたたみ機能**: デスクトップで折りたたみ可能
- **モバイル対応**: スライドメニュー（ハンバーガーボタンで開閉）

### 左ペイン（メインコンテンツ）の3つのビュー

左ペインでは、URLクエリパラメータ `?view=summary|itinerary|checklist` に基づいて、以下の3つのビューを**条件付きレンダリング**で切り替えて表示：

1. **Summary View** (`view=summary`)
   - 旅行データの概要
   - SNS的なやり取り（いいね、コメントなど）
   - 天気予報、予約、予算などのサマリー情報

2. **Itinerary View** (`view=itinerary`)
   - タイムライン表示
   - 日程ごとのItinerary一覧
   - 編集機能（追加、削除、移動など）

3. **Checklist View** (`view=checklist`)
   - チェックリスト表示
   - Preparing / Packing の2カテゴリー
   - 右ペインを非表示にして全幅表示

### データフロー

```
layout.tsx (親)
  ├─ TripProvider (共通データフェッチ)
  │   └─ Trip, loading, error
  │
  ├─ POIProvider (POI状態管理) ← 新規追加
  │   └─ poiData, setPoiData
  │
  ├─ @timeline (左ペイン)
  │   └─ TripItineraryView
  │       ├─ Tripデータ（props）
  │       ├─ selectedDayId, selectedItineraryId（URL同期）
  │       ├─ onItineraryClick → POIProvider.setPoiData
  │       └─ 編集機能
  │
  ├─ @map (右ペイン)
  │   └─ TripMap
  │       ├─ Tripデータ（props）
  │       ├─ selectedDayId, selectedItineraryId（URL同期）
  │       ├─ poiData（POIProviderから）
  │       ├─ onPoiDataUpdate → POIProvider.setPoiData
  │       ├─ POIDialog（poiDataに基づいて表示）
  │       └─ 地図表示・操作
  │
  └─ @social (ソーシャル)
      └─ LikeButton, CommentList
          └─ Tripデータ（props）
```

### POIDialogとItinerary Cardのデータフロー

**現状の実装**:
- `page.tsx`で`poiData`を状態管理
- `TripMap`に`poiData`と`onPoiDataUpdate`を渡す
- `TripItineraryView`の`onItineraryClick`で`poiData`を更新
- `TripMap`内で`POIDialog`を表示

**Parallel Routes実装での管理方法**:

#### オプション1: POIProviderで状態管理（推奨）

```typescript
// app/(planner)/[userSlug]/[tripSlug]/POIProvider.tsx
'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import type { PlaceData } from '@/lib/core/types'

interface POIData {
  placeId: string
  name: string
  location: { lat: number; lng: number }
  placeData?: PlaceData
  orderNumber?: number
}

interface POIContextValue {
  poiData: POIData | null
  setPoiData: (data: POIData | null) => void
}

const POIContext = createContext<POIContextValue | null>(null)

export function POIProvider({ children }: { children: ReactNode }) {
  const [poiData, setPoiData] = useState<POIData | null>(null)

  return (
    <POIContext.Provider value={{ poiData, setPoiData }}>
      {children}
    </POIContext.Provider>
  )
}

export function usePOI() {
  const context = useContext(POIContext)
  if (!context) {
    throw new Error('usePOI must be used within POIProvider')
  }
  return context
}
```

```typescript
// layout.tsx（Server Component）
import { getTrip } from '@/lib/travel/trips'
import { TripClientLayout } from './TripClientLayout'

export default async function TripDetailLayout({
  timeline,
  map,
  social,
  params,
}: {
  timeline: ReactNode
  map: ReactNode
  social: ReactNode
  params: { userSlug: string; tripSlug: string }
}) {
  // Server ComponentでTripをfetch（一度だけ）
  const trip = await getTrip(params.tripSlug)
  
  if (!trip) {
    return <div>Trip not found</div>
  }
  
  return (
    <TripClientLayout trip={trip}>
      {timeline}
      {map}
      {social}
    </TripClientLayout>
  )
}
```

```typescript
// TripClientLayout.tsx（Client Component）
'use client'

import { ReactNode } from 'react'
import { TripProvider } from './TripProvider'
import TripPageLayout from '@/components/trip/TripPageLayout'
import { useTripUrlState } from './useTripUrlState'
import { useState } from 'react'

export function TripClientLayout({
  trip,
  timeline,
  map,
  social,
}: {
  trip: Trip
  timeline: ReactNode
  map: ReactNode
  social: ReactNode
}) {
  const { currentView } = useTripUrlState()
  const [leftNavExpanded, setLeftNavExpanded] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // ... ナビゲーション関数など
  
  return (
    <TripProvider trip={trip}>
      <TripPageLayout
        trip={trip}
        leftNavExpanded={leftNavExpanded}
        onToggleLeftNav={() => setLeftNavExpanded(!leftNavExpanded)}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        onNavigateToSection={navigateToSection}
        onDayClick={handleDayClick}
        rightPaneWidth={currentView === 'checklist' ? 'zero' : 'default'}
      >
        {timeline}
      </TripPageLayout>
      {/* mapとsocialは別途配置 */}
    </TripProvider>
  )
}
```

```typescript
// @timeline/default.tsx
'use client'

export default function TimelineDefault() {
  const handleItineraryClick = (itineraryId: string) => {
    const itinerary = // ... itineraryを取得
    if (itinerary.place_data?.place_id) {
      // CustomEventで@map側に通知（props経由ではなく）
      window.dispatchEvent(new CustomEvent('planner:poi-open', {
        detail: {
          placeId: itinerary.place_data.place_id,
          name: itinerary.title,
          location: {
            lat: itinerary.place_data.geometry.location.lat,
            lng: itinerary.place_data.geometry.location.lng,
          },
          placeData: itinerary.place_data,
        }
      }))
    }
  }
  
  return (
    <TripItineraryView
      onItineraryClick={handleItineraryClick}
      // ...
    />
  )
}
```

**メリット**:
- Parallel Routesの分離されたコンポーネントツリーでも通信できる
- props drillingがゼロになる
- map側が独立モジュールとして扱える
- URL/stateのゆらぎに影響されない
- 将来地図ライブラリを置き換える際も柔軟に対応できる

```typescript
// @map/default.tsx
'use client'
import { useTrip } from '../TripProvider'
import { POIProvider, usePOI } from '../POIProvider'
import POIDialog from '@/components/modals/POIDialog'
import TripMap from '@/components/trip/TripMap'
import { useEffect } from 'react'

export default function MapDefault() {
  const { trip } = useTrip()
  
  return (
    <POIProvider>
      <MapContent trip={trip} />
    </POIProvider>
  )
}

function MapContent({ trip }: { trip: Trip }) {
  const { poiData, setPoiData } = usePOI()
  
  // @timelineからのCustomEventを受け取る
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      setPoiData(e.detail)
    }
    window.addEventListener('planner:poi-open', handler as EventListener)
    return () => {
      window.removeEventListener('planner:poi-open', handler as EventListener)
    }
  }, [setPoiData])
  
  return (
    <>
      <TripMap
        poiData={poiData}
        onPoiDataUpdate={setPoiData}
        // ...
      />
      {poiData && (
        <POIDialog
          poiData={poiData}
          onClose={() => setPoiData(null)}
          onAddToItinerary={handleAddFromPOI}
          availableDays={trip.days?.map(d => ({
            id: d.id,
            date: d.date,
            title: d.description,
          }))}
        />
      )}
    </>
  )
}
```

**重要なポイント**:
- `POIProvider`は`@map`側に置くことで、地図まわりの状態を地図側で管理
- `@timeline`からの通知はCustomEventで受け取る（props経由ではない）
- これにより、Parallel Routesの分離されたコンポーネントツリーでも通信可能

**メリット**:
- Parallel Routesの分離されたコンポーネントツリーでも通信できる
- props drillingがゼロになる
- map側が独立モジュールとして扱える
- URL/stateのゆらぎに影響されない
- 将来地図ライブラリを置き換える際も柔軟に対応できる

#### オプション2: URLクエリパラメータで管理

```typescript
// URL: ?poi=place_id_123
// poiDataをURLで管理し、useTripUrlStateと同様に実装
```

**デメリット**:
- URLが長くなる
- ブラウザ履歴に残る
- 複雑なデータ構造をURLで管理するのは不適切

**推奨**: オプション1（POIProvider）を推奨。`@timeline`から`@map`への連携は**CustomEventベースのイベント通知方式**を使用する。

## ⚠️ Next.js App Router の落とし穴と対策

### 1. Parallel Routes上のClient ComponentがProvider共有されない問題

**問題**: `layout.tsx`がServer Componentの場合、Parallel Routesの各`default.tsx`が別のツリー扱いになり、Providerが共有されないことがある。

**症状**:
- `usePOI()`の状態が`@timeline`と`@map`で別々になる
- Providerのstateが初期化される
- React Contextが`undefined`でエラーになる

**対策**: `layout.tsx`自体をClient化する必要はない。**Providerの直上にClient Componentの境界コンポーネントを置く**

```typescript
// layout.tsx (Server Componentのまま)
import { TripClientLayout } from './TripClientLayout'

export default async function TripDetailLayout({
  timeline,
  map,
  social,
  params,
}: {
  timeline: ReactNode
  map: ReactNode
  social: ReactNode
  params: { userSlug: string; tripSlug: string }
}) {
  const trip = await getTrip(params.tripSlug)
  
  return (
    <TripClientLayout trip={trip}>
      {timeline}
      {map}
      {social}
    </TripClientLayout>
  )
}
```

```typescript
// TripClientLayout.tsx (Client Component)
'use client'

import { TripProvider } from './TripProvider'

export function TripClientLayout({
  trip,
  children,
}: {
  trip: Trip
  children: ReactNode
}) {
  return (
    <TripProvider trip={trip}>
      {children}
    </TripProvider>
  )
}
```

**重要**: 
- `layout.tsx`はServer ComponentのままでOK（RSCの恩恵を維持）
- Parallel Routesの境界直下にClient ComponentがあればProvider共有は問題ない
- `layout.tsx`自体をClient化すると、サーバーでの自動streamingやRSCのキャッシュ・低負荷・高速化の恩恵が消える

### 2. データフェッチの二重フェッチ問題

**問題**: Client Componentの`TripProvider`で`makeAuthenticatedRequest`を使うと、React Strict ModeやSuspenseの粒度によってfetchが二回走ることがある。

**対策A（推奨）: Server Componentで一度だけフェッチ → propsで渡す**

```typescript
// layout.tsx (Server Component)
import { getTrip } from '@/lib/travel/trips' // Server側のfetch関数

export default async function TripDetailLayout({
  timeline,
  map,
  social,
  params,
}: {
  timeline: ReactNode
  map: ReactNode
  social: ReactNode
  params: { userSlug: string; tripSlug: string }
}) {
  // Server Componentで一度だけfetch
  const trip = await getTrip(params.tripSlug)
  
  return (
    <TripClientLayout trip={trip}>
      {timeline}
      {map}
      {social}
    </TripClientLayout>
  )
}
```

**対策B: React Queryに寄せる**

- Query Keyを`["trip", tripSlug]`に統一
- Parallel Routes全部で`useQuery()`を使用
- キャッシュが効くのでfetchは1回だけ
- Suspenseとも相性が良い

**推奨**: 対策A（Server Componentでfetch）を推奨。Client Providerに持たせると競合が起きやすい。

**重要**: `layout.tsx`自体をClient化する必要はない。Server Componentのまま、その直下にClient Componentの境界コンポーネント（`TripClientLayout`）を置くことで、RSCの恩恵を維持しつつProvider共有も実現できる。

### 3. POIProviderの状態が残る問題

**問題**: `POIProvider`を`layout.tsx`直下で持つと、view変更やMapのunmount/mount後も`poiData`が残る。

**例**: タイムラインでPOIを開いたまま`view=checklist`にするとMap非表示 → `view=itinerary`に戻すとまだPOI dialogが開いている。

**対策（推奨）: POIProviderをmap Parallel Routeの内部に置く + CustomEventで連携**

地図まわりに閉じ、`@timeline`からの通知はCustomEventで受け取る。

```typescript
// @map/default.tsx
'use client'
import { POIProvider, usePOI } from '../POIProvider'
import { useEffect } from 'react'

export default function MapDefault() {
  return (
    <POIProvider>
      <MapContent />
    </POIProvider>
  )
}

function MapContent() {
  const { poiData, setPoiData } = usePOI()
  
  // @timelineからのCustomEventを受け取る
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      setPoiData(e.detail)
    }
    window.addEventListener('planner:poi-open', handler as EventListener)
    return () => {
      window.removeEventListener('planner:poi-open', handler as EventListener)
    }
  }, [setPoiData])
  
  return (
    <>
      <TripMap poiData={poiData} onPoiDataUpdate={setPoiData} ... />
      {poiData && <POIDialog poiData={poiData} ... />}
    </>
  )
}
```

**メリット**:
- Parallel Routesの分離されたコンポーネントツリーでも通信できる
- props drillingがゼロになる
- map側が独立モジュールとして扱える
- 将来地図ライブラリを置き換える際も柔軟に対応できる

### 4. URL状態管理のreplaceの地雷

**問題**: `router.replace()`をParallel Routesで使うと、スクロール位置リセット、timeline/mapの再マウント、mapのtransitionリセットなどが発生する。

**対策**:

```typescript
// shallow routing + scroll: false
router.replace(`?${params}`, { scroll: false })
```

また、`searchParams`を書き換えるロジックは**debounce**または**ステートで一旦貯める**のが良い。

### 5. default.tsxとpage.tsxの優先度

**問題**: Parallel Routeの中で`page.tsx`を使うと、`page.tsx`が優先され、`default.tsx`は`children`のfallbackになる。

**対策**: Parallel Routeの中で`page.tsx`を使うのは推奨しない。全部`default.tsx`に寄せる方が動作が直線的になる。

```
@timeline/
  default.tsx  ← メイン実装はここ
  page.tsx     ← 削除するか空にする
```

### 6. childrenをhiddenにするのは危険

**問題**: `layout.tsx`で`children`（`page.tsx`）を`hidden`にするのは危険。

**理由**:
- App Routerの`default.tsx`がfallback
- `children`が意図せずレンダリングされる
- `hidden`にしてるだけで実際はDOMに存在する
- イベントバブリングやCSS影響が残る
- hydration mismatchの根本原因になりがち

**対策**: `page.tsx`は完全に削除するか、空にする。`hidden`にするという発想はNext.js的にはアンチパターン。

## 🛠️ 実装プラン

### Phase 1: データフェッチの共通化

**目標**: Tripデータのフェッチを1回に統一

#### 1-1. TripProviderの作成（修正版）

**重要**: Server Componentでfetchする方式に変更

```typescript
// app/(planner)/[userSlug]/[tripSlug]/TripProvider.tsx
'use client'

import { createContext, useContext, ReactNode } from 'react'
import type { Trip } from '@/lib/core/types'

interface TripContextValue {
  trip: Trip
  // refreshは削除: mutationsはAPI Route経由、revalidationはrouter.refresh()かrevalidatePath()を使用
}

const TripContext = createContext<TripContextValue | null>(null)

// Server Componentからpropsで受け取る方式
export function TripProvider({ 
  children, 
  trip 
}: { 
  children: ReactNode
  trip: Trip 
}) {
  return (
    <TripContext.Provider value={{ trip }}>
      {children}
    </TripContext.Provider>
  )
}

export function useTrip() {
  const context = useContext(TripContext)
  if (!context) {
    throw new Error('useTrip must be used within TripProvider')
  }
  return context
}
```

```typescript
// app/(planner)/[userSlug]/[tripSlug]/layout.tsx
// Server Component（'use client'なし）

import { getTrip } from '@/lib/travel/trips' // Server側のfetch関数
import { TripProvider } from './TripProvider'
import { TripClientLayout } from './TripClientLayout'

export default async function TripDetailLayout({
  children,
  timeline,
  map,
  social,
  params,
}: {
  children: ReactNode
  timeline: ReactNode
  map: ReactNode
  social: ReactNode
  params: { userSlug: string; tripSlug: string }
}) {
  // Server Componentで一度だけfetch
  const trip = await getTrip(params.tripSlug)
  
  if (!trip) {
    // エラーハンドリング
    return <div>Trip not found</div>
  }
  
  return (
    <TripProvider trip={trip}>
      <TripClientLayout
        timeline={timeline}
        map={map}
        social={social}
      />
      {/* children（page.tsx）は削除するため不要 */}
    </TripProvider>
  )
}
```


#### 1-2. layout.tsxの実装（Server Component）

上記の`layout.tsx`の実装例を参照。Server Componentでfetchし、Client Componentにpropsで渡す。

#### 1-3. Parallel RoutesでuseTripを使用

```typescript
// @timeline/default.tsx
'use client'
import { useTrip } from '../TripProvider'

export default function TimelineDefault() {
  const { trip, loading, error } = useTrip()
  // ... 既存のロジック
}
```

```typescript
// @map/default.tsx
'use client'
import { useTrip } from '../TripProvider'

export default function MapDefault() {
  const { trip, loading, error } = useTrip()
  // ... 既存のロジック
}
```

```typescript
// @social/default.tsx
'use client'
import { useTrip } from '../TripProvider'

export default function SocialDefault() {
  const { trip, loading, error } = useTrip()
  // ... 既存のロジック
}
```

### Phase 2: URL状態管理の統一

**目標**: `selectedDayId`, `selectedItineraryId`をURLクエリパラメータで統一管理

#### 2-1. URL状態管理フックの作成

```typescript
// app/(planner)/[userSlug]/[tripSlug]/useTripUrlState.ts
'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useCallback } from 'react'

export function useTripUrlState() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const selectedDayId = searchParams?.get('sd') || null
  const selectedItineraryId = searchParams?.get('si') || null
  const mapFocusMode = (searchParams?.get('mf') as 'all' | 'day' | 'single') || 'all'

  const setSelectedDayId = useCallback((dayId: string | null) => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    if (dayId) {
      params.set('sd', dayId)
      params.set('mf', 'day')
    } else {
      params.delete('sd')
      params.set('mf', 'all')
    }
    router.replace(`?${params.toString()}`)
  }, [searchParams, router])

  const setSelectedItineraryId = useCallback((itineraryId: string | null) => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    if (itineraryId) {
      params.set('si', itineraryId)
      params.set('mf', 'single')
    } else {
      params.delete('si')
      params.set('mf', 'all')
    }
    router.replace(`?${params.toString()}`)
  }, [searchParams, router])

  return {
    selectedDayId,
    selectedItineraryId,
    mapFocusMode,
    setSelectedDayId,
    setSelectedItineraryId,
  }
}
```

#### 2-2. Parallel RoutesでURL状態を使用

```typescript
// @timeline/default.tsx
import { useTripUrlState } from '../useTripUrlState'

export default function TimelineDefault() {
  const { trip } = useTrip()
  const { selectedDayId, selectedItineraryId, setSelectedDayId, setSelectedItineraryId } = useTripUrlState()
  // ...
}
```

```typescript
// @map/default.tsx
import { useTripUrlState } from '../useTripUrlState'

export default function MapDefault() {
  const { trip } = useTrip()
  const { selectedDayId, selectedItineraryId, mapFocusMode } = useTripUrlState()
  // ...
}
```

### Phase 3: page.tsxのロジック移行

**目標**: `page.tsx`のロジックを`@timeline`に移行

#### 3-1. page.tsxの機能を分析

- Tripデータフェッチ → TripProviderに移行済み
- **3つのビューの切り替え** → `@timeline`に移行（条件付きレンダリング）
  - Summary View → `TripSummaryView`
  - Itinerary View → `TripItineraryView`
  - Checklist View → `TripChecklistView`
- 地図表示 → `@map/default.tsx`に移行済み
- ソーシャル機能 → `@social/default.tsx`に移行済み
- モーダル管理 → `@timeline`に移行
- 編集機能 → `@timeline`に移行
- **左メニュー（NavigationMenu）** → `layout.tsx`または`@timeline`に移行

#### 3-2. 3つのビューの切り替え実装

**方針**: `@timeline/default.tsx`でURLクエリパラメータ `view` を読み取り、条件付きレンダリングで3つのビューを切り替える

**注意**: 現状は`?view=summary|itinerary|checklist`で管理するが、将来的にはSegmentベース（`/summary`, `/itinerary`, `/checklist`）への移行を検討する。Segmentベースにすると：
- 現在のview状態がURLで明確
- `scroll`が安定
- layoutがキャッシュされる
- Parallel Routesの転用がしやすい

ただし、v3では`?view=...`のままで実装し、v4以降でSegmentベースへの移行を検討する。

```typescript
// @timeline/default.tsx
'use client'
import { useSearchParams } from 'next/navigation'
import { useTrip } from '../TripProvider'
import TripSummaryView from '@/components/trip/TripSummaryView'
import TripItineraryView from '@/components/trip/TripItineraryView'
import TripChecklistView from '@/components/trip/TripChecklistView'
// ...

export default function TimelineDefault() {
  const { trip, loading, error } = useTrip()
  const searchParams = useSearchParams()
  
  // URLクエリパラメータから現在のビューを取得（デフォルトは summary）
  const currentView = (searchParams?.get('view') as 'summary' | 'itinerary' | 'checklist') || 'summary'
  
  // ... その他の状態管理
  
  if (loading) {
    return <Loading className="py-6" />
  }
  
  if (error || !trip) {
    // エラー表示
    return <div>Error loading trip</div>
  }
  
  return (
    <>
      {/* Summary View */}
      {currentView === 'summary' && (
        <>
          <TripHeroSection trip={trip} ... />
          <TripSummaryView trip={trip} ... />
        </>
      )}
      
      {/* Itinerary View */}
      {currentView === 'itinerary' && (
        <TripItineraryView
          trip={trip}
          // ... props
        />
      )}
      
      {/* Checklist View */}
      {currentView === 'checklist' && (
        <TripChecklistView tripId={trip.id} readOnly={!canEdit} />
      )}
      
      {/* モーダル類 */}
      {showAddScheduleModal && (
        <AddScheduleModal ... />
      )}
      {/* ... その他のモーダル */}
    </>
  )
}
```

**重要なポイント**:
- **条件付きレンダリング**: `currentView` に基づいて3つのビューを切り替え
- **URLクエリパラメータ**: `?view=summary|itinerary|checklist` でビューを管理
- **状態の共有**: 各ビューで必要な状態（`selectedDayId`, `selectedItineraryId`など）は`useTripUrlState`で管理

#### 3-3. 左メニュー（NavigationMenu）の配置

**方針**: `layout.tsx`で`TripPageLayout`を使用し、左メニューを配置

```typescript
// layout.tsx
import TripPageLayout from '@/components/trip/TripPageLayout'
import { useTrip } from './TripProvider'
import { useTripUrlState } from './useTripUrlState'

export default function TripDetailLayout({
  timeline,
  map,
  social,
}: {
  timeline: ReactNode
  map: ReactNode
  social: ReactNode
}) {
  const { trip } = useTrip()
  const { setSelectedDayId } = useTripUrlState()
  const [leftNavExpanded, setLeftNavExpanded] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const navigateToSection = (sectionId: string) => {
    // URLクエリパラメータを更新してビューを切り替え
    // ...
  }
  
  const handleDayClick = (dayId: string) => {
    // 日程を選択してItinerary Viewに切り替え
    // ...
  }
  
  return (
    <TripPageLayout
      trip={trip}
      leftNavExpanded={leftNavExpanded}
      onToggleLeftNav={() => setLeftNavExpanded(!leftNavExpanded)}
      mobileMenuOpen={mobileMenuOpen}
      onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
      onNavigateToSection={navigateToSection}
      onDayClick={handleDayClick}
      rightPaneWidth={/* currentView === 'checklist' ? 'zero' : 'default' */}
    >
      {timeline}
      {/* 右ペインとソーシャルパネルは別途配置 */}
    </TripPageLayout>
  )
}
```

**または、より簡潔な実装**:

```typescript
// layout.tsx
export default function TripDetailLayout({
  timeline,
  map,
  social,
}: {
  timeline: ReactNode
  map: ReactNode
  social: ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 左メニュー + 左ペイン + 右ペインのレイアウト */}
      <div className="flex">
        {/* 左メニュー（デスクトップのみ） */}
        <div className="hidden md:block">
          <NavigationMenu ... />
        </div>
        
        {/* 左ペイン + 右ペイン */}
        <div className="flex flex-1">
          <div className="flex-1">
            {timeline}
          </div>
          <div className="hidden lg:block right-pane-responsive">
            {map}
          </div>
        </div>
      </div>
      
      {/* ソーシャルパネル */}
      <div className="...">
        {social}
      </div>
    </div>
  )
}
```

#### 3-4. モーダル管理の移行

```typescript
// @timeline/default.tsx
'use client'
import { useState } from 'react'
import AddScheduleModal from '@/components/modals/AddScheduleModal'
// ...

export default function TimelineDefault() {
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false)
  // ...
  return (
    <>
      {currentView === 'itinerary' && (
        <TripItineraryView
          // ...
          onAddSchedule={() => setShowAddScheduleModal(true)}
        />
      )}
      {showAddScheduleModal && (
        <AddScheduleModal
          // ...
          onClose={() => setShowAddScheduleModal(false)}
        />
      )}
    </>
  )
}
```

#### 3-3. page.tsxの削除

- すべてのロジックを移行後、`page.tsx`を削除
- `layout.tsx`から`{children}`の参照を削除

### Phase 4: レイアウトの最適化

**目標**: 左ペインと右ペインのレイアウトを最適化

#### 4-1. レスポンシブ対応

- モバイル: タイムラインのみ表示、地図はモーダル
- タブレット: タイムライン + 地図（縦並び）
- デスクトップ: タイムライン（左） + 地図（右）

#### 4-2. スクロール連動

- タイムラインと地図のスクロール連動機能
- URL状態管理と連携

## 📋 実装チェックリスト

### Phase 1: データフェッチの共通化
- [ ] Server ComponentでTripをfetchする関数を作成（`getTrip`）
- [ ] `layout.tsx`はServer Componentのまま維持（`'use client'`は付けない）
- [ ] `layout.tsx`でServer ComponentとしてTripをfetch
- [ ] `TripProvider`を修正（propsでtripを受け取る方式、refreshは削除）
- [ ] `TripClientLayout`を作成（Client Component、Providerの直上に配置）
- [ ] `@timeline/default.tsx`で`useTrip`を使用
- [ ] `@map/default.tsx`で`useTrip`を使用
- [ ] `@social/default.tsx`で`useTrip`を使用
- [ ] データフェッチの重複を確認（1回のみ、Server Componentで）

### Phase 2: URL状態管理の統一
- [ ] `useTripUrlState`フックを作成
- [ ] `router.replace()`に`{ scroll: false }`を追加
- [ ] `searchParams`の書き換えロジックにdebounceを追加
- [ ] `@timeline`でURL状態を使用
- [ ] `@map`でURL状態を使用
- [ ] URLクエリパラメータの同期を確認

### Phase 3: page.tsxのロジック移行
- [ ] 3つのビューの切り替えを`@timeline`に実装
  - [ ] URLクエリパラメータ `view` の読み取り
  - [ ] Summary View の条件付きレンダリング
  - [ ] Itinerary View の条件付きレンダリング
  - [ ] Checklist View の条件付きレンダリング
- [ ] 左メニュー（NavigationMenu）の配置を決定
  - [ ] `TripClientLayout`で`TripPageLayout`を使用
  - [ ] 左メニューの状態管理（折りたたみ、モバイルメニュー）
  - [ ] ナビゲーション機能（ビュー切り替え、セクションジャンプ、日程ジャンプ）
- [ ] モーダル管理を`@timeline`に移行
- [ ] 編集機能を`@timeline`に移行
- [ ] その他の機能を移行
- [ ] **`page.tsx`を完全に削除**（hiddenではなく削除）
- [ ] `layout.tsx`から`{children}`の参照を削除

### Phase 4: POIProviderの実装
- [ ] `POIProvider`を作成
- [ ] `@map/default.tsx`内で`POIProvider`を使用（layout.tsx直下ではなく）
- [ ] `@timeline`から`@map`への連携をCustomEventベースで実装
  - [ ] `@timeline`で`window.dispatchEvent('planner:poi-open', { detail: poiData })`を発火
  - [ ] `@map`で`window.addEventListener('planner:poi-open', handler)`で受け取る
- [ ] イベント型定義を作成（TypeScriptの型安全性を確保）

### Phase 5: レイアウトの最適化
- [ ] レスポンシブ対応を確認
- [ ] スクロール連動機能を実装
- [ ] UI/UXの最終調整
- [ ] `@timeline/page.tsx`と`@map/page.tsx`、`@social/page.tsx`を削除（default.tsxのみ使用）

## 🎯 期待される効果

1. **コードの可読性向上**
   - `page.tsx`の1620行を複数のファイルに分割
   - 各Parallel Routeが独立した責務を持つ

2. **パフォーマンス向上**
   - Tripデータのフェッチが1回に統一
   - 不要な再レンダリングを削減

3. **保守性向上**
   - 左ペインと右ペインのロジックが分離
   - 各機能のテストが容易になる

4. **拡張性向上**
   - 新しいParallel Routeの追加が容易
   - 機能の追加・削除が簡単

## 📋 左メニュー（NavigationMenu）の実装

### 既存実装の構造

左メニューは`TripPageLayout`コンポーネント内で実装されており、以下の機能を提供：

1. **3つのビューへのナビゲーション**
   - Summary (`?view=summary`)
   - Itinerary (`?view=itinerary`)
   - Checklist (`?view=checklist`)

2. **Summary内のセクションへのナビゲーション**
   - 天気予報 (`#weather-forecast`)
   - 予約 (`#reservation`)
   - 予算 (`#budget`)
   - その他のサマリーセクション

3. **日程（Day）へのナビゲーション**
   - 各日程への直接ジャンプ
   - 日付形式（`yyyy-mm-dd`）またはIDベース

4. **レスポンシブ対応**
   - **デスクトップ**: `hidden md:block` で常時表示、折りたたみ可能
   - **モバイル**: スライドメニュー（`md:hidden`）、ハンバーガーボタンで開閉

### Parallel Routes実装での配置

**オプション1: `layout.tsx`で`TripPageLayout`を使用**

```typescript
// layout.tsx
import TripPageLayout from '@/components/trip/TripPageLayout'

export default function TripDetailLayout({
  timeline,
  map,
  social,
}: {
  timeline: ReactNode
  map: ReactNode
  social: ReactNode
}) {
  const { trip } = useTrip()
  // ... 状態管理
  
  return (
    <TripPageLayout
      trip={trip}
      leftNavExpanded={leftNavExpanded}
      onToggleLeftNav={...}
      mobileMenuOpen={mobileMenuOpen}
      onToggleMobileMenu={...}
      onNavigateToSection={navigateToSection}
      onDayClick={handleDayClick}
      rightPaneWidth={currentView === 'checklist' ? 'zero' : 'default'}
    >
      {timeline}
    </TripPageLayout>
  )
}
```

**オプション2: `layout.tsx`で独自レイアウトを実装**

```typescript
// layout.tsx
import NavigationMenu from '@/components/planner/NavigationMenu'

export default function TripDetailLayout({
  timeline,
  map,
  social,
}: {
  timeline: ReactNode
  map: ReactNode
  social: ReactNode
}) {
  return (
    <div className="flex">
      {/* 左メニュー */}
      <div className="hidden md:block">
        <NavigationMenu ... />
      </div>
      
      {/* メインコンテンツ + 右ペイン */}
      <div className="flex-1">
        {timeline}
      </div>
      
      {/* 右ペイン */}
      <div className="hidden lg:block">
        {map}
      </div>
    </div>
  )
}
```

**推奨**: オプション1（`TripPageLayout`を使用）を推奨
- 既存の実装をそのまま活用できる
- レスポンシブ対応が既に実装済み
- モバイルメニューの実装も含まれている

## 📱 レスポンシブデザインの考え方（既存実装の踏襲）

### ブレークポイント戦略

既存の実装では、**`md:` (768px)** を主要なブレークポイントとして使用しています。

```
モバイル: < 768px
デスクトップ: >= 768px
```

### レイアウト構造

#### デスクトップ（>= 768px）

```
┌─────────────────────────────────────────────────────┐
│  Left Nav (固定幅) │  Main Content (flex-1) │  Right Pane │
│  (md:block)        │  (scrollable)         │  (md:block) │
└─────────────────────────────────────────────────────┘
```

- **左ナビゲーション**: `hidden md:block` で表示
- **メインコンテンツ**: `flex-1` で可変幅
- **右ペイン（地図）**: `hidden md:block right-pane-responsive` で表示

#### モバイル（< 768px）

```
┌─────────────────────┐
│  Main Content       │
│  (全幅)             │
│                     │
│                     │
│              [Map]  │ ← 右下に固定（FAB）
└─────────────────────┘
│  [Mobile Map Modal] │ ← 全画面モーダル（FABクリックで表示）
└─────────────────────┘
```

- **左ナビゲーション**: スライドメニュー（`md:hidden`）
- **メインコンテンツ**: 全幅表示
- **右ペイン（地図）**: 非表示（`hidden md:block`）
- **地図FAB**: `md:hidden fixed right-4 bottom-5` でモバイルのみ表示、右下に固定
  - クリックで全画面モーダルを開く
  - `zidx-map-button` (z-index: 300) で他の要素より前面に表示
- **モバイル地図モーダル**: `md:hidden fixed inset-0` で全画面表示
  - `zidx-float-modal` (z-index: 600) で最前面に表示
  - バックドロップ（`bg-black/40 backdrop-blur-sm`）で背景を暗く
  - ヘッダーに閉じるボタンを配置

### CSSクラスの使用

#### 1. `right-pane-responsive`

```css
/* app/globals.css */
.right-pane-responsive {
  width: 100%;
  max-width: 100%;
}

@media (min-width: 768px) {
  .right-pane-responsive {
    width: 50%;
    max-width: 50%;
  }
}

@media (min-width: 1280px) {
  .right-pane-responsive {
    width: 40%;
    max-width: 40%;
  }
}
```

**用途**: 右ペイン（地図）の幅をレスポンシブに制御
- モバイル: 非表示（`hidden md:block`）
- タブレット（768px〜）: 50%
- デスクトップ（1280px〜）: 40%

#### 2. `main-content-full-width`

```css
/* app/globals.css */
.main-content-full-width {
  width: 100%;
  max-width: 100%;
}
```

**用途**: チェックリストビューなど、右ペインを非表示にする際にメインコンテンツを全幅表示

**重要な仕様**:
- **チェックリストビュー時は、viewport の幅に関係なく Main Content が全幅になる**
- `TripRightPane` コンポーネントで `currentView === 'checklist'` の場合は `return null` で右ペイン自体を非表示
- `TripPageLayout` で `rightPaneWidth === 'zero'` の場合、`main-content-full-width` クラスが適用される
- これにより、デスクトップでもチェックリストビュー時はメインコンテンツが全幅表示される

#### 3. `main-content-scrollable`

```css
/* app/globals.css */
.main-content-scrollable {
  overflow-y: auto;
  scrollbar-hide: true;
}
```

**用途**: メインコンテンツのスクロール可能領域

### 実装パターン

#### パターン1: デスクトップのみ表示

```tsx
<div className="hidden md:block">
  {/* デスクトップのみ表示 */}
</div>
```

#### パターン2: モバイルのみ表示

```tsx
<div className="md:hidden">
  {/* モバイルのみ表示 */}
</div>
```

#### パターン3: レスポンシブ幅

```tsx
<div className="w-full md:w-1/2 xl:w-2/5">
  {/* モバイル: 100%, タブレット: 50%, デスクトップ: 40% */}
</div>
```

### Parallel Routesでの適用

#### layout.tsx

```tsx
export default function TripDetailLayout({
  timeline,
  map,
  social,
}: {
  timeline: ReactNode
  map: ReactNode
  social: ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 左ペイン + 右ペイン（デスクトップ） */}
      <div className="flex flex-col lg:flex-row">
        {/* 左ペイン: タイムライン */}
        <div className="flex-1 relative">
          {timeline}
        </div>
        {/* 右ペイン: 地図（デスクトップのみ） */}
        <div className="hidden lg:block lg:w-1/2 xl:w-2/5 border-l border-gray-200 right-pane-responsive">
          {map}
        </div>
      </div>
      
      {/* モバイル地図FAB（右下に固定） */}
      <button
        type="button"
        onClick={handleOpenMobileMap}
        className="md:hidden fixed right-4 bottom-5 zidx-map-button inline-flex h-14 w-14 items-center justify-center rounded-full border border-emerald-200 bg-emerald-500 text-white shadow-lg hover:bg-emerald-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 transition-colors"
        aria-label="Open map"
      >
        <Icon icon="mdi:map-outline" className="h-6 w-6" aria-hidden="true" />
      </button>
      
      {/* モバイル地図モーダル（FABクリックで表示） */}
      {mobileMapOpen && (
        <div className="fixed inset-0 zidx-float-modal md:hidden">
          {/* バックドロップ */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
          {/* モーダルコンテンツ */}
          <div
            className="absolute inset-0 bg-white flex flex-col"
            role="dialog"
            aria-modal="true"
          >
            {/* ヘッダー */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Icon icon="mdi:map-outline" className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                <span className="text-sm font-semibold text-gray-900">Map</span>
              </div>
              <button
                type="button"
                onClick={handleCloseMobileMap}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 transition-colors"
                aria-label="Close"
              >
                <Icon icon="mdi:close" className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            {/* 地図コンテンツ */}
            <div className="flex-1">
              {map}
            </div>
          </div>
        </div>
      )}
      
      {/* ソーシャルパネル */}
      <div className="fixed bottom-0 left-0 right-0 lg:fixed lg:right-0 lg:top-0 lg:bottom-0 lg:w-80 border-t lg:border-t-0 lg:border-l border-gray-200 bg-white zidx-popup-menu">
        {social}
      </div>
    </div>
  )
}
```

### 重要なポイント

1. **ブレークポイントの統一**
   - `md:` (768px) を主要ブレークポイントとして使用
   - `lg:` (1024px) や `xl:` (1280px) は補助的に使用

2. **モバイルファースト**
   - デフォルトはモバイル向けスタイル
   - `md:` プレフィックスでデスクトップ向けスタイルを追加

3. **右ペインの非表示**
   - モバイルでは `hidden md:block` で非表示
   - **チェックリストビュー時は、viewport の幅に関係なく Main Content が全幅になる**
     - `TripRightPane` で `currentView === 'checklist'` の場合は `return null`
     - `TripPageLayout` で `rightPaneWidth === 'zero'` の場合、`main-content-full-width` クラスが適用される
     - デスクトップでもチェックリストビュー時はメインコンテンツが全幅表示される

4. **モバイル地図の実装**
   - **右下に固定されたFAB（Floating Action Button）で地図を呼び出す**
     - `fixed right-4 bottom-5` で右下に固定
     - `md:hidden` でモバイルのみ表示
     - `zidx-map-button` (z-index: 300) で他の要素より前面に表示
   - FABクリックで全画面モーダルを開く
   - モーダルは `zidx-float-modal` (z-index: 600) で最前面に表示


5. **z-index管理**
   - `app/globals.css` でz-indexを定義
   - モーダル: `zidx-float-modal` (600)
   - 地図FAB: `zidx-map-button` (300)
   - ソーシャルパネル: `zidx-popup-menu` (500)

## 📝 注意事項

1. **段階的な移行**
   - 一度にすべてを変更せず、Phaseごとに実装
   - 各Phaseで動作確認を行う

2. **後方互換性**
   - URLクエリパラメータの形式を維持
   - 既存のブックマークやリンクが動作するように

3. **エラーハンドリング**
   - TripProviderでエラー状態を適切に管理
   - 各Parallel Routeでエラー表示を統一

4. **レスポンシブデザインの維持**
   - 既存のブレークポイント戦略（`md:` 768px）を踏襲
   - `right-pane-responsive`、`main-content-full-width` などのCSSクラスを使用
   - モバイル地図はFAB + 全画面モーダルで実装

