# Issue: Itinerary Cardの画像解像度がplaces_cacheの画像より低い

**作成日**: 2025-10-31  
**状態**: 🔴 未解決  
**優先度**: 中  
**関連ファイル**:
- `components/trip/ScheduleCard.tsx`（画像表示）
- `lib/utils/places-api.ts`または`lib/api/google/places.ts`（Google Places API画像取得）
- `lib/firebase/admin-operation.ts`（places_cacheの保存・取得）

---

## 📋 概要

Itinerary Cardに表示されている写真の解像度が、places_cacheに保存されている画像より低い。キャッシュ済みの高解像度画像を表示するように変更したい。

---

## 🐛 問題の詳細

### 現状
- Itinerary Cardで表示される画像の解像度が低い
- places_cacheには高解像度の画像が保存されている可能性がある
- 現在表示されている画像は、おそらくGoogle Places APIから直接取得した低解像度版

### 期待される動作
- places_cacheに保存されている高解像度画像を優先的に表示
- キャッシュがない場合のみ、Google Places APIから取得
- 可能な限り最高解像度の画像を表示

---

## 🔍 原因究明（詳細調査完了）

### 根本原因

#### 1. **固定解像度での画像取得**
```typescript:components/trip/ScheduleCard.tsx
// 133行目: maxWidth: 800 を固定で使用
const googlePhotoUrl = placesApiHelpers.getPhotoUrl(photoReference, 800)

// 136-140行目: width: 800, height: 600 で固定キャッシュ
const cachedImageResult = await getCachedPlaceImage(photoReference, googlePhotoUrl, {
  width: 800,
  height: 600,
  quality: 85
})
```

**問題点**:
- `places_cache`には`photos`配列に`width`と`height`情報が保存されている（`lib/core/types/place.ts` 95-99行目）
- しかし、現在の実装ではこの解像度情報を活用せず、常に800pxで取得している
- キャッシュも800pxで固定されているため、元画像が高解像度でも低解像度で保存される

#### 2. **places_cacheの解像度情報が未活用**
```typescript:lib/core/types/place.ts
photos?: Array<{
  photo_reference: string
  height: number  // ← この情報が保存されているが未使用
  width: number    // ← この情報が保存されているが未使用
}>
```

**確認済み**:
- `PlacesCache`インターフェースには`photos`配列が含まれており、各写真の`width`と`height`が保存されている
- `lib/travel/places-cache.ts`の113行目で`placeData.photos`をそのままキャッシュに保存している
- しかし、`ScheduleCard.tsx`では`photos[0]`の`photo_reference`のみを使用し、`width`/`height`は無視している

#### 3. **画像取得APIのデフォルト値**
```typescript:app/api/places/photo/route.ts
// 22行目: デフォルトmaxWidthは800px
const maxWidth = searchParams.get('maxwidth') || '800'
```

**確認済み**:
- APIエンドポイントのデフォルトは800px
- `lib/api/google/places.ts`の166行目でもデフォルト`maxWidth: 800`を使用

#### 4. **キャッシュキーに解像度が含まれるが、単一解像度のみキャッシュ**
```typescript:lib/storage/image-cache.ts
// 37-40行目: キャッシュキーにwidth/heightを含む
private generateCacheKey(photoReference: string, options: ImageCacheOptions = {}): string {
  const { width = 300, height = 300, quality = 80 } = options
  return `places-photos/${photoReference}_${width}x${height}_q${quality}.jpg`
}
```

**問題点**:
- キャッシュキーは解像度別に生成されるが、現在は800x600のみキャッシュ
- 複数解像度をキャッシュする仕組みはあるが、使用されていない

### 解決可能なポイント

1. **places_cacheの解像度情報を活用**
   - `itinerary.place_data.photos[0].width`から最高解像度を取得
   - 複数の写真がある場合、最高解像度のものを選択
   - ただし、Google Places APIの最大解像度は1600px程度

2. **段階的な解像度選択**
   - 高解像度（1600px）→ 中解像度（800px）→ 低解像度（400px）の順で試行
   - キャッシュがあればそれを優先使用
   - キャッシュがない場合のみAPIから取得

---

## 💡 解決方針

### Phase 1: キャッシュ優先の画像取得
1. **places_cacheから画像を優先取得**
   - Itinerary Cardの画像表示時に、まずplaces_cacheを確認
   - `place_data`または`place_data.photos`から画像URLを取得
   - キャッシュに複数の解像度がある場合、最高解像度を選択

2. **画像URLの優先順位**
   ```
   1. places_cache内の高解像度画像（maxWidth: 1600など）
   2. places_cache内の中解像度画像（maxWidth: 800など）
   3. places_cache内の低解像度画像（maxWidth: 400など）
   4. Google Places APIから新規取得（フォールバック）
   ```

