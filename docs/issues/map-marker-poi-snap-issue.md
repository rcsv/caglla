# マーカークリック時のPOI「吸着」問題

## 問題の概要

Google Maps上でマーカーをクリックしても、**意図したPOIではなく、別の場所のPOIにずれて（吸着して）POIDialogが表示される**という直感的ではない挙動が発生している。

## 現象

- ✅ **期待される動作**: クリックしたマーカーのPOI情報がPOIDialogに表示される
- ❌ **実際の動作**: クリックした位置から少し外れた別のPOIがPOIDialogに表示される

## 根本原因

### 1. マップクリックイベントでの「最寄りPOI検索」ロジック

```typescript:330-383:components/trip/TripMap.tsx
newMap.addListener('click', async (event: any) => {
  const clickLatLng = event.latLng

  try {
    const response = await fetch('/api/places/nearby', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        location: {
          lat: clickLatLng.lat(),
          lng: clickLatLng.lng(),
        },
        radius: 200,  // ← 問題: 200m範囲内で最寄りのPOIを検索
      }),
    })

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const nearestPOI = data.results[0]  // ← 問題: 最初の1件（最寄り）を自動選択
      const newPoiData = {
        placeId: nearestPOI.place_id,
        name: nearestPOI.name,
        location: {
          lat: nearestPOI.geometry.location.lat,  // ← クリック位置ではなく、最寄りPOIの座標
          lng: nearestPOI.geometry.location.lng,
        },
      }
      setInternalPoiData(newPoiData)
      onPoiDataUpdateRef.current?.(newPoiData)
    }
  } catch (error) {
    // ...
  }
})
```

**問題点**:
1. **クリックした座標**から**200m範囲内**で最寄りのPOIを検索している
2. Google Places APIが返す**最初の1件**を自動的に選択
3. クリックした位置とは**異なる座標のPOI**が選択される可能性が高い

### 2. マーカークリックイベントの種類

TripMap.tsxには3種類のマーカークリックイベントがある：

#### A. Itineraryマーカー（ティアドロップ形状）のクリック

```typescript:536-574:components/trip/TripMap.tsx
marker.addListener('click', () => {
  // POIダイアログを表示（place_idがある場合）
  if (itinerary.place_data?.place_id) {
    const newPoiData = {
      placeId: itinerary.place_data.place_id,
      name: itinerary.title,
      location: {
        lat: itinerary.place_data.geometry!.location.lat,
        lng: itinerary.place_data.geometry!.location.lng
      },
      placeData: itinerary.place_data
    }
    setInternalPoiData(newPoiData)
    onPoiDataUpdateRef.current?.(newPoiData)
  }
  
  onItineraryClickRef.current?.(itinerary.id)
})
```

→ **✅ 正常動作**: クリックしたItineraryの正確なPOI情報を表示

#### B. Google標準POIマーカーのクリック

```typescript:385-401:components/trip/TripMap.tsx
newMap.addListener('poi_click', (event: any) => {
  onMapInteractionStartRef.current?.()
  event.stop()

  if (event.placeId) {
    const newPoiData = {
      placeId: event.placeId,
      name: event.displayName || 'POI',
      location: {
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
      },
    }
    setInternalPoiData(newPoiData)
    onPoiDataUpdateRef.current?.(newPoiData)
  }
})
```

→ **✅ 正常動作**: Google Mapsが標準で表示するPOI（ランドマーク、店舗など）をクリックした場合、正確な情報を表示

#### C. マップの空白部分クリック（問題の根源）

```typescript:330-383:components/trip/TripMap.tsx
newMap.addListener('click', async (event: any) => {
  // クリック位置から200m範囲内で最寄りのPOIを検索
  // → 意図しないPOIが選択される可能性が高い
})
```

→ **❌ 問題あり**: クリック位置から半径200m以内の最寄りPOIを検索し、自動的に選択

### 3. 「吸着」が発生するメカニズム

```
ユーザーのクリック
    ↓
Google Maps clickイベント発火
    ↓
クリック座標 (lat: 35.6762, lng: 139.6503) を取得
    ↓
/api/places/nearby に POST
  - location: クリック座標
  - radius: 200m
    ↓
Google Places API Nearby Searchが実行
    ↓
200m範囲内のPOIリストを取得（距離順）
  [
    { name: "レストランA", distance: 50m },  ← 最寄り
    { name: "カフェB", distance: 120m },
    { name: "ホテルC", distance: 180m }
  ]
    ↓
最初の1件（"レストランA"）を自動選択
    ↓
POIDialog に "レストランA" の情報を表示
    ↓
❌ ユーザーが期待していた場所とは異なる！
```

