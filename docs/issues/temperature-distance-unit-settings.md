# Issue: 気温表記方法・距離単位の設定項目機能

**作成日**: 2025-11-01  
**状態**: 🔴 未解決  
**優先度**: 低（新機能）  
**種類**: 機能追加  
**関連ファイル**: 
- `lib/core/types/user.ts`（UserPreferences型）
- `components/stats/TripWeatherDisplay.tsx`（天気予報表示）
- `components/stats/TripDistanceDisplay.tsx`（距離表示）
- `app/user-settings/page.tsx`（ユーザー設定ページ）
- `components/modals/UserSettingsModal.tsx`（ユーザー設定モーダル）

---

## 📋 概要

ユーザーが気温表記方法（摂氏/華氏）と距離単位（メートル/キロメートル、マイル、フィートなど）を設定できる機能を追加する。これらの設定は天気予報の気温表示と総移動距離表示に反映される。

---

## 🐛 現状の問題

### 1. 気温表示が摂氏（°C）固定

**ファイル**: `components/stats/TripWeatherDisplay.tsx`

- 156行目: `{averageTemp}°C`（固定）
- 159行目: `{minTemp}°C〜{maxTemp}°C`（固定）

華氏（°F）を使用する地域のユーザーには不便。

### 2. 距離表示がキロメートル/メートル固定

**ファイル**: `components/stats/TripDistanceDisplay.tsx`

- 158行目: `{distanceData.totalDistance.text}`（Google Distance Matrix APIから取得、単位は`km`固定の可能性）
- 181行目: `{Math.round(...)}km/区間`（km固定）
- 187行目: `{Math.round(...)}分/区間`（分固定、時間単位は問題なし）

マイルを使用する地域（アメリカなど）のユーザーには不便。

### 3. ユーザー設定に単位設定がない

**ファイル**: `lib/core/types/user.ts`

```typescript
export interface UserPreferences {
  currency?: string
  home_address?: string
  home_place_id?: string
  timezone?: string
  language?: string
  theme?: Theme
  notifications?: boolean
  home_country_code?: string
  // ❌ temperature_unit がない
  // ❌ distance_unit がない
}
```

---

## 💡 解決方針

### Phase 1: 型定義の追加

**ファイル**: `lib/core/types/user.ts`

```typescript
export type TemperatureUnit = 'celsius' | 'fahrenheit'
export type DistanceUnit = 'metric' | 'imperial' | 'us'

export interface UserPreferences {
  // ... 既存フィールド
  temperature_unit?: TemperatureUnit  // デフォルト: 'celsius'
  distance_unit?: DistanceUnit        // デフォルト: 'metric'
}
```

### Phase 2: 単位変換ユーティリティの作成

**新規ファイル**: `lib/utils/unit-conversion.ts`

```typescript
/**
 * 温度単位変換
 */
export function convertTemperature(temp: number, from: 'celsius' | 'fahrenheit', to: 'celsius' | 'fahrenheit'): number {
  if (from === to) return temp
  
  if (from === 'celsius' && to === 'fahrenheit') {
    return (temp * 9/5) + 32
  }
  
  if (from === 'fahrenheit' && to === 'celsius') {
    return (temp - 32) * 5/9
  }
  
  return temp
}

/**
 * 距離単位変換
 */
export function convertDistance(
  distanceKm: number, 
  to: 'metric' | 'imperial' | 'us'
): { value: number; unit: string; formatted: string } {
  if (to === 'metric') {
    if (distanceKm >= 1) {
      return { value: distanceKm, unit: 'km', formatted: `${distanceKm.toFixed(1)} km` }
    } else {
      const meters = distanceKm * 1000
      return { value: meters, unit: 'm', formatted: `${Math.round(meters)} m` }
    }
  }
  
  if (to === 'imperial' || to === 'us') {
    const miles = distanceKm * 0.621371
    if (miles >= 1) {
      return { value: miles, unit: 'mi', formatted: `${miles.toFixed(1)} mi` }
    } else {
      const feet = miles * 5280
      return { value: feet, unit: 'ft', formatted: `${Math.round(feet)} ft` }
    }
  }
  
  // フォールバック
  return { value: distanceKm, unit: 'km', formatted: `${distanceKm.toFixed(1)} km` }
}

/**
 * 風速単位変換（km/h → mph）
 */
export function convertWindSpeed(kmh: number, to: 'metric' | 'imperial' | 'us'): { value: number; unit: string; formatted: string } {
  if (to === 'metric') {
    return { value: kmh, unit: 'km/h', formatted: `${kmh.toFixed(1)} km/h` }
  }
  
  if (to === 'imperial' || to === 'us') {
    const mph = kmh * 0.621371
    return { value: mph, unit: 'mph', formatted: `${mph.toFixed(1)} mph` }
  }
  
  return { value: kmh, unit: 'km/h', formatted: `${kmh.toFixed(1)} km/h` }
}
```

