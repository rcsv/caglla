/**
 * Simple Itineraries Data Flush Script
 */

import { initializeApp, getApps } from 'firebase/app'
import logger from '@/lib/core/logger'
import { getFirestore, collection, getDocs, writeBatch } from 'firebase/firestore'

// Firebase設定
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

async function flushItineraries() {
  try {
    logger.debug('🚀 Starting Itineraries data flush...')
    
    // Firebase初期化
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
    const db = getFirestore(app)
    logger.debug('✅ Firebase initialized')
    
    // Itinerariesコレクションの全ドキュメントを取得
    logger.debug('📋 Fetching all itineraries...')
    const itinerariesRef = collection(db, 'itineraries')
    const snapshot = await getDocs(itinerariesRef)
    
    logger.debug(`📊 Found ${snapshot.docs.length} itineraries to delete`)
    
    if (snapshot.docs.length === 0) {
      logger.debug('✅ No itineraries found. Nothing to delete.')
      return
    }
    
    // バッチ削除（500件ずつ）
    const batchSize = 500
    const batches = []
    let currentBatch = writeBatch(db)
    
    for (let i = 0; i < snapshot.docs.length; i++) {
      const docRef = snapshot.docs[i].ref
      currentBatch.delete(docRef)
      
      // バッチサイズに達したら新しいバッチを作成
      if ((i + 1) % batchSize === 0) {
        batches.push(currentBatch)
        currentBatch = writeBatch(db)
        logger.debug(`📦 Prepared batch ${batches.length} (${batchSize} documents)`)
      }
    }
    
    // 最後のバッチを追加
    if ((currentBatch as any)._mutations.length > 0) {
      batches.push(currentBatch)
      logger.debug(`📦 Prepared final batch ${batches.length} (${(currentBatch as any)._mutations.length} documents)`)
    }
    
    logger.debug(`🔄 Executing ${batches.length} batches...`)
    
    // バッチを順次実行
    for (let i = 0; i < batches.length; i++) {
      try {
        await batches[i].commit()
        logger.debug(`✅ Batch ${i + 1}/${batches.length} completed`)
      } catch (error) {
        logger.error(`❌ Error in batch ${i + 1}:`, error)
        throw error
      }
    }
    
    logger.debug('🎉 All itineraries data flushed successfully!')
    logger.debug(`📊 Total deleted: ${snapshot.docs.length} documents`)
    
  } catch (error) {
    logger.error('❌ Error flushing itineraries data:', error)
    throw error
  }
}

// スクリプト実行
flushItineraries()
  .then(() => {
    logger.debug('✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    logger.error('❌ Script failed:', error)
    process.exit(1)
  })
