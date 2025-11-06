# places_cache からの国推測実装の現状整理

**作成日**: 2025-01-XX  
**関連Issue**: #34（Closed）  
**目的**: places_cache からの国推測が弱い問題について、現状の実装方法をバカにもわかるレベルで整理

---

## 📋 概要

このドキュメントは、`places_cache`（Firestore の `places_cache` コレクション）から国情報を推測する現状の実装方法を、技術に詳しくない人でも理解できるように整理したものです。

---

## 🗂️ places_cache とは？

### 基本的な仕組み

1. **Google Places API の結果をキャッシュ**
   - Google Places API は有料なので、一度取得した場所情報を Firestore に保存して再利用します
   - これにより、同じ場所を何度も検索しても API コストを削減できます

2. **保存場所**
   - Firestore の `places_cache` コレクションに保存されます
   - ドキュメント ID は `{place_id}_{language}` 形式（例: `ChIJN1t_tDeuEmsRUsoyG83frY4_ja`）

3. **保存される情報**
   - 場所名（`name`）
   - フォーマット済み住所（`formatted_address`）
   - 住所コンポーネント（`address_components`）← **国情報がここに入っている**
   - 座標（`geometry`）
   - その他（写真、評価、営業時間など）

---

## 🔍 国情報の取得方法

### 方法1: address_components から直接取得（最優先・最も正確）

#### データ構造

`address_components` は配列で、各要素は以下のような構造です：

```typescript
{
  long_name: "日本",      // 日本語での国名
  short_name: "JP",      // 国コード（ISO 3166-1 alpha-2）
  types: ["country"]     // タイプ（"country" が含まれていれば国情報）
}
```

#### 実装箇所

**`lib/travel/country/utils.ts`** の `extractCountryFromAddressComponents()` 関数：

```typescript
export function extractCountryFromAddressComponents(addressComponents: Array<{
  long_name: string
  short_name: string
  types: string[]
}>): { countryCode: string; countryName: string } {
  // address_components から国（country）を検索
  const countryComponent = addressComponents.find(component => 
    component.types.includes('country')
  )

  if (countryComponent) {
    const countryName = countryComponent.long_name
    const countryCode = countryComponent.short_name.toLowerCase()
    return { countryCode, countryName }
  }

  return { countryCode: 'unknown', countryName: '不明' }
}
```

#### 処理の流れ

1. `address_components` 配列をループ
2. `types` に `'country'` が含まれている要素を探す
3. 見つかったら `short_name`（国コード）と `long_name`（国名）を返す
4. 見つからなかったら `'unknown'` を返す

#### 使用例

```typescript
// places_cache から取得したデータ
const placesCache: PlacesCache = {
  place_id: "ChIJN1t_tDeuEmsRUsoyG83frY4",
  name: "東京タワー",
  formatted_address: "日本、〒105-0011 東京都港区芝公園４丁目２−８",
  address_components: [
    { long_name: "日本", short_name: "JP", types: ["country"] },
    { long_name: "東京都", short_name: "東京都", types: ["administrative_area_level_1"] },
    // ... 他のコンポーネント
  ]
}

// 国情報を抽出
const countryInfo = extractCountryFromAddressComponents(placesCache.address_components)
// 結果: { countryCode: "jp", countryName: "日本" }
```

---

### 方法2: formatted_address から Geocoding API で取得（フォールバック）

#### なぜ必要？

- `address_components` が存在しない場合
- `address_components` に `country` タイプが含まれていない場合
- 古いキャッシュデータで `address_components` が保存されていない場合

#### 実装箇所

**`lib/travel/country/utils.ts`** の `extractCountryFromAddress()` 関数：

```typescript
export async function extractCountryFromAddress(formattedAddress: string): Promise<{ countryCode: string; countryName: string }> {
  // Geocoding API を使用して address_components を取得
  const geocodingResults = await geocodingApiHelpers.geocodeAddress(formattedAddress)
  
  if (geocodingResults.length > 0) {
    const result = geocodingResults[0]
    // address_components から国を抽出
    const countryInfo = extractCountryFromAddressComponents(result.address_components)
    if (countryInfo.countryCode !== 'unknown') {
      return countryInfo
    }
  }

  return { countryCode: 'unknown', countryName: '不明' }
}
```

