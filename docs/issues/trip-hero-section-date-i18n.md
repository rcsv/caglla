# Issue: TripHeroSectionの日付表示が日本語固定（i18n化未対応）

**作成日**: 2025-11-01  
**状態**: ✅ 解決済み（Phase 1完了）  
**優先度**: 中  
**解決日**: 2025-11-01  
**種類**: i18n化  
**関連ファイル**: 
- `components/trip/TripHeroSection.tsx`（旅行詳細ページのヒーローセクション）
- `lib/utils/date.ts`（`formatTripDateRange`関数）
- `lib/i18n/index.ts`（i18n辞書）

---

## 📋 概要

旅行詳細ページのヒーローセクション（TripHeroSection）で表示される日付が、ユーザーの言語設定に関わらず常に日本語形式（例：「2025年11月8日(土) - 9(日)」）で表示されています。英語設定にしているユーザーに対しても日本語が表示されるため、i18n化が必要です。

---

## 🐛 問題の詳細

### 現状の問題

**ファイル**: `components/trip/TripHeroSection.tsx` (76-79行目)

```tsx
<span className="text-lg font-medium">
  {trip.start_date && trip.end_date 
    ? dateUtils.formatTripDateRange(trip.start_date, trip.end_date)
    : '日付が設定されていません'
  }
</span>
```

**問題点**:
1. `formatTripDateRange`関数が日本語ロケール（`'ja-JP'`）でハードコードされている
2. エラーメッセージ「日付が設定されていません」がハードコードされている
3. 日付形式が「2025年11月8日(土) - 9(日)」のように日本語形式で固定されている

### 影響を受ける表示

- **日本語設定時**: 「2025年11月8日(土) - 9(日)」✅ 正常
- **英語設定時**: 「2025年11月8日(土) - 9(日)」❌ 日本語のまま表示される（期待値: "Nov 8, 2025 (Sat) - 9 (Sun)" など）

### 根本原因

**ファイル**: `lib/utils/date.ts` (242-277行目)

```typescript
formatTripDateRange: (startDate: FirestoreDate, endDate: FirestoreDate): string => {
  // ...
  const startWeekday = start.toLocaleDateString('ja-JP', { weekday: 'short' }) // ← ハードコード
  const endWeekday = end.toLocaleDateString('ja-JP', { weekday: 'short' })     // ← ハードコード
  
  // ...
  return `${startYear}年${startMonth}月${startDay}日 (${startWeekday}) - ${endDay} (${endWeekday})` // ← 日本語形式固定
}
```

---

## 🔍 関連する既存Issue

### `trip-date-string-i18n-unification.md`

既存のIssue「旅行日程文字列のi18n化とライブラリ統一」があり、同様の問題を扱っていますが、より広範囲な課題（複数の日付フォーマット関数の統一など）を対象としています。

**関連性**:
- `formatTripDateRange`関数も対象に含まれる
- ただし、TripHeroSectionで使用される日付表示は最も目立つ場所のため、優先的に対応する価値がある

**本Issueとの違い**:
- 本Issue: TripHeroSectionで使用される`formatTripDateRange`に特化
- 既存Issue: 全体的な日付フォーマット関数の統一とi18n化

---

## 💡 解決方針

### Phase 1: `formatTripDateRange`関数のi18n化（優先度: 高）

1. **言語パラメータの追加**
   - `formatTripDateRange`関数に言語パラメータを追加
   - または、`getUserLanguage()`を使用して自動的に言語を取得

2. **ロケール対応の日付フォーマット**
   - `toLocaleDateString()`に動的なロケールを渡す
   - 日付形式を言語に応じて変更（例: 日本語「年月日」、英語「MMM DD, YYYY」）

3. **エラーメッセージのi18n化**
   - 「日付が設定されていません」をi18nキーに置き換え

### Phase 2: 日付形式の統一（優先度: 中）

- 他の日付表示と形式を統一（`trip-date-string-i18n-unification.md`の内容と統合）

---

## 🔧 実装詳細

### Step 1: i18nキーの追加

`lib/i18n/index.ts`に以下を追加:

```typescript
// Date formatting
| 'date.notSet'
| 'date.format.yearMonthDay' // 年月日形式
| 'date.format.monthDayYear' // MM/DD/YYYY形式
```

**英語**:
```typescript
'date.notSet': 'Date not set',
'date.format.yearMonthDay': '{year}/{month}/{day}', // 例: 2025/11/8
```

**日本語**:
```typescript
'date.notSet': '日付が設定されていません',
'date.format.yearMonthDay': '{year}年{month}月{day}日', // 例: 2025年11月8日
```

