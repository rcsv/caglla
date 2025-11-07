# Issue: Google POIマーカークリック時に地図の中心がItineraryマーカーに戻ってしまう

**作成日**: 2025-11-06  
**実装日**: 2025-11-06  
**状態**: ✅ 解決済み  
**優先度**: 中  
**関連ファイル**:
- `components/trip/TripMap.tsx`（地図・中心移動・同期）
- `app/[userSlug]/[tripSlug]/page.tsx`（選択状態管理）
- `components/trip/POIDialog.tsx`（POI詳細ダイアログ）

---

## 📋 概要

地図上のGoogle Mapsが自動的に表示するPOIマーカー（レストラン、観光スポットなど）をクリックすると、POIDialogは正しく表示されるが、その後すぐに地図の中心がCagllaのItinerary Cardに対応したMarkerの位置に戻ってしまう。結果としてPOIDialogで表示しているPOIと地図の中心位置が一致しない。

---

## 🐛 再現手順

1. メインコンテンツ（Itineraryリスト）であるItineraryを選択 → 地図がそのVenueへセンタリング
2. 地図上でGoogleが自動表示するPOIマーカー（レストラン、観光スポットなど）をクリック → POIDialogがそのPOIの情報を表示
3. 数百ms以内に地図が自動で元のItinerary Venueへパンしてしまう（`selectedItineraryId`が変更されないため、`useEffect`がトリガーされる）

---

## 🔍 想定原因

### 問題の根本原因

`components/trip/TripMap.tsx`の620-652行目の`useEffect`が`selectedItineraryId`を監視しており、以下の条件でItineraryの位置に地図を移動している：

```typescript
useEffect(() => {
  if (!map || !selectedItineraryId) return
  if (focusMode !== 'single' && !scrollSyncEnabled) return
  
  // ... 地図をselectedItineraryIdの位置に移動
  smoothMoveToLocation(map, position.lat, position.lng, DEFAULT_ZOOM_LEVEL)
}, [selectedItineraryId, map, markers, itineraries, directionsRenderer, focusMode, scrollSyncEnabled])
```

**問題点**:
- Google POIマーカーをクリックしても`selectedItineraryId`が変更されない（POIマーカーはItineraryではないため）
- そのため、`poiData`が設定されてPOIDialogが表示されている状態でも、`useEffect`が継続的に地図をItineraryの位置に戻そうとする
- `onMapInteractionStart`は呼ばれているが、`focusMode === 'single'`の場合は`scrollSyncEnabled`のチェックをスキップしてフォーカス移動が実行される

### 詳細な動作フロー

1. ユーザーがItineraryを選択 → `selectedItineraryId`が設定される
2. 地図がItineraryの位置にフォーカス（`focusMode === 'single'`）
3. ユーザーがGoogle POIマーカーをクリック
   - `newMap.addListener('click', ...)`がトリガーされる
   - `onMapInteractionStart?.()`が呼ばれる（スクロール連動を停止）
   - `poiData`が設定され、POIDialogが表示される
   - しかし、`selectedItineraryId`は変更されない
4. `useEffect`（620-652行目）が`selectedItineraryId`の変更を監視しているが、値は変わっていない
   - ただし、他の依存配列の値（`markers`, `itineraries`など）が変更される可能性がある
   - または、`focusMode === 'single'`の場合は`scrollSyncEnabled`のチェックをスキップして実行される
5. 結果として、地図がItineraryの位置に戻ってしまう

---

## 💡 解決方針（提案）

### 1) POIデータ表示中のフォーカス移動抑制

`poiData`が設定されている場合（POIDialogが表示されている場合）、`useEffect`でのフォーカス移動を抑制する。

```typescript
useEffect(() => {
  if (!map || !selectedItineraryId) return
  if (focusMode !== 'single' && !scrollSyncEnabled) return
  
  // POIDialogが表示されている場合は、フォーカス移動を抑制
  if (poiData) return
  
  // ... 地図をselectedItineraryIdの位置に移動
}, [selectedItineraryId, map, markers, itineraries, directionsRenderer, focusMode, scrollSyncEnabled, poiData])
```

### 2) POIデータ表示中のselectedItineraryIdの一時クリア

POIマーカーをクリックした際、一時的に`selectedItineraryId`をクリアする（または`null`に設定する）。

- **メリット**: `useEffect`が実行されなくなるため、確実にフォーカス移動を抑制できる
- **デメリット**: Itineraryのハイライトが消える（UI的な一貫性の問題）

### 3) POIデータ表示中のフォーカス移動フラグ

`poiData`が設定されている場合は、`focusMode`を一時的に変更するか、フラグを追加してフォーカス移動を抑制する。

### 4) 地図操作中のフォーカス移動抑制の拡張

`onMapInteractionStart`が呼ばれた際、一定時間（例: 5秒）はフォーカス移動を抑制する。

---

## ✅ 実装完了（2025-11-06）

### 実装内容

