# ScheduleCard.tsx クイックウィン施策

即座に実装可能で、大きな効果が期待できる施策をまとめます。

---

## ⚠️ 必読：実装前の重要な注意事項

実装を始める前に、以下のドキュメントを**必ず**確認してください：

### 📚 **`implementation-guide.md`を先に読むこと！**

現場でコケやすいポイントと対策が詳しく書かれています：

1. **状態の一貫性（同期／競合）** - AbortControllerの実装が必須
2. **型とAPIの互換性** - 段階的移行戦略
3. **レンダリング・パフォーマンス** - React.memo等の適切な使用
4. **タイムゾーンと通貨** - Luxon推奨、DST対応
5. **アクセシビリティ** - キーボード操作、ARIA属性

### ⚡ クイックチェック

- [ ] `implementation-guide.md`を読んだ
- [ ] 複数の同時更新による競合を理解した
- [ ] 楽観更新+ロールバックの必要性を理解した
- [ ] アクセシビリティの要件を理解した
- [ ] 小さいPRで段階的に進めることに同意した

---

## 🚀 フェーズ1: 即時実装可能（1-2時間）

### 1. タイムゾーン選択肢のライブラリ化

**削減行数**: 20行
**難易度**: ⭐️（簡単）

#### 作成ファイル: `lib/data/timezone-options.ts`

```typescript
export interface TimezoneOption {
  value: string
  label: string
  offset: number
  region: string
}

export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  { value: 'UTC', label: 'UTC', offset: 0, region: 'Global' },
  { value: 'Asia/Tokyo', label: '日本 (Tokyo)', offset: 540, region: 'Asia' },
  { value: 'America/New_York', label: 'アメリカ (New York)', offset: -300, region: 'Americas' },
  { value: 'America/Los_Angeles', label: 'アメリカ (Los Angeles)', offset: -480, region: 'Americas' },
  { value: 'Europe/London', label: 'イギリス (London)', offset: 0, region: 'Europe' },
  { value: 'Europe/Paris', label: 'フランス (Paris)', offset: 60, region: 'Europe' },
  { value: 'Asia/Seoul', label: '韓国 (Seoul)', offset: 540, region: 'Asia' },
  { value: 'Asia/Shanghai', label: '中国 (Shanghai)', offset: 480, region: 'Asia' },
  { value: 'Asia/Hong_Kong', label: '香港 (Hong Kong)', offset: 480, region: 'Asia' },
  { value: 'Asia/Singapore', label: 'シンガポール (Singapore)', offset: 480, region: 'Asia' },
  { value: 'Asia/Bangkok', label: 'タイ (Bangkok)', offset: 420, region: 'Asia' },
  { value: 'Asia/Kolkata', label: 'インド (Kolkata)', offset: 330, region: 'Asia' },
  { value: 'Australia/Sydney', label: 'オーストラリア (Sydney)', offset: 600, region: 'Oceania' },
  { value: 'Pacific/Honolulu', label: 'ハワイ (Honolulu)', offset: -600, region: 'Pacific' },
  { value: 'Pacific/Guam', label: 'グアム (Guam)', offset: 600, region: 'Pacific' },
  { value: 'Pacific/Saipan', label: 'サイパン (Saipan)', offset: 600, region: 'Pacific' },
] as const

export function getTimezoneOption(timezone: string): TimezoneOption | undefined {
  return TIMEZONE_OPTIONS.find(opt => opt.value === timezone)
}

export function getTimezonesByRegion(region: string): TimezoneOption[] {
  return TIMEZONE_OPTIONS.filter(opt => opt.region === region)
}

export function getPopularTimezones(): TimezoneOption[] {
  // 利用頻度の高いタイムゾーン
  return TIMEZONE_OPTIONS.filter(opt => 
    ['Asia/Tokyo', 'America/New_York', 'Europe/London', 'Asia/Seoul'].includes(opt.value)
  )
}
```

#### ScheduleCard.tsxでの使用方法

```diff
- <select value={destinationTimezone} onChange={(e) => {...}}>
-   <option value="UTC">UTC</option>
-   <option value="Asia/Tokyo">Asia/Tokyo (日本)</option>
-   ...17行のoption...
- </select>

+ import { TIMEZONE_OPTIONS } from '@/lib/data/timezone-options'
+
+ <select value={destinationTimezone} onChange={(e) => {...}}>
+   {TIMEZONE_OPTIONS.map(tz => (
+     <option key={tz.value} value={tz.value}>{tz.label}</option>
+   ))}
+ </select>
```

