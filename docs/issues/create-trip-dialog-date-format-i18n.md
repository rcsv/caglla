# Issue: Create New Tripダイアログの日付フィールドのi18n化

**作成日**: 2025-11-01  
**状態**: 🔴 未解決  
**優先度**: 中  
**種類**: i18n化、UX改善  
**関連ファイル**: 
- `components/common/CreateTripDialog.tsx`（日付入力フィールド）
- `components/common/Input.tsx`（Inputコンポーネント）
- `lib/i18n/index.ts`（i18n辞書）

---

## 📋 概要

Create New TripダイアログのStart Date、End Dateフィールドで、以下の問題が発生している：

1. **Placeholderが年・月・日の順番で残っている**: HTMLの`<input type="date">`は、ブラウザのデフォルトロケールに基づいてplaceholderを表示するが、日本語ロケールでは「年・月・日」という形式が表示され、英語ロケールでは「MM/DD/YYYY」などの形式が表示される。しかし、言語設定に関わらず適切な形式を表示する必要がある。

2. **日付フィールドの順番が言語に最適化されていない**: 各言語の主要地域で最も親しまれている日付形式の順番に合わせる必要がある（例: 日本語は「年月日」、英語は「MM/DD/YYYY」）。

---

## 🐛 問題の詳細

### 現状の問題

#### 1. Placeholderの形式

**ファイル**: `components/common/CreateTripDialog.tsx` (301-322行目)

```tsx
<Input
  label={t('trip.create.startDate.label')}
  type="date"
  id="startDate"
  name="startDate"
  value={formData.startDate}
  onChange={handleInputChange}
  required
  error={dateError ? t('trip.create.dateError') : undefined}
/>
```

**問題点**:
- HTMLの`<input type="date">`は、ブラウザのロケール設定に基づいてplaceholderを自動表示する
- 日本語ロケールでは「年・月・日」、英語ロケールでは「MM/DD/YYYY」などが表示される
- しかし、アプリケーションの言語設定とブラウザのロケール設定が一致しない場合、不適切な形式が表示される可能性がある
- 明示的なplaceholder属性が設定されていないため、ユーザーに適切なガイドが提供されていない

#### 2. 日付フィールドの順番

**現状**:
- 日付入力フィールドは`type="date"`を使用しているため、ブラウザによって表示形式が異なる
- 日本語環境では「年・月・日」の順番で表示されるが、英語環境では「MM/DD/YYYY」形式が一般的
- 言語設定に関わらず、その言語の主要地域で最も親しまれている形式で表示する必要がある

**影響**:
- ユーザーの期待と異なる形式が表示される可能性がある
- 特に国際化されたアプリケーションでは、統一感のないUXになる

---

## 💡 実装方針

### Phase 1: Placeholderのi18n化

1. **日付形式のプレースホルダーをi18nキーとして追加**
   - 日本語: 「YYYY年MM月DD日」または「年・月・日」
   - 英語: 「YYYY-MM-DD」または「MM/DD/YYYY」

2. **Inputコンポーネントの拡張**
   - `type="date"`の場合、placeholder属性を動的に設定
   - i18nキーから取得したプレースホルダーを適用

3. **実装例**:
```tsx
<Input
  label={t('trip.create.startDate.label')}
  type="date"
  placeholder={t('trip.create.startDate.placeholder')} // 新規追加
  // ... 他のプロパティ
/>
```

### Phase 2: 日付フィールドの順番の言語適応

1. **日付形式の言語別定義**
   - 日本語: 「年月日」形式（`YYYY-MM-DD`）
   - 英語: 「MM/DD/YYYY」形式（一部地域では`DD/MM/YYYY`）
   - その他の言語: 適切な形式を定義

2. **実装方法の検討**

   **案1: HTML5 date input + pattern属性**
   ```tsx
   <Input
     type="date"
     pattern={getDatePattern(language)} // 言語に応じたパターン
     // ...
   />
   ```
   - 問題点: HTML5の`type="date"`はブラウザによって制御されるため、完全なカスタマイズが困難

   **案2: カスタム日付入力コンポーネント**
   ```tsx
   <DateInput
     locale={language}
     format={getDateFormat(language)}
     // ...
   />
   ```
   - 利点: 完全な制御が可能
   - 問題点: 実装コストが高い、アクセシビリティ対応が必要

   **案3: inputmode + placeholder + ガイダンス**
   ```tsx
   <Input
     type="date"
     placeholder={t('trip.create.startDate.placeholder')}
     aria-label={t('trip.create.startDate.ariaLabel')} // 詳細な説明
     // ...
   />
   ```
   - 利点: 実装が簡単
   - 問題点: ブラウザの表示形式は変更できない

3. **推奨アプローチ**
   - **Phase 1**: Placeholderをi18n化（即座に実装可能）
   - **Phase 2**: 言語設定に基づいて、適切な日付形式のガイダンスを表示（実装コストを考慮して段階的に実装）

