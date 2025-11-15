/**
 * 標準プリセット API
 * 
 * よく使うミドルウェアの組み合わせをプリセットとして提供することで、
 * 開発者が迷わないようにする。
 * 
 * これらのプリセットを使用することで:
 * - どのミドルウェアを使うべきか迷わない
 * - 順序依存の問題を回避
 * - DX が爆上がりする
 */

import { composeMiddleware } from '@/lib/core/middleware'
import { withAuth } from './auth'
import { withParams } from './params'
import { withTripOwnership } from './trip-ownership'

/**
 * 認証のみが必要な API プリセット
 * 
 * 使用例:
 * ```typescript
 * export const GET = authApi(async (request, ctx) => {
 *   // ctx.auth が保証されている
 *   const { userId } = ctx.auth!
 *   // ...
 * })
 * ```
 */
export const authApi = composeMiddleware(
  withAuth()
)

/**
 * Trip API プリセット（認証 + 所有権チェック）
 * 
 * 使用例:
 * ```typescript
 * export const PUT = tripApi(async (request, ctx) => {
 *   // ctx.auth, ctx.trip, ctx.params が保証されている
 *   const { userId } = ctx.auth!
 *   const { tripId, trip } = ctx.trip!
 *   const { tripSlug } = ctx.params!
 *   // ...
 * })
 * ```
 */
export const tripApi = composeMiddleware(
  withAuth(),
  withParams(),
  withTripOwnership()
)

/**
 * Day API プリセット（認証 + Day所有権チェック）
 * 
 * 注意: `withDayOwnership()` は未実装のため、将来的に追加予定
 * 
 * 使用例:
 * ```typescript
 * export const POST = dayApi(async (request, ctx) => {
 *   // ctx.auth, ctx.day, ctx.params が保証されている
 *   const { userId } = ctx.auth!
 *   const { dayId, tripId, trip } = ctx.day!
 *   // ...
 * })
 * ```
 */
// export const dayApi = composeMiddleware(
//   withAuth(),
//   withParams(),
//   withDayOwnership()
// )

/**
 * External API プリセット（エラーハンドリングのみ）
 * 
 * 外部APIを呼び出すエンドポイントで使用
 * 
 * 使用例:
 * ```typescript
 * export const POST = externalApi(async (request, ctx) => {
 *   // エラーハンドリングが自動的に適用される
 *   // ...
 * })
 * ```
 */
export const externalApi = composeMiddleware(
  // エラーハンドリングは composeMiddleware 側で自動的に適用される
)

/**
 * Public API プリセット（認証不要）
 * 
 * 認証が不要なエンドポイントで使用
 * 
 * 使用例:
 * ```typescript
 * export const GET = publicApi(async (request, ctx) => {
 *   // 認証チェックなし
 *   // ...
 * })
 * ```
 */
export const publicApi = composeMiddleware(
  // エラーハンドリングのみ（認証チェックなし）
)

