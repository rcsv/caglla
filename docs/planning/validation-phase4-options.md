# Phase 4: バリデーション移行の2つのアプローチ

## 概要

Phase 4 では、既存のバリデーション関数を zod スキーマに統合します。
2つのアプローチがあります：

- **オプション A**: エンドポイント単位で移行（縦に攻める）
- **オプション B**: 既存バリデーション関数を zod に統合（横に攻める）

---

## オプション A: エンドポイント単位で移行（縦に攻める）

### アプローチ

**1つのエンドポイント全体を zod + ミドルウェアに移行**

### 手順

1. 対象エンドポイントを選択（例: `app/api/trips/route.ts` POST）
2. そのエンドポイント内の**すべてのバリデーション**を zod スキーマに変換
3. `withBodyValidation` ミドルウェアを使用して移行
4. 成功したら次のエンドポイントへ

### 具体例

**Before（現在）:**
```typescript
// app/api/trips/route.ts
export const POST = authApi(async (request, ctx) => {
  const body = await parseRequestBody<{...}>(request)
  
  // 手動バリデーション
  const finalTitle = title || destination
  if (!finalTitle) {
    return badRequest('Title or destination is required')
  }
  
  if (isTemplate && !normalizedDayCount) {
    return badRequest('Template trips require a positive day count')
  }
  
  // ... 処理 ...
})
```

**After（zod + ミドルウェア）:**
```typescript
// app/api/trips/route.ts
export const POST = composeMiddleware(
  withAuth(),
  withBodyValidation(CreateTripSchema) // zod スキーマでバリデーション
)(async (request, ctx) => {
  const body = ctx.body! // バリデーション済み & 型推論
  
  // if 文のバリデーションが全て消える
  const finalTitle = body.title || body.destination
  
  // ... 処理 ...
})
```

### メリット

✅ **即座に効果が出る**: 1つのエンドポイントを完全に移行できる  
✅ **成功パターンが明確**: 1つのエンドポイントが成功すると、他のエンドポイントでも同じパターンを適用できる  
✅ **段階的な移行**: 1つずつ確実に移行できる  
✅ **既存コードへの影響が小さい**: 1つのエンドポイントだけ変更するため、リスクが低い

### デメリット

❌ **進捗が遅い**: エンドポイント数が多いと時間がかかる  
❌ **一時的に2つの方式が混在**: 移行途中は古い方式と新しい方式が共存する

---

## オプション B: 既存バリデーション関数を zod に統合（横に攻める）

### アプローチ

**既存のバリデーション関数の実装を zod に置き換える**

### 対象となる既存関数

1. **`validateReservationInfo()`** (`lib/utils/reservation-utils.ts`)
   - 予約情報の包括的なバリデーション
   - → `ReservationSchema` に統合

2. **`validateAirportCode()`** (`lib/utils/reservation-utils.ts`)
   - 空港コードのバリデーション
   - → zod regex に吸収（既に `lib/schemas/reservation.ts` に実装済み）

3. **`validateFlightNumber()`** (`lib/utils/reservation-utils.ts`)
   - 便名のバリデーション
   - → zod regex に吸収（既に `lib/schemas/reservation.ts` に実装済み）

4. **`validateRequestBody()`** (`lib/core/error-handler.ts`)
   - リクエストボディの必須フィールドチェック
   - → zod スキーマに統合

5. **`validateRequiredParam()`** (`lib/core/error-handler.ts`)
   - 必須パラメータチェック
   - → zod スキーマに統合

6. **`validateNumberParam()`** (`lib/core/error-handler.ts`)
   - 数値パラメータチェック
   - → zod 数値スキーマに統合

### 手順

#### Step 1: 既存関数を zod ベースに書き換え