### Step 2: `formatTripDateRange`関数の修正

```typescript
formatTripDateRange: (
  startDate: FirestoreDate, 
  endDate: FirestoreDate,
  language?: SupportedLanguage // 追加
): string => {
  if (!dateUtils.isValidDate(startDate) || !dateUtils.isValidDate(endDate)) {
    return t('date.notSet') // i18n化
  }
  
  const start = toDateOrNull(startDate)
  const end = toDateOrNull(endDate)
  
  if (!start || !end) {
    return t('date.notSet') // i18n化
  }
  
  // 言語を取得（パラメータが指定されていない場合は自動取得）
  const lang = language || getUserLanguage()
  const locale = lang === 'ja' ? 'ja-JP' : 'en-US'
  
  const startYear = start.getFullYear()
  const startMonth = start.getMonth() + 1
  const startDay = start.getDate()
  const startWeekday = start.toLocaleDateString(locale, { weekday: 'short' }) // 動的ロケール
  
  const endYear = end.getFullYear()
  const endMonth = end.getMonth() + 1
  const endDay = end.getDate()
  const endWeekday = end.toLocaleDateString(locale, { weekday: 'short' }) // 動的ロケール
  
  // 言語に応じた日付形式の生成
  if (lang === 'ja') {
    // 日本語形式: 「2025年11月8日(土) - 9(日)」
    if (startYear === endYear) {
      if (startMonth === endMonth) {
        return `${startYear}年${startMonth}月${startDay}日 (${startWeekday}) - ${endDay} (${endWeekday})`
      } else {
        return `${startYear}年${startMonth}月${startDay}日 (${startWeekday}) - ${endMonth}月${endDay}日(${endWeekday})`
      }
    } else {
      return `${startYear}年${startMonth}月${startDay}日 (${startWeekday}) - ${endYear}年${endMonth}月${endDay}日 (${endWeekday})`
    }
  } else {
    // 英語形式: 「Nov 8, 2025 (Sat) - 9 (Sun)」
    if (startYear === endYear) {
      if (startMonth === endMonth) {
        return `${start.toLocaleDateString(locale, { month: 'short', day: 'numeric' })} (${startWeekday}) - ${endDay} (${endWeekday})`
      } else {
        return `${start.toLocaleDateString(locale, { month: 'short', day: 'numeric' })} (${startWeekday}) - ${end.toLocaleDateString(locale, { month: 'short', day: 'numeric' })} (${endWeekday})`
      }
    } else {
      return `${start.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' })} (${startWeekday}) - ${end.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' })} (${endWeekday})`
    }
  }
}
```

### Step 3: TripHeroSectionの修正

```tsx
import { getUserLanguage } from '@/lib/utils/language'
import { useAuth } from '@/lib/contexts/auth'
import { t } from '@/lib/i18n'

export default function TripHeroSection({ ... }: TripHeroSectionProps) {
  const { user } = useAuth()
  const currentLanguage = getUserLanguage(user)
  
  // ...
  
  <span className="text-lg font-medium">
    {trip.start_date && trip.end_date 
      ? dateUtils.formatTripDateRange(trip.start_date, trip.end_date, currentLanguage)
      : t('date.notSet')
    }
  </span>
}
```

### 代替案: より簡潔な実装

`Intl.DateTimeFormat`を使用して、言語に応じた日付形式を自動生成:

```typescript
formatTripDateRange: (
  startDate: FirestoreDate, 
  endDate: FirestoreDate,
  language?: SupportedLanguage
): string => {
  // ... バリデーション ...
  
  const lang = language || getUserLanguage()
  const locale = lang === 'ja' ? 'ja-JP' : 'en-US'
  
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  })
  
  // 開始日と終了日が同じ月の場合の処理など
  // ...
}
```

---

## 📝 実装計画

### Phase 1: TripHeroSectionのi18n化（優先度: 高）

1. ✅ i18nキーを追加（`date.notSet`）
2. ✅ `formatTripDateRange`関数に言語パラメータを追加
3. ✅ 日付フォーマットをロケール対応に修正
4. ✅ TripHeroSectionで言語を渡すように修正
5. ✅ テスト実施（英語・日本語）

**見積もり**: 1-2時間

### Phase 2: 他の使用箇所のi18n化（優先度: 中）

- `formatTripDateRange`を使用している他のコンポーネントも同様に対応
- 既存Issue（`trip-date-string-i18n-unification.md`）と統合

---

## 🔗 関連ファイル