**効果**: 
- ScheduleCard.tsx: 17行削減
- 他のコンポーネントでも再利用可能
- 今後のタイムゾーン追加が容易

---

### 2. バリデーション関数のユーティリティ化

**削減行数**: 10行
**難易度**: ⭐️（簡単）

#### 作成ファイル: `lib/utils/time-validation.ts`

```typescript
/**
 * 時間フォーマットのバリデーション
 * @param time HH:MM形式の時間文字列
 * @returns バリデーション結果
 */
export function isValidTimeFormat(time: string): boolean {
  if (!time) return true // 空の場合は有効
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  return timeRegex.test(time)
}

/**
 * 時間を表示用にフォーマット（08:00 → 8:00）
 * @param time HH:MM形式の時間文字列
 * @returns フォーマットされた時間文字列
 */
export function formatTimeForDisplay(time: string): string {
  if (!time) return '--:--'
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours, 10)
  return `${hour}:${minutes}`
}

/**
 * 時間文字列をパース
 * @param time HH:MM形式の時間文字列
 * @returns パース結果 { hours, minutes } または null
 */
export function parseTimeInput(time: string): { hours: number; minutes: number } | null {
  const match = time.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return null
  return { 
    hours: parseInt(match[1]), 
    minutes: parseInt(match[2]) 
  }
}

/**
 * 2つの時間の大小比較
 * @param time1 HH:MM形式の時間文字列
 * @param time2 HH:MM形式の時間文字列
 * @returns time1 < time2 の場合 true
 */
export function isTimeBefore(time1: string, time2: string): boolean {
  const parsed1 = parseTimeInput(time1)
  const parsed2 = parseTimeInput(time2)
  
  if (!parsed1 || !parsed2) return false
  
  return (parsed1.hours * 60 + parsed1.minutes) < (parsed2.hours * 60 + parsed2.minutes)
}
```

#### 作成ファイル: `lib/utils/amount-validation.ts`

```typescript
/**
 * 金額のバリデーション
 * @param amount 金額文字列
 * @returns バリデーション結果
 */
export function isValidAmount(amount: string): boolean {
  if (!amount) return true // 空の場合は有効
  const num = parseFloat(amount)
  return !isNaN(num) && num >= 0
}

/**
 * 金額文字列を数値に変換
 * @param amount 金額文字列
 * @returns 数値またはundefined
 */
export function parseAmount(amount: string): number | undefined {
  if (!amount) return undefined
  const num = parseFloat(amount)
  return isNaN(num) ? undefined : num
}

/**
 * 金額のフォーマット（カンマ区切り）
 * @param amount 金額
 * @param decimals 小数点以下の桁数（デフォルト: 0）
 * @returns フォーマットされた金額文字列
 */
export function formatAmountNumber(amount: number, decimals: number = 0): string {
  return amount.toLocaleString('ja-JP', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}
```

#### ScheduleCard.tsxでの使用方法

```diff
+ import { isValidTimeFormat, formatTimeForDisplay } from '@/lib/utils/time-validation'
+ import { isValidAmount, parseAmount } from '@/lib/utils/amount-validation'

- // 時間フォーマットのバリデーション
- const isValidTimeFormat = (time: string) => {
-   if (!time) return true
-   const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
-   return timeRegex.test(time)
- }

- // 数値のバリデーション
- const isValidAmount = (amount: string) => {
-   if (!amount) return true
-   const num = parseFloat(amount)
-   return !isNaN(num) && num >= 0
- }

- // 時刻フォーマットを一般ユーザー向けに変更（08:00 → 8:00）
- const formatTimeForDisplay = (time: string): string => {
-   if (!time) return '--:--'
-   const [hours, minutes] = time.split(':')
-   const hour = parseInt(hours, 10)
-   return `${hour}:${minutes}`
- }
```

**効果**: 
- ScheduleCard.tsx: 18行削減
- 他のコンポーネントでも再利用可能
- 単体テストが書きやすい

---

### 3. ティアドロップスタイルのCSS化

**削減行数**: 26行
**難易度**: ⭐️（簡単）

#### `app/globals.css`に追加

```css
/* ティアドロップ形状のマーカー（左ペイン用） */
.teardrop-marker-left {
  width: 30px;
  height: 30px;
  position: relative;
  background-color: #3B82F6;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.4);
  transition: all 0.2s ease;
}

.teardrop-marker-left.selected {
  background-color: #EF4444;
  transform: rotate(-45deg) scale(1.1);
  box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.6);
}

.teardrop-label-left {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(45deg);
  color: white;
  font-weight: bold;
  font-size: 12px;
  pointer-events: none;
}
```

