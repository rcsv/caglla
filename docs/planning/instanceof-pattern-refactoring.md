# `instanceof NextResponse` パターンのリファクタリング提案

**作成日**: 2025-11-15  
**更新日**: 2025-11-15  
**目的**: `instanceof NextResponse` チェックの重複を解消し、**Composable Middleware パターン**による制御フローを統一  
**焦点**: コード削減より「後方から湧いてくるカオスを封じる」

---

## ⚠️ 重要な設計原則

### 🚨 **ラッパー増殖の悪夢を防ぐ**

個別のラッパー関数（`withAuth()`, `withTripOwnership()`, `withApiKey()` など）を増やすのではなく、**Context 累積型ミドルウェアパターン**を採用する。

**なぜか？**
- ラッパー関数が際限なく増えると「このエンドポイントはどのラッパーを選ぶべき？」問題が発生
- 将来の開発者が迷子になり、保守性が低下
- 順序依存が複雑化し、バグの温床になる
- **型の `T | NextResponse` を消して、ハンドラーに「成功時の純粋な値」だけを渡す**ことで `requireAuth` 地獄を一掃
- ミドルウェアの型シグネチャが複雑化する危険を回避（Context 累積型により handler の型が固定される）

**解決策:**
```typescript
// ❌ 悪い例: ラッパー増殖 + 引数が変わるパターン
export const POST = withAuth(async (request, auth) => {...})
export const PUT = withTripOwnership(async (request, auth, ownership, params) => {...})
// handler の型がバラバラで、型地獄が発生

// ✅ 良い例: Context 累積型ミドルウェア
export const POST = composeMiddleware(
  withErrorHandling,
  withAuth,
  withTripOwnership
)(async (request, ctx) => {
  // ctx.auth, ctx.trip, ctx.params が全て揃っている
  // handler の型が統一されている
})

// ✅ さらに良い例: 標準プリセット
export const POST = tripApi(async (request, ctx) => {
  // 認証 + 所有権チェック済み
  // ctx.auth, ctx.trip が保証されている
})
export const POST = externalApi(async (request, ctx) => {
  // エラーハンドリング済み
  // ctx.apiKeys が使える
})
```

### 🎯 **実行順序の自動解決**

ミドルウェアは実行順序が命だが、開発者が順序を間違えても壊れない構造にする。

**解決策:**
- `withTripOwnership()` が内部で `requireAuth` と `requireParams` を自動で呼び出す
- 開発者が `compose` の順序を間違えても、依存関係は自動的に解決される

```typescript
export function withTripOwnership(): Middleware {
  return async (req, ctx) => {
    // 1. auth がなければ自動で requireAuth を実行
    if (!ctx.auth) {
      const result = await withAuth()(req, ctx)
      if (result instanceof NextResponse) return result
      ctx = result
    }

    // 2. params がなければ自動で解決
    if (!ctx.params) {
      // 自動解決ロジック
    }

    // 3. 所有権チェック
    // ...
  }
}
```

---

## 🔍 現状の問題

複数のヘルパー関数が `T | NextResponse` というUnion型を返し、呼び出し側で毎回 `instanceof NextResponse` チェックを行っている。このパターンが **100箇所以上** で重複している。

### 影響範囲

| パターン | 影響箇所数 | 優先度 | 理由 |
|---------|-----------|--------|------|
| 1. `requireAuth()` パターン | 約40箇所 | 🔴 高 | 最も頻繁に使用され、認証チェックは必須 |
| 2. `validateTripOwnership()` パターン | 約10箇所 | 🔴 高 | 所有権チェックはセキュリティ上重要 |
| 3. `validateDayOwnership()` パターン | 2箇所 | 🟡 中 | 使用箇所は少ないが、同様のパターン |
| 4. `requireGooglePlacesApiKey()` パターン | 約10箇所 | 🟡 中 | 外部APIエンドポイントでのみ使用 |
| 5. `withExternalApiErrorHandler()` パターン | 約10箇所 | 🟡 中 | 外部APIエンドポイントでのみ使用 |

