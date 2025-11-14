/**
 * 識別子型定義（型安全性による混同防止）
 * 
 * userSlug/google_id や tripSlug/tripId の混同を防ぐため、
 * Branded Typesを使用して異なる型として扱います。
 */

// ============================================================================
// Branded Types（型安全性による混同防止）
// ============================================================================

/**
 * User ID（Google Auth UID / Firestore の user_id / google_id）
 * 
 * 注意: user.id や user.google_id に使用される型
 * userSlug とは異なる型として扱う
 */
export type UserId = string & { readonly __brand: 'UserId' }

/**
 * User Slug（URL-safe スラッグ）
 * 
 * 注意: user.slug に使用される型
 * UserId (google_id) とは異なる型として扱う
 */
export type UserSlug = string & { readonly __brand: 'UserSlug' }

/**
 * Trip ID（Firestore Document ID）
 * 
 * 注意: trip.id に使用される型
 * TripSlug とは異なる型として扱う
 */
export type TripId = string & { readonly __brand: 'TripId' }

/**
 * Trip Slug（URL-safe スラッグ）
 * 
 * 注意: trip.slug に使用される型
 * TripId とは異なる型として扱う
 */
export type TripSlug = string & { readonly __brand: 'TripSlug' }

// ============================================================================
// 型アサーション関数（安全な変換）
// ============================================================================

/**
 * 文字列を UserId に変換
 * 
 * 注意: これは型アサーションのみで、実際の値の検証は行いません。
 * 実際の UserId であることが保証されている場合にのみ使用してください。
 * 
 * @param value 文字列
 * @returns UserId
 */
export function asUserId(value: string): UserId {
  return value as UserId
}

/**
 * 文字列を UserSlug に変換
 * 
 * 注意: これは型アサーションのみで、実際の値の検証は行いません。
 * 実際の UserSlug であることが保証されている場合にのみ使用してください。
 * 
 * @param value 文字列
 * @returns UserSlug
 */
export function asUserSlug(value: string): UserSlug {
  return value as UserSlug
}

/**
 * 文字列を TripId に変換
 * 
 * 注意: これは型アサーションのみで、実際の値の検証は行いません。
 * 実際の TripId であることが保証されている場合にのみ使用してください。
 * 
 * @param value 文字列
 * @returns TripId
 */
export function asTripId(value: string): TripId {
  return value as TripId
}

/**
 * 文字列を TripSlug に変換
 * 
 * 注意: これは型アサーションのみで、実際の値の検証は行いません。
 * 実際の TripSlug であることが保証されている場合にのみ使用してください。
 * 
 * @param value 文字列
 * @returns TripSlug
 */
export function asTripSlug(value: string): TripSlug {
  return value as TripSlug
}

// ============================================================================
// 比較関数（型安全性を保証した比較）
// ============================================================================

/**
 * 2つの UserId が同じかどうかを比較
 * 
 * @param a 最初の UserId
 * @param b 2番目の UserId
 * @returns 同じ場合 true
 */
export function isSameUserId(a: UserId, b: UserId): boolean {
  return a === b
}

/**
 * 2つの UserSlug が同じかどうかを比較
 * 
 * @param a 最初の UserSlug
 * @param b 2番目の UserSlug
 * @returns 同じ場合 true
 */
export function isSameUserSlug(a: UserSlug, b: UserSlug): boolean {
  return a === b
}

/**
 * 2つの TripId が同じかどうかを比較
 * 
 * @param a 最初の TripId
 * @param b 2番目の TripId
 * @returns 同じ場合 true
 */
export function isSameTripId(a: TripId, b: TripId): boolean {
  return a === b
}

/**
 * 2つの TripSlug が同じかどうかを比較
 * 
 * @param a 最初の TripSlug
 * @param b 2番目の TripSlug
 * @returns 同じ場合 true
 */
export function isSameTripSlug(a: TripSlug, b: TripSlug): boolean {
  return a === b
}

/**
 * UserId と UserSlug が同じユーザーを指しているかどうかを判定
 * 
 * 注意: この関数は実際のデータベースクエリを必要とします。
 * 軽量な比較が必要な場合は、事前に解決しておいてください。
 * 
 * @param userId UserId
 * @param userSlug UserSlug
 * @returns 同じユーザーの場合 true（非同期で実装が必要）
 */
export async function isSameUser(
  userId: UserId,
  userSlug: UserSlug
): Promise<boolean> {
  // 実装は lib/auth/identity-helpers.ts に分離
  // ここでは型定義のみ
  throw new Error('isSameUser is not implemented here. Use lib/auth/identity-helpers.ts')
}

/**
 * TripId と TripSlug が同じトリップを指しているかどうかを判定
 * 
 * 注意: この関数は実際のデータベースクエリを必要とします。
 * 軽量な比較が必要な場合は、事前に解決しておいてください。
 * 
 * @param tripId TripId
 * @param tripSlug TripSlug
 * @returns 同じトリップの場合 true（非同期で実装が必要）
 */
export async function isSameTrip(
  tripId: TripId,
  tripSlug: TripSlug
): Promise<boolean> {
  // 実装は lib/auth/identity-helpers.ts に分離
  // ここでは型定義のみ
  throw new Error('isSameTrip is not implemented here. Use lib/auth/identity-helpers.ts')
}

// ============================================================================
// 型ガード関数（実行時の型チェック）
// ============================================================================

/**
 * 文字列が UserId の形式に一致するかチェック
 * 
 * 注意: Firebase Auth UID の形式をチェックします。
 * 実際の存在確認は行いません。
 * 
 * @param value チェックする文字列
 * @returns UserId の形式に一致する場合 true
 */
export function isValidUserId(value: string): value is UserId {
  // Firebase Auth UID は通常 28 文字の英数字
  // 実際の検証ロジックは必要に応じて調整
  // 最低20文字以上の英数字（大文字・小文字・数字）
  return /^[a-zA-Z0-9]{20,}$/.test(value)
}

/**
 * 文字列が UserSlug の形式に一致するかチェック
 * 
 * @param value チェックする文字列
 * @returns UserSlug の形式に一致する場合 true
 */
export function isValidUserSlug(value: string): value is UserSlug {
  // URL-safe スラッグの形式をチェック
  return /^[a-z0-9-]+$/.test(value) && value.length > 0 && value.length <= 50
}

/**
 * 文字列が TripId の形式に一致するかチェック
 * 
 * 注意: Firestore Document ID の形式をチェックします。
 * 実際の存在確認は行いません。
 * 
 * @param value チェックする文字列
 * @returns TripId の形式に一致する場合 true
 */
export function isValidTripId(value: string): value is TripId {
  // Firestore Document ID は通常 20 文字の英数字
  // 実際の検証ロジックは必要に応じて調整
  // 最低20文字以上の英数字（大文字・小文字・数字）
  return /^[a-zA-Z0-9]{20,}$/.test(value)
}

/**
 * 文字列が TripSlug の形式に一致するかチェック
 * 
 * @param value チェックする文字列
 * @returns TripSlug の形式に一致する場合 true
 */
export function isValidTripSlug(value: string): value is TripSlug {
  // URL-safe スラッグの形式をチェック
  return /^[a-z0-9-]+$/.test(value) && value.length > 0 && value.length <= 100
}

