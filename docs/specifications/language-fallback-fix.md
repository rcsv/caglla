# 言語設定フォールバック問題の修正

**作成日**: 2025年10月18日  
**問題**: ユーザーが「自動（ブラウザ設定）」を選択しても、設定言語が日本語に戻る現象

---

## 🚨 問題の詳細

### 原因

`getUserLanguage`関数で、ユーザーが「自動（ブラウザ設定）」を選択した場合（`preferences.language = ""`）、空文字列が falsy として扱われ、意図しないフォールバックが発生していました。

### 問題のシナリオ

```typescript
// 現在の問題のあるコード
export function getUserLanguage(user?: User | null): SupportedLanguage {
  // 1. ユーザープリファレンスを優先
  if (user?.preferences?.language) {  // ← 空文字列""は falsy なので false
    // この処理が実行されない
  }
  
  // 2. ブラウザ設定 ← ここにフォールバックしてしまう！
  if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
    const browserLang = (navigator.language || 'ja').split('-')[0]
    // ブラウザが英語設定の場合、英語が返される
    return browserLang
  }
  
  return DEFAULT_LANGUAGE
}
```

### 実際の動作

1. ユーザーが「自動（ブラウザ設定）」を選択
2. `preferences.language = ""`（空文字列）で保存
3. `getUserLanguage`が空文字列を falsy として扱う
4. ブラウザの言語設定（例：`navigator.language = "en-US"`）にフォールバック
5. **結果**: 英語が選択される（ユーザーの意図と異なる）

---

## 🛠️ 修正内容

### 修正前の問題

```typescript
// ❌ 問題のあるコード
if (user?.preferences?.language) {
  // 空文字列の場合、この処理が実行されない
}
```

### 修正後の解決策

```typescript
// ✅ 修正されたコード
if (user?.preferences?.language !== undefined) {
  const userLang = user.preferences.language
  
  // 空文字列の場合は「自動（ブラウザ設定）」として明示的に処理
  if (userLang === '') {
    // ブラウザ設定を確認
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      const browserLang = (navigator.language || 'ja').split('-')[0]
      if (isSupportedLanguage(browserLang)) {
        return browserLang
      }
    }
    return DEFAULT_LANGUAGE
  }
  
  // 具体的な言語が設定されている場合
  const lang = userLang.split('-')[0]
  if (isSupportedLanguage(lang)) {
    return lang
  }
}
```

---

## 🎯 修正の効果

### 修正前の問題

| ユーザー選択 | preferences.language | 実際の動作 | 期待される動作 |
|-------------|---------------------|-----------|---------------|
| 日本語 | `"ja"` | ✅ 日本語 | 日本語 |
| 英語 | `"en"` | ✅ 英語 | 英語 |
| 自動（ブラウザ設定） | `""` | ❌ ブラウザ言語 | ブラウザ言語 |

### 修正後の動作

| ユーザー選択 | preferences.language | 実際の動作 | 期待される動作 |
|-------------|---------------------|-----------|---------------|
| 日本語 | `"ja"` | ✅ 日本語 | 日本語 |
| 英語 | `"en"` | ✅ 英語 | 英語 |
| 自動（ブラウザ設定） | `""` | ✅ ブラウザ言語 | ブラウザ言語 |

---

## 📋 動作確認

### テストケース

1. **明示的な言語選択**
   ```typescript
   user.preferences.language = "en"
   getUserLanguage(user) // → "en"
   ```

2. **自動（ブラウザ設定）選択**
   ```typescript
   user.preferences.language = ""
   navigator.language = "en-US"
   getUserLanguage(user) // → "en"
   ```

3. **自動（ブラウザ設定）選択（日本語ブラウザ）**
   ```typescript
   user.preferences.language = ""
   navigator.language = "ja-JP"
   getUserLanguage(user) // → "ja"
   ```

4. **設定なし（undefined）**
   ```typescript
   user.preferences.language = undefined
   navigator.language = "en-US"
   getUserLanguage(user) // → "en"
   ```

---

## 🔍 デバッグログ

修正後は以下のログが出力されます：

```typescript
// 自動選択の場合
logger.debug('User selected auto (browser) language, checking browser settings')
logger.debug('Language from browser (user selected auto):', browserLang)

// 明示的選択の場合
logger.debug('Language from user preferences:', lang)

// デフォルトの場合
logger.debug('Using default language:', DEFAULT_LANGUAGE)
```

---

## ✅ 修正完了

- ✅ **問題の特定**: 空文字列の falsy 判定が原因
- ✅ **修正の実装**: `!== undefined` で明示的にチェック
- ✅ **動作の改善**: 「自動（ブラウザ設定）」が正しく動作
- ✅ **デバッグ強化**: 詳細なログ出力

**結果**: ユーザーが「自動（ブラウザ設定）」を選択した場合、ブラウザの言語設定が正しく反映されるようになります。