---

## 📋 パターン別の修正方針と計画

### **パターン1: `requireAuth()` パターン（約40箇所）**

#### 現状

```typescript
// 現状のコード（40箇所で重複）
const auth = await requireAuth(request)
if (auth instanceof NextResponse) {
  return auth // エラーレスポンスをそのまま返す
}
const { userId } = auth
// 以降の処理
```

#### 改善方針

既存の `withAuth()` ラッパー関数を活用しつつ、**Composable Middleware パターン**に移行する。

**重要な注意点:**
- 既存の `withAuth()` は単独では使用可能だが、他のミドルウェアと組み合わせる際は `composeMiddleware()` を使用
- 認証チェックとエラーハンドリングが一箇所に集約される
- コードが大幅に簡潔になる

**利点:**
- 既存の実装（`lib/core/error-handler.ts`）を活用できる
- 将来的に他のミドルウェアと組み合わせやすい

#### 実装計画

**Phase 1.1: 既存の `withAuth()` を使用しているエンドポイントの確認**
- `grep -r "withAuth" app/api/` で既存の使用箇所を確認
- `withAuth` と `requireAuth` の使い分け基準を明確化

**Phase 1.2: 動的パラメータを持たないエンドポイントのリファクタリング**
- `GET`, `POST` ハンドラーで動的パラメータ（`params`）がないエンドポイントを特定
- これらを `withAuth()` に移行
- **対象**: `app/api/users/route.ts`, `app/api/trips/route.ts`, `app/api/itineraries/route.ts` など

**Phase 1.3: 動的パラメータを持つエンドポイントへの対応**

⚠️ **重要な修正**: Next.js 15 の `params` が `Promise` である問題をラッパー側で吸収する

- `PUT`, `DELETE` ハンドラーで動的パラメータが必要なエンドポイント
- **必須対応**: ラッパー内で `params = await params` を強制し、利用者には「普通の params」を渡す
- **理由**: 毎回 `await params` はレビュー時に未来の自分に殴られる仕様

```typescript
// ❌ 悪い例: 呼び出し側で毎回 await
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params // 毎回書くのが煩雑
  // ...
}

// ✅ 良い例: ラッパー側で吸収
export const PUT = withAuth(async (request: NextRequest, auth, params: { id: string }) => {
  // params は既に解決済み
  // ...
})
```

- **推奨**: ラッパー側で `params` を解決し、利用者に渡す

**Phase 1.4: 特殊ケースの対応**
- 認証がオプショナルなエンドポイント（例: `GET /api/trip/[tripSlug]`）
- 開発環境用フォールバックが必要なエンドポイント（例: `app/api/user/plan/route.ts`）
- これらは個別に検討が必要

#### 期待される効果

- **コード削減**: 約40箇所 × 3行 = **約120行のコード削減**
- **一貫性向上**: 全ての認証チェックが統一されたパターンに
- **バグ削減**: 認証チェックの漏れを防止

---

### **パターン2: `validateTripOwnership()` パターン（約10箇所）**

#### 現状

```typescript
// 現状のコード（10箇所で重複）
const auth = await requireAuth(request)
if (auth instanceof NextResponse) {
  return auth
}
const { userId } = auth

const ownership = await validateTripOwnership(tripSlug, userId)
if (ownership instanceof NextResponse) {
  return ownership // エラーレスポンスをそのまま返す
}
const { tripId, trip } = ownership
// 以降の処理
```

#### 改善方針

`withTripOwnership()` ミドルウェア関数を新規作成し、認証チェックと所有権チェックを一度に処理する。

⚠️ **重要な注意点**:
1. **認証と所有権の順序を強制**: `requireAuth → validateTripOwnership` の順序を100%強制できるのは安全性が一気に上がる
2. **N+1問題に注意**: `validateTripOwnership` がDBへの複数クエリの場合、ラッパー化によってN+1問題が隠れてしまう危険がある
   - **解決策**: 所有権チェックは DB アクセス回数を1回にパッケージしておく（trip + userId + existence の一括 JOIN）

