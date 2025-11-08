# Issue: POIDialog経由でItinerary追加後に地図表示が日全体へ飛ぶ

**作成日**: 2025-11-08  
**状態**: 🟡 未着手  
**優先度**: 中  
**関連ファイル**:
- `components/trip/POIDialog.tsx`
- `components/trip/TripItineraryView.tsx`
- `components/trip/TripMap.tsx`
- `hooks/useItineraryEditor.ts`

---

## 📋 概要

POIDialog内の`Select day to add`ボタンからItineraryにPOIを追加すると、対象日のItineraryカードは正しい位置に挿入されるものの、地図表示が自動的にその日の全体ビューへ切り替わる。ユーザーは追加したばかりのPOIにフォーカスしたまま詳細操作を続けたいが、地図が別の場所に移動してしまうため操作コンテキストが失われる。

---

## 🐛 再現手順
1. Trip画面で地図上のPOIマーカーをクリックし、POIDialogを開く
2. `Select day to add`をクリックし、任意の日付を選択してItineraryに追加する
3. Itineraryリストには追加したPOIのカードが正しく挿入されるが、地図はその日の全体にズーム・パンし直され、POIDialogもフォーカスを失う

---

## 🔍 想定原因

### 根本原因の特定
コード調査により、以下の問題フローが明らかになりました：

#### 1. handleAddFromPOI の処理フロー
```typescript
// app/[userSlug]/[tripSlug]/page.tsx: 612-661行目
const handleAddFromPOI = async (placeId: string, dayId: string) => {
  try {
    setLoadingDayIds(prev => new Set(prev).add(dayId))
    
    const currentPoiData = poiData
    if (!currentPoiData) return

    // API呼び出し
    const response = await makeAuthenticatedRequest('/api/itineraries', { /* ... */ })

    if (response.ok) {
      const newItinerary = await response.json()
      
      // ⚠️ 問題1: handleScheduleAddedを呼び出す
      handleScheduleAdded(newItinerary)
      
      // ⚠️ 問題2: その後すぐにPOIダイアログを閉じる
      setPoiData(null)
    }
  } finally {
    setLoadingDayIds(prev => { /* ... */ })
  }
}
```

**問題点**:
- `handleScheduleAdded(newItinerary)`が呼ばれると、地図のフォーカスモードが`'single'`に変更される
- しかし**直後に`setPoiData(null)`が実行されてPOIDialogが閉じられる**
- ユーザーは追加したPOIの詳細を確認できない

#### 2. handleScheduleAdded の副作用
```typescript
// app/[userSlug]/[tripSlug]/page.tsx: 545-609行目
const handleScheduleAdded = async (newItinerary: any) => {
  // Trip状態を更新（555-580行目）
  setTrip(prevTrip => { /* ... */ })
  
  setInsertAfterIndex(undefined)
  
  // ⚠️ 問題3: 新規Itineraryを選択状態にする
  setSelectedItineraryId(newItinerary.id)
  setMapFocusMode('single')

  // ⚠️ 問題4: POIDialogを再表示しようとする
  if (newItinerary.place_data?.place_id) {
    setPoiData({
      placeId: newItinerary.place_data.place_id,
      name: newItinerary.title,
      location: {
        lat: newItinerary.place_data.geometry!.location.lat,
        lng: newItinerary.place_data.geometry!.location.lng
      },
      placeData: newItinerary.place_data
    })
  }
}
```

**問題点**:
- `handleScheduleAdded`の最後で`setPoiData()`を呼び出し、POIDialogを再表示しようとしている
- しかし**`handleAddFromPOI`側で後から`setPoiData(null)`が実行される**ため、POIDialogは結局閉じられる

#### 3. TripMap.tsx のセンタリングロジック
```typescript
// components/trip/TripMap.tsx: 719-770行目
useEffect(() => {
  if (!map || !selectedItineraryId) return
  if (focusMode !== 'single' && !scrollSyncEnabled) return

  const selectedItinerary = itineraries.find(itinerary => itinerary.id === selectedItineraryId)
  if (!selectedItinerary?.place_data?.geometry?.location) return

  // POIDialogが表示されている場合のチェック（728-745行目）
  if (poiData) {
    const selectedPlaceId = selectedItinerary.place_data?.place_id
    if (selectedPlaceId && poiData.placeId && poiData.placeId !== selectedPlaceId) {
      // ⚠️ Google POIマーカークリック時はフォーカス移動を抑制
      // ただし、マーカーのハイライトは維持
      return
    }
  }

  // 選択されたVenueにズーム・フォーカス（747-769行目）
  const position = { /* ... */ }
  smoothMoveToLocation(map, position.lat, position.lng, DEFAULT_ZOOM_LEVEL)
}, [selectedItineraryId, map, itineraries, directionsRenderer, focusMode, scrollSyncEnabled, poiData])
```

