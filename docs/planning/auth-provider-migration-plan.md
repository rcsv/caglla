# 認証プロバイダーマルチ対応化計画

**作成日**: 2025年現在  
**対象バージョン**: v3.0.0以降  
**目的**: Google ID以外の認証プロバイダー（Email/Password、Twitter、GitHub、Apple等）への対応

**重要**: 現行システム（v2.*）への適用は危険と判断。v3.0.0のリファクタリングと同時に適用する。

---

## 📊 現状分析

### 現在の制約

1. **User型定義**: `google_id: string` が**必須フィールド**
2. **Firestoreセキュリティルール**: `request.auth.uid == resource.data.google_id` で所有権チェック
3. **APIルート**: `getUserByGoogleId()` を使用
4. **データベースクエリ**: `where('google_id', '==', userId)` で検索

### 影響範囲

- **User型定義**: `lib/core/types/user.ts`
- **Firestoreルール**: `firestore.rules`
- **認証ヘルパー**: `lib/firebase/admin-operation.ts`
- **APIルート**: `app/api/users/route.ts`, `app/api/trips/route.ts` など
- **クライアント側**: `lib/contexts/auth.tsx`, `app/[userSlug]/page.tsx` など

---

## 🎯 移行戦略（v3.0.0での適用）

### 基本方針

1. **関数によるラップ**: 文字列比較を直接行わず、`isSameUser()`, `isSameTrip()` などのbooleanを返す関数でラップ
   - **影響範囲の最小化**: 文字列比較の直接使用を禁止し、関数経由のみで比較を行う
   - **将来の変更に強い**: フィールド名が変わっても関数の実装を変更するだけで対応可能
2. **型安全性**: Phase 1-1で実装した `UserId`, `UserSlug`, `TripId`, `TripSlug` のBranded Typesを活用
   - 型レベルで混同を防止（`userSlug` と `google_id` の混同を防ぐ）
3. **後方互換性**: 既存の `google_id` フィールドは残し、段階的に `auth_uid` に移行

### Phase 1: フィールド名の変更（後方互換性を保持）

**目標**: `google_id` → `auth_uid` にリネームし、既存データとの互換性を保つ

#### 1.1 User型定義の拡張

```typescript
// lib/core/types/user.ts
export interface User {
  id: string
  auth_uid: string  // Firebase Auth UID（新規）
  google_id?: string  // 後方互換性のため残す（オプショナル）
  // ... 他のフィールド
}
```

#### 1.2 Firestoreルールの更新

```javascript
// firestore.rules
match /users/{userId} {
  // 後方互換性: google_id または auth_uid をチェック
  allow write: if request.auth != null &&
    (request.auth.uid == resource.data.auth_uid ||
     request.auth.uid == resource.data.google_id ||  // 後方互換性
     request.auth.uid == userId);
}
```

#### 1.3 ヘルパー関数の更新

```typescript
// lib/firebase/admin-operation.ts
export const adminUserOperations = {
  // 既存: getUserByGoogleId (後方互換性のため残す)
  async getUserByGoogleId(googleId: string): Promise<User | null> {
    // まず auth_uid で検索、見つからなければ google_id で検索
    const byAuthUid = await adminDb
      .collection(COLLECTIONS.USERS)
      .where('auth_uid', '==', googleId)
      .limit(1)
      .get()
    
    if (!byAuthUid.empty) {
      return adminFirestoreHelpers.docToObject<User>(byAuthUid.docs[0])
    }
    
    // 後方互換性: google_id で検索
    const byGoogleId = await adminDb
      .collection(COLLECTIONS.USERS)
      .where('google_id', '==', googleId)
      .limit(1)
      .get()
    
    if (!byGoogleId.empty) {
      return adminFirestoreHelpers.docToObject<User>(byGoogleId.docs[0])
    }
    
    return null
  },
  
  // 新規: getUserByAuthUid (推奨)
  async getUserByAuthUid(authUid: string): Promise<User | null> {
    const querySnapshot = await adminDb
      .collection(COLLECTIONS.USERS)
      .where('auth_uid', '==', authUid)
      .limit(1)
      .get()
    
    if (querySnapshot.empty) {
      // 後方互換性: google_id で検索
      return this.getUserByGoogleId(authUid)
    }
    
    return adminFirestoreHelpers.docToObject<User>(querySnapshot.docs[0])
  }
}
```