**利点:**
- 認証チェックと所有権チェックが一箇所に集約
- 2回の `instanceof` チェックが1回に削減
- コードがさらに簡潔になる
- **順序依存を強制でき、セキュリティ向上**

#### 実装計画

**Phase 2.1: `withTripOwnership()` ミドルウェア関数の作成**

⚠️ **重要な修正**: 
1. **Context 累積型ミドルウェアパターン**に従って実装
2. **実行順序を内部で自動解決** - 依存関係をミドルウェア内で解決し、開発者が順序を間違えても壊れない構造にする
3. `params` をラッパー側で解決し、N+1問題を回避

- `lib/api/authorization-helpers.ts` に追加
- シグネチャ例:
  ```typescript
  /**
   * Trip所有権チェックミドルウェア
   * 認証チェック → params解決 → 所有権チェック の順序を内部で自動解決
   * 
   * 注意: 
   * - DB アクセスは1回に最適化されている必要がある
   * - ctx.auth がなければ自動で withAuth を実行
   * - ctx.params がなければ自動で withParams を実行
   */
  export function withTripOwnership(): Middleware {
    return async (request: NextRequest, ctx: MiddlewareContext): Promise<MiddlewareContext | NextResponse> => {
      try {
        // 1. auth がなければ自動で requireAuth を実行（順序を強制）
        if (!ctx.auth) {
          const auth = await requireAuth(request)
          if (auth instanceof NextResponse) {
            return auth // エラーレスポンスを返す
          }
          ctx = { ...ctx, auth }
        }

        // 2. params がなければ自動で解決（Next.js 15 の Promise 問題を吸収）
        if (!ctx.params) {
          // Note: Next.js Route Handler の context から取得する必要がある
          // この部分は composeMiddleware 側で処理される前提
          return NextResponse.json(
            { error: 'Params resolution failed' },
            { status: 500 }
          )
        }

        const { tripSlug } = ctx.params
        if (!tripSlug) {
          return badRequest('tripSlug parameter is required')
        }

        // 3. 所有権チェック（DB アクセスは1回に最適化済み）
        const ownership = await validateTripOwnership(tripSlug, ctx.auth.userId)
        if (ownership instanceof NextResponse) {
          return ownership
        }

        // 4. Context に trip を追加して返す
        return {
          ...ctx,
          trip: ownership
        }
      } catch (error) {
        return handleApiError(
          error instanceof Error ? error : new Error(String(error)),
          new URL(request.url).pathname
        )
      }
    }
  }

  /**
   * Params解決ミドルウェア（Next.js 15 の Promise 問題を吸収）
   */
  export function withParams(): Middleware {
    return async (request: NextRequest, ctx: MiddlewareContext): Promise<MiddlewareContext | NextResponse> => {
      // params は composeMiddleware 側で既に解決されている
      // このミドルウェアは主に明示的に params が必要なことを示すために使用
      return ctx
    }
  }
  ```

⚠️ **実行順序の自動解決の利点:**
- 開発者が順序を間違えても壊れない構造
- `compose` の「順序依存」という地雷を避けられる
- `withTripOwnership()` を使うだけで、必要な依存関係が自動的に解決される
  
**Phase 2.1.5: `validateTripOwnership()` の最適化**
- DB アクセス回数を1回に最適化（trip + userId + existence の一括 JOIN）
- N+1問題を事前に回避

**Phase 2.2: エンドポイントへの適用**
- `app/api/trip/[tripSlug]/route.ts` - PUT, DELETE ハンドラー
- `app/api/trip/[tripSlug]/publish/route.ts` - POST, DELETE ハンドラー
- `app/api/trip/[tripSlug]/day/route.ts` - POST ハンドラー
- `app/api/trips/[tripSlug]/ical-token/route.ts` - POST, GET ハンドラー
- その他該当エンドポイント

