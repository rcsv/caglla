# 制御ロジック重複のリファクタリング提案

**作成日**: 2025-11-15  
**目的**: API Routeにおける重複した制御ロジックを特定し、共通化してコードの保守性を向上

---

## 🔍 特定された重複パターン

### **パターン1: Day → Trip 所有権チェックの重複（3箇所）**

以下のパターンが複数箇所で重複しています：

```typescript
// 重複パターン（app/api/itineraries/route.ts, 他）
const dayDoc = await adminDb.collection(COLLECTIONS.DAYS).doc(day_id).get()
if (!dayDoc.exists) {
  return notFound('Day')
}

const dayData = dayDoc.data()
if (!dayData?.trip_id) {
  return badRequest('Day has no trip_id')
}

const tripDoc = await adminDb.collection(COLLECTIONS.TRIPS).doc(dayData.trip_id).get()
if (!tripDoc.exists) {
  return notFound('Trip')
}

const tripData = tripDoc.data()
if (tripData?.user_id !== userId) {
  throw createForbiddenError('You do not own this trip')
}
```

**影響範囲:**
- `app/api/itineraries/route.ts` - 2箇所（POST, GET）
- `app/api/itineraries/insert/route.ts` - 1箇所（POST）

**提案:**
`lib/api/authorization-helpers.ts` に以下の関数を追加：

```typescript
/**
 * day_idからtripを取得し、所有権をチェック
 * @returns TripデータとtripId、またはエラーレスポンス
 */
export async function validateDayOwnership(
  dayId: string,
  userId: string
): Promise<{ tripId: string; trip: Trip } | NextResponse>
```

---

### **パターン2: Trip解決と所有権チェックの重複（10箇所以上）**

以下のパターンが多数のエンドポイントで重複：

```typescript
// 重複パターン（app/api/trip/[tripSlug]/route.ts, 他）
const resolved = await adminTripOperations.resolveTripByIdOrSlug(tripSlug)
if (!resolved) {
  return notFound('Trip')
}

const { id: tripId, trip } = resolved

if (trip.user_id !== userId) {
  throw createForbiddenError('You do not own this trip')
}
```

**影響範囲:**
- `app/api/trip/[tripSlug]/route.ts` - 3箇所（GET, PUT, DELETE）
- `app/api/trip/[tripSlug]/day/route.ts` - 1箇所（POST）
- `app/api/trip/[tripSlug]/replica/route.ts` - 1箇所（POST）
- `app/api/trip/[tripSlug]/publish/route.ts` - 2箇所（POST, DELETE）
- `app/api/trips/[tripSlug]/checklist/generate/route.ts` - 1箇所（POST）
- `app/api/trips/[tripSlug]/reservations/route.ts` - 1箇所（GET）
- `app/api/trips/[tripSlug]/ical-token/route.ts` - 2箇所（POST, GET）
- その他

**提案:**
`lib/api/authorization-helpers.ts` に以下の関数を追加：

```typescript
/**
 * tripSlugからtripを解決し、所有権をチェック
 * @returns TripデータとtripId、またはエラーレスポンス
 */
export async function validateTripOwnership(
  tripSlug: string,
  userId: string
): Promise<{ tripId: string; trip: Trip } | NextResponse>
```

---

### **パターン3: 直接`request.json()`呼び出し（16箇所）**

`parseRequestBody()` ヘルパー関数が既に存在するにも関わらず、直接 `request.json()` を呼び出している箇所が多数存在：

```typescript
// 重複パターン（16箇所）
const body = await request.json()
const { dayId, itineraryIds } = body
```

**影響範囲:**
- `app/api/user/plan/route.ts` - 1箇所
- `app/api/unsplash/route.ts` - 1箇所
- `app/api/trips/[tripSlug]/checklist/route.ts` - 1箇所
- `app/api/route-optimization/route.ts` - 1箇所
- `app/api/reservation-templates/route.ts` - 1箇所
- `app/api/reservation-templates/[templateId]/route.ts` - 1箇所
- `app/api/places/search/route.ts` - 1箇所
- `app/api/places/nearby/route.ts` - 1箇所
- `app/api/places/details/route.ts` - 1箇所
- `app/api/itineraries/reorder/route.ts` - 1箇所
- `app/api/itineraries/move-to-day/route.ts` - 1箇所
- `app/api/itineraries/duplicate-to-day/route.ts` - 1箇所
- `app/api/geocoding/reverse/route.ts` - 1箇所
- `app/api/geocoding/geocode/route.ts` - 1箇所
- `app/api/distance/route.ts` - 1箇所
- `app/api/distance/batch/route.ts` - 1箇所