## 問題の詳細分析

### 1. 半径200mの妥当性

- **都市部**: 200m範囲内に複数のPOIが存在する可能性が高い
- **郊外**: POIが少なく、意図しないPOIが選択されにくい
- **問題**: クリック位置の精度（指のタップ誤差、ズームレベル）により、意図しないPOIが選択される

### 2. 「最寄り」の定義

- Google Places API Nearby Searchは**距離順**でPOIを返す
- しかし、「最寄り」が**ユーザーの意図した場所**とは限らない
- 例：
  - ユーザーは「公園Aのマーカー」をクリックしたつもり
  - しかし実際のクリック位置は公園Aから50m離れた場所
  - その位置から最寄りのPOIは「レストランB」（30m）
  - → POIDialogに「レストランB」が表示される

### 3. Itineraryマーカーとの競合

```typescript:536-574:components/trip/TripMap.tsx
// Itineraryマーカーのクリック処理
marker.addListener('click', () => {
  // 正確なPOI情報を表示
})
```

- Itineraryマーカー（ティアドロップ）をクリックした場合は**正常動作**
- しかし、Itineraryマーカーの**近く**をクリックした場合、マップclickイベントが発火
- → 最寄りPOI検索が実行され、意図しないPOIが選択される

## 影響範囲

### 1. ユーザー体験への影響

- ❌ **混乱**: クリックした場所と異なるPOI情報が表示される
- ❌ **信頼性低下**: アプリの挙動が予測不可能に感じる
- ❌ **効率性**: 意図したPOIを表示するために複数回クリックが必要

### 2. 発生頻度

- **高頻度**: 都市部でズームアウトした状態でクリック
- **中頻度**: Itineraryマーカーの近くをクリック
- **低頻度**: 郊外や人口密度の低いエリアでクリック

## 解決策の検討

### 案1: マップクリック時の最寄りPOI検索を無効化（推奨）

**変更内容**:
- マップの空白部分をクリックした場合、POIDialogを表示しない
- Itineraryマーカーまたは Google標準POIマーカーをクリックした場合のみPOIDialogを表示

**メリット**:
- ✅ 直感的な動作（クリックしたマーカーのみ反応）
- ✅ 意図しないPOI選択を完全に防止
- ✅ 実装が簡単（既存コードの削除のみ）

**デメリット**:
- ❌ マップの空白部分をクリックして「近くのPOI」を探す機能が失われる
  - ただし、この機能の利用頻度は低く、混乱の原因になっている可能性が高い

**実装例**:

```typescript
// 案1: マップクリック時のPOI検索を完全に無効化
newMap.addListener('click', async (event: any) => {
  onMapInteractionStartRef.current?.()
  const infoWindows = newMap.get('infoWindows') || []
  infoWindows.forEach((infoWindow: any) => {
    infoWindow.close()
  })
  
  // POI検索を実行しない
  // → マーカークリックとpoi_clickイベントのみでPOIDialogを表示
})
```

### 案2: 半径を小さくする（一時的な緩和策）

**変更内容**:
- `radius: 200` → `radius: 50` または `radius: 100`

**メリット**:
- ✅ 実装が簡単（1行の変更）
- ✅ マップ空白クリックでの「近くのPOI検索」機能を維持

**デメリット**:
- ❌ 根本的な解決にはならない（依然として意図しないPOIが選択される可能性）
- ❌ 半径を小さくしすぎると、POIが見つからないケースが増加

### 案3: クリック位置の可視化＋確認ダイアログ（複雑）

**変更内容**:
1. クリック位置にマーカーを表示
2. 「この場所の近くのPOIを検索しますか？」の確認ダイアログ
3. ユーザーが承認した場合のみPOI検索を実行

**メリット**:
- ✅ ユーザーの意図を明確に確認できる
- ✅ マップ空白クリックでの「近くのPOI検索」機能を維持

**デメリット**:
- ❌ 実装が複雑
- ❌ UXが煩雑（毎回確認ダイアログが表示される）
- ❌ モバイルでは操作が難しい

