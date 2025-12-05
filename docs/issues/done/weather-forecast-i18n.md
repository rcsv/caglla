# Issue: 天気予報の解析結果を英語に修正する

**作成日**: 2025-11-01  
**状態**: ✅ 解決済み  
**優先度**: 中  
**解決日**: 2025-11-03（Phase 1完了）、2025-11-03（Phase 2完了）  
**種類**: i18n不備  
**関連ファイル**: 
- `lib/api/weather.ts`（天気予報API、天気コード辞書）
- `components/stats/TripWeatherDisplay.tsx`（天気予報表示コンポーネント）

---

## 📋 概要

天気予報の解析結果（天気コードから天気名への変換、表示ラベル、エラーメッセージなど）が全て日本語ハードコードされており、英語設定時でも日本語が表示される。

---

## 🐛 問題の詳細

### 1. 天気コード辞書が日本語のみ

**ファイル**: `lib/api/weather.ts` (19-48行目)

```typescript
const WEATHER_CODES: Record<number, string> = {
  0: '晴れ',
  1: '主に晴れ',
  2: '部分的に曇り',
  3: '曇り',
  45: '霧',
  // ... 全て日本語
}
```

この辞書が`calculateWeatherSummary`で使用され、`dominantWeather`フィールドに日本語が設定される。

### 2. 天気サマリーのフォーマットが日本語

**ファイル**: `lib/api/weather.ts` (331-345行目)

```typescript
static formatWeatherSummary(summary: WeatherSummary): string {
  const { averageTemp, minTemp, maxTemp, rainyDays, dominantWeather, isPartialForecast } = summary
  
  let result = `${dominantWeather} | 平均${averageTemp}°C (${minTemp}°C〜${maxTemp}°C)`
  
  if (rainyDays > 0) {
    result += ` | 雨の日${rainyDays}日`
  }
  
  if (isPartialForecast) {
    result += ` | ※${summary.forecastDays}日分のみ`
  }
  
  return result
}
```

### 3. TripWeatherDisplayコンポーネントの日本語ハードコード

**ファイル**: `components/stats/TripWeatherDisplay.tsx`

#### 3.1: タイトル
- 52行目: `天気予報`（ローディング時）
- 65行目: `天気予報`（エラー時）
- 87行目: `天気予報`（データなし時）
- 133行目: `天気予報`（通常表示時）

#### 3.2: エラーメッセージ
- 41行目: `天気情報の取得に失敗しました`
- 56行目: `天気情報を取得中...`
- 74行目: `天気情報の取得に失敗しました`
- 77行目: `💡 天気予報は16日以内の日程のみ対応`
- 100行目: `天気情報を取得できませんでした`
- 104行目: `💡 天気予報は16日以内の日程のみ対応`

#### 3.3: データなしメッセージ
- 98-100行目: 
  ```typescript
  {!destination || !startDate || !endDate 
    ? '旅行の日程と目的地を設定すると天気予報が表示されます'
    : '天気情報を取得できませんでした'
  }
  ```

#### 3.4: 表示ラベル
- 136行目: `部分的な予報`
- 147行目: `{dominantWeather}`（日本語の天気名）
- 167行目: `雨の日`
- 178行目: `平均風速`
- 193行目: `予報期間の制約`
- 195-196行目:
  ```typescript
  天気予報は{forecastDays}日分のみ取得可能です。
  旅行期間の残り{availableDays - forecastDays}日分は表示されていません。
  ```

#### 3.5: 天気名の判定ロジック
- 126-129行目: 天気名が日本語であることを前提とした判定
  ```typescript
  const weatherIcon = WeatherApiHelpers.getWeatherIcon(
    dominantWeather === '晴れ' ? 0 : 
    dominantWeather === '主に晴れ' ? 1 :
    dominantWeather === '部分的に曇り' ? 2 :
    dominantWeather === '曇り' ? 3 : 0
  )
  ```

---

## 💡 解決方針

### Phase 1: i18nキーの追加

`lib/i18n/index.ts`に以下のキーを追加:

```typescript
// Weather Forecast - Titles & Labels
| 'weather.title'
| 'weather.loading'
| 'weather.error.fetchFailed'
| 'weather.error.notAvailable'
| 'weather.empty.noData'
| 'weather.empty.noDestination'
| 'weather.hint.forecastLimit'
| 'weather.partialForecast'
| 'weather.constraint.title'
| 'weather.constraint.message'
| 'weather.forecastedBy'

// Weather Forecast - Labels
| 'weather.rainyDays'
| 'weather.averageWindSpeed'
| 'weather.average'
| 'weather.range'

// Weather Codes (0-99)
| 'weather.code.0'   // 晴れ / Clear sky
| 'weather.code.1'   // 主に晴れ / Mainly clear
| 'weather.code.2'   // 部分的に曇り / Partly cloudy
| 'weather.code.3'   // 曇り / Overcast
// ... 全ての天気コード
```

### Phase 2: WEATHER_CODES辞書のi18n化

`lib/api/weather.ts`の`WEATHER_CODES`を削除し、代わりにi18n関数を使用:

```typescript
// lib/api/weather.ts
import { t } from '@/lib/i18n'

export class WeatherApiHelpers {
  /**
   * Get weather description by code (i18n対応)
   */
  static getWeatherDescription(code: number): string {
    return t(`weather.code.${code}` as TranslationKey)
  }
  
  private static calculateWeatherSummary(
    forecast: WeatherForecast,
    startDate: string,
    endDate: string
  ): WeatherSummary {
    // ...
    const dominantWeather = this.getWeatherDescription(parseInt(dominantWeatherCode)) || t('weather.code.unknown')
    // ...
  }
}
```

### Phase 3: formatWeatherSummaryのi18n化

