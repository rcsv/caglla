# 入力バリデーション実装状況の分析・改善計画

## 概要

本ドキュメントは、Caglla Travel Manager における入力バリデーションの実装状況を分析し、**zod によるスキーマバリデーション導入**による体系化計画を提示します。

## 🎯 目標：原始人からの脱却

現在のバリデーション実装は「原始人レベル」の状態です：
- 各所の `if` 文バリデーション
- 分散した `badRequest`
- 型推論が効かない `parse → as T` キャスト

これらは、プロダクトが MVP を抜けて**「本番運用に耐える規模」**になってきている証拠です。

ここで **「バリデーション設計を再構築」** すると、コード品質・実装速度・バグ率が**桁違いに改善**します。

---

## 現在の実装状況

### ✅ 存在するバリデーション機能

#### 1. 基本的なバリデーション関数 (`lib/core/error-handler.ts`)

以下の基本的なバリデーション関数が実装されています：

```typescript
// リクエストボディのバリデーション
validateRequestBody<T>(body: any, requiredFields: (keyof T)[]): T

// リクエストパラメータのバリデーション
validateRequiredParam(value: string | null | undefined, paramName: string): string

// 数値パラメータのバリデーション
validateNumberParam(value: string | null | undefined, paramName: string, options?: { min?: number; max?: number }): number

// JSONパース
parseRequestBody<T>(request: Request): Promise<T>
```

#### 2. ドメイン固有のバリデーション

- **予約情報**: `lib/utils/reservation-utils.ts`
  - `validateReservationInfo()`: 予約情報の包括的なバリデーション
  - `validateAirportCode()`: 空港コードのバリデーション
  - `validateFlightNumber()`: 便名のバリデーション
  - `isAllowedReservationUrl()`: URLのバリデーション

- **環境変数**: `lib/core/env-validation.ts`
  - `validateEnvironment()`: 環境変数のバリデーション

#### 3. エラーハンドリング

- `createValidationError()`: バリデーションエラーの作成
- `badRequest()`: 400エラーのショートカット
- `ApiError` クラス: 統一されたエラー表現

---

## 問題点と課題

### ❌ 1. バリデーションの体系化不足

**現状:**
- 各エンドポイントで個別に `if (!field) return badRequest(...)` パターンが多用されている
- `badRequest()` が53ファイルで使用されている（手動バリデーション）

**問題:**
- バリデーションロジックが分散しており、保守性が低い
- 同じバリデーションが複数箇所で重複実装されている
- 型安全性が不十分（`parseRequestBody<T>()` は `as T` でキャストしているだけ）

### ❌ 2. スキーマベースバリデーションの不在

**現状:**
- zod, yup, joi などのスキーマベースバリデーションライブラリが未使用
- `package.json` にも含まれていない

**問題:**
- 型安全なバリデーションができない
- バリデーションルールと型定義が分離している
- クライアント側とサーバー側でバリデーションロジックを共有できない

### ❌ 3. バリデーション関数の使用率が低い

**現状:**
- `validateRequestBody()` などの既存関数がほとんど使われていない
- 各エンドポイントで手動バリデーションが実装されている

**問題:**
- 統一されたバリデーション関数が活用されていない
- エラーメッセージが統一されていない

### ❌ 4. エラーメッセージの不統一

**現状:**
```typescript
// パターン1: 日本語メッセージ
return badRequest('プランのタイトルは必須です')

// パターン2: 英語メッセージ
return badRequest('Missing required fields: day_id, title, and place_id or place_data.place_id')

// パターン3: 詳細情報なし
return badRequest('Name and type are required')
```

**問題:**
- メッセージの言語が混在（日本語/英語）
- エラーメッセージの形式が統一されていない
- どのフィールドが問題なのか明確でない場合がある

---

## 使用状況の統計

### バリデーション関連の使用状況

