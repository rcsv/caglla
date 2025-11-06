# Issue: 気温表記方法・距離単位の設定項目機能

**作成日**: 2025-11-01  
**解決日**: 2025-11-06  
**状態**: ✅ 解決済み  
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

### Phase 2: 単位変換ユーティリティの作成 ✅

**新規ファイル**: `lib/utils/unit-conversion.ts`
**新規ファイル**: `lib/utils/unit-system.ts`（単位系のデフォルト値決定）

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

### Phase 3: ユーザー設定の取得 ✅

**新規ファイル**: `lib/utils/unit-system.ts`

```typescript
/**
 * ユーザーの単位系を取得（デフォルト値付き）
 * home_country_codeに基づいて自動決定
 */
export function getUserUnitSystem(user?: User | null): UnitSystem {
  if (user?.preferences?.unit_system) {
    return user.preferences.unit_system
  }
  // home_country_codeに基づいて自動決定
  return getDefaultUnitSystem(user?.preferences?.home_country_code)
}
```

**デフォルト値の決定ロジック**:
- ヤードポンド法を使用する国（US, LR, MM）→ `imperial`
- その他の国 → `metric`

### Phase 4: TripWeatherDisplayの対応 ✅

**ファイル**: `components/stats/TripWeatherDisplay.tsx`

- `getUserUnitSystem`を使用して単位系を取得
- `convertTemperature`で温度を変換（APIは摂氏で返す）
- `convertWindSpeed`で風速を変換
- `convertPrecipitation`で降水量を変換

### Phase 5: TripDistanceDisplayの対応 ✅

**ファイル**: `components/stats/TripDistanceDisplay.tsx`

- `getUserUnitSystem`を使用して単位系を取得
- `convertDistance`で距離を変換（総距離、平均距離）

### Phase 6: ユーザー設定UIの追加 ✅

**ファイル**: `components/modals/UserSettingsModal.tsx`

- 単位系選択のドロップダウンを追加（`home_country_code`の下）
- `home_country_code`が変更された場合、`unit_system`が未設定なら自動設定
- 初期化時に`unit_system`が未設定の場合、`home_country_code`に基づいて自動設定

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

---

## ✅ 実装完了（2025-11-06）

### 実装方針の変更

当初の計画では、温度単位と距離単位を個別に設定する予定でしたが、以下の理由により**単位系（`unit_system`）を1つ選択する方式**に変更しました：

1. **相関関係**: メートル法を使う国は基本的に摂氏を使い、ヤードポンド法を使う国は基本的に華氏を使うという強い相関がある
2. **ユーザビリティ**: 細かく選ばせると混乱を招く可能性がある
3. **シンプルさ**: 1つの選択で温度と距離の両方が自動的に設定される

### 実装内容

#### Phase 1: 型定義の追加 ✅
- `lib/core/types/user.ts`に`UnitSystem`型（`'metric' | 'imperial'`）を追加
- `UserPreferences`に`unit_system`フィールドを追加

#### Phase 2: 単位変換ユーティリティの作成 ✅
- `lib/utils/unit-conversion.ts`: 温度・距離・風速・降水量の変換関数を実装
- `lib/utils/unit-system.ts`: 単位系のデフォルト値決定ロジックを実装
  - ヤードポンド法を使用する国（US, LR, MM）→ `imperial`
  - その他の国 → `metric`

#### Phase 3: ユーザー設定の取得 ✅
- `getUserUnitSystem()`関数を実装
- `user.preferences.unit_system`が設定されている場合はそれを使用
- 未設定の場合は`home_country_code`に基づいて自動決定

#### Phase 4: TripWeatherDisplayの対応 ✅
- `useUserData`を使用してFirestoreのユーザー情報を取得
- 温度: 摂氏（°C）→ 華氏（°F）の変換
- 風速: km/h → mph の変換
- 降水量: mm → inch の変換

#### Phase 5: TripDistanceDisplayの対応 ✅
- `useUserData`を使用してFirestoreのユーザー情報を取得
- 距離: km → mi（0.5マイル以上）または ft（0.5マイル未満）の変換

#### Phase 6: VenueDistanceの対応 ✅
- `useUserData`を使用してFirestoreのユーザー情報を取得
- 場所間距離の単位変換

#### Phase 7: ユーザー設定UIの追加 ✅
- プロフィールページ（`app/[userSlug]/page.tsx`）に単位系選択ドロップダウンを追加
- `home_country_code`が変更された場合、`unit_system`が未設定なら自動設定
- 保存後に`refreshUserData()`を呼び出して`UserDataProvider`の`userData`を更新

#### Phase 8: i18n対応 ✅
- `lib/i18n/index.ts`に単位系設定関連のi18nキーを追加
- 英語・日本語の翻訳を追加

### 実装時の課題と解決

1. **`useAuth`と`useUserData`の違い**
   - 問題: `useAuth`はFirebase Authの`User`オブジェクトを返すが、Firestoreの`preferences.unit_system`を含まない
   - 解決: `useUserData`を使用してFirestoreのユーザー情報を取得するように変更

2. **プロフィールページでの設定反映**
   - 問題: プロフィールページで単位系を変更しても、他のページで反映されない
   - 解決: 保存後に`refreshUserData()`を呼び出して`UserDataProvider`の`userData`を更新

3. **インペリアル単位系の表示ルール**
   - 問題: 4921フィート（約0.93マイル）をフィートで表示していた
   - 解決: 0.5マイル以上はマイル、未満はフィートで表示するように変更

### 実装ファイル

- `lib/core/types/user.ts` - 型定義
- `lib/utils/unit-conversion.ts` - 単位変換関数
- `lib/utils/unit-system.ts` - 単位系のデフォルト値決定
- `components/stats/TripWeatherDisplay.tsx` - 天気表示
- `components/stats/TripDistanceDisplay.tsx` - 距離表示
- `components/trip/VenueDistance.tsx` - 場所間距離表示
- `app/[userSlug]/page.tsx` - プロフィールページ（単位系設定UI）
- `lib/i18n/index.ts` - i18nキー
- `app/api/distance/batch/route.ts` - サーバー側の時間フォーマット修正

### 動作確認

- ✅ プロフィールページで単位系を「インペリアル」に設定
- ✅ 天気予報が華氏・mph・inchで表示される
- ✅ 距離がマイル・フィートで表示される
- ✅ 0.5マイル以上はマイル、未満はフィートで表示される
- ✅ プロフィールページで保存後、他のページで即座に反映される

### コミット

- コミットハッシュ: `ea0e8d2`
- コミットメッセージ: `feat: 単位系設定機能の実装（メートル法/ヤードポンド法）`