**Phase 2.3: テストと検証**
- 既存のテストが正常に動作することを確認
- エラーハンドリングが正しく機能することを確認

#### 期待される効果

- **コード削減**: 約10箇所 × 6行 = **約60行のコード削減**
- **セキュリティ向上**: 所有権チェックの漏れを防止
- **可読性向上**: 認証と所有権チェックが一箇所に

---

### **パターン3: `validateDayOwnership()` パターン（2箇所）**

#### 現状

```typescript
// 現状のコード（2箇所で重複）
const ownership = await validateDayOwnership(dayId, userId)
if (ownership instanceof NextResponse) {
  return ownership // エラーレスポンスをそのまま返す
}
const { dayId, tripId, trip } = ownership
```

#### 改善方針

`withDayOwnership()` ラッパー関数を新規作成。パターン2と同様のアプローチ。

**注意**: 使用箇所が2箇所のみのため、優先度は中程度。

#### 実装計画

**Phase 3.1: `withDayOwnership()` ラッパー関数の作成**
- `lib/api/authorization-helpers.ts` に追加
- `withAuth()` と `validateDayOwnership()` を組み合わせた実装

**Phase 3.2: エンドポイントへの適用**
- `app/api/itineraries/route.ts` - POST, GET ハンドラー（既に `withAuth()` を使用している場合）

#### 期待される効果

- **コード削減**: 約2箇所 × 4行 = **約8行のコード削減**
- **一貫性向上**: パターン2と同様のパターンに統一

---

### **パターン4: `requireGooglePlacesApiKey()` パターン（約10箇所）**

#### 現状

```typescript
// 現状のコード（10箇所で重複）
const apiKeyResult = requireGooglePlacesApiKey()
if (apiKeyResult instanceof NextResponse) {
  return apiKeyResult
}
const GOOGLE_PLACES_API_KEY = apiKeyResult
```

#### 改善方針

⚠️ **重要な修正**: API Keyチェックは **Context Middleware** に乗せても良い

**2つの選択肢:**

**オプションA: Config Resolver から直接取得**（シンプル）
- API Key は環境変数 → 設定オブジェクト → 全関数から手軽に取得可能
- 認証や所有権のような「リクエストごとに変化するコンテキスト」と違う
- グローバル設定で完結するものなので、ラッパーにしない判断も正しい

**オプションB: Context Middleware に積む**（統一性重視）⭐ **推奨**
- Context 累積型に統一することで mental model が簡単になる
- `ctx.apiKeys.GOOGLE_PLACES` のようにアクセスできる
- 必要なときだけ context に apiKeys を生やす

**推奨: オプションB（Context Middleware に統一）**

**改善策:**
```typescript
// ✅ オプションA: Config Resolver から直接取得（シンプル）
import { getApiKeys } from '@/lib/config/api-keys'

export async function POST(request: NextRequest) {
  const { GOOGLE_PLACES_KEY } = getApiKeys('googlePlaces')
  if (!GOOGLE_PLACES_KEY) {
    return internalError('Google Places API key is not configured')
  }
  // 以降の処理
}

// ✅ オプションB: Context Middleware に積む（統一性重視）⭐ 推奨
export const POST = composeMiddleware(
  withErrorHandling,
  withGooglePlacesKey  // ctx.apiKeys.GOOGLE_PLACES を生やす
)(async (request, ctx) => {
  const apiKey = ctx.apiKeys!.GOOGLE_PLACES!
  // 以降の処理
})

/**
 * Google Places API Key を context に追加するミドルウェア
 */
export function withGooglePlacesKey(): Middleware {
  return async (request: NextRequest, ctx: MiddlewareContext): Promise<MiddlewareContext | NextResponse> => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
    if (!key) {
      return internalError('Google Places API key is not configured')
    }
    
    return {
      ...ctx,
      apiKeys: {
        ...ctx.apiKeys,
        GOOGLE_PLACES: key
      }
    }
  }
}
```