#### ScheduleCard.tsxでの使用方法

```diff
- // ティアドロップ形状のマーカースタイル（左ペイン用）
- const teardropStyles = `
-   .teardrop-marker-left {
-     ...26行のCSS...
-   }
- `

- // CSSスタイルをDOMに追加
- useEffect(() => {
-   const styleElement = document.createElement('style')
-   styleElement.textContent = teardropStyles
-   document.head.appendChild(styleElement)
-   
-   return () => {
-     if (document.head.contains(styleElement)) {
-       document.head.removeChild(styleElement)
-     }
-   }
- }, [])

+ // スタイルはglobals.cssで定義済み
```

**効果**: 
- ScheduleCard.tsx: 38行削減（スタイル定義26行 + useEffect 12行）
- パフォーマンス向上（毎回DOMに追加しない）
- CSSの一元管理

---

## 📊 フェーズ1の合計効果

| 施策 | 削減行数 | 所要時間 |
|------|---------|---------|
| タイムゾーン選択肢 | 17行 | 30分 |
| バリデーション関数 | 18行 | 30分 |
| ティアドロップCSS | 38行 | 30分 |
| **合計** | **73行（6%削減）** | **1.5時間** |

**リファクタリング後**: 1,252行 → 1,179行

---

## 🎯 フェーズ2: 低リスク・高効果（2-3時間）

### 4. useClickOutsideカスタムフック

**削減行数**: 25行
**難易度**: ⭐️⭐️（普通）

#### 作成ファイル: `hooks/useClickOutside.ts`

```typescript
import { useEffect, RefObject } from 'react'

/**
 * 要素外のクリックを検知するカスタムフック
 * @param ref 監視対象の要素のRef
 * @param handler 要素外がクリックされた時のハンドラー
 * @param enabled フックを有効にするかどうか（デフォルト: true）
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T>,
  handler: (event: MouseEvent) => void,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return

    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler(event)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [ref, handler, enabled])
}
```

#### ScheduleCard.tsxでの使用方法

```diff
+ import { useClickOutside } from '@/hooks/useClickOutside'

- // メニューの外側クリックで閉じる
- useEffect(() => {
-   const handleClickOutside = (event: MouseEvent) => {
-     if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
-       setShowMenu(false)
-       setShowDaySelector(false)
-       setShowDuplicateSelector(false)
-     }
-   }
-
-   document.addEventListener('mousedown', handleClickOutside)
-   return () => {
-     document.removeEventListener('mousedown', handleClickOutside)
-   }
- }, [])

+ useClickOutside(menuRef, () => {
+   setShowMenu(false)
+   setShowDaySelector(false)
+   setShowDuplicateSelector(false)
+ })
```

**効果**: 
- ScheduleCard.tsx: 13行削減
- 他のメニュー・モーダルでも再利用可能

---

### 5. DragHandleコンポーネント

**削減行数**: 10行
**難易度**: ⭐️⭐️（普通）

#### 作成ファイル: `components/common/DragHandle.tsx`

```typescript
interface DragHandleProps {
  attributes?: any
  listeners?: any
  isDragging?: boolean
  className?: string
}

export function DragHandle({ attributes, listeners, isDragging = false, className = '' }: DragHandleProps) {
  return (
    <div 
      {...attributes}
      {...listeners}
      className={`p-1 cursor-grab active:cursor-grabbing hover:bg-gray-100 rounded transition-colors mt-4 ${isDragging ? 'opacity-50' : ''} ${className}`}
      title="ドラッグして順序を変更"
    >
      <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
        <path d="M7 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM7 8a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM7 14a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM13 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM13 8a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM13 14a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" />
      </svg>
    </div>
  )
}
```

#### ScheduleCard.tsxでの使用方法

```diff
+ import { DragHandle } from '@/components/common/DragHandle'

- {/* ドラッグハンドル（アイコンのみ） */}
- {dragHandleProps && (
-   <div 
-     {...dragHandleProps.attributes}
-     {...dragHandleProps.listeners}
-     className={`p-1 cursor-grab active:cursor-grabbing hover:bg-gray-100 rounded transition-colors mt-4 ${isDragging ? 'opacity-50' : ''}`}
-     title="ドラッグして順序を変更"
-   >
-     <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
-       <path d="..." />
-     </svg>
-   </div>
- )}

+ {dragHandleProps && (
+   <DragHandle {...dragHandleProps} isDragging={isDragging} />
+ )}
```

