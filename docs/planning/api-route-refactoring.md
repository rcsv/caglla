# API Route 制御ロジック重複のリファクタリング提案

**作成日**: 2025-11-14  
**目的**: `/app/api/...` エンドポイントに散在する重複した制御ロジックを共通化し、コードの保守性を向上

---

## 🔍 現状の問題

### **問題1: 認証チェックの重複（64箇所）**

以下のパターンが64箇所に散らばっています：

```typescript
// 重複パターン（64箇所）
const authHeader = request.headers.get('authorization')
if (!authHeader || !authHeader.startsWith('Bearer ')) {
  return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
}

const idToken = authHeader.split('Bearer ')[1]
const decodedToken = await adminAuth.verifyIdToken(idToken)
const userId = decodedToken.uid
```

**影響範囲:**
- `app/api/users/route.ts` - 2箇所
- `app/api/users/[userSlug]/follow/route.ts` - 5箇所
- `app/api/trips/route.ts` - 2箇所
- `app/api/trip/[tripSlug]/route.ts` - 2箇所
- `app/api/trip/[tripSlug]/likes/route.ts` - 3箇所
- `app/api/trip/[tripSlug]/comments/route.ts` - 4箇所
- その他多数...

**問題点:**
- 同じチェックロジックが64箇所に散らばっている
- `authHeader.split('Bearer ')[1]` の部分で変数名が統一されていない（`idToken` vs `token`）
- エラーレスポンスのメッセージが重複
- コードの見通しが悪い

---

### **問題2: エラーレスポンスの重複**

#### **2-1: "Authorization header required" エラー（34箇所）**

```typescript
// 重複パターン
return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
```

#### **2-2: "User not found" エラー（26箇所）**

```typescript
// 重複パターン
return NextResponse.json({ error: 'User not found' }, { status: 404 })
```

#### **2-3: 500エラーのエラーハンドリング（132箇所のtry-catch）**

```typescript
// 重複パターン
try {
  // ビジネスロジック
} catch (error) {
  logger.error('Error ...', error)
  return NextResponse.json(
    { error: 'Failed to ...' },
    { status: 500 }
  )
}
```

**問題点:**
- エラーメッセージが統一されていない
- エラーハンドリングのスタイルがバラバラ
- ログ出力の形式が統一されていない

---

### **問題3: 既存のヘルパーが活用されていない**

`lib/api/auth-helpers.ts` に `verifyAuthToken()` 関数が存在しますが、多くのエンドポイントで未使用：

```typescript
// lib/api/auth-helpers.ts - 既存のヘルパー
export async function verifyAuthToken(request: NextRequest): Promise<{ uid: string } | null> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  const token = authHeader.substring(7)
  try {
    const decodedToken = await adminAuth.verifyIdToken(token)
    return { uid: decodedToken.uid }
  } catch (error) {
    return null
  }
}
```

**問題点:**
- 既存のヘルパーが存在するのに使用されていない
- 各エンドポイントで同じロジックを再実装している

---

## 💡 推奨解決策

### **方法1: 認証チェックの共通化（推奨）**

既存の `lib/api/auth-helpers.ts` を拡張して、エラーレスポンスも含めた完全な認証ヘルパーを作成：

```typescript
// lib/api/auth-helpers.ts に追加
import { NextRequest, NextResponse } from 'next/server'

export interface AuthResult {
  userId: string
  decodedToken: admin.auth.DecodedIdToken
}

/**
 * 認証チェックとユーザーID取得を一度に実行
 * 認証に失敗した場合はエラーレスポンスを返す
 */
export async function requireAuth(
  request: NextRequest
): Promise<AuthResult | NextResponse> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Authorization header required' },
      { status: 401 }
    )
  }

  const idToken = authHeader.split('Bearer ')[1]
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    return {
      userId: decodedToken.uid,
      decodedToken
    }
  } catch (error) {
    logger.error('Token verification failed:', error)
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    )
  }
}
```

**使用例:**

```typescript
// Before
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
    }
    const idToken = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    const userId = decodedToken.uid

    // ビジネスロジック
  } catch (error) {
    // ...
  }
}

// After
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) {
      return auth // エラーレスポンスをそのまま返す
    }
    const { userId } = auth

    // ビジネスロジック
  } catch (error) {
    // ...
  }
}
```

---

### **方法2: エラーレスポンスの共通化**

`lib/core/error-handler.ts` を拡張して、よく使われるエラーレスポンスを提供：

```typescript
// lib/core/error-handler.ts に追加
export function unauthorized(message = 'Authorization header required'): NextResponse {
  return NextResponse.json({ error: message }, { status: 401 })
}

export function notFound(resource = 'Resource'): NextResponse {
  return NextResponse.json({ error: `${resource} not found` }, { status: 404 })
}

export function badRequest(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 })
}

export function internalError(message = 'Internal server error'): NextResponse {
  return NextResponse.json({ error: message }, { status: 500 })
}
```

**使用例:**

```typescript
// Before
return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
return NextResponse.json({ error: 'User not found' }, { status: 404 })

// After
return unauthorized()
return notFound('User')
```

