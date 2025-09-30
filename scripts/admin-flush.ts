/**
 * Firebase Admin SDK を使用したItinerariesデータ削除スクリプト
 */

import { adminDb } from '../lib/firebase-admin'

async function flushItinerariesWithAdmin() {
  try {
    console.log('🚀 Starting Itineraries data flush with Admin SDK...')
    
    if (!adminDb) {
      throw new Error('Firebase Admin SDK not initialized')
    }
    
    console.log('✅ Firebase Admin SDK initialized')
    
    // Itinerariesコレクションの全ドキュメントを取得
    console.log('📋 Fetching all itineraries...')
    const itinerariesRef = adminDb.collection('itineraries')
    const snapshot = await itinerariesRef.get()
    
    console.log(`📊 Found ${snapshot.docs.length} itineraries to delete`)
    
    if (snapshot.docs.length === 0) {
      console.log('✅ No itineraries found. Nothing to delete.')
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
      console.log(`✅ Deleted batch: ${deletedCount}/${snapshot.docs.length} documents`)
    }
    
    console.log('🎉 All itineraries data flushed successfully!')
    console.log(`📊 Total deleted: ${snapshot.docs.length} documents`)
    
  } catch (error) {
    console.error('❌ Error flushing itineraries data:', error)
    throw error
  }
}

// スクリプト実行
flushItinerariesWithAdmin()
  .then(() => {
    console.log('✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