---

### 6. TeardropMarkerコンポーネント

**削減行数**: 5行
**難易度**: ⭐️⭐️（普通）

#### 作成ファイル: `components/common/TeardropMarker.tsx`

```typescript
interface TeardropMarkerProps {
  number: number
  isSelected?: boolean
  position?: 'left' | 'map'
  className?: string
}

export function TeardropMarker({ 
  number, 
  isSelected = false, 
  position = 'left',
  className = '' 
}: TeardropMarkerProps) {
  const markerClass = position === 'left' ? 'teardrop-marker-left' : 'teardrop-marker-map'
  const labelClass = position === 'left' ? 'teardrop-label-left' : 'teardrop-label-map'
  
  return (
    <div className={`relative mt-3 ${className}`}>
      <div className={`${markerClass} ${isSelected ? 'selected' : ''}`}>
        <div className={labelClass}>
          {number}
        </div>
      </div>
    </div>
  )
}
```

#### ScheduleCard.tsxでの使用方法

```diff
+ import { TeardropMarker } from '@/components/common/TeardropMarker'

- {/* ソート番号（ティアドロップ形状） */}
- <div className="relative mt-3">
-   <div className={`teardrop-marker-left ${isSelected ? 'selected' : ''}`}>
-     <div className="teardrop-label-left">
-       {displayNumber || itinerary.sort_number}
-     </div>
-   </div>
- </div>

+ <TeardropMarker 
+   number={displayNumber || itinerary.sort_number} 
+   isSelected={isSelected} 
+ />
```

---

## 📊 フェーズ2の合計効果

| 施策 | 削減行数 | 所要時間 |
|------|---------|---------|
| useClickOutside | 13行 | 1時間 |
| DragHandle | 10行 | 45分 |
| TeardropMarker | 5行 | 45分 |
| **合計** | **28行（2%削減）** | **2.5時間** |

**リファクタリング後**: 1,179行 → 1,151行

---

## ⚠️ フェーズ1+2の実装時の注意点

### 状態管理の注意
- **useClickOutside**を導入する際、既存のuseEffectとの競合に注意
- メニューの開閉状態が複数箇所で管理されていないか確認

### パフォーマンスの注意
- **TimezoneSelect**と**CurrencySelect**はReact.memoで包む
- ドロップダウンの選択肢が多い場合は仮想スクロール（react-window）を検討

### アクセシビリティの注意
- **DragHandle**にaria-label="ドラッグして順序を変更"を追加
- **TeardropMarker**は装飾的な要素なのでaria-hidden="true"を検討

### テストの注意
- バリデーション関数は必ずユニットテスト追加
- タイムゾーン選択肢は正しいオフセットか確認（特にDST対応）

---

## 🎉 フェーズ1+2の合計効果

| 項目 | 値 |
|------|-----|
| 削減行数 | **101行（8%削減）** |
| 所要時間 | **4時間** |
| リファクタリング後 | **1,151行** |

---

## ✅ 次のステップ（フェーズ3以降）

これらの「クイックウィン」を実装後、以下の大型リファクタリングに進みます：

1. **ScheduleCardMenuの分離** (160行削減)
2. **InlineTimeEditorの分離** (80行削減)
3. **InlineCostEditorの分離** (55行削減)
4. **ScheduleCardImageの分離** (45行削減)
5. **カスタムフック（useItineraryEditor等）** (150行削減)

最終目標: **550-600行（56%削減）**

---

## 📝 実装チェックリスト

### フェーズ1
- [ ] `lib/data/timezone-options.ts` 作成
- [ ] `lib/utils/time-validation.ts` 作成
- [ ] `lib/utils/amount-validation.ts` 作成
- [ ] `app/globals.css` にティアドロップスタイル追加
- [ ] ScheduleCard.tsx で上記を使用するように修正
- [ ] 動作確認

### フェーズ2
- [ ] `hooks/useClickOutside.ts` 作成
- [ ] `components/common/DragHandle.tsx` 作成
- [ ] `components/common/TeardropMarker.tsx` 作成
- [ ] ScheduleCard.tsx で上記を使用するように修正
- [ ] 動作確認

### テスト項目
- [ ] タイムゾーン選択が正常に動作する
- [ ] 時間フォーマットのバリデーションが動作する
- [ ] 金額のバリデーションが動作する
- [ ] ティアドロップマーカーの表示が正しい
- [ ] メニューの外側クリックで閉じる
- [ ] ドラッグ操作が正常に動作する

