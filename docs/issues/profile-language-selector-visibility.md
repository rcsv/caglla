# Issue: プロフィールページで現在選択されている表示言語が表示されない

**作成日**: 2025-10-31  
**状態**: 🔴 未解決  
**優先度**: 中  
**種類**: UX改善  
**関連ファイル**: 
- `app/[userSlug]/page.tsx`（プロフィールページ）
- `lib/utils/language.ts`（言語ユーティリティ）
- `components/common/LanguageSwitcher.tsx`（存在する場合）

---

## 📋 概要

プロフィールページで、編集モードに入らないと現在選択されている表示言語が分からない。通常の表示モードでは、ユーザーがどの言語を選択しているのかが表示されないため、現在の言語設定を確認するには編集モードに入る必要がある。これにより、ユーザーは現在の言語設定を確認するためにプロフィール全体を編集モードにする必要があり、UXが悪い。

---

## 🐛 問題の詳細

### 現状の問題

1. **通常の表示モード**
   - プロフィールページは通常、表示モード（`isEditing === false`）
   - 現在選択されている言語が表示されない
   - 言語設定を確認するには「編集」ボタンを押して編集モードに入る必要がある

2. **編集モードでの言語選択**
   - 「編集」ボタンを押すと、プロフィール全体が編集モードになる
   - 言語選択は`<select>`要素で表示される（373-388行目）
   - ここで初めて現在選択されている言語が確認できる

3. **UXの問題**
   - ユーザーが現在どの言語を選択しているか分からない
   - 言語設定を確認するために編集モードに入る必要がある
   - 他のプロフィール情報を変更する意図がない場合でも、編集モードに入る必要がある
   - 現在の言語設定の可視性が低い

### 期待される動作

- **オプション1**: 通常の表示モードでも現在の言語を表示する
  - プロフィール情報の表示セクションに「言語: 日本語 (ja)」などの表示を追加
  - 編集モードに入らずに現在の言語設定を確認できる
  - 言語名や国旗アイコンなどで視覚的に分かりやすく表示

- **オプション2**: ヘッダーやサイドバーに言語情報を表示
  - プロフィールページのヘッダー部分に現在の言語を表示
  - `HomeHeader`の言語フラグ表示と同様の方法で、プロフィールページでも表示

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

1. **現在の言語設定の取得方法**
   - `profileUser.preferences?.language`から言語設定を取得
   - `getUserLanguage()`関数で現在の言語を取得
   - 言語が未設定の場合のフォールバック処理の確認

2. **表示方法の検討**
   - プロフィール情報の表示セクションに追加する方法
   - ヘッダー部分に表示する方法
   - 他のプロフィール情報（名前、自己紹介など）と同じ形式で表示

### Phase 2: 実装方法の決定

#### オプションA: プロフィール情報の表示セクションに言語情報を追加

- 通常の表示モード（`!isEditing`）で、名前、自己紹介、居住地域などの表示セクションに言語情報を追加
- `LANGUAGE_NAMES`を使用して言語名を表示
- 国旗アイコンなどを追加して視覚的に分かりやすく

#### 実装例：

```typescript
// プロフィール情報の表示セクション
{!isEditing && !isFirstTimeSetup && (
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {t('profile.language')}
      </label>
      <div className="flex items-center gap-2">
        <span className="text-lg">
          {profileUser.preferences?.language 
            ? getLanguageFlag(profileUser.preferences.language)
            : '🌐'}
        </span>
        <span className="text-gray-900">
          {profileUser.preferences?.language
            ? LANGUAGE_NAMES[profileUser.preferences.language].native
            : t('profile.language.auto')}
        </span>
      </div>
    </div>
    {/* 他のプロフィール情報 */}
  </div>
)}
```

#### オプションB: ヘッダー部分に言語情報を表示

- プロフィールページのヘッダー部分（編集ボタンの近く）に言語情報を表示
- `HomeHeader`の言語フラグ表示と同様のスタイルで表示
- コンパクトな表示で、一目で現在の言語が分かる

#### 実装例：