**利点（オプションB）:**
- Context 累積型に統一され、mental model が簡単
- handler の型が統一される（`handler(request, ctx)`）
- 他のミドルウェアと同じパターンで使用できる

#### 実装計画

**Phase 4.1: API Key Context Middleware の作成**

⚠️ **方針変更**: Context Middleware として実装（統一性重視）

- `lib/api/external-api-helpers.ts` に追加
- Context 累積型ミドルウェアとして実装
- シグネチャ例:
  ```typescript
  /**
   * Google Places API Key を context に追加するミドルウェア
   */
  export function withGooglePlacesKey(): Middleware {
    return async (request: NextRequest, ctx: MiddlewareContext): Promise<MiddlewareContext | NextResponse> => {
      const key = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
      if (!key) {
        return internalError('Google Places API key is not configured')
      }
      
      return {
        ...ctx,
        apiKeys: {
          ...ctx.apiKeys,
          GOOGLE_PLACES: key
        }
      }
    }
  }

  /**
   * Google Geocoding API Key を context に追加するミドルウェア
   * (Google Places API Key と共用)
   */
  export function withGoogleGeocodingKey(): Middleware {
    return async (request: NextRequest, ctx: MiddlewareContext): Promise<MiddlewareContext | NextResponse> => {
      const key = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY // 共用
      if (!key) {
        return internalError('Google Geocoding API key is not configured')
      }
      
      return {
        ...ctx,
        apiKeys: {
          ...ctx.apiKeys,
          GOOGLE_GEOCODING: key
        }
      }
    }
  }

  /**
   * Unsplash API Key を context に追加するミドルウェア
   */
  export function withUnsplashKey(): Middleware {
    return async (request: NextRequest, ctx: MiddlewareContext): Promise<MiddlewareContext | NextResponse> => {
      const key = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY || process.env.UNSPLASH_ACCESS_KEY
      if (!key) {
        return internalError('Unsplash API key is not configured')
      }
      
      return {
        ...ctx,
        apiKeys: {
          ...ctx.apiKeys,
          UNSPLASH: key
        }
      }
    }
  }
  ```

**使用例:**
```typescript
// ✅ Context Middleware として使用
export const POST = composeMiddleware(
  withErrorHandling,
  withGooglePlacesKey  // ctx.apiKeys.GOOGLE_PLACES を生やす
)(async (request, ctx) => {
  const apiKey = ctx.apiKeys!.GOOGLE_PLACES!
  // API呼び出し
})
```

**Phase 4.2: エンドポイントへの適用**
- `app/api/places/search/route.ts`
- `app/api/places/details/route.ts`
- `app/api/places/nearby/route.ts`
- `app/api/places/photo/route.ts`
- `app/api/geocoding/geocode/route.ts`
- `app/api/geocoding/reverse/route.ts`
- `app/api/distance/route.ts`
- `app/api/distance/batch/route.ts`
- `app/api/route-optimization/route.ts`
- `app/api/unsplash/route.ts`

**Phase 4.3: パターン5との統合検討**
- `withApiKey()` と `withExternalApiErrorHandler()` を組み合わせて使用
- または、より高レベルのラッパーを作成

#### 期待される効果

- **コード削減**: 約10箇所 × 4行 = **約40行のコード削減**
- **一貫性向上**: API Keyチェックが統一されたパターンに

---

### **パターン5: `withExternalApiErrorHandler()` パターン（約10箇所）**

#### 現状

```typescript
// 現状のコード（10箇所で重複）
const data = await withExternalApiErrorHandler(
  async () => {
    // API呼び出し
    const response = await fetch(...)
    if (!response.ok) {
      throw new Error(...)
    }
    return await response.json()
  },
  'API Name',
  '/api/endpoint'
)

if (data instanceof NextResponse) {
  return data
}
// dataを使用
```