#### 処理の流れ

1. `formatted_address`（例: "日本、〒105-0011 東京都港区芝公園４丁目２−８"）を Geocoding API に送信
2. Geocoding API が `address_components` を含む結果を返す
3. 返された `address_components` から方法1と同じように国情報を抽出
4. 失敗したら `'unknown'` を返す

#### 注意点

- **API コストがかかる**: Geocoding API は有料なので、頻繁に呼び出すとコストが増えます
- **非同期処理**: `async/await` が必要なので、呼び出し側も非同期処理が必要です

---

## 🎯 実際の使用箇所

### 1. 通貨推測（`lib/utils/currency.ts`）

#### `getCurrencyFromPlace()` 関数

```typescript
getCurrencyFromPlace: (placeData: PlaceData, userId?: string): string => {
  // 1. address_components から国コードを取得
  const countryCode = placeData.address_components?.find(
    (component: any) => component.types.includes('country')
  )?.short_name
  
  if (countryCode) {
    const currency = getCurrencyByCountryCode(countryCode)
    if (currency) {
      return currency
    }
  }
  
  // 2. formatted_address から都市名を推定（都市マッピングを使用）
  const address = placeData.formatted_address || ''
  const currency = getCurrencyByCityName(address.toLowerCase())
  if (currency) {
    return currency
  }
  
  // 3. デフォルト（JPY）
  return 'JPY'
}
```

#### `getCurrencyFromPlaceEnhanced()` 関数（階層的フォールバック）

```typescript
getCurrencyFromPlaceEnhanced: (
  placeData?: PlaceData | null,
  trip?: Trip | null,
  user?: User | null
): { currency: string; source: string; confidence: string } => {
  // 1. Venue の place_data から国コードを取得（信頼度: high）
  if (placeData?.address_components) {
    const countryCode = placeData.address_components.find(
      (component) => component.types.includes('country')
    )?.short_name
    
    if (countryCode) {
      const currency = getCurrencyByCountryCode(countryCode)
      if (currency) {
        return { currency, source: 'venue', confidence: 'high' }
      }
    }
  }
  
  // 2. City 名から推測（信頼度: high/medium）
  // 3. Trip の destination_place から国コードを取得（信頼度: medium）
  // 4. Trip の destination 文字列から推測（信頼度: low）
  // 5. ユーザーの home_country_code（信頼度: low）
  // 6. デフォルト（JPY）（信頼度: low）
}
```

### 2. 旅行の国別グループ化（`lib/travel/country/utils.ts`）

#### `groupTripsByCountry()` 関数

```typescript
export async function groupTripsByCountry(trips: Array<...>): Promise<CountryGroup[]> {
  for (const trip of trips) {
    if (trip.destinationPlace) {
      // address_components がある場合はそれを使用（より正確）
      if (trip.destinationPlace.address_components) {
        const countryInfo = extractCountryFromAddressComponents(
          trip.destinationPlace.address_components
        )
        // ...
      } else if (trip.destinationPlace.formatted_address) {
        // address_components がない場合は formatted_address から推測（Geocoding API 使用）
        const countryInfo = await extractCountryFromAddress(
          trip.destinationPlace.formatted_address
        )
        // ...
      }
    }
  }
}
```

### 3. ユーザーの居住国コード解決（`app/api/trips/[tripSlug]/checklist/generate/route.ts`）

```typescript
// ユーザーの居住国コードを place_cache から解決（home_place_id 優先）
if (user.preferences?.home_place_id && !user.preferences.home_country_code) {
  const cacheDoc = await adminDb.collection(COLLECTIONS.PLACES_CACHE)
    .doc(user.preferences.home_place_id).get()
  
  if (cacheDoc.exists) {
    const place = cacheDoc.data() as PlacesCache
    const countryComponent = place.address_components?.find(
      c => c.types.includes('country')
    )
    if (countryComponent?.short_name) {
      user.preferences.home_country_code = countryComponent.short_name
    }
  }
}
```