### Phase 2: データマイグレーション

**目標**: 既存の`google_id`を`auth_uid`にコピー

#### 2.1 マイグレーションスクリプト

```typescript
// scripts/migrate-auth-uid.ts
import { adminDb } from '@/lib/firebase/admin'

async function migrateAuthUid() {
  const usersRef = adminDb.collection('users')
  const snapshot = await usersRef.get()
  
  const batch = adminDb.batch()
  let count = 0
  
  snapshot.docs.forEach((doc) => {
    const user = doc.data()
    
    // auth_uid が存在しない場合のみ更新
    if (!user.auth_uid && user.google_id) {
      batch.update(doc.ref, {
        auth_uid: user.google_id
      })
      count++
    }
  })
  
  await batch.commit()
  console.log(`Migrated ${count} users`)
}

migrateAuthUid()
```

### Phase 3: コード全体の更新

**目標**: `google_id`への依存を`auth_uid`に置き換え

#### 3.1 APIルートの更新

```typescript
// app/api/users/route.ts
// Before
const existingUser = await adminUserOperations.getUserByGoogleId(userId)

// After
const existingUser = await adminUserOperations.getUserByAuthUid(userId)
```

#### 3.2 ユーザー作成時の更新

```typescript
// app/api/users/route.ts
userData = {
  auth_uid: userId,  // 新規（必須）
  google_id: userId,  // 後方互換性（オプショナル、Google プロバイダーのみ）
  // ... 他のフィールド
}
```

### Phase 4: プロバイダー別情報の管理（オプション）

**目標**: プロバイダー固有の情報を管理する構造を追加

```typescript
// lib/core/types/user.ts
export interface User {
  id: string
  auth_uid: string  // Firebase Auth UID
  providers: {
    google?: {
      id: string
      email: string
      picture?: string
    }
    email?: {
      email: string
      verified: boolean
    }
    twitter?: {
      id: string
      username: string
    }
    // ... 他のプロバイダー
  }
  // ... 他のフィールド
}
```

---

## 🔄 移行手順

### Step 1: 型定義の更新（後方互換性保持）

1. `lib/core/types/user.ts` を更新
2. `auth_uid` を必須フィールドとして追加
3. `google_id` をオプショナルに変更（後方互換性）

### Step 2: ヘルパー関数の追加

1. `getUserByAuthUid()` を追加
2. `getUserByGoogleId()` を更新（内部で`getUserByAuthUid()`を呼び出す）

### Step 3: Firestoreルールの更新

1. `auth_uid` と `google_id` の両方をチェック
2. 新しいユーザーは `auth_uid` を必須とする

### Step 4: APIルートの段階的更新

1. 新規ユーザー作成時に `auth_uid` を設定
2. 既存の `getUserByGoogleId()` 呼び出しを `getUserByAuthUid()` に置き換え

### Step 5: データマイグレーション

1. マイグレーションスクリプトを実行
2. すべてのユーザーに `auth_uid` を設定

### Step 6: クリーンアップ（将来的）

1. `google_id` への依存を削除
2. `getUserByGoogleId()` を非推奨化

---

## 📋 影響を受けるファイル

### 型定義
- `lib/core/types/user.ts`

### Firestoreルール
- `firestore.rules`

### サーバーサイド
- `lib/firebase/admin-operation.ts`
- `app/api/users/route.ts`
- `app/api/trips/route.ts`
- `lib/travel/slug-helpers.ts`
- `lib/auth/identity-helpers.ts`

### クライアントサイド
- `lib/contexts/auth.tsx`
- `app/[userSlug]/page.tsx`
- `components/modals/UserSettingsModal.tsx`

---

## ⚠️ 注意事項

1. **後方互換性**: 既存の`google_id`フィールドとの互換性を保つ必要がある
2. **マイグレーション**: 既存データの移行が必要
3. **Firestoreルール**: 両方のフィールドをチェックする必要がある
4. **テスト**: マイグレーション前後の動作確認が重要

---

## 🎯 結論

**現状**: Google IDのみに依存（大きな設計変更が必要）

**移行後**: マルチプロバイダー対応可能（段階的な移行が可能）

**推奨**: Phase 1-3を実装し、後方互換性を保ちながら段階的に移行する