- `components/trip/TripHeroSection.tsx` - 旅行詳細ページのヒーローセクション（約103行）
- `lib/utils/date.ts` - 日付ユーティリティ関数（約361行）
  - `formatTripDateRange`関数（242-277行目）
- `lib/i18n/index.ts` - i18n辞書
- `docs/issues/trip-date-string-i18n-unification.md` - 関連Issue（全体的な日付フォーマット統一）

---

## ✅ 完了条件

- [ ] `formatTripDateRange`関数が言語パラメータを受け取る
- [ ] 日付表示がユーザーの言語設定に応じて適切に表示される
  - 日本語設定時: 「2025年11月8日(土) - 9(日)」
  - 英語設定時: 「Nov 8, 2025 (Sat) - 9 (Sun)」など
- [ ] エラーメッセージがi18n化される
- [ ] 既存の機能に影響がない
- [ ] 英語・日本語の両方で正常に動作することを確認

---

## ✅ 解決内容（Phase 1完了）

### Phase 1: `formatTripDateRange`関数のi18n化 ✅ 完了（2025-11-01）

1. **`formatTripDateRange`関数の修正** ✅
   - 言語パラメータ（`language: 'ja' | 'en' = 'ja'`）を追加
   - デフォルトは`'ja'`で後方互換性を維持
   - エラーの場合は空文字列を返し、コンポーネント側でi18nメッセージを表示

2. **日付フォーマットの言語対応** ✅
   - **日本語**: 「2025年11月8日(土) - 9(日)」形式（既存の形式を維持）
   - **英語**: "Nov 8 (Sat) - 9 (Sun)" 形式（年月が異なる場合は "Nov 8, 2025 (Sat) - Jan 9, 2026 (Sun)"）
   - `toLocaleDateString()`に動的なロケール（`ja-JP` / `en-US`）を適用

3. **TripHeroSection.tsxの修正** ✅
   - `useAuth()`と`getUserLanguage()`を使用してユーザーの言語設定を取得
   - `dateUtils.formatTripDateRange()`に言語パラメータを渡す
   - エラーメッセージ「日付が設定されていません」を`t('date.notSet')`に置き換え

4. **実装結果**
   - 英語設定時: "Nov 8 (Sat) - 9 (Sun)" 形式で表示
   - 日本語設定時: 「2025年11月8日(土) - 9(日)」形式で表示
   - 日付が未設定の場合: 言語に応じたエラーメッセージを表示
   - 既存の機能に影響なし（デフォルトは日本語で後方互換性を維持）

### Phase 2: 日付形式の統一（優先度: 中、未実装）

- 他の日付表示と形式を統一（`trip-date-string-i18n-unification.md`の内容と統合）

---

## 📝 技術的検討事項

### 日付形式の選択

#### 日本語形式の例
- 「2025年11月8日(土) - 9(日)」
- 「2025年11月8日(土) - 11月9日(日)」
- 「2025年11月8日(土) - 2026年1月10日(日)」

#### 英語形式の例
- "Nov 8, 2025 (Sat) - 9 (Sun)"
- "Nov 8, 2025 (Sat) - Nov 9 (Sun)"
- "Nov 8, 2025 (Sat) - Jan 10, 2026 (Sun)"

### 曜日の表示

- 日本語: 「(土)」「(日)」
- 英語: 「(Sat)」「(Sun)」
- `toLocaleDateString(locale, { weekday: 'short' })`で自動的に適切な形式になる

### 日付の省略規則

現在の実装では、同じ年・同じ月の場合は省略されていますが、これも言語によって適切に処理する必要があります。

---

## 🔍 参考

- `docs/issues/trip-date-string-i18n-unification.md` - 全体的な日付フォーマットの統一とi18n化
- `docs/specifications/unified-date-range-display.md` - 統一日付範囲表示の仕様

---

## 💡 実装時の注意事項

1. **既存の呼び出し箇所への影響**
   - `formatTripDateRange`を使用している他のコンポーネントを確認
   - 後方互換性を保つため、言語パラメータはオプショナルにする

2. **パフォーマンス**
   - 言語取得の処理を最適化（キャッシュなどを検討）

3. **テスト**
   - 英語・日本語の両方で動作確認
   - 年跨ぎ、月跨ぎのケースも確認
   - 単日の旅行も確認

---

## 🎯 優先度の根拠

TripHeroSectionは旅行詳細ページの最上部に表示される重要な要素であり、ユーザーが最初に目にする情報です。言語設定に応じた適切な表示は、ユーザー体験にとって重要な要素です。

