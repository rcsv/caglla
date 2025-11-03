# Issue: DayEditorの「この日は何をする日？」placeholderのi18n化

**作成日**: 2025-11-01  
**状態**: 🔴 未解決  
**優先度**: 中  
**種類**: i18n化  
**関連ファイル**: 
- `components/trip/DayEditor.tsx` - DayEditorコンポーネント
- `components/trip/TripItineraryView.tsx` - `generateItinerarySummary`関数
- `lib/i18n/index.ts` - i18n辞書

---

## 📋 概要

DayEditorコンポーネントで使用されている「この日は何をする日？」というplaceholderが日本語でハードコードされており、英語設定時でも日本語が表示されています。また、編集時の説明文（「Enterで改行、Escapeでキャンセル、他の場所をクリックで保存」）や「クリックして編集」などのメッセージも日本語でハードコードされています。

---

## 🐛 問題の詳細

### 現状の問題

**ファイル**: `components/trip/DayEditor.tsx` (69行目、103行目、77-79行目、94-95行目)

```tsx
// 編集モード時のplaceholder（69行目）
<textarea
  placeholder={itinerarySummary || "この日は何をする日？"}  // ← ハードコード
  // ...
/>

// 非編集モード時のプレースホルダー表示（103行目）
<p className="text-gray-400 italic">{itinerarySummary || "この日は何をする日？"}</p>  // ← ハードコード

// 保存中メッセージ（75行目）
<p className="text-sm text-gray-500">保存中...</p>  // ← ハードコード

// 編集説明文（77-79行目）
<p className="text-xs text-gray-400">
  Enterで改行、Escapeでキャンセル、他の場所をクリックで保存  // ← ハードコード
</p>

// 編集可能なヒント（94-96行目）
<p className="mt-1 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
  クリックして編集  // ← ハードコード
</p>
```

### 影響

- **日本語設定時**: 「この日は何をする日？」 ✅ 正常
- **英語設定時**: 「この日は何をする日？」 ❌ 日本語のまま表示される（期待値: "What are you doing today?" など）

### 根本原因

1. **placeholderのハードコード**
   - `itinerarySummary`が空の場合のフォールバックテキストが日本語で固定
   - `generateItinerarySummary`関数は空文字列を返すため、常にフォールバックが表示される

2. **`generateItinerarySummary`関数の実装**
   - `components/trip/TripItineraryView.tsx`の77-84行目で定義
   - Itinerary配列が空の場合は空文字列を返す
   - Itineraryがある場合はタイトルを` → `で連結

3. **その他の日本語メッセージ**
   - 保存中メッセージ、編集説明文、ヒントテキストも日本語でハードコード

---

## 🔍 関連する処理フロー

### `itinerarySummary`の生成フロー

1. **`TripItineraryView.tsx`** (199行目)
   ```typescript
   const itinerarySummary = generateItinerarySummary(day)
   ```

2. **`generateItinerarySummary`関数** (77-84行目)
   ```typescript
   const generateItinerarySummary = (day: Day): string => {
     if (!day.itineraries || day.itineraries.length === 0) {
       return ''  // ← 空文字列を返す
     }
     
     const sortedItineraries = [...day.itineraries].sort((a, b) => a.sort_number - b.sort_number)
     return sortedItineraries.map(itinerary => itinerary.title).join(' → ')  // ← 日本語の矢印を使用
   }
   ```

3. **`DayEditor.tsx`** (296行目でpropsとして受け取り)
   ```typescript
   <DayEditor 
     day={day} 
     itinerarySummary={itinerarySummary}  // ← 空文字列または「タイトル1 → タイトル2」
     // ...
   />
   ```

4. **フォールバック処理** (69行目、103行目)
   ```typescript
   placeholder={itinerarySummary || "この日は何をする日？"}  // ← 空文字列の場合にハードコードされた日本語を使用
   ```

### 問題点

1. **空文字列の扱い**
   - `generateItinerarySummary`が空文字列を返す場合、常に「この日は何をする日？」が表示される
   - 英語設定時も日本語が表示される

2. **`→`のハードコード**
   - `join(' → ')`で日本語の矢印（全角）を使用
   - 英語設定時は`→`（半角）や`→`の方が適切

---

## 💡 解決方針

### Phase 1: DayEditorコンポーネントのi18n化（優先度: 高）

