import { NextRequest, NextResponse } from 'next/server'
import { adminUserOperations } from '@/lib/firestore-admin-operations'
import { adminAuth } from '@/lib/firebase-admin'
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

    // Create or update user
    const userData: Omit<User, 'id' | 'created_at' | 'updated_at'> = {
      google_id: userId,
      name: name || decodedToken.name || 'ユーザー',
      email: email || decodedToken.email || '',
      profile_image_url: profile_image_url || decodedToken.picture,
      preferences: preferences || {}
    }

    const user = await adminUserOperations.createOrUpdateUser(userData)
    
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
