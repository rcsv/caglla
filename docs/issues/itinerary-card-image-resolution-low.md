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

## 🔍 技術的調査が必要な項目

### 1. 画像取得の優先順位
- 現在の実装で、places_cacheから画像を取得しているか
- 画像取得のロジック（キャッシュ優先か、API直接取得か）

### 2. Google Places APIの画像サイズパラメータ
- Google Places APIの`PhotoService`で使用している`maxWidth`や`maxHeight`パラメータ
- 現在の設定値（例: `maxWidth: 400`など）
- 最大可能な解像度（例: `maxWidth: 1600`）

### 3. places_cacheの画像保存形式
- places_cacheに保存されている画像URLの形式
- 画像の解像度情報が保存されているか
- 複数の解像度が保存されているか（thumbnail, medium, largeなど）

### 4. 画像表示の最適化
- Next.js Imageコンポーネントの使用状況
- `width`、`height`、`sizes`属性の設定
- 画像の遅延読み込み（lazy loading）の影響

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

### 画像URL取得の実装例
```typescript
// places_cacheから最高解像度の画像を取得
const getImageUrl = (placeData: PlaceData): string | null => {
  if (!placeData.photos || placeData.photos.length === 0) return null
  
  // 複数の解像度がある場合、最高解像度を選択
  const photo = placeData.photos.find(p => p.width >= 1600) 
    || placeData.photos.find(p => p.width >= 800)
    || placeData.photos[0]
  
  return photo.getUrl({ maxWidth: 1600, maxHeight: 1600 })
}
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

