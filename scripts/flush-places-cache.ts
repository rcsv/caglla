/**
 * Places Cache Flush Script
 * 
 * 既存のPlaces Cacheを削除して、vicinityを含む新しいデータを再取得できるようにします。
 */

import { adminDb } from '@/lib/firebase/admin'
import logger from '@/lib/core/logger'

async function flushPlacesCache() {
  try {
    logger.debug('🚀 Starting Places Cache flush...')
    
    if (!adminDb) {
      throw new Error('Firebase Admin SDK not initialized')
    }
    
    logger.debug('✅ Firebase Admin SDK initialized')
    
    // Places Cacheコレクションの全ドキュメントを取得
    logger.debug('📋 Fetching all places cache...')
    const placesCacheRef = adminDb.collection('places_cache')
    const snapshot = await placesCacheRef.get()
    
    logger.debug(`📊 Found ${snapshot.docs.length} places cache entries to delete`)
    
    if (snapshot.docs.length === 0) {
      logger.debug('✅ No places cache found. Nothing to delete.')
      return
    }
    
    // バッチ削除（500件ずつ）
    const batchSize = 500
    let deletedCount = 0
    
    for (let i = 0; i < snapshot.docs.length; i += batchSize) {
      const batch = adminDb.batch()
      const batchDocs = snapshot.docs.slice(i, i + batchSize)
      
      batchDocs.forEach((doc: any) => {
        batch.delete(doc.ref)
      })
      
      await batch.commit()
      deletedCount += batchDocs.length
      logger.debug(`✅ Deleted batch: ${deletedCount}/${snapshot.docs.length} documents`)
    }
    
    logger.debug('🎉 All places cache flushed successfully!')
    logger.debug(`📊 Total deleted: ${snapshot.docs.length} documents`)
    
  } catch (error) {
    logger.error('❌ Error flushing places cache:', error)
    throw error
  }
}

// スクリプト実行
flushPlacesCache()
  .then(() => {
    logger.debug('✅ Places cache flush completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    logger.error('❌ Places cache flush failed:', error)
    process.exit(1)
  })
