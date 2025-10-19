# ScheduleCard.tsx リファクタリング提案

## ⚠️ 重要：実装前に必ず読むこと

実装を始める前に **`implementation-guide.md`** を必ず確認してください。

現場でコケやすい以下のポイントの対策が詳しく書かれています：
- **状態の一貫性（同期／競合）** - AbortControllerによるリクエスト管理
- **楽観更新+ロールバック** - エラー時のUI整合性
- **React.memo/useCallback/useMemo** - パフォーマンス最適化
- **アクセシビリティ** - キーボード操作とARIA属性
- **タイムゾーン/通貨** - Luxon使用、DST対応

**このドキュメントは概要です。詳細な実装方法は `implementation-guide.md` を参照してください。**

---

## 📊 現状分析

### ファイルサイズ
- **総行数**: 1,252行（プロジェクト2位の大きさ）
- **主な問題点**: 
  - ハードコードされた定数・スタイルが多い
  - 巨大なJSX（特にメニュー部分）
  - 17個のuseStateによる複雑なstate管理
  - 編集フォームのロジック重複

---

## 🎯 リファクタリング目標

1. **行数を50%削減**: 1,252行 → 600-700行
2. **再利用可能なコンポーネントの抽出**
3. **定数のライブラリ化**
4. **カスタムフックによるロジック分離**

---

## 📦 提案1: コンポーネントの切り出し（推定削減: 400行）

### 1.1 `ScheduleCardImage.tsx` - 画像表示部分
**対象行**: 696-742行（47行）
```typescript
interface ScheduleCardImageProps {
  photoUrl: string | null
  title: string
  cachedImage: CachedImageInfo | null
  imageLoading: boolean
  onImageError: (e: React.SyntheticEvent<HTMLImageElement>) => void
}
```
**効果**: 画像キャッシュロジックの分離、再利用性向上

---

### 1.2 `ScheduleCardMenu.tsx` - メニュー部分
**対象行**: 1064-1228行（164行）
```typescript
interface ScheduleCardMenuProps {
  isFirst: boolean
  isLast: boolean
  availableDays: Day[]
  currentDayId: string
  itineraryId: string
  hasReservation: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onMoveToDay: (dayId: string) => void
  onDuplicateToDay: (dayId: string) => void
  onReservation: () => void
  onDelete: () => void
}
```
**効果**: メニューロジックの分離、テスト容易性向上

---

### 1.3 `InlineTimeEditor.tsx` - 時間編集フォーム
**対象行**: 834-917行（83行）
```typescript
interface InlineTimeEditorProps {
  startTime: string
  endTime: string
  timezone: string
  onSave: (startTime: string, endTime: string, timezone: string) => Promise<void>
  onCancel: () => void
  isSaving: boolean
}
```
**効果**: 時間編集ロジックの再利用、バリデーション統一

---

### 1.4 `InlineCostEditor.tsx` - 費用編集フォーム
**対象行**: 918-974行（56行）
```typescript
interface InlineCostEditorProps {
  amount: number | undefined
  currency: string
  onSave: (amount: number | undefined, currency: string) => Promise<void>
  onCancel: () => void
  isSaving: boolean
}
```
**効果**: 費用編集ロジックの再利用

---

### 1.5 `TeardropMarker.tsx` - ティアドロップマーカー
**対象行**: 18-44行（スタイル）+ 684-690行（JSX）
```typescript
interface TeardropMarkerProps {
  number: number
  isSelected: boolean
  position?: 'left' | 'map'
}
```
**効果**: スタイルのコンポーネント化、ハードコード削減

---

### 1.6 `ScheduleInfoDisplay.tsx` - 時間・費用・予約の表示部分
**対象行**: 976-1031行（55行）
```typescript
interface ScheduleInfoDisplayProps {
  startTime: string
  endTime: string
  costAmount?: number
  costCurrency?: string
  hasReservation: boolean
  onTimeEdit: () => void
  onCostEdit: () => void
  onReservationEdit: () => void
}
```
**効果**: 表示ロジックの分離、レイアウト統一

---

## 📚 提案2: 定数・ユーティリティのライブラリ化（推定削減: 100行）

### 2.1 `lib/data/timezone-options.ts` - タイムゾーン選択肢
**対象**: 877-893行のハードコードされたタイムゾーンリスト
```typescript
export const TIMEZONE_OPTIONS = [
  { value: 'UTC', label: 'UTC', offset: 0 },
  { value: 'Asia/Tokyo', label: '日本 (Tokyo)', offset: 540 },
  { value: 'America/New_York', label: 'アメリカ (New York)', offset: -300 },
  // ... 他のタイムゾーン
] as const

export function getTimezoneOption(timezone: string) {
  return TIMEZONE_OPTIONS.find(opt => opt.value === timezone)
}

export function getPopularTimezones() {
  return TIMEZONE_OPTIONS.filter(/* 主要都市のみ */)
}
```

