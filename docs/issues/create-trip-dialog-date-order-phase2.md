# Issue: Create New Tripダイアログの日付フィールド順番の言語適応（Phase 2）

**作成日**: 2025-11-01  
**状態**: 🔵 未実装（Feature）  
**優先度**: 低  
**種類**: Feature要望、UX改善  
**関連ファイル**: 
- `components/common/CreateTripDialog.tsx`（日付入力フィールド）
- `components/common/Input.tsx`（Inputコンポーネント）
- カスタム日付入力コンポーネント（新規作成が必要）

---

## 📋 概要

Create New Tripダイアログの日付フィールドの入力順番を、各言語の主要地域で最も親しまれている形式に合わせる。Phase 1（placeholderとヘルプテキストのi18n化）の残務として、日付フィールドの表示順番を言語設定に応じて最適化する。

**注意**: HTML5 `<input type="date">`の制限により、完全な実装にはカスタム日付入力コンポーネントの開発が必要。ユーザーフィードバックを収集してから優先度を判断する。

---

## 🎯 背景

### Phase 1完了状況

Phase 1では以下を実装済み:
- ✅ 日付フィールドにplaceholderを追加（YYYY-MM-DD形式）
- ✅ ヒントテキストを追加（例示フォーマット）
- ✅ 日本語・英語の両方に対応

### Phase 2で実現したいこと

現在のHTML5 `type="date"`は、ブラウザのロケール設定に基づいて表示形式が決定される。しかし、アプリケーションの言語設定とブラウザのロケール設定が一致しない場合、不適切な形式が表示される可能性がある。

**目標**: 言語設定に応じて、適切な日付入力UIを表示する

---

## 🐛 問題の詳細

### 現状の制限

1. **ブラウザ依存の表示**: HTML5 `<input type="date">`は、ブラウザのロケール設定によって表示形式が決まる
   - 日本語ロケール: 「年・月・日」のカラムセレクター
   - 英語ロケール: 「MM/DD/YYYY」形式

2. **言語設定との不一致**: アプリケーションの言語設定とブラウザのロケール設定が異なる場合:
   - 日本語環境で英語設定: 英語形式が表示される
   - 英語環境で日本語設定: 日本語形式が表示される

3. **入力順番の違い**: 
   - 日本語: 「年月日」の順番（YYYY-MM-DD相当）
   - 英語: 「月日年」の順番（MM/DD/YYYY）
   - その他の言語: 様々な形式

---

## 💡 実装方針

### アプローチ1: カスタム日付入力コンポーネント（推奨）

完全な制御が必要な場合、カスタム日付入力コンポーネントを作成する。

**利点**:
- ✅ 完全な言語適応が可能
- ✅ 統一されたUX
- ✅ アプリケーション設定に基づく表示

**問題点**:
- ⚠️ 実装コストが高い
- ⚠️ アクセシビリティ対応が必要（キーボード操作、スクリーンリーダー）
- ⚠️ モバイル端末での入力方式との整合性
- ⚠️ バリデーション、エラーハンドリングの実装

**実装例**:
```tsx
// 新しいコンポーネント: components/common/DateInput.tsx
interface DateInputProps {
  value: string
  onChange: (value: string) => void
  locale: 'en' | 'ja'
  format: 'YYYY-MM-DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY'
  // ... 他のプロパティ
}

export const DateInput: React.FC<DateInputProps> = ({
  value,
  onChange,
  locale,
  format,
  // ...
}) => {
  // 言語とフォーマットに基づいた日付入力UIを実装
  return (
    <div className="date-input">
      {/* カスタム日付セレクター */}
    </div>
  )
}
```

### アプローチ2: 言語別のデフォルト値設定

カスタムコンポーネントを作らず、言語設定に基づいて適切なフォーマットを提案する。

**利点**:
- ✅ 実装コストが低い
- ✅ 既存のHTML5 date inputを活用

**問題点**:
- ⚠️ 完全な制御ができない
- ⚠️ ブラウザ依存の問題が残る