### Phase 3: ユーザー設定の取得

**新規ファイル**: `lib/utils/user-preferences.ts`

```typescript
import { useAuth } from '@/lib/contexts/auth'
import { UserPreferences, TemperatureUnit, DistanceUnit } from '@/lib/core/types'

/**
 * ユーザーの単位設定を取得（デフォルト値付き）
 */
export function useUserUnits() {
  const { user } = useAuth()
  
  // TODO: user.preferences から取得（現状はデフォルト値）
  const temperatureUnit: TemperatureUnit = user?.preferences?.temperature_unit || 'celsius'
  const distanceUnit: DistanceUnit = user?.preferences?.distance_unit || 'metric'
  
  return { temperatureUnit, distanceUnit }
}
```

### Phase 4: TripWeatherDisplayの対応

**ファイル**: `components/stats/TripWeatherDisplay.tsx`

```typescript
import { useUserUnits } from '@/lib/utils/user-preferences'
import { convertTemperature } from '@/lib/utils/unit-conversion'

export default function TripWeatherDisplay({ ... }) {
  const { temperatureUnit } = useUserUnits()
  
  // ...
  
  // 温度表示の変換
  const displayTemp = convertTemperature(averageTemp, 'celsius', temperatureUnit)
  const displayMinTemp = convertTemperature(minTemp, 'celsius', temperatureUnit)
  const displayMaxTemp = convertTemperature(maxTemp, 'celsius', temperatureUnit)
  const tempSymbol = temperatureUnit === 'fahrenheit' ? '°F' : '°C'
  
  return (
    // ...
    <div className="text-2xl font-bold text-yellow-600">
      {displayTemp.toFixed(1)}{tempSymbol}
    </div>
    <div className="text-xs text-gray-500">
      {displayMinTemp.toFixed(0)}{tempSymbol}〜{displayMaxTemp.toFixed(0)}{tempSymbol}
    </div>
  )
}
```

### Phase 5: TripDistanceDisplayの対応

**ファイル**: `components/stats/TripDistanceDisplay.tsx`

```typescript
import { useUserUnits } from '@/lib/utils/user-preferences'
import { convertDistance } from '@/lib/utils/unit-conversion'

export default function TripDistanceDisplay({ ... }) {
  const { distanceUnit } = useUserUnits()
  
  // ...
  
  // 距離表示の変換
  const totalDistance = convertDistance(distanceData.totalDistance.kilometers, distanceUnit)
  const avgDistance = convertDistance(
    distanceData.totalDistance.kilometers / distanceData.segmentCount,
    distanceUnit
  )
  
  return (
    // ...
    <div className="text-2xl font-bold text-blue-600">
      {totalDistance.formatted}
    </div>
    // ...
    <div className="font-medium">
      {avgDistance.formatted}/区間
    </div>
  )
}
```

### Phase 6: ユーザー設定UIの追加

**ファイル**: `components/modals/UserSettingsModal.tsx`