```typescript
// ヘッダー部分
<div className="flex items-center space-x-4">
  <button onClick={() => router.back()}>{t('profile.back')}</button>
  <h1>{isFirstTimeSetup ? t('profile.setup') : t('profile.title')}</h1>
</div>
{!isEditing && !isFirstTimeSetup && (
  <div className="flex items-center gap-2">
    <span className="text-base">
      {profileUser.preferences?.language 
        ? getLanguageFlag(profileUser.preferences.language)
        : '🌐'}
    </span>
    <span className="text-sm text-gray-600">
      {profileUser.preferences?.language
        ? LANGUAGE_NAMES[profileUser.preferences.language].native
        : t('profile.language.auto')}
    </span>
  </div>
)}
```

### Phase 3: 実装

1. **言語情報の表示**
   - 選択した方法に基づいて、現在の言語を表示するUIを追加
   - `LANGUAGE_NAMES`と国旗アイコンを使用して視覚的に分かりやすく表示

2. **言語の取得**
   - `profileUser.preferences?.language`から言語設定を取得
   - 言語が未設定（空文字列または`undefined`）の場合は「自動（ブラウザ設定）」を表示

3. **スタイリング**
   - 他のプロフィール情報と統一感のあるスタイルで表示
   - レスポンシブデザインに対応

---

## 🔗 関連ファイル

- `app/[userSlug]/page.tsx` - プロフィールページ（編集モードでの言語選択UIが実装されている）
- `components/common/LanguageSwitcher.tsx` - 言語切り替えコンポーネント（存在する場合）
- `lib/utils/language.ts` - 言語ユーティリティ（`getUserLanguage`など）
- `lib/i18n/index.ts` - i18n辞書と`t()`関数
- `app/api/users/route.ts` - ユーザー情報更新API

---

## ✅ 完了条件

- [ ] 通常の表示モードで現在選択されている言語が表示される
- [ ] 編集モードに入らずに現在の言語設定を確認できる
- [ ] 言語情報が適切な場所に表示される（UXが良い）
- [ ] 言語が未設定の場合は「自動（ブラウザ設定）」が表示される
- [ ] 国旗アイコンや言語名で視覚的に分かりやすく表示される
- [ ] 既存の編集モードでの言語選択機能も維持される（後方互換性）
- [ ] ビルドエラーがない
- [ ] ブラウザで動作確認済み（複数言語設定での表示テスト）

---

## 📝 実装時の注意事項

1. **既存機能との整合性**
   - 編集モードでの言語選択機能は維持する（変更不要）
   - 表示モードでの言語表示機能を追加する

2. **言語情報の取得**
   - `profileUser.preferences?.language`から言語設定を取得
   - 言語が未設定（空文字列、`null`、`undefined`）の場合は「自動（ブラウザ設定）」を表示
   - `getUserLanguage()`関数の動作を確認し、必要に応じて使用

3. **UXの一貫性**
   - 他のプロフィール情報（名前、自己紹介など）と同じスタイルで表示
   - `HomeHeader`の言語フラグ表示と同様の方法で、視覚的に分かりやすく表示

4. **言語名の表示**
   - `LANGUAGE_NAMES[lang].native`を使用して言語名を表示
   - 国旗アイコンなどを追加して視覚的に分かりやすく
   - 「日本語 (ja)」などの形式で言語コードも表示するか検討

5. **i18n対応**
   - 「言語設定」ラベルなどは既存のi18nキー（`profile.language`など）を使用
   - 言語名自体は`LANGUAGE_NAMES`から取得するため、追加のi18n対応は不要

---

## 🔍 参考

- `app/[userSlug]/page.tsx`の編集モードでの言語選択実装（373-388行目）
- `components/common/HomeHeader.tsx`の言語フラグ表示実装（参考）
- `lib/utils/language.ts`の`LANGUAGE_NAMES`と`getUserLanguage()`関数
- 関連Issue: `language-switching-fallback-issue.md`（フォールバック処理による問題）

---

## 💡 拡張アイデア（将来）

1. **言語表示のクリックで編集モードに遷移**
   - 言語情報をクリックすると、編集モードに切り替わって言語選択UIが表示される
   - より直感的なUX

2. **言語設定の優先順位の表示**
   - プロフィール設定、クッキー、ブラウザ設定の優先順位をツールチップなどで表示
   - ユーザーが現在どの言語設定が適用されているか分かりやすくする

3. **言語変更の即座反映**
   - 編集モードで言語を変更後、ページのリロードなしで即座に言語が変更される
   - Reactコンテキストや状態管理を活用

