# コンポーネント仕様書

## 概要

Caglla Travel ManagerのReactコンポーネント仕様書です。TypeScript + Tailwind CSSで構築された再利用可能なUIコンポーネントの詳細を記載しています。

## コンポーネント構成

### 1. 共通コンポーネント (components/common/)

#### Button
基本的なボタンコンポーネント

**Props:**
```typescript
interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}
```

**使用例:**
```tsx
<Button onClick={handleClick} variant="primary" size="md">
  クリック
</Button>
```

#### Card
カード形式のコンテナコンポーネント

**Props:**
```typescript
interface CardProps {
  title?: React.ReactNode
  children: React.ReactNode
  className?: string
  onClick?: () => void
}
```

**使用例:**
```tsx
<Card title="旅行情報" className="p-4">
  <p>旅行の詳細情報</p>
</Card>
```

#### Input
テキスト入力フィールド

**Props:**
```typescript
interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number'
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  error?: string
  className?: string
}
```

#### PlaceSearchInput
場所検索用の入力フィールド

**Props:**
```typescript
interface PlaceSearchInputProps {
  currentPlace?: PlaceData | null
  onPlaceSelect: (place: PlaceData | null) => void
  placeholder?: string
  disabled?: boolean
}
```

**機能:**
- デバウンス付き検索（300ms）
- Google Places APIとの連携
- 検索結果のドロップダウン表示
- 外部クリックでドロップダウンを閉じる

#### Select
セレクトボックス

**Props:**
```typescript
interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  placeholder?: string
  disabled?: boolean
  className?: string
}
```

#### Textarea
テキストエリア

**Props:**
```typescript
interface TextareaProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  disabled?: boolean
  className?: string
}
```

#### Toggle
トグルスイッチ

**Props:**
```typescript
interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  label?: string
  className?: string
}
```

#### Loading
ローディング表示

**Props:**
```typescript
interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
}
```

### 2. 旅行関連コンポーネント (components/trip/)

#### TripEditor
旅行情報の編集モーダル

**Props:**
```typescript
interface TripEditorProps {
  trip: Trip
  onUpdate: (updatedTrip: Trip) => void
  onDelete?: () => void
}
```

**機能:**
- 旅行情報の編集フォーム
- 画像アップロード機能
- 日付バリデーション
- 削除確認ダイアログ
- フルスクリーンローディング表示

#### TripMap
旅行の地図表示

**Props:**
```typescript
interface TripMapProps {
  itineraries: Itinerary[]
  selectedItineraryId?: string | null
  selectedDayId?: string | null
  onItineraryClick?: (itineraryId: string) => void
  onPoiDataUpdate?: (poiData: {
    placeId: string
    name: string
    location: { lat: number; lng: number }
    placeData?: any
  } | null) => void
  poiData?: {
    placeId: string
    name: string
    location: { lat: number; lng: number }
    placeData?: any
  } | null
  className?: string
  focusMode?: 'all' | 'day' | 'single'
  initialCenter?: { lat: number; lng: number }
}
```

**機能:**
- Google Maps APIとの連携
- ティアドロップ形状のマーカー
- ルート最適化表示
- POIクリック検出
- フォーカスモード対応

#### DayEditor
日程の編集コンポーネント

**Props:**
```typescript
interface DayEditorProps {
  day: Day
  onUpdate: (updatedDay: Day) => void
  onDelete: () => void
}
```

#### ScheduleCard
スケジュールカード

**Props:**
```typescript
interface ScheduleCardProps {
  itinerary: Itinerary
  onUpdate: (updatedItinerary: Itinerary) => void
  onDelete: () => void
}
```

#### SortableItineraryCard
ドラッグ&ドロップ対応のスケジュールカード

**Props:**
```typescript
interface SortableItineraryCardProps {
  itinerary: Itinerary
  onUpdate: (updatedItinerary: Itinerary) => void
  onDelete: () => void
  onMove?: (fromIndex: number, toIndex: number) => void
}
```

#### TripSummaryView
旅行の概要表示

**Props:**
```typescript
interface TripSummaryViewProps {
  trip: Trip
  days: Day[]
  itineraries: Itinerary[]
}
```

#### TripItineraryView
旅行の旅程表示

**Props:**
```typescript
interface TripItineraryViewProps {
  trip: Trip
  days: Day[]
  onItineraryUpdate: (itinerary: Itinerary) => void
  onItineraryDelete: (itineraryId: string) => void
  onDayUpdate: (day: Day) => void
  onDayDelete: (dayId: string) => void
}
```

