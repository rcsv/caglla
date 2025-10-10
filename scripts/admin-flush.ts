/**
 * Firebase Admin SDK を使用したItinerariesデータ削除スクリプト
 */

import { adminDb } from '@/lib/firebase/admin'
import logger from '@/lib/core/logger'

async function flushItinerariesWithAdmin() {
  try {
    logger.debug('🚀 Starting Itineraries data flush with Admin SDK...')
    
    if (!adminDb) {
      throw new Error('Firebase Admin SDK not initialized')
    }
    
    logger.debug('✅ Firebase Admin SDK initialized')
    
    // Itinerariesコレクションの全ドキュメントを取得
    logger.debug('📋 Fetching all itineraries...')
    const itinerariesRef = adminDb.collection('itineraries')
    const snapshot = await itinerariesRef.get()
    
    logger.debug(`📊 Found ${snapshot.docs.length} itineraries to delete`)
    
    if (snapshot.docs.length === 0) {
      logger.debug('✅ No itineraries found. Nothing to delete.')
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
    
    logger.debug('🎉 All itineraries data flushed successfully!')
    logger.debug(`📊 Total deleted: ${snapshot.docs.length} documents`)
    
  } catch (error) {
    logger.error('❌ Error flushing itineraries data:', error)
    throw error
  }
}

// スクリプト実行
flushItinerariesWithAdmin()
  .then(() => {
    logger.debug('✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    logger.error('❌ Script failed:', error)
    process.exit(1)
  })
