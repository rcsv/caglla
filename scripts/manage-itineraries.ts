/**
 * Firestore Itineraries Data Management Script
 * 
 * Itinerariesデータの管理用スクリプト
 * - データの確認
 * - バックアップ
 * - 削除
 */

import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, collection, getDocs, doc, deleteDoc, writeBatch, query, orderBy, limit } from 'firebase/firestore'
import { validateServerEnvironment } from '../lib/env-validation'
import fs from 'fs'
import path from 'path'

// Firebase設定
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

class ItinerariesManager {
  private db: any

  constructor() {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
    this.db = getFirestore(app)
  }

  /**
   * Itinerariesデータの統計を取得
   */
  async getStatistics() {
    try {
      console.log('📊 Getting itineraries statistics...')
      
      const itinerariesRef = collection(this.db, 'itineraries')
      const snapshot = await getDocs(itinerariesRef)
      
      const stats = {
        totalCount: snapshot.docs.length,
        withPlaceData: 0,
        withoutPlaceData: 0,
        withPlaceId: 0,
        withoutPlaceId: 0,
        sampleData: [] as any[]
      }
      
      snapshot.docs.forEach((doc, index) => {
        const data = doc.data()
        
        if (data.place_id || data.place_data) {
          stats.withPlaceData++
        } else {
          stats.withoutPlaceData++
        }
        
        if (data.place_id || data.place_data?.place_id) {
          stats.withPlaceId++
        } else {
          stats.withoutPlaceId++
        }
        
        // 最初の5件をサンプルとして保存
        if (index < 5) {
          stats.sampleData.push({
            id: doc.id,
            title: data.title,
            hasPlaceData: !!data.place_data,
            hasPlaceId: !!data.place_data?.place_id,
            createdAt: data.created_at
          })
        }
      })
      
      return stats
    } catch (error) {
      console.error('❌ Error getting statistics:', error)
      throw error
    }
  }

  /**
   * Itinerariesデータをバックアップ
   */
  async backupData(outputPath: string = './backup') {
    try {
      console.log('💾 Creating backup...')
      
      const itinerariesRef = collection(this.db, 'itineraries')
      const snapshot = await getDocs(itinerariesRef)
      
      const backupData = {
        timestamp: new Date().toISOString(),
        totalCount: snapshot.docs.length,
        data: snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      }
      
      // バックアップディレクトリを作成
      if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true })
      }
      
      const filename = `itineraries-backup-${new Date().toISOString().split('T')[0]}.json`
      const filepath = path.join(outputPath, filename)
      
      fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2))
      
      console.log(`✅ Backup created: ${filepath}`)
      console.log(`📊 Backed up ${backupData.totalCount} documents`)
      
      return filepath
    } catch (error) {
      console.error('❌ Error creating backup:', error)
      throw error
    }
  }

  /**
   * Itinerariesデータを削除
   */
  async deleteAllData(confirm: boolean = false) {
    if (!confirm) {
      console.log('⚠️  This will delete ALL itineraries data!')
      console.log('⚠️  Make sure you have a backup before proceeding.')
      console.log('⚠️  To confirm, call deleteAllData(true)')
      return
    }

    try {
      console.log('🗑️  Deleting all itineraries data...')
      
      const itinerariesRef = collection(this.db, 'itineraries')
      const snapshot = await getDocs(itinerariesRef)
      
      console.log(`📊 Found ${snapshot.docs.length} documents to delete`)
      
      if (snapshot.docs.length === 0) {
        console.log('✅ No documents found. Nothing to delete.')
        return
      }
      
      // バッチ削除
      const batchSize = 500
      const batches = []
      let currentBatch = writeBatch(this.db)
      
      for (let i = 0; i < snapshot.docs.length; i++) {
        const docRef = snapshot.docs[i].ref
        currentBatch.delete(docRef)
        
        if ((i + 1) % batchSize === 0) {
          batches.push(currentBatch)
          currentBatch = writeBatch(this.db)
        }
      }
      
      if ((currentBatch as any)._mutations.length > 0) {
        batches.push(currentBatch)
      }
      
      console.log(`🔄 Executing ${batches.length} batches...`)
      
      for (let i = 0; i < batches.length; i++) {
        await batches[i].commit()
        console.log(`✅ Batch ${i + 1}/${batches.length} completed`)
      }
      
      console.log('🎉 All itineraries data deleted successfully!')
      
    } catch (error) {
      console.error('❌ Error deleting data:', error)
      throw error
    }
  }

  /**
   * 特定の条件でデータを削除
   */
  async deleteByCondition(condition: (data: any) => boolean, confirm: boolean = false) {
    if (!confirm) {
      console.log('⚠️  This will delete itineraries matching the condition!')
      console.log('⚠️  To confirm, call deleteByCondition(condition, true)')
      return
    }

    try {
      console.log('🗑️  Deleting itineraries by condition...')
      
      const itinerariesRef = collection(this.db, 'itineraries')
      const snapshot = await getDocs(itinerariesRef)
      
      const docsToDelete = snapshot.docs.filter(doc => condition(doc.data()))
      
      console.log(`📊 Found ${docsToDelete.length} documents matching condition`)
      
      if (docsToDelete.length === 0) {
        console.log('✅ No documents match the condition.')
        return
      }
      
      // バッチ削除
      const batchSize = 500
      const batches = []
      let currentBatch = writeBatch(this.db)
      
      for (let i = 0; i < docsToDelete.length; i++) {
        const docRef = docsToDelete[i].ref
        currentBatch.delete(docRef)
        
        if ((i + 1) % batchSize === 0) {
          batches.push(currentBatch)
          currentBatch = writeBatch(this.db)
        }
      }
      
      if ((currentBatch as any)._mutations.length > 0) {
        batches.push(currentBatch)
      }
      
      console.log(`🔄 Executing ${batches.length} batches...`)
      
      for (let i = 0; i < batches.length; i++) {
        await batches[i].commit()
        console.log(`✅ Batch ${i + 1}/${batches.length} completed`)
      }
      
      console.log('🎉 Conditional deletion completed successfully!')
      
    } catch (error) {
      console.error('❌ Error deleting data by condition:', error)
      throw error
    }
  }
}

// 使用例
async function main() {
  try {
    const manager = new ItinerariesManager()
    
    // 統計を取得
    const stats = await manager.getStatistics()
    console.log('📊 Statistics:', stats)
    
    // バックアップを作成
    const backupPath = await manager.backupData()
    console.log(`💾 Backup created at: ${backupPath}`)
    
    // 確認後、全データを削除
    // await manager.deleteAllData(true)
    
    // または、特定の条件で削除
    // await manager.deleteByCondition(data => !data.place_data?.place_id, true)
    
  } catch (error) {
    console.error('❌ Main execution failed:', error)
  }
}

// スクリプト実行
if (require.main === module) {
  main()
}

export { ItinerariesManager }
