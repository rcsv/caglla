import { NextRequest, NextResponse } from 'next/server'
import { adminUserOperations } from '@/lib/firestore-admin-operations'
import { adminAuth } from '@/lib/firebase-admin'
import { generateUniqueSlug } from '@/lib/slug-utils'
import type { User } from '@/lib/firestore'

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
      preferences 
    } = body

    const userName = name || decodedToken.name || 'ユーザー'
    
    console.log('🔍 User API: Processing user update', {
      userId,
      userName,
      existingName: name,
      tokenName: decodedToken.name
    })
    
    // 既存ユーザーをチェック
    const existingUser = await adminUserOperations.getUserByGoogleId(userId)
    
    let userSlug: string
    
    if (existingUser) {
      // 既存ユーザーの場合、名前が変更されたらスラッグも再生成
      if (name && name !== existingUser.name) {
        // 名前が変更された場合は新しいスラッグを生成
        userSlug = generateUniqueSlug(userName, [])
        console.log('🔄 User API: Name changed, generating new slug', {
          oldName: existingUser.name,
          newName: userName,
          oldSlug: existingUser.slug,
          newSlug: userSlug
        })
      } else {
        // 名前が変更されていない場合は既存のスラッグを保持
        userSlug = existingUser.slug || generateUniqueSlug(userName, [])
        console.log('✅ User API: Name unchanged, keeping existing slug', {
          name: userName,
          slug: userSlug
        })
      }
    } else {
      // 新規ユーザーの場合のみスラッグを生成
      userSlug = generateUniqueSlug(userName, [])
      console.log('🆕 User API: New user, generating slug', {
        name: userName,
        slug: userSlug
      })
    }

    // Create or update user
    const userData: Omit<User, 'id' | 'created_at' | 'updated_at'> = {
      google_id: userId,
      name: userName,
      slug: userSlug,
      email: email || decodedToken.email || '',
      profile_image_url: profile_image_url || decodedToken.picture,
      preferences: preferences || {}
    }

    const user = await adminUserOperations.createOrUpdateUser(userData)
    
    console.log('💾 User API: User saved successfully', {
      userId: user.id,
      name: user.name,
      slug: user.slug
    })
    
    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error creating/updating user:', error)
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
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}
