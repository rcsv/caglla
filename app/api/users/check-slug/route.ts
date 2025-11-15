import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/core/logger'
import { adminUserOperations } from '@/lib/firebase/admin-operation'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import { generateSlug } from '@/lib/utils/slug'

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
    const { name } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // 既存ユーザーを取得（auth_uid で検索、後方互換性のため google_id もチェック）
    // Phase 1-1.5: 認証プロバイダーマルチ対応化
    const existingUser = await adminUserOperations.getUserByAuthUid(userId)
    
    // 名前からスラッグを生成
    const newSlug = generateSlug(name)
    
    // 既存ユーザーのスラッグと比較
    if (existingUser && existingUser.slug === newSlug) {
      // 同じスラッグの場合は重複なし
      return NextResponse.json({ 
        isAvailable: true, 
        slug: newSlug,
        message: 'この名前は使用可能です' 
      })
    }

    // 他のユーザーで同じスラッグが使用されているかチェック
    const usersSnapshot = await adminDb.collection('users')
      .where('slug', '==', newSlug)
      .get()

    const isAvailable = usersSnapshot.empty

    return NextResponse.json({ 
      isAvailable, 
      slug: newSlug,
      message: isAvailable 
        ? 'この名前は使用可能です' 
        : 'この名前は既に使用されています。別の名前を試してください。'
    })
  } catch (error) {
    logger.error('Error checking slug availability:', error)
    return NextResponse.json(
      { error: 'Failed to check slug availability' },
      { status: 500 }
    )
  }
}
