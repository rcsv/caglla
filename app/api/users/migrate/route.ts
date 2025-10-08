import { NextRequest, NextResponse } from 'next/server'
import { adminUserOperations } from '@/lib/firestore-admin-operations'
import { adminAuth } from '@/lib/firebase-admin'

export async function POST(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
    }

    const idToken = authHeader.split('Bearer ')[1]
    
    // Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    const userId = decodedToken.uid

    console.log('🚀 ユーザーデータ移行を開始します...')
    
    // 全ユーザーを取得
    const users = await adminUserOperations.getAllUsers()
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
          const { name, ...preferencesWithoutName } = user.preferences
          updateData.preferences = preferencesWithoutName
          needsUpdate = true
        }
        
        if (needsUpdate) {
          await adminUserOperations.updateUser(user.id, updateData)
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
    
    return NextResponse.json({ 
      success: true,
      processed: processedCount,
      errors: errorCount,
      total: users.length
    })
    
  } catch (error) {
    console.error('❌ 移行中にエラーが発生しました:', error)
    return NextResponse.json(
      { error: 'Failed to migrate user data' },
      { status: 500 }
    )
  }
}

