#!/usr/bin/env tsx
/**
 * Places Cache Cleanup Script
 * 
 * 古いキャッシュエントリを削除する（TTL管理）
 * 
 * 実行方法:
 *   npx tsx scripts/cleanup-old-cache.ts
 * 
 * オプション:
 *   --dry-run: 実際には削除せずにログのみ出力
 *   --days <number>: 削除対象の経過日数（デフォルト: 30日）
 *   --batch-size <number>: 一度に削除する件数（デフォルト: 1000）
 * 
 * 注意: Google Places API利用規約により、すべてのデータは30日以内のキャッシュのみ許可
 */

import { db } from '../lib/firebase/admin'
import logger from '../lib/core/logger'

const PLACES_CACHE_COLLECTION = 'places_cache'

interface CleanupOptions {
  dryRun: boolean
  days: number
  batchSize: number
}

interface CleanupStats {
  total: number
  deleted: number
  startTime: Date
}

/**
 * コマンドライン引数をパース
 * 
 * Google Places API利用規約: すべてのデータは30日以内のキャッシュのみ許可
 * デフォルトは30日に設定
 */
function parseArgs(): CleanupOptions {
  const args = process.argv.slice(2)
  const options: CleanupOptions = {
    dryRun: args.includes('--dry-run'),
    days: 30,  // Google利用規約準拠（30日）
    batchSize: 1000
  }
  
  const daysIndex = args.indexOf('--days')
  if (daysIndex !== -1 && args[daysIndex + 1]) {
    options.days = parseInt(args[daysIndex + 1], 10)
  }
  
  const batchIndex = args.indexOf('--batch-size')
  if (batchIndex !== -1 && args[batchIndex + 1]) {
    options.batchSize = parseInt(args[batchIndex + 1], 10)
  }
  
  return options
}

/**
 * 古いキャッシュを削除
 */
async function cleanupOldCache(options: CleanupOptions): Promise<void> {
  const stats: CleanupStats = {
    total: 0,
    deleted: 0,
    startTime: new Date()
  }
  
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - options.days)
  
  logger.info('Starting cleanup', {
    dryRun: options.dryRun,
    days: options.days,
    cutoffDate: cutoffDate.toISOString(),
    batchSize: options.batchSize
  })
  
  while (true) {
    // 古いエントリを取得
    const snapshot = await db.collection(PLACES_CACHE_COLLECTION)
      .where('last_accessed', '<', cutoffDate)
      .limit(options.batchSize)
      .get()
    
    if (snapshot.empty) {
      logger.info('No more old cache entries to delete')
      break
    }
    
    stats.total += snapshot.size
    
    if (options.dryRun) {
      logger.info('[DRY RUN] Would delete:', {
        count: snapshot.size,
        sampleIds: snapshot.docs.slice(0, 5).map(doc => doc.id)
      })
      stats.deleted += snapshot.size
      break // Dry runでは一度だけ実行
    } else {
      // バッチ削除
      const batch = db.batch()
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref)
      })
      
      await batch.commit()
      stats.deleted += snapshot.size
      
      logger.info('Batch deleted', {
        count: snapshot.size,
        totalDeleted: stats.deleted
      })
    }
    
    // レート制限回避のため小休止
    await sleep(1000)
  }
  
  // 最終統計
  const endTime = new Date()
  const durationMs = endTime.getTime() - stats.startTime.getTime()
  
  logger.info('Cleanup completed', {
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
    logger.info('Places Cache Cleanup')
    logger.info('='.repeat(80))
    
    if (options.dryRun) {
      logger.warn('🔍 DRY RUN MODE: No changes will be made')
    } else {
      logger.warn('⚠️  PRODUCTION MODE: Old cache entries will be deleted')
      logger.info('Starting in 5 seconds... (Press Ctrl+C to cancel)')
      await sleep(5000)
    }
    
    await cleanupOldCache(options)
    
    logger.info('Cleanup script completed successfully')
    process.exit(0)
  } catch (error) {
    logger.error('Cleanup script failed:', error)
    process.exit(1)
  }
}

// スクリプトとして実行された場合のみ main() を呼ぶ
if (require.main === module) {
  main()
}

export { cleanupOldCache, CleanupOptions }