### 案4: ズームレベルに応じた動的な半径調整

**変更内容**:
- ズームレベルに応じて検索半径を動的に変更
  - ズーム18以上（建物レベル）: 50m
  - ズーム15-17（街区レベル）: 100m
  - ズーム14以下（都市レベル）: 200m

**メリット**:
- ✅ ズームレベルに応じた適切な検索範囲
- ✅ マップ空白クリックでの「近くのPOI検索」機能を維持

**デメリット**:
- ❌ 実装がやや複雑
- ❌ 根本的な解決にはならない

## 推奨アクション

### 短期（即座に実装可能）

**案1を採用: マップクリック時の最寄りPOI検索を無効化**

**理由**:
1. **直感的**: クリックしたマーカーのみが反応する（デスクトップアプリの標準動作）
2. **シンプル**: 実装が簡単で、バグのリスクが低い
3. **効果的**: 意図しないPOI選択を完全に防止

**実装の影響**:
- ✅ Itineraryマーカー（ティアドロップ）: 引き続き正常動作
- ✅ Google標準POIマーカー: 引き続き正常動作
- ✅ MapSearchOverlay（検索機能）: 引き続き正常動作
- ❌ マップ空白クリック → POIDialog表示: **機能削除**
  - ただし、この機能は混乱を引き起こしており、削除することでUXが向上する

### 中長期（将来的な改善）

1. **POI検索UIの追加**: マップ上にPOI検索ボタンを配置し、意図的に「近くのPOI」を検索できる機能を提供
2. **マーカーのクリック判定改善**: Itineraryマーカーの周辺をクリックした場合、自動的にそのマーカーをクリックしたと判定
3. **ズームレベル連動**: ズームレベルに応じて検索半径を動的に調整

## 参考情報

### 関連ファイル

- **`components/trip/TripMap.tsx`** (330-383行目): マップクリックイベントの処理
- **`app/api/places/nearby/route.ts`**: Nearby Search APIのプロキシ
- **`components/modals/POIDialog.tsx`**: POI情報表示ダイアログ

### Google Places API仕様

- **Nearby Search**: 指定された座標から半径N m以内のPOIを検索
- **返却順序**: 距離順（近い順）
- **最大返却数**: デフォルト20件

### マーカークリックの種類

| イベント | 発火条件 | 現在の動作 | 問題 |
| :--- | :--- | :--- | :--- |
| `marker.addListener('click')` | Itineraryマーカーをクリック | ✅ 正確なPOI情報を表示 | なし |
| `map.addListener('poi_click')` | Google標準POIマーカーをクリック | ✅ 正確なPOI情報を表示 | なし |
| `map.addListener('click')` | マップの空白部分をクリック | ❌ 最寄りPOIを自動選択 | **意図しないPOI選択** |

## 実装状況

### ✅ 実装完了（案1を採用）

**実装日**: 2025-11-26  
**修正ファイル**: `components/trip/TripMap.tsx` (330-343行目)

**変更内容**:

```typescript
// components/trip/TripMap.tsx (330-343行目)

newMap.addListener('click', async (event: any) => {
  onMapInteractionStartRef.current?.()
  
  // InfoWindowを閉じる
  const infoWindows = newMap.get('infoWindows') || []
  infoWindows.forEach((infoWindow: any) => {
    infoWindow.close()
  })

  // ✅ 修正: マップ空白クリック時のPOI検索を無効化
  // POIDialogは、以下の場合のみ表示：
  // 1. Itineraryマーカー（ティアドロップ）をクリック
  // 2. Google標準POIマーカーをクリック（poi_clickイベント）
  // 3. 検索結果マーカーをクリック
  //
  // 理由: マップクリック時に半径200m以内の最寄りPOIを自動選択する仕様により、
  // 意図しないPOIがPOIDialogに表示される問題を防止
})
```

**削除されたコード**: 53行（最寄りPOI検索ロジック全体）

### 実装前後の比較

| 操作 | 実装前 | 実装後 |
| :--- | :--- | :--- |
| Itineraryマーカークリック | ✅ 正確なPOI表示 | ✅ 正確なPOI表示（変更なし） |
| Google標準POIマーカークリック | ✅ 正確なPOI表示 | ✅ 正確なPOI表示（変更なし） |
| 検索結果マーカークリック | ✅ 正確なPOI表示 | ✅ 正確なPOI表示（変更なし） |
| マップ空白クリック | ❌ 最寄りPOI自動選択（意図しない場所） | ✅ POI表示なし（直感的） |

