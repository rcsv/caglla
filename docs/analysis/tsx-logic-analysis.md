# TSXファイル内のロジック混在分析レポート

## 概要
TSXファイル（Reactコンポーネント）の中にビジネスロジックやデータ処理が深く入り込んでいるファイルを調査しました。

## 問題のあるファイル一覧

### 🔴 重大な問題（1000行以上）

#### 1. `components/trip/TripMap.tsx` (1263行)
**問題点:**
- 距離計算関数（`calculateDistance`）がコンポーネント内に定義されている（28-45行目）
- 滑らかな移動関数（`smoothMoveToLocation`）がコンポーネント内に定義されている（48-83行目）
- 地図の初期化ロジックが複雑（316-585行目）
- POIクリック処理のロジックが深く入り込んでいる（381-491行目、494-527行目）
- マーカー管理ロジック（587-859行目）
- ルート描画ロジック（746-788行目）
- 複数のuseEffectフックに複雑なロジックが含まれている

**推奨リファクタリング:**
- `calculateDistance` → `lib/utils/distance.ts` に移動
- `smoothMoveToLocation` → `lib/travel/map-utils.ts` に移動
- 地図初期化ロジック → `lib/travel/map-initializer.ts` に分離
- POI処理ロジック → `lib/travel/poi-handler.ts` に分離
- マーカー管理 → カスタムフック `hooks/useMapMarkers.ts` に分離

### 🟠 大きな問題（500-1000行）

#### 2. `components/modals/POIDialog.tsx` (874行)
**問題点:**
- 価格レベルの集約ロジック（`getAggregatedPriceLevel`）がコンポーネント内に定義されている（81-102行目）
- ポップアップ位置計算ロジック（`calculatePopupPosition`）がコンポーネント内に定義されている（131-148行目）
- 営業時間の解析ロジックがコンポーネント内で実行されている（172-177行目）
- 複雑なUI状態管理とデータ変換が混在

**推奨リファクタリング:**
- `getAggregatedPriceLevel` → `lib/utils/venue-pricing.ts` に移動
- `calculatePopupPosition` → `lib/utils/popup-position.ts` に移動
- 営業時間解析は既に `components/modals/utils/parse-opening-hours.ts` に分離されているが、使用箇所を確認

#### 3. `components/trip/ScheduleCard.tsx` (667行)
**問題点:**
- タイムゾーン自動設定ロジックが複雑（159-209行目）
- 画像ロードとキャッシュ処理がコンポーネント内に（257-319行目）
- place_dataの取得ロジックがコンポーネント内に（214-253行目）
- 複数の編集ハンドラーがコンポーネント内に定義されている

**推奨リファクタリング:**
- タイムゾーン自動設定 → カスタムフック `hooks/useTimezoneAutoSet.ts` に分離
- 画像ロード処理 → カスタムフック `hooks/usePlaceImage.ts` に分離
- place_data取得 → カスタムフック `hooks/usePlaceDataLoader.ts` に分離

#### 4. `components/trip/TripEditor.tsx` (796行)
**確認が必要:** ファイルサイズが大きいため、ロジックの混在を確認する必要があります。

#### 5. `components/trip/TripItineraryView.tsx` (680行)
**確認が必要:** ファイルサイズが大きいため、ロジックの混在を確認する必要があります。

### 🟡 中程度の問題（200-500行）

#### 6. `components/trip/DailyRouteOptimizer.tsx` (319行)
**問題点:**
- ルート最適化の実行ロジックがコンポーネント内に（41-83行目）
- 最適化結果の適用ロジックが複雑（85-205行目）
- インデックス変換ロジックがコンポーネント内に（112-140行目）

**推奨リファクタリング:**
- 最適化実行ロジック → `lib/travel/route-optimization.ts` に移動（一部は既に存在）
- 結果適用ロジック → `lib/travel/itinerary-reorder.ts` に移動（一部は既に存在）
- インデックス変換 → `lib/utils/route-utils.ts` に移動

#### 7. `components/trip/RouteOptimizationDisplay.tsx` (224行)
**問題点:**
- ルート最適化の実行ロジックがuseEffect内に（49-93行目）
- 比較機能のロジックがコンポーネント内に

**推奨リファクタリング:**
- 最適化実行ロジック → カスタムフック `hooks/useRouteOptimization.ts` に分離

#### 8. `components/trip/VenueDistance.tsx` (288行)
**問題点:**
- 距離計算ロジックがuseEffect内に（52-124行目）
- キャッシュキー生成ロジックがコンポーネント内に（45-50行目）

**推奨リファクタリング:**
- 距離計算ロジック → カスタムフック `hooks/useVenueDistance.ts` に分離
- キャッシュキー生成 → `lib/utils/distance-cache.ts` に移動

#### 9. `components/stats/TripDistanceDisplay.tsx` (284行)
**問題点:**
- 総距離計算ロジックがuseEffect内に（52-94行目）
- 場所キー生成ロジックがコンポーネント内に（42-50行目）

**推奨リファクタリング:**
- 総距離計算ロジック → カスタムフック `hooks/useTripDistance.ts` に分離
- 場所キー生成 → `lib/utils/distance-cache.ts` に移動

#### 10. `components/stats/ActivityStatsDisplay.tsx`
**問題点:**
- アクティビティ統計計算関数（`calculateActivityStats`）がコンポーネントファイル内に定義されている（18-71行目）

**推奨リファクタリング:**
- `calculateActivityStats` → `lib/travel/activity-stats.ts` に移動

## リファクタリング優先度

### 高優先度
1. **TripMap.tsx** - 最も大きく、複数のロジックが混在
2. **POIDialog.tsx** - 価格計算や位置計算などのロジックが混在
3. **ScheduleCard.tsx** - タイムゾーンや画像処理などのロジックが混在

### 中優先度
4. **DailyRouteOptimizer.tsx** - ルート最適化ロジックの分離
5. **VenueDistance.tsx** - 距離計算ロジックの分離
6. **TripDistanceDisplay.tsx** - 総距離計算ロジックの分離

### 低優先度
7. **RouteOptimizationDisplay.tsx** - 比較的小さいが、ロジックの分離は推奨
8. **ActivityStatsDisplay.tsx** - 計算関数の分離

## リファクタリングのベストプラクティス

### 1. ユーティリティ関数の抽出
- 純粋関数（入力→出力）は `lib/utils/` に移動
- 例: `calculateDistance`, `getAggregatedPriceLevel`

### 2. カスタムフックの活用
- 状態管理と副作用を含むロジックはカスタムフックに分離
- 例: `useVenueDistance`, `usePlaceImage`, `useRouteOptimization`

### 3. サービス層の導入
- 複雑なビジネスロジックはサービス層に分離
- 例: `lib/travel/map-initializer.ts`, `lib/travel/poi-handler.ts`

### 4. コンポーネントの責務
- コンポーネントはUIの表示とユーザーインタラクションに集中
- データ変換や計算は外部に委譲

## 次のステップ

1. 優先度の高いファイルから順にリファクタリングを実施
2. 各リファクタリングでテストを追加
3. リファクタリング後のパフォーマンスを測定
4. コードレビューでロジックの分離を確認

