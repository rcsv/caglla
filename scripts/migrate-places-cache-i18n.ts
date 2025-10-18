#!/usr/bin/env tsx
/**
 * Places Cache i18n Migration Script
 * 
 * 既存の places_cache ドキュメントを言語対応版にマイグレーション
 * 
 * 実行方法:
 *   npx tsx scripts/migrate-places-cache-i18n.ts
 * 
 * オプション:
 *   --dry-run: 実際には書き込まずにログのみ出力
 *   --limit <number>: 処理する件数の上限
 *   --batch-size <number>: バッチサイズ（デフォルト: 500）
 */

import { db } from '../lib/firebase/admin'
import { getCacheKey, DEFAULT_LANGUAGE } from '../lib/utils/language'
import logger from '../lib/core/logger'

const PLACES_CACHE_COLLECTION = 'places_cache'
const MIGRATION_FAILURES_COLLECTION = 'migration_failures'
const CACHE_FORMAT_VERSION = '2.0.0'

interface MigrationOptions {
  dryRun: boolean
  limit?: number
  batchSize: number
}

interface MigrationStats {
  total: number
  success: number
  failed: number
  skipped: number
  startTime: Date
}

/**
 * コマンドライン引数をパース
 */
function parseArgs(): MigrationOptions {
  const args = process.argv.slice(2)
  const options: MigrationOptions = {
    dryRun: args.includes('--dry-run'),
    batchSize: 500
  }
  
  const limitIndex = args.indexOf('--limit')
  if (limitIndex !== -1 && args[limitIndex + 1]) {
    options.limit = parseInt(args[limitIndex + 1], 10)
  }
  
  const batchIndex = args.indexOf('--batch-size')
  if (batchIndex !== -1 && args[batchIndex + 1]) {
    options.batchSize = parseInt(args[batchIndex + 1], 10)
  }
  
  return options
}

/**
 * マイグレーション失敗を記録
 */
async function logMigrationFailure(
  docId: string,
  error: any,
  dryRun: boolean
): Promise<void> {
  if (dryRun) {
    logger.warn('[DRY RUN] Would log migration failure:', { docId, error: error.message })
    return
  }
  
  try {
    await db.collection(MIGRATION_FAILURES_COLLECTION).add({
      doc_id: docId,
      error_message: error.message,
      error_stack: error.stack,
      timestamp: new Date()
    })
  } catch (logError) {
    logger.error('Failed to log migration failure:', logError)
  }
}

/**
 * 単一ドキュメントをマイグレーション
 */
async function migrateDocument(
  docId: string,
  docData: any,
  batch: FirebaseFirestore.WriteBatch,
  options: MigrationOptions
): Promise<{ success: boolean; reason?: string }> {
  try {
    // 既に言語サフィックスがある場合はスキップ
    if (docId.includes('_')) {
      const parts = docId.split('_')
      const lastPart = parts[parts.length - 1]
      // 2文字の言語コードっぽい場合はスキップ
      if (lastPart.length === 2) {
        return { success: false, reason: 'already_migrated' }
      }
    }
    
    // format_version が 2.0.0 の場合はスキップ
    if (docData.format_version === CACHE_FORMAT_VERSION) {
      return { success: false, reason: 'already_migrated' }
    }
    
    // 新しいID（デフォルト言語を追加）
    const newId = getCacheKey(docId, DEFAULT_LANGUAGE)
    
    if (options.dryRun) {
      logger.info('[DRY RUN] Would migrate:', {
        oldId: docId,
        newId: newId,
        language: DEFAULT_LANGUAGE
      })
      return { success: true }
    }
    
    // 新しいドキュメントを作成
    const newDocRef = db.collection(PLACES_CACHE_COLLECTION).doc(newId)
    batch.set(newDocRef, {
      ...docData,
      place_id: docId,  // 元のplace_idを保持
      language: DEFAULT_LANGUAGE,
      format_version: CACHE_FORMAT_VERSION,
      migrated_at: new Date(),
      migrated_from: docId
    })
    
    // 古いドキュメントを削除
    const oldDocRef = db.collection(PLACES_CACHE_COLLECTION).doc(docId)
    batch.delete(oldDocRef)
    
    return { success: true }
  } catch (error) {
    logger.error('Error migrating document:', { docId, error })
    await logMigrationFailure(docId, error, options.dryRun)
    return { success: false, reason: 'error' }
  }
}

