# Issue: POIDialogの再読み込み時に旧情報が残留する

**作成日**: 2025-11-08  
**状態**: 🟡 未着手  
**優先度**: 中  
**関連ファイル**:
- `components/trip/POIDialog.tsx`
- `components/trip/TripMap.tsx`
- `lib/api/google/places.ts`

---

## 📋 概要

地図のPOIマーカーを切り替えてPOIDialogの内容を更新しようとすると、新しいPOIの情報が読み込まれるまでの間、直前に表示していたPOI詳細がそのまま表示され続ける。ローディング中はプログレスサークルが上部に表示されるが、旧コンテンツが下部に残ってしまうため、新旧どちらの情報が正しいのか判別しづらい。

---

## 🐛 再現手順
1. あるPOIマーカーをクリックし、POIDialogに詳細が表示されている状態にする
2. すぐに別のPOIマーカーをクリックしてPOIDialogの読み込みを発生させる
3. プログレスサークルが表示されるが、旧POIの名称・住所・レビューなどが下半分に残ったままになる

---

## 🔍 想定原因

### 根本原因の特定
`POIDialog.tsx`のコード調査により、以下の問題が明らかになりました：

#### 1. ローディング状態管理の不備
```typescript
// 222-225行目: poiDataが変更されたときの処理
useEffect(() => {
  if (!poiData) return
  void fetchPlaceDetails()
}, [poiData, fetchPlaceDetails])
```

- **問題**: `poiData`が変更された際、`fetchPlaceDetails()`を呼び出す前に既存の`placeDetails`・`aggregatedData`・`unifiedReviews`などの状態をクリアしていない
- **結果**: 新しいPOIのデータ取得中も、旧POIの`placeDetails`が`null`にならず、旧コンテンツがそのまま表示される

#### 2. 条件付きレンダリングの問題
```typescript
// 398-410行目: コンテンツ部分のレンダリング
<div className="p-3 max-h-80 overflow-y-auto scrollbar-hide rounded-b-lg">
  {loading && (
    <div className="flex items-center justify-center py-8">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      <span className="ml-2 text-sm text-gray-600">{t('poi.loadingInfo')}</span>
    </div>
  )}

  {placeDetails && (
    <div className="flex gap-3">
      {/* メインコンテンツ */}
    </div>
  )}
</div>
```

- **問題**: `loading`と`placeDetails`が排他的な条件分岐になっておらず、`loading`が`true`でも`placeDetails`が存在すれば両方のブロックが描画される
- **結果**: ローディングインジケーターの下に旧POI情報が表示される

#### 3. fetchPlaceDetails内部のフロー
```typescript
// 112-220行目: fetchPlaceDetails関数
const fetchPlaceDetails = useCallback(async () => {
  if (!poiData) return

  setLoading(true)  // ← ここでローディング開始
  setError(null)    // ← エラーはクリア

  try {
    // placeDataがある場合はそれを使用（119-140行目）
    if (poiData.placeData) {
      setPlaceDetails(poiData.placeData)
      setLoading(false)
      return
    }

    // キャッシュから取得（145-150行目）
    const cachedData = await getCachedPlace(poiData.placeId)
    if (cachedData) {
      setPlaceDetails(cachedData)
      setLoading(false)
      return
    }

    // API呼び出し（157-210行目）
    const details = await placesApiHelpers.getPlaceDetails(poiData.placeId, language)
    setPlaceDetails(details)
    // ...
  } finally {
    setLoading(false)
  }
}, [cacheImages, onClose, poiData, user])
```

- **問題**: `setLoading(true)`の直後に`placeDetails`をクリアする処理がない
- **結果**: 非同期処理中も旧`placeDetails`が保持されたまま

---

## 💡 解決方針（提案）

### 修正アプローチ

#### Option 1: useEffect内で状態をリセット（推奨）
```typescript
useEffect(() => {
  if (!poiData) return
  
  // 新しいPOIデータの取得前に旧データをクリア
  setPlaceDetails(null)
  setAggregatedData(null)
  setUnifiedReviews([])
  setCachedImages([])
  setCurrentPhotoIndex(0)
  setShowAllReviews(false)
  
  void fetchPlaceDetails()
}, [poiData, fetchPlaceDetails])
```

**メリット**:
- シンプルで直感的
- 既存のコードへの影響が最小限
- `poiData`変更時に確実にリセットされる

**デメリット**:
- `fetchPlaceDetails`の`useCallback`依存配列に注意が必要

#### Option 2: fetchPlaceDetails内部でリセット
```typescript
const fetchPlaceDetails = useCallback(async () => {
  if (!poiData) return

  // ローディング開始と同時に旧データをクリア
  setLoading(true)
  setError(null)
  setPlaceDetails(null)
  setAggregatedData(null)
  setUnifiedReviews([])
  
  try {
    // ... 既存の処理
  } finally {
    setLoading(false)
  }
}, [cacheImages, onClose, poiData, user])
```

**メリット**:
- データ取得ロジックと状態管理が同じ場所にある
- useEffectの依存配列問題を回避できる

**デメリット**:
- 早期リターン（`poiData.placeData`がある場合など）の前にもリセットが必要

#### Option 3: 条件付きレンダリングの改善
```typescript
<div className="p-3 max-h-80 overflow-y-auto scrollbar-hide rounded-b-lg">
  {loading ? (
    <div className="flex items-center justify-center py-8">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      <span className="ml-2 text-sm text-gray-600">{t('poi.loadingInfo')}</span>
    </div>
  ) : error ? (
    <div className="text-center py-8">
      <div className="text-red-500 text-sm">{t('poi.errorMessage')}</div>
    </div>
  ) : placeDetails ? (
    <div className="flex gap-3">
      {/* メインコンテンツ */}
    </div>
  ) : null}
</div>
```

**メリット**:
- ローディング・エラー・データ表示が排他的になる
- UI状態が明確で予測可能

**デメリット**:
- 状態リセットの根本的な解決にはならない（併用推奨）

### 推奨実装
**Option 1 + Option 3の組み合わせ**が最も安全で効果的：
1. useEffectで旧データをクリア（データ整合性）
2. 条件付きレンダリングを排他的に変更（UI表示の明確化）

---

## ✅ 完了条件
- [ ] POIマーカーを連続で切り替えても、ローディング中は旧POI情報が一切表示されない
- [ ] ローディング完了後に新しいPOI情報のみが表示される
- [ ] 既存のPOIDialog機能（Itinerary追加・画像表示など）に副作用が発生しない

---

## 🔗 参考

### 関連コード
- **`components/modals/POIDialog.tsx`**
  - 35-53行目: State定義（`placeDetails`, `loading`, `aggregatedData`など）
  - 112-220行目: `fetchPlaceDetails()` - データ取得ロジック
  - 222-225行目: useEffect - `poiData`変更時の処理
  - 317-410行目: レンダリングロジック（ヘッダー・ローディング・コンテンツ）

### 関連Issue
- `map-poi-dialog-focus-conflict.md` - 同様のPOI切り替え時の地図フォーカス問題
- `poi-dialog-map-context-loss-after-itinerary-add.md` - Itinerary追加後の状態維持問題

### テスト観点
1. **正常系**: POI A → POI B への切り替えで旧データが表示されないこと
2. **高速切り替え**: POI A → POI B → POI C を連続クリックしても最終的にPOI Cが正しく表示されること
3. **キャッシュ有無**: キャッシュありPOI・なしPOI両方で動作確認
4. **エラー処理**: API失敗時に旧データが残らないこと