```typescript
<div>
  <label className="block text-sm font-medium text-gray-700">
    温度単位
  </label>
  <select
    value={preferences.temperature_unit || 'celsius'}
    onChange={(e) => setPreferences(prev => ({ 
      ...prev, 
      temperature_unit: e.target.value as TemperatureUnit 
    }))}
    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
  >
    <option value="celsius">摂氏 (°C)</option>
    <option value="fahrenheit">華氏 (°F)</option>
  </select>
</div>

<div>
  <label className="block text-sm font-medium text-gray-700">
    距離単位
  </label>
  <select
    value={preferences.distance_unit || 'metric'}
    onChange={(e) => setPreferences(prev => ({ 
      ...prev, 
      distance_unit: e.target.value as DistanceUnit 
    }))}
    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
  >
    <option value="metric">メートル法 (km, m)</option>
    <option value="imperial">ヤードポンド法 (mi, ft)</option>
    <option value="us">米国単位法 (mi, ft)</option>
  </select>
</div>
```

---

## 🔗 関連ファイル

- `lib/core/types/user.ts` - UserPreferences型定義
- `components/stats/TripWeatherDisplay.tsx` - 天気予報表示（約221行）
- `components/stats/TripDistanceDisplay.tsx` - 距離表示（約205行）
- `components/modals/UserSettingsModal.tsx` - ユーザー設定モーダル（約426行）
- `app/user-settings/page.tsx` - ユーザー設定ページ（約205行）
- `lib/api/google/distance.ts` - Google Distance Matrix API統合（距離データ取得）

---

## ✅ 完了条件

- [ ] `UserPreferences`型に`temperature_unit`と`distance_unit`フィールドが追加される
- [ ] 単位変換ユーティリティが実装される（`lib/utils/unit-conversion.ts`）
- [ ] `TripWeatherDisplay`が気温単位設定に対応する
- [ ] `TripDistanceDisplay`が距離単位設定に対応する
- [ ] ユーザー設定UIに単位設定項目が追加される
- [ ] 設定がFirestoreに保存される
- [ ] 設定変更後、表示が即座に更新される
- [ ] デフォルト値が適切に設定される（摂氏、メートル法）
- [ ] ビルドエラーがない
- [ ] ブラウザで動作確認済み（摂氏/華氏、メートル/マイル切り替えテスト）

---

## 📝 実装時の注意事項

1. **デフォルト値の決定**
   - `temperature_unit`: `'celsius'`（国際標準）
   - `distance_unit`: `'metric'`（国際標準）
   - または、`home_country_code`に基づいて自動設定（将来の拡張）

2. **既存データへの影響**
   - 既存ユーザーの`preferences`には`temperature_unit`と`distance_unit`が存在しない
   - デフォルト値を使用することで後方互換性を確保

3. **Google Distance Matrix API**
   - 距離データは`text`（例: "15.2 km"）と`value`（メートル）の両方を返す
   - `value`（メートル）をキロメートルに変換してから単位変換ユーティリティを使用

4. **精度の維持**
   - 温度変換: 小数点以下1桁まで表示（摂氏・華氏とも）
   - 距離変換: 1km以上は小数点以下1桁、1km未満は整数表示

5. **i18n対応**
   - 単位設定のラベル（"摂氏", "華氏", "メートル法"など）もi18n化する必要がある
   - 関連Issue: 各種i18n化Issue

6. **パフォーマンス**
   - 単位変換は軽量な計算なので、リアルタイム変換で問題なし
   - ただし、大量のデータを変換する場合はメモ化を検討

---

## 💡 将来の拡張アイデア

1. **自動設定**
   - `home_country_code`に基づいて自動的に単位を設定
   - 例: アメリカ → 華氏・マイル、その他 → 摂氏・メートル

2. **風速単位**
   - 現状は`km/h`固定だが、マイル法地域では`mph`を使用
   - `convertWindSpeed`を使用して対応

3. **降水量単位**
   - 現状は`mm`固定だが、マイル法地域では`inch`を使用
   - 単位変換ユーティリティを拡張

4. **時刻単位**
   - 12時間表記（AM/PM）と24時間表記の選択（現状は実装されていないが、将来的に必要になる可能性）

