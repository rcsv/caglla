/**
 * Trip Comments Social Operations
 * 
 * Phase 1-4: Firestore操作関数（Social Operations）
 * 
 * コメント機能のFirestore操作を提供します。
 * トランザクションを使用して、コメントの作成・更新・削除とsocial_statsの更新を原子性を保って実行します。
 */

import { FieldValue } from 'firebase-admin/firestore'
import type { Firestore } from 'firebase-admin/firestore'
import { COLLECTIONS } from '@/lib/firebase/firestore'
import { asUserId, asTripId } from '@/lib/core/types/identity'
import { canCommentOnTrip } from '@/lib/core/permissions'
import logger from '@/lib/core/logger'
import type { Trip } from '@/lib/core/types'
import type { TripComment } from '@/lib/core/types/social'
import { getTestFirestore } from '@/lib/__tests__/helpers/test-firestore'
import { convertStandardDates } from '@/lib/firebase/timestamp-utils'

// テスト環境ではテスト用のFirestoreを使用、本番環境ではadminDbを使用
function getFirestore(db?: Firestore): Firestore {
  if (db) return db
  // テスト環境の場合
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    return getTestFirestore()
  }
  // 本番環境の場合（lazy importでadminDbを読み込む）
  try {
    const adminModule = require('@/lib/firebase/admin')
    return adminModule.adminDb
  } catch (error) {
    throw new Error('Firebase Admin SDK is not available. Provide a Firestore instance as the last parameter.')
  }
}

/**
 * Tripを解決する（adminTripOperationsの代わりに、テスト環境でも使用可能な関数）
 */
async function resolveTripByIdOrSlug(
  idOrSlug: string,
  db: Firestore
): Promise<{ id: string; trip: Trip } | null> {
  // Try as document ID
  const byId = await db.collection(COLLECTIONS.TRIPS).doc(idOrSlug).get()
  if (byId.exists) {
    const tripData = convertStandardDates({
      id: byId.id,
      ...byId.data(),
    }) as Trip
    return { id: byId.id, trip: tripData }
  }

  // Fallback to slug query
  const bySlugSnap = await db
    .collection(COLLECTIONS.TRIPS)
    .where('slug', '==', idOrSlug)
    .limit(1)
    .get()

  if (bySlugSnap.empty) return null

  const docSnap = bySlugSnap.docs[0]
  const tripData = convertStandardDates({
    id: docSnap.id,
    ...docSnap.data(),
  }) as Trip
  return { id: docSnap.id, trip: tripData }
}

/**
 * コメントを作成します
 * 
 * @param userId - コメントするユーザーID
 * @param userName - ユーザー名
 * @param userAvatar - ユーザーアバターURL（オプション）
 * @param tripSlug - トリップのslug（またはID）
 * @param content - コメント内容
 * @param parentCommentId - 親コメントID（ネストコメントの場合）
 * @param db - Firestoreインスタンス（テスト環境で使用、省略可）
 * @returns 作成されたコメント
 * @throws トリップが見つからない、権限がないなどのエラー
 */
export async function createTripComment(
  userId: string,
  userName: string,
  userAvatar: string | undefined,
  tripSlug: string,
  content: string,
  parentCommentId: string | undefined,
  db?: Firestore
): Promise<TripComment> {
  const firestore = getFirestore(db)

  // 1. Tripを解決
  const resolved = await resolveTripByIdOrSlug(tripSlug, firestore)
  if (!resolved) {
    throw new Error('Trip not found')
  }

  const { id: tripId, trip } = resolved

  // 2. 権限チェック
  const userIdTyped = asUserId(userId)
  if (!canCommentOnTrip(trip, userIdTyped)) {
    throw new Error('Comments available only for public trips')
  }

  // 3. 親コメントの存在確認（ネストコメントの場合）
  if (parentCommentId) {
    const parentCommentRef = firestore
      .collection(COLLECTIONS.TRIP_COMMENTS)
      .doc(parentCommentId)
    const parentCommentDoc = await parentCommentRef.get()

    if (!parentCommentDoc.exists) {
      throw new Error('Parent comment not found')
    }

    const parentCommentData = parentCommentDoc.data() as TripComment
    if (parentCommentData.trip_id !== tripId) {
      throw new Error('Parent comment does not belong to this trip')
    }
    if (parentCommentData.deleted) {
      throw new Error('Cannot reply to deleted comment')
    }
  }

  // 4. トランザクションでコメントを作成
  const commentId = firestore.collection(COLLECTIONS.TRIP_COMMENTS).doc().id
  const commentRef = firestore.collection(COLLECTIONS.TRIP_COMMENTS).doc(commentId)
  const tripRef = firestore.collection(COLLECTIONS.TRIPS).doc(tripId)

  const result = await firestore.runTransaction(async (tx) => {
    const tripSnap = await tx.get(tripRef)

    if (!tripSnap.exists) {
      throw new Error('Trip not found during transaction')
    }

    const now = new Date()
    // undefinedのフィールドは除外（Firestoreではundefinedは保存できない）
    const commentData: Omit<TripComment, 'id'> & { user_avatar?: string; parent_comment_id?: string } = {
      trip_id: tripId,
      user_id: userId,
      user_name: userName,
      content: content.trim(),
      created_at: now,
      updated_at: now,
      deleted: false,
      likes_count: 0, // 初期値として0を設定
    }

    // オプションフィールドを条件付きで追加
    if (userAvatar !== undefined) {
      commentData.user_avatar = userAvatar
    }
    if (parentCommentId !== undefined) {
      commentData.parent_comment_id = parentCommentId
    }

    // コメントを作成
    tx.set(commentRef, commentData)

    // social_statsを更新
    tx.update(tripRef, {
      'social_stats.comments_count': FieldValue.increment(1),
    })

    return {
      id: commentId,
      ...commentData,
    } as TripComment
  })

  logger.debug('Trip comment created', {
    userId,
    tripSlug,
    commentId,
    parentCommentId,
  })

  return result
}

