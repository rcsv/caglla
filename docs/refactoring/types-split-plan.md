# types.ts 分割プラン

## 📊 現状分析

- **総行数**: 1,010行
- **主要セクション**: 16セクション
- **型定義数**: 約80個

## 🎯 分割戦略

### ファイル構成

```
lib/core/types/
├── index.ts              # 再エクスポート（後方互換性）
├── common.ts             # 共通型（Firestore、基本型）
├── user.ts               # User、UserPreferences、StorageUsage
├── language.ts           # SupportedLanguage
├── place.ts              # PlaceData、PlacesCache
├── activity.ts           # ActivityTag、ChecklistItem、ChecklistPreset
├── trip.ts               # Trip、Day、Itinerary
├── reservation.ts        # ReservationInfo
├── api.ts                # API レスポンス型
├── form.ts               # フォーム用型
├── weather.ts            # WeatherData、WeatherForecast
├── geo.ts                # GeocodingResult、DistanceMatrixResult
├── currency.ts           # CurrencyInfo、CostSummary
├── country.ts            # CountryCoordinate、CountryGroup
├── unsplash.ts           # UnsplashPhoto
├── env.ts                # RequiredEnvVars、OptionalEnvVars
├── ui.ts                 # コンポーネントProps型
└── auth.ts               # AuthContextType

```

## 📋 詳細マッピング

### 1. common.ts (20行)
```typescript
- FirestoreTimestamp
- FirestoreDate
- AccessLevel (新規追加)
- Gender (新規追加)
- Theme (新規追加)
```

### 2. user.ts (40行)
```typescript
- UserPreferences
- User
- StorageUsage
- StorageFile
- StorageQuota
```

### 3. language.ts (15行)
```typescript
- SupportedLanguage
- LANGUAGE_NAMES (新規追加)
```

### 4. place.ts (70行)
```typescript
- PlaceData
- PlacesCache
```

### 5. activity.ts (100行)
```typescript
- ActivityTag
- PrimaryCategoryType
- ChecklistItem
- TripChecklist
- ChecklistPresetItem
- ChecklistPreset
- ActivityStats
```

### 6. trip.ts (70行)
```typescript
- Itinerary
- Day
- Trip
- TripUser
```

### 7. reservation.ts (50行)
```typescript
- ReservationType
- ReservationSite
- ReservationInfo
```

### 8. api.ts (30行)
```typescript
- TripResponse
- ItineraryResponse
- DayResponse
- PlaceSearchResult
- PlaceDetailsResult
```

### 9. form.ts (30行)
```typescript
- TripFormData
- ItineraryFormData
- DayFormData
```

### 10. weather.ts (50行)
```typescript
- WeatherData
- WeatherForecast
- WeatherSummary
```

### 11. geo.ts (50行)
```typescript
- GeocodingResult
- GeocodingResponse
- DistanceMatrixResult
- DistanceMatrixResponse
```

### 12. currency.ts (60行)
```typescript
- CurrencyInfo
- CostSummary
- TripCostSummary
- TimezoneInfo
- TimezoneFailureLog
- TimezoneMappingUpdate
- CurrencyFailureLog
- CurrencyMappingUpdate
```

### 13. country.ts (30行)
```typescript
- CountryCoordinate
- CountryGroup
- BrowserInfo
```

### 14. unsplash.ts (80行)
```typescript
- UnsplashPhoto
- UnsplashSearchResponse
- UnsplashRandomResponse
```

### 15. env.ts (50行)
```typescript
- RequiredEnvVars
- OptionalEnvVars
```

### 16. ui.ts (150行)
```typescript
- UserSettingsModalProps
- TripEditorProps
- TripMapProps
- TripWeatherDisplayProps
- TripDistanceDisplayProps
- TripCostDisplayProps
- ScheduleCardProps
- VenueDistanceProps
- PlaceSearchInputProps
- DayEditorProps
- ItineraryDropZoneProps
- DayDropZoneProps
- AddScheduleModalProps
- ImageUploadProps
- AvatarUploadProps
- CountryMapProps
- CountryStatsProps
```

### 17. auth.ts (10行)
```typescript
- AuthContextType
```

## 🔄 依存関係マップ

```
common.ts (基盤)
  ↓
user.ts, language.ts
  ↓
place.ts
  ↓
activity.ts, trip.ts, reservation.ts
  ↓
api.ts, form.ts, weather.ts, geo.ts, currency.ts
  ↓
ui.ts, auth.ts
```

## ⚠️ 注意点

### 1. 循環依存の回避
- `common.ts` は他のファイルをインポートしない
- 依存は一方向のみ（上から下へ）
- `type-only` import を使用: `import type { X } from './y'`

### 2. 後方互換性
- `index.ts` で全型を再エクスポート
- 既存のインポート文は変更不要
```typescript
// 既存コード（変更不要）
import { User, Trip, PlaceData } from '@/lib/core/types'
```

### 3. 段階的移行
1. 共通型（common.ts）から開始
2. ユーザー・場所（user.ts, place.ts）
3. トリップ（trip.ts）
4. API・UI（api.ts, ui.ts）
5. その他のドメイン

## 📝 実装手順

### Phase 1: ディレクトリ作成と共通型
```bash
mkdir -p lib/core/types
git mv lib/core/types.ts lib/core/types-legacy.ts
```

### Phase 2: 基本ドメイン型
1. common.ts
2. user.ts
3. language.ts
4. place.ts

### Phase 3: ビジネスロジック型
1. activity.ts
2. trip.ts
3. reservation.ts

### Phase 4: API・UI型
1. api.ts
2. form.ts
3. ui.ts

### Phase 5: その他のドメイン
1. weather.ts
2. geo.ts
3. currency.ts
4. country.ts
5. unsplash.ts
6. env.ts
7. auth.ts

### Phase 6: 統合とテスト
1. index.ts作成
2. ビルドテスト
3. 型チェック
4. レガシーファイル削除

## 🧪 テスト戦略

```bash
# 各フェーズ後に実行
npm run build
npm run type-check

# 循環依存チェック
npx madge --circular lib/core/types
```

## 📊 推定作業時間

| フェーズ | 作業時間 | 累計 |
|---------|---------|------|
| Phase 1 | 30分 | 30分 |
| Phase 2 | 2時間 | 2.5時間 |
| Phase 3 | 2時間 | 4.5時間 |
| Phase 4 | 1.5時間 | 6時間 |
| Phase 5 | 2時間 | 8時間 |
| Phase 6 | 1時間 | 9時間 |

**合計: 約9時間**

## ✅ チェックリスト

- [ ] Phase 1: ディレクトリ作成
- [ ] Phase 2: 基本ドメイン型
- [ ] Phase 3: ビジネスロジック型
- [ ] Phase 4: API・UI型
- [ ] Phase 5: その他のドメイン
- [ ] Phase 6: 統合とテスト
- [ ] ビルド成功確認
- [ ] 型チェック通過
- [ ] 循環依存なし
- [ ] レガシーファイル削除
- [ ] ドキュメント更新

## 📈 期待される効果

- **ファイルサイズ**: 1,010行 → 平均55行/ファイル
- **保守性**: ⭐⭐ → ⭐⭐⭐⭐⭐
- **型の発見性**: ⭐⭐ → ⭐⭐⭐⭐⭐
- **チーム開発**: コンフリクト減少

