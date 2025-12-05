# Issue: 旅行費用表示が日本語ハードコード

**作成日**: 2025-11-01  
**状態**: ✅ 解決済み  
**優先度**: 中  
**種類**: i18n不備  
**関連ファイル**: 
- `components/stats/TripCostDisplay.tsx`（旅行費用表示コンポーネント）
- `lib/utils/currency.ts`（通貨情報辞書）

---

## 📋 概要

旅行費用表示コンポーネント（`TripCostDisplay`）と通貨情報辞書（`CURRENCY_INFO`）で、タイトル、メッセージ、通貨名が日本語ハードコードされており、英語設定時でも日本語が表示される。

**更新**: 2025-11-01 - TripCostDisplayのメッセージ・ラベルはi18n化済み。通貨名のi18n化は未対応。  
**更新**: 2025-01-XX - Phase 2完了。37通貨×2キー（name, country）のi18n化を実装。`currencyUtils.getCurrencyInfo()`がi18n対応。

---

## 🐛 問題の詳細

### 1. TripCostDisplayコンポーネントの日本語（✅ 解決済み）

**ファイル**: `components/stats/TripCostDisplay.tsx`

#### 1.1: タイトル
- 19行目: `旅行費用`（費用がない場合のCardタイトル）
- 38行目: `旅行費用`（費用がある場合のCardタイトル）

#### 1.2: 空状態メッセージ
- 27行目: `費用情報が設定されたスケジュールがありません`
- 30行目: `各スケジュールに費用を設定すると、総費用が表示されます`

#### 1.3: その他のラベル
- 48行目: `({cost.count}件)`（件数表示）
- 62行目: `合計`（合計ラベル）
- 73行目: `💡 各スケジュールの費用をクリックして編集できます`（ヒントメッセージ）

### 2. 通貨情報辞書の日本語（🔴 未解決）

```typescript
const CURRENCY_INFO: Record<string, CurrencyInfo> = {
  'JPY': { code: 'JPY', name: '日本円', symbol: '¥', country: '日本' },
  'USD': { code: 'USD', name: '米ドル', symbol: '$', country: 'アメリカ' },
  'EUR': { code: 'EUR', name: 'ユーロ', symbol: '€', country: 'ヨーロッパ' },
  // ... 全ての通貨名・国名が日本語
}
```

この辞書は`TripCostDisplay`で使用され、通貨名が日本語で表示される（45行目: `{cost.currencyInfo.name}`）。

---

## 💡 解決方針

### Phase 1: TripCostDisplayのi18n化

**ファイル**: `components/stats/TripCostDisplay.tsx`

```typescript
import { t } from '@/lib/i18n'

// タイトル
<Card title={<div className="flex items-center">
  <MoneyIcon className="w-5 h-5 mr-2" color="#16a34a" />
  {t('cost.title')}
</div>}>

// 空状態メッセージ
<p className="text-gray-600 text-sm">
  {t('cost.empty')}
</p>
<p className="text-gray-500 text-xs mt-2">
  {t('cost.empty.description')}
</p>

// 件数表示
<span className="text-xs text-gray-500">
  ({cost.count}{t('cost.items')})
</span>

// 合計ラベル
<span className="text-sm font-medium text-gray-600">
  {t('cost.total')}
</span>

// ヒントメッセージ
<p className="text-xs text-gray-500">
  💡 {t('cost.hint.edit')}
</p>
```

### Phase 2: 通貨情報辞書のi18n化

**オプションA: 通貨名をi18nキーで取得（推奨）**

**ファイル**: `lib/utils/currency.ts`

```typescript
import { t } from '@/lib/i18n'
import type { TranslationKey } from '@/lib/i18n'

const CURRENCY_CODES = ['JPY', 'USD', 'EUR', 'GBP', /* ... */] as const

export const currencyUtils = {
  // 通貨コードから詳細情報を取得（i18n対応）
  getCurrencyInfo: (currencyCode: string): CurrencyInfo => {
    const baseInfo = CURRENCY_INFO[currencyCode]
    if (!baseInfo) {
      return {
        code: currencyCode,
        name: currencyCode,
        symbol: currencyCode,
        country: 'Unknown'
      }
    }
    
    // i18nキーから通貨名・国名を取得
    return {
      code: baseInfo.code,
      name: t(`currency.${currencyCode}.name` as TranslationKey),
      symbol: baseInfo.symbol, // シンボルは国際標準なので変更不要
      country: t(`currency.${currencyCode}.country` as TranslationKey)
    }
  },
  // ...
}
```

