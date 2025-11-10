# 地図が東京にリセットされる問題

## ステータス
- **状態**: 🔍 調査中
- **優先度**: 🟡 Medium
- **対象バージョン**: v1.10.0
- **関連コンポーネント**: `components/trip/TripMap.tsx`
- **作成日**: 2025-11-10

## 問題の概要

Trip 編集中に、特定の操作を行うと地図の中心位置が東京（デフォルト位置）にリセットされる問題が発生している。

## 発生する具体的なケース

### 1. Create New Trip 後、地図が東京になる
- **再現手順**:
  1. 新しいトリップを作成
  2. 目的地を設定せずにトリップページを開く
- **期待される動作**: 最初のItineraryの位置、またはデフォルトで日本の中心などを表示
- **実際の動作**: 東京が表示される
- **原因の仮説**: `trip.destination_place` が未設定の場合、`initialCenter` が `undefined` になり、地図初期化時のデフォルト（東京）が使用される

### 2. POI 検索後、Itinerary Card として追加→地図が東京になる
- **再現手順**:
  1. POI検索でVenueを検索
  2. Itinerary Cardとして追加
  3. 地図を確認
- **期待される動作**: 追加したVenueの位置に地図が移動し、全Venueが表示される範囲に自動調整される
- **実際の動作**: 地図が東京にリセットされる
- **補足**: 個別の Itinerary Card をクリックすると、地図はその Venue をパンする（正常動作）
- **原因の仮説**: 
  - Itinerary追加後、`fitBounds` が実行される前に何らかの理由でリセットされる
  - または、`itineraries` 配列の参照が変わらず、useEffect が再実行されない

### 3. Itinerary Card の Activity をサブまで指定すると、地図が東京になる
- **再現手順**:
  1. 既存のItinerary Cardを開く
  2. Activity Tagをサブカテゴリまで指定（例: Food & Drink → Restaurant）
  3. 保存
  4. 地図を確認
- **期待される動作**: 地図の位置は変わらない（Activityの変更は位置情報に影響しない）
- **実際の動作**: 地図が東京にリセットされる
- **原因の仮説**: 
  - Itineraryの更新により、`itineraries` の内容が変わるが、配列の参照自体は変わらない場合、useEffectが再実行されない
  - または、Activity変更時に何らかの理由で `validItineraries.length === 0` と判定される

## 技術的な調査内容

### TripMap.tsx の関連コード

#### 地図の初期化
```typescript
// components/trip/TripMap.tsx:242-393
const initializeMap = async () => {
  // ...
  const center = initialCenter || { lat: 35.6762, lng: 139.6503 } // デフォルトは東京
  // ...
}
```

#### Itineraries変更時の処理
```typescript
// components/trip/TripMap.tsx:396-639
useEffect(() => {
  if (!map || !directionsService || !directionsRenderer) return

  // 既存のマーカーをクリア
  markersRef.current.forEach(markerData => {
    if (markerData.marker) {
      markerData.marker.map = null
    }
  })
  markersRef.current = []

  // 位置情報がある itineraries をフィルタリング
  const validItineraries = itineraries.filter(
    itinerary => !!itinerary.place_data?.geometry?.location
  )

  if (validItineraries.length === 0) {
    logger.debug('⚠️ No valid itineraries, resetting map')
    // 行先が無い場合は初期センターへ
    if (initialCenter) {
      map.setCenter(initialCenter)
      map.setZoom(11)
    }
    return
  }

  // ... マーカー作成 ...

  // 地図の範囲を全Venueが見えるように調整
  if (focusMode === 'all' || focusMode === 'day') {
    const bounds = new window.google.maps.LatLngBounds()
    validItineraries.forEach(itinerary => {
      bounds.extend({
        lat: itinerary.place_data!.geometry!.location.lat,
        lng: itinerary.place_data!.geometry!.location.lng,
      })
    })
    map.fitBounds(bounds)
  }
}, [map, directionsService, directionsRenderer, itineraries, selectedDayId, focusMode, selectedItineraryId, initialCenter, scrollSyncEnabled, onItineraryClick, onPoiDataUpdate])
```

#### initialCenter の設定
```typescript
// components/trip/TripRightPane.tsx:70
<TripMap
  // ...
  initialCenter={trip.destination_place?.geometry?.location || undefined}
  // ...
/>
```

## 潜在的な問題点

### 1. useEffect の依存配列の問題
- `itineraries` 配列の参照が変わらない場合、配列の内容が変わってもuseEffectが再実行されない
- React のshallow comparisonにより、配列内のオブジェクトの変更は検出されない

### 2. initialCenter の fallback がない
- `trip.destination_place` が存在しない場合、`initialCenter` が `undefined` になる
- この場合、地図初期化時のデフォルト（東京）が使用される

### 3. validItineraries のフィルタリング
- `place_data?.geometry?.location` が一時的に存在しないケースがある可能性
- この場合、`validItineraries.length === 0` となり、地図がリセットされる

## 提案される修正案

### 修正案1: initialCenter のフォールバック改善
```typescript
// TripRightPane.tsx
const getInitialCenter = () => {
  // 1. Trip の destination_place を使用
  if (trip.destination_place?.geometry?.location) {
    return trip.destination_place.geometry.location
  }
  
  // 2. 最初の有効な Itinerary の位置を使用
  const firstItinerary = getFilteredItineraries().find(
    it => it.place_data?.geometry?.location
  )
  if (firstItinerary?.place_data?.geometry?.location) {
    return firstItinerary.place_data.geometry.location
  }
  
  // 3. フォールバック（日本の中心など）
  return { lat: 36.2048, lng: 138.2529 } // 日本の地理的中心
}

<TripMap
  // ...
  initialCenter={getInitialCenter()}
  // ...
/>
```

### 修正案2: 地図リセット条件の見直し
```typescript
// TripMap.tsx
if (validItineraries.length === 0) {
  logger.debug('⚠️ No valid itineraries, keeping current map position')
  // 地図をリセットしない（現在の位置を維持）
  return
}
```

### 修正案3: Itineraries 更新検出の改善
```typescript
// TripMap.tsx
// itineraries の内容変化を検出するため、JSON.stringify でシリアライズ
const itinerariesKey = useMemo(
  () => JSON.stringify(itineraries.map(it => ({
    id: it.id,
    place_id: it.place_data?.place_id,
    lat: it.place_data?.geometry?.location?.lat,
    lng: it.place_data?.geometry?.location?.lng,
    activity_tag: it.activity_tag
  }))),
  [itineraries]
)

useEffect(() => {
  // ...
}, [map, directionsService, directionsRenderer, itinerariesKey, selectedDayId, focusMode, selectedItineraryId, initialCenter, scrollSyncEnabled, onItineraryClick, onPoiDataUpdate])
```

## 次のステップ

1. [ ] ログを追加して、実際にどのケースで `validItineraries.length === 0` になるか確認
2. [ ] `itineraries` 配列の参照変更タイミングを確認
3. [ ] 修正案を実装してテスト
4. [ ] 修正内容をドキュメント化

## 参考資料
- [TripMap.tsx](/home/thomas/Code/caglla/components/trip/TripMap.tsx)
- [TripRightPane.tsx](/home/thomas/Code/caglla/components/trip/TripRightPane.tsx)
- [Google Maps JavaScript API - fitBounds](https://developers.google.com/maps/documentation/javascript/reference/map#Map.fitBounds)

