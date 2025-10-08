#!/usr/bin/env tsx

/**
 * ユーザーデータ移行スクリプト
 * 
 * このスクリプトは以下の処理を行います：
 * 1. preferences内の重複するnameフィールドを削除
 * 2. ユーザードキュメント直下のnameフィールドを正しい値に統一
 * 3. データの整合性を確保
 */

import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, collection, getDocs, doc, updateDoc, deleteField } from 'firebase/firestore'

// 環境変数を直接読み込み
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Firebase初期化
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const db = getFirestore(app)

interface UserDocument {
  id: string
  name: string
  preferences?: {
    name?: string
    [key: string]: any
  }
  [key: string]: any
}

async function migrateUserData() {
  console.log('🚀 ユーザーデータ移行を開始します...')
  
  try {
    // 全ユーザーを取得
    const usersSnapshot = await getDocs(collection(db, 'users'))
    const users: UserDocument[] = []
    
    usersSnapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        ...doc.data()
      } as UserDocument)
    })
    
    console.log(`📊 ${users.length}件のユーザーが見つかりました`)
    
    let processedCount = 0
    let errorCount = 0
    
    for (const user of users) {
      try {
        console.log(`\n👤 ユーザー処理中: ${user.id}`)
        console.log(`   現在のname: ${user.name}`)
        
        const updateData: any = {}
        let needsUpdate = false
        
        // preferences内のnameフィールドをチェック
        if (user.preferences?.name) {
          console.log(`   preferences.name: ${user.preferences.name}`)
          
          // preferences内のnameがドキュメント直下のnameと異なる場合
          if (user.preferences.name !== user.name) {
            console.log(`   ⚠️  nameの不整合を検出`)
            
            // preferences内のnameを優先（より詳細な情報の可能性）
            if (user.preferences.name.length > user.name.length) {
              updateData.name = user.preferences.name
              console.log(`   ✅ preferences.nameを採用: ${user.preferences.name}`)
            } else {
              console.log(`   ✅ 既存のnameを維持: ${user.name}`)
            }
            needsUpdate = true
          }
          
          // preferences内のnameフィールドを削除
          updateData['preferences.name'] = deleteField()
          needsUpdate = true
        }
        
        if (needsUpdate) {
          await updateDoc(doc(db, 'users', user.id), updateData)
          console.log(`   ✅ 更新完了`)
          processedCount++
        } else {
          console.log(`   ℹ️  更新不要`)
        }
        
      } catch (error) {
        console.error(`   ❌ エラー: ${error}`)
        errorCount++
      }
    }
    
    console.log(`\n📈 移行完了:`)
    console.log(`   - 処理済み: ${processedCount}件`)
    console.log(`   - エラー: ${errorCount}件`)
    console.log(`   - 総数: ${users.length}件`)
    
  } catch (error) {
    console.error('❌ 移行中にエラーが発生しました:', error)
    process.exit(1)
  }
}

// スクリプト実行
if (require.main === module) {
  migrateUserData()
    .then(() => {
      console.log('🎉 移行が正常に完了しました')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 移行に失敗しました:', error)
      process.exit(1)
    })
}

export { migrateUserData }