/**
 * コメントを更新します
 * 
 * @param commentId - コメントID
 * @param userId - ユーザーID（所有者のみ更新可能）
 * @param content - 新しいコメント内容
 * @param db - Firestoreインスタンス（テスト環境で使用、省略可）
 * @returns 更新されたコメント
 * @throws コメントが見つからない、権限がないなどのエラー
 */
export async function updateTripComment(
  commentId: string,
  userId: string,
  content: string,
  db?: Firestore
): Promise<TripComment> {
  const firestore = getFirestore(db)

  const commentRef = firestore.collection(COLLECTIONS.TRIP_COMMENTS).doc(commentId)

  const result = await firestore.runTransaction(async (tx) => {
    const commentSnap = await tx.get(commentRef)

    if (!commentSnap.exists) {
      throw new Error('Comment not found')
    }

    const commentData = commentSnap.data() as TripComment

    // 権限チェック（所有者のみ更新可能）
    const userIdTyped = asUserId(userId)
    const commentUserIdTyped = asUserId(commentData.user_id)
    if (userIdTyped !== commentUserIdTyped) {
      throw new Error('Only comment owner can update')
    }

    // 削除されたコメントは更新不可
    if (commentData.deleted) {
      throw new Error('Cannot update deleted comment')
    }

    const now = new Date()
    const updatedData: Partial<TripComment> = {
      content: content.trim(),
      updated_at: now,
    }

    // コメントを更新
    tx.update(commentRef, updatedData)

    return {
      ...commentData,
      ...updatedData,
    } as TripComment
  })

  logger.debug('Trip comment updated', {
    userId,
    commentId,
  })

  return result
}

/**
 * コメントを論理削除します
 * 
 * @param commentId - コメントID
 * @param userId - ユーザーID（所有者のみ削除可能）
 * @param db - Firestoreインスタンス（テスト環境で使用、省略可）
 * @throws コメントが見つからない、権限がないなどのエラー
 */
export async function deleteTripComment(
  commentId: string,
  userId: string,
  db?: Firestore
): Promise<void> {
  const firestore = getFirestore(db)

  const commentRef = firestore.collection(COLLECTIONS.TRIP_COMMENTS).doc(commentId)

  await firestore.runTransaction(async (tx) => {
    const commentSnap = await tx.get(commentRef)

    if (!commentSnap.exists) {
      throw new Error('Comment not found')
    }

    const commentData = commentSnap.data() as TripComment

    // 権限チェック（所有者のみ削除可能）
    const userIdTyped = asUserId(userId)
    const commentUserIdTyped = asUserId(commentData.user_id)
    if (userIdTyped !== commentUserIdTyped) {
      throw new Error('Only comment owner can delete')
    }

    // 既に削除されている場合は何もしない
    if (commentData.deleted) {
      return
    }

    const tripRef = firestore.collection(COLLECTIONS.TRIPS).doc(commentData.trip_id)

    // コメントを論理削除
    tx.update(commentRef, {
      deleted: true,
      updated_at: new Date(),
    })

    // social_statsを更新
    tx.update(tripRef, {
      'social_stats.comments_count': FieldValue.increment(-1),
    })
  })

  logger.debug('Trip comment deleted', {
    userId,
    commentId,
  })
}

/**
 * トリップのコメント一覧を取得します
 * 
 * @param tripSlug - トリップのslug（またはID）
 * @param db - Firestoreインスタンス（テスト環境で使用、省略可）
 * @returns コメント一覧（削除済みを除外、created_atでソート）
 * @throws トリップが見つからない、プライベートトリップなどのエラー
 */
export async function getTripComments(
  tripSlug: string,
  db?: Firestore
): Promise<TripComment[]> {
  const firestore = getFirestore(db)

  // 1. Tripを解決
  const resolved = await resolveTripByIdOrSlug(tripSlug, firestore)
  if (!resolved) {
    throw new Error('Trip not found')
  }

  const { id: tripId, trip } = resolved

  // 2. 権限チェック（プライベートトリップは閲覧不可）
  if (trip.access_level !== 'public') {
    throw new Error('Comments available only for public trips')
  }

  // 3. コメント一覧を取得（削除済みを除外、created_atでソート）
  const commentsSnapshot = await firestore
    .collection(COLLECTIONS.TRIP_COMMENTS)
    .where('trip_id', '==', tripId)
    .where('deleted', '==', false)
    .orderBy('created_at', 'asc')
    .get()

  const comments: TripComment[] = commentsSnapshot.docs.map((doc) => {
    const data = convertStandardDates({
      id: doc.id,
      ...doc.data(),
    }) as TripComment
    // likes_countが存在しない場合は0として扱う
    if (data.likes_count === undefined) {
      data.likes_count = 0
    }
    return data
  })

  return comments
}

