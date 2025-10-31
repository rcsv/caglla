# Feature: 旅行費用サマリーにItinerary明細を表示

**作成日**: 2025-10-31  
**状態**: 🔴 未実装  
**優先度**: 中  
**種類**: Feature（機能追加）  
**関連ファイル**:
- `components/stats/TripCostDisplay.tsx`（費用表示コンポーネント）
- `lib/travel/cost-aggregation.ts`（費用集計ロジック）

---

## 📋 概要

現在の旅行費用サマリーは通貨単位ごとのトータル金額のみを表示しているが、どのItineraryでいくら発生したのかの明細を表示できるようにする。これにより、費用の内訳を確認しやすくなる。

---

## 🐛 現状の問題

### 現在の実装

#### `components/stats/TripCostDisplay.tsx`
- 通貨単位ごとに合計金額と件数を表示
  - 例: "JPY (5件) ¥50,000"
- どのItineraryでいくら使ったかの内訳がない
- 費用の詳細を確認するには、各Itineraryを個別に確認する必要がある

#### `lib/travel/cost-aggregation.ts`
- `aggregateCostsByCurrency`関数で通貨単位ごとに集計
- 各Itineraryの情報は集計時点で失われる
- 明細表示に必要な情報（Itineraryのtitle、day情報など）が保持されていない

### 課題
- 旅行費用の内訳を把握しにくい
- どの活動でどれだけ費用がかかっているか分からない
- 予算管理・振り返りに不十分

---

## 💡 期待される動作

### 基本要件
1. **明細表示モード**
   - デフォルトは現在のトータル表示
   - 明細を展開して各Itineraryの費用を表示

2. **明細情報**
   - Itinerary名（title）
   - 費用（cost_amount + cost_currency）
   - 所属するDay情報（日付、day_number）
   - オプション: アクティビティタグ、場所名

3. **UIデザイン**
   - 折りたたみ可能なアコーディオン形式
   - 通貨単位ごとにグループ化
   - 日付順または金額順にソート可能（オプション）

---

## 🔧 実装方針

### Phase 1: データ構造の拡張

#### `lib/travel/cost-aggregation.ts`の拡張
```typescript
// 既存のCostSummaryに明細情報を追加
export interface CostSummary {
  currency: string
  total: number
  count: number
  currencyInfo: CurrencyInfo
  items?: CostItem[] // 新規追加: 明細情報
}

export interface CostItem {
  itineraryId: string
  itineraryTitle: string
  amount: number
  dayNumber?: number
  dayDate?: Date
  placeName?: string
  activityTag?: string
}

// 新しい集計関数を追加
export function aggregateCostsWithDetails(itineraries: Itinerary[]): TripCostSummary {
  // 既存の集計ロジック + 明細情報の保持
}
```

### Phase 2: UIコンポーネントの拡張

#### `components/stats/TripCostDisplay.tsx`の拡張
1. **折りたたみ可能なアコーディオン**
   - 通貨単位ごとのカード
   - 「明細を表示」ボタンで展開

2. **明細リスト表示**
   - 各Itineraryの費用をリスト表示
   - Itinerary名、金額、日付などを表示
   - クリックで該当Itineraryにスクロール（オプション）

3. **ソート機能（オプション）**
   - 金額順、日付順でソート可能

### Phase 3: パフォーマンス最適化

1. **大量データへの対応**
   - 明細が多すぎる場合はページネーションまたは仮想スクロール
   - デフォルトでは折りたたまれているため、初期読み込みへの影響は最小限

2. **メモ化**
   - 集計結果をメモ化して再計算を回避

---

## 📝 技術的実装詳細

### データ集計の拡張

#### 既存の実装
```typescript:lib/travel/cost-aggregation.ts
export function aggregateCostsByCurrency(itineraries: Itinerary[]): TripCostSummary {
  const costMap = new Map<string, { total: number; count: number }>()
  
  itineraries.forEach(itinerary => {
    if (itinerary.cost_amount && itinerary.cost_amount > 0) {
      // 集計のみ、明細情報は保持されない
    }
  })
}
```