**問題点**:
- `handleAddFromPOI`で`setPoiData(null)`が実行された後、`selectedItineraryId`は新しいItineraryのIDに設定されている
- しかし`poiData`が`null`になったため、POIDialog抑制ロジック（731-745行目）が機能せず、地図が新しいItineraryの位置に移動する
- この時点でPOIDialogは閉じられているため、ユーザーにとって「突然地図が移動した」という印象を受ける

### データフロー図
```
POI Dialog → Select Day
    ↓
handleAddFromPOI()
    ↓
API: POST /api/itineraries
    ↓
handleScheduleAdded(newItinerary)
    ├→ setSelectedItineraryId(newItinerary.id)
    ├→ setMapFocusMode('single')
    └→ setPoiData({ placeId: ..., ... })  ← POIDialogを再表示しようとする
    ↓
setPoiData(null)  ← 直後にnullで上書き！
    ↓
TripMap useEffect:
  - poiData === null
  - selectedItineraryId === newItinerary.id
  - focusMode === 'single'
    ↓
地図が新Itinerary位置へ移動（POIDialog抑制ロジックが機能しない）
```

---

## 💡 解決方針（提案）

### 修正アプローチ

#### Option 1: handleAddFromPOIで`setPoiData(null)`を削除（推奨）
```typescript
// app/[userSlug]/[tripSlug]/page.tsx: 612-661行目
const handleAddFromPOI = async (placeId: string, dayId: string) => {
  try {
    setLoadingDayIds(prev => new Set(prev).add(dayId))
    
    const currentPoiData = poiData
    if (!currentPoiData) return

    const response = await makeAuthenticatedRequest('/api/itineraries', { /* ... */ })

    if (response.ok) {
      const newItinerary = await response.json()
      
      // ✅ handleScheduleAddedを呼び出す（内部でsetPoiDataが実行される）
      handleScheduleAdded(newItinerary)
      
      // ❌ setPoiData(null) を削除
      // → POIDialogは開いたまま維持され、追加したItineraryの詳細が表示される
    }
  } finally {
    setLoadingDayIds(prev => { /* ... */ })
  }
}
```

**メリット**:
- 最小限の変更で問題を解決
- `handleScheduleAdded`の既存動作（POIDialog再表示）が正しく機能する
- ユーザーは追加したItineraryの詳細をすぐに確認できる

**デメリット**:
- 「POIDialogを閉じる」という元の意図が不明（レビュー必要）→レビューの結果、特に意味ない事が判明

#### Option 2: handleScheduleAddedのフラグ追加
```typescript
// app/[userSlug]/[tripSlug]/page.tsx
const handleScheduleAdded = async (newItinerary: any, options?: { keepPoiDialogOpen?: boolean }) => {
  // ... 既存の処理

  // options.keepPoiDialogOpenがfalseの場合のみPOIDialogを再表示
  if (options?.keepPoiDialogOpen !== false) {
    if (newItinerary.place_data?.place_id) {
      setPoiData({ /* ... */ })
    }
  }
}

const handleAddFromPOI = async (placeId: string, dayId: string) => {
  // ...
  if (response.ok) {
    const newItinerary = await response.json()
    
    // POIDialogを開いたまま維持するオプションを渡す
    handleScheduleAdded(newItinerary, { keepPoiDialogOpen: true })
    
    // setPoiData(null)を削除
  }
}
```

**メリット**:
- `handleScheduleAdded`の挙動を呼び出し元で制御できる
- AddScheduleModalからの呼び出しなど、他の経路への影響を最小化

**デメリット**:
- コードが複雑になる
- 現状では不要な抽象化かもしれない

#### Option 3: POIDialog側でItinerary追加完了通知を受け取る
```typescript
// POIDialog.tsx
const handleAddToDay = (dayId: string) => {
  if (onAddToItinerary) {
    onAddToItinerary(poiData.placeId, dayId)
    setShowDaySelector(false)
    // ❌ setPoiData(null)は呼ばない → ダイアログは開いたまま
  }
}
```

**メリット**:
- UI側で状態を制御
- バックエンドとの連携がシンプル

