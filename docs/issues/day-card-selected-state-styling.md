# Issue: Dayカードの選択状態スタイルがわかりにくく統一感がない

**作成日**: 2025-11-03  
**状態**: ✅ 解決済み  
**優先度**: 低（UI/デザイン微調整）  
**解決日**: 2025-11-03  
**種類**: UI/スタイル調整  

---

## 📋 概要

Dayカードのヘッダー部分にフォーカス（選択）が当たった場合、現在は薄い赤色の背景（`bg-red-50`）と赤いボーダー（`border-red-200`）で表示されています。このスタイルは以下の問題があります：

1. **わかりにくい**: 薄い赤色なので選択状態が視認しにくい
2. **統一感がない**: 他の選択状態表示（例: ScheduleCardはリング表示）と異なるデザインで統一感がない
3. **色の意味が不明確**: 赤色は通常エラーや警告を示す色であり、選択状態には不適切

---

## 🐛 現状の問題

**ファイル**: `components/trip/TripItineraryView.tsx` (211行目)

```tsx
<div 
  className={`flex justify-between items-center p-6 cursor-pointer hover:bg-gray-50 transition-colors zidx-day-card-button relative ${selectedDayId === day.id ? 'bg-red-50 border-red-200' : ''}`}
  onClick={(e) => {
    e.stopPropagation()
    onDayClick(day.id)
  }}
>
```

**現在のスタイル**:
- 選択時: `bg-red-50 border-red-200`（薄い赤色背景 + 赤色ボーダー）
- ホバー時: `hover:bg-gray-50`（薄いグレー背景）

**問題点**:
- 赤色（`red-50`, `red-200`）はエラー/警告の色として使われることが多く、選択状態には不適切
- 薄すぎて視認性が低い
- ScheduleCardの選択状態（`ring-2 ring-red-500 ring-opacity-50`）とデザインが統一されていない

---

## 💡 提案する解決方針

### オプション1: リング表示（ScheduleCardと統一）【推奨】

ScheduleCardと同じくリング表示を使用し、統一感を保つ。

**実装**:
```tsx
className={`flex justify-between items-center p-6 cursor-pointer hover:bg-gray-50 transition-colors zidx-day-card-button relative ${selectedDayId === day.id ? 'ring-2 ring-emerald-500 ring-opacity-50 rounded-lg' : ''}`}
```

**メリット**:
- ScheduleCardと統一されたデザイン
- エメラルド色（`emerald-500`）はアプリのメインカラーで統一感がある
- リング表示で視認性が高い

### オプション2: 控えめな背景色変更

赤色ではなく、エメラルド系の薄い背景色を使用。

**実装**:
```tsx
className={`flex justify-between items-center p-6 cursor-pointer hover:bg-gray-50 transition-colors zidx-day-card-button relative ${selectedDayId === day.id ? 'bg-emerald-50 border-emerald-200' : ''}`}
```

**メリット**:
- エメラルド色で統一感がある
- 背景色変更なので、より控えめ

### オプション3: 左側にアクセントライン

左側に細いアクセントラインを追加（最も控えめ）。

**実装**:
```tsx
className={`flex justify-between items-center p-6 cursor-pointer hover:bg-gray-50 transition-colors zidx-day-card-button relative ${selectedDayId === day.id ? 'border-l-4 border-emerald-500' : 'border-l-4 border-transparent'}`}
```

**メリット**:
- 最も控えめで、統一感を保ちやすい
- 色の使用が最小限

---

## 🔧 実装詳細

### 推奨実装: オプション1（リング表示）

**修正箇所**: `components/trip/TripItineraryView.tsx` (211行目)

**修正前**:
```tsx
className={`flex justify-between items-center p-6 cursor-pointer hover:bg-gray-50 transition-colors zidx-day-card-button relative ${selectedDayId === day.id ? 'bg-red-50 border-red-200' : ''}`}
```

**修正後**:
```tsx
className={`flex justify-between items-center p-6 cursor-pointer hover:bg-gray-50 transition-colors zidx-day-card-button relative ${selectedDayId === day.id ? 'ring-2 ring-emerald-500 ring-opacity-50 rounded-lg' : ''}`}
```

**注意点**:
- `rounded-lg`を追加して、リングが角丸に沿って表示されるようにする
- ヘッダー部分だけでなく、Dayカード全体（`div`の外側）にリングを適用する場合は、親要素にリングを追加する必要がある

---

## 📝 受け入れ条件（AC）

1. **視認性**: 選択状態が明確にわかる
2. **統一感**: ScheduleCardなど他の選択状態表示と統一されたデザイン
3. **色の意味**: エラー/警告を示す赤色ではなく、適切な色（エメラルドなど）を使用
4. **ホバー状態**: 既存のホバー効果（`hover:bg-gray-50`）は維持
5. **アクセシビリティ**: キーボード操作でも選択状態が視覚的にわかる

---

## 🔍 関連する実装

### ScheduleCardの選択状態表示

**ファイル**: `components/trip/ScheduleCard.tsx` (254行目)

```tsx
<div className={`flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${isSelected ? 'ring-2 ring-red-500 ring-opacity-50' : ''}`}>
```

ScheduleCardでは`ring-red-500`を使用していますが、Dayカードでは統一感のために`ring-emerald-500`を推奨します（またはScheduleCardも`emerald`に変更することを検討）。

---

## 💭 実装時の注意事項

1. **z-index**: `zidx-day-card-button`は維持
2. **ホバー効果**: 既存の`hover:bg-gray-50`は維持し、選択時もホバー効果が適切に動作することを確認
3. **トランジション**: `transition-colors`は維持し、選択状態の変化がスムーズにアニメーションされることを確認
4. **フォーカス状態**: キーボード操作（Tabキー）でも選択状態が視覚的にわかることを確認

---

## 🔗 関連ファイル

- `components/trip/TripItineraryView.tsx` - Dayカードのヘッダー部分（211行目）
- `components/trip/ScheduleCard.tsx` - 選択状態のリング表示（参考）

---

## 📊 優先度の根拠

UI/デザインの微調整であり、機能的な問題ではないため、優先度は低め。ただし、ユーザー体験の改善とデザインの統一性向上のために対応する価値がある。