**ファイル**: `lib/i18n/index.ts`

```typescript
// Currency Names (50+ keys)
| 'currency.JPY.name'
| 'currency.JPY.country'
| 'currency.USD.name'
| 'currency.USD.country'
// ... 全通貨

// en辞書
'currency.JPY.name': 'Japanese Yen',
'currency.JPY.country': 'Japan',
'currency.USD.name': 'US Dollar',
'currency.USD.country': 'United States',
// ...

// ja辞書
'currency.JPY.name': '日本円',
'currency.JPY.country': '日本',
'currency.USD.name': '米ドル',
'currency.USD.country': 'アメリカ',
// ...
```

**オプションB: CURRENCY_INFOを分離（簡易実装）**

i18nキーを大量に追加する代わりに、`CURRENCY_INFO`を英語版と日本語版に分離:

```typescript
const CURRENCY_INFO_EN: Record<string, CurrencyInfo> = {
  'JPY': { code: 'JPY', name: 'Japanese Yen', symbol: '¥', country: 'Japan' },
  // ...
}

const CURRENCY_INFO_JA: Record<string, CurrencyInfo> = {
  'JPY': { code: 'JPY', name: '日本円', symbol: '¥', country: '日本' },
  // ...
}

export const currencyUtils = {
  getCurrencyInfo: (currencyCode: string): CurrencyInfo => {
    const lang = getUserLanguage() // 現在の言語設定を取得
    const info = lang === 'ja' ? CURRENCY_INFO_JA : CURRENCY_INFO_EN
    return info[currencyCode] || { /* fallback */ }
  },
  // ...
}
```

**推奨**: オプションA（i18nキーを使用）- 将来的に他の言語追加に対応しやすい

### Phase 3: i18nキーの追加

```typescript
// Travel Cost Display
| 'cost.title'
| 'cost.empty'
| 'cost.empty.description'
| 'cost.items'
| 'cost.total'
| 'cost.hint.edit'

// Currency Names (50+ keys)
| 'currency.JPY.name'
| 'currency.JPY.country'
// ... 全通貨
```

---

## 🔗 関連ファイル

- `components/stats/TripCostDisplay.tsx` - 旅行費用表示コンポーネント（約81行）
- `lib/utils/currency.ts` - 通貨情報辞書（約227行）
- `lib/i18n/index.ts` - i18n辞書（約1200行）

---

## ✅ 完了条件

- [ ] `TripCostDisplay`の全日本語文字列がi18n化される
- [ ] 通貨情報辞書がi18n化される（50+通貨）
- [ ] 英語設定時に全て英語で表示される（通貨名含む）
- [ ] 日本語設定時に全て日本語で表示される
- [ ] ビルドエラーがない
- [ ] ブラウザで動作確認済み（英語・日本語切り替えテスト）

---

## 📝 実装時の注意事項

1. **通貨シンボル**
   - 通貨シンボル（¥, $, €など）は国際標準なので変更不要
   - `symbol`フィールドはそのまま使用

2. **通貨数の多さ**
   - 約50通貨のi18nキーを追加する必要がある
   - TypeScriptの型定義も追加する必要がある（`TranslationKey`型）

3. **フォールバック**
   - 未定義の通貨コードに対するフォールバック処理を維持

4. **既存の使用箇所**
   - `currencyUtils.getCurrencyInfo()`を使用している箇所を確認
   - 全ての箇所で適切にi18n化された情報が表示されることを確認

5. **パフォーマンス**
   - 通貨情報の取得は頻繁に行われる可能性がある
   - `getCurrencyInfo`内で`t()`を呼び出すため、キャッシュは不要（i18nシステム側で管理）

---

## 🔍 参考

- 現在の通貨情報は`lib/utils/currency.ts`で約50通貨が定義されている
- `CurrencyInfo`型は`lib/core/types`で定義されている

