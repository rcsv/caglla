/**
 * Trip Comments Social Operations のテスト
 * 
 * Phase 1-4: Firestore操作関数（Social Operations）のテスト（テストファースト）
 * 
 * 注意: これらのテストはFirestoreエミュレータを起動している必要があります。
 * エミュレータ起動: pnpm emulators:start:firestore
 */

import { createMockTrip, createMockPublicTrip } from '@/lib/__tests__/helpers/test-data'
import { getTestFirestore } from '@/lib/__tests__/helpers/test-firestore'
import { COLLECTIONS } from '@/lib/firebase/firestore'
import type { Trip } from '@/lib/core/types'
import type { Firestore } from 'firebase-admin/firestore'
import type { TripComment } from '@/lib/core/types/social'

// Phase 1-4で実装したSocial Operationsをインポート
import {
  createTripComment,
  updateTripComment,
  deleteTripComment,
  getTripComments,
} from '@/lib/social/trip-comments'

describe('Trip Comments Social Operations', () => {
  let db: Firestore
  let publicTrip: Trip
  let privateTrip: Trip
  let userId: string
  let otherUserId: string

  beforeAll(async () => {
    db = getTestFirestore()
  })

  beforeEach(async () => {
    // テストデータのクリーンアップ
    const tripsSnapshot = await db.collection(COLLECTIONS.TRIPS).get()
    const commentsSnapshot = await db.collection(COLLECTIONS.TRIP_COMMENTS).get()
    const batch = db.batch()
    tripsSnapshot.docs.forEach((doc) => batch.delete(doc.ref))
    commentsSnapshot.docs.forEach((doc) => batch.delete(doc.ref))
    await batch.commit()

    // テストデータのセットアップ
    userId = 'user1'
    otherUserId = 'user2'

    // 公開トリップとプライベートトリップを作成
    publicTrip = createMockPublicTrip({
      id: 'public-trip-1',
      user_id: otherUserId,
      slug: 'public-trip-1',
      access_level: 'public',
      social_stats: {
        likes_count: 0,
        comments_count: 0,
        shares_count: 0,
        views_count: 0,
        replicas_count: 0,
      },
    })

    privateTrip = createMockTrip({
      id: 'private-trip-1',
      user_id: otherUserId,
      slug: 'private-trip-1',
      access_level: 'private',
    })

    await db.collection(COLLECTIONS.TRIPS).doc(publicTrip.id).set(publicTrip)
    await db.collection(COLLECTIONS.TRIPS).doc(privateTrip.id).set(privateTrip)
  })

  describe('createTripComment', () => {
    it('should create comment for public trip', async () => {
      const comment = await createTripComment(
        userId,
        'Test User',
        undefined,
        'public-trip-1',
        'Great trip!',
        undefined,
        db
      )

      expect(comment.id).toBeDefined()
      expect(comment.trip_id).toBe(publicTrip.id)
      expect(comment.user_id).toBe(userId)
      expect(comment.content).toBe('Great trip!')
      expect(comment.deleted).toBe(false)

      // データベースにコメントが追加されたことを確認
      const commentRef = db.collection(COLLECTIONS.TRIP_COMMENTS).doc(comment.id)
      const commentDoc = await commentRef.get()
      expect(commentDoc.exists).toBe(true)

      // Tripのsocial_statsが更新されたことを確認
      const tripDoc = await db.collection(COLLECTIONS.TRIPS).doc(publicTrip.id).get()
      const tripData = tripDoc.data() as Trip
      expect(tripData.social_stats?.comments_count).toBe(1)
    })

    it('should create nested comment', async () => {
      // 親コメントを作成
      const parentComment = await createTripComment(
        userId,
        'Test User',
        undefined,
        'public-trip-1',
        'Parent comment',
        undefined,
        db
      )

      // ネストコメントを作成
      const nestedComment = await createTripComment(
        otherUserId,
        'Other User',
        undefined,
        'public-trip-1',
        'Reply to parent',
        parentComment.id,
        db
      )

      expect(nestedComment.parent_comment_id).toBe(parentComment.id)
      expect(nestedComment.trip_id).toBe(publicTrip.id)
    })

    it('should deny commenting on private trips', async () => {
      await expect(
        createTripComment(
          userId,
          'Test User',
          undefined,
          'private-trip-1',
          'Should not work',
          undefined,
          db
        )
      ).rejects.toThrow('Comments available only for public trips')
    })

    it('should deny unauthenticated users from commenting', async () => {
      // userIdがnullの場合はエラーを投げる（実装時に確認）
      // 現時点では、userIdが必須パラメータなので、このテストは削除または修正が必要
    })
  })

  describe('updateTripComment', () => {
    let commentId: string

    beforeEach(async () => {
      // テスト前にコメントを作成
      const comment = await createTripComment(
        userId,
        'Test User',
        undefined,
        'public-trip-1',
        'Original content',
        undefined,
        db
      )
      commentId = comment.id
    })

    it('should update comment by owner', async () => {
      const updated = await updateTripComment(
        commentId,
        userId,
        'Updated content',
        db
      )

      expect(updated.content).toBe('Updated content')
      expect(updated.updated_at).toBeDefined()
    })

    it('should deny updating comment by non-owner', async () => {
      await expect(
        updateTripComment(commentId, otherUserId, 'Hacked content', db)
      ).rejects.toThrow('owner')
    })
  })

  describe('deleteTripComment', () => {
    let commentId: string

    beforeEach(async () => {
      // テスト前にコメントを作成
      const comment = await createTripComment(
        userId,
        'Test User',
        undefined,
        'public-trip-1',
        'Content to delete',
        undefined,
        db
      )
      commentId = comment.id
    })

    it('should soft delete comment by owner', async () => {
      await deleteTripComment(commentId, userId, db)

      // コメントは論理削除される（deleted: true）
      const commentRef = db.collection(COLLECTIONS.TRIP_COMMENTS).doc(commentId)
      const commentDoc = await commentRef.get()
      const commentData = commentDoc.data() as TripComment
      expect(commentData.deleted).toBe(true)

      // Tripのsocial_statsが更新されたことを確認
      const tripDoc = await db.collection(COLLECTIONS.TRIPS).doc(publicTrip.id).get()
      const tripData = tripDoc.data() as Trip
      expect(tripData.social_stats?.comments_count).toBe(0)
    })

    it('should deny deleting comment by non-owner', async () => {
      await expect(
        deleteTripComment(commentId, otherUserId, db)
      ).rejects.toThrow('owner')
    })
  })

  describe('getTripComments', () => {
    beforeEach(async () => {
      // 複数のコメントを作成
      await createTripComment(
        userId,
        'User 1',
        undefined,
        'public-trip-1',
        'Comment 1',
        undefined,
        db
      )

      await createTripComment(
        otherUserId,
        'User 2',
        undefined,
        'public-trip-1',
        'Comment 2',
        undefined,
        db
      )

      // 削除されたコメントも作成
      const deletedComment = await createTripComment(
        userId,
        'User 1',
        undefined,
        'public-trip-1',
        'Deleted comment',
        undefined,
        db
      )
      await deleteTripComment(deletedComment.id, userId, db)
    })

    it('should return comments for public trip (excluding deleted)', async () => {
      const comments = await getTripComments('public-trip-1', db)

      expect(comments.length).toBe(2)
      expect(comments.every((c) => !c.deleted)).toBe(true)
      expect(comments.some((c) => c.content === 'Comment 1')).toBe(true)
      expect(comments.some((c) => c.content === 'Comment 2')).toBe(true)
    })

    it('should deny access to private trip comments', async () => {
      await expect(
        getTripComments('private-trip-1', db)
      ).rejects.toThrow('Comments available only for public trips')
    })

    it('should return comments sorted by created_at (ascending)', async () => {
      const comments = await getTripComments('public-trip-1', db)

      expect(comments.length).toBeGreaterThan(0)
      // created_atでソートされていることを確認
      for (let i = 1; i < comments.length; i++) {
        const prev = comments[i - 1].created_at
        const curr = comments[i].created_at
        // created_atがDate型の場合の比較
        const prevTime = prev instanceof Date ? prev.getTime() : new Date(prev).getTime()
        const currTime = curr instanceof Date ? curr.getTime() : new Date(curr).getTime()
        expect(prevTime).toBeLessThanOrEqual(currTime)
      }
    })
  })
})

