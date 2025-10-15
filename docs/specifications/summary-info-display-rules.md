# Summary Info 表示ルール

## 概要

Caglla Travel ManagerのSummary Infoセクションにおける表示ルールとデータ処理方法をまとめます。

## レイアウト構成

### Summary セクション
- **配分**: 移動情報 60% : 天気予報 40%
- **グリッド**: `lg:grid-cols-10` (移動情報: `lg:col-span-6`, 天気予報: `lg:col-span-4`)

### Budget セクション
- **配分**: 旅行費用 50% : ホテル情報 50%
- **グリッド**: `lg:grid-cols-2`

## 移動情報表示ルール

### メトリクス表示
移動情報カードでは以下の3つのメトリクスを1行に表示：

1. **訪問地数 (POI Count)**
   - 表示形式: `7`
   - ラベル: `訪問地`
   - 計算方法: `place_data`があるitineraryの数

2. **総距離 (Total Distance)**
   - 表示形式: `1955.4km`
   - ラベル: `総距離`
   - 計算方法: 連続する地点間の距離の合計

3. **総時間 (Total Time)**
   - 表示形式: `32.5h` (コンパクト形式)
   - ラベル: `総時間`
   - 計算方法: 連続する地点間の時間の合計を15分単位で丸める

### 時間フォーマットルール

#### 丸めルール
分を15分単位で丸める：

| 分の範囲 | 丸め結果 | 時間への変換 |
|---------|---------|-------------|
| 0-7分   | 0分     | 0.0h        |
| 8-22分  | 15分    | 0.25h       |
| 23-37分 | 30分    | 0.5h        |
| 38-52分 | 45分    | 0.75h       |
| 53-59分 | 60分    | 1.0h (繰り上げ) |

#### 表示例
- `32h32m` → `32.5h` (32分は30分に丸めて0.5時間)
- `32h7m` → `32h` (7分は0分に丸める)
- `32h53m` → `33h` (53分は60分に丸めて1時間繰り上げ)
- `32h0m` → `32h` (ちょうど時間の場合は小数点なし)

#### 実装コード
```typescript
formatDurationCompact: (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  
  // Round minutes to nearest 15-minute interval
  const roundedMinutes = Math.round(minutes / 15) * 15
  
  // Convert to decimal hours
  const decimalHours = hours + (roundedMinutes / 60)
  
  // Format with appropriate decimal places
  if (roundedMinutes === 0) {
    return `${hours}h`
  } else if (roundedMinutes === 60) {
    return `${hours + 1}h`
  } else {
    return `${decimalHours}h`
  }
}
```

## 区間計算ルール

### 区間の定義
- **区間**: 連続する2つの場所間の移動
- **計算方法**: `places.length - 1` (n個の場所があればn-1区間)

### 区間計算の実装
```typescript
// 連続する地点間の距離を計算
for (let i = 0; i < places.length - 1; i++) {
  const origin = places[i]
  const destination = places[i + 1]
  // 距離・時間を計算
}
```

### 複数日旅行での区間
- 各日のスケジュール順序で区間を計算
- 日をまたぐ移動も含む
- 例: 1日目 A→B→C (2区間), 2日目 D→E (1区間), 日またぎ C→D (1区間) = 合計4区間

## 平均値計算

### 平均距離
```
平均距離 = 総距離 ÷ 区間数
例: 1955.4km ÷ 36区間 = 54.3km/区間
```

### 平均時間
```
平均時間 = 総時間 ÷ 区間数
例: 1952分 ÷ 36区間 = 54分/区間
```

## レスポンシブ対応

### デスクトップ (lg以上)
- Summary: 6:4の配分
- Budget: 1:1の配分
- 移動情報: 3つのメトリクスが1行表示

### モバイル
- 全てのセクションが縦並び (`grid-cols-1`)
- 移動情報の3つのメトリクスも縦並び

## 技術実装

### 使用コンポーネント
- `TripDistanceDisplay`: 移動情報表示
- `TripWeatherDisplay`: 天気予報表示
- `TripCostDisplay`: 旅行費用表示
- `TripHotelDisplay`: ホテル情報表示（開発中）

### 主要ファイル
- `app/trip/[id]/page.tsx`: メインレイアウト
- `components/TripDistanceDisplay.tsx`: 移動情報コンポーネント
- `lib/date-utils.ts`: 時間フォーマット関数
- `lib/distance-api.ts`: 距離計算API

### データフロー
1. `getAllItineraries()` でitineraryデータを取得
2. `distanceApiHelpers.calculateTotalDistance()` で距離・時間を計算
3. `dateUtils.formatDurationCompact()` で時間をフォーマット
4. コンポーネントで表示

## 更新履歴

- **2024-12-XX**: Summary Infoレイアウトの改善とPOI数表示の実装
- **2024-12-XX**: 区間表示からPOI数表示に変更
- **2024-12-XX**: 総時間表示をコンパクト形式に変更（32h32m → 32.5h）
- **2024-12-XX**: レイアウト配分を6:4に変更