**提案:**
すべての `request.json()` 呼び出しを `parseRequestBody<T>()` に置き換え

---

### **パターン4: 外部API呼び出しのエラーハンドリング（複数箇所）**

外部API呼び出し時のtry-catchとエラーレスポンス生成が重複：

```typescript
// 重複パターン（app/api/unsplash/route.ts, 他）
try {
  // API呼び出し
} catch (error) {
  logger.error('API error:', error)
  
  if (error instanceof Error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
  
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  )
}
```

**影響範囲:**
- `app/api/unsplash/route.ts` - 2箇所（GET, POST）
- `app/api/places/search/route.ts` - 1箇所
- `app/api/places/details/route.ts` - 1箇所
- `app/api/weather/route.ts` - 1箇所（推測）
- その他外部API呼び出し箇所

**提案:**
`lib/api/external-api-helpers.ts` に以下の関数を追加：

```typescript
/**
 * 外部API呼び出しのエラーハンドリング
 */
export async function withExternalApiErrorHandler<T>(
  apiCall: () => Promise<T>
): Promise<T | NextResponse>
```

---

### **パターン5: Firebase Admin SDK初期化チェック（3箇所）**

開発環境でのフォールバック用のチェックが重複：

```typescript
// 重複パターン（3箇所）
if (!adminDb) {
  logger.warn('Firebase Admin SDK not initialized, returning empty/default response')
  return NextResponse.json({ ... })
}
```

**影響範囲:**
- `app/api/trips/accessible/route.ts` - 1箇所
- `app/api/trips/recommended/route.ts` - 1箇所
- `app/api/itineraries/reorder/route.ts` - 1箇所

**注意:** 
`lib/firebase/admin.ts` では既に初期化時にエラーを投げるようになっているため、これらのチェックは開発環境でのフォールバック用の可能性がある。削除するか、共通化するかを検討。

**提案:**
開発環境でのみ有効なヘルパー関数を作成：

```typescript
/**
 * 開発環境でのみFirebase Admin SDK初期化チェック
 */
export function requireAdminDb(): Firestore | NextResponse
```

---

## 📊 優先度と影響範囲

| パターン | 影響箇所 | 優先度 | 理由 |
|---------|---------|--------|------|
| パターン2: Trip所有権チェック | 10箇所以上 | 🔴 高 | 最も頻繁に使用されるパターン |
| パターン1: Day → Trip所有権チェック | 3箇所 | 🟡 中 | 頻度は低いが、複雑なロジック |
| パターン3: `request.json()`置き換え | 16箇所 | 🟡 中 | 既存ヘルパー関数を活用 |
| パターン4: 外部APIエラーハンドリング | 5箇所以上 | 🟢 低 | 影響範囲は限定的 |
| パターン5: Admin SDKチェック | 3箇所 | 🟢 低 | 開発環境のみの特殊ケース |

---

## ✅ 実装提案

### Phase 1: 所有権チェックの共通化（優先度：高）

1. **`lib/api/authorization-helpers.ts` を作成**
   - `validateTripOwnership(tripSlug, userId)` 関数
   - `validateDayOwnership(dayId, userId)` 関数

2. **既存エンドポイントをリファクタリング**
   - パターン2（Trip所有権チェック）を適用
   - パターン1（Day → Trip所有権チェック）を適用

### Phase 2: リクエストボディパースの統一（優先度：中）

1. **既存の`parseRequestBody()`を活用**
   - 16箇所の `request.json()` を `parseRequestBody<T>()` に置き換え

### Phase 3: 外部APIエラーハンドリングの共通化（優先度：低）

1. **`lib/api/external-api-helpers.ts` を作成**
   - `withExternalApiErrorHandler()` 関数

2. **外部API呼び出し箇所をリファクタリング**

---

## 🎯 期待される効果

- **コード削減**: 約200-300行以上の重複コード削減
- **保守性向上**: 所有権チェックロジックの変更が一箇所で完結
- **一貫性**: すべてのエンドポイントで統一されたエラーハンドリング
- **バグ削減**: 所有権チェックの漏れを防止

---

## 📝 参考

- `docs/planning/api-route-refactoring.md` - API Route認証チェック共通化の実装例
- `docs/planning/firestore-client-refactoring.md` - Firestore client初期化チェックの共通化提案