**デメリット**:
- 現状の実装では親側で`setPoiData(null)`を呼んでいるため、根本的な解決にならない

### 推奨実装
**Option 1が最もシンプルで効果的**：
1. `handleAddFromPOI`内の`setPoiData(null)`を削除
2. `handleScheduleAdded`の既存動作（POIDialog再表示）を活用
3. 副作用として、TripMap.tsxのPOIDialog抑制ロジック（731-745行目）が正常に機能する

### 追加の改善案
#### スクロール連動の改善
現在`handleScheduleAdded`は`setMapFocusMode('single')`を実行していますが、追加したItineraryカードへのスクロールも実装すると、UXがさらに向上します：

```typescript
const handleScheduleAdded = async (newItinerary: any) => {
  // ... 既存の処理

  // 新規Itineraryを選択状態にする
  setSelectedItineraryId(newItinerary.id)
  setMapFocusMode('single')

  // ✅ 追加: Itineraryカードまでスクロール
  if (scrollToItineraryRef?.current) {
    scrollToItineraryRef.current(newItinerary.id)
  }

  // POIDialogを表示
  if (newItinerary.place_data?.place_id) {
    setPoiData({ /* ... */ })
  }
}
```

---

## ✅ 完了条件
- [ ] POIDialogからItineraryを追加した直後もPOIDialogは閉じず、追加したPOIの詳細を表示し続ける
- [ ] 地図は追加したPOIを中心に保持し、他の地点へ自動移動しない
- [ ] Itineraryリストは追加したカードをスクロールして強調表示する（既存機能を維持）
- [ ] 他機能（日単位切り替え・別Itinerary選択）に回帰してもリグレッションがない

---

## 🔗 参考

### 関連コード
- **`app/[userSlug]/[tripSlug]/page.tsx`**
  - 545-609行目: `handleScheduleAdded()` - Itinerary追加後の状態管理
  - 612-661行目: `handleAddFromPOI()` - POIDialogからのItinerary追加
  - 52-53行目: State定義（`selectedItineraryId`, `mapFocusMode`）
  - 189-241行目: `handleItineraryClick()` - Itineraryクリック時の処理

- **`components/trip/TripMap.tsx`**
  - 719-770行目: useEffect - `selectedItineraryId`変更時のフォーカス処理
  - 728-745行目: POIDialog表示時のフォーカス移動抑制ロジック

- **`components/modals/POIDialog.tsx`**
  - 229-234行目: `handleAddToDay()` - 日付選択時の処理

- **`components/trip/TripItineraryView.tsx`**
  - 17-44行目: Props定義（`scrollToItineraryRef`など）
  - 178-203行目: useEffect - `scrollToItineraryRef`の登録

### 関連Issue
- `poi-dialog-stale-content-during-loading.md` - POI切り替え時のローディング表示問題
- `map-poi-dialog-focus-conflict.md` - POIクリック時の地図フォーカス競合

### テスト観点
1. **正常系**: POIDialogから日付選択してItinerary追加後、POIDialogが開いたまま追加したPOIの詳細が表示されること
2. **地図フォーカス**: Itinerary追加後、地図が追加したPOIを中心に保持すること
3. **スクロール連動**: 追加したItineraryカードがスクロール表示されること
4. **マーカー選択**: 追加したItineraryのマーカーがハイライトされること
5. **他機能への影響**: AddScheduleModalからのItinerary追加にリグレッションがないこと

### 想定される副作用と対策
#### AddScheduleModalからのItinerary追加
`handleScheduleAdded`は`AddScheduleModal`からも呼ばれるため、その挙動への影響を確認する必要があります：

```typescript
// app/[userSlug]/[tripSlug]/page.tsx: AddScheduleModal呼び出し
<AddScheduleModal
  show={showAddScheduleModal}
  tripId={trip.id}
  dayId={selectedDayId!}
  onClose={() => {
    setShowAddScheduleModal(false)
    setSelectedDayId(null)
    setInsertAfterIndex(undefined)
  }}
  onScheduleAdded={handleScheduleAdded}  // ← 同じハンドラーを使用
  insertAfterIndex={insertAfterIndex}
/>
```

**確認項目**:
- AddScheduleModalからのItinerary追加時もPOIDialogが開くべきか？
  - ✅ YES: 既存の動作（589-608行目）を維持
  - ❌ NO: Option 2（フラグ追加）を検討

**結論**: 既存の動作ではAddScheduleModalからもPOIDialogを開く設計になっているため、Option 1で問題なし