| 関数/パターン | 使用ファイル数 | 主な用途 |
|------------|------------|---------|
| `badRequest()` | 53ファイル | 手動バリデーション後のエラー返却 |
| `parseRequestBody()` | 38ファイル | リクエストボディのパース |
| `validateRequestBody()` | ほぼ未使用 | - |
| `validateRequiredParam()` | ほぼ未使用 | - |
| `validateNumberParam()` | ほぼ未使用 | - |

### 典型的なバリデーションパターン

#### パターン1: 手動バリデーション（最も多い）
```typescript
const body = await parseRequestBody<RequestBody>(request)

if (!body.field1 || !body.field2) {
  return badRequest('Missing required fields: field1, field2')
}
```

#### パターン2: ドメイン固有バリデーション（予約情報のみ）
```typescript
const validation = validateReservationInfo(reservation)
if (!validation.isValid) {
  return badRequest(validation.errors.join(', '))
}
```

#### パターン3: インライン型チェック
```typescript
if (!day_id || !title || (!place_id && !place_data?.place_id)) {
  return badRequest('Missing required fields: day_id, title, and place_id or place_data.place_id')
}
```

---

## 🚀 改善計画：zod 導入による体系化

### 1. 設計方針（バリデーションの"あるべき姿"）

バリデーションは本来**「層」**で持つべきです：

```
[リクエスト層] withBodyValidation(schema) 
  ↓
[アプリケーション層] domain schema（例: ReservationSchema）
  ↓
[エンティティ層] ビジネスルール（カスタム refine）
```

現在はこの3つが全部 API ハンドラーに混ざっています。

→ **ミドルウェア導入 + zod に集約**すると整理できます。

### 2. zod 導入の推奨理由（"哲学"の話）

このプロダクトは **Next.js/TypeScript が中心**です。

なので**「型の源泉」がどこにあるか**が重要です。

**現在：**
- TypeScript の型
- 手書き if
- 独立した util

**→ 3種類に分裂。**

**未来：**
- **zod が「型の源泉」**
- TS 型は `z.infer<>` から自動生成
- バリデーションは zod
- ドメインルールも zod の `refine`

この形にすると、**型・検証・エラーメッセージが全部1か所で決まる**から、漏れが大幅に減ります。

### 3. ミドルウェア設計（composeMiddleware を活かす）

このプロジェクトは **Context ミドルウェア思想**がすでに育っています。

ここに「バリデーション」を自然に載せるのが上品です。

**例：**
```typescript
export const POST = composeMiddleware(
  withAuth(),
  withBodyValidation(CreateTripSchema)
)(async (req, ctx) => {
  // ctx.body が型安全 & バリデ済み
  const { title, description } = ctx.body
})
```

こうなると：
- API ハンドラーは本来のロジックに集中
- バリデーション漏れがゼロに近づく
- 再利用性が跳ね上がる

**→ とにかく、ハンドラーから `if` を追放する方向が吉。**

### 4. 既存コードへの移行戦略（現実的なステップ）

おすすめは**「縦に攻める」**。

#### 👍 ステップ1：1エンドポイントだけ zod + ミドルウェア化

- 新規エンドポイント or 修正中の API から始める
- 既存の `if` 文は触らない（壊れるから）
- **成功パターンを一つ作る**

#### 👍 ステップ2：スキーマを module として整理

構造例：
```
lib/
  schemas/
    trip.ts
    reservation.ts
    place.ts
  validators/
    withBodyValidation.ts
```

#### 👍 ステップ3：重複バリデーションの削除

- `validateReservationInfo` → `ReservationSchema` に移行
- `validateAirportCode` → zod regex に吸収
- `validateNumberParam` → 数値スキーマに統合

#### 👍 ステップ4：badRequest の乱立を zod のエラーに統一

`badRequest` は基本 `zodError → ApiError` に変換で吸収。

#### 👍 ステップ5：日本語/英語混在の解消

zod の `.refine()` と `.superRefine()` はメッセージを統一できる。

### 5. 実装上のコツ（経験則ベース）