#### RouteOptimizationDisplay
ルート最適化結果の表示

**Props:**
```typescript
interface RouteOptimizationDisplayProps {
  waypoints: Array<{ lat: number; lng: number }>
  origin: { lat: number; lng: number }
  destination: { lat: number; lng: number }
  onOptimize: (optimizedWaypoints: Array<{ lat: number; lng: number }>) => void
}
```

#### DailyRouteOptimizer
日別旅程の最適化

**Props:**
```typescript
interface DailyRouteOptimizerProps {
  day: Day
  itineraries: Itinerary[]
  onOptimize: (optimizedItineraries: Itinerary[]) => void
}
```

#### RouteCostEstimator
ルートコストの見積もり

**Props:**
```typescript
interface RouteCostEstimatorProps {
  waypointCount: number
  onCostChange: (cost: number) => void
}
```

### 3. 統計表示コンポーネント (components/stats/)

#### TripCostDisplay
旅行費用の表示

**Props:**
```typescript
interface TripCostDisplayProps {
  itineraries: Itinerary[]
  className?: string
}
```

**機能:**
- 通貨別の費用集計
- 複数通貨の表示
- 費用情報がない場合のメッセージ表示

#### TripDistanceDisplay
旅行距離の表示

**Props:**
```typescript
interface TripDistanceDisplayProps {
  trip: Trip
}
```

#### TripWeatherDisplay
天気情報の表示

**Props:**
```typescript
interface TripWeatherDisplayProps {
  trip: Trip
}
```

#### CountryStats
国別統計の表示

**Props:**
```typescript
interface CountryStatsProps {
  userId: string
}
```

#### RecommendedTrips
おすすめ旅行の表示

**Props:**
```typescript
interface RecommendedTripsProps {
  userId: string
  limit?: number
}
```

### 4. モーダルコンポーネント (components/modals/)

#### AddScheduleModal
スケジュール追加モーダル

**Props:**
```typescript
interface AddScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (itinerary: ItineraryFormData) => void
  dayId: string
  insertAfterIndex?: number
}
```

**機能:**
- 場所検索機能
- スケジュールの追加
- 指定位置への挿入

#### UserSettingsModal
ユーザー設定モーダル

**Props:**
```typescript
interface UserSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}
```

#### SubscriptionModal
サブスクリプション管理モーダル

**Props:**
```typescript
interface SubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  currentPlan: string
  onPlanChange: (planId: string) => void
}
```

#### POIDialog
POI（Point of Interest）情報ダイアログ

**Props:**
```typescript
interface POIDialogProps {
  poiData: {
    placeId: string
    name: string
    location: { lat: number; lng: number }
    placeData?: any
  } | null
  onClose: () => void
}
```

### 5. UIコンポーネント (components/ui/)

#### ImageUpload
画像アップロード

**Props:**
```typescript
interface ImageUploadProps {
  currentImageUrl?: string
  onImageChange: (imageUrl: string | null) => void
  tripId: string
  disabled?: boolean
}
```

#### AvatarUpload
アバター画像アップロード

**Props:**
```typescript
interface AvatarUploadProps {
  currentImageUrl?: string
  onImageChange: (imageUrl: string | null) => void
  userId: string
  disabled?: boolean
}
```

#### StorageUsageDisplay
ストレージ使用量の表示

**Props:**
```typescript
interface StorageUsageDisplayProps {
  usage: StorageUsage
  quota: StorageQuota
}
```

#### PlanLimitsDisplay
プラン制限の表示

**Props:**
```typescript
interface PlanLimitsDisplayProps {
  plan: SubscriptionPlan
  usage: UsageStats
}
```

#### PlanInfoDisplay
プラン情報の表示

**Props:**
```typescript
interface PlanInfoDisplayProps {
  plan: SubscriptionPlan
  onUpgrade?: () => void
}
```

#### PremiumButton
プレミアム機能用ボタン

**Props:**
```typescript
interface PremiumButtonProps {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  className?: string
}
```

#### Checklist
チェックリスト

**Props:**
```typescript
interface ChecklistProps {
  items: Array<{
    id: string
    text: string
    checked: boolean
  }>
  onToggle: (id: string) => void
  onAdd: (text: string) => void
  onDelete: (id: string) => void
}
```

