# Issue: POIDialogの営業時間ステータス判定が常にClosedになる

**作成日**: 2025-01-XX  
**状態**: 🔴 未解決  
**優先度**: 中  
**種類**: バグ修正  
**関連ファイル**: 
- `components/modals/POIDialog.tsx`（営業時間解析関数）

---

## 📋 概要

POIDialogで営業時間のステータス（Open/Closed）が常に「Closed」と表示される問題。実際には営業中であるにも関わらず、正しく判定されていない。

---

## 🐛 問題の詳細

### 現状の動作
- 営業時間が設定されている場所でも、常に「Closed」（営業時間外）と表示される
- 「Open」（営業中）の判定が機能していない

### 期待される動作
- 現在時刻が営業時間内であれば「Open」（営業中）と表示
- 現在時刻が営業時間外であれば「Closed」（営業時間外）と表示
- 24時間営業の場合は「Open 24 hours」と表示
- 定休日の場合は「Closed」と表示

---

## 🔍 想定原因

### 1. 営業時間の解析ロジックの問題
`parseOpeningHours`関数内で、営業時間の解析が正しく動作していない可能性：

```typescript
// 現在時刻がどの営業時間内にあるかチェック
isOpen = parsedRanges.some(range => 
  currentTime >= range.open && currentTime <= range.close
)
```

**問題点**:
- 時間文字列の比較が正しく機能していない可能性
- `parsedRanges`が空の配列になっている可能性
- 時間範囲の解析が失敗している可能性

### 2. 時間表記の変換問題
日本語表記（"9時30分"）から数値表記（"09:30"）への変換が正しく動作していない可能性。

### 3. 多言語対応による影響
多言語対応の実装で、時間解析ロジックが壊れた可能性。

---

## 💡 解決方針

### Phase 1: デバッグ・原因調査
1. **ログ出力の追加**
   - `parseOpeningHours`関数内で、各ステップの値をログ出力
   - `todayText`、`normalizedText`、`parsedRanges`、`isOpen`の値を確認

2. **時間比較ロジックの確認**
   - 時間文字列（"HH:MM"）の比較が正しく動作するか確認
   - 必要に応じて、Dateオブジェクトを使用した比較に変更

3. **テストケースの作成**
   - 営業中の場合
   - 営業時間外の場合
   - 24時間営業の場合
   - 定休日の場合

### Phase 2: 実装修正
1. **時間比較ロジックの改善**
   - 文字列比較ではなく、Dateオブジェクトまたは数値比較を使用
   - 例: `"09:30"` → `930` (分単位)に変換して比較

2. **エラーハンドリングの追加**
   - 時間範囲の解析が失敗した場合のフォールバック処理
   - デバッグログの出力

---

## ✅ 完了条件

- [ ] 営業中の場合は「Open」と正しく表示される
- [ ] 営業時間外の場合は「Closed」と正しく表示される
- [ ] 24時間営業の場合は「Open 24 hours」と表示される
- [ ] 定休日の場合は「Closed」と表示される
- [ ] 複数の営業時間帯がある場合も正しく判定される
- [ ] デバッグログで問題が確認できる（または削除）

---

## 🔗 関連ファイル

- `components/modals/POIDialog.tsx` - `parseOpeningHours`関数（35-116行目）

---

## 📝 技術的検討事項

### 時間比較の改善案

```typescript
// 現在の実装（文字列比較）
isOpen = parsedRanges.some(range => 
  currentTime >= range.open && currentTime <= range.close
)

// 改善案1: 数値比較（分単位）
const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}
const currentMinutes = timeToMinutes(currentTime)
isOpen = parsedRanges.some(range => 
  currentMinutes >= timeToMinutes(range.open) && 
  currentMinutes <= timeToMinutes(range.close)
)

// 改善案2: Dateオブジェクトを使用
const timeToDate = (timeStr: string, baseDate: Date): Date => {
  const [hours, minutes] = timeStr.split(':').map(Number)
  const date = new Date(baseDate)
  date.setHours(hours, minutes, 0, 0)
  return date
}
const currentDate = timeToDate(currentTime, now)
isOpen = parsedRanges.some(range => 
  currentDate >= timeToDate(range.open, now) && 
  currentDate <= timeToDate(range.close, now)
)
```

### デバッグログの追加

```typescript
logger.debug('Opening hours parse:', {
  todayText,
  normalizedText,
  parsedRanges,
  currentTime,
  isOpen,
  currentHours
})
```

