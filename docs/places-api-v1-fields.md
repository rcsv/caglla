# Google Places API v1 フィールド一覧と取得状況

## 📊 現在の取得フィールド

### Basic Data（無料 - $0.00/1,000件）

| 新API v1フィールド | 旧API形式 | 取得状況 | place_cache保存 | 備考 |
|-------------------|----------|---------|----------------|------|
| `id` | `place_id` | ✅ | ✅ | "places/ChIJ..." → "ChIJ..." に変換 |
| `displayName.text` | `name` | ✅ | ✅ | 場所名 |
| `formattedAddress` | `formatted_address` | ✅ | ✅ | 完全な住所 |
| `shortFormattedAddress` | `vicinity` | ✅ | ✅ | 短縮住所（周辺情報） |
| `location.latitude/longitude` | `geometry.location.lat/lng` | ✅ | ✅ | 座標 |
| `viewport` | `geometry.viewport` | ❌ | ❌ | 表示範囲（取得・保存不要） |
| `addressComponents` | `address_components` | ❌ | ❌ | 住所コンポーネント（使用しないため取得停止） |
| `types` | `types` | ✅ | ✅ | カテゴリタイプ |
| `businessStatus` | `business_status` | ✅ | ✅ | 営業状況 |
| `photos` | `photos` | ✅ | ✅ | 写真参照 |
| `googleMapsUri` | `url` | ✅ | ✅ | Google MapsのURL |
| `iconBackgroundColor` | `icon` | ❌ | ❌ | アイコンURL（使用しないため取得停止） |

### Contact Data（$3.00/1,000件）

| 新API v1フィールド | 旧API形式 | 取得状況 | place_cache保存 | 備考 |
|-------------------|----------|---------|----------------|------|
| `nationalPhoneNumber` | `formatted_phone_number` | ✅ | ✅ | 国内電話番号 |
| `internationalPhoneNumber` | `international_phone_number` | ✅ | ✅ | 国際電話番号 |
| `websiteUri` | `website` | ✅ | ✅ | ウェブサイトURL |
| `regularOpeningHours.openNow` | `opening_hours.open_now` | ✅ | ❌ | リアルタイム情報のため除外 |
| `regularOpeningHours.weekdayDescriptions` | `opening_hours.weekday_text` | ✅ | ✅ | 営業時間テキスト |

### Atmosphere Data（$5.00/1,000件）

| 新API v1フィールド | 旧API形式 | 取得状況 | place_cache保存 | 備考 |
|-------------------|----------|---------|----------------|------|
| `rating` | `rating` | ✅ | ✅ | 評価（1.0-5.0） |
| `userRatingCount` | `user_ratings_total` | ✅ | ✅ | レビュー数 |
| `priceLevel` | `price_level` | ✅ | ✅ | 価格帯（0-4） |
| `editorialSummary.text` | `editorial_summary.overview` | ✅ | ✅ | **概要文字列** |
| `reviews` | `reviews` | ✅ | ✅ | ユーザーレビュー |

## 🚫 取得していないフィールド（料金節約・不要）

### Basic Data（無料だが不要）

- `adrFormatAddress` - microformat形式の住所（SEO用、不要）
- `plusCode` - Plus Code（住所がない場合に有用だが現在未使用）
- `primaryType` - 主要カテゴリ（typesで十分）
- `primaryTypeDisplayName` - 主要カテゴリ名（表示名）
- `subDestinations` - サブ目的地（大規模施設用）

### Contact Data（$3.00/1,000件 - 不要）

- `currentOpeningHours` - リアルタイム営業時間（不要）
- `currentSecondaryOpeningHours` - 副営業時間（不要）
- `secondaryOpeningHours` - 定期副営業時間（不要）

### Atmosphere Data（$5.00/1,000件 - 不要）

- `goodForChildren` - 子供向けか（$7/1,000件）
- `goodForGroups` - グループ向けか（$7/1,000件）
- `goodForWatchingSports` - スポーツ観戦向けか（$7/1,000件）
- `liveMusic` - ライブミュージックあるか（$7/1,000件）
- `menuForChildren` - 子供メニューあるか（$7/1,000件）
- `servesBeer` - ビール提供あるか（$7/1,000件）
- `servesBreakfast` - 朝食提供あるか（$7/1,000件）
- `servesCocktails` - カクテル提供あるか（$7/1,000件）
- `servesWine` - ワイン提供あるか（$7/1,000件）

## 🔍 place_cacheに保存されるフィールド

```typescript
{
  // メタデータ
  format_version: "2.0.0",
  cached_at: Date,
  last_accessed: Date,
  access_count: number,
  
  // Basic Data（無料）
  place_id: string,
  name: string,
  formatted_address: string,
  vicinity: string,
  business_status: string,
  types: string[],
  url: string,
  geometry: {
    location: { lat: number, lng: number }
  },
  // address_components: 取得停止（使用しないため）
  photos: Array<{
    photo_reference: string,
    height: number,
    width: number
  }>,
  
  // Contact Data（$3.00/1,000件）
  formatted_phone_number: string,
  international_phone_number: string,
  website: string,
  opening_hours: {
    weekday_text: string[]
    // open_now は保存しない（リアルタイム情報）
  },
  
  // Atmosphere Data（$5.00/1,000件）
  rating: number,
  user_ratings_total: number,
  price_level: number,
  editorial_summary: {
    overview: string
  },
  reviews: Array<{
    author_name: string,
    rating: number,
    text: string,
    time: number,
    relative_time_description: string
  }>
}
```

## 🌐 ロケール設定

現在、ロケール（言語）設定が実装されていません。

### 実装方法

```typescript
// リクエストヘッダーに追加
'Accept-Language': 'ja'

// または、リクエストボディに追加
{
  languageCode: 'ja'
}
```

### 対応フィールド

- `displayName.text` → 日本語の場所名
- `editorialSummary.text` → 日本語の概要
- `reviews[].text.text` → 日本語のレビュー
- `regularOpeningHours.weekdayDescriptions` → 日本語の営業時間

## 📸 写真取得の新形式

### 旧Places API

```
photo_reference: "CmRaAAAA..."
URL: /api/places/photo?photoreference=CmRaAAAA...&maxwidth=400
```

### 新Places API v1

```
photo.name: "places/ChIJ.../photos/CmRaAAAA..."
URL: https://places.googleapis.com/v1/{name}/media?maxHeightPx=400&maxWidthPx=400&key={API_KEY}
```

**現在の問題**: photo.nameの形式が変更されたため、変換処理が不完全

**修正必要箇所**: 
- `/app/api/places/details/route.ts` の photo_reference 変換ロジック
- `/app/api/places/photo/route.ts` の新形式対応（実装済みだが要テスト）

## 💰 コスト内訳

| データカテゴリ | 料金/1,000件 | 取得フィールド数 |
|--------------|-------------|----------------|
| Basic Data | $0.00 | 9フィールド |
| Contact Data | $3.00 | 4フィールド |
| Atmosphere Data | $5.00 | 5フィールド |
| **合計** | **$8.00** | **18フィールド** |

**旧Places API**: $17.00/1,000件（全フィールド一律）
**削減額**: **$9.00/1,000件（53%削減）**