### 6. アイコンコンポーネント (components/common/icons/)

#### CalendarIcon
カレンダーアイコン

**Props:**
```typescript
interface IconProps {
  className?: string
  color?: string
}
```

#### LocationIcon
位置アイコン

#### MoneyIcon
お金アイコン

#### PinIcon
ピンアイコン

#### CloseIcon
閉じるアイコン

#### MenuIcon
メニューアイコン

#### CloudIcon
クラウドアイコン

#### PlannerIcon
プランナーアイコン

#### PublicAccessBadge
公開アクセスバッジ

### 7. ドロップゾーンコンポーネント (components/gonnause/)

#### DayDropZone
日程のドロップゾーン

**Props:**
```typescript
interface DayDropZoneProps {
  tripId: string
  onDayAdd: (day: Day) => void
}
```

#### ItineraryDropZone
旅程のドロップゾーン

**Props:**
```typescript
interface ItineraryDropZoneProps {
  dayId: string
  onItineraryAdd: (itinerary: Itinerary) => void
}
```

#### PremiumFeature
プレミアム機能の表示

**Props:**
```typescript
interface PremiumFeatureProps {
  children: React.ReactNode
  planRequired: string
  currentPlan: string
  onUpgrade: () => void
}
```

## スタイリング

### Tailwind CSSクラス
すべてのコンポーネントはTailwind CSSクラスを使用してスタイリングされています。

### Z-Index管理
`lib/core/z-index.ts`で定義されたZ-Indexクラスを使用：

```typescript
// 使用例
<div className="zidx-popup-menu">ポップアップメニュー</div>
<div className="zidx-float-modal">モーダルダイアログ</div>
```

### レスポンシブデザイン
- モバイルファーストアプローチ
- `sm:`, `md:`, `lg:`, `xl:`プレフィックスを使用
- グリッドレイアウトの活用

## 状態管理

### ローカル状態
- `useState`フックを使用
- フォームデータの管理
- UI状態の管理

### グローバル状態
- Context APIを使用
- 認証状態（`AuthContext`）
- ユーザーデータ（`UserDataContext`）
- サブスクリプション状態（`SubscriptionContext`）

## イベントハンドリング

### フォーム送信
```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  // フォーム送信処理
}
```

### 非同期処理
```tsx
const handleAsyncAction = async () => {
  try {
    setLoading(true)
    const result = await apiCall()
    // 成功処理
  } catch (error) {
    // エラー処理
  } finally {
    setLoading(false)
  }
}
```

## アクセシビリティ

### ARIA属性
- `aria-label`: ラベルの提供
- `aria-expanded`: 展開状態の表示
- `aria-hidden`: 装飾要素の非表示

### キーボードナビゲーション
- `Tab`キーでのフォーカス移動
- `Enter`キーでのアクション実行
- `Escape`キーでのモーダル閉じる

### スクリーンリーダー対応
- セマンティックHTMLの使用
- 適切な見出し構造
- フォームラベルの関連付け

## パフォーマンス最適化

### メモ化
```tsx
const MemoizedComponent = React.memo(({ data }) => {
  // コンポーネントの実装
})
```

### 遅延読み込み
```tsx
const LazyComponent = React.lazy(() => import('./LazyComponent'))
```

### デバウンス
```tsx
const debouncedSearch = useCallback(
  debounce((query: string) => {
    // 検索処理
  }, 300),
  []
)
```

## エラーハンドリング

### エラー境界
```tsx
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // エラーログの記録
  }

  render() {
    if (this.state.hasError) {
      return <h1>エラーが発生しました</h1>
    }

    return this.props.children
  }
}
```

### エラー表示
```tsx
{error && (
  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
    <p className="text-red-800">{error}</p>
  </div>
)}
```

## テスト

### テスト用のProps
```tsx
const defaultProps = {
  trip: mockTrip,
  onUpdate: jest.fn(),
  onDelete: jest.fn()
}
```

### テストの例
```tsx
describe('TripEditor', () => {
  it('renders edit button when not editing', () => {
    render(<TripEditor {...defaultProps} />)
    expect(screen.getByText('編集')).toBeInTheDocument()
  })

  it('opens edit modal when edit button is clicked', () => {
    render(<TripEditor {...defaultProps} />)
    fireEvent.click(screen.getByText('編集'))
    expect(screen.getByText('旅行情報を編集')).toBeInTheDocument()
  })
})
```