/**
 * メインマイグレーション処理
 */
async function migratePlacesCacheToI18n(options: MigrationOptions): Promise<void> {
  const stats: MigrationStats = {
    total: 0,
    success: 0,
    failed: 0,
    skipped: 0,
    startTime: new Date()
  }
  
  logger.info('Starting migration', {
    dryRun: options.dryRun,
    limit: options.limit,
    batchSize: options.batchSize
  })
  
  let lastDoc: FirebaseFirestore.DocumentSnapshot | null = null
  let processedCount = 0
  
  while (true) {
    // クエリを構築
    let query = db.collection(PLACES_CACHE_COLLECTION)
      .orderBy('__name__')
      .limit(options.batchSize)
    
    if (lastDoc) {
      query = query.startAfter(lastDoc)
    }
    
    const snapshot = await query.get()
    
    if (snapshot.empty) {
      logger.info('No more documents to process')
      break
    }
    
    // バッチ処理
    const batch = db.batch()
    let batchCount = 0
    
    for (const doc of snapshot.docs) {
      // limit チェック
      if (options.limit && processedCount >= options.limit) {
        logger.info('Reached limit, stopping', { limit: options.limit })
        break
      }
      
      const result = await migrateDocument(doc.id, doc.data(), batch, options)
      
      stats.total++
      processedCount++
      
      if (result.success) {
        stats.success++
        batchCount++
      } else if (result.reason === 'already_migrated') {
        stats.skipped++
      } else {
        stats.failed++
      }
      
      // 進捗表示（100件ごと）
      if (stats.total % 100 === 0) {
        logger.info('Migration progress', {
          total: stats.total,
          success: stats.success,
          failed: stats.failed,
          skipped: stats.skipped
        })
      }
    }
    
    // バッチをコミット
    if (batchCount > 0 && !options.dryRun) {
      await batch.commit()
      logger.info('Batch committed', { count: batchCount })
    }
    
    lastDoc = snapshot.docs[snapshot.docs.length - 1]
    
    // limit チェック
    if (options.limit && processedCount >= options.limit) {
      break
    }
    
    // レート制限回避のため小休止
    await sleep(1000)
  }
  
  // 最終統計
  const endTime = new Date()
  const durationMs = endTime.getTime() - stats.startTime.getTime()
  
  logger.info('Migration completed', {
    ...stats,
    durationMs,
    durationMinutes: (durationMs / 1000 / 60).toFixed(2)
  })
  
  if (options.dryRun) {
    logger.warn('⚠️  DRY RUN MODE: No changes were made to the database')
  }
}

/**
 * スリープ関数
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * メイン実行
 */
async function main() {
  try {
    const options = parseArgs()
    
    logger.info('='.repeat(80))
    logger.info('Places Cache i18n Migration')
    logger.info('='.repeat(80))
    
    if (options.dryRun) {
      logger.warn('🔍 DRY RUN MODE: No changes will be made')
    } else {
      logger.warn('⚠️  PRODUCTION MODE: Changes will be made to the database')
      logger.warn('⚠️  Make sure you have a backup before proceeding!')
      
      // 5秒待機（Ctrl+C でキャンセル可能）
      logger.info('Starting in 5 seconds... (Press Ctrl+C to cancel)')
      await sleep(5000)
    }
    
    await migratePlacesCacheToI18n(options)
    
    logger.info('Migration script completed successfully')
    process.exit(0)
  } catch (error) {
    logger.error('Migration script failed:', error)
    process.exit(1)
  }
}

// スクリプトとして実行された場合のみ main() を呼ぶ
if (require.main === module) {
  main()
}

export { migratePlacesCacheToI18n, MigrationOptions }