---

### 2.2 `components/common/TimezoneSelect.tsx` - タイムゾーン選択コンポーネント
```typescript
interface TimezoneSelectProps {
  value: string
  onChange: (timezone: string) => void
  className?: string
  disabled?: boolean
}

export function TimezoneSelect({ value, onChange, className, disabled }: TimezoneSelectProps) {
  return (
    <Select
      value={value}
      onChange={onChange}
      options={TIMEZONE_OPTIONS}
      className={className}
      disabled={disabled}
    />
  )
}
```
**効果**: タイムゾーン選択の統一化、他コンポーネントでも再利用可能

---

### 2.3 `components/common/CurrencySelect.tsx` - 通貨選択コンポーネント
```typescript
interface CurrencySelectProps {
  value: string
  onChange: (currency: string) => void
  className?: string
  disabled?: boolean
}

export function CurrencySelect({ value, onChange, className, disabled }: CurrencySelectProps) {
  const currencies = currencyUtils.getAvailableCurrencies()
  
  return (
    <Select
      value={value}
      onChange={onChange}
      options={currencies.map(c => ({ value: c.code, label: `${c.code} (${c.name})` }))}
      className={className}
      disabled={disabled}
    />
  )
}
```
**効果**: 通貨選択の統一化、既存のcurrencyUtilsを活用

---

## 🎣 提案3: カスタムフックによるロジック分離（推定削減: 150行）

### 3.1 `useItineraryEditor.ts` - 旅程編集ロジック
```typescript
export function useItineraryEditor(itinerary: Itinerary, onUpdate?: (updated: Itinerary) => void) {
  const [isSaving, setIsSaving] = useState(false)
  
  const updateField = async (field: string, value: any) => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/itineraries/${itinerary.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      })
      
      if (response.ok) {
        const updated = await response.json()
        onUpdate?.(updated)
        return { success: true, data: updated }
      }
      return { success: false, error: 'Update failed' }
    } catch (error) {
      return { success: false, error }
    } finally {
      setIsSaving(false)
    }
  }
  
  return { updateField, isSaving }
}
```
**効果**: 更新ロジックの統一、エラーハンドリングの一元化

---

### 3.2 `useInlineEditor.ts` - インライン編集ロジック
```typescript
export function useInlineEditor<T>(
  initialValue: T,
  onSave: (value: T) => Promise<void>
) {
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState(initialValue)
  const [tempValue, setTempValue] = useState(initialValue)
  
  const startEdit = () => {
    setTempValue(value)
    setIsEditing(true)
  }
  
  const saveEdit = async () => {
    await onSave(tempValue)
    setValue(tempValue)
    setIsEditing(false)
  }
  
  const cancelEdit = () => {
    setTempValue(value)
    setIsEditing(false)
  }
  
  return {
    isEditing,
    value,
    tempValue,
    setTempValue,
    startEdit,
    saveEdit,
    cancelEdit
  }
}
```
**効果**: タイトル、説明、時間、費用編集の統一化

---

### 3.3 `useScheduleCardImage.ts` - 画像キャッシュロジック
```typescript
export function useScheduleCardImage(placeData: PlaceData | undefined) {
  const [cachedImage, setCachedImage] = useState<CachedImageInfo | null>(null)
  const [imageLoading, setImageLoading] = useState(false)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  
  useEffect(() => {
    const loadImage = async () => {
      if (placeData?.photos && placeData.photos.length > 0) {
        const photoReference = placeData.photos[0].photo_reference
        const googlePhotoUrl = placesApiHelpers.getPhotoUrl(photoReference, 800)
        
        try {
          setImageLoading(true)
          const cachedImageResult = await getCachedPlaceImage(
            photoReference,
            googlePhotoUrl,
            { width: 800, height: 600, quality: 85 }
          )
          
          setCachedImage(cachedImageResult)
          setPhotoUrl(cachedImageResult.url)
        } catch (error) {
          logger.error('Failed to get cached image:', error)
          setPhotoUrl(googlePhotoUrl)
        } finally {
          setImageLoading(false)
        }
      } else {
        setPhotoUrl(null)
        setCachedImage(null)
      }
    }
    
    loadImage()
  }, [placeData?.photos])
  
  return { cachedImage, imageLoading, photoUrl }
}
```
**効果**: 画像キャッシュロジックの分離、テスト容易性向上

---

## 🔧 提案4: バリデーション・フォーマットのユーティリティ化

