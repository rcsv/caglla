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
import { withAdminAuth } from './admin-auth'
import { withParams } from './params'
import { withTripOwnership } from './trip-ownership'
import { withDayOwnership } from './day-ownership'

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
 * dayId の取得元を指定可能（params, query, body）
 * デフォルトは params から取得
 * 
 * 使用例:
 * ```typescript
 * // params から dayId を取得する場合
 * export const GET = dayApi(async (request, ctx) => {
 *   // ctx.auth, ctx.day, ctx.params が保証されている
 *   const { userId } = ctx.auth!
 *   const { dayId, tripId, trip } = ctx.day!
 *   // ...
 * })
 * 
 * // query から day_id を取得する場合
 * export const GET = dayApiWithQuery(async (request, ctx) => {
 *   // ctx.auth, ctx.day が保証されている
 *   const { userId } = ctx.auth!
 *   const { dayId, tripId, trip } = ctx.day!
 *   // ...
 * })
 * ```
 */
export const dayApi = composeMiddleware(
  withAuth(),
  withParams(),
  withDayOwnership({ source: 'params' })
)

/**
 * Day API プリセット（query から day_id を取得）
 */
export const dayApiWithQuery = composeMiddleware(
  withAuth(),
  withDayOwnership({ source: 'query' })
)

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
 * Admin API プリセット（認証 + 管理者権限チェック）
 * 
 * 管理者専用エンドポイントで使用
 * 
 * 使用例:
 * ```typescript
 * export const POST = adminApi(async (request, ctx) => {
 *   // ctx.auth が保証されている（管理者権限確認済み）
 *   const { userId } = ctx.auth!
 *   // ...
 * })
 * ```
 */
export const adminApi = composeMiddleware(
  withAdminAuth()
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

