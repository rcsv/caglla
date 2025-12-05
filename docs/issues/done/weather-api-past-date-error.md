# Issue: Weather Forecast APIが過去の日付でエラーを返す

**作成日**: 2025-10-31  
**解決日**: 2025-11-01  
**状態**: ✅ 解決済み  
**優先度**: 中  
**関連ファイル**:
- `lib/api/weather.ts`（Weather API実装）
- `components/stats/TripWeatherDisplay.tsx`（天気表示コンポーネント）

---

## 📋 概要

Weather Forecast API（Open-Meteo）が過去の日付で呼び出されるとエラーが返ってくる。過去の日付の場合はAPIを呼び出さないようにする必要がある。

---

## 🐛 問題の詳細

### 現状
- Weather Forecast APIが過去の日付でも呼び出されている
- 過去の日付でAPIを呼び出すとエラーが返ってくる
- 過去の旅行でも天気情報を取得しようとしている

### 期待される動作
- **過去の日付の場合はAPIを呼び出さない**
- 過去の旅行の場合は、天気情報を表示しないか、適切なメッセージを表示
- 未来の日付のみAPIを呼び出す

---

## 🔍 原因究明

### 現在の実装

#### `lib/api/weather.ts`（56-82行目）
```typescript
static async getWeatherForecast(
  latitude: number,
  longitude: number,
  startDate: string,
  endDate: string
): Promise<WeatherForecast> {
  const startDateObj = new Date(startDate)
  const endDateObj = new Date(endDate)
  
  // ...
  
  // Limit date range to 16 days from today (Open-Meteo limitation)
  const today = new Date()
  const maxDate = new Date(today)
  maxDate.setDate(today.getDate() + 16)
  
  // Adjust dates if they exceed the allowed range
  const adjustedStartDate = startDateObj > today ? startDateObj : today
  const adjustedEndDate = endDateObj > maxDate ? maxDate : endDateObj
  
  // Check if the date range is valid
  if (adjustedStartDate > adjustedEndDate) {
    throw new Error('...')
  }
  
  // API呼び出し（過去の日付でも呼び出されてしまう）
  // ...
}
```

**問題点**:
- `adjustedStartDate = startDateObj > today ? startDateObj : today`で過去の日付は`today`に調整しているが、`endDate`が過去の場合でもAPIを呼び出している
- `adjustedStartDate > adjustedEndDate`のチェックがあるが、`endDate`が過去で`startDate`が未来の場合、`adjustedEndDate`が過去になり、`adjustedStartDate`（`today`）よりも過去になる可能性がある
- しかし、`adjustedStartDate > adjustedEndDate`のチェックが通過してしまうと、APIが呼び出されてエラーになる

#### `components/stats/TripWeatherDisplay.tsx`（26-48行目）
```typescript
useEffect(() => {
  const fetchWeather = async () => {
    if (!destination || !startDate || !endDate) {
      setWeatherData(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const weather = await WeatherApiHelpers.getTripWeather(destination, startDate, endDate)
      setWeatherData(weather)
    } catch (err) {
      logger.error('Error fetching weather:', err)
      setError('天気情報の取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  fetchWeather()
}, [destination, startDate, endDate])
```

**問題点**:
- 過去の旅行でも天気情報を取得しようとしている
- 日付のチェックが行われていない

---

## 💡 解決方針

### Phase 1: 日付チェックを追加

#### `lib/api/weather.ts`の修正
1. **過去の日付チェックを追加**
   ```typescript
   const today = new Date()
   today.setHours(0, 0, 0, 0) // 時刻を0時に設定して比較
   
   // 過去の日付の場合はAPIを呼び出さない
   if (endDateObj < today) {
     throw new Error('Weather forecast is only available for future dates')
     // または、エラーを投げずに空のデータを返す
     // return { ...emptyWeatherForecast }
   }
   ```

2. **開始日が過去でも終了日が未来の場合の処理**
   - 開始日を`today`に調整（既存のロジック）
   - ただし、終了日が過去の場合は早期リターン

#### `components/stats/TripWeatherDisplay.tsx`の修正
1. **過去の旅行の場合は天気情報を取得しない**
   ```typescript
   useEffect(() => {
     const fetchWeather = async () => {
       if (!destination || !startDate || !endDate) {
         setWeatherData(null)
         return
       }

       // 過去の旅行かチェック
       const today = new Date()
       today.setHours(0, 0, 0, 0)
       const tripEndDate = new Date(endDate)
       tripEndDate.setHours(0, 0, 0, 0)
       
       // 終了日が過去の場合は天気情報を取得しない
       if (tripEndDate < today) {
         setWeatherData(null)
         setIsLoading(false)
         return
       }

       // API呼び出し
       // ...
     }
   }, [destination, startDate, endDate])
   ```