#### 改善方針

⚠️ **重要な修正**: `withExternalApiErrorHandler()` は内部で `NextResponse` を返すのではなく、**throw する**方が安全

**なぜか？**
- エラーの場合に内部で直接 `NextResponse` を返すと、ハンドラーの戻り値型が曖昧になる
  - 成功: JSONデータ
  - 失敗: NextResponse
- TypeScript が推論不能になりがち
- 将来「予期せぬ NextResponse が上位に漏れて黒魔術」みたいな動作の温床になる

**改善策:**
```typescript
// ❌ 悪い例: 内部で NextResponse を返す
const data = await withExternalApiErrorHandler(async () => {...}, 'API Name', '/api/endpoint')
if (data instanceof NextResponse) {
  return data // 型が曖昧
}

// ✅ 良い例: throw してラッパーで catch
try {
  const data = await withExternalApiErrorHandler(async () => {...}, 'API Name', '/api/endpoint')
  return NextResponse.json(data) // data は常に成功データ
} catch (error) {
  return handleApiError(error, '/api/endpoint')
}
```

**利点:**
- ラッパーの責務が明確: 「データを返すか例外を投げるか」で統一
- TypeScript の型推論が正常に機能
- 将来の混乱を防止

#### 実装計画

**Phase 5.1: `withExternalApiErrorHandler()` の改善**

⚠️ **方針変更**: エラーの場合は `throw` し、ラッパー側で catch する

- エラーの場合は `ApiError` を throw する
- 成功時のみデータを返す（`T` 型）
- 呼び出し側で `try-catch` を使用

```typescript
/**
 * 外部API呼び出しのエラーハンドリング付きラッパー
 * エラー時は例外を投げ、成功時はデータを返す
 * 
 * @param apiCall - 外部API呼び出し関数
 * @param apiName - API名（ログ用）
 * @param endpoint - エンドポイント名（エラーハンドリング用）
 * @returns API呼び出し結果（成功時のみ、例外で返らない）
 * @throws ApiError - API呼び出し失敗時
 */
export async function withExternalApiErrorHandler<T>(
  apiCall: () => Promise<T>,
  apiName: string,
  endpoint: string
): Promise<T> { // NextResponse を返さない
  try {
    return await apiCall()
  } catch (error) {
    logger.error(`${apiName} error:`, error)
    
    // ApiError に変換して throw
    if (error instanceof ApiError) {
      throw error
    }
    
    throw createExternalApiError(
      error instanceof Error ? error.message : String(error),
      { endpoint, apiName }
    )
  }
}
```

**Phase 5.2: エンドポイントへの適用**
- パターン4と同じエンドポイント（外部APIを使用する全てのエンドポイント）

**Phase 5.3: パターン4との統合**
- `withApiKey()` と `withExternalApiErrorHandler()` を組み合わせた高レベルラッパーの作成を検討

#### 期待される効果

- **コード削減**: 約10箇所 × 3行 = **約30行のコード削減**
- **一貫性向上**: 外部APIエラーハンドリングが統一される

---

## 📊 全体の優先度と実装順序

### 推奨実装順序

⚠️ **重要な追加**: **Phase 0: Context 累積型ミドルウェア基盤の構築** を最優先で実装

**Phase 0: Context 累積型ミドルウェア基盤の構築**（優先度: 🔴 最高）

**理由**: 
- ラッパー増殖を防ぐため、最初に基盤を作成する必要がある
- **型の `T | NextResponse` を消して、ハンドラーに「成功時の純粋な値」だけを渡す**ことで `requireAuth` 地獄を一掃
- ミドルウェアの型シグネチャが複雑化する危険を回避（Context 累積型により handler の型が固定される）

⚠️ **設計の重要な変更**: **Context 累積型ミドルウェアパターン**を採用