---

## 🎨 UIデザイン案

### 日本語環境
```
出発日 *
[YYYY年MM月DD日] ← placeholder
```

### 英語環境
```
Start Date *
[MM/DD/YYYY] ← placeholder
```

### 追加のガイダンス（オプション）
```
出発日 *
[YYYY年MM月DD日]
（例: 2024年12月25日）
```

---

## 🔍 技術的調査

### HTML5 Date Inputの制限

1. **ブラウザによる制御**: `<input type="date">`は、ブラウザのロケール設定に基づいて表示形式が決定される
2. **カスタマイズの制限**: JavaScriptで直接表示形式を変更することはできない
3. **Placeholder**: HTML5 date inputでは、placeholderは通常無視される（ブラウザが自動的に表示形式を提供するため）

### 解決策の検討

1. **Placeholder属性の追加**: ブラウザによっては無視されるが、一部のブラウザやスクリーンリーダーでは有効
2. **aria-label/aria-describedby**: アクセシビリティ向上のため、詳細な説明を提供
3. **ヘルプテキスト**: フィールドの下に例示テキストを表示

---

## 📝 実装計画

### Step 1: i18nキーの追加

`lib/i18n/index.ts`に以下を追加:

```typescript
// Date Placeholders
| 'trip.create.startDate.placeholder'
| 'trip.create.endDate.placeholder'
| 'trip.create.startDate.example'
| 'trip.create.endDate.example'
```

**英語**:
```typescript
'trip.create.startDate.placeholder': 'YYYY-MM-DD',
'trip.create.endDate.placeholder': 'YYYY-MM-DD',
'trip.create.startDate.example': 'Example: 2024-12-25',
'trip.create.endDate.example': 'Example: 2024-12-31',
```

**日本語**:
```typescript
'trip.create.startDate.placeholder': 'YYYY年MM月DD日',
'trip.create.endDate.placeholder': 'YYYY年MM月DD日',
'trip.create.startDate.example': '例: 2024年12月25日',
'trip.create.endDate.example': '例: 2024年12月31日',
```

### Step 2: CreateTripDialogの修正

1. **placeholder属性の追加**
   ```tsx
   <Input
     label={t('trip.create.startDate.label')}
     type="date"
     placeholder={t('trip.create.startDate.placeholder')}
     // ...
   />
   ```

2. **ヘルプテキストの追加（オプション）**
   ```tsx
   <Input
     // ...
   />
   <p className="text-xs text-gray-500 mt-1">
     {t('trip.create.startDate.example')}
   </p>
   ```

### Step 3: Inputコンポーネントの確認

- `components/common/Input.tsx`がplaceholder属性を適切に処理しているか確認
- `type="date"`の場合の特別な処理が必要かどうか検討

---

## 🔗 関連ファイル

- `components/common/CreateTripDialog.tsx` - Create New Tripダイアログ（約471行）
- `components/common/Input.tsx` - Inputコンポーネント
- `lib/i18n/index.ts` - i18n辞書（約1640行）

---

## ✅ 完了条件

- [ ] Start Date、End Dateフィールドにi18n対応のplaceholderを追加
- [ ] 各言語で適切な日付形式のプレースホルダーが表示される
- [ ] アクセシビリティ対応（aria-label/aria-describedbyの追加を検討）
- [ ] 既存の日付入力機能に影響しない
- [ ] 日本語・英語の両方で正常に動作することを確認
- [ ] ブラウザのデフォルト動作との互換性を確認

---

## 📝 技術的検討事項

### Placeholderの表示について

- HTML5の`type="date"`は、ブラウザによってplaceholderが無視される場合がある
- 代替案として、フィールドの下に例示テキストを表示する方法を検討

### 日付形式の統一について

- HTML5 date inputは、ブラウザのロケール設定に基づいて表示形式が決まる
- 完全なカスタマイズは困難だが、ガイダンステキストで補完可能

### アクセシビリティ

- スクリーンリーダーユーザーに対して、適切な日付形式を案内する必要がある
- `aria-label`や`aria-describedby`の活用を検討

---

## 🔍 実装可能性の評価

### 可能性: 高（Phase 1）、中（Phase 2）

**Phase 1（Placeholderのi18n化）**:
- ✅ 実装コスト: 低
- ✅ 影響範囲: 小
- ✅ 即座に実装可能

**Phase 2（日付フィールドの順番の言語適応）**:
- ⚠️ 実装コスト: 中〜高（カスタムコンポーネントの場合）
- ⚠️ 影響範囲: 中
- ⚠️ HTML5 date inputの制限により、完全な実装は困難

### 推奨アプローチ

1. **Phase 1を優先的に実装**: Placeholderとヘルプテキストのi18n化
2. **Phase 2は段階的に検討**: ユーザーフィードバックを収集してから実装方法を決定