**Before:**
```typescript
// lib/utils/reservation-utils.ts
export function validateReservationInfo(reservation: Partial<ReservationInfo>): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!reservation.type) {
    errors.push(t('reservation.validation.typeRequired'))
  }
  
  if (reservation.type === 'flight') {
    if (!reservation.flight_number) {
      errors.push(t('reservation.validation.flightNumberRequired'))
    }
    // ...
  }
  
  return { isValid: errors.length === 0, errors }
}
```

**After:**
```typescript
// lib/utils/reservation-utils.ts
import { ReservationSchema } from '@/lib/schemas/reservation'
import { z } from 'zod'

/**
 * @deprecated Use ReservationSchema.parse() instead
 * 
 * 後方互換性のため、zod スキーマをラップした関数を提供
 */
export function validateReservationInfo(reservation: Partial<ReservationInfo>): { isValid: boolean; errors: string[] } {
  try {
    ReservationSchema.parse(reservation)
    return { isValid: true, errors: [] }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map(err => err.message)
      }
    }
    return { isValid: false, errors: ['Validation failed'] }
  }
}
```

#### Step 2: 使用箇所を段階的に移行

**Before:**
```typescript
// app/api/itineraries/route.ts
const validation = validateReservationInfo(reservation)
if (!validation.isValid) {
  return badRequest(validation.errors.join(', '))
}
```

**After:**
```typescript
// app/api/itineraries/route.ts
import { ReservationSchema } from '@/lib/schemas/reservation'

// zod スキーマで直接バリデーション
const validated = ReservationSchema.parse(reservation)
```

#### Step 3: 最終的に既存関数を削除

すべての使用箇所を移行した後、既存のバリデーション関数を削除。

### メリット

✅ **根本的な解決**: 既存のバリデーション関数を zod に統一できる  
✅ **一貫性の向上**: すべてのバリデーションが zod ベースになる  
✅ **コードの削減**: 既存のバリデーション関数の実装コードが削減される  
✅ **型安全性**: zod の型推論により、型安全性が向上

### デメリット

❌ **影響範囲が広い**: 既存関数を使用している箇所すべてに影響する  
❌ **段階的な移行が難しい**: 関数を書き換えると、すべての使用箇所が影響を受ける  
❌ **既存の動作が変わる可能性**: バリデーションロジックが微妙に変わる可能性がある

---

## 推奨されるアプローチ

### **ハイブリッドアプローチ（推奨）**

両方のアプローチを組み合わせる：

1. **Phase 4.1**: 既存バリデーション関数を zod ラッパーに置き換え（後方互換性を保つ）
   - `validateReservationInfo()` → `ReservationSchema` を内部で使用
   - `validateAirportCode()` → zod regex を使用
   - `validateFlightNumber()` → zod regex を使用
   - 既存の API は変更不要（内部実装だけ変更）

2. **Phase 4.2**: エンドポイント単位で zod + ミドルウェアに移行（オプション A）
   - 新しいエンドポイントは zod + ミドルウェアを使用
   - 既存のエンドポイントは段階的に移行

3. **Phase 4.3**: 既存関数を deprecated にして、最終的に削除
   - すべてのエンドポイントを zod + ミドルウェアに移行後、既存関数を削除

### このアプローチのメリット

✅ **既存コードへの影響が最小限**: 既存関数を zod ラッパーに置き換えるだけなので、既存のエンドポイントは変更不要  
✅ **段階的な移行**: エンドポイント単位で移行できる  
✅ **後方互換性**: 既存のコードが動き続ける  
✅ **一貫性**: 最終的にすべてのバリデーションが zod ベースになる

---

## 結論

**オプション B の詳細を理解したい場合:**

- **Step 1**: 既存バリデーション関数を zod ラッパーに置き換え（後方互換性を保つ）
- **Step 2**: エンドポイント単位で zod + ミドルウェアに移行（オプション A）
- **Step 3**: 既存関数を削除

このハイブリッドアプローチにより、**既存コードへの影響を最小限に抑えながら、段階的に zod ベースのバリデーションに移行**できます。

