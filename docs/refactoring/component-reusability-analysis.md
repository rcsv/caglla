# InlineTimeEditor / InlineCostEditor 再利用可能性分析

**作成日**: 2025年10月19日

---

## 🔍 調査結果サマリー

### InlineTimeEditor（時間編集）
**用途**: 時刻（HH:mm）の開始時間・終了時間編集

#### 現在の使用箇所
- ✅ `components/trip/ScheduleCard.tsx` - Itineraryの時間編集

#### 時間入力がある他の箇所
| ファイル | 入力タイプ | 用途 | 適用可能性 |
|---------|----------|------|-----------|
| ReservationInfoModal.tsx | `datetime-local` | 日時（日付+時刻） | ❌ 異なる |
| TripMap.tsx | - | 参照のみ（入力なし） | ❌ 該当なし |

**結論**: 
- **現状**: ScheduleCard専用
- **将来性**: 他のItinerary編集画面ができたら再利用可能
- **汎用化の必要性**: ⭐️ 低（現時点では1箇所のみ）

---

### InlineCostEditor（費用編集）
**用途**: 金額と通貨の編集

#### 現在の使用箇所
- ✅ `components/trip/ScheduleCard.tsx` - Itineraryの費用編集

#### 費用入力がある他の箇所
**検索結果**: なし

**将来的な適用可能性**:
| 画面 | 用途 | 適用可能性 |
|------|------|-----------|
| Trip作成/編集 | 旅行全体の予算 | ✅ 高 |
| Day編集 | 日別の予算 | ✅ 高 |
| 予算管理画面（未実装） | 予算設定 | ✅ 高 |

**結論**: 
- **現状**: ScheduleCard専用
- **将来性**: Trip/Day編集、予算管理で再利用可能性が高い
- **汎用化の必要性**: ⭐️⭐️⭐️ 高（将来的に複数箇所で使う見込み）

---

## 📊 比較: datetime-local vs time

### ScheduleCard（time）
**入力**: 時刻のみ（HH:mm）
```typescript
<input type="time" value="09:00" />
// → 日付情報なし、時刻のみ
```

**用途**: 
- 1日の中での開始・終了時刻
- 日付は親（Day）から決まっている

**コンポーネント**: `InlineTimeEditor`

---

### ReservationInfoModal（datetime-local）
**入力**: 日時（YYYY-MM-DDTHH:mm）
```typescript
<input type="datetime-local" value="2025-10-19T09:00" />
// → 日付 + 時刻の組み合わせ
```

**用途**: 
- 宿泊のチェックイン/アウト（複数日にまたがる）
- フライトの出発/到着（異なる日付）
- レンタカーの開始/終了（複数日）

**コンポーネント**: 既存のInput（汎用）

---

## ✅ 設計の妥当性評価

### InlineTimeEditor
- ✅ **適切**: 時刻のみの編集に特化
- ✅ **分離**: datetime-localとは明確に用途が異なる
- ✅ **将来性**: 他のItinerary編集でも使える設計

### InlineCostEditor
- ✅ **適切**: 金額+通貨の編集に特化
- ✅ **汎用的**: Trip, Day, 予算管理等で再利用可能
- ✅ **将来性**: 予算機能実装時に活躍する見込み

---

## 🚀 将来的な適用候補

### 確実に使えそうな箇所

#### 1. Trip編集画面（予算入力）
**適用コンポーネント**: `InlineCostEditor`
```typescript
// TripEditorで予算を設定
<InlineCostEditor
  amount={tripBudget}
  currency={tripCurrency}
  onAmountChange={setTripBudget}
  onCurrencyChange={setTripCurrency}
  onSave={handleBudgetSave}
  onCancel={handleBudgetCancel}
  isSaving={isSaving}
/>
```

