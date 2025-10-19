# 再利用可能性の分析 - ScheduleCard リファクタリングの副産物

**作成日**: 2025年10月19日

---

## 📦 作成した再利用可能なアセット

フェーズ1-3で作成した9個のコンポーネント/フック/ユーティリティを他のファイルでも活用できます。

---

## 🎯 すぐに適用できる箇所

### 1. **useClickOutside** - メニュー外クリック検知

#### 現在の適用箇所
- ✅ `components/trip/ScheduleCard.tsx` (削除済み)
- ✅ `components/trip/ScheduleCardMenu.tsx` (新規使用)

#### 適用可能な箇所（2ファイル）

##### 📄 `components/common/PlaceSearchInput.tsx`
**現状**: 40-50行目に手動実装
```typescript
// 外部クリックで検索結果を閉じる
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (resultsRef.current && !resultsRef.current.contains(event.target as Node) &&
        inputRef.current && !inputRef.current.contains(event.target as Node)) {
      setShowResults(false)
    }
  }
  document.addEventListener('mousedown', handleClickOutside)
  return () => document.removeEventListener('mousedown', handleClickOutside)
}, [])
```

**改善案**:
```typescript
import { useClickOutside } from '@/hooks/useClickOutside'

// 複数refに対応する場合は、containerRefで囲む
const containerRef = useRef<HTMLDivElement>(null)
useClickOutside(containerRef, () => setShowResults(false))
```

**削減見込み**: 10行  
**難易度**: ⭐️（簡単）

---

##### 📄 `components/common/HomeHeader.tsx`
**現状**: 30-38行目に手動実装
```typescript
useEffect(() => {
  const handler = (e: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
      setOpen(false)
    }
  }
  document.addEventListener('click', handler)
  return () => document.removeEventListener('click', handler)
}, [])
```

**改善案**:
```typescript
import { useClickOutside } from '@/hooks/useClickOutside'

useClickOutside(menuRef, () => setOpen(false))
```

**削減見込み**: 8行  
**難易度**: ⭐️（簡単）

---

### 2. **時間/金額バリデーション** - フォームバリデーション

#### 現在の適用箇所
- ✅ `components/trip/ScheduleCard.tsx` (適用済み)

#### 適用可能な箇所

##### 📄 時間入力があるすべてのフォーム
**検証**: プロジェクト内で`type="time"`を使用しているのは現在`ScheduleCard.tsx`のみ

##### 📄 金額入力があるフォーム
**検証**: プロジェクト内で`type="number"`を使用しているのは現在`ScheduleCard.tsx`のみ

**今後の新規フォーム**で即座に使える準備が整った状態

---

### 3. **TIMEZONE_OPTIONS** - タイムゾーン選択

#### 現在の適用箇所
- ✅ `components/trip/ScheduleCard.tsx` (適用済み)

#### 適用可能な箇所

##### 📄 他のタイムゾーン選択が必要な画面
**検証**: 現在タイムゾーン選択を持つのは`ScheduleCard.tsx`のみ

**将来的な適用箇所**:
- 旅行作成時のデフォルトタイムゾーン設定
- ユーザー設定でのタイムゾーン選択
- Day単位でのタイムゾーン設定

---

### 4. **useItineraryEditor** - 更新管理パターン

#### 現在の適用箇所
- ✅ `components/trip/ScheduleCard.tsx` (適用済み)

#### 適用可能な箇所（9ファイル）

useItineraryEditorのパターンは汎用化すれば様々なエンティティに適用可能：

##### 📄 `components/modals/POIDialog.tsx` (808行)
**機会**: PlaceData の更新ロジック  
**削減見込み**: 50-80行  
**汎用フック名**: `useEntityEditor<T>`

##### 📄 `components/common/CreateTripDialog.tsx` (470行)
**機会**: Trip作成時のAPI呼び出し  
**削減見込み**: 30-50行  
**汎用フック名**: `useEntityCreator<T>`

##### 📄 `components/trip/TripEditor.tsx`
**機会**: Trip更新ロジック  
**削減見込み**: 50-100行  
**汎用フック名**: `useTripEditor` (useItineraryEditorのパターンを流用)

##### 📄 `components/trip/DayEditor.tsx`
**機会**: Day更新ロジック  
**削減見込み**: 30-50行  
**汎用フック名**: `useDayEditor`

##### 📄 `components/modals/UserSettingsModal.tsx`
**機会**: ユーザー設定の更新ロジック  
**削減見込み**: 40-60行  
**汎用フック名**: `useUserSettingsEditor`

