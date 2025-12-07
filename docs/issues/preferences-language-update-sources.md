# preferences.language が変更される箇所のリスト

## 問題
ユーザーが手動で言語設定を変更しても、ログインするたびに日本語に戻ってしまう。

## 原因箇所

### 1. **`lib/contexts/auth.tsx`** ⚠️ **問題の原因**
**行番号**: 66-83行目

**問題のコード**:
```typescript
if (existingUserResponse.ok) {
    // 既存ユーザーの場合：preferencesのみ更新（Google情報は送信しない）
    const userData = {
        preferences: {
            currency: browserInfo.currency,
            timezone: browserInfo.timezone,
            language: browserInfo.language,  // ← ここが問題
            home_address: browserInfo.homeAddress,
            theme: "light" as const,
            notifications: true,
        },
    };
    // ...
}
```

**問題点**:
- 既存ユーザーがログインするたびに、`browserInfo.language`（`navigator.language`）で`preferences.language`を上書きしている
- 日本語ブラウザを使用している場合、常に`"ja"`または`"ja-JP"`で上書きされる
- ユーザーが手動で設定した言語が失われる

**修正方針**:
- 既存ユーザーの場合、`language`を更新しない（既存の値を保持）
- または、既存の`language`が空文字列（`""`）の場合のみ更新する

---

### 2. **`components/modals/UserSettingsModal.tsx`** ✅ 正常
**行番号**: 164行目

**コード**:
```typescript
body: JSON.stringify({
    name: userData?.name,
    email: userData?.email,
    profile_image_url: userData?.profile_image_url,
    preferences,  // ← ユーザーが設定したpreferencesをそのまま送信
}),
```

**説明**:
- ユーザー設定モーダルから保存する場合
- ユーザーが明示的に設定した値が送信されるため問題なし

---

### 3. **`app/(profile)/[userSlug]/page.tsx`** ✅ 正常
**行番号**: 269行目

**コード**:
```typescript
preferences: {
    home_address: editForm.home_address,
    home_place_id: editForm.home_place_id || undefined,
    home_country_code: editForm.home_country_code,
    language: editForm.language || undefined,  // ← ユーザーが設定した値
    unit_system: editForm.unit_system,
},
```

**説明**:
- プロフィールページから保存する場合
- ユーザーが明示的に設定した値が送信されるため問題なし

---

### 4. **`app/api/users/route.ts`** ⚠️ 影響あり
**行番号**: 78行目

**コード**:
```typescript
preferences: preferences || existingUser.preferences || {},
```

**説明**:
- APIエンドポイントで`preferences`をマージする際、`language`も含まれる
- `lib/contexts/auth.tsx`から送信された`preferences.language`が既存の値を上書きする

---

### 5. **`lib/firebase/admin-operation.ts`** ⚠️ 影響あり
**行番号**: 108-111行目

**コード**:
```typescript
updateData.preferences = {
    ...existingUser.preferences,
    ...cleanedPreferences,  // ← browserInfo.languageが含まれると上書きされる
};
```

**説明**:
- `createOrUpdateUser`で`preferences`をマージする際、`language`も含まれる
- `lib/contexts/auth.tsx`から送信された`preferences.language`が既存の値を上書きする

---

## 修正方法

### 推奨修正: `lib/contexts/auth.tsx`を修正

既存ユーザーの場合、`language`を更新しないようにする：

```typescript
if (existingUserResponse.ok) {
    // 既存ユーザーの場合：preferencesのみ更新（Google情報は送信しない）
    // ただし、languageは既存の値を保持（ブラウザ設定で上書きしない）
    const userData = {
        preferences: {
            currency: browserInfo.currency,
            timezone: browserInfo.timezone,
            // language: browserInfo.language,  // ← 削除または条件付き更新
            home_address: browserInfo.homeAddress,
            theme: "light" as const,
            notifications: true,
        },
    };
    // ...
}
```

または、既存の`language`が空文字列の場合のみ更新する：

```typescript
if (existingUserResponse.ok) {
    const existingUser = await existingUserResponse.json();
    const shouldUpdateLanguage = !existingUser.user?.preferences?.language || 
                                 existingUser.user?.preferences?.language === "";
    
    const userData = {
        preferences: {
            currency: browserInfo.currency,
            timezone: browserInfo.timezone,
            ...(shouldUpdateLanguage && { language: browserInfo.language }),
            home_address: browserInfo.homeAddress,
            theme: "light" as const,
            notifications: true,
        },
    };
    // ...
}
```

---

## 関連ファイル

- `lib/utils/browser.ts` - `getLanguage()`関数（`navigator.language`を返す）
- `lib/utils/language.ts` - `getUserLanguage()`関数（言語取得の優先順位を定義）

