# Firestore Client リファクタリング提案

**作成日**: 2025-11-14  
**目的**: `if (!db)` チェックの重複を解消し、コードの見通しを改善

---

## 🔍 現状の問題

`lib/auth/identity-helpers.ts` で、以下のように `if (!db)` チェックが5箇所に散らばっています：

```typescript
export async function resolveUserIdFromSlug(userSlug: UserSlug): Promise<UserId | null> {
  try {
    if (!db) {
      logger.error('Firestore client not initialized')
      return null
    }
    const usersRef = db.collection(COLLECTIONS.USERS)
    // ...
  }
}
```

**問題点:**
- 同じチェックが5箇所に散らばっている
- エラーハンドリングが重複している
- コードの見通しが悪い

---

## 💡 推奨解決策

### **方法2を採用: `safeFirestore()` 関数を作成**

既存のコードスタイル（関数型アプローチ）に最も合致し、シンプルで影響範囲が小さいため。

---

## 🎯 実装計画

### **Step 1: `lib/firebase/client.ts` に `getSafeFirestore()` を追加**

```typescript
import type { Firestore } from 'firebase/firestore'

/**
 * 初期化済みのFirestoreインスタンスを取得
 * 初期化に失敗している場合はエラーをスロー
 * 
 * @returns Firestoreインスタンス
 * @throws Error 初期化に失敗している場合
 */
export function getSafeFirestore(): Firestore {
  if (!db) {
    logger.error('Firestore client not initialized')
    throw new Error('Firestore client not initialized')
  }
  return db
}
```

**利点:**
- 既存の `db` エクスポートを維持（後方互換性）
- 新しい関数を追加するだけ（影響範囲が小さい）
- 型安全（`Firestore` 型を返す）

---

### **Step 2: `lib/auth/identity-helpers.ts` を修正**

```typescript
import { getSafeFirestore } from '@/lib/firebase/client'

export async function resolveUserIdFromSlug(userSlug: UserSlug): Promise<UserId | null> {
  try {
    const db = getSafeFirestore() // チェック不要、常に初期化済み
    const usersRef = db.collection(COLLECTIONS.USERS)
    const querySnapshot = await usersRef.where('slug', '==', userSlug).limit(1).get()
    // ...
  } catch (error) {
    logger.error('Failed to resolve userId from slug:', error)
    return null
  }
}
```

**変更点:**
- `import { db }` → `import { getSafeFirestore }`
- `if (!db)` チェックを削除
- `const db = getSafeFirestore()` で取得
- エラーは catch で処理

---

## 📋 比較表

| 方法 | 複雑度 | 影響範囲 | 後方互換性 | 推奨度 |
|------|--------|----------|------------|--------|
| **方法2: `safeFirestore()`** | ⭐ 低 | 小 | ✅ あり | ⭐⭐⭐⭐⭐ |
| 方法1: `withFirestore()` | ⭐⭐ 中 | 中 | ✅ あり | ⭐⭐⭐ |
| 方法3: `ensure()` | ⭐⭐ 中 | 大 | ⚠️ なし | ⭐⭐ |
| 方法4: OOP Service | ⭐⭐⭐ 高 | 大 | ⚠️ なし | ⭐⭐ |

---

## ✅ 実装後の効果

### **Before:**
```typescript
export async function resolveUserIdFromSlug(userSlug: UserSlug): Promise<UserId | null> {
  try {
    if (!db) {
      logger.error('Firestore client not initialized')
      return null
    }
    const usersRef = db.collection(COLLECTIONS.USERS)
    // ...
  }
}
```

### **After:**
```typescript
export async function resolveUserIdFromSlug(userSlug: UserSlug): Promise<UserId | null> {
  try {
    const db = getSafeFirestore() // チェック不要
    const usersRef = db.collection(COLLECTIONS.USERS)
    // ...
  } catch (error) {
    logger.error('Failed to resolve userId from slug:', error)
    return null
  }
}
```

**改善点:**
- ✅ `if (!db)` チェックが消えた
- ✅ エラーハンドリングが catch に統一
- ✅ コードが3行短くなった（各関数）
- ✅ 見通しが良くなった

---

## 🔄 移行計画

1. **Phase 1**: `lib/firebase/client.ts` に `getSafeFirestore()` を追加
2. **Phase 2**: `lib/auth/identity-helpers.ts` を修正（5箇所）
3. **Phase 3**: 他のファイルも段階的に移行（必要に応じて）

---

**作成日**: 2025-11-14  
**最終更新**: 2025-11-14