---

## ⚠️ 現状の問題点

### 1. address_components がない場合の処理が弱い

**問題**:
- 古いキャッシュデータや、API から取得時に `address_components` が含まれていない場合がある
- この場合、`formatted_address` から Geocoding API で取得するが、API コストがかかる

**影響**:
- 国情報が取得できない → 通貨推測が失敗 → デフォルト（JPY）になる
- 旅行の国別グループ化が失敗 → 「不明」グループに分類される

### 2. 言語別キャッシュ（v2.0.0）の対応が不十分

**問題**:
- キャッシュキーが `{place_id}_{language}` 形式になったが、国情報は言語に依存しない
- 異なる言語のキャッシュから国情報を取得する処理が実装されていない

**影響**:
- 日本語キャッシュがない場合、英語キャッシュから国情報を取得できない可能性がある

### 3. formatted_address からの推測精度が低い

**問題**:
- `formatted_address` は言語によって形式が異なる（例: "日本、〒105-0011..." vs "4-2-8 Shibakoen, Minato City, Tokyo 105-0011, Japan"）
- 文字列パースで国名を抽出する処理がない（Geocoding API に依存）

**影響**:
- Geocoding API が失敗すると、国情報が取得できない

---

## 🔧 改善案

### 1. address_components の保存を確実にする

- Places API から取得する際、必ず `address_components` を含める
- キャッシュ保存時に `address_components` が存在することを確認

### 2. 言語別キャッシュからの国情報取得を改善

- 日本語キャッシュがない場合、英語キャッシュから国情報を取得する処理を追加
- 国情報は言語に依存しないため、どの言語のキャッシュからでも取得可能

### 3. formatted_address からの文字列パースを追加

- Geocoding API が失敗した場合のフォールバックとして、`formatted_address` から国名を抽出する処理を追加
- 正規表現や文字列マッチングで国名を抽出（例: "Japan" や "日本" を検索）

### 4. エラーログの強化

- 国情報が取得できない場合のログを強化
- どの段階で失敗したか（address_components なし、Geocoding API 失敗など）を記録

---

## 📊 データフロー図

```
places_cache (Firestore)
    ↓
PlacesCache 型のデータ取得
    ↓
address_components が存在する？
    ├─ YES → extractCountryFromAddressComponents()
    │         → 国コード・国名を返す ✅
    │
    └─ NO → formatted_address が存在する？
              ├─ YES → extractCountryFromAddress()
              │         → Geocoding API 呼び出し
              │         → address_components 取得
              │         → extractCountryFromAddressComponents()
              │         → 国コード・国名を返す ✅（API コストあり）
              │
              └─ NO → { countryCode: 'unknown', countryName: '不明' } ❌
```

---

## 📝 まとめ

### 現状の実装

1. **最優先**: `address_components` から直接国情報を取得（無料・正確）
2. **フォールバック**: `formatted_address` から Geocoding API で取得（有料・非同期）
3. **失敗時**: `'unknown'` を返す

### 主な問題点

1. `address_components` がない場合の処理が弱い
2. 言語別キャッシュからの国情報取得が不十分
3. `formatted_address` からの推測精度が低い

### 改善の方向性

1. `address_components` の保存を確実にする
2. 言語別キャッシュからの国情報取得を改善
3. `formatted_address` からの文字列パースを追加
4. エラーログの強化

---

## 🔗 関連ファイル

- `lib/travel/country/utils.ts` - 国情報抽出のユーティリティ
- `lib/utils/currency.ts` - 通貨推測（国情報を使用）
- `lib/travel/places-cache.ts` - PlacesCache の管理
- `lib/core/types/place.ts` - PlacesCache 型定義
- `app/api/trips/[tripSlug]/checklist/generate/route.ts` - ユーザーの居住国コード解決

