/**
 * 旅行所有権チェックヘルパー
 * 
 * trip.user_id と userId (Firebase Auth UID) の比較をサポート
 */

import { adminUserOperations } from '@/lib/firebase/admin-operation'
import logger from '@/lib/core/logger'
import type { Trip } from '@/lib/core/types'

/**
 * 旅行の所有権をチェック
 * 
 * @param trip - チェック対象の旅行
 * @param authUid - Firebase Auth UID (google_id)
 * @returns 所有権がある場合 true
 */
export async function checkTripOwnership(trip: Trip, authUid: string): Promise<boolean> {
  logger.debug('Checking trip ownership', {
    tripId: trip.id,
    tripUserId: trip.user_id,
    authUid,
  })

  // trip.user_id が users コレクションのドキュメントIDの場合
  // 直接比較
  if (trip.user_id === authUid) {
    logger.debug('Trip ownership: direct match', { tripUserId: trip.user_id, authUid })
    return true
  }

  // trip.user_id が users コレクションのドキュメントIDの場合、
  // そのユーザーの auth_uid または google_id を確認
  try {
    const user = await adminUserOperations.getUserByAuthUid(authUid)
    if (user) {
      logger.debug('Resolved user from authUid', {
        userId: user.id,
        userAuthUid: user.auth_uid,
        userGoogleId: user.google_id,
        tripUserId: trip.user_id,
      })
      if (user.id === trip.user_id) {
        logger.debug('Trip ownership: user.id matches trip.user_id', {
          userId: user.id,
          tripUserId: trip.user_id,
        })
        return true
      }
    } else {
      logger.warn('User not found by authUid', { authUid })
    }
  } catch (error) {
    logger.error('Error checking trip ownership', { error, tripId: trip.id, authUid })
  }

  // 後方互換性: trip.user_id が google_id の場合
  // ユーザードキュメントを直接取得して確認
  try {
    const userDoc = await adminUserOperations.getUserByAuthUid(trip.user_id)
    if (userDoc) {
      logger.debug('Resolved user from trip.user_id (fallback)', {
        userId: userDoc.id,
        userAuthUid: userDoc.auth_uid,
        userGoogleId: userDoc.google_id,
        authUid,
      })
      if (userDoc.auth_uid === authUid || userDoc.google_id === authUid) {
        logger.debug('Trip ownership: fallback match', {
          userAuthUid: userDoc.auth_uid,
          userGoogleId: userDoc.google_id,
          authUid,
        })
        return true
      }
    } else {
      logger.warn('User not found by trip.user_id (fallback)', { tripUserId: trip.user_id })
    }
  } catch (error) {
    logger.error('Error checking trip ownership (fallback)', { error, tripId: trip.id, authUid })
  }

  logger.warn('Trip ownership check failed', {
    tripId: trip.id,
    tripUserId: trip.user_id,
    authUid,
  })
  return false
}