### 4.1 `lib/utils/time-validation.ts`
```typescript
export const timeValidation = {
  isValidTimeFormat: (time: string): boolean => {
    if (!time) return true
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    return timeRegex.test(time)
  },
  
  formatTimeForDisplay: (time: string): string => {
    if (!time) return '--:--'
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours, 10)
    return `${hour}:${minutes}`
  },
  
  parseTimeInput: (time: string): { hours: number; minutes: number } | null => {
    const match = time.match(/^(\d{1,2}):(\d{2})$/)
    if (!match) return null
    return { hours: parseInt(match[1]), minutes: parseInt(match[2]) }
  }
}
```

---

### 4.2 `lib/utils/amount-validation.ts`
```typescript
export const amountValidation = {
  isValidAmount: (amount: string): boolean => {
    if (!amount) return true
    const num = parseFloat(amount)
    return !isNaN(num) && num >= 0
  },
  
  parseAmount: (amount: string): number | undefined => {
    if (!amount) return undefined
    const num = parseFloat(amount)
    return isNaN(num) ? undefined : num
  }
}
```

---

## 📋 提案5: ScheduleCard.tsx のリファクタリング後の構造

```typescript
// components/trip/ScheduleCard.tsx (推定: 600-700行)

import { useItineraryEditor } from '@/hooks/useItineraryEditor'
import { useInlineEditor } from '@/hooks/useInlineEditor'
import { useScheduleCardImage } from '@/hooks/useScheduleCardImage'
import ScheduleCardImage from './ScheduleCardImage'
import ScheduleCardMenu from './ScheduleCardMenu'
import TeardropMarker from '../common/TeardropMarker'
import InlineTimeEditor from '../common/InlineTimeEditor'
import InlineCostEditor from '../common/InlineCostEditor'
import ScheduleInfoDisplay from './ScheduleInfoDisplay'
import TimezoneSelect from '../common/TimezoneSelect'
import CurrencySelect from '../common/CurrencySelect'

export default function ScheduleCard({ itinerary, ... }: ScheduleCardProps) {
  // カスタムフックでロジックを分離
  const { updateField, isSaving } = useItineraryEditor(itinerary, onUpdate)
  const { cachedImage, imageLoading, photoUrl } = useScheduleCardImage(itinerary.place_data)
  
  const titleEditor = useInlineEditor(itinerary.title || '', (value) => 
    updateField('title', value)
  )
  
  const descriptionEditor = useInlineEditor(itinerary.description || '', (value) => 
    updateField('description', value)
  )
  
  // ... 他のstate管理
  
  return (
    <div className="relative overflow-visible">
      <div className="flex items-start space-x-3">
        {/* ドラッグハンドル */}
        {dragHandleProps && <DragHandle {...dragHandleProps} isDragging={isDragging} />}
        
        {/* ティアドロップマーカー */}
        <TeardropMarker 
          number={displayNumber || itinerary.sort_number} 
          isSelected={isSelected} 
          position="left"
        />
        
        {/* カード本体 */}
        <div className={`flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${isSelected ? 'ring-2 ring-red-500' : ''}`}>
          <div className="flex">
            {/* 画像 */}
            <ScheduleCardImage
              photoUrl={photoUrl}
              title={itinerary.title}
              cachedImage={cachedImage}
              imageLoading={imageLoading}
              onImageError={handleImageError}
            />
            
            {/* メインコンテンツ */}
            <div className="flex-1 p-4 min-w-0">
              {/* タイトル編集 */}
              <InlineTextEditor
                value={titleEditor.value}
                isEditing={titleEditor.isEditing}
                onEdit={titleEditor.startEdit}
                onSave={titleEditor.saveEdit}
                onCancel={titleEditor.cancelEdit}
                className="font-semibold text-gray-900 text-lg"
              />
              
              {/* 説明編集 */}
              <InlineTextareaEditor
                value={descriptionEditor.value}
                isEditing={descriptionEditor.isEditing}
                onEdit={descriptionEditor.startEdit}
                onSave={descriptionEditor.saveEdit}
                onCancel={descriptionEditor.cancelEdit}
                placeholder="Memo: メモを追加してください"
              />
              
              {/* 時間・費用・予約情報 */}
              {isEditingTime ? (
                <InlineTimeEditor
                  startTime={tempStartTime}
                  endTime={tempEndTime}
                  timezone={destinationTimezone}
                  onSave={handleTimeSave}
                  onCancel={handleTimeCancel}
                  isSaving={isSaving}
                />
              ) : isEditingCost ? (
                <InlineCostEditor
                  amount={itinerary.cost_amount}
                  currency={itinerary.cost_currency || 'JPY'}
                  onSave={handleCostSave}
                  onCancel={handleCostCancel}
                  isSaving={isSaving}
                />
              ) : (
                <ScheduleInfoDisplay
                  startTime={startTime}
                  endTime={endTime}
                  costAmount={itinerary.cost_amount}
                  costCurrency={itinerary.cost_currency}
                  hasReservation={!!itinerary.reservation}
                  onTimeEdit={handleTimeEditStart}
                  onCostEdit={handleCostEditStart}
                  onReservationEdit={() => setShowReservationModal(true)}
                />
              )}
              
              {/* アクティビティタグ */}
              <ActivityTagSelector
                currentTag={itinerary.activity_tag}
                onTagChange={handleActivityTagChange}
              />
            </div>
            
            {/* メニュー */}
            <ScheduleCardMenu
              isFirst={isFirst}
              isLast={isLast}
              availableDays={availableDays}
              currentDayId={itinerary.day_id}
              itineraryId={itinerary.id}
              hasReservation={!!itinerary.reservation}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
              onMoveToDay={handleDaySelect}
              onDuplicateToDay={handleDuplicateSelect}
              onReservation={() => setShowReservationModal(true)}
              onDelete={handleDelete}
            />
          </div>
        </div>
      </div>
      
      {/* 予約情報モーダル */}
      <ReservationInfoModal
        isOpen={showReservationModal}
        onClose={() => setShowReservationModal(false)}
        onSave={handleReservationSave}
        initialReservation={itinerary.reservation}
        itineraryId={itinerary.id}
        itinerary={itinerary}
        day={availableDays.find(day => day.id === itinerary.day_id) || null}
      />
    </div>
  )
}
```

