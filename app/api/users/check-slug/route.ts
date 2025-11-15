import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/core/logger'
import { adminUserOperations } from '@/lib/firebase/admin-operation'
import { adminDb } from '@/lib/firebase/admin'
import { generateSlug } from '@/lib/utils/slug'
import { withAuth, badRequest, parseRequestBody, handleApiError } from '@/lib/core/error-handler'

export const POST = withAuth(async (request: NextRequest, auth) => {
  const { userId } = auth

  // Parse request body
  const body = await parseRequestBody<{ name?: string }>(request)
  const { name } = body

  if (!name) {
    return badRequest('Name is required')
  }

  // 既存ユーザーを取得
  const existingUser = await adminUserOperations.getUserByGoogleId(userId)
  
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
})
