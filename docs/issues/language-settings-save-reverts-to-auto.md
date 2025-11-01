# Issue: Language Settings を変更して Save しても「Auto (Browser Settings)」に戻ってしまう

**作成日**: 2025-11-01  
**状態**: 🔴 未解決  
**優先度**: 高  
**種類**: バグ  
**関連ファイル**: 
- `app/[userSlug]/page.tsx`（プロフィールページ）
- `app/api/users/route.ts`（ユーザー情報更新API）
- `lib/utils/language.ts`（言語ユーティリティ）
- `lib/i18n/storage.ts`（言語オーバーライド管理）

---

## 📋 概要

プロフィールページで言語設定（Language Settings）を変更してSaveボタンを押しても、設定が保存されず「Auto (Browser Settings)」に戻ってしまう問題が発生しています。

---

## 🐛 問題の詳細

### 現状の問題

1. **プロフィールページで言語を変更**
   - ユーザーがプロフィール編集画面で言語を選択（例：「日本語」を選択）
   - Saveボタンをクリック

2. **保存後の動作**
   - 保存API呼び出しは成功している（`response.ok === true`）
   - しかし、編集画面を閉じて再度開くと、「Auto (Browser Settings)」に戻っている
   - または、ページをリロードすると、設定が反映されない

3. **実際のユーザー体験**
   - 言語を変更してSaveしても、設定が保存されない
   - 「Auto (Browser Settings)」が常に選択された状態になる
   - ユーザーが意図した言語設定が反映されない

---

## 🔍 技術的な原因分析

### 問題1: 保存時の`language`フィールドの扱い

**場所**: `app/[userSlug]/page.tsx` (163行目)

```typescript
// 現在のコード
language: editForm.language || undefined
```

**問題点**:
- 空文字列（`""`）の場合、`|| undefined`により`undefined`になってしまう
- 「Auto (Browser Settings)」を選択した場合は`editForm.language = ""`なので、`undefined`として送信される
- しかし、Firestoreでは`undefined`のフィールドは削除される可能性がある
- 既存のユーザープリファレンスとのマージ処理で、`language`が適切に更新されない可能性

### 問題2: API側での`preferences`のマージ処理

**場所**: `app/api/users/route.ts` (68行目)

```typescript
// 現在のコード
preferences: preferences || existingUser.preferences || {}
```

**問題点**:
- `preferences`が空オブジェクト`{}`の場合、既存の`preferences`が使用される
- `language: undefined`を含む`preferences`が送信された場合、マージ処理で`language`が削除される可能性
- 既存ユーザーの場合、`preferences`の部分更新ではなく、完全置き換えになってしまう可能性

### 問題3: クッキー/ローカルストレージのオーバーライドが最優先

**場所**: `lib/utils/language.ts` (52-67行目)

```typescript
// 現在のコード
export function getUserLanguage(user?: User | null): SupportedLanguage {
  // 0. クッキー/ローカルストレージでのオーバーライド ← 最優先
  if (typeof window === 'undefined') {
    const serverOverride = getLanguageOverrideServer()
    if (serverOverride && isSupportedLanguage(serverOverride)) {
      return serverOverride
    }
  } else {
    const override = getLanguageOverrideClient()
    if (override && isSupportedLanguage(override)) {
      return override
    }
  }
  // 1. ユーザープリファレンスを優先 ← クッキーの後
  // ...
}
```

**問題点**:
- クッキー/ローカルストレージのオーバーライドが最優先される
- プロフィールページで言語を保存しても、クッキー/ローカルストレージが更新されない
- そのため、古いクッキー/ローカルストレージの値が優先され、Firestoreに保存されたユーザープリファレンスが無視される

### 問題4: 保存後にクッキー/ローカルストレージを更新していない

**場所**: `app/[userSlug]/page.tsx` (168-173行目)

```typescript
if (response.ok) {
  const data = await response.json()
  setProfileUser(data.user)
  setIsEditing(false)
  setIsFirstTimeSetup(false)
  // ❌ クッキー/ローカルストレージを更新していない
}
```

**問題点**:
- プロフィールページで言語を保存した後、`setLanguageOverrideClient()`を呼び出していない
- そのため、クッキー/ローカルストレージに古い値が残り続ける
- `getUserLanguage()`が呼び出されるたびに、古いクッキー値が優先される

### 問題5: 初期化時の`language`フィールドの取得

**場所**: `app/[userSlug]/page.tsx` (75行目)

```typescript
language: data.user.preferences?.language || ''
```

**問題点**:
- Firestoreから取得した`language`が`undefined`の場合、空文字列`''`に設定される
- これは「Auto (Browser Settings)」を意味するが、実際にはFirestoreに保存されていない可能性がある
- 初期化時に`undefined`と`''`の区別ができていない

---

## 💡 解決方針

### Phase 1: 保存処理の修正

#### 1.1: `language`フィールドの明示的な送信

```typescript
// ✅ 修正案
preferences: {
  // ... 他のフィールド
  language: editForm.language !== undefined ? editForm.language : undefined
  // または
  language: editForm.language ?? undefined
}
```

**説明**:
- 空文字列（`""`）も明示的に送信する
- `undefined`と`""`を区別する
- 「Auto (Browser Settings)」は空文字列として送信する

#### 1.2: API側での部分更新処理の改善

```typescript
// ✅ 修正案（app/api/users/route.ts）
preferences: {
  ...(existingUser.preferences || {}),
  ...(preferences || {}),
  language: preferences?.language !== undefined ? preferences.language : existingUser.preferences?.language
}
```

**説明**:
- 既存の`preferences`と新しい`preferences`をマージ
- `language`が明示的に送信された場合のみ更新
- `undefined`の場合は既存の値を保持