##### 📄 `components/trip/TripChecklistView.tsx`
**機会**: チェックリスト項目の更新  
**削減見込み**: 30-40行  
**汎用フック名**: `useChecklistEditor`

##### 📄 `components/modals/ChecklistPresetModal.tsx`
**機会**: プリセットの更新/作成  
**削減見込み**: 20-30行

##### 📄 `components/modals/PresetLibraryModal.tsx`
**機会**: プリセットライブラリの管理  
**削減見込み**: 20-30行

##### 📄 `components/ui/StorageUsageDisplay.tsx`
**機会**: ストレージデータの更新  
**削減見込み**: 10-20行

**合計削減見込み**: 約280-460行

---

### 5. **getZIndexClass** の統一使用

#### 現在の使用状況
- ✅ 多くのコンポーネントで既に使用されている

#### ハードコードされたz-indexの残存確認
```typescript
// components/trip/ScheduleCardMenu.tsx: 151行
className="absolute left-full top-0 ml-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-[10000]"
```

**改善案**: `z-[10000]` → `zidx-popup-menu-content` または `zidx-dialog-popup`

**適用箇所**: カスケードメニューの2箇所  
**削減効果**: 可読性向上、z-index管理の一元化

---

## 🚀 汎用化の提案

### **useEntityEditor<T>** - 汎用更新フック

useItineraryEditorを汎用化して、あらゆるエンティティの更新に使える：

```typescript
// hooks/useEntityEditor.ts
export function useEntityEditor<T extends { id: string }>(
  entity: T,
  apiPath: string,
  onUpdate?: (updated: T) => void
) {
  const [isSaving, setIsSaving] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const previousDataRef = useRef<T>(entity)
  
  const updateField = useCallback(async (
    field: keyof T, 
    value: any,
    options: { optimistic?: boolean } = {}
  ): Promise<UpdateResult> => {
    // ... useItineraryEditorと同じロジック
    // apiPathを動的に使用
    const response = await fetch(`/api/${apiPath}/${entity.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
      signal: abortController.signal
    })
    // ...
  }, [entity, apiPath, onUpdate])
  
  return { updateField, updateFields, isSaving, lastError }
}

// 使用例
const { updateField } = useEntityEditor(trip, 'trips', onTripUpdate)
const { updateField } = useEntityEditor(day, 'days', onDayUpdate)
const { updateField } = useEntityEditor(user, 'users', onUserUpdate)
```

**適用可能なエンティティ**:
- Trip (旅行)
- Day (日程)
- Itinerary (旅程) ← 既に実装済み
- User (ユーザー)
- Checklist (チェックリスト)
- ChecklistItem (チェックリスト項目)

**削減見込み**: 約300-500行（プロジェクト全体）

---

## 📋 優先順位付きアクションリスト

### 🔴 最優先（即効性が高い）

| 箇所 | 適用内容 | 削減見込み | 難易度 | 所要時間 |
|------|---------|----------|--------|---------|
| **PlaceSearchInput** | useClickOutside | 10行 | ⭐️ | 15分 |
| **HomeHeader** | useClickOutside | 8行 | ⭐️ | 15分 |
| **ScheduleCardMenu** | z-index統一 | 可読性向上 | ⭐️ | 10分 |

**合計**: 18行削減、40分

---

### 🟡 高優先度（効果が大きい）

| 箇所 | 適用内容 | 削減見込み | 難易度 | 所要時間 |
|------|---------|----------|--------|---------|
| **POIDialog** | useEntityEditor | 50-80行 | ⭐️⭐️⭐️ | 2-3時間 |
| **CreateTripDialog** | useEntityCreator | 30-50行 | ⭐️⭐️⭐️ | 2時間 |
| **TripEditor** | useTripEditor | 50-100行 | ⭐️⭐️⭐️ | 3時間 |
| **DayEditor** | useDayEditor | 30-50行 | ⭐️⭐️ | 2時間 |

**合計**: 160-280行削減、9-10時間

---

### 🟢 中優先度（将来的な保険）

| 箇所 | 適用内容 | 削減見込み | 難易度 | 所要時間 |
|------|---------|----------|--------|---------|
| **UserSettingsModal** | useUserSettingsEditor | 40-60行 | ⭐️⭐️ | 2時間 |
| **TripChecklistView** | useChecklistEditor | 30-40行 | ⭐️⭐️ | 2時間 |
| **ChecklistPresetModal** | usePresetEditor | 20-30行 | ⭐️⭐️ | 1.5時間 |
| **PresetLibraryModal** | usePresetEditor | 20-30行 | ⭐️⭐️ | 1.5時間 |

**合計**: 110-160行削減、7時間

---

## 🎯 推奨される実施順序

### ステップ1: クイックウィン（40分）
1. PlaceSearchInputにuseClickOutside適用
2. HomeHeaderにuseClickOutside適用
3. ScheduleCardMenuのz-index統一

**効果**: 18行削減 + 可読性向上

---

### ステップ2: 汎用化（1-2日）
1. `useEntityEditor<T>` を作成
2. 型定義を整理
3. ドキュメント作成

**効果**: 将来的な開発効率向上

---

### ステップ3: 段階的適用（1週間）
1. POIDialogに適用
2. CreateTripDialogに適用
3. TripEditor/DayEditorに適用
4. その他のモーダルに適用

**効果**: 270-440行削減

---

## 📊 推定削減効果（プロジェクト全体）

| カテゴリ | 削減見込み |
|---------|----------|
| クイックウィン | 18行 |
| 高優先度適用 | 160-280行 |
| 中優先度適用 | 110-160行 |
| **合計** | **288-458行** |

**ScheduleCardリファクタリングで削減した614行に加えて、さらに300-450行の削減が可能！**

---

## 💡 具体的な適用例

### Example 1: PlaceSearchInput に useClickOutside を適用

#### Before (10行)
```typescript
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (resultsRef.current && !resultsRef.current.contains(event.target as Node) &&
        inputRef.current && !inputRef.current.contains(event.target as Node)) {
      setShowResults(false)
    }
  }
  document.addEventListener('mousedown', handleClickOutside)
  return () => document.removeEventListener('mousedown', handleClickOutside)
}, [])
```

#### After (5行)
```typescript
import { useClickOutside } from '@/hooks/useClickOutside'

