# Issue: プロフィールページで編集画面にならないと表示言語の選択ができない

**作成日**: 2025-10-31  
**状態**: 🔴 未解決  
**優先度**: 中  
**種類**: UX改善  
**関連ファイル**: 
- `app/[userSlug]/page.tsx`（プロフィールページ）
- `components/common/LanguageSwitcher.tsx`（存在する場合）

---

## 📋 概要

プロフィールページで、表示言語を変更するには「編集」ボタンを押して編集モードに入る必要がある。通常の表示モードでは言語選択UIが表示されず、言語を変更するには編集モードに入る必要がある。これにより、ユーザーは言語を変更するためにプロフィール全体を編集モードにする必要があり、UXが悪い。

---

## 🐛 問題の詳細

### 現状の問題

1. **通常の表示モード**
   - プロフィールページは通常、表示モード（`isEditing === false`）
   - 言語選択UIは編集モード（`isEditing === true`）でのみ表示される
   - 言語を変更するには「編集」ボタンを押す必要がある

2. **編集モードでの言語選択**
   - 「編集」ボタンを押すと、プロフィール全体が編集モードになる
   - 言語選択は`<select>`要素で表示される（373-388行目）
   - しかし、他のプロフィール項目（名前、自己紹介、居住地域など）も同時に編集可能になる
   - 言語だけを変更したい場合でも、編集モードに入る必要がある

3. **UXの問題**
   - 言語は比較的頻繁に変更したい設定
   - 他のプロフィール情報を変更する意図がない場合でも、編集モードに入る必要がある
   - 言語変更のハードルが高い

### 期待される動作

- **オプション1**: 通常の表示モードでも言語選択UIを表示する
  - ヘッダーやサイドバーなどに言語選択UIを常に表示
  - `LanguageSwitcher`コンポーネントを使用（他ページで使用されている可能性）
  - 言語のみを変更できる

- **オプション2**: 言語選択だけを簡単に変更できるUIを追加
  - 「言語設定」ボタンやドロップダウンを表示
  - 編集モードに入らずに言語のみを変更可能

---

## 🔍 技術的な詳細

### 現在の実装

`app/[userSlug]/page.tsx`の373-388行目：

```typescript
{isEditing && (
  // ... 他の編集フォーム ...
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.language')}</label>
    <select
      value={editForm.language}
      onChange={(e) => setEditForm({...editForm, language: e.target.value})}
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
    >
      <option value="">{t('profile.language.auto')}</option>
      {SUPPORTED_LANGUAGES.map((lang) => (
        <option key={lang} value={lang}>
          {LANGUAGE_NAMES[lang].native} / {LANGUAGE_NAMES[lang].en} ({lang})
        </option>
      ))}
    </select>
    <p className="mt-1 text-sm text-gray-500">
      {t('profile.language.description')}
    </p>
  </div>
)}
```

### 関連コンポーネント

- `components/common/LanguageSwitcher.tsx`（存在する可能性）
  - 他のページ（ランディングページなど）で使用されている言語切り替えUI
  - プロフィールページでも使用できる可能性がある

---

## 💡 解決方針

### Phase 1: 現状の確認

1. **`LanguageSwitcher`コンポーネントの確認**
   - `components/common/LanguageSwitcher.tsx`の存在確認
   - 使用箇所の確認
   - プロフィールページでの使用可能性の検討

2. **他のページでの言語選択UIの確認**
   - ランディングページやヘッダーでの言語選択UIの実装方法
   - プロフィールページへの適用可能性

### Phase 2: 実装方法の決定

#### オプションA: `LanguageSwitcher`コンポーネントを使用

- プロフィールページのヘッダー部分に`LanguageSwitcher`を追加
- 通常の表示モードでも言語選択が可能
- 既存のコンポーネントを再利用できる

#### 実装例：

```typescript
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'

// ... プロフィールページのJSX内 ...
<div className="flex items-center justify-between mb-4">
  <h1>{t('profile.title')}</h1>
  {!isEditing && (
    <LanguageSwitcher className="inline-block" />
  )}
</div>
```

