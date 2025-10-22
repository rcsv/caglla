/**
 * API認証ヘルパー関数
 */

import { NextRequest } from 'next/server'
import { adminAuth } from '@/lib/firebase/admin'

/**
 * Bearer tokenを検証してユーザー情報を返す
 */
export async function verifyAuthToken(request: NextRequest): Promise<{ uid: string } | null> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  try {
    const decodedToken = await adminAuth.verifyIdToken(token)
    return { uid: decodedToken.uid }
  } catch (error) {
    return null
  }
}