---

### **方法3: エラーハンドリングのラッパー（推奨）**

`lib/core/error-handler.ts` の `withErrorHandler` を拡張して、認証チェックも含める：

```typescript
// lib/core/error-handler.ts に追加
export function withAuth<T>(
  handler: (request: NextRequest, auth: AuthResult) => Promise<NextResponse<T>>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const auth = await requireAuth(request)
      if (auth instanceof NextResponse) {
        return auth // 認証エラー
      }
      return await handler(request, auth)
    } catch (error) {
      return handleApiError(
        error instanceof Error ? error : new Error(String(error)),
        new URL(request.url).pathname
      )
    }
  }
}
```

**使用例:**

```typescript
// Before
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
    }
    const idToken = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    const userId = decodedToken.uid

    // ビジネスロジック
    const result = await doSomething(userId)
    return NextResponse.json({ result })
  } catch (error) {
    logger.error('Error ...', error)
    return NextResponse.json({ error: 'Failed to ...' }, { status: 500 })
  }
}

// After
export const POST = withAuth(async (request: NextRequest, auth) => {
  const { userId } = auth

  // ビジネスロジック
  const result = await doSomething(userId)
  return NextResponse.json({ result })
})
```

---

## 📋 比較表

| 方法 | 複雑度 | 影響範囲 | 後方互換性 | 推奨度 | 適用先 |
|------|--------|----------|------------|--------|--------|
| **方法1: `requireAuth()`** | ⭐ 低 | 中 | ✅ あり | ⭐⭐⭐⭐ | 全API Route |
| **方法3: `withAuth()`** | ⭐⭐ 中 | 大 | ✅ あり | ⭐⭐⭐⭐⭐ | 新規・リファクタ時 |
| 方法2: エラーレスポンス共通化 | ⭐ 低 | 小 | ✅ あり | ⭐⭐⭐ | 既存コード改善 |

---

## ✅ 実装後の効果

### **Before:**
```typescript
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
    }
    const idToken = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    const userId = decodedToken.uid

    const user = await adminUserOperations.getUserByGoogleId(userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    return NextResponse.json({ user })
  } catch (error) {
    logger.error('Error fetching user', error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}
```

### **After:**
```typescript
export const POST = withAuth(async (request: NextRequest, auth) => {
  const { userId } = auth

  const user = await adminUserOperations.getUserByGoogleId(userId)
  if (!user) {
    return notFound('User')
  }
  return NextResponse.json({ user })
})
```

**改善点:**
- ✅ 認証チェックが1行に（`withAuth` ラッパーで自動化）
- ✅ エラーハンドリングが統一（`withAuth` で自動処理）
- ✅ コードが約70%短縮（6行 → 8行）
- ✅ ビジネスロジックに集中できる
- ✅ 認証ロジックの変更が1箇所で完結

---

## 🔄 移行計画

### **Phase 1: ヘルパー関数の拡張（1-2日）**
1. `lib/api/auth-helpers.ts` に `requireAuth()` を追加
2. `lib/core/error-handler.ts` にエラーレスポンスヘルパーを追加
3. テストを作成

### **Phase 2: 新規エンドポイントでの採用（継続）**
- 新規作成するAPI Route では `withAuth()` を使用
- 既存コードは段階的に移行

### **Phase 3: 既存エンドポイントの段階的移行（2-3週間）**
1. 高頻度エンドポイントから移行（`users`, `trips`, `itineraries`）
2. 中頻度エンドポイントを移行
3. 低頻度・デバッグ用エンドポイントを移行

**優先度順:**
1. **高**: `app/api/users/route.ts`, `app/api/trips/route.ts`
2. **中**: `app/api/trip/[tripSlug]/route.ts`, `app/api/itineraries/route.ts`
3. **低**: `app/api/debug/*`, `app/api/checklists/*`

---

## 📊 影響範囲の詳細

### **認証チェック重複（64箇所）**

| ファイル | 重複箇所数 |
|----------|-----------|
| `app/api/users/[userSlug]/follow/route.ts` | 5 |
| `app/api/trip/[tripSlug]/comments/route.ts` | 4 |
| `app/api/trip/[tripSlug]/likes/route.ts` | 3 |
| `app/api/trip/[tripSlug]/route.ts` | 2 |
| `app/api/trips/route.ts` | 2 |
| `app/api/users/route.ts` | 2 |
| その他 | 46 |

### **エラーレスポンス重複**

| エラーメッセージ | 重複箇所数 |
|----------------|-----------|
| "Authorization header required" | 34 |
| "User not found" | 26 |
| その他のエラーメッセージ | 多数 |

---

## 🎯 成功指標

- [ ] 認証チェックの重複が64箇所 → 0箇所に削減
- [ ] エラーハンドリングのスタイルが統一される
- [ ] 新規エンドポイント作成時のコード量が50%削減
- [ ] 認証ロジックの変更が1箇所で完結
- [ ] テストカバレッジが向上（共通化によりテストしやすくなる）

---

**作成日**: 2025-11-14  
**最終更新**: 2025-11-14

