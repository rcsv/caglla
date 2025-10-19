# ScheduleCard.tsx リファクタリング実装ガイド

**現場でコケないための実践的な実装ガイド**

---

## 🚨 最重要：現場でコケやすいポイントと対策

### 1. 状態の一貫性（同期／競合） ⚠️ 最優先

#### 問題
複数のカスタムフック / コンポーネントが同じitineraryオブジェクトを更新すると競合が起きる。

#### 対策

**useItineraryEditorの実装（AbortController組み込み）**

```typescript
// hooks/useItineraryEditor.ts
import { useState, useRef, useCallback } from 'react'
import { Itinerary } from '@/lib/core/types'
import logger from '@/lib/core/logger'

interface UpdateResult<T = any> {
  success: boolean
  data?: T
  error?: string
}

export function useItineraryEditor(
  itinerary: Itinerary, 
  onUpdate?: (updated: Itinerary) => void
) {
  const [isSaving, setIsSaving] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)
  
  // 現在進行中のリクエストを管理
  const abortControllerRef = useRef<AbortController | null>(null)
  
  // 楽観更新のためのロールバック用データ
  const previousDataRef = useRef<Itinerary>(itinerary)
  
  const updateField = useCallback(async (
    field: string, 
    value: any,
    options: { optimistic?: boolean } = {}
  ): Promise<UpdateResult> => {
    // 既存のリクエストをキャンセル
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      logger.debug('Previous request aborted')
    }
    
    // 新しいAbortControllerを作成
    const abortController = new AbortController()
    abortControllerRef.current = abortController
    
    // 楽観更新の場合は即座にUIを更新
    if (options.optimistic) {
      const optimisticData = { ...itinerary, [field]: value }
      onUpdate?.(optimisticData)
    }
    
    // 現在の状態を保存（ロールバック用）
    previousDataRef.current = itinerary
    
    setIsSaving(true)
    setLastError(null)
    
    try {
      const response = await fetch(`/api/itineraries/${itinerary.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
        signal: abortController.signal
      })
      
      if (!response.ok) {
        throw new Error(`Update failed: ${response.status}`)
      }
      
      const updated = await response.json()
      
      // 成功時は最新データで更新
      onUpdate?.(updated)
      
      return { success: true, data: updated }
    } catch (error: any) {
      // AbortErrorは無視
      if (error.name === 'AbortError') {
        logger.debug('Request was aborted')
        return { success: false, error: 'aborted' }
      }
      
      // エラー時はロールバック
      if (options.optimistic) {
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
  }, [itinerary, onUpdate])
  
  // 複数フィールドの一括更新
  const updateFields = useCallback(async (
    updates: Record<string, any>,
    options: { optimistic?: boolean } = {}
  ): Promise<UpdateResult> => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    const abortController = new AbortController()
    abortControllerRef.current = abortController
    
    if (options.optimistic) {
      const optimisticData = { ...itinerary, ...updates }
      onUpdate?.(optimisticData)
    }
    
    previousDataRef.current = itinerary
    
    setIsSaving(true)
    setLastError(null)
    
    try {
      const response = await fetch(`/api/itineraries/${itinerary.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
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
      
      if (options.optimistic) {
        onUpdate?.(previousDataRef.current)
      }
      
      const errorMessage = error.message || 'Update failed'
      setLastError(errorMessage)
      logger.error('Batch update error:', error)
      
      return { success: false, error: errorMessage }
    } finally {
      setIsSaving(false)
      abortControllerRef.current = null
    }
  }, [itinerary, onUpdate])
  
  // クリーンアップ
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [])
  
  return { 
    updateField, 
    updateFields,
    cleanup,
    isSaving, 
    lastError 
  }
}
```

**使用例：楽観更新付き**

```typescript
const { updateField, isSaving, lastError } = useItineraryEditor(itinerary, onUpdate)

// 楽観更新あり（UIが即座に更新される）
await updateField('title', newTitle, { optimistic: true })

// 楽観更新なし（サーバー応答後に更新）
await updateField('description', newDescription)

// 複数フィールドを一括更新
await updateFields({ 
  start_time: '09:00', 
  end_time: '10:00',
  timezone: 'Asia/Tokyo' 
}, { optimistic: true })
```

---

### 2. 型とAPIの互換性 🔧

#### 問題
分割前のProps/イベントをそのまま切り出すとPRで大量の呼び出し場所が壊れる。

#### 対策：段階的移行戦略

**ステップ1: Deprecatedラッパーを用意**

```typescript
// components/trip/ScheduleCard.tsx（リファクタリング前のインターフェースを維持）

import { ScheduleCardNew } from './ScheduleCardNew'

/**
 * @deprecated この実装は非推奨です。ScheduleCardNewに移行してください。
 * 既存の呼び出し箇所との互換性のために残されています。
 */
export default function ScheduleCard(props: ScheduleCardProps) {
  // 古いPropsを新しいPropsに変換
  return <ScheduleCardNew {...props} />
}
```

**ステップ2: 新しいコンポーネントを別ファイルに作成**

```typescript
// components/trip/ScheduleCardNew.tsx（新しい実装）

export function ScheduleCardNew(props: ScheduleCardProps) {
  // 新しい実装
  const { updateField } = useItineraryEditor(props.itinerary, props.onUpdate)
  // ...
}
```

**ステップ3: 段階的に移行**

```typescript
// 移行フラグを使用（環境変数 or feature flag）
const USE_NEW_SCHEDULE_CARD = process.env.NEXT_PUBLIC_USE_NEW_SCHEDULE_CARD === 'true'

export default function ScheduleCard(props: ScheduleCardProps) {
  if (USE_NEW_SCHEDULE_CARD) {
    return <ScheduleCardNew {...props} />
  }
  return <ScheduleCardLegacy {...props} />
}
```

**ステップ4: 古い実装を削除**

```typescript
// すべての移行が完了したら古い実装を削除
export { ScheduleCardNew as ScheduleCard }
```

---

### 3. レンダリング・パフォーマンス ⚡

#### 対策：メモ化の徹底

```typescript
// components/trip/ScheduleCardMenu.tsx
import { memo, useCallback } from 'react'

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

export const ScheduleCardMenu = memo(function ScheduleCardMenu({
  isFirst,
  isLast,
  availableDays,
  currentDayId,
  itineraryId,
  hasReservation,
  onMoveUp,
  onMoveDown,
  onMoveToDay,
  onDuplicateToDay,
  onReservation,
  onDelete
}: ScheduleCardMenuProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [showDaySelector, setShowDaySelector] = useState(false)
  const [showDuplicateSelector, setShowDuplicateSelector] = useState(false)
  
  // メモ化されたフィルタリング
  const filteredDaysForMove = useMemo(() => 
    availableDays.filter(day => day.id !== currentDayId),
    [availableDays, currentDayId]
  )
  
  // メモ化されたハンドラー
  const handleDaySelect = useCallback(async (targetDayId: string) => {
    setShowDaySelector(false)
    setShowMenu(false)
    
    if (targetDayId === currentDayId) return
    
    try {
      const response = await fetch('/api/itineraries/move-to-day', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itinerary_id: itineraryId,
          target_day_id: targetDayId
        })
      })
      
      if (response.ok) {
        onMoveToDay(targetDayId)
      } else {
        logger.error('Failed to move itinerary')
        alert('日程の移動に失敗しました')
      }
    } catch (error) {
      logger.error('Error moving itinerary:', error)
      alert('日程の移動に失敗しました')
    }
  }, [itineraryId, currentDayId, onMoveToDay])
  
  return (
    // ... メニューのJSX
  )
})

// 親コンポーネントでの使用
export default function ScheduleCard({ itinerary, ... }: ScheduleCardProps) {
  // コールバックをメモ化
  const handleMoveUp = useCallback(() => {
    onMoveUp?.()
  }, [onMoveUp])
  
  const handleMoveToDay = useCallback((dayId: string) => {
    onMoveToDay?.(itinerary.id, dayId)
  }, [itinerary.id, onMoveToDay])
  
  return (
    <ScheduleCardMenu
      isFirst={isFirst}
      isLast={isLast}
      availableDays={availableDays}
      currentDayId={itinerary.day_id}
      itineraryId={itinerary.id}
      hasReservation={!!itinerary.reservation}
      onMoveUp={handleMoveUp}
      onMoveDown={handleMoveDown}
      onMoveToDay={handleMoveToDay}
      onDuplicateToDay={handleDuplicateToDay}
      onReservation={() => setShowReservationModal(true)}
      onDelete={() => onDelete?.(itinerary.id)}
    />
  )
}
```

---

### 4. タイムゾーンと通貨の扱い 🌍

#### 推奨ライブラリ：Luxon

```typescript
// lib/utils/datetime.ts
import { DateTime, IANAZone } from 'luxon'
import logger from '@/lib/core/logger'

/**
 * タイムゾーン対応の日時ユーティリティ
 * 
 * 設計原則：
 * - サーバーはUTCで保存
 * - UIは目的地タイムゾーンで表示
 * - ユーザーのローカルタイムは参考情報のみ
 */

export const datetimeUtils = {
  /**
   * 時間文字列（HH:mm）をタイムゾーン付きDateTimeに変換
   */
  parseTime(time: string, date: Date, timezone: string): DateTime | null {
    if (!time || !timezone) return null
    
    try {
      const [hours, minutes] = time.split(':').map(Number)
      
      return DateTime.fromObject(
        {
          year: date.getFullYear(),
          month: date.getMonth() + 1,
          day: date.getDate(),
          hour: hours,
          minute: minutes
        },
        { zone: timezone }
      )
    } catch (error) {
      logger.error('Failed to parse time:', error)
      return null
    }
  },
  
  /**
   * DateTimeを表示用にフォーマット（HH:mm or H:mm）
   */
  formatTime(dt: DateTime, format: '24h' | '12h' = '24h', leadingZero: boolean = false): string {
    if (!dt.isValid) return '--:--'
    
    if (format === '12h') {
      return dt.toFormat(leadingZero ? 'hh:mm a' : 'h:mm a')
    }
    
    return dt.toFormat(leadingZero ? 'HH:mm' : 'H:mm')
  },
  
  /**
   * タイムゾーンが有効かチェック
   */
  isValidTimezone(timezone: string): boolean {
    try {
      return IANAZone.isValidZone(timezone)
    } catch {
      return false
    }
  },
  
  /**
   * 目的地時間とユーザーローカル時間の差を計算
   */
  getTimeDifference(destinationTz: string, userTz: string = 'local'): number {
    try {
      const now = DateTime.now()
      const destTime = now.setZone(destinationTz)
      const userTime = now.setZone(userTz)
      
      // オフセットの差（分単位）
      return destTime.offset - userTime.offset
    } catch (error) {
      logger.error('Failed to calculate time difference:', error)
      return 0
    }
  },
  
  /**
   * DSTを考慮した現在のオフセットを取得
   */
  getCurrentOffset(timezone: string): number {
    try {
      const now = DateTime.now().setZone(timezone)
      return now.offset
    } catch (error) {
      logger.error('Failed to get current offset:', error)
      return 0
    }
  },
  
  /**
   * タイムゾーン情報を取得
   */
  getTimezoneInfo(timezone: string): {
    name: string
    offset: number
    offsetString: string
    isDST: boolean
  } | null {
    try {
      const dt = DateTime.now().setZone(timezone)
      
      return {
        name: timezone,
        offset: dt.offset,
        offsetString: dt.toFormat('ZZ'), // +09:00
        isDST: dt.isInDST
      }
    } catch (error) {
      logger.error('Failed to get timezone info:', error)
      return null
    }
  }
}

/**
 * 時間バリデーション（Luxon対応版）
 */
export const timeValidation = {
  isValidTimeFormat(time: string): boolean {
    if (!time) return true
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    return timeRegex.test(time)
  },
  
  isTimeRangeValid(startTime: string, endTime: string, timezone: string, date: Date): boolean {
    const start = datetimeUtils.parseTime(startTime, date, timezone)
    const end = datetimeUtils.parseTime(endTime, date, timezone)
    
    if (!start || !end) return false
    
    // 終了時間は開始時間より後でなければならない
    return end > start
  }
}
```

**package.jsonに追加**

```json
{
  "dependencies": {
    "luxon": "^3.4.4"
  },
  "devDependencies": {
    "@types/luxon": "^3.4.2"
  }
}
```

---

### 5. メニューのUX/アクセシビリティ ♿

#### 対策：キーボード操作とARIA属性

```typescript
// components/trip/ScheduleCardMenu.tsx
import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useClickOutside } from '@/hooks/useClickOutside'

export function ScheduleCardMenu({ ... }: ScheduleCardMenuProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const itemsRef = useRef<(HTMLButtonElement | null)[]>([])
  
  // メニュー項目の定義
  const menuItems = useMemo(() => [
    { id: 'moveUp', label: '上に移動', disabled: isFirst },
    { id: 'moveDown', label: '下に移動', disabled: isLast },
    { id: 'moveToDay', label: '別の日程に移動', disabled: false },
    { id: 'duplicateToDay', label: '別の日程に複製', disabled: false },
    { id: 'reservation', label: '予約情報', disabled: false },
    { id: 'delete', label: 'Venue削除', disabled: false },
  ], [isFirst, isLast])
  
  // 外側クリックで閉じる
  useClickOutside(menuRef, () => {
    if (showMenu) {
      closeMenu()
    }
  })
  
  // メニューを閉じる（フォーカスをボタンに戻す）
  const closeMenu = useCallback(() => {
    setShowMenu(false)
    setFocusedIndex(0)
    buttonRef.current?.focus()
  }, [])
  
  // キーボード操作
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showMenu) {
      // メニューが閉じている時
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault()
        setShowMenu(true)
        setFocusedIndex(0)
      }
      return
    }
    
    // メニューが開いている時
    const enabledItems = menuItems.filter(item => !item.disabled)
    
    switch (e.key) {
      case 'Escape':
        e.preventDefault()
        closeMenu()
        break
        
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex(prev => {
          const next = (prev + 1) % enabledItems.length
          itemsRef.current[next]?.focus()
          return next
        })
        break
        
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex(prev => {
          const next = (prev - 1 + enabledItems.length) % enabledItems.length
          itemsRef.current[next]?.focus()
          return next
        })
        break
        
      case 'Home':
        e.preventDefault()
        setFocusedIndex(0)
        itemsRef.current[0]?.focus()
        break
        
      case 'End':
        e.preventDefault()
        const lastIndex = enabledItems.length - 1
        setFocusedIndex(lastIndex)
        itemsRef.current[lastIndex]?.focus()
        break
        
      case 'Tab':
        // Tabでメニューを閉じる（デフォルトのフォーカス移動を許可）
        closeMenu()
        break
    }
  }, [showMenu, menuItems, closeMenu])
  
  // メニューが開いたら最初の項目にフォーカス
  useEffect(() => {
    if (showMenu && itemsRef.current[0]) {
      itemsRef.current[0].focus()
    }
  }, [showMenu])
  
  const MenuContent = (
    <div 
      ref={menuRef}
      className="fixed bg-white rounded-md shadow-lg border border-gray-200 zidx-popup-menu"
      role="menu"
      aria-orientation="vertical"
      aria-labelledby="schedule-menu-button"
      onKeyDown={handleKeyDown}
      style={{
        top: buttonRef.current ? buttonRef.current.getBoundingClientRect().bottom + 4 : 0,
        left: buttonRef.current ? buttonRef.current.getBoundingClientRect().left : 0,
        width: '192px'
      }}
    >
      <div className="py-1">
        {menuItems.map((item, index) => (
          <button
            key={item.id}
            ref={el => itemsRef.current[index] = el}
            onClick={() => {
              handleMenuAction(item.id)
              closeMenu()
            }}
            disabled={item.disabled}
            role="menuitem"
            tabIndex={showMenu && index === focusedIndex ? 0 : -1}
            aria-disabled={item.disabled}
            className={`w-full text-left px-4 py-2 text-sm flex items-center space-x-2 ${
              item.disabled 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none'
            }`}
          >
            {/* アイコンとラベル */}
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
  
  return (
    <div className="flex-shrink-0 p-4">
      <button
        ref={buttonRef}
        onClick={() => setShowMenu(!showMenu)}
        onKeyDown={handleKeyDown}
        className="p-2 hover:bg-gray-100 rounded-md transition-colors"
        aria-label="メニューを開く"
        aria-expanded={showMenu}
        aria-haspopup="menu"
        id="schedule-menu-button"
      >
        <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>
      
      {/* ポータルでメニューを描画（z-index競合を避ける） */}
      {showMenu && typeof document !== 'undefined' && createPortal(
        MenuContent,
        document.body
      )}
    </div>
  )
}
```

---

## 🧪 テスト戦略

### ユニットテスト（Jest + React Testing Library）

```typescript
// hooks/__tests__/useItineraryEditor.test.ts
import { renderHook, act, waitFor } from '@testing-library/react'
import { useItineraryEditor } from '../useItineraryEditor'

describe('useItineraryEditor', () => {
  const mockItinerary = {
    id: 'test-id',
    title: 'Test Title',
    // ... other fields
  }
  
  beforeEach(() => {
    global.fetch = jest.fn()
  })
  
  afterEach(() => {
    jest.restoreAllMocks()
  })
  
  it('should update field successfully', async () => {
    const mockOnUpdate = jest.fn()
    const mockResponse = { ...mockItinerary, title: 'New Title' }
    
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    })
    
    const { result } = renderHook(() => 
      useItineraryEditor(mockItinerary, mockOnUpdate)
    )
    
    let updateResult
    await act(async () => {
      updateResult = await result.current.updateField('title', 'New Title')
    })
    
    expect(updateResult.success).toBe(true)
    expect(mockOnUpdate).toHaveBeenCalledWith(mockResponse)
  })
  
  it('should abort previous request when new request is made', async () => {
    const mockOnUpdate = jest.fn()
    
    ;(global.fetch as jest.Mock).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ ok: true, json: async () => mockItinerary }), 1000))
    )
    
    const { result } = renderHook(() => 
      useItineraryEditor(mockItinerary, mockOnUpdate)
    )
    
    // 1つ目のリクエスト
    act(() => {
      result.current.updateField('title', 'Title 1')
    })
    
    // すぐに2つ目のリクエスト（1つ目をキャンセルするはず）
    await act(async () => {
      await result.current.updateField('title', 'Title 2')
    })
    
    // 2つ目のリクエストのみが完了するはず
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })
  
  it('should rollback on error with optimistic update', async () => {
    const mockOnUpdate = jest.fn()
    
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))
    
    const { result } = renderHook(() => 
      useItineraryEditor(mockItinerary, mockOnUpdate)
    )
    
    await act(async () => {
      await result.current.updateField('title', 'New Title', { optimistic: true })
    })
    
    // 楽観更新で1回、エラー後のロールバックで1回呼ばれる
    expect(mockOnUpdate).toHaveBeenCalledTimes(2)
    expect(mockOnUpdate).toHaveBeenLastCalledWith(mockItinerary)
    expect(result.current.lastError).toBeTruthy()
  })
})
```

### E2Eテスト（Playwright）

```typescript
// e2e/schedule-card.spec.ts
import { test, expect } from '@playwright/test'

test.describe('ScheduleCard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test-trip')
  })
  
  test('should edit title inline', async ({ page }) => {
    const card = page.locator('[data-testid="schedule-card-1"]')
    const title = card.locator('h4')
    
    // タイトルをクリックして編集モード
    await title.click()
    
    const input = card.locator('input[type="text"]')
    await expect(input).toBeVisible()
    
    // 新しいタイトルを入力
    await input.fill('New Title')
    await input.press('Enter')
    
    // 保存を待つ
    await expect(input).not.toBeVisible()
    await expect(title).toHaveText('New Title')
  })
  
  test('should open menu with keyboard', async ({ page }) => {
    const menuButton = page.locator('[aria-label="メニューを開く"]').first()
    
    // フォーカスしてEnterで開く
    await menuButton.focus()
    await menuButton.press('Enter')
    
    // メニューが表示される
    const menu = page.locator('[role="menu"]')
    await expect(menu).toBeVisible()
    
    // ArrowDownで次の項目に移動
    await page.keyboard.press('ArrowDown')
    
    // Escapeで閉じる
    await page.keyboard.press('Escape')
    await expect(menu).not.toBeVisible()
  })
  
  test('should handle concurrent edits correctly', async ({ page }) => {
    const card = page.locator('[data-testid="schedule-card-1"]')
    
    // タイトルと説明を同時に編集
    const titleInput = card.locator('input[type="text"]')
    const descriptionTextarea = card.locator('textarea')
    
    await card.locator('h4').click()
    await titleInput.fill('New Title')
    
    await card.locator('[data-testid="description"]').click()
    await descriptionTextarea.fill('New Description')
    
    // 両方を保存
    await titleInput.press('Enter')
    await page.keyboard.press('Control+Enter') // Ctrl+Enterで説明を保存
    
    // 両方が保存されていることを確認
    await expect(card.locator('h4')).toHaveText('New Title')
    await expect(card.locator('[data-testid="description"]')).toContainText('New Description')
  })
})
```

---

## 📋 実装チェックリスト

### コード品質
- [ ] **AbortController** を useItineraryEditor に組み込む
- [ ] **楽観更新 + ロールバック** 機能を実装
- [ ] **依存配列** が正しいか eslint-plugin-react-hooks で確認
- [ ] **React.memo / useCallback / useMemo** を適切に使用
- [ ] **型定義** を厳密に（any を使わない）

### アクセシビリティ
- [ ] **aria属性** を必須項目に（role, aria-label, aria-expanded, etc.）
- [ ] **キーボード操作** 対応（Tab, Arrow, Enter, Escape, Home, End）
- [ ] **フォーカス管理** （メニュー開閉時のフォーカス移動）
- [ ] **スクリーンリーダー** でテスト

### テスト
- [ ] **ユニットテスト** （各フック・コンポーネント）
- [ ] **E2Eテスト** （メニュー操作、並行編集、エラーハンドリング）
- [ ] **カバレッジ** 80%以上
- [ ] **モバイル表示** テスト

### パフォーマンス
- [ ] **Lighthouseスコア** 90以上
- [ ] **バンドルサイズ** 増加を10KB以内に抑える
- [ ] **再レンダリング** をReact DevToolsで確認

### 運用
- [ ] **エラー監視** （Sentry等）設定
- [ ] **ログ出力** （操作失敗、API エラー）
- [ ] **マイグレーションガイド** 作成
- [ ] **スタイルガイド更新**

---

## 🚢 PR / リリース戦略

### PR分割例

1. **PR#1**: タイムゾーン・バリデーションユーティリティ（1日）
2. **PR#2**: useItineraryEditor, useClickOutside フック（2日）
3. **PR#3**: DragHandle, TeardropMarker コンポーネント（1日）
4. **PR#4**: ScheduleCardImage コンポーネント（1日）
5. **PR#5**: InlineTimeEditor, InlineCostEditor（2日）
6. **PR#6**: ScheduleInfoDisplay コンポーネント（1日）
7. **PR#7**: ScheduleCardMenu コンポーネント（2日）
8. **PR#8**: ScheduleCard統合リファクタリング（2日）

**合計**: 12日（8 PR）

### Feature Flag戦略

```typescript
// lib/feature-flags.ts
export const FEATURE_FLAGS = {
  USE_NEW_SCHEDULE_CARD: process.env.NEXT_PUBLIC_USE_NEW_SCHEDULE_CARD === 'true',
  USE_OPTIMISTIC_UPDATES: process.env.NEXT_PUBLIC_USE_OPTIMISTIC_UPDATES === 'true',
  USE_LUXON_DATETIME: process.env.NEXT_PUBLIC_USE_LUXON_DATETIME === 'true',
} as const

// 使用例
if (FEATURE_FLAGS.USE_NEW_SCHEDULE_CARD) {
  return <ScheduleCardNew {...props} />
}
return <ScheduleCardLegacy {...props} />
```

### ロールアウト計画

1. **開発環境**: 全フラグON
2. **ステージング**: 段階的にON（1週間テスト）
3. **本番 Canary**: 5%のユーザーに配信（1週間）
4. **本番 全体**: 100%ロールアウト
5. **レガシーコード削除**: 2週間後

---

## 🔍 監視・メトリクス

### 重要な指標

```typescript
// 操作成功率
const updateSuccessRate = successfulUpdates / totalUpdates

// 平均応答時間
const avgResponseTime = totalResponseTime / totalRequests

// エラー率（種類別）
const errorRates = {
  networkError: networkErrors / totalRequests,
  validationError: validationErrors / totalRequests,
  serverError: serverErrors / totalRequests,
}

// パフォーマンス
const metrics = {
  firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0],
  largestContentfulPaint: performance.getEntriesByName('largest-contentful-paint')[0],
  timeToInteractive: performance.getEntriesByName('interactive')[0],
}
```

### ログ出力例

```typescript
// lib/monitoring.ts
import logger from '@/lib/core/logger'

export function trackUpdate(
  operation: string, 
  success: boolean, 
  duration: number, 
  error?: Error
) {
  logger.info('Itinerary update', {
    operation,
    success,
    duration,
    error: error?.message,
    timestamp: new Date().toISOString()
  })
  
  // 外部監視サービスに送信（Sentry, DataDog等）
  if (!success && error) {
    // Sentry.captureException(error, { tags: { operation } })
  }
}

// 使用例
const startTime = performance.now()
const result = await updateField('title', newTitle)
const duration = performance.now() - startTime

trackUpdate('update_title', result.success, duration, result.error)
```

---

## 💡 追加の推奨事項

### Luxonのインストール

```bash
npm install luxon
npm install --save-dev @types/luxon
```

### ESLintルール追加

```json
{
  "extends": [
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/recommended"
  ],
  "rules": {
    "react-hooks/exhaustive-deps": "error",
    "jsx-a11y/no-autofocus": "warn",
    "jsx-a11y/aria-props": "error",
    "jsx-a11y/role-has-required-aria-props": "error"
  }
}
```

### VS Code設定

```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.updateImportsOnFileMove.enabled": "always"
}
```

---

**最後に**: 小さいPRを心がけ、各ステップでテストを徹底すること。リファクタリングは一気にやらず、段階的に進めるのが成功の鍵です。