## テスト方法

### テストケース

#### 1. Itineraryマーカー（ティアドロップ）をクリック
- **手順**: 旅程に追加済みの場所のマーカーをクリック
- **期待動作**: クリックしたItineraryのPOI情報がPOIDialogに表示される
- **テスト結果**: ✅ 正常動作

#### 2. Google標準POIマーカーをクリック
- **手順**: Google Mapsが表示する標準POI（店舗、ランドマークなど）をクリック
- **期待動作**: クリックしたPOIの情報がPOIDialogに表示される
- **テスト結果**: ✅ 正常動作

#### 3. 検索結果マーカーをクリック
- **手順**: MapSearchOverlayで場所を検索し、検索結果マーカー（オレンジ色のピン）をクリック
- **期待動作**: クリックしたPOIの情報がPOIDialogに表示される
- **テスト結果**: ✅ 正常動作

#### 4. マップの空白部分をクリック
- **手順**: マーカーがない場所（道路、海、空き地など）をクリック
- **期待動作**: POIDialogが表示されない
- **テスト結果**: ✅ 正常動作（意図しないPOI選択を防止）

#### 5. Itineraryマーカーの近くをクリック
- **手順**: Itineraryマーカーの近く（50m以内）の空白部分をクリック
- **期待動作**: POIDialogが表示されない（マーカー自体をクリックした場合のみ表示）
- **テスト結果**: ✅ 正常動作（以前は意図しないPOIが表示されていた）

### 検証手順

```bash
# 開発サーバーを起動
pnpm dev

# ブラウザで旅程ページを開く
# http://localhost:3000/[userSlug]/[tripSlug]

# ブラウザのDevToolsを開く（F12）
# Consoleタブで以下のログを確認：
# - 🔵 Itinerary marker clicked: Itineraryマーカーをクリック
# - 🟡 Google POI marker clicked: Google標準POIマーカーをクリック
# - 🟠 Search result marker clicked: 検索結果マーカーをクリック
# - ⚪ Map blank area clicked: マップ空白部分をクリック
# - 🟢 Setting POI data: POIDialogを表示

# 上記のテストケースを実行
```

### トラブルシューティング（2025-11-26追加）

#### 症状: クリックしてもPOIDialogが表示されない

**考えられる原因**:

1. **Itineraryに`place_id`が存在しない**
   - ログを確認: `hasPlaceId: false` → place_idが欠損している
   - 解決策: Itineraryを再追加するか、place_dataを手動で修正

2. **イベントリスナーが正しく登録されていない**
   - ログを確認: マーカークリック時にログが出ない
   - 解決策: ページをリロード、またはブラウザのキャッシュをクリア

3. **親コンポーネントとの連携問題**
   - ログを確認: `Setting POI data`は出るが、POIDialogが表示されない
   - 解決策: 
     - `@map/default.tsx`の`poiData`ステートを確認
     - `onPoiDataUpdate`コールバックが正しく動作しているか確認

**デバッグ方法**:

```javascript
// ブラウザのConsoleで実行
// POIProviderのステート確認
console.log('POI Data:', document.querySelector('[data-poi-dialog]'))

// TripMapのinternalPoiDataを確認（開発モードのみ）
```

**デバッグログの追加箇所**:
- `components/trip/TripMap.tsx` (505-530行目): Itineraryマーカークリック
- `components/trip/TripMap.tsx` (350-372行目): Google POIマーカークリック
- `components/trip/TripMap.tsx` (258-277行目): 検索結果マーカークリック
- `components/trip/TripMap.tsx` (330-350行目): マップ空白クリック

## まとめ

**現状の問題**:
- マップクリック時に200m範囲内の最寄りPOIを自動選択する仕様により、意図しないPOIがPOIDialogに表示される

**推奨解決策**:
- **案1**: マップクリック時の最寄りPOI検索を無効化
  - シンプルで効果的
  - 直感的なUXを実現
  - 意図しないPOI選択を完全に防止

**実装の優先度**: **高** - ユーザー体験に直接影響する問題のため、早急な対応が望ましい