#### オプションB: 言語選択専用のボタン/ドロップダウンを追加

- プロフィールページの右上などに言語選択UIを追加
- クリックするとドロップダウンが表示され、言語を選択可能
- 選択後は自動的に保存される（または確認ダイアログを表示）

#### 実装例：

```typescript
const [showLanguageSelector, setShowLanguageSelector] = useState(false)

// ... JSX内 ...
<button onClick={() => setShowLanguageSelector(!showLanguageSelector)}>
  🌐 {getCurrentLanguageName()}
</button>

{showLanguageSelector && (
  <LanguageSelectorDropdown
    currentLanguage={profileUser?.preferences?.language}
    onSelect={(lang) => {
      // 言語を更新（API呼び出し）
      updateUserLanguage(lang)
      setShowLanguageSelector(false)
    }}
  />
)}
```

### Phase 3: 実装

1. **選択した方法に基づいて実装**
   - `LanguageSwitcher`を使用する場合：コンポーネントの追加とスタイル調整
   - 専用UIを追加する場合：新しいコンポーネントの作成

2. **API統合**
   - 言語選択時に`/api/users`エンドポイントを呼び出して言語設定を更新
   - 編集モードとは独立して言語のみを更新できるようにする

3. **状態管理**
   - 言語変更後、即座にUIに反映されるように状態を更新
   - `getUserLanguage()`関数の動作確認と、必要に応じて調整

---

## 🔗 関連ファイル

- `app/[userSlug]/page.tsx` - プロフィールページ（編集モードでの言語選択UIが実装されている）
- `components/common/LanguageSwitcher.tsx` - 言語切り替えコンポーネント（存在する場合）
- `lib/utils/language.ts` - 言語ユーティリティ（`getUserLanguage`など）
- `lib/i18n/index.ts` - i18n辞書と`t()`関数
- `app/api/users/route.ts` - ユーザー情報更新API

---

## ✅ 完了条件

- [ ] 通常の表示モードでも言語選択が可能
- [ ] 編集モードに入らずに言語のみを変更できる
- [ ] 言語選択UIが適切な場所に表示される（UXが良い）
- [ ] 言語変更後、即座にUIに反映される
- [ ] 既存の編集モードでの言語選択機能も維持される（後方互換性）
- [ ] ビルドエラーがない
- [ ] ブラウザで動作確認済み（複数言語での切り替えテスト）

---

## 📝 実装時の注意事項

1. **既存機能との整合性**
   - 編集モードでの言語選択機能は維持する
   - 両方の方法で言語を変更できるようにする（ユーザーの選択肢を増やす）

2. **API呼び出し**
   - 言語のみを更新する場合は、プロフィール全体を更新する必要はない
   - 必要に応じて、言語更新専用のAPIエンドポイントを検討

3. **UXの一貫性**
   - 他のページ（ランディングページなど）での言語選択UIと一貫性を保つ
   - 既存の`LanguageSwitcher`コンポーネントを再利用できるか確認

4. **状態管理**
   - 言語変更後、即座に`getUserLanguage()`が新しい言語を返すようにする
   - クッキーやlocalStorageへの保存タイミングを確認

5. **i18n対応**
   - 言語選択UI自体もi18n化されていることを確認
   - 言語名の表示方法（`LANGUAGE_NAMES[lang].native`など）の統一

---

## 🔍 参考

- 既存の`LanguageSwitcher`コンポーネントの実装（存在する場合）
- ランディングページでの言語選択UIの実装
- 関連Issue: `language-switching-fallback-issue.md`（フォールバック処理による問題）

---

## 💡 拡張アイデア（将来）

1. **言語選択の即座反映**
   - 言語選択後、ページのリロードなしで即座に言語が変更される
   - Reactコンテキストや状態管理を活用

2. **言語選択のプレビュー**
   - 言語選択時に、実際のUIがどのように変わるかプレビュー表示

3. **言語設定の優先順位の明確化**
   - プロフィール設定、クッキー、ブラウザ設定の優先順位をUIで表示
   - ユーザーが現在どの言語設定が適用されているか分かりやすくする

