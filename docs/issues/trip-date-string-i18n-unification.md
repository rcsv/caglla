# Issue: 旅行日程文字列のi18n化とライブラリ統一

**作成日**: 2025-10-31  
**状態**: 🔴 未解決  
**優先度**: 高  
**関連ファイル**: 
- `lib/utils/date.ts`
- `components/tripcard/TripCard.tsx`
- `components/tripcard/NextTripMap.tsx`
- `components/stats/TripReservationDisplay.tsx`
- その他、日付表示を使用しているコンポーネント

---

## 📋 概要

旅行日程の文字列生成（例：「11/1 - 2 (2日後、2日間)」）がi18n化されていない。また、複数の箇所で個別に実装されているため、ライブラリで統一して管理する必要がある。

---

## 🐛 問題の詳細

### 現状の問題

1. **ハードコードされた日本語テキスト**
   - 「日後」「日間」「日帰り」などのテキストが`lib/utils/date.ts`内でハードコードされている
   - 英語対応ができない
   - 言語切り替え時に文字列が変更されない

2. **複数箇所での分散実装**
   - `dateUtils.formatFutureTripDate()` - 未来の旅行用
   - `dateUtils.formatPastTripDate()` - 過去の旅行用
   - `dateUtils.formatDateRange()` - 基本的な日付範囲
   - `TripReservationDisplay.tsx`内の独自実装
   - 各コンポーネントで個別に日付フォーマット処理が存在

3. **統一されていない実装**
   - 同じ目的の関数が複数存在
   - ロジックが分散している
   - メンテナンスが困難

### 影響を受ける文字列例

- `11/1 - 2 (2日後、2日間)`
- `10/20 (1日後、日帰り)`
- `2025/12/30 - 2026/1/10 (72日後、12日間)`
- `3年前 (2022年)`
- `日付が設定されていません`

---

## 🔍 現状の実装箇所

### 1. `lib/utils/date.ts`

主要な関数：
- `formatFutureTripDate()` - 未来の旅行日付（相対時間付き）
- `formatPastTripDate()` - 過去の旅行日付（相対時間付き）
- `formatDateRange()` - 基本的な日付範囲
- `formatUnifiedDateRange()` - 統一日付範囲表示
- `formatTripDateRange()` - コンパクトな日付範囲

ハードコードされたテキスト：
- `'日後'` - "days later"
- `'日間'` - "days" (duration)
- `'日帰り'` - "day trip"
- `'年前'` - "years ago"
- `'日付が設定されていません'` - "Date not set"

### 2. 使用箇所

以下のコンポーネントで使用：
- `components/tripcard/TripCard.tsx` (2箇所)
- `components/tripcard/NextTripMap.tsx`
- `components/stats/TripReservationDisplay.tsx` (独自実装あり)
- その他、日付表示を含むコンポーネント

---

## 💡 解決方針

### Phase 1: i18n対応

1. **i18nキーの追加**
   ```typescript
   // lib/i18n/index.ts に追加
   'date.daysLater': '日後',
   'date.days': '日間',
   'date.dayTrip': '日帰り',
   'date.yearsAgo': '年前',
   'date.notSet': '日付が設定されていません',
   'date.format.monthDay': '{month}/{day}',
   // など
   ```

2. **日付フォーマット関数のi18n対応**
   - `formatFutureTripDate()`に言語パラメータを追加
   - `formatPastTripDate()`に言語パラメータを追加
   - `formatDateRange()`に言語パラメータを追加
   - すべての関数で`t()`を使用

### Phase 2: ライブラリ統一

1. **統一インターフェースの設計**
   ```typescript
   interface DateFormatOptions {
     language?: SupportedLanguage
     includeRelativeTime?: boolean // 相対時間（「2日後」など）を含めるか
     includeDuration?: boolean // 期間（「2日間」など）を含めるか
     format?: 'compact' | 'full' // コンパクト形式か完全形式か
   }
   
   function formatTripDate(
     startDate: FirestoreDate,
     endDate: FirestoreDate,
     options?: DateFormatOptions
   ): string
   ```

2. **既存関数の統合**
   - `formatFutureTripDate()`, `formatPastTripDate()`, `formatDateRange()`を統合
   - 日付が未来か過去かを自動判定
   - オプションで相対時間や期間の表示を制御

3. **重複実装の削除**
   - `TripReservationDisplay.tsx`の独自実装を削除
   - 統一ライブラリを使用するように変更

### Phase 3: コンポーネントの更新

1. **すべての使用箇所を更新**
   - `TripCard.tsx`
   - `NextTripMap.tsx`
   - `TripReservationDisplay.tsx`
   - その他のコンポーネント

2. **統一されたAPIの使用**
   ```typescript
   // Before
   dateUtils.formatFutureTripDate(start, end)
   
   // After
   dateUtils.formatTripDate(start, end, {
     includeRelativeTime: true,
     includeDuration: true
   })
   ```

---

## 🎯 実装の優先順位

### 高優先度
1. **i18nキーの定義と追加**
2. **統一インターフェースの設計**
3. **`formatTripDate()`統一関数の実装**

### 中優先度
4. **既存関数のi18n対応**
5. **主要コンポーネントの更新**（TripCard、NextTripMap）

### 低優先度
6. **すべての使用箇所の更新**
7. **旧関数の非推奨化・削除**

---

## 🔗 関連ファイル

### コア実装
- `lib/utils/date.ts` - 日付ユーティリティ（主要な修正対象）
- `lib/i18n/index.ts` - i18nキー定義（追加が必要）

### 使用箇所
- `components/tripcard/TripCard.tsx`
- `components/tripcard/NextTripMap.tsx`
- `components/stats/TripReservationDisplay.tsx`
- `components/tripcard/NextTripCard.tsx`
- その他、日付表示を含むコンポーネント

### ドキュメント
- `docs/specifications/unified-date-range-display.md` - 既存の統一日付範囲表示の仕様

---

## 📝 技術的検討事項

### 日付フォーマットのロジック
既存の`unified-date-range-display.md`に記載されているルールを維持：
- 単日旅行：「日帰り」を使用
- 同月内：終了日の月を省略
- 同年内異月：終了日の年を省略
- 年跨ぎ：開始年と終了年の両方を表示

### i18nキーの命名規則
```
date.{category}.{element}
- date.daysLater: 日後
- date.days: 日間
- date.dayTrip: 日帰り
- date.yearsAgo: 年前
- date.notSet: 日付が設定されていません
- date.format.monthDay: {month}/{day}
- date.format.yearMonthDay: {year}/{month}/{day}
```

### 言語別の日付フォーマット
- 日本語：「11/1 - 2 (2日後、2日間)」
- 英語：「Nov 1-2 (in 2 days, 2 days)」または「11/1 - 2 (2 days later, 2 days)」

---

## ✅ 解決後の確認事項

- [ ] すべての日付文字列がi18n対応されている
- [ ] 統一されたライブラリ関数を使用している
- [ ] 言語切り替え時に日付表示が正しく変更される
- [ ] 既存の機能が壊れていない（リグレッションテスト）
- [ ] すべてのコンポーネントが更新されている
- [ ] ドキュメントが更新されている