- **`parseRequestBody<T>()` は廃止して良い**
  - zod が parse するので本質的には不要になる
  - `const data = await request.json()` → `const parsed = schema.parse(data)`

- **"必須"チェックは zod に任せる**
  - `if (!title)` の山が消える
  - `title: z.string().min(1, "title is required")`

- **flight number / airport code の規則は zod refine に集約**
  ```typescript
  const AirportCode = z.string().regex(/^[A-Z]{3}$/, "Invalid AIRPORT CODE")
  ```

- **URL の許可リストも zod で持てる**
  ```typescript
  z.string().url().refine(isAllowedReservationUrl)
  ```

- **エラーフォーマットは一箇所で統一**
  ```typescript
  catch (error) {
    return handleZodError(error) 
  }
  ```

---

## 📋 実装ロードマップ

### Phase 1: 基盤構築 ✅ TODO
- [ ] zod のインストール
- [ ] `withBodyValidation` ミドルウェアの実装
- [ ] zod エラーの `ApiError` 変換関数の実装
- [ ] スキーマディレクトリ構造の作成

### Phase 2: 実験エンドポイント ✅ TODO
- [ ] 1つの簡単なエンドポイントで zod + ミドルウェアを実装
- [ ] ビルド・動作確認
- [ ] 成功パターンのドキュメント化

### Phase 3: スキーマ整理 ✅ 完了
- [x] `lib/schemas/` ディレクトリの作成
- [x] Trip スキーマの作成（`CreateTripSchema`, `UpdateTripSchema`）
- [x] Reservation スキーマの作成（`ReservationSchema`, `FlightReservationSchema`, `OtherReservationSchema`）
- [x] Reservation Template スキーマの作成（`ReservationTemplateInputSchema`）
- [x] Place スキーマの作成（`PlaceSearchSchema`, `PlaceDetailsSchema`, `PlaceNearbySchema`）
- [x] スキーマ統合エクスポート（`lib/schemas/index.ts`）

### Phase 4: 既存バリデーションの統合 ✅ 完了
- [x] `validateAirportCode` → zod regex に吸収 ✅
- [x] `validateFlightNumber` → zod regex に吸収 ✅
- [x] `validateReservationInfo` 内の空港コード・便名バリデーションを zod スキーマに統合 ✅
- [x] `validateReservationInfo` → `ClientReservationInfoSchema` に完全移行 ✅
  - `FirestoreDate` 型（Date、Firestore Timestamp、string）に対応した `ClientReservationInfoSchema` を作成
  - zod スキーマベースのバリデーションに移行し、エラーメッセージは i18n 対応に変換
- [ ] `validateNumberParam` → 数値スキーマに統合（使用箇所が見つからなかったため、不要の可能性）

### Phase 6: エラー統一 ✅ 進行中
- [x] `badRequest` の乱立を zod エラーに統一 ✅
  - `badRequest` 関数を統一されたエラーレスポンス形式（`ApiError` + `handleApiError`）に更新
  - `unauthorized`, `notFound`, `internalError` も同様に統一
  - エラーレスポンス形式が統一され、エラーコード、タイムスタンプ、パスなどのメタデータが自動的に追加される
- [x] エラーレスポンス形式の統一（zod エラーの形式を標準化） ✅
  - `withBodyValidation` の zod エラーハンドリングが統一された形式を使用することを確認
  - エラーレスポンスにリクエストパスが含まれるように改善
- [ ] エラーメッセージの国際化対応（i18n キーを使用）
  - API エンドポイントでは多言語対応の必要性が低い可能性がある（クライアント側でエラーメッセージを処理する場合が多い）
  - 将来的な拡張として検討可能

## 結論

現在のバリデーション実装は**「原始人レベル」の状態**です。

**今後の方向性:**
- **zod が「型の源泉」**となる設計
- **Context ミドルウェア**にバリデーションを自然に統合
- **ハンドラーから `if` を追放**し、本来のロジックに集中

**推奨:** ステップ1（1エンドポイントでの実験）から着手し、成功パターンを確立してから段階的に展開します。

