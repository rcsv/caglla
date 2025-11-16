/**
 * Context 累積型ミドルウェア関数群
 * 
 * このディレクトリには、Context 累積型ミドルウェアパターンに従った
 * ミドルウェア関数を配置します。
 * 
 * 各ミドルウェアは:
 * - request と context を受け取る
 * - context を拡張するか NextResponse を返す
 * - 実行順序の依存関係を内部で解決する
 */

export { withAuth } from './auth'
export { withAdminAuth } from './admin-auth'
export { withParams } from './params'
export { withErrorHandling, withErrorHandlingWrapper } from './error-handling'
export { withTripOwnership } from './trip-ownership'
export { withDayOwnership } from './day-ownership'
export { withBodyValidation } from './body-validation'
export { withGooglePlacesKey, withGoogleGeocodingKey, withUnsplashKey } from './api-keys'
export { authApi, adminApi, tripApi, dayApi, dayApiWithQuery, externalApi, publicApi } from './presets'

