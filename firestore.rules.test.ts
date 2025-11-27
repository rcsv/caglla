/**
 * Firestoreセキュリティルールのテスト
 * 
 * Phase 1-2: Firestoreスキーマ拡張とセキュリティルール（テストファースト）
 * 
 * 使用方法:
 *   1. エミュレータを起動: pnpm emulators:start:firestore
 *   2. 別のターミナルでテスト実行: pnpm test:firestore
 * 
 * 注意:
 *   - Firestoreエミュレータが起動している必要があります
 *   - エミュレータは localhost:8080 で起動します
 */

import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing'
import * as fs from 'fs'
import * as path from 'path'

let testEnv: RulesTestEnvironment | null = null

beforeAll(async () => {
  // Firestoreルールファイルを読み込む
  const rulesPath = path.join(__dirname, 'firestore.rules')
  const rules = fs.readFileSync(rulesPath, 'utf8')

  // テスト環境を初期化（エミュレータに接続）
  testEnv = await initializeTestEnvironment({
    projectId: 'test-project',
    firestore: {
      rules,
      host: 'localhost',
      port: 8080,
    },
  })
}, 30000) // 30秒のタイムアウト

afterAll(async () => {
  if (testEnv) {
    await testEnv.cleanup()
  }
})

describe('Firestore Security Rules - v3.0.0 SNS Collections', () => {
  describe('trip_likes collection', () => {
    it('should allow authenticated users to read likes for public trips', async () => {
      if (!testEnv) {
        throw new Error('Test environment not initialized')
      }

      // 1. 管理者権限で公開トリップを作成
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore()
        await adminDb.collection('trips').doc('public-trip-1').set({
          id: 'public-trip-1',
          user_id: 'user2',
          title: 'Public Trip',
          access_level: 'public',
          created_at: new Date(),
          updated_at: new Date(),
        })

        // いいねドキュメントも作成（読み取りテスト用）
        await adminDb.collection('trip_likes').doc('user1_public-trip-1').set({
          trip_id: 'public-trip-1',
          user_id: 'user1',
          created_at: new Date(),
        })
      })

      // 2. user1として認証されたコンテキストを取得
      const user1Context = testEnv.authenticatedContext('user1')

      // 3. user1が公開トリップのいいねを読めることを確認
      const user1Db = user1Context.firestore()
      const likeRef = user1Db.collection('trip_likes').doc('user1_public-trip-1')

      const likeDoc = await likeRef.get()
      expect(likeDoc.exists).toBe(true)
      expect(likeDoc.data()?.trip_id).toBe('public-trip-1')
    })

    it('should deny reading likes for private trips', async () => {
      if (!testEnv) {
        throw new Error('Test environment not initialized')
      }

      // 1. プライベートトリップを作成
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore()
        await adminDb.collection('trips').doc('private-trip-1').set({
          id: 'private-trip-1',
          user_id: 'user2',
          title: 'Private Trip',
          access_level: 'private',
          created_at: new Date(),
          updated_at: new Date(),
        })

        // いいねドキュメントも作成（読み取り拒否テスト用）
        await adminDb.collection('trip_likes').doc('user1_private-trip-1').set({
          trip_id: 'private-trip-1',
          user_id: 'user1',
          created_at: new Date(),
        })
      })

      // 2. user1がプライベートトリップのいいねを読めないことを確認
      const user1Context = testEnv.authenticatedContext('user1')
      const user1Db = user1Context.firestore()
      const likeRef = user1Db.collection('trip_likes').doc('user1_private-trip-1')

      await expect(likeRef.get()).rejects.toThrow()
    })

    it('should deny unauthenticated users from reading likes', async () => {
      if (!testEnv) {
        throw new Error('Test environment not initialized')
      }

      // 1. 公開トリップを作成
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore()
        await adminDb.collection('trips').doc('public-trip-2').set({
          id: 'public-trip-2',
          user_id: 'user2',
          title: 'Public Trip',
          access_level: 'public',
          created_at: new Date(),
          updated_at: new Date(),
        })

        await adminDb.collection('trip_likes').doc('user1_public-trip-2').set({
          trip_id: 'public-trip-2',
          user_id: 'user1',
          created_at: new Date(),
        })
      })

      // 2. 未認証ユーザーがいいねを読めないことを確認
      const unauthenticatedContext = testEnv.unauthenticatedContext()
      const unauthenticatedDb = unauthenticatedContext.firestore()
      const likeRef = unauthenticatedDb.collection('trip_likes').doc('user1_public-trip-2')

      await expect(likeRef.get()).rejects.toThrow()
    })

    it('should deny all write operations (server-managed)', async () => {
      if (!testEnv) {
        throw new Error('Test environment not initialized')
      }

      // 1. 公開トリップを作成
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore()
        await adminDb.collection('trips').doc('public-trip-3').set({
          id: 'public-trip-3',
          user_id: 'user2',
          title: 'Public Trip',
          access_level: 'public',
          created_at: new Date(),
          updated_at: new Date(),
        })
      })

      // 2. user1がいいねを作成できないことを確認（サーバー管理のため）
      const user1Context = testEnv.authenticatedContext('user1')
      const user1Db = user1Context.firestore()
      const likeRef = user1Db.collection('trip_likes').doc('user1_public-trip-3')

      await expect(
        likeRef.set({
          trip_id: 'public-trip-3',
          user_id: 'user1',
          created_at: new Date(),
        })
      ).rejects.toThrow()
    })
  })

  describe('trip_comments collection', () => {
    it('should allow authenticated users to read comments for public trips', async () => {
      if (!testEnv) {
        throw new Error('Test environment not initialized')
      }

      // 1. 公開トリップを作成
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore()
        await adminDb.collection('trips').doc('public-trip-comments-1').set({
          id: 'public-trip-comments-1',
          user_id: 'user2',
          title: 'Public Trip',
          access_level: 'public',
          created_at: new Date(),
          updated_at: new Date(),
        })

        // コメントドキュメントも作成（読み取りテスト用）
        await adminDb.collection('trip_comments').doc('comment-1').set({
          trip_id: 'public-trip-comments-1',
          user_id: 'user1',
          user_name: 'User 1',
          content: 'Great trip!',
          deleted: false,
          created_at: new Date(),
        })
      })

      // 2. user1が公開トリップのコメントを読めることを確認
      const user1Context = testEnv.authenticatedContext('user1')
      const user1Db = user1Context.firestore()
      const commentRef = user1Db.collection('trip_comments').doc('comment-1')

      const commentDoc = await commentRef.get()
      expect(commentDoc.exists).toBe(true)
      expect(commentDoc.data()?.content).toBe('Great trip!')
    })

    it('should allow authenticated users to create comments for public trips', async () => {
      if (!testEnv) {
        throw new Error('Test environment not initialized')
      }

      // 1. 公開トリップを作成
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore()
        await adminDb.collection('trips').doc('public-trip-comments-2').set({
          id: 'public-trip-comments-2',
          user_id: 'user2',
          title: 'Public Trip',
          access_level: 'public',
          created_at: new Date(),
          updated_at: new Date(),
        })
      })

      // 2. user1が公開トリップにコメントを作成できることを確認
      const user1Context = testEnv.authenticatedContext('user1')
      const user1Db = user1Context.firestore()
      const commentRef = user1Db.collection('trip_comments').doc('comment-2')

      await expect(
        commentRef.set({
          trip_id: 'public-trip-comments-2',
          user_id: 'user1',
          user_name: 'User 1',
          content: 'Great trip!',
          deleted: false,
          created_at: new Date(),
        })
      ).resolves.not.toThrow()

      // 3. 作成されたコメントが読めることを確認
      const commentDoc = await commentRef.get()
      expect(commentDoc.exists).toBe(true)
      expect(commentDoc.data()?.content).toBe('Great trip!')
    })

    it('should deny creating comments for private trips', async () => {
      if (!testEnv) {
        throw new Error('Test environment not initialized')
      }

      // 1. プライベートトリップを作成
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore()
        await adminDb.collection('trips').doc('private-trip-comments-1').set({
          id: 'private-trip-comments-1',
          user_id: 'user2',
          title: 'Private Trip',
          access_level: 'private',
          created_at: new Date(),
          updated_at: new Date(),
        })
      })

      // 2. user1がプライベートトリップにコメントを作成できないことを確認
      const user1Context = testEnv.authenticatedContext('user1')
      const user1Db = user1Context.firestore()
      const commentRef = user1Db.collection('trip_comments').doc('comment-private')

      await expect(
        commentRef.set({
          trip_id: 'private-trip-comments-1',
          user_id: 'user1',
          user_name: 'User 1',
          content: 'Great trip!',
          deleted: false,
          created_at: new Date(),
        })
      ).rejects.toThrow()
    })

    it('should deny reading deleted comments', async () => {
      if (!testEnv) {
        throw new Error('Test environment not initialized')
      }

      // 1. 論理削除されたコメントを作成
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore()
        await adminDb.collection('trips').doc('public-trip-comments-3').set({
          id: 'public-trip-comments-3',
          user_id: 'user2',
          title: 'Public Trip',
          access_level: 'public',
          created_at: new Date(),
          updated_at: new Date(),
        })

        await adminDb.collection('trip_comments').doc('deleted-comment-1').set({
          trip_id: 'public-trip-comments-3',
          user_id: 'user1',
          user_name: 'User 1',
          content: 'Deleted comment',
          deleted: true, // 論理削除
          created_at: new Date(),
        })
      })

      // 2. user1が削除されたコメントを読めないことを確認
      const user1Context = testEnv.authenticatedContext('user1')
      const user1Db = user1Context.firestore()
      const commentRef = user1Db.collection('trip_comments').doc('deleted-comment-1')

      await expect(commentRef.get()).rejects.toThrow()
    })
  })

  describe('user_follows collection', () => {
    it('should allow users to read their own follow relationships', async () => {
      if (!testEnv) {
        throw new Error('Test environment not initialized')
      }

      // 1. フォロー関係を作成
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore()
        await adminDb.collection('user_follows').doc('user1_user2').set({
          follower_id: 'user1',
          following_id: 'user2',
          created_at: new Date(),
        })
      })

      // 2. user1が自分のフォロー関係を読めることを確認
      const user1Context = testEnv.authenticatedContext('user1')
      const user1Db = user1Context.firestore()
      const followRef = user1Db.collection('user_follows').doc('user1_user2')

      const followDoc = await followRef.get()
      expect(followDoc.exists).toBe(true)
      expect(followDoc.data()?.follower_id).toBe('user1')
      expect(followDoc.data()?.following_id).toBe('user2')
    })

    it('should allow users to create follow relationships', async () => {
      if (!testEnv) {
        throw new Error('Test environment not initialized')
      }

      // 1. user1がuser3をフォローできることを確認
      // 注意: 前のテストで作成されたドキュメントを削除
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore()
        await adminDb.collection('user_follows').doc('user1_user3').delete().catch(() => {
          // 存在しない場合は無視
        })
      })

      const user1Context = testEnv.authenticatedContext('user1')
      const user1Db = user1Context.firestore()
      const followRef = user1Db.collection('user_follows').doc('user1_user3')

      // set()で新規作成（既存ドキュメントがないため、createのみチェックされる）
      await expect(
        followRef.set({
          follower_id: 'user1',
          following_id: 'user3',
          created_at: new Date(),
        })
      ).resolves.not.toThrow()

      // 2. 作成されたフォロー関係が読めることを確認
      const followDoc = await followRef.get()
      expect(followDoc.exists).toBe(true)
      expect(followDoc.data()?.follower_id).toBe('user1')
      expect(followDoc.data()?.following_id).toBe('user3')
    })

    it('should deny users from following themselves', async () => {
      if (!testEnv) {
        throw new Error('Test environment not initialized')
      }

      // 1. user1が自分自身をフォローできないことを確認
      const user1Context = testEnv.authenticatedContext('user1')
      const user1Db = user1Context.firestore()
      const followRef = user1Db.collection('user_follows').doc('user1_user1')

      await expect(
        followRef.set({
          follower_id: 'user1',
          following_id: 'user1', // 自分自身
          created_at: new Date(),
        })
      ).rejects.toThrow()
    })

    it('should allow users to delete their own follow relationships', async () => {
      if (!testEnv) {
        throw new Error('Test environment not initialized')
      }

      // 1. フォロー関係を作成
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore()
        await adminDb.collection('user_follows').doc('user1_user4').set({
          follower_id: 'user1',
          following_id: 'user4',
          created_at: new Date(),
        })
      })

      // 2. user1がフォロー解除できることを確認
      const user1Context = testEnv.authenticatedContext('user1')
      const user1Db = user1Context.firestore()
      const followRef = user1Db.collection('user_follows').doc('user1_user4')

      await expect(followRef.delete()).resolves.not.toThrow()

      // 3. 削除されたことを確認
      const followDoc = await followRef.get()
      expect(followDoc.exists).toBe(false)
    })

    it('should deny users from deleting other users follow relationships', async () => {
      if (!testEnv) {
        throw new Error('Test environment not initialized')
      }

      // 1. user2がuser3をフォローする関係を作成
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore()
        await adminDb.collection('user_follows').doc('user2_user3').set({
          follower_id: 'user2',
          following_id: 'user3',
          created_at: new Date(),
        })
      })

      // 2. user1がuser2のフォロー関係を削除できないことを確認
      const user1Context = testEnv.authenticatedContext('user1')
      const user1Db = user1Context.firestore()
      const followRef = user1Db.collection('user_follows').doc('user2_user3')

      await expect(followRef.delete()).rejects.toThrow()
    })
  })
})
