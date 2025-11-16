import { NextRequest, NextResponse } from 'next/server'
import { adminUserOperations } from '@/lib/firebase/admin-operation'
import logger from '@/lib/core/logger'
import { authApi } from '@/lib/api/middleware'

export const POST = authApi(async (request: NextRequest, ctx) => {
  // ctx.auth が保証されている（authApi プリセットが認証チェックを実行）
  const { userId } = ctx.auth!

    logger.info('Starting user data migration')
    
    // 全ユーザーを取得
    const users = await adminUserOperations.getAllUsers()
    logger.info('Users found for migration', { userCount: users.length })
    
    let processedCount = 0
    let errorCount = 0
    
    for (const user of users) {
      try {
        logger.debug('Processing user', { userId: user.id, name: user.name })
        
        const updateData: any = {}
        let needsUpdate = false
        
        // preferences内のnameフィールドをチェック
        if (user.preferences?.name) {
          logger.debug('Found name in preferences', { 
            userId: user.id,
            preferencesName: user.preferences.name 
          })
          
          // preferences内のnameがドキュメント直下のnameと異なる場合
          if (user.preferences.name !== user.name) {
            logger.debug('Name inconsistency detected', { userId: user.id })
            
            // preferences内のnameを優先（より詳細な情報の可能性）
            if (user.preferences.name.length > user.name.length) {
              updateData.name = user.preferences.name
              logger.debug('Adopting preferences.name', { 
                userId: user.id,
                newName: user.preferences.name 
              })
            } else {
              logger.debug('Keeping existing name', { userId: user.id })
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
          logger.debug('User updated', { userId: user.id })
          processedCount++
        } else {
          logger.debug('No update needed', { userId: user.id })
        }
        
      } catch (error) {
        logger.error('Error processing user', error, { userId: user.id })
        errorCount++
      }
    }
    
    logger.info('Migration completed', {
      processed: processedCount,
      errors: errorCount,
      total: users.length
    })
    
  return NextResponse.json({ 
    success: true,
    processed: processedCount,
    errors: errorCount,
    total: users.length
  })
})