#### Phase 1: 判定ロジックの実装 ✅
- **`components/trip/TripMap.tsx`**: `useEffect`（620-671行目）に条件判定を追加
  - `poiData`を依存配列に追加
  - `poiData`が設定されている場合、`poiData.placeId`と`selectedItinerary.place_data.place_id`を比較
  - 一致しない場合（Google POIマーカーをクリックした場合）のみ、フォーカス移動を抑制
  - マーカーのハイライトは維持（既存の選択状態を視覚的に保持）

#### Phase 2: POIカスタムマーカーの追加 ✅
- **`components/trip/TripMap.tsx`**: `poiData`/`internalPoiData`の変更を監視し、AdvancedMarkerElementで単一のテンポラリPOIマーカーを描画
  - 既存マーカーを必ずクリーンアップし、地図上に同時表示されるPOIマーカーが一つだけになるよう制御
  - Itineraryの既存マーカーと重複する場合（`selectedItineraryId`と同一の`placeId`）は描画をスキップ
  - 位置情報が`placeData.geometry.location`あるいは`poiData.location`に存在する場合のみ描画

### 実装の特徴

1. **条件判定の慎重な実装**: 
   - `poiData`が存在する場合のみチェック
   - `selectedItinerary.place_data.place_id`が存在する場合のみ比較
   - `poiData.placeId`が存在する場合のみ比較
   - いずれかが存在しない場合は、フォーカス移動を実行（既存の動作を維持）

2. **既存の動作パターンの維持**:
   - **Itineraryマーカーをクリック**: `placeId`が一致するため、フォーカス移動を実行 ✅
   - **メインコンテンツからItineraryをクリック**: 同様に一致するため、フォーカス移動を実行 ✅
   - **POIDialogを閉じる**: `poiData`が`null`になるため、フォーカス移動を実行 ✅
   - **Google POIマーカーをクリック**: `placeId`が一致しないため、フォーカス移動を抑制 ✅

3. **マーカーのハイライト維持**: 
   - Google POIマーカーをクリックした場合でも、既存のItineraryマーカーのハイライト状態を維持
   - 視覚的な一貫性を保つ
4. **テンポラリPOIマーカーの明確化**:
   - POIDialogで表示中のPOI位置を高コントラストのカスタムマーカーで可視化
   - 別のPOIをクリックすると旧マーカーを削除して新しい位置に再描画（常に1つだけ表示）

### 動作確認項目

- ✅ Itineraryマーカーをクリック: 地図がItineraryの位置にフォーカスされる
- ✅ メインコンテンツからItineraryをクリック: 地図がItineraryの位置にフォーカスされる
- ✅ Google POIマーカーをクリック: 地図がItineraryの位置に戻らない（POIの位置に留まる）
- ✅ POIDialogを閉じる: 地図がItineraryの位置にフォーカスされる
- ✅ 異なるItineraryを選択: POIDialogが更新され、地図が新しいItineraryの位置にフォーカスされる
- ✅ 既存のスクロール連動・センタリング挙動: リグレッションなし
- ✅ Google POIを連続でクリック: テンポラリマーカーが常に最新のPOI位置1か所のみを示す

### 完了条件

- [x] Google POIマーカーをクリックした際、POIDialogと地図中心が一致して維持される
- [x] POIDialog表示中に地図が勝手にItineraryの位置へ戻らない
- [x] メインコンテンツで別のItineraryを選択した場合は期待通りに地図が追従
- [x] 既存のスクロール連動・センタリング挙動にリグレッションがない

### 実装ファイル

- `components/trip/TripMap.tsx` - `useEffect`に条件判定を追加（620-671行目）

---

## 🔗 関連Issue

- Issue #34: 地図上のItineraryマーカークリック時にメインコンテンツの対応Cardまで自動スクロール（✅ 解決済み）
- Issue #36: POIクリックでPOIDialogは切り替わるが地図が主導で元位置に戻ってしまう（本Issueに統合）

---

## 📝 技術的考慮事項

### useEffectの依存配列

現在の`useEffect`（620-652行目）の依存配列：
```typescript
[selectedItineraryId, map, markers, itineraries, directionsRenderer, focusMode, scrollSyncEnabled]
```

`poiData`を依存配列に追加し、`poiData`が存在する場合はフォーカス移動をスキップする。

### タイミングの問題

- POIマーカーをクリックした際、`poiData`が設定されるタイミング
- `useEffect`が実行されるタイミング
- 地図のフォーカス移動が完了するタイミング

これらのタイミングを適切に制御する必要がある。

### 既存の実装との整合性

- `onMapInteractionStart`が呼ばれても、`focusMode === 'single'`の場合は`scrollSyncEnabled`のチェックをスキップする実装になっている
- この動作を変更する場合は、既存の動作に影響を与えないよう注意が必要

---

## 📚 参考

- [MDN: Element.scrollIntoView()](https://developer.mozilla.org/ja/docs/Web/API/Element/scrollIntoView)
- Google Maps JavaScript API: [Map Events](https://developers.google.com/maps/documentation/javascript/events)
- `components/trip/TripMap.tsx` の`useEffect`依存関係（選択変更時のパン）
- `components/trip/POIDialog.tsx`の開閉・対象切替トリガ