---

## 📊 推定削減効果

| カテゴリ | 削減行数 | 削減率 |
|---------|---------|--------|
| コンポーネント抽出 | 400行 | 32% |
| 定数・ライブラリ化 | 100行 | 8% |
| カスタムフック | 150行 | 12% |
| その他（重複削減等） | 50行 | 4% |
| **合計** | **700行** | **56%** |

**リファクタリング後**: 約550-600行（目標達成）

---

## 🚀 実装優先順位

### フェーズ1: 基盤整備（1-2日）
1. ✅ `lib/data/timezone-options.ts` - タイムゾーンオプション定義
2. ✅ `components/common/TimezoneSelect.tsx` - タイムゾーン選択コンポーネント
3. ✅ `components/common/CurrencySelect.tsx` - 通貨選択コンポーネント
4. ✅ `lib/utils/time-validation.ts` - 時間バリデーション
5. ✅ `lib/utils/amount-validation.ts` - 金額バリデーション

### フェーズ2: カスタムフック（2-3日）
1. ✅ `hooks/useItineraryEditor.ts` - 旅程編集ロジック
2. ✅ `hooks/useInlineEditor.ts` - インライン編集ロジック
3. ✅ `hooks/useScheduleCardImage.ts` - 画像キャッシュロジック

### フェーズ3: コンポーネント分離（3-4日）
1. ✅ `components/common/TeardropMarker.tsx` - マーカー
2. ✅ `components/trip/ScheduleCardImage.tsx` - 画像部分
3. ✅ `components/common/InlineTimeEditor.tsx` - 時間編集
4. ✅ `components/common/InlineCostEditor.tsx` - 費用編集
5. ✅ `components/trip/ScheduleInfoDisplay.tsx` - 情報表示
6. ✅ `components/trip/ScheduleCardMenu.tsx` - メニュー

### フェーズ4: ScheduleCard.tsx リファクタリング（2-3日）
1. ✅ カスタムフックへの移行
2. ✅ 新コンポーネントの統合
3. ✅ テスト・デバッグ

**総所要時間**: 8-12日

---

## ✅ 期待される効果

### 1. 保守性の向上
- ファイルサイズが半減し、理解しやすくなる
- 各コンポーネントの責務が明確になる

### 2. 再利用性の向上
- TimezoneSelect、CurrencySelectが他の画面でも使える
- InlineEditorパターンが他のフォームでも使える

### 3. テスト容易性の向上
- 小さなコンポーネント・フックは単体テストが書きやすい
- モック化が容易

### 4. パフォーマンスの向上
- 不必要な再レンダリングを防ぐ
- メモ化の適用が容易

---

## 🔍 注意点

1. **既存機能の維持**: リファクタリング中も既存機能は動作し続ける必要がある
2. **段階的な移行**: フェーズごとにテストし、問題があれば戻せるようにする
3. **型安全性の維持**: TypeScriptの型チェックを活用し、バグを未然に防ぐ
4. **z-index管理**: 既存のz-indexクラスシステムを使用する（`globals.css`）

---

## 📚 参考ドキュメント

- `AGENTS.md`: Slug生成、z-index管理、環境変数管理のガイドライン
- `docs/specifications/components-specifications.md`: コンポーネント仕様
- `components/common/icons/AGENTS.md`: アイコン使用ガイドライン