const containerRef = useRef<HTMLDivElement>(null)
useClickOutside(containerRef, () => setShowResults(false))
// containerRefで全体を囲む
```

---

### Example 2: POIDialog に useEntityEditor を適用

#### Before (推定 50-80行)
```typescript
const handleSave = async () => {
  setIsSaving(true)
  try {
    const response = await fetch(`/api/places/${place.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, ... })
    })
    if (response.ok) {
      const updated = await response.json()
      onUpdate(updated)
    } else {
      // エラーハンドリング
    }
  } catch (error) {
    // エラーハンドリング
  } finally {
    setIsSaving(false)
  }
}
```

#### After (推定 5-10行)
```typescript
import { useEntityEditor } from '@/hooks/useEntityEditor'

const { updateField, updateFields, isSaving } = useEntityEditor(place, 'places', onUpdate)

const handleSave = async () => {
  await updateFields({ title, description, ... }, { optimistic: true })
}
```

---

### Example 3: 汎用的な useEntityEditor の実装

```typescript
// hooks/useEntityEditor.ts
export function useEntityEditor<T extends { id: string }>(
  entity: T,
  apiPath: string,
  onUpdate?: (updated: T) => void,
  options?: {
    idField?: string  // デフォルト: 'id'
    method?: 'PUT' | 'PATCH'  // デフォルト: 'PUT'
  }
) {
  const idField = options?.idField || 'id'
  const method = options?.method || 'PUT'
  
  const updateField = useCallback(async (
    field: keyof T, 
    value: any,
    updateOptions: { optimistic?: boolean } = {}
  ): Promise<UpdateResult> => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    const abortController = new AbortController()
    abortControllerRef.current = abortController
    
    if (updateOptions.optimistic) {
      const optimisticData = { ...entity, [field]: value }
      onUpdate?.(optimisticData)
    }
    
    previousDataRef.current = entity
    setIsSaving(true)
    setLastError(null)
    
    try {
      const response = await fetch(`/api/${apiPath}/${entity[idField as keyof T]}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
        signal: abortController.signal
      })
      
      if (!response.ok) {
        throw new Error(`Update failed: ${response.status}`)
      }
      
      const updated = await response.json()
      onUpdate?.(updated)
      
      return { success: true, data: updated }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return { success: false, error: 'aborted' }
      }
      
      if (updateOptions.optimistic) {
        onUpdate?.(previousDataRef.current)
      }
      
      const errorMessage = error.message || 'Update failed'
      setLastError(errorMessage)
      logger.error('Update error:', error)
      
      return { success: false, error: errorMessage }
    } finally {
      setIsSaving(false)
      abortControllerRef.current = null
    }
  }, [entity, apiPath, onUpdate, idField, method])
  
  // updateFields も同様に実装...
  
  return { updateField, updateFields, isSaving, lastError }
}
```

**使用例**:
```typescript
// Trip編集
const { updateField } = useEntityEditor(trip, 'trips', onTripUpdate)
await updateField('title', newTitle, { optimistic: true })