### Phase 2: 画像サイズパラメータの最適化
1. **Google Places APIの呼び出し時のサイズ指定**
   - 現在の`maxWidth`を確認
   - 高解像度が必要な場合は`maxWidth: 1600`などに変更
   - ただし、APIコストとのバランスを考慮

2. **キャッシュ保存時の最適化**
   - places_cacheに保存する際に、複数の解像度を保存
   - または、最高解像度のみを保存

### Phase 3: UI表示の最適化
1. **Next.js Imageコンポーネントの活用**
   - `width`、`height`、`sizes`属性を適切に設定
   - 高解像度画像でもパフォーマンスを維持

2. **レスポンシブ画像**
   - デバイスサイズに応じて最適な解像度を表示
   - `sizes`属性で画面サイズを指定

---

## 📝 技術的実装詳細

### 画像URL取得の実装例（修正版）

#### 現在の実装（問題あり）
```typescript:components/trip/ScheduleCard.tsx
// 133行目: 固定800px
const googlePhotoUrl = placesApiHelpers.getPhotoUrl(photoReference, 800)
const cachedImageResult = await getCachedPlaceImage(photoReference, googlePhotoUrl, {
  width: 800,
  height: 600,
  quality: 85
})
```

#### 修正後の実装案
```typescript
// places_cacheから最高解像度の画像を取得
const loadImage = async () => {
  if (itinerary.place_data?.photos && itinerary.place_data.photos.length > 0) {
    const photos = itinerary.place_data.photos
    
    // 1. places_cacheの解像度情報から最高解像度を選択
    // 最大1600px、最小800px（バランス考慮）
    const targetWidth = Math.min(
      Math.max(...photos.map(p => p.width)),
      1600
    )
    const selectedPhoto = photos.find(p => p.width >= targetWidth) || photos[0]
    
    // 2. 選択された写真の解像度に基づいて画像URLを生成
    const maxWidth = Math.min(selectedPhoto.width, 1600) // API上限考慮
    const googlePhotoUrl = placesApiHelpers.getPhotoUrl(selectedPhoto.photo_reference, maxWidth)
    
    // 3. キャッシュから取得（解像度を指定）
    const cachedImageResult = await getCachedPlaceImage(selectedPhoto.photo_reference, googlePhotoUrl, {
      width: maxWidth,
      height: Math.round(maxWidth * 0.75), // アスペクト比維持（16:9想定）
      quality: 85
    })
    
    setPhotoUrl(cachedImageResult.url)
  }
}
```

#### 代替案: 複数解像度の段階的取得
```typescript
// 高解像度から順に試行（キャッシュ優先）
const resolutionOptions = [1600, 1200, 800, 400]

for (const width of resolutionOptions) {
  const cacheKey = generateCacheKey(photoReference, { width, height: width * 0.75 })
  const cached = await getCachedImageUrl(photoReference, { width, height: width * 0.75 })
  
  if (cached) {
    // キャッシュがあれば使用
    return cached
  }
}

// キャッシュがない場合は最高解像度で取得
return await getPhotoUrl(photoReference, Math.max(...resolutionOptions))
```

### Google Places APIの画像取得
- `PhotoService.getUrl()`で`maxWidth`パラメータを指定
- 推奨サイズ: `maxWidth: 1600`（高解像度）または`maxWidth: 1200`（バランス）

---

## 🔗 関連ファイル

- `components/trip/ScheduleCard.tsx` - Itinerary Cardの画像表示
- `lib/utils/places-api.ts`または`lib/api/google/places.ts` - Google Places API画像取得
- `lib/firebase/admin-operation.ts` - places_cacheの操作
- `lib/core/types/place.ts` - PlaceData型定義（photosフィールド）

---

## ✅ 完了条件

- [ ] Itinerary Cardで表示される画像が、places_cacheの高解像度画像を使用している
- [ ] 画像解像度が視覚的に改善されている
- [ ] キャッシュがない場合のフォールバックが機能している
- [ ] パフォーマンスに大きな影響がない（画像読み込み時間など）
- [ ] APIコストが過度に増加していない

---

## 💰 コスト考慮事項

### Google Places APIの画像取得コスト
- 画像取得は通常、他のAPIコールとは別に課金される可能性
- 高解像度画像（`maxWidth: 1600`）の取得コストを確認
- places_cacheを活用することで、APIコールを削減

### ストレージコスト
- places_cacheに高解像度画像を保存する場合のストレージコスト
- 画像圧縮の検討

---

## 🔍 実装可能性の評価

### 可能性: 高
- places_cacheは既に実装されている
- Google Places APIの画像取得は標準機能
- `maxWidth`パラメータの変更は簡単

### 課題
- places_cacheに保存されている画像の形式・解像度の確認
- APIコストと画像品質のバランス
- パフォーマンスへの影響（高解像度画像の読み込み時間）