#### 拡張後の実装案
```typescript
export function aggregateCostsWithDetails(itineraries: Itinerary[], days?: Day[]): TripCostSummary {
  const costMap = new Map<string, {
    total: number
    count: number
    items: CostItem[]
  }>()
  
  // Day情報をマップ化（日付検索を高速化）
  const daysMap = new Map<string, Day>()
  if (days) {
    days.forEach(day => {
      if (day.id) {
        daysMap.set(day.id, day)
      }
    })
  }
  
  itineraries.forEach(itinerary => {
    if (itinerary.cost_amount && itinerary.cost_amount > 0) {
      const currency = itinerary.cost_currency || 'JPY'
      const amount = itinerary.cost_amount
      
      // Day情報を取得
      const day = itinerary.day_id ? daysMap.get(itinerary.day_id) : undefined
      
      const item: CostItem = {
        itineraryId: itinerary.id,
        itineraryTitle: itinerary.title || 'Untitled',
        amount,
        dayNumber: day?.day_number,
        dayDate: day?.date ? new Date(day.date) : undefined,
        placeName: itinerary.place_data?.name,
        activityTag: itinerary.activity_tag?.primary_category
      }
      
      if (costMap.has(currency)) {
        const existing = costMap.get(currency)!
        existing.total += amount
        existing.count += 1
        existing.items.push(item)
      } else {
        costMap.set(currency, {
          total: amount,
          count: 1,
          items: [item]
        })
      }
    }
  })
  
  // 結果を変換してソート
  const totalCosts: CostSummary[] = Array.from(costMap.entries()).map(([currency, data]) => ({
    currency,
    total: data.total,
    count: data.count,
    currencyInfo: currencyUtils.getCurrencyInfo(currency),
    items: data.items.sort((a, b) => {
      // 日付順にソート（オプション）
      if (a.dayDate && b.dayDate) {
        return a.dayDate.getTime() - b.dayDate.getTime()
      }
      return 0
    })
  }))
  
  return {
    totalCosts,
    hasCosts: totalCosts.length > 0
  }
}
```

### UIコンポーネントの実装

#### `components/stats/TripCostDisplay.tsx`の拡張
```typescript
export default function TripCostDisplay({ 
  itineraries, 
  days, // 新規追加
  className = '' 
}: TripCostDisplayProps) {
  const [expandedCurrencies, setExpandedCurrencies] = useState<Set<string>>(new Set())
  
  // 明細情報を含む集計
  const costSummary = aggregateCostsWithDetails(itineraries, days)
  
  const toggleCurrency = (currency: string) => {
    const newExpanded = new Set(expandedCurrencies)
    if (newExpanded.has(currency)) {
      newExpanded.delete(currency)
    } else {
      newExpanded.add(currency)
    }
    setExpandedCurrencies(newExpanded)
  }
  
  return (
    <Card title="旅行費用" className={className}>
      <div className="space-y-2">
        {costSummary.totalCosts.map((cost) => (
          <div key={cost.currency}>
            {/* ヘッダー（現在の表示） */}
            <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md">
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-600 mr-2">
                  {cost.currencyInfo.name}
                </span>
                <span className="text-xs text-gray-500">
                  ({cost.count}件)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-lg font-bold text-gray-900">
                  {currencyUtils.formatAmount(cost.total, cost.currency)}
                </div>
                {cost.items && cost.items.length > 0 && (
                  <button
                    onClick={() => toggleCurrency(cost.currency)}
                    className="text-xs text-emerald-600 hover:text-emerald-700"
                  >
                    {expandedCurrencies.has(cost.currency) ? '折りたたむ' : '明細を見る'}
                  </button>
                )}
              </div>
            </div>
            
            {/* 明細リスト（展開時） */}
            {expandedCurrencies.has(cost.currency) && cost.items && (
              <div className="mt-2 space-y-1">
                {cost.items.map((item) => (
                  <div 
                    key={item.itineraryId}
                    className="flex items-center justify-between py-1.5 px-3 text-sm bg-white border border-gray-200 rounded"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-700 truncate">
                        {item.itineraryTitle}
                      </div>
                      {item.dayDate && (
                        <div className="text-xs text-gray-500">
                          {formatDate(item.dayDate)} {item.dayNumber ? `Day ${item.dayNumber}` : ''}
                        </div>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <div className="font-semibold text-gray-900">
                        {currencyUtils.formatAmount(item.amount, cost.currency)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}
```