// Day編集
const { updateField } = useEntityEditor(day, 'days', onDayUpdate)
await updateField('date', newDate)

// User設定
const { updateField } = useEntityEditor(user, 'users', onUserUpdate)
await updateField('displayName', newName)
```

---

## 🎨 新規コンポーネントの提案

### TimezoneSelect コンポーネント

現在、タイムゾーン選択は以下のように毎回書いている：
```typescript
<select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
  {TIMEZONE_OPTIONS.map((tz) => (
    <option key={tz.value} value={tz.value}>{tz.label}</option>
  ))}
</select>
```

**提案**: 再利用可能なコンポーネント化
```typescript
// components/common/TimezoneSelect.tsx
import { TIMEZONE_OPTIONS } from '@/lib/data/timezone-options'
import { Select } from './Select'

interface TimezoneSelectProps {
  value: string
  onChange: (timezone: string) => void
  className?: string
  disabled?: boolean
  label?: string
}

export function TimezoneSelect({ value, onChange, className, disabled, label }: TimezoneSelectProps) {
  return (
    <Select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
      disabled={disabled}
      label={label}
      options={TIMEZONE_OPTIONS.map(tz => ({ value: tz.value, label: tz.label }))}
    />
  )
}
```

**使用例**:
```typescript
<TimezoneSelect 
  value={destinationTimezone} 
  onChange={setDestinationTimezone}
  label="タイムゾーン"
/>
```

---

### CurrencySelect コンポーネント

```typescript
// components/common/CurrencySelect.tsx
import { currencyUtils } from '@/lib/utils/currency'
import { Select } from './Select'

interface CurrencySelectProps {
  value: string
  onChange: (currency: string) => void
  className?: string
  disabled?: boolean
  label?: string
}

export function CurrencySelect({ value, onChange, className, disabled, label }: CurrencySelectProps) {
  const currencies = currencyUtils.getAvailableCurrencies()
  
  return (
    <Select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
      disabled={disabled}
      label={label}
      options={currencies.map(c => ({ 
        value: c.code, 
        label: `${c.code} (${c.name})` 
      }))}
    />
  )
}
```

---

## 📊 実装ロードマップ

### フェーズ4-A: クイックウィン（40分）
- [ ] PlaceSearchInputにuseClickOutside適用
- [ ] HomeHeaderにuseClickOutside適用
- [ ] ScheduleCardMenuのz-index統一

**削減**: 18行 + 可読性向上

---

### フェーズ4-B: 汎用コンポーネント作成（2時間）
- [ ] TimezoneSelectコンポーネント
- [ ] CurrencySelectコンポーネント
- [ ] useEntityEditor<T>汎用フック

**効果**: 将来の開発効率大幅向上

---

### フェーズ4-C: 大型コンポーネントへの適用（1週間）
- [ ] POIDialogにuseEntityEditor適用
- [ ] CreateTripDialogに適用
- [ ] TripEditor/DayEditorに適用
- [ ] モーダル類に適用

**削減**: 270-440行

---

## ✅ 期待される効果

### コード削減
- **即座に削減**: 18行
- **将来的な削減**: 270-440行
- **ScheduleCardと合計**: 約900-1,050行の削減

### 開発効率向上
- 新規フォーム作成時間を50%削減
- バグの発生率を減少（統一されたロジック）
- テストの再利用が可能

### 保守性向上
- パターンの統一
- エラーハンドリングの一貫性
- アクセシビリティの標準化

---

## 🚨 注意点

### useEntityEditor の汎用化
- **型安全性**: ジェネリクスで型を厳密に
- **APIパスの統一**: REST APIの規約に従う
- **エラーハンドリング**: 各エンティティで適切なエラーメッセージ

### 段階的な適用
- 一度に全てを変更しない
- 1ファイルずつ、小さいPRで
- 各段階でテストを実施

---

## 📝 次のアクション

1. **即座に実施**: PlaceSearchInput、HomeHeaderにuseClickOutside適用（PR作成）
2. **検討**: useEntityEditor<T>の汎用化（設計レビュー）
3. **計画**: 大型コンポーネントへの適用スケジュール

**詳細は このドキュメントを基に実装計画を立ててください。**

---

**作成者**: AI Assistant  
**ステータス**: 調査完了、実装待ち