### Phase 2: エラーハンドリングの改善

1. **過去の日付エラーの適切な処理**
   - エラーメッセージを明確にする
   - 過去の旅行の場合は、エラーを表示せずに天気情報を非表示にする

2. **UIフィードバック**
   - 過去の旅行の場合、「過去の旅行のため天気予報は表示できません」などのメッセージを表示（オプション）

---

## 📝 技術的実装詳細

### 日付比較の注意点
- 日付オブジェクトの時刻部分を0時に設定して比較する必要がある
- `new Date()`で作成した日付は現在時刻を含むため、`setHours(0, 0, 0, 0)`で正規化する

### 実装例

#### `lib/api/weather.ts`の修正
```typescript
static async getWeatherForecast(
  latitude: number,
  longitude: number,
  startDate: string,
  endDate: string
): Promise<WeatherForecast> {
  const startDateObj = new Date(startDate)
  const endDateObj = new Date(endDate)
  
  // 時刻を0時に正規化
  startDateObj.setHours(0, 0, 0, 0)
  endDateObj.setHours(0, 0, 0, 0)
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // 過去の日付の場合はAPIを呼び出さない
  if (endDateObj < today) {
    logger.debug('Weather API: Skipping past date request', { startDate, endDate })
    throw new Error('Weather forecast is only available for future dates')
  }
  
  // 以降の処理...
}
```

#### `components/stats/TripWeatherDisplay.tsx`の修正
```typescript
useEffect(() => {
  const fetchWeather = async () => {
    if (!destination || !startDate || !endDate) {
      setWeatherData(null)
      return
    }

    // 過去の旅行かチェック
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tripEndDate = new Date(endDate)
    tripEndDate.setHours(0, 0, 0, 0)
    
    // 終了日が過去の場合は天気情報を取得しない
    if (tripEndDate < today) {
      logger.debug('TripWeatherDisplay: Skipping weather fetch for past trip', { startDate, endDate })
      setWeatherData(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const weather = await WeatherApiHelpers.getTripWeather(destination, startDate, endDate)
      setWeatherData(weather)
    } catch (err) {
      logger.error('Error fetching weather:', err)
      // 過去の日付エラーの場合はユーザーに表示しない
      if (err instanceof Error && err.message.includes('future dates')) {
        setWeatherData(null)
      } else {
        setError('天気情報の取得に失敗しました')
      }
    } finally {
      setIsLoading(false)
    }
  }

  fetchWeather()
}, [destination, startDate, endDate])
```

---

## 🔗 関連ファイル

- `lib/api/weather.ts` - Weather API実装
  - `getWeatherForecast()` - メインのAPI呼び出し関数
  - `getTripWeather()` - 旅行用の天気取得関数（`getWeatherForecast`を呼び出している）
- `components/stats/TripWeatherDisplay.tsx` - 天気表示コンポーネント
- `lib/core/types/weather.ts` - 天気データの型定義

---

## ✅ 完了条件

- [ ] 過去の日付でWeather APIが呼び出されない
- [ ] 過去の旅行では天気情報を取得しない
- [ ] エラーメッセージが適切に処理される（過去の旅行ではエラーを表示しない）
- [ ] 未来の旅行では従来通り天気情報が取得される
- [ ] 日付境界（今日）の処理が正確に行われる

---

## 🔍 実装時の注意事項

1. **日付比較の精度**
   - 時刻部分を0時に正規化してから比較する
   - タイムゾーンの影響を考慮する（必要に応じて）

2. **既存のロジックとの整合性**
   - `adjustedStartDate`の調整ロジックと矛盾しないようにする
   - 16日制限のチェックも維持する

3. **エラーハンドリング**
   - 過去の日付エラーとその他のエラーを区別する
   - 過去の旅行の場合は、エラーをユーザーに表示しない（静かに失敗する）

4. **パフォーマンス**
   - 過去の旅行の場合は早期リターンして、不要なAPI呼び出しを避ける

---

## 📚 参考情報

### Open-Meteo APIの制約
- 天気予報は未来の日付のみ対応
- 最大16日先まで取得可能
- 過去の日付ではエラーが返される

### 関連Issue
- 過去の旅行の表示に関するIssueがある場合、そちらと連携して検討する