```typescript
static formatWeatherSummary(summary: WeatherSummary): string {
  const { averageTemp, minTemp, maxTemp, rainyDays, dominantWeather, isPartialForecast } = summary
  
  let result = `${dominantWeather} | ${t('weather.average')}${averageTemp}°C (${minTemp}°C${t('weather.range')}${maxTemp}°C)`
  
  if (rainyDays > 0) {
    result += ` | ${t('weather.rainyDays')}${rainyDays}${t('weather.days')}`
  }
  
  if (isPartialForecast) {
    result += ` | ※${summary.forecastDays}${t('weather.days')}${t('weather.only')}`
  }
  
  return result
}
```

### Phase 4: TripWeatherDisplayコンポーネントのi18n化

全箇所で`t()`を使用:

```typescript
// タイトル
<Card title={<div className="text-lg font-medium text-gray-800 flex items-center">
  <IconRenderer iconName="cloud" className="w-5 h-5 mr-2" color="#ca8a04" />
  {t('weather.title')}
</div>}>

// エラーメッセージ
{error && <div>{t('weather.error.fetchFailed')}</div>}

// ラベル
<div className="text-gray-600 mb-1">{t('weather.rainyDays')}</div>
<div className="text-gray-600 mb-1">{t('weather.averageWindSpeed')}</div>
```

### Phase 5: 天気名判定ロジックの修正

日本語文字列での判定をやめ、天気コードを使用:

```typescript
// dominantWeatherをi18n化した後は、コードベースで判定
const dominantWeatherCode = parseInt(dominantWeatherCode)
const weatherIcon = WeatherApiHelpers.getWeatherIcon(dominantWeatherCode)
```

ただし、現状は`dominantWeather`が文字列（日本語）なので、`WeatherSummary`型の`dominantWeather`フィールドをコード（number）に変更するか、別途コードフィールドを追加する必要がある。

**推奨**: `WeatherSummary`に`dominantWeatherCode: number`フィールドを追加し、`dominantWeather: string`はi18n化された文字列を保持する。

---

## 🔗 関連ファイル

- `lib/api/weather.ts` - 天気予報API、天気コード辞書（約364行）
- `components/stats/TripWeatherDisplay.tsx` - 天気予報表示コンポーネント（約221行）
- `lib/core/types/weather.ts` - 天気関連の型定義
- `lib/i18n/index.ts` - i18n辞書（約1200行）

---

## ✅ 完了条件

- [x] `WEATHER_CODES`辞書がi18n化される（Phase 1完了）
- [x] `formatWeatherSummary`がi18n化される（Phase 1完了）
- [x] `TripWeatherDisplay`の主要な日本語文字列がi18n化される（Phase 1完了）
- [x] 天気名の判定ロジックが天気コードベースに修正される（Phase 2完了）
- [x] `WeatherSummary`型に`dominantWeatherCode`フィールドが追加される（Phase 2完了）
- [x] 英語設定時に主要部分が英語で表示される（Phase 1完了）
- [x] 日本語設定時に主要部分が日本語で表示される（Phase 1完了）
- [x] ビルドエラーがない（Phase 1完了）
- [x] ブラウザで動作確認済み（英語・日本語切り替えテスト）（完了）

## ✅ 解決内容（Phase 1）

### 実装内容

1. **i18nキーの追加**（約50キー）
   - 天気コード28個（`weather.code.0` ～ `weather.code.99`）
   - タイトル、エラーメッセージ、ラベル、制約メッセージなど

2. **`lib/api/weather.ts`の修正**
   - `WEATHER_CODES`辞書を削除し、`getWeatherDescription()`関数を追加
   - `formatWeatherSummary()`をi18n化
   - `'データなし'`を`t('weather.empty.noData')`に変更

3. **`components/stats/TripWeatherDisplay.tsx`の修正**
   - 全主要文字列をi18n化（タイトル、ローディング、エラー、ラベルなど）
   - 天気名判定ロジックは暫定対応（言語に依存した判定）
   - プレースホルダー置換は`replace()`メソッドで実装

### 残タスク（Phase 2）

- ~~天気名判定ロジックを`dominantWeatherCode`ベースに変更~~ ✅ 完了（2025-11-03）
- ~~`WeatherSummary`型に`dominantWeatherCode`フィールドを追加~~ ✅ 完了（2025-11-03）
- ~~ブラウザでの動作確認（英語・日本語切り替えテスト）~~ ✅ 完了（実装完了、動作確認済み）

**Phase 2完了**: 天気名判定ロジックを`dominantWeatherCode`ベースに変更し、`WeatherSummary`型に`dominantWeatherCode`フィールドを追加しました。これにより、言語に依存しないアイコン選択が可能になりました。

---

## 📝 実装時の注意事項

1. **天気コードの網羅性**
   - Open-Meteoの天気コード（0-99）は全てi18nキーを定義する必要がある
   - 未定義のコードに対するフォールバック（`t('weather.code.unknown')`）を用意する

2. **パフォーマンス**
   - `getWeatherDescription`は頻繁に呼ばれる可能性があるため、キャッシュを検討

3. **型安全性**
   - `TranslationKey`型に全ての天気コードキーを追加する
   - TypeScriptの型チェックで未定義キーを検出できるようにする

4. **後方互換性**
   - 既存の`dominantWeather`フィールドを使用しているコードがあれば、段階的な移行を検討

5. **データ構造の変更**
   - `WeatherSummary`に`dominantWeatherCode`を追加する場合、既存のコードへの影響を確認する

---

## 🔍 参考

- Open-Meteo Weather Codes: https://open-meteo.com/en/docs
- WMO Weather Interpretation Codes: https://community.open-meteo.com/en/questions/902/weather-codes-wmo-weather-interpretation-codes

