# 統一日付範囲表示ライブラリ

## 概要

Caglla Travel Manager で使用する日付範囲表示の統一ルールを実装したライブラリです。一貫性のある日付表示により、ユーザーエクスペリエンスを向上させます。

## 実装されたルール

### 1. 単日旅行
- **ルール**: 終了日を表示しない、期間は「日帰り」を使用
- **例**: `10/20 - 10/20 (1日後、1日間)` → `10/20 (1日後、日帰り)`

### 2. 同月内の期間
- **ルール**: 終了日の月を省略（ノート記述方式）
- **例**: `10/20 - 10/21 (1日後、2日間)` → `10/20 - 21 (1日後、2日間)`

### 3. 同年内異月
- **ルール**: 終了日の年を省略
- **例**: `10/20 - 11/5 (1日後、17日間)` → `10/20 - 11/5 (1日後、17日間)`

### 4. 年跨ぎ
- **ルール**: 開始年と終了年の両方を表示
- **例**: `12/30 - 1/10 (72日後、12日間)` → `2025/12/30 - 2026/1/10 (72日後、12日間)`

### 5. 曜日表示
- **ルール**: 表示しない（UIの簡潔性を重視）

## API

### `formatFutureTripDate(startDate, endDate)`
未来の旅行用の日付範囲表示（相対時間付き）

```typescript
import { dateUtils } from '@/lib/utils/date'

// 単日旅行
const result1 = dateUtils.formatFutureTripDate(
  new Date('2025-10-20'), 
  new Date('2025-10-20')
)
// 結果: "10/20 (1日後、日帰り)"

// 同月内の期間
const result2 = dateUtils.formatFutureTripDate(
  new Date('2025-10-20'), 
  new Date('2025-10-21')
)
// 結果: "10/20 - 21 (1日後、2日間)"

// 年跨ぎ
const result3 = dateUtils.formatFutureTripDate(
  new Date('2025-12-30'), 
  new Date('2026-01-10')
)
// 結果: "2025/12/30 - 2026/1/10 (72日後、12日間)"
```

### `formatDateRange(startDate, endDate)`
基本的な日付範囲表示（相対時間なし）

```typescript
// 単日旅行
const result1 = dateUtils.formatDateRange(
  new Date('2025-10-20'), 
  new Date('2025-10-20')
)
// 結果: "10/20"

// 同月内の期間
const result2 = dateUtils.formatDateRange(
  new Date('2025-10-20'), 
  new Date('2025-10-21')
)
// 結果: "10/20 - 21"

// 年跨ぎ
const result3 = dateUtils.formatDateRange(
  new Date('2025-12-30'), 
  new Date('2026-01-10')
)
// 結果: "2025/12/30 - 2026/1/10"
```

### `formatUnifiedDateRange(start, end, daysUntil, tripDuration)`
内部使用の統一フォーマット関数

### `formatUnifiedDateRangeWithoutRelativeTime(start, end, tripDuration)`
相対時間なしの統一フォーマット関数

## 使用例

### TripCard コンポーネントでの使用
```typescript
// components/tripcard/TripCard.tsx
{trip.start_date && trip.end_date && (
  <p className="text-gray-500 text-sm flex items-center gap-1">
    <IconRenderer iconName="calendar" className="w-4 h-4" color="#6b7280" />
    {(() => {
      const { futureTrips, pastTrips } = dateUtils.sortTripsByDate([trip])
      if (futureTrips.length > 0) {
        return dateUtils.formatFutureTripDate(trip.start_date, trip.end_date)
      } else if (pastTrips.length > 0) {
        return dateUtils.formatPastTripDate(trip.start_date, trip.end_date)
      } else {
        return dateUtils.formatDateRange(trip.start_date, trip.end_date)
      }
    })()}
  </p>
)}
```

## テスト

実装の動作確認は以下のテストページで行えます：

- **テストページ**: `/test/date-range-unified`
- **テストスクリプト**: `scripts/test-date-range-unified.ts`

## 期間計算の詳細

期間計算は以下の式を使用しています：

```typescript
const tripDuration = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
```

この計算により、以下の期間が正しく計算されます：

- 10/20 - 10/20: 1日間（日帰り）
- 10/20 - 10/21: 2日間
- 10/20 - 11/5: 17日間
- 12/30 - 1/10: 12日間

## 過去の旅行データ

過去の旅行データについては、既存の `formatPastTripDate` 関数を維持し、相対時間表示（「3ヶ月前」「2年前」など）を継続使用します。

## 今後の拡張

- 多言語対応時の日付フォーマット
- カスタム日付フォーマットオプション
- タイムゾーン対応
