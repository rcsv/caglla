/**
 * Userデータマイグレーション: google_id → auth_uid
 * 
 * Phase 1-1.5: 認証プロバイダーマルチ対応化（v3.0.0）
 * 
 * 既存の`google_id`を`auth_uid`にコピーするスクリプト
 * - 既存のユーザーの`google_id`を`auth_uid`にコピー
 * - `auth_uid`が既に存在する場合はスキップ
 * 
 * 使用方法:
 *   1. 環境変数を設定（FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY）
 *   2. スクリプト実行: pnpm ts-node scripts/migrate-auth-uid.ts
 *   3. ドライラン: pnpm ts-node scripts/migrate-auth-uid.ts --dry-run
 */

import { COLLECTIONS } from '@/lib/firebase/firestore'
import type { User } from '@/lib/core/types'
import logger from '@/lib/core/logger'
import type { Firestore } from 'firebase-admin/firestore'

// 環境変数がない場合でも動くように、遅延インポートを使用
let adminDb: Firestore | null = null
function getAdminDb(): Firestore {
  if (!adminDb) {
    try {
      // 環境変数がある場合のみadminDbをインポート
      const adminModule = require('@/lib/firebase/admin')
      adminDb = adminModule.adminDb
    } catch (error) {
      // テスト環境では環境変数がない場合があるため、エラーを無視
      logger.error('Failed to import adminDb', error)
      throw new Error('Firebase Admin SDK not available. Please set environment variables.')
    }
  }
  return adminDb
}

async function migrateAuthUid(dryRun: boolean = false) {
  try {
    logger.info('Starting auth_uid migration', { dryRun })
    
    const db = getAdminDb()
    const usersRef = db.collection(COLLECTIONS.USERS)
    const snapshot = await usersRef.get()
    
    if (snapshot.empty) {
      logger.info('No users found to migrate')
      return
    }
    
    const batch = db.batch()
    let count = 0
    let skipped = 0
    
    snapshot.docs.forEach((doc) => {
      const user = doc.data() as User
      
      // auth_uid が既に存在する場合はスキップ
      if (user.auth_uid) {
        skipped++
        logger.debug('User already has auth_uid', { userId: doc.id, authUid: user.auth_uid })
        return
      }
      
      // google_id が存在しない場合はスキップ（エラーケース）
      if (!user.google_id) {
        skipped++
        logger.warn('User has no google_id or auth_uid', { userId: doc.id })
        return
      }
      
      // auth_uid が存在しない場合、google_id をコピー
      if (dryRun) {
        logger.info('Would migrate user', {
          userId: doc.id,
          googleId: user.google_id,
          wouldSetAuthUid: user.google_id
        })
        count++
      } else {
        batch.update(doc.ref, {
          auth_uid: user.google_id
        })
        count++
        logger.debug('Added user to migration batch', {
          userId: doc.id,
          googleId: user.google_id
        })
      }
    })
    
    if (!dryRun && count > 0) {
      await batch.commit()
      logger.info('Migration completed successfully', { migratedCount: count, skippedCount: skipped })
    } else if (dryRun) {
      logger.info('Dry run completed', { wouldMigrateCount: count, skippedCount: skipped })
    } else {
      logger.info('No users to migrate', { skippedCount: skipped })
    }
  } catch (error) {
    logger.error('Migration failed', error)
    throw error
  }
}

// コマンドライン引数を解析
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')

// スクリプト実行
migrateAuthUid(dryRun)
  .then(() => {
    logger.info('Migration script completed')
    process.exit(0)
  })
  .catch((error) => {
    logger.error('Migration script failed', error)
    process.exit(1)
  })

