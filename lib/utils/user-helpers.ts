/**
 * ユーザー関連のヘルパー関数
 * 
 * フォールバック処理を一箇所に集約し、コンポーネントの再利用性とテスト容易性を向上
 */

import type { User } from '@/lib/core/types'

/**
 * Firebase Auth User型（簡易版）
 */
interface FirebaseUser {
  email?: string | null
  photoURL?: string | null
}

/**
 * プラン設定型（簡易版）
 */
interface PlanConfig {
  name?: string
}

/**
 * ユーザーの表示名を取得（フォールバック処理付き）
 * 
 * @param userData - Firestoreから取得したUserデータ
 * @param fallbackUser - Firebase AuthのUserデータ（オプショナル）
 * @returns 表示名（userData.name → fallbackUser.email → 'User'）
 */
export function getUserDisplayName(
  userData?: User | null,
  fallbackUser?: FirebaseUser | null
): string {
  return userData?.name ?? fallbackUser?.email ?? 'User'
}

/**
 * プランの表示名を取得（フォールバック処理付き）
 * 
 * @param planConfig - プラン設定オブジェクト
 * @returns プラン名（planConfig.name → 'Season Traveler'）
 */
export function getPlanDisplayName(planConfig?: PlanConfig | null): string {
  return planConfig?.name ?? 'Season Traveler'
}

/**
 * ユーザーのアバターURLを取得（フォールバック処理付き）
 * 
 * @param userData - Firestoreから取得したUserデータ
 * @param fallbackUser - Firebase AuthのUserデータ（オプショナル）
 * @returns アバターURL（userData.profile_image_url → fallbackUser.photoURL → null）
 */
export function getUserAvatarUrl(
  userData?: User | null,
  fallbackUser?: FirebaseUser | null
): string | null {
  return userData?.profile_image_url ?? fallbackUser?.photoURL ?? null
}