### Phase 2: クッキー/ローカルストレージとの同期

#### 2.1: 保存後にクッキー/ローカルストレージを更新

```typescript
// ✅ 修正案（app/[userSlug]/page.tsx）
import { setLanguageOverrideClient } from '@/lib/i18n/storage'

if (response.ok) {
  const data = await response.json()
  setProfileUser(data.user)
  setIsEditing(false)
  setIsFirstTimeSetup(false)
  
  // 言語設定をクッキー/ローカルストレージに同期
  const savedLanguage = data.user.preferences?.language
  if (savedLanguage) {
    setLanguageOverrideClient(savedLanguage)
  } else {
    // 空文字列の場合はクッキーをクリア
    setLanguageOverrideClient('')
  }
}
```

**説明**:
- Firestoreに保存された言語設定をクッキー/ローカルストレージに同期
- 空文字列（「Auto」）の場合はクッキーをクリア
- これにより、`getUserLanguage()`が正しい値を返すようになる

### Phase 3: `getUserLanguage()`の優先順位の見直し

#### 3.1: ユーザープリファレンスを最優先にする（オプション）

```typescript
// ✅ 修正案（lib/utils/language.ts）
export function getUserLanguage(user?: User | null): SupportedLanguage {
  // 1. ユーザープリファレンスを最優先
  if (user?.preferences?.language !== undefined) {
    const userLang = user.preferences.language
    
    if (userLang === '') {
      // 空文字列の場合はブラウザ設定を使用
      // ... 既存の処理
    }
    
    if (isSupportedLanguage(userLang)) {
      return userLang
    }
  }
  
  // 2. クッキー/ローカルストレージのオーバーライド（一時的な設定用）
  // ... 既存の処理
}
```

**説明**:
- ユーザープリファレンス（Firestore）を最優先にする
- クッキー/ローカルストレージは一時的なオーバーライド用として扱う
- `LanguageSwitcher`などの一時的な言語切り替えにはクッキーを使用
- プロフィールページでの設定はFirestoreに保存し、クッキーに同期

**注意**: この変更は既存の`LanguageSwitcher`の動作に影響する可能性があるため、慎重に検討する必要がある。

### Phase 4: 初期化処理の改善

#### 4.1: `language`フィールドの明示的な取得

```typescript
// ✅ 修正案（app/[userSlug]/page.tsx）
language: data.user.preferences?.language ?? ''
```

**説明**:
- `null`の場合も空文字列として扱う
- `undefined`と`null`を明確に区別
- これにより、Firestoreに保存されていない場合と「Auto」を選択した場合を区別できる

---

## 🔗 関連ファイル

- `app/[userSlug]/page.tsx` - プロフィールページ（編集・保存処理）
- `app/api/users/route.ts` - ユーザー情報更新API（`preferences`のマージ処理）
- `lib/utils/language.ts` - 言語ユーティリティ（`getUserLanguage()`関数）
- `lib/i18n/storage.ts` - 言語オーバーライド管理（クッキー/ローカルストレージ）
- `components/common/LanguageSwitcher.tsx` - 言語切り替えUI（クッキーを使用）

---

## ✅ 完了条件

- [ ] プロフィールページで言語を変更してSaveすると、Firestoreに正しく保存される
- [ ] 保存後に編集画面を開くと、選択した言語が表示される
- [ ] ページをリロードしても、選択した言語が維持される
- [ ] 「Auto (Browser Settings)」を選択した場合、空文字列として保存され、ブラウザ設定が使用される
- [ ] クッキー/ローカルストレージがFirestoreの設定と同期される
- [ ] 既存の`LanguageSwitcher`の動作が維持される（一時的な言語切り替えが可能）
- [ ] ビルドエラーがない
- [ ] ブラウザで動作確認済み（複数の言語設定でのテスト）

---

## 📝 実装時の注意事項

1. **後方互換性**
   - 既存のクッキー/ローカルストレージの動作を維持する
   - `LanguageSwitcher`などの既存機能への影響を最小限にする

2. **空文字列と`undefined`の区別**
   - Firestoreでは`undefined`のフィールドは削除される可能性がある
   - 空文字列（`""`）を明示的に送信することで、「Auto」設定を保存できる

3. **部分更新の扱い**
   - API側で`preferences`の部分更新を正しく処理する
   - 既存の`preferences`と新しい`preferences`を適切にマージする

4. **同期のタイミング**
   - Firestoreへの保存が成功した後にクッキーを更新する
   - エラーハンドリングを考慮する

5. **テストシナリオ**
   - 新規ユーザーが言語を設定する場合
   - 既存ユーザーが言語を変更する場合
   - 「Auto」を選択して保存する場合
   - 複数の言語を切り替えてテストする場合

---

## 🔍 参考

- 既存Issue: `profile-language-selector-visibility.md`（プロフィールページでの言語表示に関する問題）
- 関連ドキュメント: `docs/specifications/language-fallback-fix.md`（言語設定フォールバック問題の修正履歴）
- 関連ドキュメント: `docs/specifications/i18n-specification.md`（i18n仕様）

---

## 💡 拡張アイデア（将来）

1. **言語設定の変更履歴**
   - ユーザーが言語を変更した履歴を記録
   - 設定の変更理由を分析

2. **言語設定の優先順位UI**
   - プロフィールページで、言語設定の優先順位を視覚的に表示
   - クッキー、Firestore、ブラウザ設定の現在の状態を表示

3. **言語設定の即時反映**
   - プロフィールページで言語を変更後、ページリロードなしで即座に反映
   - Reactコンテキストや状態管理を活用