#### 2. Day編集画面（日別予算）
**適用コンポーネント**: `InlineCostEditor`
```typescript
// DayEditorで日別予算を設定
<InlineCostEditor
  amount={dayBudget}
  currency={currency}
  onAmountChange={setDayBudget}
  onCurrencyChange={setCurrency}
  onSave={handleDayBudgetSave}
  onCancel={handleCancel}
  isSaving={isSaving}
/>
```

#### 3. Itinerary一括編集画面（未実装）
**適用コンポーネント**: `InlineTimeEditor`, `InlineCostEditor`
```typescript
// 複数のItineraryを一括編集
{itineraries.map(item => (
  <div key={item.id}>
    <InlineTimeEditor {...} />
    <InlineCostEditor {...} />
  </div>
))}
```

---

### 可能性がある箇所

#### 4. AddScheduleModal（スケジュール追加モーダル）
**現在**: `components/modals/AddScheduleModal.tsx`

**確認が必要**: 
- 時間入力があるか？
- 費用入力があるか？

#### 5. 予算管理画面（未実装）
**適用コンポーネント**: `InlineCostEditor`
- 旅行全体の予算
- カテゴリ別予算（交通費、宿泊費、食費等）
- 実績との比較

---

## 📋 推奨アクション

### 即座に実施（確認のみ）
- [ ] AddScheduleModalを確認して時間/費用入力の有無をチェック
- [ ] TripEditor/DayEditorに予算入力があるか確認

### 将来的に実施（機能追加時）
- [ ] Trip編集に予算機能を追加する際にInlineCostEditorを使用
- [ ] Day編集に日別予算機能を追加する際にInlineCostEditorを使用
- [ ] 予算管理画面を実装する際にInlineCostEditorを使用

---

## 💡 汎用化の提案（オプション）

### InlineDateTimeEditor（datetime-local用）

ReservationInfoModalで使っている`datetime-local`入力も汎用化できる：

```typescript
// components/common/InlineDateTimeEditor.tsx
interface InlineDateTimeEditorProps {
  startDateTime: Date | null
  endDateTime: Date | null
  onStartDateTimeChange: (value: Date) => void
  onEndDateTimeChange: (value: Date) => void
  onSave: () => void
  onCancel: () => void
  isSaving: boolean
  startLabel?: string
  endLabel?: string
}

export function InlineDateTimeEditor({ ... }: InlineDateTimeEditorProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <label className="text-sm font-medium text-gray-700">{startLabel || '開始日時'}:</label>
        <input
          type="datetime-local"
          value={formatForDatetimeLocal(startDateTime)}
          onChange={(e) => onStartDateTimeChange(new Date(e.target.value))}
          className="..."
        />
        <label className="text-sm font-medium text-gray-700">{endLabel || '終了日時'}:</label>
        <input
          type="datetime-local"
          value={formatForDatetimeLocal(endDateTime)}
          onChange={(e) => onEndDateTimeChange(new Date(e.target.value))}
          className="..."
        />
      </div>
      {/* 保存/キャンセルボタン */}
    </div>
  )
}
```

**適用箇所**: ReservationInfoModalの4箇所（flight用2箇所、その他用2箇所）

**削減見込み**: 約30-40行

---

## ✅ 結論

### InlineTimeEditor
- **現状**: ScheduleCard専用（1箇所）
- **将来性**: ⭐️⭐️ 中（Itinerary一括編集で使える可能性）
- **汎用化**: 現時点では不要

### InlineCostEditor  
- **現状**: ScheduleCard専用（1箇所）
- **将来性**: ⭐️⭐️⭐️⭐️ 高（Trip/Day予算、予算管理で確実に使う）
- **汎用化**: **既に完了**（props設計が汎用的）

### 推奨事項
1. ✅ **InlineCostEditor**: そのまま維持（汎用的な設計）
2. ✅ **InlineTimeEditor**: そのまま維持（必要十分）
3. ⭐️ **InlineDateTimeEditor**: 将来的に検討（ReservationInfoModalで重複がある場合）

---

**作成者**: AI Assistant  
**ステータス**: 分析完了、現状の設計が適切と判断 ✅