**なぜか？**
- 現在の案では `handler(request, auth, ownership, params)` のように引数が変わるパターンが複数できる
- この方向で進むと「composeMiddleware に渡す関数の型地獄」が入り込む
- Context を累積させる方式にすることで、handler の型を統一できる

**実装内容:**
```typescript
/**
 * ミドルウェアコンテキストの型定義
 * ミドルウェアが順次 context を肥やしていく
 */
export interface MiddlewareContext {
  auth?: AuthResult
  trip?: TripOwnershipResult
  day?: DayOwnershipResult
  params?: Record<string, any>
  apiKeys?: {
    GOOGLE_PLACES?: string
    GOOGLE_GEOCODING?: string
    UNSPLASH?: string
  }
}

/**
 * ミドルウェア関数の型定義
 * request と context を受け取り、context を拡張するか NextResponse を返す
 */
type Middleware = (
  request: NextRequest,
  ctx: MiddlewareContext
) => Promise<
  | MiddlewareContext  // 成功: context を拡張して返す
  | NextResponse       // エラー: エラーレスポンスを返す
>

/**
 * 複数のミドルウェアを組み合わせる
 * Context を累積させる方式
 */
export function composeMiddleware(
  ...middlewares: Middleware[]
) {
  return (handler: (request: NextRequest, ctx: MiddlewareContext) => Promise<NextResponse>) => {
    return async (
      request: NextRequest,
      context: { params?: Promise<Record<string, any>> }
    ): Promise<NextResponse> => {
      // 初期 context を構築
      let ctx: MiddlewareContext = {
        // params があれば先に解決（Next.js 15 の Promise 問題を吸収）
        ...(context.params ? { params: await context.params } : {})
      }

      // ミドルウェアを順次実行
      for (const mw of middlewares) {
        const result = await mw(request, ctx)
        
        // エラーレスポンスの場合は即座に返す
        if (result instanceof NextResponse) {
          return result
        }
        
        // Context を累積
        ctx = result
      }

      // 最終的に handler を実行（ctx には必要な値が全て揃っている）
      return handler(request, ctx)
    }
  }
}

/**
 * 標準プリセット: Trip API（認証 + 所有権チェック）
 */
export const tripApi = composeMiddleware(
  withErrorHandling,
  withAuth,
  withTripOwnership
)

/**
 * 標準プリセット: Day API（認証 + Day所有権チェック）
 */
export const dayApi = composeMiddleware(
  withErrorHandling,
  withAuth,
  withDayOwnership
)

/**
 * 標準プリセット: External API（エラーハンドリングのみ）
 */
export const externalApi = composeMiddleware(
  withErrorHandling
)

/**
 * 標準プリセット: Public API（認証不要）
 */
export const publicApi = composeMiddleware(
  withErrorHandling
)

/**
 * 標準プリセット: Optional Auth API（認証はオプショナル）
 */
export const optionalAuthApi = composeMiddleware(
  withErrorHandling,
  withOptionalAuth
)
```

**使用例:**
```typescript
// ❌ 旧方式: 引数が変わるパターンが複数できる
export const PUT = withAuth(async (request, auth, params) => {...})
export const PUT = withTripOwnership(async (request, auth, ownership, params) => {...})

// ✅ 新方式: handler の型が統一される
export const PUT = tripApi(async (request, ctx) => {
  // ctx.auth, ctx.trip, ctx.params が全て揃っている
  const { userId } = ctx.auth!
  const { tripId, trip } = ctx.trip!
  const { tripSlug } = ctx.params!
  // ...
})
```

**Phase 1: `requireAuth()` パターン**（優先度: 🔴 高）
- 影響範囲が最も大きく、基盤となる機能
- 既存の `withAuth()` を活用できるため実装が容易
- **Phase 0 完了後に実装**

**Phase 2: `validateTripOwnership()` パターン**（優先度: 🔴 高）
- セキュリティ上重要
- Phase 1の完了後に実装
- **N+1問題に注意**: DB アクセスを1回に最適化

