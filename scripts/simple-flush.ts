/**
 * Simple Itineraries Data Flush Script
 */

import { initializeApp, getApps } from 'firebase/app'
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
    console.log('🚀 Starting Itineraries data flush...')
    
    // Firebase初期化
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
    const db = getFirestore(app)
    console.log('✅ Firebase initialized')
    
    // Itinerariesコレクションの全ドキュメントを取得
    console.log('📋 Fetching all itineraries...')
    const itinerariesRef = collection(db, 'itineraries')
    const snapshot = await getDocs(itinerariesRef)
    
    console.log(`📊 Found ${snapshot.docs.length} itineraries to delete`)
    
    if (snapshot.docs.length === 0) {
      console.log('✅ No itineraries found. Nothing to delete.')
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
        console.log(`📦 Prepared batch ${batches.length} (${batchSize} documents)`)
      }
    }
    
    // 最後のバッチを追加
    if ((currentBatch as any)._mutations.length > 0) {
      batches.push(currentBatch)
      console.log(`📦 Prepared final batch ${batches.length} (${(currentBatch as any)._mutations.length} documents)`)
    }
    
    console.log(`🔄 Executing ${batches.length} batches...`)
    
    // バッチを順次実行
    for (let i = 0; i < batches.length; i++) {
      try {
        await batches[i].commit()
        console.log(`✅ Batch ${i + 1}/${batches.length} completed`)
      } catch (error) {
        console.error(`❌ Error in batch ${i + 1}:`, error)
        throw error
      }
    }
    
    console.log('🎉 All itineraries data flushed successfully!')
    console.log(`📊 Total deleted: ${snapshot.docs.length} documents`)
    
  } catch (error) {
    console.error('❌ Error flushing itineraries data:', error)
    throw error
  }
}

// スクリプト実行
flushItineraries()
  .then(() => {
    console.log('✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