---

## 🎨 UIデザイン案

### デフォルト状態（折りたたみ）
```
┌─────────────────────────────────────┐
│ 💰 旅行費用                         │
├─────────────────────────────────────┤
│ JPY (5件)          ¥50,000  [明細を見る] │
│ USD (2件)          $200.00  [明細を見る] │
└─────────────────────────────────────┘
```

### 展開状態
```
┌─────────────────────────────────────┐
│ 💰 旅行費用                         │
├─────────────────────────────────────┤
│ JPY (5件)          ¥50,000  [折りたたむ] │
│ ├─ 東京タワー        ¥2,000          │
│ │  2025-11-01 Day 1                 │
│ ├─ 寿司店           ¥8,000          │
│ │  2025-11-01 Day 1                 │
│ ├─ ホテル           ¥15,000         │
│ │  2025-11-01 Day 1                 │
│ ├─ 新幹線           ¥13,000         │
│ │  2025-11-02 Day 2                 │
│ └─ レストラン       ¥12,000         │
│    2025-11-02 Day 2                 │
└─────────────────────────────────────┘
```

---

## 🔗 関連ファイル

- `components/stats/TripCostDisplay.tsx` - 費用表示コンポーネント
- `lib/travel/cost-aggregation.ts` - 費用集計ロジック
- `lib/core/types/trip.ts` - Itinerary型定義
- `lib/core/types/currency.ts` - CostSummary型定義
- `components/trip/TripSummaryView.tsx` - Summary表示（TripCostDisplayを使用）

---

## ✅ 完了条件

- [ ] 通貨単位ごとの合計金額に「明細を見る」ボタンが追加されている
- [ ] 明細を展開すると、各Itineraryの費用が表示される
- [ ] 各明細にItinerary名、金額、日付情報が表示される
- [ ] 明細を折りたたむことができる
- [ ] 複数通貨がある場合も正常に動作する
- [ ] パフォーマンスに大きな影響がない
- [ ] UIデザインが既存のデザインと調和している

---

## 🔍 実装時の注意事項

1. **データ取得**
   - `TripCostDisplay`に`days`プロップを追加する必要がある
   - `TripSummaryView`から`days`情報を渡す必要がある
   - Day情報が不要な場合は、日付表示を省略する

2. **パフォーマンス**
   - 明細情報は集計時に計算する（再計算を避ける）
   - 明細が大量にある場合は、仮想スクロールを検討

3. **ソート機能**
   - 初期実装では日付順ソート
   - 将来的に金額順ソートを追加する場合は、ユーザー設定で切り替え可能に

4. **i18n対応**
   - 「明細を見る」「折りたたむ」などのテキストをi18n化
   - 日付フォーマットもi18n対応（`dateUtils`を使用）

5. **アクセシビリティ**
   - アコーディオンのキーボード操作対応
   - スクリーンリーダー対応（`aria-expanded`など）

---

## 💡 拡張アイデア（将来）

1. **フィルタリング**
   - 特定のアクティビティタグでフィルタ
   - 金額範囲でフィルタ

2. **集計・統計**
   - 日別の費用合計
   - アクティビティタグ別の費用合計

3. **エクスポート**
   - 明細をCSVやPDFでエクスポート

4. **グラフ表示**
   - 円グラフで費用の内訳を可視化

---

## 📚 参考

### 類似機能
- `TripReservationDisplay` - 予約情報の明細表示（参考実装）
- アコーディオンUIの実装パターン

