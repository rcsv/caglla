import { NextRequest, NextResponse } from 'next/server'
import { adminUserOperations } from '@/lib/firebase/admin-operation'
import { adminAuth } from '@/lib/firebase/admin'
import { generateUniqueSlug } from '@/lib/utils/slug'
import type { User } from '@/lib/core/types'
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

    // Parse request body
    const body = await request.json()
    const { 
      name, 
      email, 
      profile_image_url, 
      bio,
      gender,
      preferences 
    } = body

    // 既存ユーザーをチェック
    const existingUser = await adminUserOperations.getUserByGoogleId(userId)
    
    let userData: Omit<User, 'id' | 'created_at' | 'updated_at'>
    
    if (existingUser) {
      // 既存ユーザーの場合：Google情報は参照せず、既存データを保持
      // 名前が明示的に変更された場合のみ更新
      let userName = existingUser.name
      let userSlug = existingUser.slug
      
      if (name && name !== existingUser.name) {
        userName = name
        userSlug = generateUniqueSlug(name, [])
        logger.debug('User name changed, generating new slug', {
          oldName: existingUser.name,
          newName: userName,
          oldSlug: existingUser.slug,
          newSlug: userSlug
        })
      } else {
        logger.debug('Existing user, keeping current data', {
          name: userName,
          slug: userSlug
        })
      }
      
      userData = {
        google_id: userId,
        name: userName,
        slug: userSlug,
        email: existingUser.email, // 既存のemailを保持
        profile_image_url: profile_image_url || existingUser.profile_image_url, // 画像更新を許可
        bio: bio !== undefined ? bio : existingUser.bio, // bio更新を許可
        gender: gender !== undefined ? gender : existingUser.gender, // gender更新を許可
        preferences: preferences || existingUser.preferences || {}
      }
    } else {
      // 新規ユーザーの場合のみ：Google情報を使用
      const userName = name || decodedToken.name || 'ユーザー'
      const userSlug = generateUniqueSlug(userName, [])
      
      logger.debug('New user, using Google info', {
        name: userName,
        email: decodedToken.email,
        slug: userSlug
      })
      
      userData = {
        google_id: userId,
        name: userName,
        slug: userSlug,
        email: email || decodedToken.email || '',
        profile_image_url: profile_image_url || decodedToken.picture,
        bio: bio || '',
        gender: gender || 'prefer_not_to_say',
        preferences: preferences || {},
        planId: 'season_traveler' // 新規ユーザーはデフォルトで無料プラン
      }
    }

    const user = await adminUserOperations.createOrUpdateUser(userData)
    
    logger.info('User saved successfully', {
      userId: user.id,
      name: user.name,
      slug: user.slug
    })
    
    return NextResponse.json({ user })
  } catch (error) {
    logger.error('Error creating/updating user', error)
    return NextResponse.json(
      { error: 'Failed to create/update user' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
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

    // Get user data
    const user = await adminUserOperations.getUserByGoogleId(userId)
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    return NextResponse.json({ user })
  } catch (error) {
    logger.error('Error fetching user', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}