1. **i18nキーの追加**
   - `dayEditor.placeholder`: 「この日は何をする日？」 / "What are you doing today?"
   - `dayEditor.saving`: 「保存中...」 / "Saving..."
   - `dayEditor.editHint`: 「Enterで改行、Escapeでキャンセル、他の場所をクリックで保存」 / "Enter for new line, Escape to cancel, click elsewhere to save"
   - `dayEditor.clickToEdit`: 「クリックして編集」 / "Click to edit"

2. **`DayEditor.tsx`の修正**
   - すべてのハードコード文字列を`t()`に置き換え

### Phase 2: `generateItinerarySummary`関数の改善（優先度: 中）

1. **矢印文字のi18n対応**
   - 英語設定時: `→`（半角矢印）または` → `（スペース付き）
   - 日本語設定時: `→`（全角矢印）のまま

2. **関数の引数に言語パラメータを追加**
   - または、`getUserLanguage()`を使用して自動的に言語を取得

### Phase 3: 空文字列の扱いの改善（優先度: 低）

- `generateItinerarySummary`が空文字列を返す場合でも、`DayEditor`側で適切なplaceholderを表示する

---

## 🔧 実装詳細

### Step 1: i18nキーの追加

`lib/i18n/index.ts`に以下を追加:

```typescript
// Day Editor
| 'dayEditor.placeholder'
| 'dayEditor.saving'
| 'dayEditor.editHint'
| 'dayEditor.clickToEdit'
| 'dayEditor.itinerarySeparator'  // → や → の選択用
```

**英語**:
```typescript
'dayEditor.placeholder': 'What are you doing today?',
'dayEditor.saving': 'Saving...',
'dayEditor.editHint': 'Enter for new line, Escape to cancel, click elsewhere to save',
'dayEditor.clickToEdit': 'Click to edit',
'dayEditor.itinerarySeparator': ' → ',  // 半角矢印
```

**日本語**:
```typescript
'dayEditor.placeholder': 'この日は何をする日？',
'dayEditor.saving': '保存中...',
'dayEditor.editHint': 'Enterで改行、Escapeでキャンセル、他の場所をクリックで保存',
'dayEditor.clickToEdit': 'クリックして編集',
'dayEditor.itinerarySeparator': ' → ',  // 全角矢印
```

### Step 2: DayEditorコンポーネントの修正

```tsx
import { t } from '@/lib/i18n'

export default function DayEditor({ ... }: DayEditorProps) {
  // ...
  
  if (isEditing) {
    return (
      <div className="space-y-2">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={itinerarySummary || t('dayEditor.placeholder')}  // ← i18n化
          className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
          autoFocus
        />
        {isLoading && (
          <p className="text-sm text-gray-500">{t('dayEditor.saving')}</p>  // ← i18n化
        )}
        <p className="text-xs text-gray-400">
          {t('dayEditor.editHint')}  // ← i18n化
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {day.description ? (
          <div 
            className="group cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
            onClick={() => setIsEditing(true)}
          >
            <p className="text-gray-600 whitespace-pre-wrap">{day.description}</p>
            <p className="mt-1 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
              {t('dayEditor.clickToEdit')}  // ← i18n化
            </p>
          </div>
        ) : (
          <div 
            className="cursor-pointer hover:bg-gray-50 p-3 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors"
            onClick={() => setIsEditing(true)}
          >
            <p className="text-gray-400 italic">{itinerarySummary || t('dayEditor.placeholder')}</p>  // ← i18n化
          </div>
        )}
      </div>
      {/* ... */}
    </div>
  )
}
```

### Step 3: `generateItinerarySummary`関数の改善（オプション）

```typescript
// TripItineraryView.tsx
import { t } from '@/lib/i18n'
import { getUserLanguage } from '@/lib/utils/language'
import { useAuth } from '@/lib/contexts/auth'

export default function TripItineraryView({ ... }: TripItineraryViewProps) {
  const { user } = useAuth()
  const currentLanguage = getUserLanguage(user)
  
  // itinerariesのタイトルを生成する関数
  const generateItinerarySummary = (day: Day): string => {
    if (!day.itineraries || day.itineraries.length === 0) {
      return ''
    }
    
    const sortedItineraries = [...day.itineraries].sort((a, b) => a.sort_number - b.sort_number)
    const separator = t('dayEditor.itinerarySeparator')  // 言語に応じた矢印
    return sortedItineraries.map(itinerary => itinerary.title).join(separator)
  }
  
  // ...
}
```

---