**Phase 3: `validateDayOwnership()` パターン**（優先度: 🟡 中）
- Phase 2と同様のパターンのため、Phase 2の後に実装

**Phase 4: API Key Context Middleware**（優先度: 🟡 中）
- **方針変更**: Context Middleware として実装（統一性重視）
- 外部APIエンドポイントのみに影響
- Phase 1-3完了後に実装

**Phase 5: `withExternalApiErrorHandler()` の改善**（優先度: 🟡 中）
- **方針変更**: throw するパターンに変更
- Phase 4と同時に、またはその後に実装

### 実装期間の見積もり

- **Phase 0**: 3-5日（Context 累積型ミドルウェア基盤の構築）⭐ **最優先**
- **Phase 1**: 2-3日（既存の `withAuth()` を Context Middleware に移行）
- **Phase 2**: 3-4日（ミドルウェア関数の作成 + N+1問題の最適化 + 実行順序の自動解決）
- **Phase 3**: 1-2日（Phase 2の延長）
- **Phase 4**: 2-3日（API Key Context Middleware の作成）
- **Phase 5**: 2-3日（既存関数の改善）

**合計**: 約13-20日

⚠️ **注意**: Phase 0 は基盤となるため、十分な時間をかけて設計・実装することが重要

---

## 🎯 期待される全体効果

### コード削減

- Phase 1: 約120行削減
- Phase 2: 約60行削減
- Phase 3: 約8行削減
- Phase 4: 約40行削減
- Phase 5: 約30行削減

**合計: 約260行のコード削減**

### その他の効果

- **保守性向上**: 制御フローが一箇所に集約され、変更が容易に
- **一貫性向上**: 全てのエンドポイントで統一されたパターン
- **バグ削減**: チェック漏れやエラーハンドリングの不備を防止
- **可読性向上**: ボイラープレートコードが削減され、ビジネスロジックに集中できる

---

## 📝 注意事項

1. **後方互換性**: 既存の `requireAuth()` などの関数は削除せず、非推奨マークを付与
2. **動的パラメータ**: Next.js 15の `params` が `Promise` であることを考慮し、**ラッパー側で解決する**
3. **特殊ケース**: 認証がオプショナルなエンドポイントや、開発環境用フォールバックが必要なエンドポイントは個別に検討
4. **テスト**: 各フェーズで既存のテストが正常に動作することを確認
5. **N+1問題**: 所有権チェックは DB アクセス回数を1回に最適化する（trip + userId + existence の一括 JOIN）
6. **ラッパー増殖の防止**: 個別のラッパー関数を増やすのではなく、Composable Middleware パターンを使用
7. **標準プリセットの提供**: `tripApi`, `dayApi`, `externalApi` などの標準プリセットを作成し、開発者が迷わないようにする

## 🚨 将来の地雷を封じるためのチェックリスト

- [ ] ラッパー関数が5個以上になっていないか？（→ Composable Middleware に移行）
- [ ] `instanceof NextResponse` チェックが残っていないか？（→ ラッパー内で処理）
- [ ] `await params` が呼び出し側に残っていないか？（→ ラッパー側で解決）
- [ ] API Key チェックがラッパーに含まれていないか？（→ Context Middleware に移行）
- [ ] `withExternalApiErrorHandler()` が NextResponse を返していないか？（→ throw に変更）
- [ ] 標準プリセット（`tripApi`, `dayApi` など）が作成されているか？
- [ ] N+1問題が発生していないか？（所有権チェックの最適化）
- [ ] 順序依存が明確か？（認証 → 所有権チェックの順序を強制）

---

## 📚 参考資料

- `docs/planning/api-route-refactoring.md` - API Route認証チェック共通化の実装例
- `docs/planning/repetitive-control-logic-refactoring.md` - 制御ロジック重複のリファクタリング提案
- `lib/core/error-handler.ts` - 既存の `withAuth()` 実装
- `lib/api/authorization-helpers.ts` - 所有権チェックヘルパー関数