### アプローチ3: ハイブリッドアプローチ（推奨）

基本的にはHTML5 date inputを使用し、言語設定とブラウザ設定が異なる場合にのみカスタム入力UIを表示する。

**利点**:
- ✅ 大部分のユーザーは既存のHTML5入力を使用
- ✅ 問題がある場合のみカスタムUIで補完
- ✅ 実装コストと効果のバランスが良い

---

## 🎨 UIデザイン案

### 日本語環境
```
出発日 *
[YYYY年MM月DD日]
例: 2024年12月25日
[年 ▼] [月 ▼] [日 ▼]  ← 縦に並んだセレクター
```

### 英語環境
```
Start Date *
[MM/DD/YYYY]
Example: 12/25/2024
[MM ▼] [DD ▼] [YYYY ▼]  ← 横に並んだセレクター
```

---

## 📝 実装計画（アプローチ1）

### Step 1: DateInputコンポーネントの設計

1. **プロパティ設計**
   ```typescript
   interface DateInputProps {
     value: string // ISO形式 (YYYY-MM-DD)
     onChange: (value: string) => void
     label: string
     locale: 'en' | 'ja'
     format: 'YYYY-MM-DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY'
     placeholder?: string
     hint?: string
     error?: string
     required?: boolean
     min?: string
     max?: string
     disabled?: boolean
   }
   ```

2. **内部状態管理**
   - 年、月、日の各セレクターの値
   - ISO形式への変換ロジック
   - バリデーション（日付の有効性、min/max制約）

### Step 2: UI実装

1. **セレクターUI**
   - ドロップダウンまたはスピナー
   - 言語・フォーマットに応じた順番
   - アクセシビリティ対応（aria-label、キーボード操作）

2. **バリデーション**
   - 日付の有効性チェック
   - うるう年の処理
   - min/max制約のチェック

### Step 3: 統合

1. **CreateTripDialog.tsx**で`DateInput`を使用
2. 既存のHTML5 date inputからの移行
3. 既存機能の互換性確認

---

## 🔗 関連ファイル

- `components/common/CreateTripDialog.tsx` - Create New Tripダイアログ（約471行）
- `components/common/Input.tsx` - Inputコンポーネント（現在`type="date"`を使用）
- `components/common/DateInput.tsx` - カスタム日付入力コンポーネント（新規作成）
- `lib/i18n/index.ts` - i18n辞書

---

## ✅ 完了条件

- [ ] DateInputコンポーネントの実装
- [ ] 日本語・英語の両方で適切な入力順番が表示される
- [ ] キーボード操作、スクリーンリーダー対応
- [ ] バリデーション（日付の有効性、min/max制約）
- [ ] CreateTripDialogへの統合
- [ ] 既存機能との互換性確認
- [ ] モバイル端末での動作確認

---

## 🔍 実装可能性の評価

### 可能性: 中

**実装コスト**: 中〜高
- DateInputコンポーネントの開発: 2-3日
- アクセシビリティ対応: 1日
- テスト・バグ修正: 1-2日

**影響範囲**: 中
- CreateTripDialogのみ
- 既存のInputコンポーネントへの影響なし

**優先度**: 低
- Phase 1で基本的な対応は完了
- HTML5 date inputのデフォルト動作で十分な可能性
- ユーザーフィードバックを収集してから判断

---

## 📊 優先度判断基準

以下の条件を満たす場合、本Issueの優先度を上げる:

1. **ユーザーから日付入力に関する苦情がある**
2. **ブラウザロケールとアプリ設定の不一致が頻繁に発生**
3. **アクセシビリティ要件として必須**
4. **他の機能開発が一段落した**

現時点では、Phase 1の実装により基本的なガイダンスが提供されているため、優先度は低としている。

---

## 🔗 関連Issue

- [Create New Tripダイアログの日付フィールドのi18n化](create-trip-dialog-date-format-i18n.md) - Phase 1（解決済み）