## 📝 実装計画

### Phase 1: DayEditorのi18n化（優先度: 高）

1. ✅ i18nキーを追加（`dayEditor.placeholder`, `dayEditor.saving`, `dayEditor.editHint`, `dayEditor.clickToEdit`）
2. ✅ `DayEditor.tsx`を修正（すべてのハードコード文字列を`t()`に置き換え）
3. ✅ テスト実施（英語・日本語）

**見積もり**: 30分〜1時間

### Phase 2: `generateItinerarySummary`の改善（優先度: 中）

1. `dayEditor.itinerarySeparator`キーを追加
2. `generateItinerarySummary`関数に言語パラメータを追加
3. テスト実施

**見積もり**: 30分

### Phase 3: 空文字列の扱いの改善（優先度: 低）

- `generateItinerarySummary`の返り値の扱いを改善
- 必要に応じて関数の返り値を変更

**見積もり**: 15分

---

## 🔗 関連ファイル

- `components/trip/DayEditor.tsx` - DayEditorコンポーネント（約121行）
  - 69行目: placeholder
  - 75行目: 保存中メッセージ
  - 77-79行目: 編集説明文
  - 94-96行目: クリックして編集
  - 103行目: 非編集モード時のプレースホルダー
- `components/trip/TripItineraryView.tsx` - TripItineraryViewコンポーネント（約462行）
  - 77-84行目: `generateItinerarySummary`関数
  - 199行目: `generateItinerarySummary`の呼び出し
  - 296行目: `DayEditor`への`itinerarySummary`の受け渡し
- `lib/i18n/index.ts` - i18n辞書

---

## ✅ 完了条件

### Phase 1
- [ ] i18nキーが追加される（`dayEditor.placeholder`, `dayEditor.saving`, `dayEditor.editHint`, `dayEditor.clickToEdit`）
- [ ] `DayEditor.tsx`のすべてのハードコード文字列がi18n化される
- [ ] 英語設定時: "What are you doing today?" が表示される
- [ ] 日本語設定時: 「この日は何をする日？」が表示される
- [ ] 既存の機能に影響がない

### Phase 2（オプション）
- [ ] `dayEditor.itinerarySeparator`キーが追加される
- [ ] `generateItinerarySummary`関数が言語に応じた矢印を使用する
- [ ] 英語設定時: ` → `（半角矢印）が使用される
- [ ] 日本語設定時: ` → `（全角矢印）が使用される

---

## 📝 技術的検討事項

### placeholderの扱い

`itinerarySummary`が空文字列の場合のフォールバック処理：

```typescript
// 現在
placeholder={itinerarySummary || "この日は何をする日？"}

// 修正後
placeholder={itinerarySummary || t('dayEditor.placeholder')}
```

**注意**: `itinerarySummary`が空文字列（`''`）の場合、JavaScriptでは`'' || value`は`value`を返すため、このロジックは正しく動作します。

### 矢印文字の選択

- **全角矢印**: `→`（日本語環境で一般的）
- **半角矢印**: `→`（英語環境で一般的）
- **スペース**: 両方の環境で適切に表示されるようにスペースを付ける

### 関数の言語パラメータ

`generateItinerarySummary`関数に言語パラメータを追加する場合：

```typescript
const generateItinerarySummary = (day: Day, language?: SupportedLanguage): string => {
  // ...
  const separator = language === 'ja' ? ' → ' : ' → '
  return sortedItineraries.map(itinerary => itinerary.title).join(separator)
}
```

または、コンポーネント内で`getUserLanguage()`を使用：

```typescript
const currentLanguage = getUserLanguage(user)
const separator = t('dayEditor.itinerarySeparator')
```

---

## 💭 実装時の注意事項

1. **既存の動作を維持**
   - `itinerarySummary`が設定されている場合は、それを優先表示
   - 空の場合のみi18n化されたplaceholderを表示

2. **テストケース**
   - Itineraryが0件の場合: placeholderが表示される
   - Itineraryが1件以上の場合: `itinerarySummary`が表示される
   - 英語設定時と日本語設定時の両方で動作確認

3. **パフォーマンス**
   - `t()`関数の呼び出しは軽量なので、パフォーマンスへの影響は小さい

---

## 🔍 参考

- `docs/issues/create-trip-dialog-i18n.md` - CreateTripDialogのi18n化実装例
- `docs/issues/checklist-i18n.md` - Checklistのi18n化実装例

