import { NextRequest, NextResponse } from 'next/server'
import { adminUserOperations } from '@/lib/firebase/admin-operation'
import { adminAuth } from '@/lib/firebase/admin'
import logger from '@/lib/core/logger'

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
    
  } catch (error) {
    logger.error('Error during user data migration', error)
    return NextResponse.json(
      { error: 'Failed to migrate user data' },
      { status: 500 }
    )
  }
}

